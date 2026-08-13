# B0 Realm, Admission, Finality, and Reconstruction
**Stage A chapter — post-red-team revision; not landed, adopts nothing.**

**Repair note (2026-08-13 — Stage A reconciliation, still a proposal).** This
chapter now consumes SR-1/3/4/7/9/10/11/12/13/15/16/17/18 exactly: the sole
Core mutation is typed `publish`; intent replay uses sequential nonce lanes;
accepted occurrences use sparse per-occurrence ordinals, a reversible two-word
log, and the four-state lifecycle overlay; authority/revision/finality are
occurrence-scoped through explicit admitting-call batches; and the state-only
walk reconstructs leaf-driven effects and the atomic Type cache. This repair
also forbids current-envelope `OCCREF`, makes explicit nonce consumption
AdmissionBatch-enumerable, and retains full evidence for every effective
external pre-withdrawal. It records the reviewed seam target; it does not adopt
B0 or settle Stage A.

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
     finalityParam           uint32    (confirmation depth only; otherwise 0)
     upgradeAuthorityKind    uint8     (0=NONE/immutable, 1=PROXY_ADMIN_EOA,
                                        2=PROXY_ADMIN_CONTRACT, 3=GOVERNANCE,
                                        4-255 reserved)
     upgradeAuthorityRef     bytes32   current controller/admin reference at
                                        currentRevisionOrdinal (§2.4/§7)
     declaredTxGasLimit      uint64    (genesis declaration; >= QR-5 floor)

  C. ADVISORY TRANSPORT HINTS (untrusted; MUST NOT enter any preimage;
     MUST NOT be treated as evidence)
     rpcUrls[]        UTF-8 strings
     displayName      UTF-8 string
```

Canonical descriptor bytes [PROPOSAL]: section A+B as
`abi.encode(uint16 version=1, chainNamespace, chainReference, coreAddress,
profileId, genesisCommitment, currentRevisionOrdinal, finalityRuleKind,
finalityParam, upgradeAuthorityKind, upgradeAuthorityRef,
declaredTxGasLimit)`; section C appended as an ABI-encoded
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
    uint16 protocolMajor,                  // B0 = 0
    uint16 protocolMinor,                  // B0 = 0; pinned, not open
    bytes32 codexConstantsHash))           // owned by the encoding chapter
```
[PROPOSAL — regenerated field-for-field under SR-1. Per SR-16 the encoding
chapter owns the `codexConstantsHash` definition — the hash over the full
ordered table of domain constants, codec versions, and bound constants — and
the state-readable `codexConstants()`; this chapter consumes both here, in
§2.4, and in §8.2, and requires that the hash cover every constant named in
this chapter. DEPENDS-ON: encoding chapter (SR-16).]

For B0, `protocolMajor = 0` and `protocolMinor = 0` are Codex constants.
Changing either, or any constant covered by `codexConstantsHash`, produces a
different `profileId`; a deployment cannot describe the same bytes as a
different minor profile.

### 2.4 genesisCommitment — exact formula

`InitConfig/1` is the complete deployment-selected input to the genesis hash.
It is one ordered, fixed-width ABI tuple; there is no map, optional tail, or
implementation-private hashing convention:

```text
initConfigBytes = abi.encode(
    uint16 initConfigVersion,       // MUST equal 1
    uint8  finalityRuleKind,        // §6.1; 0..3
    uint32 finalityParam,           // >0 only for CONFIRMATION_DEPTH;
                                    // MUST be 0 for every other kind
    uint8  upgradeAuthorityKind,    // §2.1; 0..3
    bytes32 upgradeAuthorityRef,    // immutable genesis controller ref;
                                    // zero iff kind NONE
    uint64 declaredTxGasLimit,      // MUST be >= REALM_MIN_TX_GAS
    bytes32 initialPolicyCommitment)// MUST be nonzero; revision 1 policy

initConfigHash = keccak256(initConfigBytes)
```

The split is normative. Protocol/version values, domain strings, codec and
index grammars, `REALM_MIN_TX_GAS`, `POLICY_GAS_MAX`, and every other
implementation-independent bound live in `codexConstantsBytes` and therefore
`codexConstantsHash`. Only the seven deployment-selected values above live in
`InitConfig/1`. There is no hidden controller constructor input.

Initialization rejects an unknown kind, a non-canonical `finalityParam`, a gas
declaration below the B0 floor, a zero policy commitment, or any differently
encoded tuple. It requires `upgradeAuthorityRef == 0` iff
`upgradeAuthorityKind == NONE`. Otherwise the reference MUST be the canonical
zero-extended address word `bytes32(uint256(uint160(controller)))`, with a
nonzero controller and zero high 96 bits. Revision 1 uses
`initialPolicyCommitment` and this immutable genesis authority reference
exactly; later current refs exist only through §7's append-only transitions.

```text
DOM_REALM_GENESIS = keccak256("efs2/realmgenesis/1")

genesisCommitment = keccak256(abi.encode(
    DOM_REALM_GENESIS,
    bytes32 deployCodehash,   // EXTCODEHASH of the Core account (or
                              // implementation, §7.1) at the end of the
                              // initialize() block
    uint48  deployBlock,      // block.number of initialize()
    bytes32 codexConstantsHash,
    bytes32 initConfigHash))  // keccak256(exact InitConfig/1 tuple above)
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
             bytes32 upgradeAuthorityRef,      // current controller at activation;
                                               // zero only for immutable kind NONE
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
`implementationCodehash = deployCodehash` and
`policyCommitment = InitConfig.initialPolicyCommitment`, and
`upgradeAuthorityRef = InitConfig.upgradeAuthorityRef`.

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
              EXTCODEHASH(implementation account per §7.1); the exact proxy/
              direct slots and current authority ref match §7.1; and the
              append-only authority-transition chain reconstructs that ref.
                                                               (A-2/A-6 partial)
C-6 SEMANTIC  if admissionCount > 0: fetch one admitted envelope's canonical
              unsigned header+RecordId bytes plus each selected Record body;
              recompute EnvelopeId and each leaf RecordId, and compare
              with the state mappings (§8). A canonicalization lookalike
              fails here even with a copied genesis struct. This checks
              semantic identity, not the unstored main witness. (A-2/A-3)
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
- **QR-5 GAS-PROFILE.** `InitConfig.declaredTxGasLimit` and the Realm's
  enforced per-transaction gas ceiling are each at least
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
  occurrenceRef     (bytes32 envelopeId, uint16 leafIndex)
  realmId           bytes32
  realmRevisionId   bytes32
  authorityBasis    AuthorityBasisWord
  authorityCodehash bytes32          // zero unless CONTRACT_ERC1271
  admissionOrdinal  uint64           // global accepted order, 1-based
  admittedAtBlock   uint48           // inclusion block of the admitting tx
  acceptedStatus    uint8            // 1 ACCEPTED (§5.2)
}
```

The external Solidity shape is byte-for-byte the authorship chapter's one
`AdmissionReceipt/1` view; the receipt itself has no consent-mode or envelope-
level basis field. Consent replay metadata belongs only to its accepting batch's
enumerable `batchIntentLane` word:

```solidity
struct OccurrenceRef {
  bytes32 envelopeId;
  uint16 leafIndex;
}

struct AdmissionReceiptView {
  OccurrenceRef occurrenceRef;
  bytes32 realmId;
  bytes32 realmRevisionId;
  AuthorityBasisWord authorityBasis;
  bytes32 authorityCodehash;         // zero unless CONTRACT_ERC1271
  uint64 admissionOrdinal;
  uint48 admittedAtBlock;
  uint8 acceptedStatus;              // 1 ACCEPTED
}

// Internal-only, byte-identical Admission -> LibIndex/LibBinding seam.
// Admission alone has authenticated any TargetEnvelopeEvidence and author.
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

`ValidatedOccurrenceLifecycleEffect` is not caller ABI. Admission constructs
it only after descriptor, target range, witness/authority, Principal equality,
current lifecycle, and any retained-evidence checks have succeeded. `LibIndex`
and `LibBinding` receive this typed context only: neither accepts evidence or
witness bytes, parses a target descriptor, invokes an authority verifier, or
repeats the author comparison.

Physical storage [PROPOSAL — SR-7/SR-10 exact contract]. Bit 0 is the
least-significant bit of a word; every reserved bit MUST be zero:

```text
DOM_OCCURRENCE = keccak256("efs2/occurrence/1")
occKey(E,k) = keccak256(abi.encode(DOM_OCCURRENCE, E, uint256(k)))

OccStatus @ occStatus[occKey]:
  status           bits [0..7]     u8   // 0 NEVER_ADMITTED, 1 ACTIVE,
                                         // 2 WITHDRAWN, 3 PRE_WITHDRAWN
  ordinal          bits [8..55]    u48  // 0 iff never accepted
  revokedAtOrdinal bits [56..103]  u48  // effective Withdrawal ordinal
  reserved         bits [104..255]      // MBZ

