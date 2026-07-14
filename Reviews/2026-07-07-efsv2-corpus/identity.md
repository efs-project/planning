# EFS v2 identity design — bare-EOA now, KEL reserved, succession in place

**Role:** Identity designer (v2 tag-core pass, 2026-07-07)
**Inputs:** carrier decision 2026-07-07; record-format investigation 2026-07-02; substrate decision (§3 reservations); arch-B native kernel; research-identity-crux; research-atproto; deterministic-ids Codex; coupling audit.
**Status:** proposal for the freeze bundle. Everything in §1–§2 is offered as freeze-grade; §3–§5 are analysis and doctrine. Vectors in §2.7 were computed with ethers v6 against the arch-B envelope sketch and must be regenerated if the envelope pass changes the struct.

**TL;DR of rulings proposed here:**

1. v2 ships **bare-EOA only**: identity word = `bytes32(uint160(addr))`, verification = ecrecover against a chain-free EIP-712 envelope digest. Digest-shaped identity words are **rejected at admission with a reserved error** — the slot exists, nothing verifies against it yet.
2. The KEL (key-event log) is **reserved as frozen formats + golden vectors**, zero machinery. Formats below: event struct, digest formulas, algoTags (secp256k1 / p256 / p256.webauthn / additive-PQ pattern), pre-rotation, WebAuthn strict profile.
3. **Succession is in-place**: when KEL ships, an EOA identity incepts a KEL *for its existing address-shaped word*. The identity word for EOAs is **address-shaped forever**; owned-object IDs, slots, and lens positions never rewrite. The epistemics cost of this (can't prove KEL-absence off-chain) is deliberately graded with the **same vocabulary as revocation** (home-chain certain; elsewhere best-effort).
4. KEL deployment mechanics: **peer deployment + frozen union-read rule**, NOT an in-kernel registry slot (a pre-wired registry address is a master key; a codehash latch forces building the machinery now). No trusted deployer ever enters the auth path.
5. **Nothing here forces building more than the reservation in v2** — but the reservation has a **deadline**: the KEL must ship comfortably before the CRQC window (~early 2030s), because bare-EOA identities have no PQ migration path and the in-place inception itself relies on secp256k1. "Reserved" is honest only with that date attached.
6. Year-0 gaps are closed by **conventions, not kernel surface**: a bidirectional successor-claim convention (TAGDEF+PIN under the address container, never auto-followed), org-as-lens-list for rotating-signer orgs, raw-cold-key doctrine, and TID device-bit discipline for multi-device.

---

## 1. What is FROZEN in v2 (normative)

### 1.1 The 32-byte identity word

Every record, envelope, claim, owned-object derivation (`dataId`, `listId`, `slotId`), and lens entry names its author as one `bytes32` **identity word**. The word is the identity; keys are how the word speaks. Frozen shape taxonomy:

| Shape | Predicate | v2 status | Verification rule |
|---|---|---|---|
| **Zero** | `word == 0` | illegal forever | rejected at admission (keeps the ADR-0033 address(0)/root poison out of identity) |
| **Address-shaped** | `0 < uint256(word) < 2^160` | **live in v2** | v2: bare-EOA rule (§1.2). Post-KEL: registry lookup first, bare rule as fallback (§4) |
| **Digest-shaped** | `uint256(word) ≥ 2^160` | **reserved** | rejected in v2 with error `ReservedAuthorShape`; post-KEL: KEL required, fail-closed |
| **Reserved words** | closed set: `keccak256("efs.system.v1")` | genesis-only | written only in the kernel deployment ceremony; the submit path rejects them; KEL inception of a reserved word is forbidden (frozen now so no one can "claim" the system author later) |

Frozen derivation for digest-shaped words (reserved, not constructible in v2):

```
DOMAIN_IDENTITY = keccak256("efs.id.identity.v1")
              = 0xa79f57ae5f1ff4c6b7c68935177015c41c611a4bea8a6fea8a38648b336361d3
identityWord  = keccak256(abi.encode(DOMAIN_IDENTITY, inceptionEventDigest))
```

**Rule ID-SHAPE-1 (re-salt, closes shape confusion by rule not work-factor):** a digest-shaped derivation whose output lands in the address subspace (`uint256(word) < 2^160`) is **invalid**; the incepting party MUST re-salt (the inception body carries a salt word). Honest probability of ever hitting this: 2^-96. Rationale: deterministic-ids relies on a 2^96-grinding argument for anchor parents; for identity we can do strictly better because inception is an interactive act with a free salt — so the "digest identity that classifies as an address" attack class is closed by specification, at zero cost. Impersonating a *specific* EOA via inception grinding was already a 2^160 preimage problem; the joint control-both-sides birthday is ~2^128. With ID-SHAPE-1, shape is an *invariant*, not a probabilistic claim.

**What the word is NOT:** it is not a hash of a public key (for EOAs it is the address, which is `keccak(pubkey)[12:]`, but the spec commits to the *address semantics*, not the pubkey derivation); it is not chain-bound; it is not an EAS attester; it never changes across key events (§4).

### 1.2 The v2 admission predicate (byte-exact)

```
admit(envelope h, sig) requires:
  h.author != 0
  ∧ uint256(h.author) < 2^160                       // address-shaped only in v2
  ∧ h.author ∉ ReservedWords
  ∧ sig is 65 bytes (r ‖ s ‖ v), v ∈ {27, 28}, s ≤ secp256k1n/2   // canonical; PLC's low-S lesson
  ∧ ecrecover(EIP712Digest(h), v, r, s) == address(uint160(uint256(h.author)))
```

`EIP712Digest` uses the chain-free domain from the carrier decision (no chainId, no verifyingContract):

```
domain    = { name: "EFS", version: "1", salt: keccak256("efs.kernel.envelope.v1") }
salt      = 0xedb2589ea7bd19f7b6f4d6e0aa82e4e816f1630a8c9ff80db9c8927515390616
typeHash  = keccak256("Envelope(bytes32 author,uint64 seq,bytes32 prev,bytes32 recordsRoot,uint32 count)")
domainSeparator = 0x2f735cacff1865b7c4c9dcf0706508396d30701e31b6524e166b5953f35fcc50   // a compile-time constant — no chainid opcode, no rebuild-on-fork
```

Because the domain is chain-free, the domain separator is a **constant**, which is itself a small verification win (no dependence on `block.chainid`, nothing to re-derive after a chain split; ETH/ETC-style forks produce identical admission on both sides by construction).

**Smart-account users, stated honestly:** `msg.sender` is never in the auth path, so a Safe/4337 account can *submit and pay* for anyone — but it cannot *author* in v2. Authorship requires a raw secp256k1 key. EIP-7702-upgraded EOAs are fine (the root key still exists). Users of smart-contract-only wallets with no exportable EOA key (e.g. passkey-native smart wallets) **cannot be v2 authors**. This is a named adoption cost of bare-EOA-first and the second driver (after orgs, §3.3) of the KEL timeline.

### 1.3 `seq`: frozen TID layout + device bits + collision semantics

```
seq (uint64) = [ bit 63: 0 (reserved, MUST be zero)
               | bits 62..10: microseconds since Unix epoch (53 bits ≈ 285 years)
               | bits 9..0:  deviceBits (10 bits) ]
tidTime(seq) = (seq >> 10) µs
```

Frozen conventions (SDK-normative, Codex-carried):

- **deviceBits** are chosen uniformly at random once per device/app-install and persisted. An SDK SHOULD scan the author's recent on-chain envelopes and avoid in-use values (cheap; makes honest collision require both a device-bit collision *and* a same-microsecond write).
- **Per-device monotonicity fallback:** if the clock repeats or regresses (NTP), the SDK bumps `tidTime` to `last+1` for that device (the Actual-Budget/ATProto discipline).
- **Seq-reuse prohibition (normative):** an SDK MUST NOT sign two *different* envelopes with the same `(author, seq)`. On a `SeqOccupied` rejection it MUST re-sign under a bumped seq, never re-sign different content at the same seq.
- **Collision semantics (requirement handed to the kernel/envelope designer — this amends arch-B §3.3 rule 2 per the substrate reservation §3.5):**
  - same `(author, seq)`, same `envelopeDigest` → idempotent no-op success (LOCKSS resubmission, relayer races);
  - same `(author, seq)`, different digest → **reject with `SeqOccupied`, no state change, NOT branded duplicity**. Record-level seq collisions are never duplicity (two honest devices must never manufacture equivocation evidence). The two signed artifacts remain socially available as *potential* evidence; only KEL-log equivocation (impossible per chain by construction) is kernel-branded.
  - Cross-chain: two chains may admit different envelopes at one `(author, seq)` if a dishonest or broken client signed both. The convergence invariant is therefore **conditional on per-author seq-uniqueness**; violation is self-inflicted and contained to that author's replicas (their slots read as contested). Frozen deterministic tie-break for union reads: highest `(seq, recordIndex)` wins; at exact ties with different digests, **lowest envelopeDigest wins and the read is graded `contested`** — deterministic convergence plus an honest label, never a silent merge.

### 1.4 Signature encoding + the algoTag extension rule

v2 accepts exactly one signature form: 65-byte canonical secp256k1 (§1.2). Frozen extension rule so future forms are additive, not breaking:

- `len(sig) == 65` ⇒ legacy untagged secp256k1 (this form is grandfathered forever);
- any other length ⇒ `sig = abi.encode(bytes32 algoTag, bytes sigBytes)` — reserved; v2 rejects.

algoTag constants are frozen now (§2.2) so that replicas, verifiers, and the year-100 Codex can hard-code the taxonomy today.

---

## 2. RESERVED Codex sections (formats + vectors, no machinery)

Everything in §2 ships in the Codex marked **reserved**: byte layouts and vectors are frozen; no contract implements them in v2; the KEL build (post-external-review) implements them without touching any v2-frozen surface. Where a reserved choice later proves wrong at KEL external review, the escape hatch is the standard one: new `v1`-suffixed constants mint a structurally non-colliding v2 format; the reservation's value is that *conforming* tooling built today keeps working if review passes.

### 2.1 Key-event log (KEL) — event format

KERI-shaped, Farcaster-simple, position-scoped, monotone. One log per identity word; per-chain contiguity kernel-enforced; the log is a self-contained exportable artifact (PLC's audit-log discipline).

```solidity
struct IdentityEvent {
    uint8   evType;      // 0 INCEPT | 1 ADD_KEY | 2 REMOVE_KEY | 3 ROTATE   (closed set; new types = new tags)
    uint64  evSeq;       // per-identity, contiguous from 0, kernel-enforced
    bytes32 prevEvent;   // eventDigest of predecessor; 0x0 for INCEPT
    bytes   body;        // canonical abi.encode per evType (below)
}
```

Digest formulas (fixed-width `abi.encode`, dynamic content pre-hashed — house rule):

```
DOMAIN_IDENTITY_EVENT = keccak256("efs.identity.event.v1")
                      = 0xf257a8499cfb6f1a754ae40ad69b9eb89c4757218c0529c54db09c7fe68f7b39
DOMAIN_KEY            = keccak256("efs.identity.key.v1")
                      = 0x53566b75c6d60f604039b7542d8b751fcd506204c83505763cea8e29de911b8f

eventDigest = keccak256(abi.encode(DOMAIN_IDENTITY_EVENT,
                                   authorField,          // bytes32(0) for INCEPT; the identity word for all later events
                                   uint256(evType), uint256(evSeq), prevEvent,
                                   keccak256(body)))
keyHash     = keccak256(abi.encode(DOMAIN_KEY, algoTag, keccak256(keyMaterial)))
```

`authorField = 0` for INCEPT because the word may be *derived from* the inception digest (circularity); binding for later events is both direct (authorField) and transitive (prevEvent chains to inception). KERI includes the AID prefix in every event; we copy the belt-and-braces.

**Bodies (canonical layouts):**

```
INCEPT body  = abi.encode(bytes32 salt,             // ID-SHAPE-1 re-salt input; MUST be nonzero for digest-shaped
                          bytes32 boundAddress,     // 0 ⇒ digest-shaped identity; bytes32(uint160(addr)) ⇒ in-place upgrade (§4.1)
                          bytes32 keysDigest,       // keccak256(abi.encode(bytes32[] algoTags, bytes32[] keyMaterialHashes)); full key material carried alongside, not in the digest
                          uint256 threshold,        // for KEY EVENTS only (see single-sig authorship rule below)
                          bytes32 nextKeysDigest,   // KERI pre-rotation commitment; 0 = none
                          bytes32 metaHash)         // reserved (recovery-window policy, controller binding, …); 0 in v1 vectors
ADD_KEY body    = abi.encode(bytes32 algoTag, bytes32 keyMaterialHash, bytes32 metaHash)   // material carried alongside
REMOVE_KEY body = abi.encode(bytes32 keyHash)
ROTATE body     = abi.encode(bytes32 newKeysDigest, uint256 newThreshold, bytes32 newNextKeysDigest)
```

**Signing rules (frozen semantics):**

- Every event carries signatures by keys valid under the **previous** state (threshold-of-N); INCEPT is self-signed by the initial keys; an INCEPT with `boundAddress != 0` MUST additionally carry a canonical secp256k1 signature by that address over the inception `eventDigest` — that signature *is* the in-place binding.
- **ROTATE** must be signed by preimage keys of the previously committed `nextKeysDigest` (pre-rotation), or by threshold of current keys if none was committed. Because only digests of next keys are ever published, the recovery path is hash-shielded — quantum-resistant today at zero cost (KERI's gift).
- **Key validity is `[ADD_KEY position, REMOVE_KEY position)` by per-chain admission order — monotone forever.** A record verified at admission stays valid. Removal never retroactively invalidates (the anti-Farcaster rule: "never been removed" deletes a lifetime of authorship). Compromise handling = forward removal + lens-scoped DISAVOW (§2.5), never protocol deletion.
- **Single-sig authorship (ruled here, freeze-grade):** record/envelope verification requires exactly **one** currently-valid key signature. Thresholds govern *key events only*. m-of-n content signing is out — it would put threshold evaluation in the hot admission path and in every year-100 verification; orgs that want m-of-n content control get it via KEL thresholds on rotation plus internal process (§3.3). This matches Farcaster and PLC and keeps the kernel's verify cost flat.
- **Truncation-replay defense (a red-team lesson carried from the prior native-kernel pass):** per-chain contiguity (`evSeq` strictly sequential, `prevEvent` matched) means replaying a *prefix* of a KEL onto a fresh chain is admissible — that is a feature (identity replication), but a verifier reading a replica must treat KEL state as *as-of that chain's head*, graded per §4.3; "key K is valid" from a truncated replica means "valid as of event N", never "valid, full stop."

### 2.2 algoTag registry (frozen constants + canonical keyMaterial encodings)

| algoTag preimage | Value | keyMaterial canonical encoding | Verify primitive |
|---|---|---|---|
| `efs.keyalgo.secp256k1.v1` | `0x7c1ce569d5feccd7deed69a0572fac1128a7818ed7b3f185c13b25e609bda973` | 20-byte address (recover-and-compare; EVM-native) | ecrecover (~3k gas) |
| `efs.keyalgo.p256.v1` | `0x28f819091a6e308b9ef680545b385f045e333e529528398dd72128df81ce3285` | 64-byte uncompressed `x ‖ y` | P256VERIFY / EIP-7951 (6,900 gas) over the raw EFS digest |
| `efs.keyalgo.p256.webauthn.v1` | `0x92164045fd841826a5b303841773b56d6097168d7b5db7a75bc674d70aa8edf4` | 64-byte uncompressed `x ‖ y` | P256VERIFY over the §2.3 WebAuthn envelope |
| `efs.keyalgo.<pq-name>.v1` (pattern) | minted when NIST-final + EVM verifier exists (ML-DSA, SLH-DSA candidates) | 32-byte keccak digest of the full public key; full key in calldata at use time (PQ keys are KB-scale) | future precompile |

Notes: P-256 sigs must also be low-S canonical (P-256 is as malleable as secp256k1). P-256 buys **zero** PQ margin (same Shor attack) — its value is authenticator hardware reach (passkeys, secure enclaves), not longevity. PQ tags are deliberately *not* minted now: freezing a tag for a scheme whose final parameters or EVM verifier shape is unknown would be imitation-risk in reverse; the *pattern* and encoding discipline are what is frozen.

### 2.3 WebAuthn strict profile (reserved)

Passkeys are **signers, never identities** (vendor-locked, non-extractable, loss presumes a rotation layer — they only make sense under a KEL). Frozen profile so authenticator-facing tooling can be built and vectorized before the KEL exists:

- Signed bytes = `authenticatorData ‖ SHA256(clientDataJSON)`; both carried verbatim in the signature envelope.
- `clientDataJSON` MUST begin, byte-exact, with `{"type":"webauthn.get","challenge":"` followed by `base64url(envelopeDigest)` (no padding) followed by `"`; the remainder is unconstrained but carried (strict-prefix check, the Daimo/Solady pattern — no on-chain JSON parsing).
- `authenticatorData` flags MUST have UP (0x01) set; UV not required (frozen: UV is an authenticator-policy fact, not an authorship fact); `rpIdHash` is NOT kernel-constrained (origin binding is the author's choice of authenticator; constraining it would make the kernel an origin gatekeeper).
- **Named executable check before this profile is un-reserved:** golden vectors MUST be generated from at least two real authenticator families (e.g., Apple enclave passkey + a FIDO2 hardware key). Frozen-from-spec WebAuthn profiles that never touched real hardware are where signature systems go to die (clientDataJSON extension drift, flag variance).

### 2.4 Reserved kind/claim tags

Per substrate reservation §3.3 (reserved schema/kind IDs for KEYGRANT/REVOKE-class identity records):

```
KIND_KEL            = keccak256("efs.kind.kel.v1")            = 0x7e2e4967348442d43d80da883c8ae6c133a1876e67245db43d907cc83205a1a7
CLAIMROLE_SUCCESSOR = keccak256("efs.claimrole.successor.v1") = 0x664f71745b3813491bae9b007163c759e7c549afab99d9732462908873fd6775
CLAIMROLE_DISAVOW   = keccak256("efs.claimrole.disavow.v1")   = 0x1ff53b66cd4001837a511afe0fbef51d8fe01eed1ab2d342a49ae40707793e43
KIND_ANCHORSET      = keccak256("efs.kind.anchorset.v1")      = 0xef505bf1e76efac57137dde171e03e5de5d3b736913276ea645b156b505914fc
```

- `KIND_KEL` reserves the option to carry identity events *inside the record stream* (vs a dedicated entrypoint — a KEL-build decision, both compatible with the frozen event format).
- `CLAIMROLE_SUCCESSOR` / `CLAIMROLE_DISAVOW` are the KEL-era first-class forms of the year-0 conventions in §3.2; reserved so the conventions have a typed landing place.
- `KIND_ANCHORSET` reserves a mass re-anchoring record (a Merkle root covering many old records' digests) for the ERS/epoch story (§5.3). Ordinary re-anchoring is just replication and needs no new kind; ANCHORSET is the gas-efficient bulk form. Format reserved, machinery not built.

### 2.5 DISAVOW format (reserved) and its honest limits

`DISAVOW body = abi.encode(uint64 fromSeq, uint64 toSeq, bytes32 reasonHash)` — a lens-scoped, viewer-sovereign statement "I disavow my records in [fromSeq, toSeq]" (WHITEOUT-analogous; never protocol deletion; monotone validity untouched). **Honest limit in v2 (bare-EOA): disavowal is symmetric under theft** — the thief holds the same key and can disavow the victim's genuine records or revoke the victim's disavowal. It is evidence for human/lens adjudication, not a cryptographic verdict. Only KEL pre-rotation breaks the symmetry (§3.1).

### 2.6 Epoch table schema (reserved; values are stewardship, schema is frozen)

```
EpochRow = (bytes32 algoTag, string retirementLabel /*ISO date*/, bytes32[] perChainAnchorRefs /*optional block refs*/)
Semantics: a signature under algoTag verified against evidence anchored AFTER its retirement epoch
           carries grade "existed-before-E only if re-anchored"; before it, full authorship grade.
```

The **values** of this table are human-amended via the trust-root stewardship path (holistic-redesign §3.2) — this is the honestly-named mutable governance surface every architecture's PQ story terminates in (substrate §6.6). The schema, the grading vocabulary, and the rule that the table can only *retire* (never resurrect) an algorithm are frozen now.

### 2.7 Golden vector suite

Enumerated set (the reserved sections ship with all of these; sample values below were computed with ethers v6):

| Vector | Covers | Computed sample |
|---|---|---|
| V-EOA-1 | bare-EOA envelope: chain-free domain, digest, canonical sig, recovery | below |
| V-EOA-2 | high-S sig rejected; v ∉ {27,28} rejected | (generate at build) |
| V-EOA-3 | digest-shaped author rejected with `ReservedAuthorShape`; zero author rejected; reserved word rejected | (generate at build) |
| V-TID-1 | seq layout encode/decode; future-bound boundary; device-bit extraction | below |
| V-KEL-1 | digest-shaped INCEPT: bodyHash, eventDigest, identityWord, ID-SHAPE-1 check | below |
| V-KEL-2 | address-bound (in-place) INCEPT incl. binding signature | below (digests) |
| V-KEL-3 | ADD_KEY → REMOVE_KEY chain: contiguity, prevEvent linkage, key window [add, remove) | (generate at build) |
| V-KEL-4 | ROTATE under pre-rotation: nextKeysDigest preimage check | (generate at build) |
| V-KEL-5 | truncated-log replica: key-validity grading as-of head | (generate at build) |
| V-WAN-1/2 | WebAuthn assertions from two real authenticator families (§2.3 check) | (hardware-generated at build) |
| V-SUC-1 | successor pair (§3.2): both claims + never-auto-follow assertion | (generate at build) |

**V-EOA-1** (signer = well-known hardhat key #0; safe as a vector, never as a real identity):

```
privateKey  = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
address     = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
authorWord  = 0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266
seq         = 0x195838c12b00002a            // tidTime = 2026-07-08T00:00:00.000000Z, deviceBits = 0x02a
prev        = 0x00…00
recordsRoot = keccak256("efs.vector.records-root.placeholder")
count       = 1
domainSeparator = 0x2f735cacff1865b7c4c9dcf0706508396d30701e31b6524e166b5953f35fcc50
eip712Digest    = 0x5cab11d59bd1951ab09f8f94d1f30e10de8febd6073ceea5457be70bc93198ee
signature       = 0x0b89671440a48bfb2676cc0080f063708bdddd1affe2ccd4d7dc21d8f1ffb8556a0f86fe2119d0b9f2981be5513c9e99c614972d6a4b48e428fd077ef81205a41c
recovered       = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 ✅ == authorWord
```

**V-KEL-1** (digest-shaped INCEPT; salt = keccak256("efs.vector.kel1.salt"); one secp256k1 key = hardhat #0; threshold 1; no pre-rotation):

```
keyHash        = 0x4095b26b77f20635ce0111a7dfea540d6e161f8a2e81e9924dab8cf8635695b6
incept bodyHash= 0x0535d31b1e718d7ba71f11428c728179d82edf8cf331176af40499400e3d6be4
inceptDigest   = 0x203e2c51192926b84f89abeccde0904ef577071eecc305142d2f293eef6455de
identityWord   = 0xfc3e2d76361a955d6c662076cc4e800fa91d2bbbc13d99e21f858a0eebae688c   // top 96 bits nonzero ✅ (ID-SHAPE-1)
```

**V-KEL-2** (in-place INCEPT for the same address; identical body except `boundAddress = authorWord`):

```
incept bodyHash= 0x7d709bb96b8151a24368c1d7f9d8e3449a3656f3f6da7f4e73894bcd8a8021b1
inceptDigest   = 0x2d3d5c57c2855e720d049cb5bb002d80815983bd94fd6002cb930438c9987e81
identityWord   = 0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266   // = the pre-existing address-shaped word; UNCHANGED
```

---

## 3. The year-0 story, pressure-tested

### 3.1 "User loses key" — the full consequence table

Two distinct events with different blast radii. **LOSS** = key destroyed, nobody controls it. **THEFT** = a second party controls it; control is thereafter *cryptographically symmetric* — nothing in the protocol can distinguish victim from thief. That symmetry is the bare-EOA wall, and only KEL pre-rotation (keys the thief has never seen, committed as digests) breaks it.

| Surface | LOSS | THEFT |
|---|---|---|
| Past writes | valid forever, verifiable from bytes alone | same — thief cannot alter admitted history (monotone) |
| Revocation of past claims | **revocable by nobody, ever.** Mistakes/PII signed before loss are permanent. Mitigations: author-set EXPIRY (already doctrine for safety-critical), lens-level hiding | **revocable by the thief.** Thief can revoke the victim's genuine claims, unpin files, strip mirrors, REDIRECT names — full mutable-state control |
| Future writes | impossible under that word; new writes require a new key = new identity word | thief continues the log *as the author*, indistinguishably; victim's parallel writes create same-seq contests that make the identity read as unstable |
| Signed-but-unsubmitted envelopes | **still submittable by anyone, forever** (posthumous publication works; a shoebox envelope outlives its key) | same — including envelopes the thief pre-signs |
| Owned objects (dataId/listId = f(word, salt)) | namespace freezes: no new versions at existing slots; content stays readable | thief mints new objects and versions under the victim's word |
| Slots / placements (PINs) | stuck at last state — for an archive this is a feature (nothing rots), for a live site it is abandonment | thief re-points everything |
| Lens subscriptions pointing at the dead word | keep resolving (correct for an archive); updates stop; **no protocol signal distinguishes "lost key" from "stopped writing"** — silence is unsigned; subscribers learn socially | worse: subscribers keep trusting a hijacked author with no protocol signal at all |
| Names / first-attester-wins positions | the dead word keeps winning wherever lenses rank it; recovery of a name position = viewers edit their lens ordering (lens edit *is* the migration mechanism) | thief occupies the position and actively exploits the accumulated trust |
| Gasless/relayer edges | unaffected (submission was always permissionless) | unaffected |
| DISAVOW / "this key is compromised" statements | impossible (can't sign) | symmetric — thief can sign the same statement about the victim (§2.5) |

**The honest summary sentence for the Codex:** *in v2, identity is exactly as durable as one secp256k1 secret; EFS makes the consequences of losing it smaller than any prior system of this class (history survives, links survive, anyone can keep replicating you) and does nothing to prevent them.*

### 3.2 The successor convention ("I am now K2") — mechanics and trust semantics

Year-0 form, chosen for **zero kernel surface**: an instantiated TAGDEF + cardinality-1 PIN under each party's own address container (2 writes each; succession is rare, the cost is irrelevant). *Why not REDIRECT as the vehicle:* REDIRECT is defined over object/anchor IDs and whether an address container is a legal `sourceId` is an open v2 question; a new REDIRECT kind would also grow the frozen kind table, and its existence-checked target rule doesn't fit a not-yet-active successor word. The PIN form uses only surface that exists, gives cardinality-1 semantics for free, and inherits slot supersession (which §3.2's trust table then grades honestly). If the REDIRECT-source question resolves in favor of address containers, a `REDIRECT(kind=identitySuccessor)` is an equivalent future vehicle — the *doctrine* below (bidirectional pair, never auto-followed) is what is frozen, not the carrier schema:

- Old identity K1 signs: TAGDEF `efs.identity/successor` under K1's address container + PIN → target = K2's word (`TARGETKIND_ADDRESS`; `TARGETKIND_OPAQUE` once digest-shaped words exist).
- New identity K2 signs the mirror: `efs.identity/predecessor` → K1.
- **Only the bidirectional pair means anything.** A lone `predecessor` claim is successor-squatting ("I succeed famous K1") and MUST be rendered as an unverified assertion; a lone `successor` claim is an offer, not a transfer.

Trust semantics, graded honestly:

| Situation | What the pair proves | Grade |
|---|---|---|
| Published proactively (both signed while K1 is presumed uncompromised, anchored at block N) | K1's holder designated K2 before N — poor-man's pre-rotation. If compromise is later socially dated after N, the succession is trustworthy | strongest available in v2 |
| Published after LOSS | impossible — K1 can't sign | n/a |
| Published after THEFT | worthless as cryptography: the thief can sign an equally-valid pair to *their* K2′. Two competing pairs = evidence of compromise, adjudicated socially/by lenses | evidence only |
| Slot dynamics under theft | the successor PIN is a slot; supersession is max-(seq,idx) — **whoever currently controls the key controls the pointer**. A proactive successor claim can be overwritten by a thief | must be understood as *live state*, not history; the anchored history of the slot (all supersessions) is the actual evidence trail |

Frozen doctrine (Codex reserved text, mirroring ADR-0050's kind=3): **successor claims are NEVER auto-followed.** No lens, SDK default, or resolver may silently rewrite trust from K1 to K2; UIs surface the claim and require explicit viewer confirmation (a lens-list edit). Auto-follow would hand every subscriber to whichever party currently holds a stolen key. Succession is a *display/lens-layer merge*; owned-object IDs never rewrite (no identity rewrite exists in the protocol).

What this convention is **not**: it is not rotation. It does not transfer the namespace (K1's owned objects stay under K1), it does not survive theft, and it does not scale to institutional key hygiene. It is the honest year-0 floor, and it doubles as the permanent *cross-identity* link format (person changes wallets; org re-charters) even after the KEL exists.

### 3.3 The org persona — the ERC-1271 wall, the cold-key practice, and whether it forces the KEL

**The wall, precisely:** an org's natural signer is a Safe/multisig — but an ERC-1271 "signature" is a *query against mutable chain state at a block height*, not an artifact (validity is a function of owners/threshold/proxy-impl *then*, on *that chain*). It cannot travel, cannot be verified after the chain dies, and the AA ecosystem is deliberately making it less portable (ERC-7739 anti-replay). A chain-free envelope signed by a Safe is a category error. **Ruled here: no ERC-1271 anywhere in the kernel, not even as a chain-local convenience.** A 1271 path would mint records that are second-class (non-portable) inside the one property ruled mission-critical, fragment the data exactly like the rejected per-write envelope toggle, and add a second verification mode to the most Etched surface. Institutions are the personas that most need the archive property; giving them a signing mode that quietly lacks it is a trap dressed as a feature.

**What orgs actually do in v2 (doctrine, documented):**

1. **Raw cold publishing key.** One secp256k1 key, HSM/air-gapped, used in a release ceremony. This is not exotic — it is how Debian, TUF roots, and PGP-signed release chains have operated for decades. The Safe governs money; the cold key governs authorship. The Safe (or anyone) *submits* — `msg.sender` is free.
2. **Org-as-lens-list for rotating personnel.** The org's cold key signs (a) the org's namespace/tree pins and (b) a published **lens list** (ordered trusted-author list) enumerating current members' identity words. Members author under their *own* words; viewers who subscribe to the org's lens see members' writes in the org's paths; personnel rotation = one cold-key write updating the list. Members' past records keep their own authorship (monotone — removal is not retroactive). The only un-rotatable atom left is the cold key itself, which is used rarely enough for ceremony-grade custody. This pattern works **today**, with zero new machinery — it is lenses doing exactly what they were designed for.
3. **Per-era key + successor pair** (§3.2) as the fallback for orgs that refuse custody ceremony: accept identity churn, keep continuity at the lens layer. Ugly for archives (namespace fragments per era); listed for honesty, not recommended.

**Does the org story force the KEL into v2?** The atproto evidence, weighed both ways as required:

- **Cuts FOR deferral:** 42M registered, ~0.17–0.2% on independent PDSs, "~nobody holds independently controlled rotation keys" (bnewbold's own concession). Sophisticated key self-management is empirically a niche behavior; machinery built for it ships untested and unexercised — and an *unexercised security-critical key-management subsystem is worse than an absent one* (Holochain's DeepKey: 8 years, never stabilized; Farcaster needed a product monopoly to make its registry invisible). Building the KEL now, with no users, inside the freeze window, is the classic way to blow the one verification budget that matters (the envelope spec).
- **Cuts AGAINST deferral:** the same numbers read the other way — 99.8% *delegated custody*. Mass-market users will not hold keys; they will use hosted signers/embedded wallets. atproto survives that because the escape hatch is *structural*: a user (or watchdog) can pre-provision a higher-priority rotation key and adversarially migrate away from a hostile host. **Bare-EOA EFS has no hierarchy and no hatch**: whoever operates the hosted key IS the author, full stop (the Lemmer-Webber critique lands with full force). Deferring the KEL means every hosted-custody author in the deferral window is capture-exposed with no pre-provisionable defense.
- **Synthesis (why deferral still wins, narrowly):** EFS's year-0 population is not atproto's consumer mass — it is crypto-native wallet users (the one custody culture with demonstrated self-custody at tens-of-millions scale) plus exactly the archive/DAO/registry institutions capable of cold-key ceremony. The mass-market/hosted personas arrive later, *with* the KEL. That sequencing story is coherent — **provided the KEL's arrival is a dated commitment, not a hope** (§5.4), and provided the substrate-decision experiment (c) trigger stands: a named institution presenting funded requirements for rotation pulls the KEL build forward.

**Named residual:** institutions with mandatory key-rotation compliance policies (much of gov/enterprise) are **blocked from authorship at year-0** — an adoption cost, accepted with eyes open. The org-as-lens-list pattern softens it (only the root is un-rotatable) but does not satisfy an auditor who requires root rotation.

### 3.4 Multi-device UX under TID device bits

The honest v2 statement: multi-device = **same seed on N devices** (wallet-style seed replication) or single-writer-plus-readers. There are no device keys without KEYGRANT, and KEYGRANT is reserved. What the design does buy today:

- **No per-device chain setup:** submission is permissionless, so a device needs the key and an RPC/relay endpoint — no gas, no account, no registration.
- **No manufactured equivocation:** device bits (§1.3) make same-microsecond writes from replicated-seed devices collide with p ≈ 1/1024 *only if* the random device bits also collide; on `SeqOccupied` the SDK bumps and re-signs. Record-level collisions are never branded duplicity (frozen, §1.3) — the SSB failure (second device ⇒ forked feed ⇒ identity death) is structurally excluded.
- **The residual hazard is seq-reuse across un-synced devices** feeding *different chains*: two devices signing different envelopes at the same (author, seq) and submitting to different chains diverge silently (each chain first-seen-wins its own). The union-read tie-break + `contested` grade (§1.3) makes this deterministic and visible, and it damages only that author. SDK discipline (persistent device bits + per-device monotone clocks) makes it vanishingly rare in honest operation.
- **What the KEL buys later, for contrast:** per-device *keys* (ADD_KEY per device), so a lost phone is a REMOVE_KEY event instead of a seed-rotation panic, and hot devices never hold the identity root. This — not orgs — is where consumer UX pressure for the KEL will actually come from.

---

## 4. The succession path, designed now (built later)

### 4.1 In-place upgrade vs new-identity+REDIRECT — adjudicated: **IN PLACE**

The question that decides whether EOA identity words are address-shaped forever. Trade table:

| Criterion | U: in-place (KEL incepts *for* the existing address-shaped word) | N: new digest identity + successor pair |
|---|---|---|
| Owned-object/namespace continuity | **full** — dataId/listId/slotId derive from the word; nothing rewrites; links never fork at a key event | none — old namespace freezes; every EOA→KEL migration replays the §3.2 social-migration pain permanently |
| Early-adopter fairness | year-0 authors get rotation retroactively | year-0 authors are punished forever ("your earliest, most historically valuable data is welded to a rotation-less key") — quietly recreates EAS's identity-welded-to-a-moment mistake |
| Verification epistemics | bare rule becomes "valid **unless a KEL I haven't seen** demotes this key" — absence of a KEL is unprovable off-chain | clean: shape ⇒ rule; address-shaped = bare forever (strongest year-100 property); digest-shaped = fail-closed |
| Year-100 offline verify of a bare record | needs KEL-absence grading (below) | needs nothing but the bytes |
| Theft dynamics | inception becomes a **race** post-compromise (FM-2) | same race, just relocated into the successor-pair layer |
| Classifier | shape no longer implies verification mode post-KEL (registry consulted per author) | shape = mode, O(1) |
| Cost to v2 | zero machinery; frozen read-rules (§4.2) | zero machinery |

**Ruling: U**, for three reasons. (1) Namespace continuity is mission-grade — "links never structurally 404" is the same property TAGDEF preserves for paths; letting a *key-management event* fork every owned-object reference violates it at the identity layer. (2) The epistemics cost is not new: "can't prove absence of a withheld KEL" is the **same statement** as "can't prove absence of a withheld REVOKE," which James already ruled acceptable with the same mitigations (home chain certain; elsewhere graded; expiry for safety-critical). Identity inherits the revocation vocabulary instead of inventing a worse dilemma. (3) Option N permanently punishes exactly the adopters a 100-year archive should treasure.

**Consequences, frozen now:**

- The identity word for an EOA is **address-shaped forever**, before and after inception. In-place inception (`boundAddress != 0`, §2.1) changes the *key state behind* the word, never the word. V-KEL-2 is the vector.
- Post-KEL, "address-shaped" no longer implies "bare EOA"; verification mode is a per-chain registry fact. The container classifier (Address > Schema > Attestation > Tag) is unaffected — it classifies containers, not verification modes.
- Digest-shaped inception (`boundAddress == 0`) remains available for born-KEL identities (orgs/institutions that never want an address association).

### 4.2 Deployment mechanics without a trust hole — peer deployment + frozen union-read

How does machinery arrive later without either upgrading the Etched kernel or smuggling a master key? Options examined:

| Option | Mechanics | Verdict |
|---|---|---|
| (a) In-kernel branch to a pre-computed empty CREATE3 registry address | kernel: `if registry.code exists, call it` | **REJECTED — FM-6 (master-key latch):** whoever holds the CREATE3 deployer can deploy *arbitrary* code at that address and own the entire auth path ("this key is valid for every author"). Credible neutrality forbids it |
| (b) Same, gated by a frozen `extcodehash` | kernel trusts only bytecode with hash H | rejected: freezing H requires **building and externally reviewing the full KEL registry now** — the exact scope-blow the reservation exists to avoid; and a bug in H's code is then unfixable |
| (c) **Peer deployment + frozen union-read rule** | the KEL-aware kernel ships later as a *peer store* on existing chains (and as the only kernel on new chains); readers union stores under frozen rules | **CHOSEN** — no trusted deployer, no kernel change, no latch; the cross-chain convergence semilattice already defines union semantics; an extra store on the same chain is just "another chain that shares a block clock" |
| (d) Fork-level event | wait for a hash-migration-class ceremony | subsumed by (c) — (c) *is* the additive-deployment shape the hash-migration playbook already commits to |

Frozen union-read rules (Codex reserved text; these are read-layer, client/lens-side, hence freezable without machinery):

1. **Union:** per-author state = the join over all admitted stores the reader accepts (same max-(seq,idx) supersession, §1.3 tie-break). Contracts doing point reads name their store(s) explicitly; new chains get one combined kernel, so two-store reads exist only on pre-KEL chains.
2. **Inception demotion (the load-bearing rule):** once an inception for word W is anchored on a chain at block N, bare-rule admissions of W's envelopes **in blocks after N** on that chain are read-graded `unauthenticated-post-inception` and excluded from slot supersession (they remain as evidence). Comparison is by **admission block order** (chain-asserted), never by seq (author-asserted) — otherwise a thief backdates seq to slip under the inception (FM-3). An honest author's stale pre-inception envelope submitted late loses nothing: its key is (normally) still valid in the KEL, so it re-verifies through the KEL-aware kernel.
3. **Cross-chain:** a chain with no KEL deployment can't see inceptions; its bare admissions of W read as `valid-as-admitted / KEL-unknown` — the same grade structure as revocation ("not revoked as far as this chain knows"). Normative vocabulary: **proven-valid / valid-as-of(head) / unknown — never resolve unknown as valid-forever.**

### 4.3 Verify-time cost, year-0 vs post-KEL

| Path | On-chain cost | Year-100 offline procedure |
|---|---|---|
| v2 bare-EOA (`submit`) | ecrecover 3.0k + EIP-712 hashing ~1–2k (constant domain separator) ≈ **4–5k/envelope**; `submitOne` adds ~1–2k Merkle | verify sig from bytes + Codex; **nothing else**. Plus epoch clause: inclusion receipt predating E(secp256k1) |
| post-KEL, bare author, old kernel | unchanged (frozen) | unchanged, **plus** the §4.2 grading: "bare-valid; KEL-absence unknown beyond this chain's head" |
| post-KEL, combined kernel, secp256k1 device key | ecrecover 3.0k + registry head SLOAD ~2.1k + keyWindow SLOAD ~2.1k ≈ **7–9k** | + walk the KEL prefix (O(events), each a sig verify) + ordering receipts between record and key events |
| post-KEL, p256 / passkey | P256VERIFY 6.9k + windows ≈ **11–13k**; WebAuthn adds ~200–400B calldata + SHA-256 + strict-prefix ≈ +2–5k | same + carried authenticatorData/clientDataJSON |
| identity events | incept ~100–150k once; add/remove/rotate ~50–80k (arch-B estimates) | n/a |

All within the <10k/leaf target at year-0 and within ~1.5× of it post-KEL. **Inherited caveat, stated so identity doesn't overclaim:** every year-100 row leans on "carried headers/receipts," and the substrate investigation flagged that procedure as *uncashed* on the PoS/L2 class (sequencer sigs aren't self-certifying; blobs prune; dead-PoS histories are long-range-forgeable post-CRQC). Identity's year-100 story is exactly as strong as the dead-chain fire drill result — run it (it is already a gate) and let identity claims cite it rather than assume it.

---

## 5. PQ posture

### 5.1 Threat model and timeline (from the identity-crux evidence, not re-derived)

Assume CRQC-grade forgery of all exposed-pubkey discrete-log schemes (secp256k1, P-256, ed25519) **sometime in the 2030s, date unknowable** (NIST IR 8547: ECDSA deprecated 2030 / disallowed 2035; expert surveys ~28–49% CRQC within 10 years; EF PQ program targeting ~2029 for L1 machinery). Keccak/Merkle structures survive (Grover halves the exponent; ~2^128 quantum preimage cost). Every ecrecover signature *discloses its pubkey*, so the entire v2 corpus is exposed-pubkey by construction.

### 5.2 What an archive full of secp256k1 signatures means post-CRQC

- A CRQC does **not** retroactively falsify old signatures; it destroys the evidentiary value of *verification performed after* it exists (anyone can then forge from the exposed pubkey).
- The rescue is hash-based existence evidence (RFC 4998 ERS): the verification statement degrades from "signed by W" to **"signed by W, provably anchored before epoch E"** — the grade century archives have always settled for. Block inclusion IS the hash-based timestamp; no new machinery.
- **Anchored vs shoebox, the honest split:** an envelope admitted to (or Merkle-anchored on) a chain before E keeps the degraded-but-real grade. A **never-anchored** signed envelope (the USB-stick artifact) verified after CRQC is **hearsay** — anyone could have forged it. The "write is a file / shoebox in 2040" story must carry this expiry label in the Codex: *submit or anchor before the epoch, or the artifact's authorship claim dies with the algorithm.*
- Second-order honesty (§4.3 caveat): the anchor evidence itself is only as strong as the youngest surviving chain that carries it — dead-PoS histories are long-range-forgeable post-CRQC, so unre-anchored evidence on dead chains degrades too. Durable grade requires the evidence to keep living on *some* chain whose integrity outlives the algorithm — which is replication, EFS's native act.

### 5.3 The epoch/anchoring answer without witness machinery

Frozen now: algoTag discipline (§2.2), the epoch-table **schema** (§2.6), the grading vocabulary, and the reserved ANCHORSET bulk-re-anchor format (§2.4). Built now: nothing. The operational convention: **LOCKSS replication is ERS renewal** — copying envelopes onto younger (eventually PQ-native) chains before each retirement epoch *is* the re-anchoring act; ANCHORSET is the future gas-cheap bulk form (one root covering many record digests). Permissionless, lens-visible, checkable — and honestly subject to the corpus's named year-5–15 failure mode: "anyone can" is how CT gossip never shipped; unrenewed branches degrade to existed-before-E, and the Codex says so instead of promising otherwise. The epoch table's *values* are the one honest mutable-governance surface (named, routed to the trust-root stewardship workstream — not solved here).

### 5.4 The bare-EOA PQ cliff — the reservation's deadline

Bare-EOA identities have **no PQ path for the identity itself**: post-CRQC the key is forgeable, so the author can't even sign a trustworthy successor claim (a forger signs one just as well). Pre-rotation-protected KELs are the only construction whose *recovery path* is hash-shielded today. And the in-place inception (§4.1) itself authenticates with a secp256k1 signature — **the upgrade door closes at the same epoch**. Therefore:

> **Every live bare-EOA identity must incept a KEL (with pre-rotation, ideally to PQ-capable keys) before E(secp256k1), or accept identity death at E** — its archive stays valid at the existed-before-E grade, but the word can never again write with evidentiary value, and no one can prove a post-E "migration" wasn't forged.

This converts "succession is RESERVED, not built" from an open-ended deferral into a **dated commitment**: the KEL must ship, be externally reviewed, and have seen real adoption *comfortably before the CRQC window* — i.e., machinery by ~2030, with NIST's 2030 deprecation as the institutional forcing function. If v2 ships in 2026–27, that is a 3–4 year runway: adequate, not generous. This deadline should be written into the transition plan as a first-class successor-workstream date, not folklore.

---

## 6. Recommendation — does anything force building more than the reservation in v2?

**No kernel machinery beyond the reservation is forced.** Scope verdict per candidate:

| Candidate | Verdict | Scope |
|---|---|---|
| KEL registry machinery | **defer** (atproto synthesis §3.3; unexercised key-management code is negative value; the freeze window's verification budget belongs to the envelope) | none in v2; **dated commitment ~2030 (§5.4)**; pull-forward trigger = substrate experiment (c) institutional demand |
| Verification-order stub / registry branch in the kernel | **reject** — FM-6 master-key latch; the peer-deployment + union-read design (§4.2) makes it unnecessary | frozen Codex read-rules only |
| ERC-1271 chain-local org path | **reject** (§3.3) — non-portable records inside the mission-critical property | none, permanently |
| Successor/DISAVOW conventions | **ship as client-layer**: reserved names + frozen interpretation (never auto-followed) + reference lens/SDK support. Slightly more than pure reservation, zero Etched surface, large year-0 payoff for §3.1 | docs + SDK/lens code |
| Org doctrine (cold key, org-as-lens-list) | **ship as documentation + SDK helper** — the lens machinery already exists | docs |
| WebAuthn profile | **freeze profile + generate vectors from ≥2 real authenticators during spec work** (the one reservation that must touch hardware to be trustworthy) | spec + vector generation, no contracts |
| Epoch table / ANCHORSET | **freeze schema + tags**; values to stewardship; no machinery | Codex text |
| TID/collision semantics | already kernel scope (envelope designer); identity hands over the frozen layout + the SeqOccupied-not-duplicity amendment to arch-B §3.3 | cross-cutting requirement, not new surface |

**What v2 identity work actually costs:** Codex sections (§1–§2 here, ~2 of the reserved chapters), the vector suite (§2.7; a few days including the WebAuthn hardware pass), the successor/org conventions in SDK+docs, and external review of the *reserved formats alongside the envelope spec* (they share the signature-domain review anyway — the identity events are typed-data over the same discipline). No new Etched contracts, no registry, no schedule risk beyond the already-budgeted envelope review.

---

## 7. Failure-mode register (named, for the red team)

| # | Name | Description | Status/mitigation |
|---|---|---|---|
| FM-1 | **Post-theft symmetry** | bare-EOA theft leaves victim and thief cryptographically indistinguishable; DISAVOW and successor claims are symmetric | inherent to v2; documented (§3.1–3.2); broken only by KEL pre-rotation |
| FM-2 | **Thief-inception race / flag-day rush** | when KEL ships, every valuable bare word should incept promptly; a 2027-compromised key's thief can incept *first* at launch, locking the victim out harder (rotate to thief keys) | unavoidable given bare-EOA start; mitigations at KEL build time: PLC-style priority/challenge window (metaHash reserves room); launch comms; NOT solvable by msg.sender checks (thief has the key) |
| FM-3 | **Seq-backdate slip-under** | thief backdates TID to pre-inception to evade demotion | closed: demotion compares admission-block order, not seq (§4.2 rule 2) |
| FM-4 | **Hosted-signer capture** | 99.8%-delegated-custody future: hosts hold bare keys = hosts are the authors; no adversarial-migration hatch until KEL | accepted for year-0 population (wallet culture); the real argument for the §5.4 deadline; named in docs so no one sells hosted bare-EOA as self-sovereign |
| FM-5 | **WebAuthn profile drift** | frozen-from-spec profile diverges from real authenticator behavior (clientDataJSON extensions, flags) | §2.3 hardware-vector gate before un-reserving |
| FM-6 | **Master-key latch** | pre-wired registry address or upgrade slot in the kernel = one deployer key owns all authorship | rejected by design (§4.2); peer deployment chosen |
| FM-7 | **Successor squat / auto-follow hijack** | unidirectional predecessor claims; lens software auto-following successor pointers hands subscribers to a thief | bidirectional-pair requirement + frozen never-auto-follow doctrine (§3.2) |
| FM-8 | **Seq-reuse divergence** | same (author,seq), different content, different chains → permanent replica disagreement | conditional convergence stated; deterministic tie-break + `contested` grade (§1.3); SDK prohibition |
| FM-9 | **Device-bit collision** | replicated-seed devices with colliding device bits + same microsecond | SeqOccupied + bump; never duplicity (§1.3) |
| FM-10 | **Epoch-table governance capture** | the one mutable table (algorithm retirements) is a trust root; capture = grade-rigging of history | named honestly; retire-only monotonicity frozen; governance routed to the stewardship workstream (not solved here) |
| FM-11 | **Shoebox expiry** | never-anchored envelopes become forgeable hearsay post-CRQC; the "USB stick in 2040" demo oversells unless labeled | Codex expiry label (§5.2); anchor-before-epoch doctrine |
| FM-12 | **Compliance lockout** | rotation-mandated institutions can't author at year-0 | accepted, named (§3.3); pull-forward trigger defined |
| FM-13 | **KEL truncation-replay** | replica holding a KEL prefix asserts stale key validity | grading rule (§2.1, §4.2): key validity is always as-of a head, never absolute off-home-chain |

---

## 8. Handoff notes (cross-cutting requirements to other designers)

1. **Envelope/kernel designer:** adopt the §1.2 admission predicate verbatim (incl. `ReservedAuthorShape` and reserved-word rejection); amend arch-B §3.3 rule 2 to `SeqOccupied`-not-duplicity (§1.3); adopt the union-read tie-break + `contested` grade; the EIP-712 struct/domain used in V-EOA-1 is your surface — if it changes, regenerate V-EOA-* and the domainSeparator constant here.
2. **Codex editor:** §1 is normative-now text; §2 lands as reserved chapters with the §2.7 vector suite; the read-grade vocabulary gains the identity grades (proven-valid / valid-as-of(head) / unknown) parallel to revocation's; constant *names* may be harmonized (efs.id.* vs efs.identity.*) but then all values must be recomputed — the printable-preimage discipline is the invariant.
3. **Transition plan:** add the §5.4 dated KEL commitment and the FM-2 launch-dynamics note as first-class successor-workstream items; add the WebAuthn hardware-vector task to the spec-work phase; the dead-chain fire drill gates identity's year-100 claims too (§4.3).
4. **Docs/lens reference implementation:** successor/DISAVOW conventions (§3.2, §2.5) with never-auto-follow; org doctrine (§3.3); the §3.1 consequence table belongs in user-facing docs nearly verbatim — it is the honest sales contract of bare-EOA v2.
