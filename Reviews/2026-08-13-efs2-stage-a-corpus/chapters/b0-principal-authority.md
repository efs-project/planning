# B0 Principal & Authority — AccountPrincipal/1, AuthorityVerifier/1, and the graduation seam

**Stage A chapter — post-red-team revision; not landed, adopts nothing.**

Lane 3 of the Stage A commissioned pass (2026-08-12). This chapter makes the B0
spine's axis-2 pin exact: **uniform `bytes32 PrincipalId` everywhere, plus an
intrinsic zero-setup account Principal**. It specifies the canonical
`AccountPrincipal/1` encoding and `PrincipalId` derivation with worked
examples, the versioned `AuthorityVerifier/1` with per-kind semantics, the
exact `AuthorityBasis` persisted into admission receipts, the EIP-7702
classification rules, the ERC-1271/ERC-6492 policy split, the graduation seam
to future managed Principals, the tagged `AuthorRef` alternative (bakeoff cell
F2) with its five decision results, and the EIP-8130 falsifier probe.

Chapter boundaries:

- **Owns:** Principal identity encoding, authority verification semantics,
  AuthorityBasis content and packing, principal-record persistence, the
  graduation seam contract.
- **Consumes as opaque:** Lane 4's canonical chain-reference bytes (`chainRef`)
  and `RealmId`/`RealmRevisionId`; the envelope chapter's signing digest and
  `EnvelopeId`; the encoding chapter's `canonicalBody` codec (unused here).
- **Provides to:** the admission chapter (the SR-13 identity assertion, the
  verify call, and the basis word + conditional codehash to persist),
  the index/Binding chapters (the full-width `PrincipalId` key discipline), the
  Lens chapter (receipt-based reads, never live authority calls), the fixture
  chapter (golden-vector categories at the end).

---

## 1. Imported invariants this chapter is built on

Each is restated once here and then used without re-argument.