logSlotA(ord): full EnvelopeId bytes32
logSlotB(ord):
  leafIndex    bits [0..15]    u16
  typeOrd      bits [16..63]   u48
  principalOrd bits [64..111]  u48
  reserved     bits [112..255]      // MBZ (u144)

EnvelopeMeta:
  principalId       bytes32
  envelopeOrdinal   u40
  leafCount         u16
  carriage metadata sufficient to return the canonical unsigned envelope
  `abi.encode(EnvelopeHeader, fullRecordIds)`

AdmissionBatchMeta (one packed word):
  firstOrdinal    bits [0..47]     u48
  acceptedCount   bits [48..63]    u16
  admittedAtBlock bits [64..111]   u48
  revisionOrdinal bits [112..143]  u32
  reserved        bits [144..255]       // MBZ (u112)

batchAuthorityBasis[batchId] = AuthorityBasisWord
batchCodehash[batchId] = codehashOrZero // slot exists only for contract kind
batchIntentLane[batchId] = optional packed explicit-intent lane
  0 iff implicit sender consent
  otherwise (uint256(nonceKey) << 64) | uint256(nonceSeq), nonceSeq >= 1

preWithdrawalEvidence[withdrawalOrdinal u48] =
  abi.encode(decoded TargetEnvelopeEvidence)
  // written whenever this accepted Withdrawal causes
  // NEVER_ADMITTED -> PRE_WITHDRAWN transition; nonzero length,
  // <= MAX_ENVELOPE_BODY_BYTES, immutable

AuthorityBasisWord =
  authorityKind u8 || verifierVersion u16 || witnessProfile u8 ||
  basisBlock u64 || delegateOrZero u160
contractCodehash = bytes32 conditional slot for CONTRACT_ERC1271 only

uint48 admissionCount;    // physical width; uint64 at every ABI (SR-4);
                          // typed U48_GUARD revert at 2^48 − 1
uint40 envelopeCount;     // high-water envelope ordinal
uint64 admissionBatchCount;
```

The overlay is the sole lifecycle owner. Public views widen both packed
ordinals to `uint64`; `acceptedStatus` is only the receipt outcome and never a
second lifecycle store. The log is reversible: hydration reads the full
`EnvelopeId` and `leafIndex`, then recomputes `occKey`; neither lifecycle data
nor a hash-only occurrence reference appears in the log.

The immutable canonical unsigned envelope bytes — exact header plus full
RecordId vector, excluding witnesses, bodies, target evidence, and consent —
are persisted once in the authorship owner's lossless header/vector layout.
`envelopeOrdinal` is assigned only when the first occurrence of that
envelope is accepted and remains stable across staged admissions. Envelope
metadata deliberately owns no singular receipt status, revision, block, or
authority basis.

The accepting `AdmissionBatch` and logical receipt are immutable historical
validation evidence. Main-envelope witnesses are not stored, so Realm state
does not promise replay of historic signature or ERC-1271 validation. A reader
uses the receipt's recorded verifier/code basis for historical authorship
grade; calling present authority cannot reinterpret that verdict. The bounded
pre-withdrawal carrier below is the deliberate exception for a never-admitted
target, whose proof must remain reconstructable despite having no receipt.

Each single-envelope `publish` call that accepts at least one new occurrence
appends one batch record. Its new ordinals are contiguous, and append-only
`firstOrdinal` boundaries permit bounded ordinal-to-batch search. `receiptOf`
reads the occurrence ordinal from the overlay, checks the reversible log entry,
and gets block, explicit revision, exact verifier basis, and conditional
codehash from that ordinal's batch. A later staged admission therefore cannot
inherit first-touch metadata. `realmId` remains one genesis value; the
submitting `msg.sender` is not authority state.

For an evidence-backed pre-withdrawal, the target overlay's
`revokedAtOrdinal` is the accepting Withdrawal occurrence's ordinal and that
ordinal keys the exact canonical evidence bytes above. The bytes contain the
validated target header, full RecordId vector, authenticated target
`(typeSchemaId, bodyHash)` commitment, typed `AccountPrincipal`, and witness in
the authorship chapter's
`TargetEnvelopeEvidence` field order. The
outer wire and aggregate-evidence bounds are checked before storage, so this is
a bounded reconstruction carrier rather than an unbounded side channel. Because
current-envelope OCCREF is forbidden, every fresh T4 target is external and
every effective T4 has one nonempty retained value. Empty at an accepted
Withdrawal ordinal therefore means that Withdrawal caused no effective T4.

Every accepting batch also owns exactly one `batchIntentLane` word. Explicit
consent stages the nonzero packed `(nonceKey,nonceSeq)` word with the nonce
update; implicit consent stages zero. Both commit with the batch or neither does.
Enumerating batches in ascending id, deriving each Principal through the first
accepted occurrence's Envelope, and folding nonzero words reconstructs the
complete nonce-lane key universe and point state without intent calldata or logs.

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

shadowNext = admissionCount

preflight selected leaves in ascending leafIndex:
  if point-in-order shadow status is NEVER_ADMITTED:
    require shadowNext < 2^48 - 1 else U48_GUARD
    shadowNext += 1
    prospectiveOrdinal[leaf] = shadowNext
    shadow status = ACTIVE { ordinal=shadowNext, revokedAtOrdinal=0 }
  if ACTIVE: prospectiveOrdinal[leaf] = existing ordinal; no source effect
  if WITHDRAWN/PRE_WITHDRAWN: E_NO_RESURRECTION

only after the complete shadow plan succeeds, replay fresh leaves in the same
ascending order:
  assert admissionCount + 1 == prospectiveOrdinal[leaf]
  admissionCount = prospectiveOrdinal[leaf]
  write the planned occStatus and logSlotA/logSlotB
```

ACTIVE selected leaves allocate no ordinal and return their existing receipt.
Selecting a WITHDRAWN or PRE_WITHDRAWN occurrence for admission reverts: no
terminal occurrence resurrects. The global sequence is gap-free by accepted
event but intentionally sparse with respect to envelope leaf indexes. No
per-envelope range, hole reservation, or leaf-index arithmetic identifies an
occurrence; `admissionAt` is a direct two-word log read. A new envelope receives
its stable `envelopeOrdinal u40` when its first new occurrence is accepted.
Prospective assignment is not a state allocation: any later preflight failure,
including a point-in-order lifecycle or CAS failure, leaves the counter and every
log slot untouched.

### 5.4 Entrypoints and the atomic boundary

The Core-call atomic boundary is **one external call into the one physical Core**
(B0 axis 6: logical modules are internal libraries, so there is no
cross-contract partial failure by construction). All Core state writes in one
call commit or revert together [DERIVED INVARIANT — constitution one-
transaction block, system-constitution.md:149-153; candidate module 3,
core-architecture-candidate.md:351-353]. Independently precomputable Envelopes
may also be composed by the optional non-Core atomic router described below; its
outer EVM transaction is all-or-nothing even though it contains sequential Core
calls.

```solidity
struct PublishLeafResult {
  uint16 leafIndex;
  uint8 outcome;              // 1 ADMITTED, 2 ALREADY_ADMITTED
  uint64 admissionOrdinal;    // fresh or existing
}

struct PublishResult {
  bytes32 envelopeId;
  uint40 envelopeOrdinal;      // stable existing or newly assigned
  PublishLeafResult[] leaves;  // one result per selected leaf, in mask order
}

function publish(
    bytes calldata envelopeBytes,
    AccountPrincipal calldata principal,
    bytes calldata intentBytes,
    bytes calldata intentWitness
) external returns (PublishResult memory);
```

This is the **sole Core write primitive**. `envelopeBytes` carries the repaired
PublicationEnvelope header, full ordered `recordIds[]`, selected inline bodies,
the envelope witness, and any bounded target evidence. Core recomputes the
EIP-712 envelope digest and `EnvelopeId`, then requires
`computePrincipalId(principal) == header.principalId`; mismatch reverts
`AUTH_PRINCIPAL_MISMATCH(declared, computed)` before either witness check.
First-use `PrincipalRecord` bytes come only from that verified descriptor.

Envelope authorship is verified through the one Lane-3 interface:

```solidity
AuthorityVerifierV1.verify(
    principal, eip712EnvelopeDigest, envelopeWitness,
    VerifyContext({selfChainRefHash: SELF_CHAIN_REF_HASH,
                   blockNumber: uint64(block.number)})
) -> (AuthorityBasisWord basis, bytes32 codehashOrZero);
```

The returned pair is the admitting batch's receipt basis. Explicit intent
verification uses the same descriptor and verifier but never replaces the
envelope-authorship pair.

**Dependent-graph one-call flow with precomputed IDs** [PROPOSAL — exact
rule]: all EFS IDs are deterministic and computable offline (skeleton rule),
so a writer precomputes every RecordId/EnvelopeId before submission. During
preflight, selected leaves are processed in ascending mask order; a typed
reference from leaf `k` to RecordId `r` is satisfied iff

