# B0 Realm, Admission, Finality, and Reconstruction
**Stage A chapter — post-red-team revision; not landed, adopts nothing.**

Lane 4 of the Stage A B0 baseline. Covers V2-E5 in full: RealmDescriptor/1 and
registry-free bootstrap, RealmId/RealmRevisionId formulas, the
deployment/profile-confusion attack, qualifying-Realm assumptions (replacing
dead-chain machinery per the PM directive), AdmissionReceipt/1 with the
one-EVM-call atomic boundary, the admission/finality-observation split, upgrade
history rules, and the independent state-only reconstruction walk.
Traceability anchors: V2-E5 (owner-decision-inbox.md:47-52, VERIFIED);
constitution Realm-descriptor open question (system-constitution.md:353-354,
VERIFIED); candidate Realm/receipt sketches (core-architecture-candidate.md:
48-66, 192-210, VERIFIED); PM Stage A directive (verbatim file, VERIFIED).

Dependencies on sibling chapters are declared inline and collected under
`## Interfaces exposed`. All IDs follow the SR-1 two-level discipline
[PROPOSAL — SR-1 pin]: `DOM_X = keccak256("efs2/<name>/<version>")`
(printable ASCII; the closed domain table lives in the encoding chapter §1.3
and, post-repair, contains every domain string minted in this chapter);
preimage = `abi.encode(DOM_X, …fields)` with every field a fixed-width word
and any variable-length or structured component entering as its own
`keccak256` hash (exactly one nesting level); id = `keccak256(preimage)`.
This chapter's earlier raw-ASCII-prefix skeleton
(`id = keccak256(ascii-tag ‖ canonicalPreimage)`) is retired under SR-1
[REJECTED — retired form; every §2/§5 formula below is the regenerated one].

---

## 1. Chain reference: facts, evaluation, and the pinned encoding

### 1.1 Standards FACTS (distinguish from EFS POLICY)

- CAIP-2 (`namespace:reference`, e.g. `eip155:1`) is a finalized CASA
  standard; CAIP-10 extends it to accounts. [standards FACT — VERIFIED via
  intake audit STANDARDS lane finding 15, which web-verified CASA status
  2026-08-12]
- ERC-7930 "Interoperable Addresses" defines a binary
  chain-type + chain-reference + address encoding and is in **Review** status
  (not Final) as of 2026-08 [standards FACT — VERIFIED via STANDARDS lane
  finding 15]. Its exact field widths are not restated here: Review documents
  churn, so any byte-layout claim is PLAUSIBLE until re-fetched.
- EIP-155 chainId is an unbounded unsigned integer; uint256 holds every
  legal value. [standards FACT — PLAUSIBLE from general knowledge; harmless
  if wrong low, since uint256 is the ceiling]

### 1.2 Evaluation and pinned bytes

CAIP-2 strings in hash preimages carry variable length, case, and
normalization hazards; ERC-7930 bytes are variable-length (length-prefixed
fields) and Review-status. Both violate the Stage A preimage rule (fixed-width
abi.encode words). Therefore:

**ChainRef/1** [POLICY — EFS-native encoding, pinned in the Codex; CAIP-2/10
is the human projection; an ERC-7930 projection may be added if/when 7930 goes
Final]:

```text
ChainRef/1 = (bytes8 chainNamespace, bytes32 chainReference)

chainNamespace  = ASCII CAIP-2 namespace, left-aligned, zero right-padded.
                  For EVM Realms: 0x6569703135350000 ("eip155").
chainReference  = namespace-defined 32-byte value.
                  For eip155: uint256 chainId as one big-endian ABI word.
Preimage form   = abi.encode(chainNamespace, chainReference)  // 64 bytes
```

Non-`eip155` namespaces are reserved; B0 defines only `eip155`
[PROPOSAL — B0 is EVM-native; other namespaces are additive profile work].
Because `chainNamespace` is the CAIP-2 namespace verbatim, projection to
CAIP-2 text is lossless for eip155 (`"eip155:" + decimal(chainId)`).

---

## 2. RealmDescriptor/1 — registry-free bootstrap object