- **AUTH-INV-1 (admission-time validation, persisted basis).**
  [DERIVED INVARIANT — kel.md §3 (failure table row "read-time KEL
  authorization → removed key signs later and backdates order/epoch") and §8.2
  ("Authoritative authorship is validated at the principal's authority-home
  admission… A signature has no trusted creation time")]. Authority is checked
  once per `publish` that passes bounded structure and descriptor equality,
  before the all-selected-ACTIVE classification. That no-op path discards the
  observation; only a
  non-idempotent accepting call persists the basis into each newly accepted
  occurrence's admission receipt through its admitting-call `AdmissionBatch`.
  An Envelope admitted in stages is reverified on every non-idempotent accepting
  call; no read path ever
  re-evaluates live authority for historical data.
- **AUTH-INV-2 (no `hasCode ? ERC1271 : ecrecover` dispatch).**
  [DERIVED INVARIANT — core-architecture-candidate.md §Principal lines 247–250;
  EIP-7702 live since Pectra 2025-05 (audit STANDARDS lane, VERIFIED): a
  delegated EOA has code while retaining key authority, so code-presence
  dispatch misclassifies]. The claimed `authorityKind` in the principal
  preimage — never account state — selects the verification algorithm.
- **AUTH-INV-3 (prospective revocation).** [DERIVED INVARIANT — kel.md §7.3
  "Actor removal is prospective. Home-admitted records retain historical
  attribution"]. No later authority change (rotation, graduation, delegation
  change, account upgrade) reclassifies an already-admitted Occurrence.
- **AUTH-INV-4 (no rail-derived authority).** [DERIVED INVARIANT —
  assumptions-and-requirements R-D8 via audit SURVIVORS lane: "authority never
  derives from msg.sender, a relayer, paymaster, wallet vendor, or submission
  rail"]. `AuthorityVerifier` reads no `msg.sender`, `tx.origin`, or payer
  context. Conformance vector: one envelope submitted by two different
  rails/sponsors against the same account state yields byte-identical
  `PrincipalId` and basis fields except `basisBlock`; if account state changes,
  the exact delegate/codehash difference is retained by each accepting batch,
  never attributed to the rail.
- **AUTH-INV-5 (full-width PrincipalId).** [DERIVED INVARIANT —
  system-constitution.md "Every Principal-bearing ID, ABI, storage key, index
  key, Binding, and Lens preserves the full bytes32 PrincipalId"]. Nothing in
  this chapter or downstream truncates to 160 bits.
- **AUTH-INV-6 (record identity excludes authority carriage).**
  [DERIVED INVARIANT — kel.md §8.1: "claimId remains logical-record based… and
  excludes actor/grant carriage so reauthorization does not change the
  record's identity"]. In B0 terms: `RecordId = H(dom ‖ TypeSchemaId ‖
  canonicalBody)` contains no principal, witness, or basis bytes; the
  authority seam lives in the Envelope. Structural consequence: republishing
  the same Record under different authority yields a new `EnvelopeId` (new
  Occurrence) and an unchanged `RecordId`.
- **AUTH-INV-7 (witness bytes are never identity).** [PROPOSAL — rationale:
  secp256k1 signatures are malleable pre-check, ERC-1271 witnesses are
  arbitrary account-chosen bytes that may vary per query; if any EFS id
  hashed witness bytes, one signer could mint distinct identities for one
  publication]. No EFS id (`EnvelopeId` included) may include witness bytes in
  its preimage. **Dependency on the envelope chapter:** `EnvelopeId` must be
  derived over the unsigned canonical envelope (kel.md §8.1's
  `envelopeDigest` shape is the evidence for feasibility).

---

## 2. AccountPrincipal/1 — canonical encoding

### 2.1 The struct

```solidity
struct AccountPrincipal {
    uint8 authorityKind;   // closed, versioned enum; see §2.2
    bytes originRef;       // Lane 4 canonical chain-reference bytes, or empty; see §2.3
    bytes accountOrKey;    // kind-specific canonical account/key bytes; see §2.4
}
```

### 2.2 authorityKind enum — `AuthorityKind/1`

[PROPOSAL — small, closed, append-only; version 1 values below. Rationale for
this exact set: EOA and ERC-1271 are the constitution's required day-one
authorities; raw P-256 is unblocked by the live EIP-7951 precompile (Fusaka,
2025-12-03 — audit STANDARDS lane, VERIFIED) and Final ERC-7913 verifier
ecosystem; RSA rides the same ERC-7913 wave for enterprise/HSM keys at near
zero marginal spec cost.]

| Value | Name | accountOrKey | originRef |
|---|---|---|---|
| 0 | `RESERVED_INVALID` | — | — (guards zero-initialized structs; never valid) |
| 1 | `EOA_SECP256K1` | 20-byte address | MUST be empty |
| 2 | `CONTRACT_ERC1271` | 20-byte address | MUST be Lane 4 chainRef (nonempty) |
| 3 | `KEY_P256` | 64 bytes: uncompressed point `x ‖ y`, each 32-byte big-endian | MUST be empty |
| 4 | `KEY_RSA` | DER `RSAPublicKey` (RFC 8017 A.1.1), 270–1024 bytes | MUST be empty |
| 5–255 | reserved | — | — (append-only; a value is never reassigned or re-semanticized) |

Enum evolution rule [PROPOSAL]: new kinds append under a bumped verifier
version (§3); an assigned `(kind, meaning)` pair is immutable forever. A
future PQ kind is reserved-by-policy but deliberately not minted until a
NIST-final scheme has a live EVM verifier (evidence: identity.md amendment 7's
five-conjunct PQ stack; the enum append rule is the reserved seam).

WebAuthn note [PROPOSAL — follows kel.md §5.1's `keyFamilyId` normalization
evidence]: WebAuthn P-256 credentials are **not** a separate kind. The key
family is the identity (`KEY_P256`); WebAuthn is a *witness profile* (§3.3),
so the same physical key produces the same `PrincipalId` whether it signs raw
or through an authenticator. Per-key RP/origin/UV *policy* cannot exist on a
zero-setup account Principal (there is no state to hold it); policy-bearing
keys are exactly what the managed-Principal graduation adds later.

ERC-7913 alignment [standards FACT vs EFS POLICY]: FACT — ERC-7913 is Final
and encodes a signer as `verifier‖key` where `verifier` is a contract address
(audit STANDARDS lane, VERIFIED). POLICY — EFS hashes only `(kind, key)` into
identity; the verifier contract/implementation is Realm configuration recorded
in `AuthorityBasis.verifierVersion`. Rationale: a verifier address is
chain-scoped, so embedding it would silently Realm-qualify an otherwise
portable key Principal — the misfit the audit lane flags. An ERC-7913 signer
string is a lossless *projection*: `abi.encodePacked(realmVerifierAddr, key)`.

### 2.3 Origin qualification rule

- **EOA and raw-key kinds are chain-independent.** [PROPOSAL — argument:
  possession of a secp256k1/P-256/RSA private key is pure mathematics; the
  verification equation reads no chain state; an EOA address is
  `keccak256(pubkey)[12:]` on every EVM chain, and the same signature verifies
  identically everywhere. Replay protection is not identity's job — it lives
  in the Envelope/AdmissionIntent replay domains (axis 3). Qualifying a key by
  chain would fracture one author into N Principals and break cross-Realm
  author-set portability for the Lens design center.]
- **Contract accounts are chain-qualified.** [DERIVED INVARIANT —
  core-architecture-candidate.md §Principal: "a contract-account authority is
  Realm-qualified unless a standard proves equivalent code/control across
  Realms"; evidence: the same address on two chains can hold different code or
  owners (different deployers, CREATE2 with different init code), so "the
  contract at address A" is not one authority across chains.]
  `originRef` carries **Lane 4's canonical chain-reference bytes** (the
  chain-scope reference, not an EFS-Realm-scope reference), consumed here as
  opaque bytes. [PROPOSAL — chain scope, not Realm scope, because the account
  is one contract for every EFS Realm deployed on that chain; Realm-scoping it
  would fracture backlinks between two Realms sharing one chain.]
  ⚠ dependsOn Lane 4: exact `chainRef` byte layout (ERC-7930 binary is the
  audit lane's candidate — FACT: ERC-7930 is Review-status, so the layout must
  be pinned in the Codex if adopted early).
- Structural rule [PROPOSAL]: `originRef` MUST be empty (length 0) for
  chain-independent kinds and MUST be nonempty for `CONTRACT_ERC1271`. A
  violation is structurally invalid (`AUTH_ORIGIN_FORBIDDEN` /
  `AUTH_ORIGIN_REQUIRED`), not ignored — otherwise one identity would have two
  encodings.

### 2.4 Canonical bytes and PrincipalId derivation

Per SR-1's two-level ID discipline, pinned for PrincipalId by SR-14
[PROPOSAL — program-wide]:

```text
DOM_PRINCIPAL = keccak256("efs2/principal/1")   // domain WORD (SR-1); the string is
                                                // registered in the encoding chapter's
                                                // closed table §1.3

descriptorBytes — the per-kind fixed canonical layout (packed; byte-identical
to the stored PrincipalRecord, §2.7):
  byte  0        authorityKind (uint8)
  byte  1        originLen (uint8; 0 for chain-independent kinds)
  bytes 2..      originRef (originLen bytes)
  bytes ..end    accountOrKey (kind-fixed length: 20 B kinds 1/2, 64 B kind 3;
                 DER self-delimiting for kind 4)

PrincipalId = keccak256(abi.encode(DOM_PRINCIPAL,
                                   uint256(authorityKind),
                                   keccak256(descriptorBytes)))
```

The outer preimage is exactly three 32-byte words (96 bytes): every field is
a fixed-width word and the only variable-length component enters pre-hashed —
SR-1's one-nesting-level rule; no dynamic-tail ABI ambiguity reaches the
outer preimage. The kind appears twice by design: as the outer word (cheap
kind dispatch and audit without descriptor recovery) and as descriptorBytes
byte 0 (the stored record stays self-describing); V1 requires the two equal.
Injectivity: given V1–V5, the packed layout parses uniquely (the kind fixes
the accountOrKey length; originLen delimits originRef), so no two distinct
valid structs share one descriptorBytes. [DERIVED INVARIANT — from the
layout plus V1–V5.]

Superseded arm [REJECTED — SR-1/SR-14]: the draft's raw-ASCII-prefix form
`keccak256("efs2/principal/1" ‖ abi.encode(uint8 kind, bytes originRef,
bytes accountOrKey))` — inline dynamic tails, no pre-hash — is retired. It
violated the fixed-width preimage rule and needed a re-encode byte-match
patch (the old V6) against ABI-offset malleation; it is kept here only as
the labeled sub-variant sketch for traceability.

Structural validation (admission rejects on failure, typed errors §3.6):

- V1: `authorityKind ∈ {1,2,3,4}` (version 1).
- V2: `accountOrKey` length exactly 20 (kinds 1,2), exactly 64 (kind 3), or
  270–`MAX_ACCOUNT_OR_KEY_BYTES` with well-formed DER `RSAPublicKey` (kind 4).
- V3: origin presence per §2.3; `len(originRef) ≤ MAX_ORIGIN_REF_BYTES`.
- V4 (kind 3): `x` and `y` each < p and `(x,y)` satisfies the P-256 curve
  equation and is not the point at infinity. [PROPOSAL — on-chain check is ~2
  mulmods; prevents identity squatting on non-keys.]
- V5 (kind 4): modulus length 2048–4096 bits, odd; exponent exactly 65537.
  [PROPOSAL — matches dominant practice and the shipped OZ ERC-7913 RSA
  verifier's expectations; PLAUSIBLE, verify against OZ source before freeze.]
- V6 (construction rule; replaces the draft's re-encode byte-match):
  identity is computed ONLY from parsed, validated fields via the packed
  descriptorBytes — no implementation may hash raw submitted ABI bytes.
  Malleation-proofness is by construction under SR-14 (any ABI encoding of
  the same fields decodes to the same fields, hence the same descriptorBytes
  and the same PrincipalId); the reject-on-mismatch rule is retired with the
  old preimage. [PROPOSAL]

### 2.5 Worked examples — regenerate at Stage B vector mint

The draft carried computed PrincipalId values here; those bytes were minted
against the retired preimage (§2.4's superseded arm) and are void under
SR-14. The example inputs and the derivation walk below stay normative; the
output values are deliberately NOT carried — they regenerate at Stage B
vector mint (`PID-DERIVE`, GV-3) under the SR-14 preimage, so no
possibly-stale bytes ride this chapter. [PROPOSAL — per SR-14's
"worked examples regenerate" clause.]

**Example A — EOA.** The canonical dev-chain account #0,
`accountOrKey = 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266` (lowercase = raw
20 bytes; hex case is presentation, bytes are bytes).

```text
descriptorBytes = 0x01 ‖ 0x00 ‖ f39fd6e51aad88f6f4ce6ab8827279cfffb92266   (22 bytes)
preimage        = abi.encode(DOM_PRINCIPAL, 1, keccak256(descriptorBytes))  (96 bytes)
PrincipalId     = keccak256(preimage)        — regenerate at Stage B vector mint
```

**Example B — raw P-256 key** (RFC 6979 A.2.5 public key,
`x = 0x60fed4ba…60f29fb6`, `y = 0x7903fe10…d4462299`):
`descriptorBytes = 0x03 ‖ 0x00 ‖ x ‖ y` (66 bytes) — regenerate at Stage B
vector mint.

**Example C — contract account** (kind 2, address
`0x2222222222222222222222222222222222222222`, `originRef` = Lane 4's
canonical chainRef of chainid 11155111):
`descriptorBytes = 0x02 ‖ originLen ‖ chainRef ‖ address` — doubly gated:
Lane 4 must pin the chainRef byte layout before the descriptor is even
constructible; the value then regenerates at Stage B vector mint together
with A and B. The derivation rule is stable now; only the bytes wait.

### 2.6 The low-160-bit collision fixture — honesty note

The constitution's R-D2 gate requires two Principals with identical low 160
bits exercised end to end. Finding two *real* keccak-derived PrincipalIds
sharing 160 bits is a ~2^80 birthday search — not crypto-broken, but far
beyond any test budget. [DERIVED INVARIANT consequence — the fixture must
inject synthetic PrincipalIds through a test-only storage harness that
bypasses derivation, exercising every ABI/storage/index/Binding/Lens path
with hand-crafted colliding ids.] The fixtures chapter should carry this as a
named vector category (`PID-LOW160`); any code path that *cannot* accept an
injected full-width id (because it re-derives from an address) is itself a
finding — it means an address, not the PrincipalId, is being keyed somewhere.

### 2.7 First-use principal record (state-readable reconstruction)

[PROPOSAL — rationale: the constitution requires a second implementation to
reconstruct authoritative state from Realm state alone. If `AccountPrincipal`
preimages only ever rode calldata, `PrincipalId → account` would be
unreconstructable for non-EOA kinds (no ecrecover trick exists for P-256/RSA/
1271). So the Core persists the packed preimage once, on first successful
admission.]

```text
PrincipalRecord (packed bytes, stored once per PrincipalId per Realm):
  byte  0        authorityKind
  byte  1        originLen (uint8)
  bytes 2..      originRef (originLen bytes)
  bytes ..end    accountOrKey
Storage: mapping(bytes32 principalId => bytes) principalRecord;
Sizes: EOA 22 B (1 slot of data), P-256 66 B (3 slots), contract 22+originLen,
RSA ≤ 1026 B. One-time cost at first admission; amortized to zero thereafter.
```

`PrincipalRecord` IS `descriptorBytes` verbatim (§2.4): the Realm stores
exactly the preimage it hashed. Persistence takes its bytes from the SR-13
calldata channel — `publish()`'s `AccountPrincipal calldata principal`
argument (§3.2) — after the identity assertion and a successful `verify`,
never from any other source. [DERIVED INVARIANT — SR-13/SR-14:
store-what-you-hashed keeps reconstruction byte-faithful.]

**This is not a setup transaction** — it happens inside the first admission's
own call; `PrincipalId` remains computable fully offline; candidate falsifier
1 ("first authorship needs a separate registration block") stays satisfied.

Per-Realm principal state machine [PROPOSAL]:

```text
States:  UNSEEN → REGISTERED → GOVERNED           (append-only; no back edges)
T1 firstAdmission:   UNSEEN → REGISTERED   — first accepted Occurrence by this
                     Principal in this Realm; writes PrincipalRecord.
T2 graduationAdmitted: REGISTERED → GOVERNED — reserved seam (§6); prospective
                     from its own AdmissionOrdinal.
(no T3: nothing ever deletes or rewrites a PrincipalRecord)
```

---

## 3. AuthorityVerifier/1

### 3.1 Placement and versioning

Per axis-6 pin (one atomic Core, narrow logical modules as internal
libraries), `AuthorityVerifierV1` is an **internal library** of the Core, not
an external contract. It is still *logically versioned*:
`AUTHORITY_VERIFIER_VERSION = 1` (uint16 constant). A Core upgrade that
changes any verification semantic MUST bump the version; the version active at
admission is persisted in every `AuthorityBasis`. A version never
retro-changes the meaning of an already-recorded `(kind, version)` pair.
[DERIVED INVARIANT — constitution "Historical admission records the authority
and implementation basis used at admission… does not silently reinterpret an
old Occurrence".]

### 3.2 Interface

```solidity
type AuthorityBasisWord is bytes32;          // packed; layout in §3.5

struct VerifyContext {
    bytes32 selfChainRefHash;   // keccak256(Lane 4 canonical chainRef of this Realm's chain),
                                // pinned in the Realm descriptor at deployment (dependsOn Lane 4)
    uint64  blockNumber;        // block.number of the admitting tx
}

library AuthorityVerifierV1 {
    uint16 internal constant AUTHORITY_VERIFIER_VERSION = 1;

    function computePrincipalId(AccountPrincipal calldata p)
        internal pure returns (bytes32);

    /// Verifies that `witness` proves the authority named by `principal`
    /// over `digest`. Reverts with a typed error on failure; returns the
    /// packed basis plus the observed codehash (zero for every non-contract
    /// kind). Reads NO msg.sender/tx.origin (AUTH-INV-4).
    function verify(
        AccountPrincipal calldata principal,
        bytes32 digest,
        bytes calldata witness,
        VerifyContext memory ctx
    ) internal view returns (AuthorityBasisWord basis, bytes32 codehashOrZero);
}

// External pre-flight mirrors on the Core (view/pure, no state effects):
function computePrincipalId(AccountPrincipal calldata p) external pure returns (bytes32);
function previewAuthority(AccountPrincipal calldata p, bytes32 digest, bytes calldata witness)
    external view returns (AuthorityBasisWord basis, bytes32 codehashOrZero);
```

**Carriage and the identity assertion (SR-13, normative).** This
struct-consuming signature is THE one verifier shape program-wide, with the
unified return pair `(AuthorityBasisWord, bytes32 codehashOrZero)`. The
bytes32-only shape (`verify(bytes32 principalId, bytes32 digest, bytes
witness)`) that the authorship and realm drafts assumed is [REJECTED —
superseded by SR-13]: a `PrincipalId` is a hash whose preimage is not yet in
state at first admission, so a bytes32-only verifier has no key material to
check for kinds 2/3/4 — non-EOA authors were unimplementable under it; it is
kept only as this labeled rejected sketch. The preimage's calldata channel
is the entrypoint itself:
`publish(envelopeBytes, AccountPrincipal calldata principal, intentBytes,
intentWitness)` (SR-12 as amended by SR-13). Before any witness
verification, admission MUST assert

```text
computePrincipalId(principal) == envelope.header.principalId
```

and revert `AUTH_PRINCIPAL_MISMATCH(declared, computed)` on failure.
Forgery rationale: `verify` checks the witness against the SUPPLIED struct's
account — that is its whole contract. Without the assertion, an attacker
submits an envelope whose header declares a victim's `principalId` while
supplying the attacker's own `AccountPrincipal` and a valid self-signed
witness; verification passes, the receipt records the victim's id, and every
index/Binding/Lens read attributes the publication to the victim. The
assertion closes the chain: **nothing may bind a verified account to a
different declared principalId.** [DERIVED INVARIANT — SR-13; the identity
chain descriptor → PrincipalId → envelope header → witness is only as strong
as its weakest asserted link.] First-use `PrincipalRecord` persistence
(§2.7) takes its bytes from exactly this verified calldata struct.

`digest` is the 32-byte semantic signing digest **owned by the envelope
chapter** (its EIP-712 preparation, replay domain, and nonce design live
there; the audit STANDARDS lane's EIP-712 finding binds that chapter, not
this one). This verifier's contract is: witness proves authority over the
supplied digest, whatever it commits to. One verification covers one `publish`
call that reaches occurrence classification. An all-selected-ACTIVE call
discards the returned pair and writes nothing; every occurrence newly accepted
by a non-idempotent call resolves its pair through that call's
`AdmissionBatch`. Later staged admission of another occurrence from the same
Envelope performs a new verification and may retain a different
block/delegate/codehash basis.

### 3.3 Witness encodings — `WitnessProfile/1`

| Value | Name | Bytes | Verifier version |
|---|---|---|---|
| 0 | `WP_INVALID` | — | never valid |
| 1 | `WP_SECP256K1_RAW65` | `r(32) ‖ s(32) ‖ v(1)`, v ∈ {27,28} | 1 |
| 2 | `WP_ERC1271_CALL` | opaque bytes forwarded to `isValidSignature` | 1 |
| 3 | `WP_P256_RAW64` | `r(32) ‖ s(32)` | 1 |
| 4 | `WP_RSA_PKCS1_SHA256` | `sig` (modulus-length bytes) | 1 |
| 5 | `WP_P256_WEBAUTHN` | reserved | **2 (reserved)** — see below |

The witness rides the Envelope as
`authorityWitness = abi.encodePacked(uint8 witnessProfile, bytes payload)`,
bounded by `MAX_WITNESS_BYTES`. Profile-to-kind compatibility is a closed
table (1→kind 1, 2→kind 2, 3→kind 3, 4→kind 4); a mismatch is
`AUTH_WITNESS_PROFILE_UNSUPPORTED`.

`WP_P256_WEBAUTHN` is deliberately **not** in verifier v1.
[HYPOTHESIS — a strict WebAuthn envelope profile (authenticatorData flags/UV
policy, clientDataJSON challenge binding to `digest`) can be pinned such that
vectors from ≥2 real authenticator families verify identically; falsified if
real authenticator families require incompatible relaxations. Evidence gate
inherited from identity.md amendment 7. Shipping it later as verifier v2 with
the same `KEY_P256` kind is itself the planned demonstration that verifier
versioning adds witness profiles without touching identity or history.]

### 3.4 v1 semantics per authorityKind (deterministic pseudocode)

```text
verify(p, digest, witness, ctx):
  // PRE: admission has already asserted computePrincipalId(p) ==
  //      envelope.header.principalId (SR-13, §3.2); the verifier itself
  //      does not re-check — it is pure over its supplied inputs.
  structurally validate p            (V1..V5; §2.4)  else revert typed
  require len(witness) <= MAX_WITNESS_BYTES          else AUTH_WITNESS_OVERSIZE
  profile = witness[0]; payload = witness[1:]
  require profileCompatible(profile, p.authorityKind) else AUTH_WITNESS_PROFILE_UNSUPPORTED

  case p.authorityKind of

  EOA_SECP256K1:                                     // profile WP_SECP256K1_RAW65
    require len(payload) == 65                       else AUTH_SIG_INVALID
    (r, s, v) = split(payload)
    require v in {27, 28}                            else AUTH_SIG_MALLEABLE
    require uint(s) <= SECP256K1_HALF_N              else AUTH_SIG_MALLEABLE   // EIP-2 low-s
    a = ecrecover(digest, v, r, s)                   // precompile 0x01, 3000 gas
    require a != 0 && a == address(p.accountOrKey)   else AUTH_SIG_INVALID
    // 7702 observation (does NOT affect the verdict; AUTH-INV-2):
    cs = EXTCODESIZE(a)
    if cs == 0:              delegate = 0
    elif cs == 23 && code[0..2] == 0xef0100:  delegate = address(code[3..22])
    else:                    revert AUTH_EOA_UNEXPECTED_CODE(a)   // defensive; unreachable under EIP-7702 rules
    return (pack(kind=1, ver=1, profile=1, block=ctx.blockNumber, delegate), 0)

  CONTRACT_ERC1271:                                  // profile WP_ERC1271_CALL
    require keccak256(p.originRef) == ctx.selfChainRefHash
                                                     else AUTH_FOREIGN_ORIGIN
    a = address(p.accountOrKey)
    require EXTCODESIZE(a) > 0                       else AUTH_1271_NO_CODE    // ERC-6492 is pre-flight only; §5
    (ok, ret) = STATICCALL{gas: ERC1271_VERIFY_GAS}(
                  a, abi.encodeCall(isValidSignature, (digest, payload)))
    // copy AT MOST 32 returndata bytes (unbounded-returndata defense)
    require ok                                       else AUTH_1271_CALL_FAILED
    require len(ret) == 32 && bytes4(ret) == 0x1626ba7e
                                                     else AUTH_1271_REJECTED
    codehashOrZero = EXTCODEHASH(a)                  // second return word; §3.5
    return (pack(kind=2, ver=1, profile=2, block=ctx.blockNumber, delegate=0), codehashOrZero)

  KEY_P256:                                          // profile WP_P256_RAW64
    require len(payload) == 64                       else AUTH_SIG_INVALID
    (r, s) = split(payload)
    require uint(s) <= P256_HALF_N                   else AUTH_SIG_MALLEABLE   // deterministic low-s; SDK normalizes
    out = CALL precompile P256VERIFY (0x…0100) with digest‖r‖s‖x‖y  (160 B in) // EIP-7951, 6900 gas
    require out == uint256(1)                        else AUTH_SIG_INVALID
    return (pack(kind=3, ver=1, profile=3, block=ctx.blockNumber, delegate=0), 0)

  KEY_RSA:                                           // profile WP_RSA_PKCS1_SHA256
    require len(payload) == modulusLen(p)            else AUTH_SIG_INVALID
    em = MODEXP(payload, 65537, n)                   // precompile 0x05; ~5.5k gas at 2048-bit (EIP-2565)
    require em == EMSA-PKCS1-v1_5(DigestInfo(sha256, digest), modulusLen)
                                                     else AUTH_SIG_INVALID
    // `digest` is used AS the precomputed SHA-256 hash value inside DigestInfo;
    // signers sign the raw 32-byte digest via any standard "sign prehashed" API.
    return (pack(kind=4, ver=1, profile=4, block=ctx.blockNumber, delegate=0), 0)
```

Notes:

- Low-s enforcement on both curves [PROPOSAL — determinism hygiene: witness
  bytes never enter identity (AUTH-INV-7), but deterministic acceptance keeps
  retry idempotency and golden vectors byte-stable; the SDK normalizes s
  before submission].
- `AUTH_FOREIGN_ORIGIN` is honest unavailability, not a validity verdict: a
  contract-account Principal from another chain simply cannot pass **live**
  authority verification in this Realm, because its source basis (that
  chain's state) is unavailable here. Per the PM directive (no dead-chain
  machinery; define honest behavior when a source basis is unavailable), the
  admission fails with the typed error; carrying such material as
  source-qualified *evidence without live authority* is the admission
  chapter's import lane, and no receipt of this Realm ever claims it verified
  foreign contract authority. [PROPOSAL]
- The ERC-1271 call is the only external call in the verifier; it is
  STATICCALL (no reentrancy into state) with a hard gas cap and 32-byte
  returndata copy. [PROPOSAL — cap value TBD by V2-E1 benchmark; see §3.7.]

### 3.5 AuthorityBasis — exact persisted form

One packed word, plus one conditional word for contract accounts
[PROPOSAL — packing chosen so the dominant kinds (EOA, keys) cost exactly one
SSTORE slot in the receipt]:

```text
AuthorityBasisWord (bytes32; byte 0 = most significant):
  byte  0       authorityKind     (uint8)
  bytes 1–2     verifierVersion   (uint16, big-endian)
  byte  3       witnessProfile    (uint8)
  bytes 4–11    basisBlock        (uint64, big-endian; block.number at admission)
  bytes 12–31   delegateOrZero    (20 bytes; EIP-7702 delegate observed for
                                   EOA kind, else zero)

contractCodehash (bytes32, second slot, ONLY when authorityKind == CONTRACT_ERC1271):
  EXTCODEHASH(account) at admission
```

Bit budget (SR-7, explicit): **8 + 16 + 8 + 64 + 160 = 256** — the word
packs exactly; no reserved bits, no aliasing, and an all-zero word is
invalid (kind 0 = `RESERVED_INVALID`). `authEpoch` is deliberately NOT a
basis-word field: it lives in the envelope header (SR-2); the basis word
records how authority was verified, the header records which authority epoch
was claimed. Return vs persistence: `verify` returns the uniform pair
`(AuthorityBasisWord, bytes32 codehashOrZero)` (SR-13); the PERSISTED form
stays one word plus one conditional slot — `codehashOrZero` is nonzero iff
`authorityKind == CONTRACT_ERC1271`, and a zero second word is never stored.
Per SR-7 this word is the receipt's exact authority-basis value. The admitting
call stores the pair once in its `AdmissionBatch`; each occurrence newly
accepted by that call resolves its immutable receipt through that batch.
`EnvelopeMeta` stores no singular authority basis. The compressed
`authorityBasisCode u16` projection is retired, and the authorship chapter's
four-field basis struct is superseded (it regenerates as a partial projection
of this word, not a peer encoding).

Persisted **per non-idempotent accepting call**, with one batch shared only by
the occurrences newly accepted in that call (Lane 4/admission owns the batch
and receipt spine; this chapter owns these bytes). A staged call for the same
Envelope may record a different pair. The logical receipt additionally carries
`RealmRevisionId` and `AdmissionOrdinal` (admission chapter), so the complete
historical interpretation context is:
`(PrincipalId, AuthorityBasisWord [, contractCodehash], RealmRevisionId,
AdmissionOrdinal)`.

Why each field exists:

- `authorityKind` + `verifierVersion`: the frozen interpretation key — a
  future reader replays *these* rules, never current ones (AUTH-INV-1/3).
- `witnessProfile`: distinguishes e.g. raw vs WebAuthn P-256 admissions once
  verifier v2 exists, without a new kind.
- `basisBlock`: the Realm-local observation point; finality over it is
  observed later against Lane 4's finality-observation seam, never claimed by
  the receipt itself (kel.md §8.2 evidence: a contract cannot know its own
  block's finality).
- `delegateOrZero` / `contractCodehash`: the account-state observation that
  makes later account upgrades incapable of reinterpreting history — the
  exact code (or delegation) that answered at admission is pinned forever.
  [DERIVED INVARIANT — constitution authority-history trace; audit STANDARDS
  lane's 1271 re-earning condition: "basis-pinning as the price".]

Reference constants (computed, VERIFIED):

```text
EMPTY_ACCOUNT_CODEHASH = keccak256("")
  = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
Example 7702 designator codehash, delegate 0x1111…11:
  keccak256(0xef0100 ‖ 0x1111111111111111111111111111111111111111)
  = 0xdfe7c7677e3d245aaff2e3e94db902f5fb37475eb611959c71ee641508dcf49a
Example, delegate 0x3333…33:
  = 0x7ca83f12251099bf9a00938050c48404aa08f921268d32b90fdb5088ec630b2e
```

### 3.6 Typed errors (closed list, v1)

```solidity
error AUTH_KIND_INVALID(uint8 kind);
error AUTH_STRUCT_INVALID();                 // V2/V4/V5 failures
error AUTH_PRINCIPAL_MISMATCH(bytes32 declared, bytes32 computed);  // SR-13 identity assertion
error AUTH_ORIGIN_REQUIRED();
error AUTH_ORIGIN_FORBIDDEN();
error AUTH_FOREIGN_ORIGIN(bytes32 got, bytes32 self);
error AUTH_SIG_INVALID();
error AUTH_SIG_MALLEABLE();
error AUTH_EOA_UNEXPECTED_CODE(address account);
error AUTH_1271_NO_CODE(address account);
error AUTH_1271_CALL_FAILED();
error AUTH_1271_REJECTED(bytes4 got);
error AUTH_WITNESS_OVERSIZE(uint256 len);
error AUTH_WITNESS_PROFILE_UNSUPPORTED(uint8 profile);
```

A failed verification reverts the admission call (all-or-nothing per the
one-transaction gate); no rejected-attempt receipt persists (candidate
§Admission receipt). `AUTH_PRINCIPAL_MISMATCH` is raised by the admission
path's SR-13 assertion, before `verify` is ever entered; it lives in this
closed list because this chapter owns the identity chain.

### 3.7 Named constants and EIP-7825 arithmetic

| Constant | Value | Decided by |
|---|---|---|
| `DOM_PRINCIPAL` | `keccak256("efs2/principal/1")` | SR-14; the string is registered in the encoding chapter's closed table §1.3 [PROPOSAL] |
| `AUTHORITY_VERIFIER_VERSION` | 1 | this chapter |
| `MAX_ORIGIN_REF_BYTES` | 64 | consumption cap; Lane 4 pins the real length |
| `MAX_ACCOUNT_OR_KEY_BYTES` | 1024 | RSA-4096 DER upper bound [PROPOSAL] |
| `MAX_WITNESS_BYTES` | 4096 | headroom incl. future WebAuthn (~1 KB) and PQ (~2.4 KB, owner-cited) [PROPOSAL] |
| `ERC1271_VERIFY_GAS` | 200,000 **TBD** | V2-E1 benchmark vs Safe m-of-n, Kernel, Ambire; must cover a 7-of-9 Safe (~7 ecrecovers + overhead) |
| `ERC1271_MAGIC` | `0x1626ba7e` | ERC-1271 (FACT) |
| `SECP256K1_HALF_N` | `0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0` | secp256k1 (FACT) |
| `P256_HALF_N` | `0x7fffffff800000007fffffffffffffffde737d56d38bcf4279dce5617e3192a8` | P-256 (FACT, computed) |
| `P256_VERIFY_PRECOMPILE` | `0x0000000000000000000000000000000000000100` | EIP-7951 (FACT) |

EIP-7825 (16,777,216-gas per-tx cap, live L1 since Fusaka 2025-12-03 — audit
STANDARDS lane, VERIFIED) bounds verification counts per transaction
[venue-conditional physics; re-verify per Realm profile per CARRY-IN lane]:

| Kind | Verify gas (approx) | Max verifications / 16,777,216-gas tx |
|---|---|---|
| EOA (ecrecover) | 3,000 | 5,592 |
| KEY_P256 (EIP-7951) | 6,900 | 2,431 |
| KEY_RSA 2048 (MODEXP, EIP-2565) | ~5,500 | ~3,050 |
| CONTRACT_ERC1271 (capped) | ≤ 200,000 | 83 |

Verification is therefore never the batch bottleneck except for
contract-account authors: **at most 83 contract-author Envelope admissions
can even be *verified* in one L1 transaction** before any storage write;
admission storage costs (other chapters) will bound real batches far lower.
The measurement harness must report the verification share per fixture batch.

---

## 4. EIP-7702 classification — the three-point vector

Standards FACTS [audit STANDARDS lane, VERIFIED/PLAUSIBLE-near-certain]:
EIP-7702 live since Pectra (2025-05-07); a delegated EOA's code is exactly the
23-byte designator `0xef0100 ‖ delegate`; the EOA key retains signing
authority regardless of delegation; delegation can change or clear at any
time.

EFS POLICY [PROPOSAL, building on AUTH-INV-1/2/3]:

1. Delegation never changes identity: the account authors as
   `EOA_SECP256K1` with the same `PrincipalId` before, during, and after any
   delegation. The key, not the code, is the authority for kind 1.
2. Each admission observes and pins the delegation state *at that admission*
   in `delegateOrZero`. Observation only — never part of the verdict.
3. A 7702-delegated account whose delegate implements ERC-1271 MAY
   additionally author as `CONTRACT_ERC1271` — but that is a **different
   Principal** (different kind, origin-qualified, different `PrincipalId`).
   The protocol never links the two; linkage is ordinary authored evidence.
   Client warning surface, not Core surface.

**The three-point conformance vector (normative for the fixture chapter):**
one account `A` (key K) authors three Envelopes:

| | When | Verifies via | Persisted basis |
|---|---|---|---|
| E1 | before any delegation | ecrecover = A | kind 1, ver 1, `delegateOrZero = 0` |
| E2 | while delegated to D1 | ecrecover = A | kind 1, ver 1, `delegateOrZero = D1` |
| E3 | after re-delegation to D2 | ecrecover = A | kind 1, ver 1, `delegateOrZero = D2` |

All three admissions succeed under one `PrincipalId`; each classifies forever
under its own persisted basis; no later delegation change, clearing, or
account "upgrade" re-grades E1–E3 (AUTH-INV-3). The anti-vector: any design
where E2 fails, or where E3's admission mutates E1's recorded basis, is
rejected — this is precisely what the banned `hasCode` dispatch would do
(AUTH-INV-2).

---

## 5. ERC-1271 and ERC-6492 policy

**Standards FACTS** [audit STANDARDS lane, VERIFIED]: ERC-1271 is Final;
`isValidSignature(bytes32,bytes) → bytes4(0x1626ba7e)`; the result is
arbitrary code over mutable account/chain state, hence time-varying.
ERC-6492 is Final; it wraps a 1271 signature with deploy data so a
*counterfactual* (not-yet-deployed) account's signature can be validated by
simulation; its verdict flips with deployment state.

**EFS POLICY** [PROPOSAL — re-earning the mechanism per the greenfield rule;
evidence of hazard: identity.md line 18's July ruling "No ERC-1271 anywhere,
ever (chain-bound, state-dependent)" is EVIDENCE not baseline; the audit
STANDARDS lane names basis-pinning as the price of re-admission]:

1. **Admission-time only.** ERC-1271 is called exactly once per `publish` that
   passes bounded structure and descriptor equality and reaches occurrence
   classification, under
   `ERC1271_VERIFY_GAS`. An all-selected-ACTIVE retry discards that result and
   writes nothing. For a non-idempotent accepting call, the answering code's
   `EXTCODEHASH` + block are pinned into `AuthorityBasis`; the state-dependence
   hazard is neutralized because the receipt records *which state answered*.
2. **Never on read/Lens paths.** [DERIVED INVARIANT — candidate falsifier 8;
   constitution: "Reads consume historical admission receipts; they do not
   call arbitrary ERC-1271 accounts for every Lens entry."] Lens/Binding
   resolution touches only persisted receipts. A read that calls account code
   reintroduces both unbounded-gas exposure and kel.md §3's backdating class.
3. **ERC-6492 is off-chain pre-flight ONLY.** The SDK may use it to
   pre-validate a queued write for an undeployed account (good UX for
   counterfactual smart wallets); the on-chain admission still requires
   deployed code (`AUTH_1271_NO_CODE` otherwise). A receipt must never record
   "6492-verified": the wrapper's verdict has no stable basis to pin
   (deployment-state-dependent), which is the same reinterpretation hazard
   class 1271 has — but *without* a codehash to pin. [PROPOSAL, per audit
   STANDARDS lane recommendation.]
4. Challenge-window compatibility: because the basis pins codehash+block, a
   consumer contract wanting equivocation/upgrade safety can apply the
   PM-preserved challenge-window pattern (delay + recheck under current
   authority) on top of receipts; nothing in this design needs a kernel
   collision bit. [OWNER RULING — owner-rulings.md 2026-07-15 item F, lines
   51–54: chain keeps the LWW winner; challenge window is the sanctioned
   pattern; exact collision-state mechanics stay unfrozen per PM directive.]

---

## 6. The graduation seam — account Principal → managed Principal

Scope guard: the managed-Principal mechanism itself (KEL redesign) is out of
Stage A scope [OWNER RULING — owner-rulings.md 2026-07-10 "KEL — design it…
run as a major adversarial track"; constitution: "A full custom KEL is not
frozen into the MVP merely to reserve them"]. What B0 must pin **now** is the
seam: the interface and invariants under which one account Principal later
becomes managed *behind the same PrincipalId* without rewriting history —
because kel.md §3's "KEL added later as a peer" failure shows retrofit is not
an option (CARRY-IN lane, BLOCKING import (b)).

### 6.1 Seam interface stub (reserved, not built in B0)

```solidity
enum PrincipalClass { ACCOUNT, MANAGED }

/// B0 behavior: (seen ? REGISTERED data : defaults), class always ACCOUNT,
/// managedAuthorityRef always 0. Post-graduation: class MANAGED from
/// `sinceOrdinal` forward.
function principalGovernance(bytes32 principalId)
    external view
    returns (bool seen, PrincipalClass class, uint64 sinceOrdinal,
             bytes32 managedAuthorityRef);

/// RESERVED (not in B0): admits a graduation. `proof` must satisfy the
/// CURRENT account authority of `p` (same AuthorityVerifier path) AND the
/// acceptance rule of the managed authority object it names.
function graduatePrincipal(
    AccountPrincipal calldata p,
    bytes32 managedAuthorityRef,     // opaque ref to a future managed-authority object
    bytes calldata proof
) external returns (uint64 sinceOrdinal);
```

Admission dispatch after graduation [PROPOSAL — sketch level]: for a GOVERNED
principal, the admission path routes authority to the managed authority's
verifier (future verifier version) instead of `AuthorityVerifier/1`; the
persisted basis then records the managed kind + version. Account-key
witnesses alone no longer authorize new admissions unless the managed policy
says so.

### 6.2 The invariant list the seam must satisfy

- **G1 (identity stability).** `PrincipalId` never changes at graduation.
  Every Binding, backlink posting, author index entry, and Lens plan entry
  keyed by it remains valid with zero rewrites. [DERIVED INVARIANT —
  candidate §Principal: managed Principals arrive "behind the same semantic
  PrincipalId API"; this is also axis-2's decision result D2, §7.]
- **G2 (history immutability).** No pre-graduation `AuthorityBasis` is
  rewritten; historical verification replays old rules by `(kind,
  verifierVersion)` forever (AUTH-INV-1/3).
- **G3 (self-authorized).** Graduation is authorized by the account authority
  itself through the normal verifier — no administrator, no registry.
  [PROPOSAL]
- **G4 (prospective-only).** Effective from its own `AdmissionOrdinal`.
  Earlier account-key admissions stand; later account-key-only attempts are
  governed (and may be rejected) by the managed policy. (AUTH-INV-3.)
- **G5 (zero-setup preserved).** Non-graduated Principals never pay for the
  seam's existence: no new required fields, no registration, no extra gas on
  the kind-1/3/4 verify path beyond the `principalGovernance` branch check
  (one SLOAD of a slot that is zero for ACCOUNT principals). [PROPOSAL]
- **G6 (Realm-qualified).** Graduation is admitted per Realm. A Realm that
  never saw it honestly continues ACCOUNT-class classification; divergence
  across Realms is Realm-qualified truth, displayed as such, never global
  state. [DERIVED INVARIANT — constitution cross-Realm trace.]
- **G7 (envelope seam reserved now).** The Envelope carries an optional
  authority-reference field, excluded from `RecordId` (AUTH-INV-6), sized to
  hold a future full-width grant/authority id + epoch (kel.md §8.1's
  `authorityId`/`authEpoch` shape is the evidence). ⚠ dependsOn the envelope
  chapter: reserve `(bytes32 authorityRef, uint64 authEpoch)` with
  zero-values meaning bare account mode — the exact bytes are that chapter's
  call; the *requirement* that they exist pre-freeze is this chapter's.
  [DERIVED INVARIANT — CARRY-IN lane KEL import (b), BLOCKING.]
- **G8 (no resurrection).** A graduation cannot be undone to re-enable bare
  account-key authority silently; un-graduation, if ever designed, is itself
  a managed-policy transition with its own admitted evidence. [PROPOSAL —
  no-resurrection discipline applied to authority.]

### 6.3 The unlinkable-persona probe

Question (required by the axis-2 bakeoff per the RULINGS-lane note): can one
root later manage multiple unlinkable account Principals?

**Seam-level answer: yes, with one hard boundary.** [Analysis]

- Unlinkability at birth is free: N client-side-derived keys (one seed → N
  secp256k1/P-256 keys) yield N `AccountPrincipal`s whose PrincipalIds are
  hashes of unrelated-looking keys — nothing on-chain links them, and *loss*
  recovery is seed re-derivation, entirely client-side. One root already
  "manages" N unlinkable personas today with zero protocol surface.
- The boundary is public linkage at graduation/recovery: forced indexing
  makes on-chain graph structure public by construction [OWNER RULING —
  owner-rulings.md 2026-07-15 item 12 privacy boundary: "on-chain =
  metadata-exposed, full stop"]. So if two Principals graduate to the *same*
  public managed-authority object (shared recovery contract, shared KEL
  root), they are publicly and permanently linked. Therefore the seam MUST
  NOT require a shared public root: each persona graduates to its **own**
  managed authority object; whether those objects' keys derive from one
  client-side root is invisible on-chain. [PROPOSAL, forced by the ruling
  above.]
- Owner direction honored: one-root recovery/management is the mainstream
  default and unlinkable personas are opt-in [OWNER RULING —
  owner-rulings.md 2026-07-15 "KEL — persona model, UX-first ruling", lines
  72–79], with the 2026-07-16 course-correction (lines 88–91) clarifying
  that "manage in one place" means the local OS profile, not one on-chain
  key, because personas sharing a public recovery root would relink.
  Selective disclosure of linkage ("these two are me") is ordinary authored
  evidence, opt-in. Both owner notes predate the 2026-08-12 greenfield reset:
  their *mechanisms* are reopened, but the UX requirement (one-place
  management + opt-in unlinkability must stay expressible) survives as the
  seam constraint above.
- Honest cost statement: an ungraduated `AccountPrincipal` has **no
  rotation** — its authority reference is immutable, so key theft means
  permanent capture of that PrincipalId's *future* writes (history stays
  correctly classified; evidence: identity.md amendment 1's THEFT row).
  Graduation is the remedy, and N unlinkable personas need N graduations and
  N independent rotations. That is the accepted price of unlinkability, and
  clients must render it, not hide it.

---

## 7. Bakeoff cell F2 — tagged `AuthorRef = Account | Principal`

The axis-2 alternative gets a thin ABI sketch (per the BAKEOFF lane: a thin
variant on B0's engine, not a full build) and five decision results.

### 7.1 Sketch

```solidity
enum AuthorRefKind { ACCOUNT, PRINCIPAL }
struct AuthorRef {
    uint8   kind;    // ACCOUNT: value = bytes32(uint256(uint160(addr)))
    bytes32 value;   // PRINCIPAL: full-width id (F2 still obeys AUTH-INV-5)
}
// Every author-keyed storage/index key becomes keccak256(kind ‖ value) or a
// two-level mapping; every author-bearing ABI carries the pair.
```

The ACCOUNT arm authors directly by address (ecrecover or 1271); the
PRINCIPAL arm is a registered/managed author object. Envelope, Binding,
postings, and Lens entries all carry the tag.

### 7.2 The five decision results that settle axis 2

| # | Probe | Uniform PrincipalId (B0) | Tagged AuthorRef (F2) |
|---|---|---|---|
| D1 | Setup txs before first write | 0 — preimage rides the first admission (§2.7) | 0 on the ACCOUNT arm |
| D2 | Graduation vector | Passes: same id, prospective governance, zero rewrites (G1–G4) | **Fails-or-forks:** history is keyed under `ACCOUNT‖addr`; graduating mints a `PRINCIPAL‖id` key → either rewrite history (forbidden) or query two keyspaces forever |
| D3 | 7702 three-point vector | Classifies via kind byte + versioned verifier (§4) | The bare tag cannot distinguish EOA-key vs 1271 authority for one address — F2 must grow a sub-kind byte, i.e. it converges to B0's `authorityKind` |
| D4 | Author-enumeration keyspace count | 1 | 2 (candidate §Principal names "fractures portable EOA authorship" as a rejection condition) |
| D5 | Per-write gas/calldata delta | two keccaks (22-byte descriptor + 96-byte outer preimage, SR-14) ≈ **≤120 gas**; calldata ≈ +160 B vs a bare address (≈2,560 L1 calldata gas at 16 gas/B); one-time PrincipalRecord SSTORE at first use (1–3 slots) | saves those; adds tag branch + sub-kind |

Decision rule [PROPOSAL, aligned with the BAKEOFF lane's F2
recommendation]: adopt uniform iff D1 = 0, D2 passes with zero rewritten
history, D3 classifies all three points under the versioned verifier, and D5
is within the aggregate budget; reject tagged outright if author enumeration
requires probing two keyspaces (D4). D1/D3 are conformance vectors, D2 is a
scripted fixture, D5 is arithmetic plus one thin-variant measurement — no
full F2 engine is required. Present status: D1–D4 resolve in uniform's favor
by construction/inspection above; D5 awaits the harness numbers.

---

## 8. EIP-8130 — falsifier probe

Standards FACT [audit STANDARDS lane, VERIFIED]: EIP-8130 is a **Draft** Core
EIP (created 2025-10-24, Coinbase-authored): a new AA transaction type plus an
on-chain account-configuration system contract; the spec is explicitly
unstable and no fork is scheduled. It must never be load-bearing.

**The probe this design must pass** [HYPOTHESIS — falsifies the verifier
abstraction, not 8130]:

> Suppose 8130 (or a successor) ships and account `A` installs a native
> protocol-level configuration — say a P-256 signer, possibly with its secp
> key de-authorized at the account layer. A future `AuthorityVerifier` vN
> must classify `A`'s **new** admissions (via an appended `authorityKind`
> and/or witness profile under version N) while every **old**
> `AuthorityBasis` record — e.g. `(kind=EOA_SECP256K1, verifierVersion=1)` —
> remains byte-untouched and replays under version-1 rules.

Failure conditions (any one falsifies the axis-2/verifier design):

1. accommodating 8130 requires re-encoding `AccountPrincipal/1` or
   re-deriving any existing `PrincipalId`;
2. a protocol-level key de-authorization forces re-grading of old admissions
   (violates AUTH-INV-3 — de-authorization is prospective, like every other
   authority change);
3. the 8130 transaction context tempts authority derivation from
   `msg.sender`/tx-type — forbidden regardless (AUTH-INV-4; the audit
   SURVIVORS lane's R-D8 note: native transaction context can never satisfy
   authorship).

What makes the design pass today: the append-only kind enum (§2.2), the
persisted `(kind, verifierVersion)` interpretation key (§3.5), and
prospective-only authority transitions (§6.2 G4). The probe costs nothing
now; it becomes a red-team script when 8130 stabilizes.

---

## 9. EAS adapter seam (one paragraph, per PM directive)

The V2-E8 loss-map is deferred, but the Principal side of the adapter seam is
one rule [PROPOSAL]: an imported EAS attestation's `attester` (an address)
maps to `AccountPrincipal/1(EOA_SECP256K1, addr)` when the attestation is
EOA-signed, or `(CONTRACT_ERC1271, chainRef(sourceChain), addr)` when
contract-attested — imported as *source-qualified evidence without live
authority* (§3.4's import-lane note), never as this Realm's verified
authorship. The loss map records that EAS cannot distinguish key-kinds beyond
the address, which is exactly the information `AccountPrincipal/1` adds.

---

## 10. Golden-vector categories this chapter owes the fixture chapter

1. `PID-DERIVE`: examples A/B/C of §2.5 — ALL regenerate at Stage B vector
   mint under the SR-14 preimage (C additionally gated on Lane 4's chainRef
   layout) + one vector per structural-validation failure V1–V5 + one
   same-fields non-minimal-ABI-encoding vector that MUST yield the same
   PrincipalId (V6 construction rule).
2. `PID-LOW160`: synthetic injected colliding PrincipalIds (§2.6).
3. `AUTH-EOA`: valid; high-s rejected; v=29 rejected; wrong-recovered
   rejected; zero-address ecrecover rejected.
4. `AUTH-7702`: the three-point vector (§4) + `AUTH_EOA_UNEXPECTED_CODE`
   defensive case + kind-1-vs-kind-2 distinct-Principal vector for one
   delegated account.
5. `AUTH-1271`: accept; reject (wrong magic); revert-in-account; gas-cap
   exhaustion; >32-byte returndata; no-code (counterfactual) rejection; and
   the pinned-codehash replay: account self-destruct/upgrade after admission
   must not alter the recorded basis.
6. `AUTH-P256`: RFC 6979 A.2.5 key with a valid raw signature; high-s
   rejected; off-curve key rejected at V4.
7. `AUTH-RSA`: 2048-bit accept; e≠65537 rejected; wrong-length sig rejected.
8. `AUTH-RAIL`: one envelope, two submission rails against the same account
   state → identical PrincipalId + basis modulo `basisBlock` (AUTH-INV-4);
   staged calls across an account-state change retain their own exact pairs.
9. `AUTH-FOREIGN`: contract-account Principal with foreign originRef →
   `AUTH_FOREIGN_ORIGIN`, and its import-lane, no-live-authority carriage.
10. `GRAD-SEAM` (deferred until the managed design exists): G1–G8 as scripted
    assertions over a stub managed authority.
11. `AUTH-IDCHAIN` (SR-13 forgery probe): a valid witness over the
    attacker's own descriptor inside an envelope declaring a DIFFERENT
    `header.principalId` MUST fail with `AUTH_PRINCIPAL_MISMATCH` before
    verification; plus the honest twin (descriptor hashes to the declared
    id) admitting cleanly.

---

## Interfaces exposed

The compact contract other chapters rely on:

```solidity
// ---- identity (frozen names; version 1) ----
struct AccountPrincipal { uint8 authorityKind; bytes originRef; bytes accountOrKey; }
// kinds: 1 EOA_SECP256K1, 2 CONTRACT_ERC1271, 3 KEY_P256, 4 KEY_RSA; append-only
function computePrincipalId(AccountPrincipal calldata p) external pure returns (bytes32);
// PrincipalId = keccak256(abi.encode(DOM_PRINCIPAL, uint256(kind), keccak256(descriptorBytes)))
//   DOM_PRINCIPAL = keccak256("efs2/principal/1"); descriptorBytes = §2.4 packed
//   per-kind layout (== stored PrincipalRecord)                          (SR-14)

// ---- carriage + identity assertion (SR-13) ----
// publish(envelopeBytes, AccountPrincipal calldata principal, intentBytes, intentWitness)
//   `principal` is THE calldata channel for the preimage; admission asserts
//   computePrincipalId(principal) == envelope.header.principalId
//   (revert AUTH_PRINCIPAL_MISMATCH) BEFORE witness verification.

// ---- verification (internal library; logical version 1) ----
type AuthorityBasisWord is bytes32;   // kind u8 ‖ verifierVersion u16 ‖ witnessProfile u8 ‖
                                      // basisBlock u64 ‖ delegateOrZero u160
                                      // (8+16+8+64+160 = 256, exact — SR-7)
struct VerifyContext { bytes32 selfChainRefHash; uint64 blockNumber; }
// AuthorityVerifierV1.verify(principal, digest, witness, ctx)
//   → (AuthorityBasisWord basis, bytes32 codehashOrZero)   // reverts typed;
//   codehashOrZero nonzero iff kind 2 (CONTRACT_ERC1271)
function previewAuthority(AccountPrincipal calldata, bytes32, bytes calldata)
    external view returns (AuthorityBasisWord, bytes32);

// ---- persisted state this chapter defines ----
// mapping(bytes32 => bytes) principalRecord;      // descriptorBytes verbatim, first-use,
//                                                 // append-only, from the SR-13 channel
// AuthorityBasisWord (+ conditional codehash slot; zero never stored) persisted once per
//   non-idempotent accepting call in AdmissionBatch; only occurrences newly accepted by
//   that call resolve that pair. EnvelopeMeta owns no singular authority basis.
function principalGovernance(bytes32 principalId) external view
    returns (bool seen, uint8 class, uint64 sinceOrdinal, bytes32 managedAuthorityRef);
```

Guarantees other chapters may rely on: PrincipalId is full-width bytes32
everywhere and offline-computable with zero setup transactions; admission
binds the verified account to the declared `principalId` before verification
(SR-13) — a valid witness can never be attributed to a different
PrincipalId; authority is verified admission-time only with the basis
persisted; witness bytes never enter any id preimage; all authority
transitions are prospective; reads never invoke account code. Obligations on
other chapters: the realm chapter's `publish()` carries the
`AccountPrincipal calldata` parameter and runs the SR-13 assertion before
`verify`; the envelope chapter derives `EnvelopeId` over unsigned bytes and
reserves `(authorityRef, authEpoch)` (G7; `authEpoch` rides the header, not
the basis word — SR-2/SR-7); Lane 4 supplies `chainRef` bytes and
`selfChainRefHash`; the admission chapter persists the basis word(s) it
receives, unmodified; the encoding chapter registers `efs2/principal/1` in
its closed domain table §1.3 and regenerates its `EfsIds` PrincipalId row to
the SR-14 formula (retiring `principalScheme` in favor of `authorityKind`).

## Open items

1. `ERC1271_VERIFY_GAS` exact value — decided by the V2-E1 measurement pass
   (benchmark Safe 1-of-1 … 7-of-9, Kernel, Ambire; the constant must cover
   the chosen support floor with margin).
2. `WP_P256_WEBAUTHN` profile — gated on byte-exact vectors from ≥2 real
   authenticator families (identity.md amendment 7); ships as verifier v2.
3. Lane 4's canonical `chainRef` encoding (ERC-7930 Review-status vs pinned
   Codex layout) — gates example C's descriptor construction (§2.5; all
   example values regenerate at Stage B mint regardless); also decides
   `MAX_ORIGIN_REF_BYTES` final value.
4. `basisBlock` semantics on L2/L3 Realms (sequencer block number vs L1
   anchor) — Lane 4's finality-observation seam decides what the uint64
   means per Realm profile; the field width holds either way.
5. V5's RSA parameter set (e = 65537 only; modulus floor) — verify against
   the shipped OZ ERC-7913 RSA verifier before freeze (marked PLAUSIBLE).
6. Whether `principalRecord` persistence should be skippable for EOA kinds
   (ecrecover makes the preimage reconstructable from the witness +
   digest) — a pure gas optimization; deferred per the correct→easy→fast
   priority; take only if the aggregate budget forces it.
7. D5's measured gas/calldata delta for the F2 comparison — harness output;
   D1–D4 are already resolved by construction and need only scripted
   confirmation.
8. PQ kind minting policy (which NIST-final scheme, which verifier, enum
   value) — deliberately unminted; the append-only enum and verifier
   versioning are the reserved seam; falsifier probe §8 doubles as the drill.
9. Managed-authority object design (the actual KEL successor) — out of Stage
   A; the seam (§6) is the only B0 obligation.
10. Registered-principal calldata elision — once a `PrincipalRecord` exists,
    `publish()` could accept an empty descriptor and load the stored bytes
    by `header.principalId` (the SR-13 assertion then runs against the
    stored record, which is descriptorBytes verbatim). A pure calldata/gas
    optimization on the SR-13 channel; deferred per correct→easy→fast, and
    never available for a Principal's first admission.