```text
REF-SAT: r is already admitted in Realm state
         OR r is the RecordId of an earlier selected leaf j < k in this call.
```

Inline canonical Record leaves (B0 axis 5) make the second arm total: the
referenced bytes are in the same calldata, so a bounded dependent graph
(Project → Release → Locator) admits in one transaction with no second block
to discover an identifier [DERIVED INVARIANT — system-constitution.md:150-152].
Forward references (j > k) are rejected (`E_REF_UNSATISFIED`) — writers
topologically sort, which is always possible because RecordIds cannot form
reference cycles (a cycle would require hashing a hash of itself; the
encoding chapter's recursive-Type rules handle the SELF case).

This one-call graph rule is exclusively for `REF`/RecordId edges. For each
selected body in the ascending write-free shadow, Admission first resolves its
Type descriptor from persisted or earlier staged Type cache, then structurally
validates and extracts every bounded direct or optional `OCCREF`; equality
between any `ref.envelopeId` and the current EnvelopeId reverts
`E_SELF_ENVELOPE_OCCREF(sourceLeafIndex,ref.leafIndex)` before writes. Binding
predecessors, Withdrawal targets, and every other occurrence edge must therefore
name an independently precomputable external Envelope. Unselected carriage is
not semantically inspected. This placement lets leaf 0 bootstrap a Type cache
that leaf 1 safely uses without weakening the identity guard.

**Point-in-order shadow state [PROPOSAL — exact].** All non-idempotent
admissibility/effect decisions use one bounded in-memory shadow initialized
from persisted point reads. The verified current Envelope header/full
`recordIds[]` vector is staged only for eventual persistence, never for
occurrence-target resolution. Selected leaves then advance the shadow in
ascending `leafIndex` order.
The shadow owns prospective ordinals, touched OccStatus words, staged
Envelope/evidence/Type-cache availability, Binding head + revision + exact
source OccurrenceRef, every touched posting head/live count, and Record/unique
liveness folds. It also shadows first-touch Envelope, Type, and Principal
ordinal counters so log words and metadata are exact before replay. The only application effects are the closed list
`BIND_SET | BIND_TOMBSTONE | WITHDRAWAL`; ordinary leaves have `NONE`, and
intrinsic Type-cache materialization is structural bootstrap work.

At each selected leaf, Admission resolves the descriptor from persisted or
earlier staged Type cache, structurally validates the body, extracts and checks
OCCREF, classifies the closed effect kind, and associates the exact ordered
`expectedRevisions` item when applicable. All of this precedes source activation
or effects. A fresh TypeSchemaGroup stages its validated deterministic member
caches before the next selected leaf. Only then does Admission shadow-activate a
fresh source at its prospective ordinal, stage ordinary Record/index
consequences, and apply that leaf's effect. Therefore:

- every later selected leaf observes all legal earlier effects;
- two Withdrawal leaves may target one prior external occurrence: the first can
  be effective while the second sees terminal shadow state and has no target
  effect;
- two same-key Binding mutations in one Envelope cannot form a successful chain,
  because the second would have to name the first source using forbidden
  current-envelope OCCREF. If both instead name one prior head, the later CAS sees
  the earlier shadow update and the whole write-free preflight fails;
- successful bind→withdraw and sequential same-key Binding workflows use
  independently precomputed Envelopes through the atomic router.

Caller target-evidence cardinality is derived during this walk, not from one
stale pre-call status snapshot. Every fresh external
`NEVER_ADMITTED -> PRE_WITHDRAWN` consumes and stages one full canonical
`TargetEnvelopeEvidence` value at its Withdrawal's prospective
ordinal; a later terminal retry reuses that planned evidence. Every
`ValidatedOccurrenceLifecycleEffect` prior field,
`targetIsCurrentBindingHead`, Binding CAS input, and index/count delta is taken
from this point-in-order shadow.

The expected-revision cursor advances structurally for every selected
BindingSet/Tombstone leaf, including an ACTIVE duplicate. Only a fresh source
compares the associated value and predecessor against its current shadow head;
an ACTIVE source remains effect-free after descriptor/body/self-OCCREF checks.
Caller target evidence stays specific to its named Withdrawal and is never
cached as generic Envelope availability.

The all-selected-ACTIVE shortcut runs a smaller ascending retry guard before it
returns: every selected descriptor must resolve from persisted Type cache, its
body is structurally validated, and its bounded OCCREFs pass the same comparison.
No cache is staged and no unselected body is inspected. This pass precedes the
shortcut but does not replay application effects, policy, CAS, target-evidence
semantics, expiry, expected revisions, or intent/nonces.

After the whole plan and both ordered semantic-carriage cursors succeed,
commit persists the staged Envelope prelude and replays the identical ascending
leaf plan. It asserts each actual prestate equals the recorded shadow prestate,
including earlier sibling changes already written during replay. A mismatch is
an internal invariant panic that reverts everything, never a normal
input/evidence/CAS error after real ordinal allocation. No fallible verifier,
policy callback, evidence parse, or semantic decision runs during commit. The
shadow is bounded by `MAX_ENVELOPE_LEAVES`, per-leaf ref/posting caps, and the
wire/evidence caps.

**AdmissionIntent/1** [PROPOSAL — exact SR-3 semantic shape]:

```text
AdmissionIntent/1 = {
  realmId bytes32,
  envelopeId bytes32,
  leafMask uint64,
  action uint8,                    // MBZ = 0 = ADMIT in B0
  expectedRevisions[] of {
    leafIndex uint16,
    revision uint32
  },
  nonceKey uint192,
  nonceSeq uint64,
  notAfter uint64                   // unix seconds; 0 = no deadline
}
```

`expectedRevisions` is strictly leaf-index ordered and contains exactly one
entry for every selected CAS-bearing `BindingSet/1` or `BindingTombstone/1`
leaf, and no entry for an ordinary or `Withdrawal/1` leaf. Missing, extra,
duplicate, out-of-mask, or wrong-revision entries revert. Revision equality is
checked against the point-in-order shadow head for that leaf, not against one
pre-call snapshot. The
portable Binding body's `predecessorOccurrence` remains the other CAS half.

The exact commitment is:

```text
ExpectedRevision(uint16 leafIndex,uint32 revision)
AdmissionIntent(bytes32 realmId,bytes32 envelopeId,uint64 leafMask,uint8 action,ExpectedRevision[] expectedRevisions,uint192 nonceKey,uint64 nonceSeq,uint64 notAfter)ExpectedRevision(uint16 leafIndex,uint32 revision)

EXPECTED_REVISION_TYPEHASH = keccak256(
  "ExpectedRevision(uint16 leafIndex,uint32 revision)")
expectedRevisionsHash = keccak256(concat(
  keccak256(abi.encode(EXPECTED_REVISION_TYPEHASH,
                       item.leafIndex, item.revision))
  for item in expectedRevisions, in array order
))
INTENT_TYPEHASH = keccak256(
  "AdmissionIntent(bytes32 realmId,bytes32 envelopeId,uint64 leafMask,uint8 action,ExpectedRevision[] expectedRevisions,uint192 nonceKey,uint64 nonceSeq,uint64 notAfter)ExpectedRevision(uint16 leafIndex,uint32 revision)")
intentStructHash = keccak256(abi.encode(
  INTENT_TYPEHASH, realmId, envelopeId, leafMask, action,
  expectedRevisionsHash, nonceKey, nonceSeq, notAfter
))
DS_INT = keccak256(abi.encode(
  keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
  keccak256("EFS2-AdmissionIntent"), keccak256("1"),
  chainId, verifyingContract
))
eip712IntentDigest = keccak256(0x1901 || DS_INT || intentStructHash)
DOM_INTENT = keccak256("efs2/admission-intent/1")
IntentId = keccak256(abi.encode(DOM_INTENT, eip712IntentDigest))
```

`concat` is the EIP-712 concatenation of 32-byte element struct hashes; an
empty array hashes the empty byte string. Replay state is only sequential
lane state:

```solidity
mapping(bytes32 principalId => mapping(uint192 nonceKey => uint64 lastSeq))
    intentNonces;
mapping(uint64 batchId => uint256 packedLane) batchIntentLane;
```

For an explicit batch,
`packedLane=(uint256(nonceKey)<<64)|uint256(nonceSeq)` and `nonceSeq>=1`; for
implicit consent it is exactly zero. The word commits atomically with its
AdmissionBatch and is indexed by that enumerable batch id. The all-selected-
ACTIVE shortcut appends neither batch nor word.

On the non-idempotent path, explicit intent requires
`nonceSeq == lastSeq + 1`; the first accepted sequence is 1. The intent must
name this Realm and recomputed EnvelopeId, select a nonempty in-range mask, set
`action == 0`, and satisfy `notAfter` (`0` means no deadline; otherwise
`block.timestamp <= notAfter`); the signed envelope's own expiry must also
pass. The all-selected-ACTIVE shortcut in §5.5 occurs before these replay and
admissibility gates. There is no separate intent-event order: kernel effects
come only from accepted leaf Types in admission-ordinal order.

**Consent branches inside the one ABI.** Every selected kernel-effect leaf
requires explicit intent. Relayers and non-account Principals also require an
explicit author intent. The implicit-sender branch is internal to `publish`
and legal only when `msg.sender` is the account represented by the already
verified account Principal, no selected leaf has one of the three kernel-effect
Types, the selected
mask exactly equals the carried-body set, `intentBytes` encodes only that
`uint64 leafMask`, and `intentWitness` is empty. It is not a peer entrypoint.
Authorship still derives from the envelope witness; `msg.sender` supplies only
local consent.

`publishBatch` is an explicitly **non-Core** atomic-router composition over
independent `(envelopeBytes, principal, intentBytes, intentWitness)` elements.
The router invokes Core sequentially: prior successful call state is visible to
the next, while any later failure reverts the whole outer EVM transaction,
including earlier nonce and batch-lane writes. Every router element uses explicit
AdmissionIntent because the router, not the author account, is `msg.sender`; same-
Principal elements sharing a nonceKey carry consecutive nonceSeq values in call
order. Aggregators pre-validate wrong-author withdrawal, expiry, nonce, and CAS
failures. The router never appears in the Core ABI or semantics. Foreign uninvited
evidence enters only through source-qualified import/Recognition Records, not
as local destination truth.

**Required call order** [PROPOSAL — exact]:

```text
1 decode and enforce main-envelope structure, body/carriage bounds, and every
  target-evidence item's bounded syntactic shape; do not semantically match
  targetEvidence to effects yet
2 recompute the envelope digest and EnvelopeId
3 computePrincipalId(principal); assert equality with header.principalId
4 verify the envelope witness; retain its exact basis pair
5 decode consent carriage only far enough to derive the prospective explicit or
  implicit leafMask; enforce nonempty/in-range selection, selected body carriage,
  and selected body-to-RecordId commitments; do not semantically inspect
  unselected carriage; read each selected source OccStatus
6 EARLY-ACTIVE: if every selected source occurrence is ACTIVE, walk selected
  leaves ascending, resolve each descriptor from persisted Type cache,
  structurally validate the body, extract bounded OCCREFs, and enforce
  E_SELF_ENVELOPE_OCCREF. Then return existing PublishResult/receipts as
  ALREADY_ADMITTED. Do not semantically match or verify targetEvidence; do not
  replay effects/policy/CAS, either expiry, expected revisions, intent witness,
  or intent nonce; discard the newly observed envelope basis; append no
  AdmissionBatch and write nothing
7 NON-IDEMPOTENT CONSENT: reject selected terminal source occurrences, then fully
  verify explicit or implicit consent. Explicit consent must carry a fresh next
  nonce and canonically ordered expected-revision carriage; exact selected
  Binding coverage/value checks occur in the shadow; both expiries apply.
  Stage, but do not write, the nonce update plus this batch's packed nonzero lane
  word; implicit consent stages zero
8 initialize the shadow from persisted point reads. Stage the authenticated
  current Envelope only for persistence, never target resolution. Walk selected
  leaves ascending: resolve each descriptor from persisted or earlier staged Type
  cache; structurally validate the body; enforce E_SELF_ENVELOPE_OCCREF before
  source activation/effects; classify the effect and consume exact expected-
  revision coverage; validate/stage a fresh TypeSchemaGroup's member caches for
  later leaves; then check point-in-order references/policy/CAS, assign
  prospective ordinals without writes, and update occurrence/Binding/index/count
  shadow state exactly as commit. Derive/consume target evidence at each
  Withdrawal from that shadow
9 require expected-revision and target-evidence cursors exhausted, every bound
  and counter guard satisfied, and the complete leaf plan valid. No state has
  changed
10 commit the staged nonce, packed batchIntentLane word, and Envelope prelude,
  append one AdmissionBatch, then
  replay the exact leaf plan in the identical ascending order and prospective
  ordinals. Persist planned evidence before its target pointer. Every prestate
  mismatch is an internal assert/panic and reverts the call; commit makes no new
  input/evidence/authority/policy/CAS decision
```

The intrinsic `TypeSchemaGroup/1` branch participates in steps 8–10. When a
new bootstrap Record is encountered, Core validates `groupBytes` (R1–R3, E1
offset classes, `REF_INSTANCES_MAX=16`), derives every member TypeSchemaId,
stages the parsed cache, rejects any conflicting existing entry, and makes the
staged cache available to a later selected leaf in the same call. The Record,
occurrence, log, cache, and index writes commit together. The only application
Types that dispatch kernel effects are exactly
`{TYPE_BINDING_SET_V1, TYPE_BINDING_TOMBSTONE_V1, TYPE_WITHDRAWAL_V1}`;
bootstrap validation/cache work is not a fourth application effect. An
already-equal cache entry is a no-op, as is cache work on exact occurrence
re-admission. `registerTypeSchemaGroup` names only SDK construction of this
ordinary Record/envelope/consent and a call to `publish`; it is not a Core
transition.

### 5.5 Idempotent retry and partial-failure rules

[PROPOSAL — exact semantics]

- **Exact retry before evidence/effect/nonce preflight.** Every call first passes
  bounded wire/structural decoding, EnvelopeId recomputation, descriptor equality,
  envelope-witness authentication, selection decoding, and selected
  body-to-RecordId checks. If every selected source occurrence is then already
  ACTIVE, run the persisted-Type retry guard over selected leaves and reject any
  structurally invalid body or current-envelope OCCREF before returning each
  existing ordinal/receipt as `ALREADY_ADMITTED`. Do not inspect unselected
  carriage, semantically match `targetEvidence`, replay effects/policy/CAS,
  recheck either expiry, expected revisions or the explicit intent witness/nonce,
  append a batch, or write anything. Thus byte-for-byte retry of successful evidence-bearing T4
  calldata succeeds even though its original target evidence would be extra under
  non-idempotent cardinality. A mixed mask cannot take this shortcut: it requires
  a fresh valid next nonce and every evidence/effect/expiry/policy/CAS check;
  ACTIVE members still no-op while newly accepted members receive ordinals.
- **All-or-nothing preflight.** Any non-idempotent structural, Type, target-
  evidence, expiry, nonce, policy, or CAS failure reverts the whole call before
  ordinal allocation. Subset publication is explicit through `leafMask`, not a
  post-failure admit-the-valid-subset mode.
- **Retry-order conformance vectors.** After one evidence-backed T4 succeeds,
  advance past both signed expiries and replay its exact original calldata: the
  result MUST be the existing `ALREADY_ADMITTED` ordinal and every state word,
  nonce, batch count, and retained evidence byte MUST be unchanged. Oversize or
  malformed wire and a failing envelope witness still fail before the shortcut.
  Add a NEVER_ADMITTED leaf to form a mixed mask: the consumed intent and the old
  ACTIVE-source evidence MUST fail; only a fresh intent and the exact semantic
  evidence set for newly accepted T4 leaves may reach allocation.
- **Lifecycle transitions.** The complete overlay machine is:

```text
NEVER_ADMITTED -> ACTIVE          accept; allocate next ordinal
ACTIVE -> ACTIVE                  ALREADY_ADMITTED; existing receipt; no write
ACTIVE -> WITHDRAWN               effective author Withdrawal
NEVER_ADMITTED -> PRE_WITHDRAWN   authenticated pre-withdrawal
WITHDRAWN -> WITHDRAWN            duplicate withdrawal effect; no-op success
PRE_WITHDRAWN -> PRE_WITHDRAWN    duplicate withdrawal effect; no-op success
WITHDRAWN/PRE_WITHDRAWN -> reject any admission; no resurrection
```

  An effective Withdrawal occurrence receives its own accepted ordinal before
  that ordinal is written into the target's `revokedAtOrdinal`. The one-way
  ACTIVE flip drives exactly one index/live-count decrement; PRE_WITHDRAWN
  decrements nothing. Re-admitting the same Withdrawal occurrence is ordinary
  occurrence idempotence; a different author-valid Withdrawal targeting an
  already terminal occurrence is an accepted occurrence whose target effect
  is a no-op.
- **Authenticated pre-withdrawal.** A never-admitted target requires
  caller `TargetEnvelopeEvidence`. Current-envelope OCCREF is forbidden, so every
  such target is external and the first effective T4 always carries and retains
  the complete authenticated bundle: target signed header fields, the full committed
  `recordIds[]`, the target `(typeSchemaId, bodyHash)` commitment, target
  `AccountPrincipal`, and
  target witness.
  Preflight recomputes the target EnvelopeId, requires the exact target ID and
  target-leaf range, requires
  `keccak256(abi.encode(DOM_RECORD,typeSchemaId,bodyHash))` to equal the signed
  `recordIds[targetLeaf]` (so effect classification is total), requires
  `computePrincipalId(targetPrincipal) == targetHeader.principalId`, verifies
  the target witness, and only then compares target and withdrawing
  PrincipalIds. Missing, extra, duplicate, mismatched, or unauthenticated
  evidence reverts; a bare target ID never sets PRE_WITHDRAWN. On success, the accepted
  Withdrawal's ordinal retains
  the bounded canonical ABI re-encoding of the validated evidence and the
  target's `revokedAtOrdinal` points to it. Admission then passes only the
  shared typed `ValidatedOccurrenceLifecycleEffect` (target OccurrenceRef,
  occKey, authenticated Principal, evidence ordinal, lifecycle/effect/head
  context) into `LibIndex` and `LibBinding`; no opaque evidence bytes, peer
  proof grammar, or second author check crosses either seam. `LibIndex` remains
  the lifecycle/status owner, not an evidence verifier.
- **Terminal withdrawal retry.** A different author-valid Withdrawal targeting
  WITHDRAWN/PRE_WITHDRAWN is accepted but its target effect is a no-op. For a
  PRE_WITHDRAWN target, preflight loads the immutable original evidence through
  `revokedAtOrdinal`, checks its stored
  ID/range/descriptor linkage, and uses the already authenticated target
  Principal for the author comparison; it never asks the caller to resupply or
  replace evidence and never calls live target authority at read time. Exact
  retry of the same already-ACTIVE Withdrawal occurrence returns through
  occurrence idempotence before target-effect preflight.
- **Wrong author.** A Principal mismatch reverts the whole envelope with
  `ErrWithdrawNotAuthor`; it never admits inert kernel-class evidence.
- **Typed reverts.** The authorship/Realm-owned selector block is byte-identical
  to the authorship chapter; codes are ABI errors, not stored state:

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
error E_SELF_ENVELOPE_OCCREF(uint16 sourceLeafIndex, uint16 targetLeafIndex);
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

- **Policy hook.** Realm admission policy is a bounded, revisioned check
  inside the atomic call (`POLICY_GAS_MAX = 200,000` gas [PROPOSAL — value
  TBD-final by the V2-E4 costing; what decides it is the aggregate write
  budget]), identified by `policyCommitment` in the active revision; there
  are no Type-created admission callbacks [DERIVED INVARIANT — kickoff gate,
  fable-efs2-core-engineering-kickoff.md:92-93]. Policy acceptance/rejection
  never changes portable IDs [DERIVED INVARIANT — constitution acceptance
  trace "Type and admission validation", system-constitution.md:304].

### 5.6 EIP-7825 arithmetic — cap and Stage B hypotheses

Per QR-5 the venue ceiling is 16,777,216 gas [standards FACT]. It is a cap,
not proof that any candidate maximum fits. The shared candidate constants are
all [HYPOTHESIS] and Stage B re-derives them against Realm fixed cost,
state-readable body storage, per-occurrence `c_occ`, mandatory index fan-out,
Binding effects, and bootstrap cache materialization:


```text
MAX_ENVELOPE_LEAVES          = 64
MAX_ENVELOPE_BODY_BYTES      = 8,192
MAX_BODY_BYTES               = 8,192
MAX_BIND_LEAVES_PER_ENVELOPE = 64
MAX_TARGET_EVIDENCE_BYTES    = 8,192  // aggregate; one maximal legal item = 7,808
MAX_ENVELOPE_WIRE_BYTES      = 16,384
```

`TargetEnvelopeEvidence` contains a fixed 64-byte TypeSchemaId/bodyHash
commitment rather than a target body, so a target at `MAX_BODY_BYTES` remains
prewithdrawable. The maximal evidence item arithmetic is
`32 + 384 + 2,080 + 1,184 + 4,128 = 7,808` ABI bytes and fits the aggregate cap;
the enclosing wire cap remains independent and mandatory.

The shared feasibility equation is
`G_FIXED + c_bodies + Σ(selected new occurrences) c_occ ≤ G_TX_CAP`, with
the index chapter supplying mandatory posting/fold costs and the harness
owning measured values. No fixed slot count per leaf is assumed, and a maximal
legal envelope is not claimed to admit in one transaction. Selected-leaf
publication is the structural fallback; if measurements require a lower
constant, the change returns to James. `MAX_BATCH_ENVELOPES`, if measured at
all, belongs only to the optional SDK/router harness and never implies another
Core entrypoint.

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
  2 = CONFIRMATION_DEPTH(k)  // final at depth k; k = InitConfig.finalityParam
  3 = SEQUENCER_SOFT         // soft finality only; MUST be surfaced as such
  4-255 reserved
```
[PROPOSAL — table; the rule is Realm-declared fact, the *choice to rely on
it* is always the consumer's]. `finalityParam` MUST be nonzero for kind 2 and
MUST be zero for kinds 0, 1, and 3, so the same rule has one genesis spelling.

### 6.2 FinalityObservation — exact ABI

On-chain helper (same-Realm consumers):

```solidity
/// Age of one accepted occurrence, for challenge-window and depth rules.
/// Reverts E_BOUNDS if this occurrence has no accepted ordinal.
function admissionAge(OccurrenceRef calldata ref) external view
  returns (uint48 admittedAtBlock, uint48 currentBlock, uint64 confirmations);
```

Client-side named-basis read (normative result object)
**FinalityObservation/1** [PROPOSAL]:

```text
FinalityObservation/1 {
  realmId            bytes32
  occurrenceRef      OccurrenceRef      // exact receipt being observed
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

The three block notions do not alias: `admittedAtBlock` comes from the
occurrence's AdmissionBatch; `AuthorityBasisWord.basisBlock` is the verifier's
admission-time observation basis; and `observedAtBlock/observedBlockHash` name
the later finality read. A page's query `basisBlock` is page-scoped and does
not replace any receipt field.

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

Preserved in substance from standing owner authority [OWNER RULING —
2026-07-15 item F, owner-rulings.md:51-54, VERIFIED]. The ratified requirement
is that contracts needing certainty against untrusted authors use a
challenge-window pattern. The supporting TOCTOU analysis is separate: an
attacker controls timing, so a collision/duplicity bit cannot by itself make
an immediate gate safe. B0 consequence: admission maintains **no** collision
state, and the receipt's `admittedAtBlock` plus occurrence-scoped
`admissionAge()` let a consumer enforce
`confirmations >= W` before acting, then re-check the slot [PROPOSAL —
mechanism hook; exact collision-state mechanics remain unfrozen per the PM
directive line 21, and any future proposal to add kernel duplicity state must
first overcome the recorded TOCTOU refutation].

---

## 7. Upgrade history under one RealmId

### 7.1 State

```text
uint32 revisionCount;
mapping(uint32 => RealmRevision) revisions;       // 1-based, append-only
struct RealmRevision {                            // 4 slots
  bytes32 implementationCodehash;             // slot 0
  bytes32 policyCommitment;                   // slot 1
  bytes32 upgradeAuthorityRef;                // slot 2; current at activation
  // slot 3: activatedAtBlock u48;
  //         firstAdmissionOrdinal u48 — admissionCount + 1 at activation;
  //         reserved u160 MBZ
}

uint32 authorityTransitionCount;
mapping(uint32 => AuthorityTransition) authorityTransitions; // 1-based
struct AuthorityTransition {                    // 3 slots, append-only
  bytes32 oldRef;                               // slot 0
  bytes32 newRef;                               // slot 1
  // slot 2: activatedAtBlock u48;
  //         firstAdmissionOrdinal u48;
  //         revisionOrdinal u32;
  //         reserved u128 MBZ
}
```
[PROPOSAL] `InitConfig.upgradeAuthorityRef` is immutable genesis evidence;
`RealmRevision.upgradeAuthorityRef` is the authority current at that revision.
For non-NONE kinds, the reference has one canonical form:
`bytes32(uint256(uint160(controller)))`; the high 96 bits MUST be zero and the
low 160 bits are the immediate controller account. Kind 1 requires that account
to have no code at activation; kinds 2 and 3 require code at activation. This
classification is an activation-basis fact, not a promise that account code can
never change.

The implementation/admin read pattern is closed for B0:

```text
EIP1967_IMPLEMENTATION_SLOT = bytes32(uint256(keccak256(
  "eip1967.proxy.implementation")) - 1)
EIP1967_ADMIN_SLOT = bytes32(uint256(keccak256(
  "eip1967.proxy.admin")) - 1)

kind NONE:
  coreAddress is direct; both EIP-1967 slots are zero;
  implementationAddress = coreAddress; upgradeAuthorityRef = 0.

kinds 1..3:
  coreAddress is a UUPS-style proxy; IMPLEMENTATION_SLOT is a canonical
  zero-extended implementation address; ADMIN_SLOT MUST be zero;
  implementationAddress is that slot's address; the immediate controller is
  the canonical address word in currentUpgradeAuthorityRef.
```

The two slot words are Codex constants. A transparent-proxy admin, beacon,
second controller slot, constructor-only owner, or any other upgrade path is a
hidden authority and disqualifies the Realm. The Core's state-readable getters
in §8.2 expose the same implementation address and authority reference; clients
cross-check them against storage and `EXTCODEHASH` under C-5. This exact pattern
lets a controller rotation append its evidence in the same Core call instead of
changing an external admin slot invisibly.

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
  `policyCommitment`, current `upgradeAuthorityRef`,
  `activatedAtBlock = block.number`, and
  `firstAdmissionOrdinal = admissionCount + 1`. Revisions are append-only;
  `revisionOrdinal` and `activatedAtBlock` strictly increase. The stored
  boundary is u48 and every public read widens it to u64. Boundaries are
  **nondecreasing**, because multiple empty revisions can share the same next
  admission ordinal.
- **U-2a (recorded controller transition).** A controller change MUST occur in
  the same call as one new `RealmRevision` and one new
  `AuthorityTransition(oldRef,newRef,activatedAtBlock,
  firstAdmissionOrdinal,revisionOrdinal)`. `oldRef` MUST equal the preceding
  revision's ref; `newRef` MUST be canonical and nonzero; its block and first
  admission boundary MUST equal the paired revision; and its
  `revisionOrdinal` MUST name that revision. Transition ordinals and revision
  ordinals strictly increase; an implementation/policy revision with an
  unchanged controller appends no transition. No controller changes outside
  this path. Starting from immutable `InitConfig.upgradeAuthorityRef`, applying
  the enumerable transitions reconstructs the current ref exactly. Kind NONE
  permits no transition. For kinds 1..3, the account encoded by the old current
  ref is the only caller authorized to append a revision or transition; the
  new controller becomes effective only after the paired entries are stored.
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
- **U-4 (per-admission basis).** Every accepting call stores the explicit
  `revisionOrdinal` in its AdmissionBatch (§5.1); receipt reconstruction uses
  that value, never boundary inference or the current revision. Verification
  and interpretation of an old Occurrence use the recorded revision's basis.
  A later upgrade,
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
storage. A production Realm that needs immutable kind NONE is deployed that way
at genesis; a kind-1..3 Realm cannot silently relabel itself NONE. Terminal
sunset under U-6 disables writes but leaves its last nonzero authority ref and
complete transition history visible [PROPOSAL — consistent with STANDARDS lane
finding 18's scoped-role recommendation; ERC-7201 Final is a standards FACT,
VERIFIED via that finding].

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
W-1  GENESIS     read genesisFacts(): chainRef, protocolMajor/minor,
                 codexConstantsHash, every ordered InitConfig/1 field,
                 deployBlock, deployCodehash, profileId, initConfigHash,
                 genesisCommitment, and realmId. Re-encode InitConfig/1,
                 recompute all four hashes/IDs, and compare.
W-2  REVISIONS   n := revisionCount(); for i in 1..n read revisionAt(i);
                 require revisionOrdinal and activatedAtBlock strictly
                 increase, firstAdmissionOrdinal is nondecreasing, and each
                 boundary lies in 1..admissionCount+1. Recompute the exact
                 descriptor and every RealmRevisionId; the write rule was
                 admissionCount-at-activation + 1. Starting with the immutable
                 genesis upgradeAuthorityRef, enumerate authorityTransitionAt
                 (1..authorityTransitionCount), require one canonical chained
                 oldRef/newRef sequence and exact paired revision/block/first-
                 admission boundaries, and compare the result with the latest
                 revision plus currentUpgradeAuthorityRef().
W-3  ENVELOPES   enumerate envelopeOrdinal 1..envelopeCount; fetch the exact
                 persisted canonical unsigned bytes
                 `abi.encode(EnvelopeHeader, fullRecordIds)`. Recompute the
                 EIP-712 digest and EnvelopeId. Fetch the PrincipalRecord,
                 recompute PrincipalId, and require linkage to the header and
                 EnvelopeMeta. Do not claim to replay the unstored main witness.
W-4  ADMISSIONS  for ord in 1..admissionCount: read logSlotA/logSlotB; hydrate
                 the exact OccurrenceRef; recompute occKey; require
                 occStatus.ordinal == ord and status in {ACTIVE, WITHDRAWN}.
                 Resolve the logged typeOrd/principalOrd through their reverse
                 maps and compare them with the hydrated Record and envelope.
                 Find the admitting batch from its explicit firstOrdinal
                 boundary and reconstruct the logical receipt using that
                 batch's block, revision, AuthorityBasisWord, and codehash;
                 that immutable receipt is the historical validation evidence,
                 not a promise to re-run the unstored witness.
W-4a INTENTS      for batchId in 1..admissionBatchCount, read the batch and
                 admissionBatchIntentLane(batchId). Hydrate its first accepted
                 occurrence, derive the Envelope Principal, and ignore zero
                 (implicit). For every nonzero word decode nonceKey/nonceSeq,
                 require nonceSeq >= 1 and exactly prior reconstructed lane + 1,
                 then update that `(principalId,nonceKey)` lane. Finally compare
                 every reconstructed lane with intentNonceOf(principalId,
                 nonceKey). This batch walk closes the key universe; no intent
                 calldata, event stream, or private DB participates.
W-5  RECORDS     hydrate the selected leaf body; recompute RecordId and compare
                 with envelope.recordIds[leafIndex]. Process accepted ordinals
                 in order, not envelope-leaf order.
W-6  TYPES       when a Record is TypeSchemaGroup/1, validate groupBytes,
                 derive every member TypeSchemaId and deterministic parsed
                 cache entry, and compare cache point reads. Validate later
                 application Records against the reconstructed cache.
W-7  EFFECTS     replay exactly the Binding-set, Binding-tombstone, and
                 Withdrawal leaf-Type effects in admission-ordinal order.
                 Withdrawal Records derive ACTIVE->WITHDRAWN or
                 NEVER_ADMITTED->PRE_WITHDRAWN overlay results. For each
                 effective T4, require nonempty preWithdrawalEvidenceAt(ord), decode
                 the exact TargetEnvelopeEvidence, recompute target EnvelopeId
                 and leaf range, recompute target RecordId from the retained
                 TypeSchemaId/bodyHash commitment, assert
                 descriptor equality, replay the retained
                 target witness/author check at its recorded basis, and
                 require target.revokedAtOrdinal == ord. Empty evidence is valid
                 only when the target effect was not T4, including a terminal
                 no-op; no effective PRE_WITHDRAWN target lacks retained evidence.
W-8  INDEXES     replay deterministic postings, per-Record liveness, and count
                 folds from the same accepted-occurrence order; compare every
                 bounded index read, including its cursor/high-water/basis.
W-9  BINDINGS    replay Binding CAS/head folds from the same order and compare
                 point reads. Finally compare every reconstructed OccStatus,
                 including PRE_WITHDRAWN targets absent from the admission log;
                 every such target must point to one nonempty bounded evidence
                 value at its effective Withdrawal ordinal.
W-10 VERDICT     any mismatch at W-1..W-9 is a conformance failure of the
                 Realm or of one implementation — a Stage B golden-vector
                 category, and at runtime an UNQUALIFIED_REALM grading, never
                 a silent repair.
```

### 8.2 Exact reconstruction read ABI

```solidity
enum Completeness {
  UNKNOWN,       // 0; zero/default can never claim coverage
  COMPLETE,      // 1
  PARTIAL,       // 2
  UNSUPPORTED    // 3
}

struct PageRequest {                  // index-owner shape
  uint256 cursor;
  uint16 maxItems;
  uint64 basisOrdinal;                // 0 = current
}

struct PageResult {                   // index-owner six-part page tuple
  bytes32 realmBasis;
  uint64 highWaterOrdinal;
  uint256 cursor;
  bytes32[] items;
  uint32 coverage;
  Completeness completeness;
}

struct HydratedItem {
  uint64 ordinal;
  bytes32 envelopeId;
  uint16 leafIndex;
  bytes32 recordId;
  bytes32 principalId;
  uint8 occurrenceStatus;
  uint64 revokedAtOrdinal;
}

struct IndexedReceiptView {           // extended index view, not a second receipt
  bytes32 envelopeId;
  uint16 leafIndex;
  bytes32 realmId;
  bytes32 realmRevisionId;
  AuthorityBasisWord authorityBasis;
  bytes32 authorityCodehash;
  uint64 authEpoch;
  uint64 admissionOrdinal;
  uint48 admittedAtBlock;
  uint8 acceptedStatus;
  uint8 occurrenceStatus;
  uint64 revokedAtOrdinal;
}

enum BindingState { UNSET, BOUND, TOMBSTONED }

struct BindingHead {
  uint8 state;
  uint8 targetKind;
  uint8 tombstoneCause;
  uint32 revision;
  uint64 admissionOrdinal;
  bytes32 targetA;
  uint16 targetLeaf;
}

struct BindingHistoryEntry {
  uint32 revision;
  uint64 admissionOrdinal;
  bytes32 envelopeId;
  uint16 leafIndex;
  uint8 occurrenceStatus;
  uint64 revokedAtOrdinal;
}

struct SelectSpec {
  bytes32 typeSchemaId;
  uint8 roleOrdinal;
  uint8 scoreMode;
  uint8 scoreFieldOrdinal;
}

struct GenesisFactsView {
  // Chain/profile preimage facts, in canonical order.
  bytes8 chainNamespace;
  bytes32 chainReference;
  address core;
  uint16 protocolMajor;               // B0 = 0
  uint16 protocolMinor;               // B0 = 0
  bytes32 codexConstantsHash;

  // Exact InitConfig/1 tuple, in canonical order.
  uint16 initConfigVersion;            // = 1
  uint8 finalityRuleKind;
  uint32 finalityParam;
  uint8 upgradeAuthorityKind;
  bytes32 upgradeAuthorityRef;        // immutable genesis controller ref
  uint64 declaredTxGasLimit;
  bytes32 initialPolicyCommitment;

  // Remaining genesis preimages and recomputed outputs.
  uint48 deployBlock;
  bytes32 deployCodehash;
  bytes32 initConfigHash;
  bytes32 profileId;
  bytes32 genesisCommitment;
  bytes32 realmId_;
}

function realmId() external view returns (bytes32);
/// Returns every field needed to re-encode InitConfig/1 and recompute
/// initConfigHash, profileId, genesisCommitment, and RealmId; no hidden
/// implementation config is permitted to enter those formulas.
function genesisFacts() external view returns (GenesisFactsView memory);
function codexConstants() external view returns (bytes memory); // encoding ch.
function implementationAddress() external view returns (address);
function currentUpgradeAuthorityRef() external view returns (bytes32);
function revisionCount() external view returns (uint32);
function revisionAt(uint32 ordinal) external view returns (
  bytes32 implementationCodehash, bytes32 policyCommitment,
  bytes32 upgradeAuthorityRef, uint48 activatedAtBlock,
  uint64 firstAdmissionOrdinal, bytes32 revisionId);
function currentRevision() external view returns (
  uint32 ordinal, bytes32 revisionId, bytes32 implementationCodehash,
  bytes32 policyCommitment, bytes32 upgradeAuthorityRef,
  uint48 activatedAtBlock);
function authorityTransitionCount() external view returns (uint32);
function authorityTransitionAt(uint32 transitionOrdinal) external view returns (
  bytes32 oldRef, bytes32 newRef, uint48 activatedAtBlock,
  uint64 firstAdmissionOrdinal, uint32 revisionOrdinal);
function admissionCount() external view returns (uint64);
function envelopeCount() external view returns (uint40);
function envelopeIdByOrdinal(uint40 ordinal) external view returns (bytes32);
/// Exact canonical unsigned bytes `abi.encode(EnvelopeHeader, fullRecordIds)`.
/// Excludes the unstored main witness, bodies, target evidence, intent,
/// submitter/payer, and receipt material.
function getEnvelopeBytes(bytes32 envelopeId)
  external view returns (bytes memory canonicalUnsignedEnvelope);
function envelopeInfo(bytes32 envelopeId) external view returns (
  uint40 envelopeOrdinal, bytes32 principalId, uint16 leafCount);
function getPrincipalRecord(bytes32 principalId) external view
  returns (bytes memory descriptorBytes);
function typeSchemaIdByOrdinal(uint64 typeOrdinal) external view
  returns (bytes32 typeSchemaId);
function principalIdByOrdinal(uint64 principalOrdinal) external view
  returns (bytes32 principalId);
function occurrenceStatus(bytes32 envelopeId, uint16 leafIndex) external view
  returns (uint8 status, uint64 admissionOrdinal, uint64 revokedAtOrdinal);
function preWithdrawalEvidenceAt(uint64 withdrawalOrdinal) external view
  returns (bytes memory canonicalTargetEvidence);
  // rejects 0, values above admissionCount, and values above the physical u48
  // range. Empty iff that accepted Withdrawal caused no effective T4;
  // nonempty is <= MAX_ENVELOPE_BODY_BYTES and decodes as TargetEnvelopeEvidence.
function receiptOf(bytes32 envelopeId, uint16 leafIndex) external view
  returns (AdmissionReceiptView memory);      // logical AdmissionReceipt/1
function admissionAt(uint64 ordinal) external view
  returns (OccurrenceRef memory);             // direct two-word log read
function admissionPage(uint64 startOrdinal, uint16 maxCount) external view
  returns (OccurrenceRef[] memory page, uint64 nextCursor,
           Completeness completeness, uint64 highWater, uint48 basisBlock);
function admissionBatchCount() external view returns (uint64);
function admissionBatchAt(uint64 batchId) external view returns (
  uint64 firstOrdinal, uint16 acceptedCount, uint48 admittedAtBlock,
  uint32 revisionOrdinal, AuthorityBasisWord authorityBasis,
  bytes32 codehashOrZero);
/// Rejects zero or a value above admissionBatchCount. Zero means implicit;
/// explicit = (uint256(nonceKey)<<64)|nonceSeq with nonceSeq >= 1.
function admissionBatchIntentLane(uint64 batchId) external view
  returns (uint256 packedLane);
/// Point read used to compare the batch-order reconstruction with live replay state.
function intentNonceOf(bytes32 principalId, uint192 nonceKey) external view
  returns (uint64 lastSeq);
function admissionAge(OccurrenceRef calldata ref) external view
  returns (uint48 admittedAtBlock, uint48 currentBlock, uint64 confirmations);

// IRealmIndexRead/1 — byte-identical current index-owner signatures.
// Point reads:
function getTypeSchema(bytes32 typeSchemaId) external view returns (
  bytes memory canonicalBody, uint48 typeOrd, uint64 admitOrdinal,
  uint8 refRoleCount, uint8 indexSpecCount);
function getRecord(bytes32 recordId) external view returns (
  bytes32 typeSchemaId, bytes memory canonicalBody, uint64 firstAdmitOrdinal);
function getEnvelope(bytes32 envelopeId) external view returns (
  bytes memory canonicalUnsignedEnvelope, uint40 envelopeOrdinal,
  uint16 leafCount, bytes32 principalId, uint64 authEpoch);
function getOccurrence(bytes32 envelopeId, uint16 leafIndex) external view returns (
  uint8 status, uint64 ordinal, bytes32 recordId, bytes32 typeSchemaId,
  bytes32 principalId, uint64 revokedAtOrdinal);
function getOccurrenceByOrdinal(uint64 ordinal) external view returns (
  bytes32 envelopeId, uint16 leafIndex, bytes32 recordId,
  bytes32 typeSchemaId, bytes32 principalId, uint8 status,
  uint64 revokedAtOrdinal);
function getReceipt(uint64 ordinal) external view
  returns (IndexedReceiptView memory);

// Exact index-owner pages/counts/helpers:
function admissionLogPage(PageRequest calldata req) external view
  returns (PageResult memory);
function pagePostings(bytes32 typeSchemaId, uint8 indexKind,
                      uint8 indexOrdinal, bytes32 valueKey,
                      PageRequest calldata req) external view
  returns (PageResult memory);
function pagePostingsHydrated(bytes32 typeSchemaId, uint8 indexKind,
                              uint8 indexOrdinal, bytes32 valueKey,
                              PageRequest calldata req) external view
  returns (PageResult memory ordinals, HydratedItem[] memory hydrated);
function counts(bytes32 typeSchemaId, uint8 indexKind, uint8 indexOrdinal,
                bytes32 valueKey) external view returns (
  uint64 totalCount, uint64 liveCount, uint64 lastOrdinal,
  bytes32 realmBasis, uint64 highWaterOrdinal);
function lookupByDigest(uint16 algCode, bytes calldata digest,
                        PageRequest calldata req) external view
  returns (PageResult memory);
function getBindingHead(bytes32 bindingKey) external view returns (
  BindingHead memory head, bytes32 realmBasis, uint64 highWaterOrdinal);
function getBindingAtBasis(bytes32 bindingKey, uint64 basisOrdinal)
  external view returns (
    BindingHead memory head, bytes32 realmBasis, uint64 highWaterOrdinal);
function selectBestLocator(bytes32 targetKey, SelectSpec calldata spec,
                           uint64 basisOrdinal, uint256 cursor)
  external view returns (
    uint64 bestOrdinal, uint64 bestScore, uint16 postingsVisited,
    uint256 nextCursor, Completeness completeness);
// COMPLETE/PARTIAL with no eligible winner returns bestOrdinal=0,bestScore=0.
// Winner presence is tracked independently; a real candidate score of zero is
// valid and returns its nonzero ordinal.

// IBindingRead/1 — byte-identical current Binding-owner signatures.
function readHead(bytes32 bindingKey) external view
  returns (BindingHead memory);
function readHeadByPosition(bytes32 principalId, bytes32 purpose,
                            bytes32 subject, bytes32 fieldRole)
  external view returns (BindingHead memory, bytes32 bindingKey);
function readHeadBatch(bytes32[] calldata bindingKeys) external view
  returns (BindingHead[] memory);
function readHistory(bytes32 bindingKey, uint32 fromRevision, uint16 limit)
  external view returns (
    BindingHistoryEntry[] memory entries, uint32 nextRevision,
    uint8 completeness);
// Direct physical KIND_BINDING_HIST audit sequence: posting position r-1 is
// revision r. Withdrawal never filters/decrements it; status is hydrated.
function readOccurrenceStatus(bytes32 envelopeId, uint16 leafIndex)
  external view returns (
    uint8 status, uint64 ordinal, uint64 revokedAtOrdinal);
```
[PROPOSAL — every `PageResult`-shaped index read uses the same fail-closed enum
and returns cursor, high-water, and query basis. Truncation is `PARTIAL`; an
unsupported profile is `UNSUPPORTED`; an unavailable or unproven basis is
`UNKNOWN`. Binding-owned `readHistory` retains its exact owner shape
`(entries,nextRevision,uint8 completeness)` and is evaluated at the basis of
the enclosing `eth_call`; callers use the returned resume revision plus the
Binding head. Zero/default can never mean COMPLETE-empty. This external
completeness word is distinct from §4.2's semantic presence `UNKNOWN` and from
`BasisGrade`.]

Honest scope note: this walk reconstructs state **at the basis the RPC
serves** (latest, or any basis within QR-2's window). Reconstructing a *past*
snapshot needs archive state — a bonus under QR-2, never a requirement, and
never claimed by the guarantee [PROPOSAL — honesty boundary].

### 8.3 EAS adapter seam (specified here, exercised at V2-E8)

Per the PM directive (line 18): the loss-map is deferred to V2-E8; the seam
is pinned now [PROPOSAL]: an EAS adapter is an ordinary author and calls typed
`publish`; Core has no EAS entrypoint or fabricated verifier result. Foreign
attestation/carrier provenance enters in ordinary application Record bodies
and Recognition grading. EAS UIDs and schema UIDs are algorithm-tagged
ByteDigest values, never EFS identity. Imported evidence remains source-
qualified and cannot become local destination truth merely because an adapter
carried it. The V2-E8 loss-map fills in what survives round-trip, not a new
authority kind or write path.

---

## Interfaces exposed

The compact contract other chapters rely on:

- **ChainRef/1** `(bytes8 chainNamespace, bytes32 chainReference)`; eip155
  pinned; CAIP-2 human projection; ERC-7930 projection deferred until Final.
- **ID formulas**: `RealmId` (§2.2), `profileId` (§2.3), `genesisCommitment`
  (§2.4), `RealmRevisionId` (§2.5), occurrence key (§5.1), and `IntentId`
  (§5.4) — all use an SR-1 hashed domain word as the first fixed-width
  `abi.encode` field; variable structures enter as one `keccak256` word.
- **RealmDescriptor/1** three-section field set (§2.1); RealmId is the only
  identity; section C is untrusted.
- **Client MUST-checks C-1..C-7** (§3) — conformance list for any direct
  client, including the guest Web Client.
- **QR-1..QR-8** qualifying-Realm assumption names (§4.1) — cite these
  instead of inventing per-chapter chain assumptions.
- **BasisGrade** enum incl. `UNAVAILABLE_SOURCE_BASIS` with normative
  wording (§4.2); rules H-1..H-5. Presence and basis axes never collapse.
- **One Core mutation**: typed
  `publish(envelopeBytes, AccountPrincipal calldata principal, intentBytes,
  intentWitness) -> PublishResult`; descriptor equality precedes both witness
  checks. Implicit sender consent is a non-Binding internal branch. Batch is
  optional non-Core atomic-router composition over independent Envelopes; its
  sequential Core calls share one all-or-nothing outer EVM transaction (§5.4).
- **Exact AdmissionIntent/1**: Realm-bound EIP-712 commitment, selected
  `leafMask`, MBZ action, exact Binding expected-revision array, sequential
  `(principalId, nonceKey) -> lastSeq` lanes, enumerable packed
  `batchIntentLane` words with a point comparison getter, and
  `IntentId = keccak256(abi.encode(DOM_INTENT, eip712IntentDigest))` (§5.4).
- **Occurrence contract**: four-state OccStatus overlay; current-envelope OCCREF
  is a typed fail-before-write error; authenticated target evidence and wrong-
  author revert; every effective external T4 stores one bounded
  canonical value at the Withdrawal ordinal and terminal repeats load rather
  than resupply it; the all-selected-ACTIVE shortcut follows bounded structure
  plus envelope authentication but precedes semantic evidence/effect/expiry/
  intent replay checks, while mixed/new calls require full preflight and a fresh
  intent; no resurrection; sparse u64/public,
  u48/stored ordinals; reversible `logSlotA/logSlotB`; per-occurrence receipt
  reconstructed from explicit AdmissionBatch block/revision/exact
  AuthorityBasisWord/conditional codehash (§5.1–5.5).
- **Internal lifecycle seam**: Admission is the only
  `TargetEnvelopeEvidence` verifier and passes byte-identical
  `ValidatedOccurrenceLifecycleEffect` context to the status and Binding
  owners; neither downstream library accepts opaque proof bytes (§5.1/§5.5).
- **Intrinsic bootstrap**: ordinary accepted TypeSchemaGroup/1 Record plus
  atomic validation and deterministic Type cache materialization. The only
  application-effect Types are Binding set, Binding tombstone, and Withdrawal.
- **Finality**: occurrence-scoped `admissionAge(OccurrenceRef)` and
  `FinalityObservation/1`; admission, verifier, finality-read, and page-query
  bases remain distinct (§6).
- **Upgrade rules U-1..U-6**: activation boundaries are stored u48/public u64
  and nondecreasing; the immutable genesis authority ref plus enumerable
  controller transitions reconstruct current authority without hidden admin
  state; explicit batch revision owns receipt reconstruction; breaking change
  = new RealmId + successor evidence (§7).
- **Reconstruction ABI** (§8.2): the exact state-only Core reads plus the
  byte-identical named `IRealmIndexRead/1` and `IBindingRead/1` owner surfaces,
  covering envelope, occurrence/log, batch, enumerable nonce consumption and
  point replay state, retained pre-withdrawal evidence, Record, Type-cache,
  effects, index, and Binding comparison points; no intent event log or private DB.
- **Completeness**: one external byte vocabulary `UNKNOWN=0, COMPLETE=1,
  PARTIAL=2, UNSUPPORTED=3`; index `PageResult` pages carry
  cursor/high-water/basis, while Binding `readHistory` keeps its exact owner
  resume-revision shape at the enclosing call basis.
- **Named constants** (§5.6): shared SR-5 values remain Stage B hypotheses;
  selected-leaf publication is the structural fallback.
- **Depended-on seams**: Lane 2 (envelope codec, EnvelopeId preimage,
  full RecordId vector and state-readable body layout); Lane 3
  (`AccountPrincipal`, PrincipalRecord, exact verifier/basis/codehash); Lane 5
  (Binding CAS and the three leaf-driven effects); encoding chapter (canonical
  codec, exact TypeSchemaGroup validation/cache, codexConstantsHash).

## Open items

1. **Measured size/cost constants.** Stage B measures the shared SR-5
   candidates, full-body layout, per-occurrence mandatory fan-out, policy,
   target evidence, and bootstrap cache materialization against the Realm cap.
   A failing maximum shrinks the constants and returns to James; no query
   obligation is silently lost.
2. **Non-eip155 ChainRef namespaces.** Reserved, undefined in B0; ERC-7930
   adoption revisited when it leaves Review.
3. **State-proof client mode.** C-7(b) names `eth_getProof`; the exact
   proof-verification client profile is SDK-lane work.
4. **EAP fixture.** Provisional per PM directive; no admission-layer
   dependency was taken on it.
5. **Realm mortality scope.** The works-either-way mechanism is complete:
   qualifying assumptions plus `UNAVAILABLE_SOURCE_BASIS` define behavior.
   Whether the chains-don't-die ruling applies per Realm remains a candidate
   owner decision presented to James only through proposed spine edit A2 at
   Stage A review; B0 does not block on that answer.
6. **EAS loss map.** V2-E8 records what survives round-trip through ordinary
   publication and Recognition evidence. It may not create a reserved
   AuthorityBasis code, special Core entrypoint, or foreign-carrier identity.
7. **Self-OCCREF harness seam.** The disposable Stage B harness exposes the
   bounded internal equality guard so the exact typed revert/state-unchanged
   result is testable without adding a production entrypoint or constructing an
   impossible self-hashing Envelope. Envelope hashing and body extraction remain
   separately covered by their ordinary vectors.