A Realm is one independently ordered Core deployment and policy domain
[DERIVED INVARIANT — core-architecture-candidate.md:48-66; constitution
"Realm, policy, and basis qualify admission" system-constitution.md:106-108].
The descriptor is the self-contained object a direct client needs to open a
fresh qualifying L3 with **no global registry** [OWNER RULING — 2026-08-12,
owner-rulings.md:186-192: a Realm or fresh L3 must be useful "without Commons,
a canonical EFS chain, or EFS OS"].

### 2.1 Field set

Three strictly separated sections [PROPOSAL — separation is the
confusion-attack defense; §3 gives the rationale]:

```text
RealmDescriptor/1
  A. IDENTITY CORE (all five fields enter the RealmId preimage; all are
     immutable by construction)
     chainNamespace     bytes8    ChainRef/1
     chainReference     bytes32   ChainRef/1
     coreAddress        address   the one atomic Core contract (B0 axis 6)
     profileId          bytes32   semantics-contract identifier (§2.3)
     genesisCommitment  bytes32   deployment commitment (§2.4)

  B. REALM-DECLARED CURRENT FACTS (advisory copies of state readable from
     Core; the on-chain reads are authoritative, the descriptor copy is a
     hint that MUST be re-verified)
     currentRevisionOrdinal  uint32
     finalityRuleKind        uint8     (§6.1 table)
     upgradeAuthorityKind    uint8     (0=NONE/immutable, 1=PROXY_ADMIN_EOA,
                                        2=PROXY_ADMIN_CONTRACT, 3=GOVERNANCE,
                                        4-255 reserved)

  C. ADVISORY TRANSPORT HINTS (untrusted; MUST NOT enter any preimage;
     MUST NOT be treated as evidence)
     rpcUrls[]        UTF-8 strings
     displayName      UTF-8 string
```

Canonical descriptor bytes [PROPOSAL]: section A+B as
`abi.encode(uint16 version=1, chainNamespace, chainReference, coreAddress,
profileId, genesisCommitment, currentRevisionOrdinal, finalityRuleKind,
upgradeAuthorityKind)`; section C appended as an ABI-encoded
`(string[] rpcUrls, string displayName)` tail. The descriptor itself has no
EFS identity; **RealmId is the identity** and is recomputable from section A
alone. Signing or notarizing descriptors is application-level evidence, not a
Core mechanism [PROPOSAL — keeps Core registry-free].

### 2.2 RealmId — exact formula

```text
DOM_REALM = keccak256("efs2/realm/1")                  // closed-table entry

RealmId = keccak256(abi.encode(
    DOM_REALM,
    chainNamespace,                                    // bytes8 → 32-byte word
    chainReference,                                    // bytes32
    coreAddress,                                       // address → 32-byte word
    profileId,                                         // bytes32
    genesisCommitment))                                // bytes32; 192-byte preimage
```
[PROPOSAL — regenerated field-for-field under SR-1, no structural change;
keccak256 is the EFS-native hash, EVM-cheapest. The raw-ASCII-prefix form
`keccak256("efs2/realm/1" ‖ abi.encode(…))` is retired (SR-1).]

Properties the formula buys (each is a defense, see §3): same Core bytecode at
the same CREATE2 address on two chains → two RealmIds (chainRef differs);
same chain, redeployed Core → two RealmIds (genesisCommitment differs); same
deployment claiming a different semantics profile → two RealmIds (profileId
differs).

### 2.3 profileId — exact formula

```text
DOM_PROFILE = keccak256("efs2/profile/1")

profileId = keccak256(abi.encode(
    DOM_PROFILE,
    uint16 protocolMajor,                  // B0 = 0 (pre-freeze)
    uint16 protocolMinor,
    bytes32 codexConstantsHash))           // owned by the encoding chapter
```
[PROPOSAL — regenerated field-for-field under SR-1. Per SR-16 the encoding
chapter owns the `codexConstantsHash` definition — the hash over the full
ordered table of domain constants, codec versions, and bound constants — and
the state-readable `codexConstants()`; this chapter consumes both here, in
§2.4, and in §8.2, and requires that the hash cover every constant named in
this chapter. DEPENDS-ON: encoding chapter (SR-16).]

### 2.4 genesisCommitment — exact formula

```text
DOM_REALM_GENESIS = keccak256("efs2/realmgenesis/1")

genesisCommitment = keccak256(abi.encode(
    DOM_REALM_GENESIS,
    bytes32 deployCodehash,   // EXTCODEHASH of the Core account (or
                              // implementation, §7.1) at the end of the
                              // initialize() block
    uint48  deployBlock,      // block.number of initialize()
    bytes32 codexConstantsHash,
    bytes32 initConfigHash))  // hash of initialize() parameters
```
[PROPOSAL — regenerated field-for-field under SR-1.]
Core computes `genesisCommitment` and `RealmId` once inside
`initialize()` (reading `block.chainid` itself for chainReference) and stores
them; clients recompute both off-chain from `genesisFacts()` (§8.2) — the
client's own recomputation, not the stored mirror, is the check.

### 2.5 RealmRevisionId — exact formula (SR-16)

```text
DOM_REALM_REVISION = keccak256("efs2/realm-revision/1")

revisionDescriptorBytes =                      // owned by THIS chapter (SR-16)
  abi.encode(uint32  revisionOrdinal,          // 1-based, append-only
             bytes32 implementationCodehash,   // EXTCODEHASH after activation
             bytes32 policyCommitment,         // hash of the active admission
                                               // policy parameter set (§7.2)
             uint48  activatedAtBlock)

RealmRevisionId = keccak256(abi.encode(
    DOM_REALM_REVISION,
    realmId,
    keccak256(revisionDescriptorBytes)))       // structured component enters
                                               // pre-hashed (SR-1)
```
[PROPOSAL — the SR-16 pinned outer formula, set-wide; this chapter owns
`revisionDescriptorBytes` and its field list above. Superseded arms, kept as
sketches [REJECTED — pre-SR-16]: (a) this chapter's earlier inline
five-field preimage under the retired spelling `"efs2/realmrev/1"`; (b) the
encoding chapter's `(DOM_REALMREV, realmId, uint256 generation,
keccak256(revisionDescriptorBytes))` row — its `generation` word is
subsumed by `revisionOrdinal` inside the descriptor.]
Revision 1 is written by `initialize()` with
`implementationCodehash = deployCodehash`.

---

## 3. The deployment/profile-confusion attack and the descriptor's defense

Attack surface [PROPOSAL — threat enumeration; the red team should extend]:

- **A-1 wrong-chain descriptor.** Same `coreAddress` exists on another chain
  (CREATE/CREATE2 addresses collide across chains); a descriptor or link
  points the client at the wrong chain's contract.
- **A-2 lookalike Core.** A contract at the named address implements the ABI
  but subtly different canonicalization/ID rules, so its state decodes as
  plausible EFS data with wrong identities.
- **A-3 profile spoof.** A genuine-looking Core claims a profile it does not
  implement (different codec constants).
- **A-4 descriptor substitution.** A man-in-the-middle rewrites section A of
  a descriptor in transit.
- **A-5 lying endpoint.** The RPC endpoint (possibly from section C hints)
  answers with fabricated state.
- **A-6 upgrade smuggling.** An upgradeable Realm's authority activates a
  semantics-breaking implementation while keeping RealmId (§7 U-3 violation).

Defense: the checks a client **MUST** perform before presenting any state of
a Realm as admitted EFS data [PROPOSAL — normative client conformance list;
each check names the attack it defeats]:

```text
C-1 CHAIN     eth_chainId == uint256(chainReference); namespace == "eip155".
              (defeats A-1)
C-2 GENESIS   fetch genesisFacts(); recompute genesisCommitment (§2.4) and
              compare to descriptor section A.               (defeats A-2/A-4)
C-3 REALM-ID  recompute RealmId (§2.2) from section A; compare with
              core.realmId() AND with any externally supplied RealmId (from
              the EFS link, receipt, or citation that led here). (A-2/A-4)
C-4 PROFILE   client supports profileId; on mismatch the client MUST return
              UNSUPPORTED_PROFILE and MUST NOT best-effort-decode. (A-3)
C-5 REVISION  revisionCount >= 1; activatedAtBlock strictly increasing;
              currentRevision().implementationCodehash ==
              EXTCODEHASH(implementation account per declared
              upgradeAuthorityKind pattern).                  (A-2/A-6 partial)
C-6 SEMANTIC  if admissionCount > 0: fetch one admitted envelope's canonical
              bytes, recompute EnvelopeId and each leaf RecordId, and compare
              with the state mappings (§8). A canonicalization lookalike
              fails here even with a copied genesis struct.   (A-2/A-3)
C-7 HONESTY   all of C-1..C-6 are only as strong as the endpoint's answers.
              A client either (a) cross-checks >= 2 independent endpoints,
              (b) verifies eth_getProof against a block hash it trusts, or
              (c) labels the session basis "single-endpoint, unproven" in the
              result model. Silence about (c) is non-conformant. (A-5)
              [DERIVED INVARIANT — constitution honest-reads block,
              system-constitution.md:205-213; kickoff "Do not present endpoint
              responses as cryptographic proof" kickoff:108-111]
```

Residual risk stated honestly: for `upgradeAuthorityKind != NONE`, C-5/C-6
detect drift but cannot prevent a malicious authority appending its own
revision (A-6). Upgradeability is therefore a **declared trust dimension**
graded by the reader's Lens, not silently safe [PROPOSAL — see §7;
system-constitution.md:216-220]. The trust root of the whole scheme is
possession of the right RealmId (or right section A), exactly as a chain's
trust root is its genesis hash — obtaining it out-of-band is above Core; the
descriptor's job is that *whatever* RealmId you hold is mechanically checkable
against the Realm you reached.

---

## 4. Qualifying-Realm assumptions (replaces dead-chain machinery)

PM directive, binding: "Do not reopen broad dead-chain survival machinery.
Define qualifying-Realm assumptions and honest behavior when a source basis is
unavailable" (pm-stage-a-directive.md:22, VERIFIED). Owner background: the
2026-07-10 chains-don't-die ruling (owner-rulings.md:11-16, VERIFIED) was
scoped to a home-chain world; the intake RULINGS lane flagged its per-Realm
scope as unowned. This section is **designed to work under either answer**:
persistence is a *named qualifying assumption* per Realm, and the failure of
that assumption has defined honest behavior (§4.2), so the architecture
proceeds identically whether or not any particular L3 in fact persists. The
per-Realm scope of chains-don't-die is nevertheless a **candidate owner
decision**, surfaced to James **only** through proposed spine-edit A2 at
Stage A review — not asked mid-pass, and B0 does not block on the answer
[PROPOSAL — the single set-wide disposition; the overview §5 item 1 and the
corpus spine-edits doc carry the same routing].

### 4.1 The assumption set QR-1..QR-8

A chain qualifies to host a Realm iff all of the following hold. Each is an
assumption the Realm's operator asserts by deploying and the client relies on
when grading that Realm's answers as authoritative [PROPOSAL — the set;
individual items cite their sources]:

- **QR-1 PERSISTENT-QUERYABLE-STATE.** The chain persists indefinitely and
  its current contract state stays queryable. [DERIVED INVARIANT — extends
  the 2026-07-10 owner ruling (owner-rulings.md:11) from the home-chain frame
  to a per-Realm qualifying assumption; the extension itself is the PM-directed
  design move, not a new owner ruling]
- **QR-2 STANDARD-STATE-READS.** `eth_call` and `eth_getStorageAt` work at
  `latest` and at any basis within the last `RECENT_BASIS_WINDOW = 8,191`
  blocks (matching the EIP-2935 ring, §6.3). Deeper archive reads are a
  bonus, never assumed. [PROPOSAL — window value keyed to the standards FACT]
- **QR-3 FINALITY-DISCIPLINE.** The Realm declares one `finalityRuleKind`
  (§6.1) and never reverts state the rule has classified final; re-orgs are
  bounded by the rule's window. [PROPOSAL]
- **QR-4 EVM-SEMANTICS.** EVM equivalence for the B0 floor: KECCAK256,
  SSTORE/SLOAD/EXTCODEHASH semantics, ECRECOVER precompile; the P-256
  precompile (EIP-7951) is an optional capability flagged in the profile, not
  the floor. [PROPOSAL; EIP-7951 live on L1 since Fusaka is a standards FACT
  — VERIFIED via STANDARDS lane finding 8]
- **QR-5 GAS-PROFILE.** The Realm's per-transaction gas ceiling is at least
  `REALM_MIN_TX_GAS = 16,777,216` (2^24). This is exactly the EIP-7825 cap,
  live on L1 since Fusaka 2025-12-03 [standards FACT — VERIFIED via task text
  and STANDARDS lane finding 0]. **The cap binds**: every contract-callable
  page is designed-bounded under 2^24 gas (§5.6), and write entrypoints
  target it with leafMask subset admission (SR-3) as the structural fallback
  — whether a **maximal** legal envelope admits in one transaction is a
  measured Stage B output, not a claimed property [PROPOSAL — SR-5 pin]. Any
  Realm at or above the L1 cap qualifies; a Realm below it does not qualify
  for the B0 profile.
- **QR-6 NO-HISTORY-DEPENDENCE.** EFS never requires the Realm to serve
  event logs, historical transaction bodies, or expired history. Motivation:
  EIP-4444 partial history expiry is live (pre-merge bodies/receipts
  droppable since 2025-05; the rolling window is unscheduled; EIP-7927 is the
  meta-EIP) [standards FACT — VERIFIED via STANDARDS lane finding 19]. This
  assumption points at EFS itself: §8's reconstruction walk MUST need state
  only [DERIVED INVARIANT — candidate falsifier 10,
  core-architecture-candidate.md:432; owner ruling full-body spine,
  owner-rulings.md:15,67-68].
- **QR-7 CHAINID-INTEGRITY.** The eip155 chainId is unique among chains the
  client can reach and is not recycled. [PROPOSAL — underpins A-1 defense]
- **QR-8 SINGLE-ORDERING.** The Realm presents one total transaction order;
  a sequencer that equivocates orderings to different observers disqualifies
  the Realm. [PROPOSAL — admission ordinals (§5.3) are meaningless without it]

A Realm failing an assumption does not delete evidence; it degrades **grading**
(§4.2). Client conformance: assumptions are per-Realm facts a client MAY probe
but MUST NOT silently assume for Realms it has never checked [PROPOSAL].

### 4.2 Honest behavior when a source basis is unavailable — exact result model

Context: evidence imported or cited across Realms ("source-qualified
evidence", candidate core-architecture-candidate.md:183-187) needs a read
against its **home (source) Realm** to be graded for admission, currentness,
or revocation. When that Realm is unreachable (dead L3, all endpoints down,
QR failure):

Result model, basis axis [PROPOSAL — the grade names; the two-axis split is a
DERIVED INVARIANT from the intake SURVIVORS lane §10-grade finding and the
carry-in six-part-tuple lesson (joined-pass-synthesis JR-1, VERIFIED by the
carry-in audit): presence (FOUND/ABSENT/CONFLICT/UNKNOWN) and basis/grade are
orthogonal and never collapse]:

```text
BasisGrade =
    LOCAL_AUTHORITATIVE          // this Realm's own state at a pinned basis
  | SOURCE_AVAILABLE(basis)      // source Realm read succeeded at `basis`
  | SOURCE_SNAPSHOT(basis, age)  // cached source state; stale-labeled
  | UNAVAILABLE_SOURCE_BASIS(sourceRealmId, requiredBasisKind)
```

**Normative wording of UNAVAILABLE_SOURCE_BASIS** (verbatim adoption target
for the SDK/result-model chapter):

> `UNAVAILABLE_SOURCE_BASIS(sourceRealmId, requiredBasisKind)`: the reader
> holds evidence whose grading requires a read against source Realm
> `sourceRealmId` at a basis of kind `requiredBasisKind`, and no qualifying
> endpoint for that Realm answered. Portable signature verification and
> portable identity of the evidence are unaffected and MUST still be
> reported. This outcome is a retrieval failure of the reader's session. It
> MUST NOT be presented as absence, revocation, expiry, or invalidity; it
> MUST NOT be silently omitted from results; it MUST NOT downgrade the local
> Realm's own admitted state; and it MUST NOT promote the local copy of the
> bytes into source-Realm truth.

Behavior rules [each PROPOSAL unless cited]:

- **H-1 never silent absence.** Presence stays `UNKNOWN`; the basis axis
  carries `UNAVAILABLE_SOURCE_BASIS`. "`UNKNOWN` is never absence"
  [DERIVED INVARIANT — system-constitution.md:207-209].
- **H-2 never global truth.** Local admission of copied bytes is
  destination evidence only [DERIVED INVARIANT — candidate
  core-architecture-candidate.md:183-187; inbox P-3 disposition].
- **H-3 anti-fallthrough.** Resolution MUST NOT silently continue to a
  lower-priority source when a required basis is unavailable; only proof of
  absence yields to the next source [DERIVED INVARIANT — carry-in finding 3,
  lens-read-gotchas anti-fallthrough rule, VERIFIED by the carry-in audit;
  mechanism-independent, so it survives the greenfield reset].
- **H-4 stale-snapshot honesty.** Cached source state may be served as
  `SOURCE_SNAPSHOT(basis, age)`, never as current.
- **H-5 no resurrection of dead-chain machinery.** No checkpoint-export,
  header-archive, or year-100 offline-verification mechanism is (re)introduced
  here [OWNER RULING — 2026-07-10 DROP list, owner-rulings.md:12; PM
  directive line 22].

---

## 5. Admission: AdmissionReceipt/1, ordinals, and the one-call atomic boundary

### 5.1 Logical receipt vs physical storage

Logical **AdmissionReceipt/1** (what the ABI returns, matching the candidate
sketch core-architecture-candidate.md:194-202):

```text
AdmissionReceipt/1 {
  occurrenceRef    (bytes32 envelopeId, uint16 leafIndex)
  realmId          bytes32          // constant for the answering contract
  realmRevisionId  bytes32          // policy + implementation basis (§2.5)
  authorityBasis   bytes32          // the SR-7 packed AuthorityBasisWord
                                    // verbatim (kind ‖ verifierVersion ‖
                                    // witnessProfile ‖ basisBlock ‖
                                    // delegateOrZero); the conditional
                                    // codehash slot is Lane 3's. DEPENDS-ON
                                    // Lane 3 (SR-7).
  admissionOrdinal uint64           // global accepted order, 1-based
  admittedAtBlock  uint48           // inclusion block of the admitting tx
  acceptedStatus   uint8            // §5.2
}
```

Physical storage [PROPOSAL — regenerated to the SR-10 split: an
occKey-addressable status overlay owns the occurrence lifecycle, an
ordinal-keyed log is the receipt spine, and per-envelope/per-call records
carry the rest]:

```text
// slot packing: byte 0 = most significant byte of the 32-byte slot word;
// all integers big-endian within their byte range.

// 1. THE occurrence lifecycle owner — occKey status overlay (SR-10);
//    occKey = H(envelopeId, leafIndex), formula owned by the authorship
//    chapter:
mapping(bytes32 occKey => OccStatus) occStatus;
//   OccStatus, one slot:
//     status           u8   0 = NEVER_ADMITTED, 1 = ACTIVE, 2 = WITHDRAWN,
//                           3 = PRE_WITHDRAWN
//     ordinal          u48  0 = none; ordinals are 1-based (SR-4)
//     revokedAtOrdinal u48  0 = none
//   WITHDRAWN and PRE_WITHDRAWN are terminal and permanently block
//   (re-)admission of the occKey (no-resurrection, SR-10/SR-15); the
//   one-way status flip drives the exactly-once index decrement.

// 2. The receipt spine — ordinal-keyed admission log, one entry per
//    ACCEPTED occurrence: { occKeyRef (envelopeId + leafIndex),
//    leafIndex u16, typeOrd u48, principalOrd u48 }. Physical word layout
//    is owned by the index chapter (SR-10 restored-u48 widths); this
//    chapter consumes it for receipts, pages, and the reconstruction walk.

// 3. Per-envelope meta, written at the first admission touching the
//    envelope:
struct EnvelopeMeta {                        // 3 slots
  bytes32 principalId;                       // slot 0 — SR-13 identity chain
  bytes32 authorityBasis;                    // slot 1 — SR-7 word verbatim
  // slot 2: bytes 0-4 envelopeOrdinal uint40; bytes 5-10 firstTouchBlock
  //         uint48; bytes 11-14 firstTouchRevision uint32; byte 15
  //         acceptedStatus uint8; bytes 16-31 reserved, MUST be zero
}
mapping(bytes32 => EnvelopeMeta) envelopeMetaOf;
mapping(uint40  => bytes32) envelopeIdByOrdinal;

// 4. Per-admitting-call batch record (this chapter's addition — gives every
//    ordinal its admittedAtBlock/revisionOrdinal without widening the index
//    chapter's log word): one slot per call that accepted >= 1 occurrence:
//    { firstOrdinal u48, admittedAtBlock u48, revisionOrdinal u32 };
//    ordinal → batch by binary search over append-only firstOrdinal.

uint48 admissionCount;    // physical width; uint64 at every ABI (SR-4);
                          // typed U48_GUARD revert at 2^48 − 1
uint40 envelopeCount;     // high-water envelope ordinal
// canonical envelope bytes: state-readable spine, layout owned by the
// RecordStore/encoding chapter; MUST satisfy §8 W-4. DEPENDS-ON Lane 2.
```

[REJECTED — pre-SR-10 arm, kept as a sketch: one 2-slot `EnvelopeAdmission`
per envelope holding `firstAdmissionOrdinal + leafCount + authorityBasis`,
with `admissionOrdinal(leaf k) = firstAdmissionOrdinal + k` and authority
"verified once per signed envelope". Retired because leafMask subset and
staged admission (SR-3/SR-12) make any leaf-indexed `base + k` law unsound,
and because a never-admitted occurrence (pre-withdrawal, SR-10) needs an
occKey-keyed home that an ordinal-keyed store cannot provide.]

Redundancy avoided: `realmId` is stored once in genesis state, never per
receipt; `realmRevisionId` is dereferenced from the admission ordinal via
the append-only revision history (each revision stores its
`firstAdmissionOrdinal`, U-2); `admittedAtBlock` comes from the batch
record. The submitting `msg.sender` is deliberately **not** recorded:
authority never derives from the submission rail, and recording it would
create a false authority surface [DERIVED INVARIANT — R-D8 via intake
SURVIVORS lane finding 7 (relayer/paymaster substitution), and constitution
role separation system-constitution.md:130-131].

### 5.2 acceptedStatus

```text
0 = NONE       (sentinel: no admission exists; never stored)
1 = ACCEPTED
2-255 reserved
```
[PROPOSAL] Only `ACCEPTED` is ever written in B0: a rejected or reverted
attempt leaves no state and surfaces as a typed revert (§5.5) [DERIVED
INVARIANT — candidate core-architecture-candidate.md:204-209: "a reverted or
rejected attempt normally leaves no state"]. Withdrawal, tombstoning, and
supersession are later admitted evidence and never mutate a receipt
(append-only history, system-constitution.md:155-158). The field exists for
ABI stability so future profiles can add graded acceptance without a new
struct.

### 5.3 AdmissionOrdinal assignment rule

[PROPOSAL — exact rule]

```text
ordinals are 1-based; 0 is the NONE sentinel everywhere.

on admitting envelope E with n leaves (after all checks pass):
  envelopeCount        += 1
  envelopeOrdinal(E)    = envelopeCount
  firstAdmissionOrdinal = admissionCount + 1
  admissionCount       += n
  leaf k of E (k in [0, n-1]) has admissionOrdinal = firstAdmissionOrdinal + k
```

Consequences: the global accepted-admission order is total and gap-free;
`admissionOrdinal → OccurrenceRef` is computable by binary search over
envelope ordinals (each `EnvelopeAdmission` stores `firstAdmissionOrdinal`),
so no separate admission log is stored [PROPOSAL — correct/easy-before-fast;
a packed admission-log arm is a bakeoff lever if the ~40-iteration search
(≤ 40 × 2 cold SLOADs ≈ 168,000 gas worst case for a contract caller; free
via RPC) proves too hot]. Century arithmetic: uint40 envelope ordinals allow
1.10e12 envelopes — at a sustained 10 envelopes/second that is ~3,486 years;
uint64 admission ordinals are inexhaustible at any credible rate (2^64 at
1,000 admissions/s ≈ 5.8e8 years). State growth, not ordinal width, is the
real bound.

### 5.4 Entrypoints and the atomic boundary

The atomic boundary is **one external call into the one physical Core**
(B0 axis 6: logical modules are internal libraries, so there is no
cross-contract partial failure by construction). All Core state writes in one
call commit or revert together [DERIVED INVARIANT — constitution one-
transaction block, system-constitution.md:149-153; candidate module 3,
core-architecture-candidate.md:351-353].

```solidity
struct OccurrenceRef { bytes32 envelopeId; uint16 leafIndex; }

struct PublishResult {
  bytes32 envelopeId;
  uint40  envelopeOrdinal;        // 0 iff outcome = ALREADY_ADMITTED
  uint64  firstAdmissionOrdinal;  // 0 iff outcome = ALREADY_ADMITTED
  uint16  admittedLeafCount;      // 0 iff outcome = ALREADY_ADMITTED
  uint8   outcome;                // 1 = ADMITTED, 2 = ALREADY_ADMITTED
}

/// Admit one signed portable envelope, optionally applying one Realm-bound
/// AdmissionIntent in the same atomic call. intentBytes = "" for plain
/// evidence admission (no principal-authorized local effects).
function publish(bytes calldata envelopeBytes, bytes calldata intentBytes)
  external returns (PublishResult memory);

/// Apply one Realm-bound intent over already-admitted occurrences.
function applyIntent(bytes calldata intentBytes)
  external returns (bytes32 intentId, uint64 intentOrdinal);

/// All-or-nothing batch. Reverts atomically if any element reverts.
function publishBatch(bytes[] calldata envelopes, bytes[] calldata intents)
  external returns (PublishResult[] memory);
```
[PROPOSAL — signatures] `publish` is permissionless: anyone may submit any
well-formed signed envelope; authorship comes from the envelope's signature
via Lane 3's versioned verifier, never from `msg.sender` [DERIVED INVARIANT —
R-D8, §5.1]. Submitting someone's portable envelope to a new Realm creates
destination *evidence*, never destination *truth* (§4.2 H-2) — this is B0
axis 3's portable arm working as intended.

**Dependent-graph one-call flow with precomputed IDs** [PROPOSAL — exact
rule]: all EFS IDs are deterministic and computable offline (skeleton rule),
so a writer precomputes every RecordId/EnvelopeId before submission. During
admission, leaves are processed in leaf order `0..n-1`; a typed reference
from leaf `k` to RecordId `r` is satisfied iff

```text
REF-SAT: r is already admitted in Realm state
         OR r is the RecordId of some leaf j < k in the same envelope.
```

Inline canonical Record leaves (B0 axis 5) make the second arm total: the
referenced bytes are in the same calldata, so a bounded dependent graph
(Project → Release → Locator) admits in one transaction with no second block
to discover an identifier [DERIVED INVARIANT — system-constitution.md:150-152].
Forward references (j > k) are rejected (`E_REF_UNSATISFIED`) — writers
topologically sort, which is always possible because RecordIds cannot form
reference cycles (a cycle would require hashing a hash of itself; the
encoding chapter's recursive-Type rules handle the SELF case).

**AdmissionIntent/1** [PROPOSAL — canonical word encoding; action semantics
2..3 are Lane 5's (Binding) seam]:

```text
AdmissionIntent/1 signed body = abi.encode(
  bytes32 realmId,          // realm-bound: MUST equal this Realm's id
  bytes32 principalId,      // full-width, never truncated
  uint8   action,           // 1=ADMIT_EVIDENCE, 2=BIND, 3=WITHDRAW, 4-255 rsvd
  bytes32 actionData,       // action-specific commitment (Lane 5 owns 2/3)
  uint64  intentNonce,      // uniquifier inside IntentId; no ordering meaning
  uint48  expiryBlock,      // admission requires block.number <= expiryBlock
  OccurrenceRef[] refs      // ABI dynamic tail; refs into this envelope or
)                           // already-admitted state
IntentId = keccak256("efs2/intent/1" ‖ signed body)   // witness EXCLUDED
witness  = authorization per Lane 3 (actor signature for principalId);
           carried alongside, never inside the IntentId preimage
           (signature malleability must not fork intent identity).
```

Replay and domain rules [PROPOSAL]: the intent's signing domain includes
`realmId` (Realm-bound); the envelope's signing domain MUST NOT include any
realm binding (portable — B0 axis 3 pin). Cross-Realm intent replay fails
`E_INTENT_REALM_MISMATCH`. Consumption registry:
`mapping(bytes32 intentId => uint64 intentOrdinal) consumedIntents` — nonzero
means consumed. `INTENT_MAX_TTL_BLOCKS = 1,048,576` (2^20; ≈ 24 days at 2 s
blocks) bounds `expiryBlock - block.number` at submission, limiting how long
a pre-signed intent can float (TOCTOU hygiene, §6.4).

Intent applications are logged for reconstruction (§8 W-6): `uint64
intentCount; mapping(uint64 => bytes32) intentIdByOrdinal;
mapping(bytes32 => bytes) intentBytesById;` plus each intent's
`atAdmissionOrdinal` (the value of `admissionCount` when it applied), so the
interleaving of admissions and intent effects is a deterministic total order:
admissions by ordinal, with intents inserted at their recorded
`atAdmissionOrdinal` points, ties broken by `intentOrdinal` [PROPOSAL — makes
Binding folds a pure function of state; Lane 5 consumes this order].

### 5.5 Idempotent retry and partial-failure rules

[PROPOSAL — exact semantics]

- **Idempotent success.** `publish` where `envelopeId` is already admitted
  AND `intentBytes` is empty or its `IntentId` already consumed → returns
  `outcome = ALREADY_ADMITTED`, writes nothing, does not revert. Retry loops
  converge without error handling; "retrying identical content is
  idempotent" [DERIVED INVARIANT — system-constitution.md:153-154].
- **Conflicting reuse.** Same `IntentId` submitted with a different
  envelope, or an intent whose CAS predecessor no longer matches (Lane 5
  rule) → typed revert; nothing commits.
- **All-or-nothing.** Any leaf failing any check reverts the entire call —
  there is no admit-the-valid-subset mode; a writer wanting independent
  failure domains splits envelopes (and loses cross-envelope atomicity,
  honestly) [PROPOSAL — an envelope is one signed unit; admitting a subset
  would create a signed-bytes-vs-admitted-set divergence, the
  subset-carriage hazard the axis-3/5 vectors test].
- **Typed reverts** (closed list; codes are ABI errors, not stored state):

```text
E_STRUCTURAL(uint16 leafIndex, uint16 code)   // malformed canonical body
E_UNKNOWN_TYPE(uint16 leafIndex)              // TypeSchemaId not admitted
E_AUTHORITY(uint16 code)                      // envelope authority fails (Lane 3 codes)
E_INTENT_EXPIRED()
E_INTENT_REALM_MISMATCH()
E_INTENT_REPLAY()
E_REF_UNSATISFIED(uint16 leafIndex, uint8 roleOrdinal)
E_CAS_CONFLICT(bytes32 positionKey)           // Lane 5 seam
E_BOUNDS(uint16 code)                         // named-constant violation
E_POLICY(uint16 code)                         // Realm policy module rejection
```

- **Policy hook.** Realm admission policy is a bounded, revisioned check
  inside the atomic call (`POLICY_GAS_MAX = 200,000` gas [PROPOSAL — value
  TBD-final by the V2-E4 costing; what decides it is the aggregate write
  budget]), identified by `policyCommitment` in the active revision; there
  are no Type-created admission callbacks [DERIVED INVARIANT — kickoff gate,
  fable-efs2-core-engineering-kickoff.md:92-93]. Policy acceptance/rejection
  never changes portable IDs [DERIVED INVARIANT — constitution acceptance
  trace "Type and admission validation", system-constitution.md:304].

### 5.6 EIP-7825 arithmetic — the cap binds and B0 fits under it

Per QR-5 the design budget per transaction is 16,777,216 gas [standards
FACT]. Cost model constants used (EVM, post-Berlin/Pectra; PLAUSIBLE from
general knowledge, to be re-measured by the harness): cold SSTORE to a fresh
slot ≈ 22,100 gas; cold SLOAD ≈ 2,100 gas; calldata ≈ up to 40 gas per
nonzero byte under the EIP-7623 floor.

Named bounds [each PROPOSAL; the deciding measurement is the Stage B harness
aggregate-write benchmark]:

```text
MAX_ENVELOPE_BYTES     = 8,192      // canonical envelope incl. inline leaves
MAX_LEAVES_PER_ENVELOPE= 64
MAX_INTENT_REFS        = 64
MAX_BATCH_ENVELOPES    = 8
ADMISSION_PAGE_MAX     = 1,024      // entries per paged read
POLICY_GAS_MAX         = 200,000
INTENT_MAX_TTL_BLOCKS  = 1,048,576
REALM_MIN_TX_GAS       = 16,777,216
RECENT_BASIS_WINDOW    = 8,191
```

Worst-case publish arithmetic: envelope byte spine 8,192 B → 256 slots ×
22,100 ≈ 5.66 M; envelope admission + id maps + intent structures ≈ 8 slots
≈ 0.18 M; per-leaf index postings (Lane 5's mandatory bundle, assumed ≤ 4
cold slots/leaf) 64 × 4 × 22,100 ≈ 5.66 M; calldata ≤ 8,192 × 40 ≈ 0.33 M;
hashing/execution overhead ≈ 1 M. Total ≈ 12.9 M < 16,777,216 ✓ with ~23%
headroom. If Lane 5's measured fan-out exceeds 4 slots/leaf, either
`MAX_LEAVES_PER_ENVELOPE` or `MAX_ENVELOPE_BYTES` shrinks — that tradeoff
returns to James rather than being silently absorbed [OWNER-PROCESS RULE —
kickoff:106-107]. Paged reads: a 1,024-entry admission page walks ≤ 1,024
envelope slots ≈ 1,024 × 2 × 2,100 ≈ 4.3 M ✓; binary-search point lookup
≈ 0.17 M ✓. A hypothetical 65,536-byte envelope would cost ≈ 45 M in slot
storage alone — impossible under the cap; that is why large content rides
Locators/closures, never canonical bodies [DERIVED INVARIANT — constitution
Files/bytes block, system-constitution.md:224-238].

---

## 6. The admission/finality-observation split

### 6.1 Principle and finality rules

Admission never claims finality of its own transaction: a contract cannot
know the future finality of the block it is executing in [DERIVED INVARIANT —
candidate core-architecture-candidate.md:203-205]. The receipt records
`admittedAtBlock` only. Finality is a **later named-basis read**.

```text
finalityRuleKind (uint8):
  0 = NONE_DECLARED          // qualifying only for evidence-grade use
  1 = L1_FINALIZED_BATCH     // final when included in an L1-finalized batch
  2 = CONFIRMATION_DEPTH(k)  // final at depth k; k in policyCommitment params
  3 = SEQUENCER_SOFT         // soft finality only; MUST be surfaced as such
  4-255 reserved
```
[PROPOSAL — table; the rule is Realm-declared fact, the *choice to rely on
it* is always the consumer's]

### 6.2 FinalityObservation — exact ABI

On-chain helper (same-Realm consumers):

```solidity
/// Age of an admitted envelope, for challenge-window and depth rules.
/// Reverts E_BOUNDS if the envelope is not admitted.
function admissionAge(bytes32 envelopeId) external view
  returns (uint48 admittedAtBlock, uint48 currentBlock, uint64 confirmations);
```

Client-side named-basis read (normative result object)
**FinalityObservation/1** [PROPOSAL]:

```text
FinalityObservation/1 {
  realmId            bytes32
  occurrenceRef      OccurrenceRef      // or envelopeId-wide
  admittedAtBlock    uint48
  observedAtBlock    uint48             // the named basis B
  observedBlockHash  bytes32            // hash of B as seen by the observer
  ruleApplied        uint8              // finalityRuleKind evaluated
  ruleSatisfied      bool
}
```

This object is (a) a session result in the client result model, and (b)
publishable as an ordinary application-Type Record when an observer wants to
put a finality observation on the record — in which case it is authored
evidence graded by reader trust, never Core truth [PROPOSAL — no Core
finality state exists]. Cross-Realm consumption of such observations is an
explicit adapter concern (inbox P-3/P-22 dispositions), out of B0.

### 6.3 On-chain recent-basis tool

EIP-2935 exposes an in-state ring of the last ~8,191 block hashes (live
since Pectra 2025-05) [standards FACT — as given by the task directive; ring
depth ~8,191 VERIFIED via task text; the system-contract address is not
restated here — PLAUSIBLE from memory only, the prototype pins it from the
EIP text]. A same-Realm contract can therefore verify `observedBlockHash`
for any basis within `RECENT_BASIS_WINDOW = 8,191` blocks. Beyond the ring,
on-chain historical verification is unavailable in state — which is exactly
why `admittedAtBlock` lives in the receipt slot rather than being derived
from history [PROPOSAL — design consequence].

### 6.4 Challenge-window safety (preserved lesson)

Preserved verbatim as standing owner authority [OWNER RULING — 2026-07-15
item F, owner-rulings.md:51-54, VERIFIED]: on-chain gates use closed, trusted
author sets; EFS does not guarantee contracts can detect equivocation; a
collision/duplicity bit is TOCTOU-defeated (the attacker controls timing);
contracts needing certainty against untrusted authors use a challenge-window
(delay + re-check) pattern. B0 consequence: admission maintains **no**
collision-state, and the receipt's `admittedAtBlock` plus `admissionAge()`
are the exact mechanism a consuming contract needs to enforce
`confirmations >= W` before acting, then re-check the slot [PROPOSAL —
mechanism hook; exact collision-state mechanics remain unfrozen per the PM
directive line 21, and any future proposal to add kernel duplicity state must
first overcome the recorded TOCTOU refutation].

---

## 7. Upgrade history under one RealmId

### 7.1 State

```text
uint32 revisionCount;
mapping(uint32 => RealmRevision) revisions;   // 1-based, append-only
struct RealmRevision {                        // 3 slots
  bytes32 implementationCodehash;             // slot 0
  bytes32 policyCommitment;                   // slot 1
  // slot 2: bytes 0-5 activatedAtBlock uint48 (BE);
  //         bytes 6-13 firstAdmissionOrdinal uint64 (BE) — the first ordinal
  //         admitted under this revision; bytes 14-31 reserved zero
}
```
[PROPOSAL] For `upgradeAuthorityKind = NONE` the Core account's own codehash
is the implementation codehash; for proxy patterns it is the implementation
account's EXTCODEHASH. The pattern is declared in the descriptor (§2.1 B) and
checked by C-5.

### 7.2 Rules

[Each rule PROPOSAL unless cited; U-3's boundary is a DERIVED INVARIANT from
constitution system-constitution.md:216-220 — "Semantic evolution uses
versioned Types/profiles and explicit successor or redirect evidence rather
than silently changing old meaning" — and candidate
core-architecture-candidate.md:58-61.]

- **U-1 (allowed upgrades).** An implementation upgrade MAY activate under
  the same RealmId iff it preserves the **Semantics Contract**: (a) every ID
  formula and domain constant; (b) the canonical codec set and structural
  validation verdicts for previously-valid inputs; (c) ordinal assignment
  (§5.3); (d) meaning and layout of all existing state (or lossless
  view-compatible migration); (e) the result model. Bug fixes, additive
  capabilities, and gas work qualify.
- **U-2 (recorded activation).** Activation MUST atomically append a
  `RealmRevision` with the new `implementationCodehash`, active
  `policyCommitment`, `activatedAtBlock = block.number`, and
  `firstAdmissionOrdinal = admissionCount + 1`. Revisions are append-only;
  `revisionOrdinal` strictly increases.
- **U-3 (breaking = new Realm).** Any change outside U-1(a-e) is
  semantics-breaking and MUST NOT reuse the RealmId: it requires a new
  deployment (new genesisCommitment → new RealmId) plus, optionally,
  **successor evidence** — ordinary authored Occurrences of an
  application-level `RealmSuccessor/1` Type published in the old and/or new
  Realm, weighed by reader Lenses like any evidence. Core has no successor
  pointer and no admin successor bit [PROPOSAL — a Core-blessed successor
  slot would be a mutable global administrator surface; cf. the succession
  cluster flagged by the intake SURVIVORS lane finding 1, reserved not
  frozen].
- **U-4 (per-admission basis).** Every admission stores `revisionOrdinal`
  (§5.1); verification and interpretation of an old Occurrence use the
  recorded revision's basis, never the current one. A later upgrade,
  account-code change, or controller rotation does not silently reinterpret
  an old admission [DERIVED INVARIANT — constitution
  system-constitution.md:133-136; candidate falsifier 7].
- **U-5 (client verification).** A client MUST run C-5/C-7 (§3); a current
  implementation codehash absent from the revision history, or a
  non-monotonic history, disqualifies the Realm
  (`UNQUALIFIED_REALM` grading; presented like a QR failure, §4).
- **U-6 (sunset).** A Realm MAY be terminally frozen (admissions disabled
  forever) by its upgrade authority; the freeze is recorded as a final
  revision whose policyCommitment encodes `FROZEN`. Reads stay live
  indefinitely (QR-1). No un-freeze exists [PROPOSAL].

Prototype note: disposable prototypes may use ERC-7201-namespaced upgradeable
storage; the frozen production Core is intended to end `upgradeAuthorityKind
= NONE` [PROPOSAL — consistent with STANDARDS lane finding 18's scoped-role
recommendation; ERC-7201 Final is a standards FACT, VERIFIED via that
finding].

---

## 8. Independent state-only reconstruction walk

Goal: a second, independently written implementation rebuilds Types, Records,
Envelopes, Occurrences, receipts, indexes, and Binding folds from **contract
state and declared byte carriers alone** — no event logs, no historical
transaction bodies, no EFS-operated service [DERIVED INVARIANT — constitution
system-constitution.md:210-216 and acceptance trace "Independent rebuild"
:306; candidate falsifier 10; motivated by EIP-4444/7927: partial history
expiry is live since 2025-05, the rolling window is unscheduled — standards
FACT, VERIFIED via STANDARDS lane finding 19; owner ruling full-body spine
owner-rulings.md:15,67-68].

### 8.1 The walk — deterministic pseudocode

```text
W-0  BOOTSTRAP   verify descriptor per C-1..C-7 (§3). Abort on any failure.
W-1  GENESIS     read genesisFacts(): chainRef, profileId, codexConstantsHash,
                 deployBlock, deployCodehash, initConfigHash, realmId.
                 Recompute genesisCommitment and RealmId; compare.
W-2  REVISIONS   n := revisionCount(); for i in 1..n read revisionAt(i);
                 verify activatedAtBlock and firstAdmissionOrdinal are
                 strictly increasing; recompute each RealmRevisionId.
W-3  ENVELOPES   E := envelopeCount(); for e in 1..E:
                   id  := envelopeIdByOrdinal(e)
                   adm := admissionByEnvelopeId(id)     // packed slot + basis
                   verify adm.envelopeOrdinal == e
W-4  BYTES       for each envelope id: bytes := getEnvelopeBytes(id)
                 (total function over admitted envelopes; physical layout
                 owned by the RecordStore chapter, DEPENDS-ON Lane 2).
                 Recompute EnvelopeId from bytes; MUST equal id.
W-5  LEAVES      decode leaves 0..n-1 per the canonical codec; for each leaf
                 recompute RecordId and TypeSchemaId; Occurrence set :=
                 { (id, k) } with admissionOrdinal firstAdmissionOrdinal + k.
                 Types are themselves Records of the bootstrap meta-Type and
                 appear in this same walk — no side registry exists.
W-6  INTENTS     I := intentCount(); for i in 1..I:
                   iid   := intentIdByOrdinal(i)
                   bytes := intentBytesById(iid)        // state-stored, §5.4
                   read atAdmissionOrdinal(iid)
                 Build the total event order: admissions by ordinal, intents
                 inserted at their atAdmissionOrdinal, ties by intentOrdinal.
W-7  RECEIPTS    logical AdmissionReceipt/1 per occurrence is now fully
                 derivable; cross-check a sample (or all) against
                 receiptOf(envelopeId, leafIndex).
W-8  INDEXES     replay the Lane 5 posting fold over the W-6 total order;
                 the fold MUST be a pure deterministic function of that
                 order (DEPENDS-ON Lane 5 determinism guarantee); compare
                 recomputed postings against paged index reads.
W-9  BINDINGS    replay the Binding CAS fold over the same order; compare
                 current heads against Binding point reads (DEPENDS-ON
                 Lane 5).
W-10 VERDICT     any mismatch at W-1..W-9 is a conformance failure of the
                 Realm or of one implementation — a Stage B golden-vector
                 category, and at runtime an UNQUALIFIED_REALM grading, never
                 a silent repair.
```

### 8.2 Reconstruction read ABI (complete list)

```solidity
function realmId() external view returns (bytes32);
function genesisFacts() external view returns (
  bytes8 chainNamespace, bytes32 chainReference, address core,
  bytes32 profileId, bytes32 codexConstantsHash,
  uint48 deployBlock, bytes32 deployCodehash, bytes32 initConfigHash,
  bytes32 genesisCommitment, bytes32 realmId_);
function codexConstants() external view returns (bytes memory); // encoding ch.
function revisionCount() external view returns (uint32);
function revisionAt(uint32 ordinal) external view returns (
  bytes32 implementationCodehash, bytes32 policyCommitment,
  uint48 activatedAtBlock, uint64 firstAdmissionOrdinal, bytes32 revisionId);
function currentRevision() external view returns (
  uint32 ordinal, bytes32 revisionId, bytes32 implementationCodehash,
  bytes32 policyCommitment, uint48 activatedAtBlock);
function admissionCount() external view returns (uint64);
function envelopeCount() external view returns (uint40);
function envelopeIdByOrdinal(uint40 ordinal) external view returns (bytes32);
function getEnvelopeBytes(bytes32 envelopeId) external view returns (bytes memory);
function admissionOf(bytes32 envelopeId) external view returns (
  uint40 envelopeOrdinal, uint64 firstAdmissionOrdinal, uint16 leafCount,
  uint32 revisionOrdinal, uint48 admittedAtBlock, uint8 acceptedStatus,
  bytes32 authorityBasis);
function receiptOf(bytes32 envelopeId, uint16 leafIndex) external view
  returns (AdmissionReceiptView memory);      // logical AdmissionReceipt/1
function admissionAt(uint64 ordinal) external view
  returns (OccurrenceRef memory);             // binary search, §5.3
function admissionPage(uint64 startOrdinal, uint16 maxCount) external view
  returns (OccurrenceRef[] memory page, uint64 nextCursor, uint8 completeness,
           uint64 highWater, uint48 basisBlock);
function intentCount() external view returns (uint64);
function intentIdByOrdinal(uint64 ordinal) external view returns (bytes32);
function intentBytesById(bytes32 intentId) external view returns (bytes memory);
function intentApplicationOf(bytes32 intentId) external view returns (
  uint64 intentOrdinal, uint64 atAdmissionOrdinal, uint48 appliedAtBlock);
function admissionAge(bytes32 envelopeId) external view
  returns (uint48 admittedAtBlock, uint48 currentBlock, uint64 confirmations);
```
[PROPOSAL — every page-shaped read returns `(cursor, completeness, highWater,
basisBlock)`; completeness uses the constitution enum values COMPLETE=1,
PARTIAL=2 (UNSUPPORTED=3, UNKNOWN=4 reserved for this contract's reads),
"truncation or missing coverage returns PARTIAL/UNKNOWN, never empty"
— DERIVED INVARIANT, system-constitution.md:307]

Honest scope note: this walk reconstructs state **at the basis the RPC
serves** (latest, or any basis within QR-2's window). Reconstructing a *past*
snapshot needs archive state — a bonus under QR-2, never a requirement, and
never claimed by the guarantee [PROPOSAL — honesty boundary].

Optional accumulator [HYPOTHESIS — falsified/decided by the Stage B gas
harness]: a rolling `stateDigest = keccak256(prevDigest ‖ envelopeId ‖
packedAdmissionSlot)` updated per admission (~1 warm SSTORE ≈ 2,900 gas per
envelope) would let a rebuilt implementation verify the whole walk against
one word. Adopt only if the aggregate write budget holds; correctness does
not depend on it.

### 8.3 EAS adapter seam (specified here, exercised at V2-E8)

Per the PM directive (line 18): the loss-map is deferred to V2-E8; the seam
is pinned now [PROPOSAL]: an EAS adapter is an **ordinary permissionless
submitter** of envelopes/intents — no special entrypoint, no Core knowledge
of EAS. Two reservations make the seam real: (a) Lane 3's AuthorityBasis
vocabulary MUST reserve a code range for "authority verified against a
foreign carrier at a recorded basis" so an adapter-published admission can
record honest provenance without new receipt fields; (b) foreign carrier
identifiers (EAS UIDs, schema UIDs) enter only as algorithm-tagged ByteDigest
values inside application Types, never as EFS identity (skeleton rule). The
V2-E8 loss-map then only fills in *what* survives round-trip, not *where* it
plugs in.

---

## Interfaces exposed

The compact contract other chapters rely on:

- **ChainRef/1** `(bytes8 chainNamespace, bytes32 chainReference)`; eip155
  pinned; CAIP-2 human projection; ERC-7930 projection deferred until Final.
- **ID formulas**: `RealmId` (§2.2), `profileId` (§2.3), `genesisCommitment`
  (§2.4), `RealmRevisionId` (§2.5), `IntentId` (§5.4) — all
  `keccak256(ASCII domain ‖ abi.encode(fixed-width words))`.
- **RealmDescriptor/1** three-section field set (§2.1); RealmId is the only
  identity; section C is untrusted.
- **Client MUST-checks C-1..C-7** (§3) — conformance list for any direct
  client, including the guest Web Client.
- **QR-1..QR-8** qualifying-Realm assumption names (§4.1) — cite these
  instead of inventing per-chapter chain assumptions.
- **BasisGrade** enum incl. `UNAVAILABLE_SOURCE_BASIS` with normative
  wording (§4.2); rules H-1..H-5. Presence and basis axes never collapse.
- **AdmissionReceipt/1** logical shape (§5.1); physical per-envelope packed
  layout; `acceptedStatus` table (§5.2); ordinal rule
  `leaf k ↔ firstAdmissionOrdinal + k` (§5.3).
- **Entrypoints** `publish(envelopeBytes, intentBytes)`,
  `applyIntent(intentBytes)`, `publishBatch(...)` with `PublishResult`;
  REF-SAT dependent-write rule; idempotent `ALREADY_ADMITTED`; typed revert
  list (§5.4-5.5). One external call = one atomicity domain.
- **AdmissionIntent/1** canonical words + realm-bound signing domain;
  envelope signing domain MUST stay realm-free (§5.4).
- **Total event order** (admissions ⊎ intent applications, §5.4/W-6) — the
  input Lane 5's index/Binding folds MUST be pure functions of.
- **Finality**: `admissionAge()`, `FinalityObservation/1`,
  `finalityRuleKind` table; challenge-window pattern hook (§6).
- **Upgrade rules U-1..U-6**; `revisionOrdinal` recorded per admission;
  breaking change = new RealmId + successor evidence (§7).
- **Reconstruction ABI** (§8.2) — the complete state-only read surface;
  no-event-logs guarantee.
- **Named constants** table (§5.6) with EIP-7825 arithmetic.
- **Depended-on seams**: Lane 2 (envelope codec, EnvelopeId preimage,
  `getEnvelopeBytes` physical layout, MAX body split); Lane 3
  (AuthorityBasis preimage, verifier versioning, witness formats, adapter
  code range); Lane 5 (Binding CAS + posting folds, per-leaf fan-out ≤ 4
  slots assumption in §5.6); encoding chapter (canonical codec,
  codexConstantsHash, recursive-Type/SELF rules).

## Open items

1. **AuthorityBasis preimage** — Lane 3 must pin the exact commitment
   (verifier version, ERC-1271 codehash basis, EIP-7702 classification) that
   fills the receipt's bytes32; this chapter reserves the slot only.
2. **Envelope byte codec and MAX_BODY split** — Lane 2/encoding; §5.6's
   8,192-byte envelope cap is arithmetic-backed but the per-leaf body bound
   inside it is theirs. SSTORE2-style code-page storage (~3× cheaper per
   byte, PLAUSIBLE) is a bakeoff arm that could raise the cap; measured at
   Stage B.
3. **Per-leaf index fan-out ≤ 4 cold slots** — assumption borrowed for §5.6;
   Lane 5's V2-E4 costing confirms or shrinks the leaf/envelope bounds; any
   loss of an adopted query obligation returns to James.
4. **admissionAt binary search vs stored admission log** — pinned to binary
   search [PROPOSAL]; flip if the Stage B harness shows contract callers need
   the O(1) log (≈ 5.5 k gas/leaf amortized to add).
5. **Non-eip155 ChainRef namespaces** — reserved, undefined in B0; ERC-7930
   adoption revisited when it leaves Review.
6. **State-proof client mode** — C-7(b) names `eth_getProof`; the exact
   proof-verification client profile is SDK-lane work.
7. **stateDigest accumulator** — HYPOTHESIS pending gas measurement (§8.2).
8. **Intent action table 2/3 semantics** (BIND/WITHDRAW actionData layouts)
   — Lane 5 owns; this chapter fixes only the envelope-level mechanics,
   consumption registry, and event-order logging.
9. **EAP fixture** — provisional per PM directive; no admission-layer
   dependency was taken on it.
10. **Realm mortality owner decision** — deliberately NOT raised: §4 closes
    the chains-don't-die scope gap by design (qualifying assumption +
    UNAVAILABLE_SOURCE_BASIS honest path). Raise to James only if a reviewer
    shows a workload where the works-either-way path is impossible.
