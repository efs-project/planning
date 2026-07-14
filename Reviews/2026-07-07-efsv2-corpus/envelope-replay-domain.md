# EFS v2 — Portable Authorship Envelope: wire + signing + replay-domain spec

**Role:** envelope/replay-domain cryptographer
**Status:** candidate-normative draft for external review (THE Etched surface — nothing here ships without the independent external-review gate from [[2026-07-07-carrier-decision]])
**Inputs:** carrier decision 2026-07-07; record-format investigation 2026-07-02; deterministic-ids.md (ID Codex v1); efs-substrate-decision.md §3 reservations; arch-B-native-kernel.md + its red-team fatals; research-efs-coupling-audit.md; contracts/specs/02 (v1 payload discipline).
**Scope:** the byte-exact signed artifact, its Merkle construction, record wire encodings, admission/replay semantics, signature-validity rules, REVOKE/expiry, golden vectors, invariant suite. NOT in scope (other owners): ID derivation formulas themselves (ported by reference), kernel storage layout/index shapes, lens read semantics, KEL machinery (formats reserved here, mechanics reserved).

Every ruling below states the alternative that lost and why. Divergences from the arch-B sketch are marked **[DIVERGES arch-B]** with cause. Three of them are load-bearing:
(D1) seq is **sparse and non-unique** — same-(author,seq) is never admission-blocking (closes cross-chain divergence + honors substrate reservation 5);
(D2) `claimId = keccak(DOMAIN_CLAIM, author, seq, recordDigest)` — content-addressed per (author,seq), not coordinate-addressed (closes cross-chain revoke ambiguity);
(D3) one canonical envelope digest (the EIP-712 digest) — arch-B's separate `DOMAIN_ENVELOPE` digest is deleted (two names for one artifact invite implementation drift).

---

## 0. Design invariants the whole spec serves

1. **One signature, chain-free, forever.** A stock `eth_signTypedData_v4` over one struct authenticates an arbitrary batch of records on every EVM chain, at year 0 and year 100, from the bytes alone.
2. **Every record independently extractable.** `(header, record, index, proof, sig)` is a self-verifying artifact of one record. Copying one record never drags its siblings.
3. **State is a pure function of the admitted record set.** Never of arrival order, submitter, or chain. This is the convergence theorem (§5.6) and the master rule every admission check is audited against (§5.7).
4. **No admission check may permanently reject what another kernel could accept.** Checks are either *intrinsic* (reject everywhere, forever — malformed bytes) or *delaying* (deps not yet present, clock not yet caught up). Anything else forks the multiverse.
5. **msg.sender never appears in any authentication or identity path.** The recovered-and-matched author word is the only identity input.
6. **Nothing here sells completeness or cross-chain currency.** No HEAD, no CHECKPOINT, no fork-choice. Absence is `unknown` unless a live chain's total state proves it (read-grade vocabulary is normative downstream).

---

## 1. The signing layer — EIP-712 domain and Envelope type (verbatim, frozen)

### 1.1 Domain

```
EIP712Domain(string name,string version)
name    = "EFS"
version = "1"
```

Byte-exact frozen values:

```
DOMAIN_TYPEHASH  = keccak256("EIP712Domain(string name,string version)")
                 = 0xb03948446334eb9b2196d5eb166f69b9d49403eb4a12f36de8d3f9f3cb8e15c3
keccak256("EFS") = 0x86de7f34f8cd77d65e9489f3427b3f6b08c425ecd155e00a363104f04e73e317
keccak256("1")   = 0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6
DOMAIN_SEPARATOR = keccak256(abi.encode(DOMAIN_TYPEHASH, keccak256("EFS"), keccak256("1")))
                 = 0x965d1d821f4d5f5b3c6163f20afd011409461d35f804af81022311dc64685057
```

**Field-by-field adjudication (every EIP-712 domain field):**

| Field | Verdict | Why |
|---|---|---|
| `name = "EFS"` | **KEEP** | The one string wallets display prominently. Alternative "Ethereum File System" (more collision-distinctive) lost: wallets truncate, ERC-7730 metadata (keyed to the domain) carries the long-form explanation, and accidental-collision defense already exists structurally — the domain *typehash* commits to the exact field set `(name,version)`, so only another deliberately chain-free two-field protocol named "EFS"/"1" could collide, and deliberate imitation is unpreventable by any constant (see FM9). |
| `version = "1"` | **KEEP** | Versions the *envelope format*, not the product ("EFS v2" is branding; this format has no predecessor). A derivation bug post-freeze mints version "2" — the same escape-hatch pattern as the ID Codex's `v1` suffix. |
| `chainId` | **DROP** | The entire point. A chainId welds the signature to one chain (EAS's exact mistake for EFS's purposes, verified in `EIP1271Verifier.sol`). Records are idempotent facts, not value transfers; replay *is* the feature (LOCKSS). Precedents: Farcaster's chain-unbound EIP-712 domains in production; EIP-7702 `chain_id = 0` as protocol-blessed chain-free ECDSA. The Codex MUST carry the inverse warning verbatim: *any value-bearing or one-shot-authorization message must never reuse this domain.* |
| `verifyingContract` | **DROP** | Same reason: binds to one deployment. Replay scoping is done by application idempotence (§5), not by contract address. Also removes the ADR-0048 bug class (addresses hashed into identity). |
| `salt` | **DROP** | Salt defends only against *accidental* cross-protocol collision, which the two-field typehash already narrows to near-zero, and defends not at all against deliberate imitation. An invisible constant that wallets never display is pure spec surface with no user-facing value; arch-B carried `salt = keccak256("efs.kernel.envelope.v1")` **[DIVERGES arch-B]** — deleted for minimal frozen surface. Cost of being wrong: none that a distinctive `name` doesn't already cover; flip trigger: if external review finds a live protocol with a chain-free `("EFS","1")` two-field domain, change `name`, not add salt. |

### 1.2 The Envelope struct

```
Envelope(bytes32 author,uint64 seq,bytes32 prev,bytes32 recordsRoot,uint32 count)

ENVELOPE_TYPEHASH = keccak256("Envelope(bytes32 author,uint64 seq,bytes32 prev,bytes32 recordsRoot,uint32 count)")
                  = 0x5e03a78978eda72ed80e997c290d99f5a99cde86dfcbc1ce62b628b46891bab1

hashStruct  = keccak256(abi.encode(ENVELOPE_TYPEHASH, author, uint256(seq), prev, recordsRoot, uint256(count)))
envelopeId  = keccak256(abi.encodePacked(hex"1901", DOMAIN_SEPARATOR, hashStruct))
```

`envelopeId` — the EIP-712 signing digest — is the **single canonical identifier** of an envelope: the idempotence key, the `prev` target, the event key, the partial-admission registry key. **[DIVERGES arch-B]**: arch-B defined a parallel `envelopeDigest = keccak(DOMAIN_ENVELOPE, …)` over the same five fields *and* signed the 712 digest — two bijective names for one artifact. Deleted: dual identifiers are how implementations drift (one impl keys dedup on one, one on the other; a mismatch is silent until it's consensus divergence).

### 1.3 Header fields — each one challenged

#### `bytes32 author` — IN the signed struct, not merely recovered. (The question asked; answered: IN.)

- **Recovered-only (rejected):** if the author is whatever `ecrecover` returns, then (a) the reserved identity indirection has **no slot** — a P-256 passkey or a KEL-registered session key can never act for an identity word, because the only expressible author is the secp256k1 address itself. The substrate ruling's exact corpse: "identity indirection cannot be retrofitted when the frozen verification path has no slot." (b) Signature malleability mints authorship from noise: a mangled signature that ecrecovers to *some* nonzero garbage address would create records attributed to a random party. With the author in-struct, the kernel compares recovered-vs-claimed and a mangled sig fails closed (FM7).
- **In-struct (adopted):** v1 verification rule is `author == bytes32(uint256(uint160(recoveredSigner)))` — for bare EOAs the check is exactly as strong as recovered-only, plus fail-closed, plus the KEL slot. When the identity registry exists (future kernel), the rule generalizes to "recovered key is in `author`'s active key window" with zero wire change — the signed artifact format never moves.
- Type is `bytes32`, never `address` — digest-shaped identity words are the frozen reservation (substrate §3.1). v1 kernels additionally require the word to be **address-shaped** (top 96 bits zero) and **nonzero**, because ecrecover-equality is the only authorization path built. Digest-shaped authors are *format-legal, kernel-v1-inadmissible* — they verify against future kernels; the artifact grammar doesn't change. (Wallet display of a padded address is mildly ugly; ERC-7730 metadata renders it. Accepted.)

#### `uint64 seq` — a TID logical clock. Byte-exact layout:

```
bit 63      : MUST be 0 (reserved; admission-rejected if set)
bits 62..10 : 53-bit unsigned microseconds since Unix epoch (UTC)   → good through ~year 2255
bits  9..0  : 10-bit clockId (per-device discriminator)

tidTime(seq)  = (seq >> 10) & (2^53 - 1)     // microseconds
clockId(seq)  = seq & 0x3FF
seq == 0      : admission-rejected (uninitialized-memory guard, mirrors the salt≠0 rule)
```

Client rules (normative for the SDK, not kernel-checked): `clockId` is drawn from a CSPRNG once per device installation; a device MUST emit strictly increasing `seq` values (if `now_µs ≤ last emitted time bits`, use last+1); on observing an own-author envelope on any chain bearing its own `clockId` that it did not produce, a device SHOULD re-roll its `clockId` (collision hygiene — see FM12).

Why a TID and not a counter: a per-author counter requires cross-device coordination (the SSB grave: second device ⇒ forked feed ⇒ identity death) and serializes multi-device writers (the EAS sequential-nonce grave, `_nonces[attester]++`). Why 10 device bits: two honest devices manufacture the same seq only on simultaneous same-microsecond writes *and* a 1/1024 clockId collision (~10⁻⁹ per concurrent write pair) — and per D1 even that is harmless (§5.4). Why the time bits are semantically load-bearing at admission (the +600 s rule, §5.3) but **never** identity-bearing: seq never enters any ID derivation — this is exactly the trap the deterministic-ID design exists to avoid (chain-time in identity), kept avoided.

#### `bytes32 prev` — kept, with hard fencing. (The question asked: what does it buy vs cost under sparse/partial submission?)

- **What it buys.** (a) For single-device contiguous authors — the air-gapped cold-publisher persona, precisely the highest-value 100-year archival author — `prev` gives genuine per-log hash-chain integrity a year-100 verifier checks for free. (b) A backward discovery pointer for replication ("to be complete through here, also fetch `prev`") — partial replication's practical problem is *finding* what else to copy. Cost: 32 bytes of calldata (~512 gas) and one opaque line in the wallet.
- **What it does NOT buy, stated so nobody re-derives it wrongly:** under sparse multi-device admission the author's envelopes form a DAG, not a chain; `prev` proves nothing about completeness and supports no fork-choice (the earliest-anchor fork-choice corpse stays buried). Two envelopes sharing a `prev` are NOT duplicity evidence — that is normal multi-device behavior.
- **The fence (normative):** `prev` is author-asserted, signed, carried, emitted — and **dead to the kernel's state machine. No admission rule, index, or read may ever consume `prev`.** In particular it must never be conditionally verified ("check it if we happen to hold the target"): conditional admission checks make admission depend on optional local knowledge and fork the multiverse (violates invariant 4). Client SHOULD-rule: `prev` is 0, or the `envelopeId` of an own-author envelope with strictly smaller `seq` (same-device by convention); stateless signers use 0.
- **Alternative (drop it) rejected narrowly:** dropping is the minimal-frozen-surface answer and was seriously weighed; kept because the cold-publisher chain integrity and the replication hint are real, the cost is one word, and the fencing above prevents the "vestigial field grows folklore semantics" rot that is the usual argument for deletion. Flip trigger: if external review finds any reviewer *still* trying to build admission or fork-choice semantics on `prev`, delete it — the field is worth less than that risk.

#### `bytes32 recordsRoot` — the Merkle root per §2. Nonzero (admission-checked; a keccak image is never 0 in practice, the check is a cheap sanity trap for zero-filled buffers).

#### `uint32 count` — the exact leaf count. Load-bearing three ways:

1. **Truncation evidence** (the arch-B red-team fatal, closed in §8.1): the root alone does not reveal cardinality; with `count` signed, any holder can prove exactly N records exist, kernels expose `admitted-of-count`, and "this partial carriage is partial" is machine-visible rather than silent.
2. **Proof domain**: every inclusion proof is validated against `index < count` and the §2.4 shape rule — out-of-range fabrication is structurally dead.
3. **Full-batch completeness**: `submit()` requires `records.length == count` and recomputes the root; a batch minus its REVOKE record is not that envelope.

`count == 0` is admission-rejected (no empty envelopes; a root over zero leaves is undefined).

#### Fields deliberately ABSENT from the struct (each one somebody will ask for):

| Absent field | Why absent |
|---|---|
| `deadline` / `expirationTime` | Would prevent late admission — which is the LOCKSS replication path. Envelope-level expiry contradicts the permanent archive. Currency-style expiry lives at claim level (§7.2), where it is a read-time semantic, not an admission gate. |
| `nonce` | `seq` is the nonce-analog; sequential nonces are the multi-device grave (audit §3.7). |
| `chainId` / target-chain set | See §1.1. Chain-set-enumerated domains were considered in the coupling audit and lose: they make every future chain a re-signing event, i.e. exactly the author-work the mission forbids. |
| `value` | Nothing value-bearing may ever ride this domain (Codex warning, §1.1). |
| `schemeTag` | A property of the signature container (§6.1), not of the signed message — the same digest must be signable by future schemes without re-freezing the struct. |
| `kernelVersion` | The domain `version` is the format version; kernel behavior is versioned by the Codex + deployment, never by signed bytes. |
| `bodyByteLength` / total-size commitment | The root + per-leaf `keccak(body)` already commit every byte. |

---

## 2. Merkle construction (byte-exact)

### 2.1 Frozen hashing constants (printable, versioned preimages — house rule)

```
DOMAIN_RECORD_V1 = keccak256("efs.kernel.record.v1") = 0x77fe391d64f6a6512e39247afad71e4041c6b8389e9b0602845a631337a1e874
DOMAIN_LEAF_V1   = keccak256("efs.kernel.leaf.v1")   = 0xdbf6cb87d48c6448f0cd897ddc8db48813eb93f6613755c9b2bd1b6d73a11716
DOMAIN_NODE_V1   = keccak256("efs.kernel.node.v1")   = 0x6eb9d93fa3cd72a2f3d7f5b0e43c2c64d173da6643e553a7971a0025dff8b5f8
DOMAIN_CLAIM_V1  = keccak256("efs.kernel.claim.v1")  = 0x5593b6730e9ba91940c4373147cdb7527a711b4cd4adc68bd4fccc05ea8e0881
```

All hashing is `keccak256` over `abi.encode` of fixed-width words; dynamic bytes are pre-hashed. `abi.encodePacked` is banned (the `("ab","c")==("a","bc")` collision class) — same lint rule as the ID Codex. Kernel-wire domains (`efs.kernel.*`) and ID domains (`efs.id.*`) are disjoint constant families: no image of one hash space is interpretable in the other (their first preimage words differ).

### 2.2 Leaf and node

```
recordDigest_i = keccak256(abi.encode(DOMAIN_RECORD_V1, uint256(op_i), kindTag_i, keccak256(body_i)))
leaf_i         = keccak256(abi.encode(DOMAIN_LEAF_V1,  uint256(i), recordDigest_i))      // i = 0-based leaf index
node           = keccak256(abi.encode(DOMAIN_NODE_V1,  left, right))
```

**Is a leaf itself an EIP-712 struct hash? No.** Considered: `leaf_i = hashStruct(Record(uint8 op,bytes32 kindTag,bytes body))` with a Record typehash. Rejected because the leaf hash never meets a wallet — EIP-712's two products (wallet display, domain-bound replay scoping) are both delivered at the envelope level; inside the tree, 712's typehash machinery adds a constant and a convention without adding a defense the domain-separated leaf/node constants don't already give. One hashing discipline everywhere (the Codex house rule) beats two.

**Second-preimage / cross-tree defenses, enumerated:**
- *Inner-node-as-leaf* (the classic 64-byte attack): leaf preimages begin with `DOMAIN_LEAF_V1`, node preimages with `DOMAIN_NODE_V1` — 96-byte preimages, disjoint by first word. No value is interpretable as both.
- *Leaf-as-node / root-as-record*: same disjointness; additionally the N=1 rule (§2.5) keeps the root inside the leaf image space, never a raw `recordDigest`.
- *Cross-tree replay*: a proof binds a leaf to one `recordsRoot`; the root is signed inside the envelope; the envelope binds `author`. Replaying Alice's record bytes under Mallory's envelope makes it *Mallory's* record (authorship is exclusively envelope-level; bodies are deliberately author-free — one source of truth, no mismatch class). Owned-kind IDs (`dataId = H(author, salt)`) then derive differently — no theft is expressible.
- *Order malleability*: the index is committed inside the leaf, so the same record set in a different order is a different root.
- *Cardinality malleability*: `count` is signed (§1.3).

### 2.3 Tree shape: positional, promotion for odd nodes

- **Positional (adopted) vs sorted-pair (rejected):** leaf order is semantic in EFS (parents-first validation order; deterministic tie-breaks) — sorted-pair trees erase position to save the proof's direction bits, a saving already spent once the index is committed in the leaf. Positional keeps the ERC-7920 *shape*. Note on ERC-7920: we adopt its architecture (one signature over a root of per-message hashes), **not** byte compatibility — it is a moving Draft and freezing byte-compat to a draft is a frozen-surface hazard. State this in the Codex so nobody "fixes" the mismatch later.
- **Odd node rule — promotion:** a level with an odd count passes its last node up unhashed. Alternatives rejected: *duplicate-last* (Bitcoin, CVE-2012-2459 — duplicated-leaf trees produce colliding roots for distinct leaf lists; `count` mostly neutralizes it but why carry the ambiguity), *pad-to-power-of-two with a zero leaf* (fabricates a preimage-less value into the tree; every zero-leaf is a standing "what hashes to this?" question).
- **Multiproofs: not in v1.** The normative verification primitive is the single-leaf proof. OpenZeppelin's `multiProofVerify` shipped an exploitable bug (GHSA-wprv-93r4-jj2p) in exactly this feature class; batching is served by `submit()` (full batch, no proofs needed) so multiproofs buy little. A future *non-Etched* helper may add them; the frozen kernel does not.

### 2.4 Proof format and verification algorithm (normative)

A proof for leaf `i` in a tree of `count` leaves is `bytes32[] proof`, siblings bottom-up, **promoted levels contribute no element**.

```
function verifyLeaf(bytes32 root, uint32 count, uint32 i, bytes32 leaf, bytes32[] proof) -> bool
    require(count >= 1 && i < count)
    h = leaf;  p = i;  width = count;  k = 0
    while (width > 1):
        if (p ^ 1) < width:                 // sibling exists at this level
            require(k < proof.length)
            (l, r) = (p & 1 == 1) ? (proof[k], h) : (h, proof[k])
            h = keccak256(abi.encode(DOMAIN_NODE_V1, l, r));  k += 1
        // else: odd node promoted — h unchanged, no proof element consumed
        p >>= 1;  width = (width + 1) >> 1
    require(k == proof.length)              // proof fully consumed — no trailing elements
    return h == root
```

The `k == proof.length` rule is normative: proofs with unconsumed elements are invalid (an accepted-with-garbage-tail proof is two byte-strings for one act — the same canonicalism discipline as signatures).

### 2.5 N=1 degeneration (byte-exact)

`count == 1` ⇒ `recordsRoot = leaf_0 = keccak256(abi.encode(DOMAIN_LEAF_V1, 0, recordDigest_0))`, `proof = []`.

The wallet interaction is *identical at every N* — one `eth_signTypedData_v4` over the same Envelope struct; N=1 is not a special wallet path, it is the same path with a one-leaf tree. Alternative (`root = recordDigest_0` raw at N=1) rejected: it would let a record digest double as a root, breaking the rule that every root is a leaf/node-image — one uniform rule, no special case, no ambiguity.

---

## 3. Record wire format

```solidity
struct Record {
    uint8   op;       // 0 = ASSERT, 1 = REVOKE — closed set, anything else admission-rejected
    bytes32 kindTag;  // spec-owned constant (ID Codex family), 0 for REVOKE
    bytes   body;     // exact canonical abi.encode of the per-kind tuple (§3.3)
}
```

### 3.1 `op` vocabulary — {ASSERT=0, REVOKE=1}, closed

- `ASSERT` covers both object minting and claim assertion — the object/claim distinction is carried by `kindTag` (KIND_* vs CLAIMROLE_*), not by the verb. A separate CREATE op would duplicate information the kindTag already carries.
- `CHECKPOINT` (arch-B op 2) is **deleted** **[DIVERGES arch-B]**: James's ruling sells no cross-chain currency — no HEAD/CHECKPOINT machinery in frozen surface. If a witness layer (Architecture E) ever wants signed state roots, that is a new record *kind* under a future additive module, not a frozen op.
- Alternative "fold REVOKE into a kindTag (CLAIMROLE_REVOKE) and drop op" was considered — saves one field; kept the verb/type split because (a) the top-level wire format stays self-describing (an archaeologist greps ops before understanding kinds), (b) validation dispatch on a uint8 precedes any bytes32 compare, (c) `op` is where a future *verb* (if one ever earns existence via a new format version) belongs without overloading the kind namespace.
- Unknown `op` ⇒ intrinsic reject (never "ignore unknown" — silently skipping records would make admitted-set semantics version-dependent).

### 3.2 `kindTag` — tag-core adjusted set

Constants are owned by the ID Codex (port, don't re-derive); listed here as the wire's closed v1 set:

| kindTag | class | duplicate policy (per substrate §3.4) |
|---|---|---|
| `KIND_TAGDEF` (succeeds ANCHOR — one derived-ID namespace for paths/folders/tags) | object, shared/unowned | same-id re-mint = idempotent no-op |
| `KIND_DATA` | object, owned | byte-identical = no-op; same-id-different-body impossible by construction (§5.5) |
| `KIND_PROPERTY` | object, shared (interned value) | idempotent no-op |
| `KIND_LIST` | object, owned | byte-identical = no-op; same-id-different-body = evidence, never registered, never batch-killing (§5.5) |
| `CLAIMROLE_MIRROR` | claim, multi-valued (no slot) | every distinct record is a distinct claim |
| `CLAIMROLE_PIN` | claim, cardinality-1 slot | slot LWW (§5.6) |
| `CLAIMROLE_TAG` | claim, cardinality-N | set-valued |
| `CLAIMROLE_LIST_ENTRY` | claim, cardinality-N (open fork: may collapse into TAG-shaped edge + kept LIST declaration — wire mechanism identical either way) | set-valued |
| `CLAIMROLE_REDIRECT` | claim, multi-valued (no slot) | distinct records distinct claims |
| **Reserved now, machinery later** (tags + body layouts frozen, kernels v1 reject): `KIND_TAGDEF_BLINDED` (body `(bytes32 parentId, bytes32 nameHash, bytes32 nodeKind)` — derives the same tagId as plaintext per ID Codex §8), `KIND_NAME_DISCLOSURE`, `KIND_KEYEVENT` (KEL — event format in the reserved Codex section), `KIND_WHITEOUT`. | | |

PIN-vs-TAG stays two kinds — the flagged trap is honored: cardinality lives in the record kind, never in a payload field, so file-placement reads stay O(1) and readers dispatch on the kind with zero decoding.

### 3.3 Bodies — the v2 payload tuples (ported from deterministic-ids §3, adjusted for tag-core + envelope)

**Canonical-encoding rule (normative, ports v1's `NonCanonicalPayload` discipline):** `body` MUST be the exact `abi.encode` of the tuple — validated by strict decode + structural checks + re-encode byte-compare; any trailing byte rejects. There is exactly one byte-string per logical record. This is intrinsic (invariant 4).

**Expiry rule:** every **claim** body ends with `uint64 expiresAt` (0 = never). **Objects carry no expiry** — objects are permanent by doctrine (path permanence, interned values, owned identities). Placement rationale in §7.2.

| kindTag | body tuple | notes |
|---|---|---|
| KIND_TAGDEF | `(bytes32 parentId, string name, bytes32 nodeKind)` | `name` = canonical NFC+percent bytes per the frozen name profile (validated on-chain byte-pass; NFC client-owned); `nodeKind` ∈ {generic 0, data, property, list} — note the deliberate renaming: the *record's* type is `kindTag`=KIND_TAGDEF, the *namespace node's* kind is the payload word `nodeKind`; `tagId = keccak(DOMAIN, parentId, keccak(name), nodeKind)` per tag-core. Non-revocable, no expiry — this record *is* the path-permanence + name-validation carrier that survived the ANCHOR drop. |
| KIND_DATA | `(bytes32 salt)` | salt ≠ 0; entropy rule per ID Codex §1. `dataId = H(DOMAIN_DATA, author, salt)` — author = envelope author. |
| KIND_PROPERTY | `(bytes32 datatype, bytes value)` | v1 admission: `datatype == DATATYPE_STRING` (string-only ruling enforced, non-string intrinsic-rejected); the field exists because `propertyId` derivation already interns the datatype tag — carrying it keeps the ID recomputable from the body with zero special-casing and reserves typed literals additively (a future kernel admits more tags; old kernels' rejection is version-skew of the admitted set, which converges per §5.6 on what is admitted). Alternative (pure `(string value)`) lost: it hard-codes DATATYPE_STRING into the derivation path invisibly and makes a future typed body a new kind + new derivation. **Coupled flag to ID-Codex owner:** if James's string-only ruling is meant to be *permanent* rather than v2-scoped, flip to the pure-string body and burn the reservation. |
| KIND_LIST | `(bytes32 salt, bool allowsDuplicates, bool appendOnly, uint8 targetType, bytes32 targetKind, uint256 maxEntries)` | `listId = H(DOMAIN_LIST, author, salt)`. **Recommendation to ID-Codex owner (closes §5.5's carve-out):** fold the declaration into the id — `listId = H(DOMAIN_LIST, author, salt, keccak(declBytes))` — making owned-kind declaration equivocation *structurally impossible* instead of evidence-handled. Costs nothing (client knows the flags at mint). |
| CLAIMROLE_MIRROR | `(bytes32 dataId, bytes32 transportId, string uri, uint64 expiresAt)` | v1 guards carry over (transport ancestry, non-empty uri, MAX_URI_LENGTH 8192, no scheme allowlist per ADR-0056). |
| CLAIMROLE_PIN | `(bytes32 definitionId, bytes32 targetId, bytes32 targetKind, bytes32 defParentId, bytes32 defKeyHash, uint64 expiresAt)` | virtual reserved-key carve-out fields as in ID Codex §5; slotId = f(role, author, definitionId, targetKind). |
| CLAIMROLE_TAG | `(bytes32 definitionId, bytes32 targetId, bytes32 targetKind, int256 weight, uint64 expiresAt)` | |
| CLAIMROLE_LIST_ENTRY | `(bytes32 listId, bytes32 target, uint64 expiresAt)` | identityKey = target; `address(0)`-shaped rejected per ID Codex §3. |
| CLAIMROLE_REDIRECT | `(bytes32 sourceId, bytes32 targetId, uint16 kind, uint64 expiresAt)` | kind taxonomy stays out of identity; kind=4 `movedTo` added per tag-core. |
| REVOKE (op=1) | `(bytes32 claimId)` | `kindTag` MUST be `bytes32(0)` (nonzero kindTag on a REVOKE is intrinsic-rejected — a meaning-free field must have exactly one canonical value); `claimId ≠ 0`. Format details §7.1. |

Records carry **no chain timestamp and no self-ID** (ID Codex rule: an attestation never carries its own id). `block.timestamp` at admission is per-chain provenance metadata in events, never semantics.

---

## 4. Claim identity — `claimId` (the revocation handle)

```
claimId = keccak256(abi.encode(DOMAIN_CLAIM_V1, author, uint256(seq), recordDigest))
```

**[DIVERGES arch-B]** — arch-B used `H(DOMAIN_CLAIM, author, seq, idx)` (coordinate-addressed). That formula contains a quiet cross-chain fatal under any seq-collision regime: after an honest (or malicious) same-`(author,seq)` pair, `(author,seq,idx)` names *different records on different chains*, so one portable REVOKE revokes different claims depending on where it lands. Content-addressing by `recordDigest` makes a claimId name exactly one record content, globally, forever.

Properties:
- **Client-computable before submission** (author knows seq + record bytes at signing) — the audit's open question #1 (slot-less MIRROR/REDIRECT handles) answered with no nonce machinery.
- **Carriage-independent**: the same logical claim carried in two envelopes (e.g. re-batched with a different `prev` or `count`) is ONE claim — envelope choice is pure carriage. This kills the "claim aliasing via header twiddling" surface at a given seq (see FM15 for the cross-seq residue).
- Same content at two different seqs = two claims (that is *re-assertion*, required so revoke-then-re-pin works — see §7.1 monotonicity).
- Identical record content twice inside one envelope collapses to one claim (harmless; duplicate content in one batch is meaningless by construction).
- REVOKE records have **no claimId** — they are not claims, are never registered, and are not revocable (no un-revoke; §7.1).

Objects need no claimId: they register by objectId; the registry's `firstSeen` provenance (author, seq, recordDigest) is bookkeeping, **semantics-free** per substrate reservation 4.

---

## 5. Admission & replay semantics

### 5.1 Verbs (kernel interface — informative shape, kernel owner's lane)

```solidity
submit(EnvelopeHeader h, Record[] records, bytes sig)                      // full batch: records.length == h.count, root recomputed, atomic
submitOne(EnvelopeHeader h, Record r, uint32 index, bytes32[] proof, bytes sig)  // single-record replication unit
envelopeStatus(bytes32 envelopeId) -> (bool registered, uint32 count, uint32 admittedCount)  // partiality is machine-visible
```

First contact with an envelope (either verb) **registers** it: signature verified once, `envelopeId → {author, seq, recordsRoot, count, admittedBitmap}` stored. Subsequent `submitOne` against a registered envelope skips signature re-verification (proof-only, ≈ log₂N keccaks — comfortably under the <10 k gas/leaf target; ecrecover ≈ 3 k paid once per envelope).

Verification ordering (DoS discipline): dedupe/registration lookup → header intrinsics (author≠0, address-shaped, seq rules, count≥1, root≠0) → signature → per-record checks. Cheapest first.

### 5.2 Idempotence (the replay rule)

- **Envelope-level:** an `envelopeId` already fully admitted ⇒ `submit` is a **no-op success** (zero state diff, cheap short-circuit *before* signature verification — the state is already committed, re-verifying buys nothing). This makes relayer races and LOCKSS resubmission harmless and front-running someone's submission *beneficial* (their state lands, they didn't pay).
- **Record-level:** an already-admitted `(envelopeId, index)` leaf ⇒ no-op success; a `submit` overlapping prior partial admissions skips admitted leaves and atomically admits the remainder.
- **Claim/object-level:** an already-admitted claimId or objectId arriving via a *different* envelope ⇒ no-op for registration, per §4 and the per-kind duplicate table (§3.2).
- **Signature-bytes-independence:** ECDSA is randomized — one envelope has many valid signatures. Idempotence keys on `envelopeId`, never on sig bytes. Two distinct valid signatures of one envelope are one envelope. (Vector 8.)

### 5.3 seq admission rules (all of them)

1. `seq != 0`; bit 63 == 0. *(intrinsic)*
2. `tidTime(seq) ≤ block.timestamp_µs + 600 s` — future-dating rejected. *(delaying: becomes admissible when wall clock catches up — resubmit later; never permanently divergent.)* Closes seq-exhaustion/far-future-flood (FM1): no admissible record can carry a seq beyond now+600 s, so a stolen key or buggy client can never plant a forever-winning LWW value; honest future writes always eventually exceed any admitted seq. Past is unbounded (2030 envelopes admit in 2090 — replication).
3. **No uniqueness, no contiguity, no gap rule.** *(the D1 ruling — see §5.4.)*

**Cost table for the seq-policy alternatives (the question asked):**

| Policy | Backfill / partial replication | Multi-device | Cross-chain convergence | Verdict |
|---|---|---|---|---|
| Kernel-enforced gap-free contiguous | dead (must replay everything in order) | dead (SSB fork-death) | ok | rejected |
| First-seen-wins unique per (author,seq), conflict REVERTs (arch-B) | ok | honest collision permanently blocks a record **on that chain only** | **broken**: chains that admitted different same-seq envelopes first can never reconcile — S₁∪S₂ is inadmissible on both; plus the claimId ambiguity (§4) | rejected — this is the quiet fatal in arch-B |
| **Sparse, non-unique (adopted)** | ok — any subset, any order | ok — collisions harmless | ok — admission is conflict-free by construction | costs: seq gives no completeness signal (`highestSeq` is a hint, consistent with selling no completeness); the author "log" is a DAG; an author can self-race (deterministic tie-break, §5.6) |

### 5.4 The seq-collision rule (equivocation, defused)

Same `(author, seq)`, different `envelopeId`: **both admissible.** The kernel keeps `firstDigestSeen[(author,seq)]` and, on admitting a second differing envelope, emits

```
event SeqCollision(bytes32 indexed author, uint64 seq, bytes32 envelopeIdA, bytes32 envelopeIdB)
```

— evidence, preserved by indexers (both artifacts are nonrepudiable signed bytes), adjudicated by lenses/curation, **never admission-blocking and never labeled duplicity in normative text**. This is substrate reservation 5 verbatim: *record-level seq collisions are NEVER duplicity; only home-registry head/KEL equivocation is* — and KEL equivocation belongs to the reserved identity layer, whose logs (unlike record logs) will be contiguous and kernel-enforced when built. The asymmetry is deliberate; do not let a future reviewer "harmonize" it.

Why not punish: two honest devices can collide (§1.3); an author who deliberately multi-writes a seq only perturbs their own slots, deterministically (§5.6); and any kernel-level punishment reintroduces the cross-chain divergence of the rejected policy above.

### 5.5 Owned-kind duplicate/equivocation policy (per substrate §3.4, sharpened)

- **DATA**: body is `(salt)` alone ⇒ same `dataId` implies byte-identical record ⇒ pure idempotent no-op. Same-id-different-body is *impossible by construction*. (This is why DATA's body must never grow fields — flag to ID owner.)
- **LIST**: same `(author, salt)` with different declaration bytes = author self-equivocation on an owned object. First-admitted registers (chain-local arrival fact — registry `firstSeen` is semantics-free); the later record is admitted **as evidence** (`event OwnedKindEquivocation(objectId, envelopeIdA, envelopeIdB)`), not registered, never batch-killing (a revert here would be a front-run griefing primitive under permissionless carriage). **Named honest cost:** per-chain registration of *which* declaration won is arrival-dependent — the one convergence carve-out (§5.6). It harms only the equivocating author's own list, and it disappears entirely if the ID-Codex owner adopts the §3.3 recommendation (fold declBytes into listId). Until then it stays on the failure-mode register (FM10).
- **Shared kinds (TAGDEF, PROPERTY)**: id is a pure function of the full payload ⇒ duplicates are byte-identical by construction ⇒ idempotent no-op. Blinded/plaintext TAGDEF pairs follow ID Codex §8 (id-equal, disclosure is a separate reserved record).

### 5.6 Convergence theorem (normative, invariant-tested)

For any two kernels and any subsets S₁, S₂ of valid artifacts: after admitting S₁ ∪ S₂ on both, per-author **object-existence, claim, revocation, and slot state are identical** on both.

Construction (all joins are set unions — a join-semilattice):
- objects: G-set keyed by objectId;
- claims: G-set keyed by claimId, each carrying `(author, seq, recordDigest, kindTag, body, expiresAt)`;
- revocations: G-set of `(revoker, claimId)` pairs; claim R is revoked iff `(R.author, claimId(R))` ∈ set — order-independent: a REVOKE admitted before its target simply waits in the set (vector 39);
- slot state: `winner(slot) = max over admitted, unrevoked claims in slot, ordered by (seq, recordDigest) lexicographic` — a pure function of the set. **[DIVERGES arch-B]**: arch-B ordered by `(seq, idx)`; index-based ordering is not carriage-independent under §4's content-addressed claims, and "which envelope carried it first" is arrival order — banned. The cost: two same-slot claims in one envelope resolve by digest (arbitrary-but-deterministic) instead of batch position; authored batches never legitimately write one slot twice, so this bites only degenerate self-writes.
- Read-time expiry (§7.2) is a filter over this state, deterministic per chain-time.

**Carve-outs, stated honestly:** (a) per-chain registration metadata (`firstSeen`, the LIST §5.5 winner) is arrival-dependent bookkeeping excluded from the theorem — and reservation 4 already declares it semantics-free; (b) LIST `maxEntries` fullness and any cap-gated admission is chain-local admission state (declared so in the Codex, per arch-B's carried resolution).

### 5.7 Admission-check classification (the invariant-4 audit — every check, one table)

| Check | Class | Note |
|---|---|---|
| sig verifies, scheme tag known, canonical sig encoding | intrinsic | |
| author ≠ 0, address-shaped (v1), matches recovered | intrinsic (per kernel version) | digest-shaped authors = future kernels; artifacts stay valid |
| seq ≠ 0, bit63 = 0 | intrinsic | |
| tidTime ≤ now + 600 s | **delaying** | resubmit later; admission flicker near boundary is FM14 |
| count ≥ 1, root ≠ 0, records.length == count (full submit), proof valid + fully consumed, index < count | intrinsic | |
| body canonical abi.encode, per-kind structural rules (name profile byte-pass, salt ≠ 0, datatype == STRING, uri length, targetKind ∈ closed set, REVOKE kindTag == 0 …) | intrinsic | |
| unknown op / unknown kindTag / reserved kindTag | intrinsic (per kernel version) | reserved kinds admit on future kernels — version skew of admitted sets, converges on what is admitted |
| dependency existence (parentId instantiated, dataId exists, transport ancestry, list declared, kind-attachment matrix) | **delaying** | read the kernel registry at admission time; seq plays NO role in dependency order — a later-seq envelope may mint the parent used by an earlier-seq claim (vector 37/38) |
| owned-kind same-id-different-body | evidence-admission (§5.5) | never a revert |
| duplicate anything | no-op success | never a revert |

**Master rule restated:** nothing in this table permanently rejects on one kernel what another kernel could accept, except intrinsic malformation (identical everywhere) and kernel-version skew (explicitly enumerated, additive-only).

### 5.8 Partial-batch semantics (the questions asked, answered)

- **May a relayer submit a leaf subset?** Yes — `submitOne` per record (or repeated). Cherry-picking is the granular replication unit and the point of the Merkle design.
- **Parents-first across batches?** Not a protocol rule across envelopes — dependency checks are against chain state at admission. Within a full `submit`, in-leaf-order validation gives parents-first for batch-internal DAGs (the SDK builds batches parents-first per ID Codex §5). A cherry-picked child whose parent isn't on the target chain reverts *now* and admits after the parent lands (any envelope, any seq, any submitter) — delaying, order-free, convergent.
- **Atomicity:** `submit` is all-or-nothing over its not-yet-admitted remainder (empty-state-diff on failure). `submitOne` is atomic per record. Mixed sequences are idempotent per §5.2.
- **Partiality is never silent:** `envelopeStatus` exposes admitted-of-count; replicas can distinguish complete carriage from partial (part of the truncation-replay closure, §8.1).

---

## 6. Signature validity & malleability (all edges)

### 6.1 Tagged signature container (frozen)

```
sigBytes = schemeTag (1 byte) ‖ schemeData

0x00 : forbidden forever (zero-filled-buffer trap)
0x01 : secp256k1 / EIP-712-digest ecrecover.  schemeData = r(32) ‖ s(32) ‖ v(1).  len(sigBytes) MUST == 66.
0x02 : RESERVED — P-256 raw over the same envelopeId digest (EIP-7951 P256VERIFY).
       schemeData = r(32) ‖ s(32) ‖ qx(32) ‖ qy(32); authorization = keccak(qx‖qy) in the author's KEL active window.
       Byte layout frozen now; machinery (KEL) reserved; v1 kernels reject.
0x03 : RESERVED — WebAuthn-wrapped P-256. Challenge-binding rule frozen now:
       signed bytes = authenticatorData ‖ SHA256(clientDataJSON), where clientDataJSON.challenge
       == base64url(envelopeId). Full assertion-envelope vectors live in the reserved KEL Codex section.
anything else : intrinsic reject (v1)
```

Alternative — raw 65-byte wallet output with length-based dispatch — rejected: a future scheme could legitimately be 65 bytes, and length archaeology on a frozen surface is how parsers fork. One byte, appended client-side (the wallet's 65-byte output is never itself the artifact), is the cheap reservation — the same lesson as algorithm-tagged keys. ERC-1271 is **never** admissible for envelope authentication at any version — contract signatures are chain-local and actively becoming less portable (ERC-7739); accounts are controllers, not authors.

### 6.2 secp256k1 rules (scheme 0x01), each with its reason

| Rule | Why |
|---|---|
| `s ≤ secp256k1n/2` (EIP-2 low-s), reject high-s | (r,s)↔(r,n−s) malleability: without it every envelope has two valid sig byte-strings. State is digest-keyed so replay is unaffected — the rule exists for canonical-artifact discipline (archives dedupe by bytes; evidence records must have one form) and to foreclose ecrecover edge behavior. |
| `v ∈ {27, 28}` only; 0/1 rejected | One canonical encoding. Alternative (normalize 0/1→27/28 in-kernel) rejected: normalization is client work; the kernel is strict. yParity-style encodings are a client concern. |
| `r ∈ (0, n)`, `s ∈ (0, n/2]` explicit range checks | Don't rely on precompile behavior at the spec level; the checks are ~free. |
| `recovered != address(0)` explicit, even though author-match subsumes it | Defense in depth: author ≠ 0 is checked, so a zero recovery can never match — but the explicit check means a future refactor of author rules cannot silently open the classic ecrecover-zero hole. MUST-revert, tested (vector 12). |
| `bytes32(uint256(uint160(recovered))) == author` | The fail-closed authorship rule (§1.3). A signature that verifies for the wrong author is *no signature*. |
| length exactly 66, no 64-byte EIP-2098 compact | Two accepted encodings = two byte-strings per act. Compact saves 1 byte; not worth dual forms on a frozen surface. |

### 6.3 Cross-scheme non-ambiguity

The author word pins the authorization path: v1 address-shaped authors verify only under scheme 0x01 with recovered-equality; future KEL-registered keys verify under the scheme their algoTag declares. One digest can therefore never be claimed by two different authors under two schemes — authorship requires the *envelope's own* author word to authorize the presented key. (The digest itself is scheme-neutral by design so future schemes sign the same bytes.)

---

## 7. REVOKE and expiry

### 7.1 REVOKE record (op=1)

```
op       = 1
kindTag  = bytes32(0)            // anything else: intrinsic reject
body     = abi.encode(bytes32 claimId)   // claimId ≠ 0
```

Semantics — all monotone, all order-free:
- Admission stores the pair `(envelopeAuthor, claimId)` in the revocation G-set. **No lookup of the target at admission** — the target may be unheld (delaying nothing: the pair waits; vector 39). No check is *possible* without breaking invariant 4, and none is needed:
- **Effectiveness rule:** claim R is revoked iff `(R.author, claimId(R))` ∈ set. A foreign-author REVOKE (Mallory naming Alice's claimId) admits and sits **inert forever** — the pair `(Mallory, id)` matches no claim whose author is Alice (vector 40). No authorization check needed at admission because authorship is structural.
- **Monotone:** no un-revoke, ever. Re-assertion is a *new claim at a new seq* (new claimId per §4) — which is why claimId includes seq. REVOKE records are not claims, have no claimId, and cannot be revoked (an "un-revoke of a revoke" is inexpressible; vector-tested).
- **Objects are irrevocable:** an objectId can never equal a claimId (disjoint derivation domains, `efs.id.*` vs `efs.kernel.claim.v1`), so a REVOKE naming an objectId is inert by collision-resistance, not by a check.
- Portability: the REVOKE is one signed record in the author's own artifact stream — replicates with the data, replays anywhere, exactly the property EAS lacked. Completeness of revocation cross-chain remains best-effort (can't prove a withheld revoke's absence) — priced in the carrier decision, answered by expiry:

### 7.2 Expiry — claim-level body field (the placement ruling)

| Option | Verdict | Why |
|---|---|---|
| Envelope-level `expiresAt` | rejected | Wrong granularity (kills whole batches), contradicts permanent archive, and would gate *admission* — expiry must never prevent archival carriage of history. |
| Record-struct-level field (`{op, kindTag, expiry, body}`) | rejected | Objects would carry a meaning-free field (objects are permanent by doctrine); every record pays 32 bytes; and a header-level field invites kernels to make it an admission check. |
| **Claim-body field `uint64 expiresAt`, last field of every claim tuple (adopted)** | ✔ | Travels inside the signed, portable claim (the TLS-cert answer to the revocation caveat); touches **no ID derivation** (claim bodies don't feed slotId/objectId formulas); read-time only. |
| App-layer PROPERTY convention | rejected | The one safety-critical currency mechanism must be normative and kernel-readable, not folklore — the carrier decision's practical rule ("apps use expiry for anything where serving stale data is dangerous") needs a place the kernel can enforce at read. |

Semantics: `expiresAt == 0` ⇒ never. Otherwise the claim is **excluded from default reads** (treated as revoked-shaped) on any chain where `block.timestamp > expiresAt`. Never admission-checked — an already-expired claim admits fine (it is history). Slot reads return the winner with its `expiresAt`; the winner-selection function itself (§5.6) ignores expiry (pure set function), the read layer filters — so cross-chain state stays convergent while read answers are chain-time-deterministic. Kernel read surfaces MUST expose expiry so lens resolvers can honor the read-grade vocabulary (an expired winner is *expired*, not silently absent).

---

## 8. Closing the arch-B red-team fatals (explicitly, one by one)

### 8.1 Truncation-replay — closed by visibility + monotonicity + expiry

The attack: replay an author's artifact onto a new chain *minus* selected records — canonically, a batch minus its REVOKE, making a foreign chain serve revoked data under the author's real signature.

Closures, layered:
1. `count` is signed (§1.3): a partial carriage is provably partial — `envelopeStatus` reports admitted-of-count; a replica claiming completeness of an envelope is checkable in O(1).
2. Revocation is envelope-independent (§7.1): a REVOKE in *any* admitted envelope revokes the claim; the attacker must withhold every envelope containing it, which is the inherent cross-chain completeness limit — **not silently mispresented**: reads on a partial replica answer per the read-grade vocabulary (unknown ≠ absent), and the lens amplifier rule downstream forbids resolving unknown as no-claim.
3. The bounded-damage valve is claim-level expiry (§7.2): for anything where stale-serving is dangerous, the claim self-limits with no dependence on revoke propagation at all.
4. What is *not* claimed: proof of absence of a withheld revoke. That is the portable-currency line James ruled out; this spec sells detection and bounding, not prevention — matching the carrier decision's language exactly.

(KEL truncation-replay — the identity-layer variant — is out of v2 scope by reservation; the reserved KEL format pre-commits to the countermeasure record logs deliberately lack: contiguous kernel-enforced `evSeq` + `prevEvent` linkage, per arch-B §2.2. The record/identity asymmetry is intentional and documented in §5.4.)

### 8.2 TID-collision footgun — closed by D1

Sub-cases: (a) honest multi-device same-seq → never duplicity (substrate reservation 5), both records admit, deterministic tie-break, `SeqCollision` is evidence not verdict; (b) buggy/malicious far-future seq ("win LWW forever") → inadmissible past now+600 s everywhere, so honest writes always eventually supersede; (c) cross-chain first-seen divergence (the fatal *created by arch-B's own remedy*) → dissolved by removing uniqueness entirely; (d) clockId collision hygiene → client re-roll rule (§1.3). Probability analysis in §1.3 (~10⁻⁹ per concurrent write pair even before the re-roll rule).

### 8.3 The bonus fatal found while porting: coordinate-addressed claimIds

Documented in §4 — arch-B's `H(author,seq,idx)` claimId + first-seen-wins makes portable REVOKEs ambiguous across chains. Closed by content-addressing. This is exactly the class of composition bug the external-review gate exists for; it is called out here so reviewers check the fix rather than re-import the bug from the corpus.

---

## 9. Golden vectors (normative enumeration — values generated by the reference impl + `@efs/ids`, pinned in the Codex; ~42)

Constants above (§1.1, §1.2, §2.1) are already byte-pinned. Unless stated, vectors use: privkey `0x…01`, its address as `author` (left-padded), `seq = TID(2026-07-07T00:00:00Z, clockId=42)`, `prev = 0`.

**A. Constants & primitives**
1. `DOMAIN_SEPARATOR` bytes (pinned in §1.1) recomputed from preimages.
2. `ENVELOPE_TYPEHASH` bytes (§1.2).
3. All `efs.kernel.*` constants from printable preimages (§2.1).
4. `recordDigest` of minimal DATA record (op=0, KIND_DATA, body=abi.encode(bytes32 salt=0x11…11)).
5. `leaf_0` of vector 4; assert ≠ recordDigest (leaf-wrapping rule).
6. N=1 envelope: hashStruct, envelopeId for (author, seq, prev=0, root=leaf_0, count=1).

**B. Signing & malleability**
7. Full N=1 sign: (r,s,v), tagged sigBytes (0x01‖…, 66 bytes), recovered == author ⇒ admit.
8. Second valid signature of the same envelope (different ECDSA nonce) ⇒ same envelopeId ⇒ idempotent no-op.
9. High-s transform of vector 7 ⇒ reject.
10. v=0 encoding ⇒ reject; v=29 ⇒ reject.
11. Untagged 65-byte sig ⇒ reject; 64-byte compact ⇒ reject; schemeTag 0x00 ⇒ reject; 0x02 (reserved P-256) ⇒ reject in v1.
12. Author mismatch (valid sig, header author = other address) ⇒ reject; author = 0 ⇒ reject; corrupted sig with garbage recovery ⇒ reject; non-address-shaped author (v1) ⇒ reject.

**C. Merkle shapes & proof attacks**
13. N=2: leaves, root, proofs idx 0 and 1.
14. N=3: promotion at level 0; proof for idx 2 (promoted path, shorter proof).
15. N=4: proofs all indices.
16. N=5: promotion at two levels; proof idx 4.
17. N=7 vs N=8 over shared prefix leaves: distinct roots (cardinality committed).
18. Inner-node-as-leaf forgery: present a level-1 node as a recordDigest with a crafted proof ⇒ root mismatch.
19. Proof with one extra trailing element ⇒ reject (fully-consumed rule); proof missing an element ⇒ reject.
20. index ≥ count ⇒ reject; valid leaf presented at wrong index ⇒ root mismatch; duplicated-last-leaf tree (Bitcoin-style) ⇒ root ≠ promotion root (shape rule).

**D. Record bodies (each: canonical body bytes + recordDigest + derived ID cross-check against `@efs/ids`)**
21. TAGDEF root-parent, name "docs", nodeKind generic ⇒ tagId.
22. TAGDEF NFC pair: "café" precomposed vs decomposed *input* ⇒ identical canonical body; raw non-NFC bytes on-wire ⇒ reject (byte-pass); unassigned-codepoint name ⇒ reject.
23. TAGDEF percent-encoding: `Q%26A%3A%20Episode%205` accepted; lowercase `%2f` ⇒ reject; bare space ⇒ reject.
24. DATA salt=0x11…11 ⇒ dataId(author); salt=0 ⇒ reject.
25. PROPERTY (DATATYPE_STRING, "image/jpeg") ⇒ propertyId; datatype=0 ⇒ reject; datatype=DATATYPE_INT256 ⇒ reject (v1 string-only).
26. LIST full tuple ⇒ listId; appendOnly+allowsDuplicates with maxEntries=0 ⇒ reject (ported guard).
27. MIRROR with `data:` URI, expiresAt=0; payload with one trailing byte ⇒ reject (NonCanonicalPayload).
28. PIN plain + PIN virtual-carve-out (defParentId/defKeyHash nonzero, recompute rule) ⇒ slotId; expiresAt=T set.
29. TAG negative weight; LIST_ENTRY; REDIRECT kind=4 movedTo — canonical bodies + digests.
30. REVOKE of vector-28's claimId: body bytes; REVOKE with kindTag ≠ 0 ⇒ reject; claimId = 0 ⇒ reject.

**E. seq / TID**
31. TID compose: (2026-07-07T00:00:00Z µs, clockId 42) ⇒ exact uint64; decompose round-trip.
32. bit63 = 1 ⇒ reject; seq = 0 ⇒ reject.
33. Future bound: tidTime = adm.time + 601 s ⇒ reject; + 599 s ⇒ admit; same envelope re-submitted after clock passes ⇒ admit (delaying-only demonstrated).
34. Seq collision: two envelopes same (author,seq), different roots ⇒ both admit; `SeqCollision` emitted once; slot winner = max (seq, recordDigest).

**F. Replay / admission / convergence**
35. Byte-identical full resubmit ⇒ no-op success, zero state diff (state-root compare).
36. `submitOne(idx 2 of 5)` alone, deps satisfied ⇒ admits; `envelopeStatus` = (registered, 5, 1).
37. Child-before-parent via `submitOne` ⇒ reject; parent then child ⇒ admit; final state equals full-submit state.
38. Cross-kernel convergence: same 3-envelope set admitted (A: full, in order) vs (B: shuffled subsets across 7 txs) ⇒ byte-identical per-author state.
39. REVOKE admitted before its target claim (separate envelopes, either order) ⇒ claim ends revoked both ways.
40. Foreign-author REVOKE naming Alice's claimId (signed by Mallory) ⇒ admits, inert; Alice's claim stays active.
41. Expiry: claim expiresAt=T ⇒ read at T−1 includes, T+1 excludes; admission at T+10 still succeeds; winner-with-expiry surfaced (not silently absent).
42. Owned-kind equivocation: two LIST records same (author,salt), different flags ⇒ first registers, second ⇒ `OwnedKindEquivocation` evidence, batch survives.

Plus the **dead-chain fire drill** as a vector-shaped procedure: verify vector 36's record from exported bytes alone (header, record, proof, sigBytes, Codex constants — no RPC), then re-admit on a fresh kernel and assert state equality. (This cashes the 100-year offline-verification claim for the envelope layer.)

## 10. Invariant / property suite (freeze-blocking, run against deployed bytecode)

- **I1 Convergence/join:** ∀ random artifact sets, random partitions, random admission orders on two kernel instances ⇒ identical object/claim/revocation/slot state. (The §5.6 theorem, fuzzed.)
- **I2 Idempotence:** any admitted artifact re-submitted by any verb/path ⇒ zero state diff.
- **I3 Empty-diff-on-revert:** any failing submit leaves no state.
- **I4 Non-malleability:** bit-flip fuzz over sigBytes/header/proof/body ⇒ reject, or a different envelopeId (never same-id-different-state); no two distinct accepted sigBytes yield different state.
- **I5 Proof soundness:** random trees ⇒ forged proofs / wrong indices / truncated & extended proofs all fail; all honest proofs verify; promotion paths exercised at every width parity.
- **I6 Monotone revocation:** no reachable transition un-revokes; re-assertion always mints a fresh claimId.
- **I7 LWW determinism:** slot winners invariant under admission-order permutation; (seq, recordDigest) total-order property.
- **I8 Dependency safety:** no claim admitted whose object dependency is absent at that moment, on any interleaving.
- **I9 Duplicate-policy matrix per kind** incl. the four blinded/plaintext TAGDEF orderings (ID Codex §13.4) and §5.5 owned-kind rows.
- **I10 Cross-implementation differential:** Solidity kernel vs TS reference simulator, CI-fuzzed — same admitted set ⇒ same state (the forSchema-imitation countermeasure: two lineages).
- **I11 No-permanent-divergence audit:** every admission check exercised as intrinsic (rejects everywhere, deterministically) or delaying (a later admission succeeds on every kernel) — the §5.7 table is executable, not prose.
- **I12 Evidence preservation:** SeqCollision / OwnedKindEquivocation events carry both digests; indexer retains both artifacts.
- **I13 Gas ceilings:** `submitOne` verify path (registered envelope) < 10k gas excl. body storage; ecrecover-per-envelope amortization measured; numbers into the gas-honesty baseline.
- **I14 Dead-chain drill** (§9) in CI against a torn-down devnet.

## 11. Failure-mode register (named, with dispositions)

| # | Failure mode | Disposition |
|---|---|---|
| FM1 | seq exhaustion / far-future flood | closed (§5.3 rule 2) |
| FM2 | SSB fork-death (contiguity welded to identity) | closed (D1; no contiguity anywhere in record logs) |
| FM3 | cross-chain revoke ambiguity | closed (D2 content-addressed claimId) |
| FM4 | truncation-replay | bounded + visible, §8.1; absence-proof deliberately not sold |
| FM5 | inner-node/leaf confusion, cross-tree replay | closed (§2.2 domain separation) |
| FM6 | duplicate-leaf root ambiguity (CVE-2012-2459 class) | closed (promotion + signed count + indexed leaves) |
| FM7 | malleability-minted authorship | closed (author-in-struct fail-closed + §6.2) |
| FM8 | ecrecover zero-address hole | closed twice (author≠0 + explicit check) |
| FM9 | domain imitation / wallet phishing into signing an envelope | **residual, unclosable cryptographically** — mitigations: distinctive display name, ERC-7730 clear-signing artifact (deliverable), wallet-education copy; the struct's opaque `recordsRoot` is the risk locus — SDK must render the batch summary the user approves |
| FM10 | owned-kind declaration equivocation (LIST) | carve-out + evidence (§5.5); **recommended structural fix routed to ID owner** (fold declBytes into listId) |
| FM11 | relayer withholding revokes on foreign chains | inherent (carrier decision); answered by claim expiry (§7.2) + read-grade vocabulary |
| FM12 | honest clockId collision | harmless by D1; hygiene re-roll rule (§1.3) |
| FM13 | replay-anywhere is a values commitment (author can't keep signed records off a chain) | acknowledged, unchanged from arch-B §12.3 — documentation + lens/gateway posture, not a wire problem |
| FM14 | admission flicker at the +600 s boundary | delaying-only; relayers retry; never divergent |
| FM15 | claim aliasing across seqs (author re-signs same content at new seq, revokes only one) | self-harm only; closed at same-seq by D2; cross-seq handled by revoke-by-slot tooling (kernel exposes active-claims-per-slot enumeration — requirement routed to kernel owner) |

## 12. What would flip these rulings + routed items

**Flips:** (a) external review finds a live chain-free `("EFS","1")` domain collision → rename `name` (not add salt); (b) a concrete need for kernel-consumed `prev` semantics → delete `prev` instead (the fence is the condition of its existence); (c) James rules string-only properties *permanent* → collapse PROPERTY body to `(string value)`; (d) the ID owner adopts declaration-committed listId → delete §5.5's carve-out and FM10; (e) LIST_ENTRY collapses into the TAG-shaped edge (open fork) → delete one body row, mechanism unchanged.

**Routed:** to **ID-Codex owner** — listId declaration-folding recommendation; DATA body must stay single-field; TAGDEF domain-constant naming (`efs.id.anchor.v1` vs a renamed tagdef constant — either works, pick once, vectors follow); PROPERTY datatype coupling. To **kernel owner** — per-slot admitted-claim enumeration read (FM15); storage of per-envelope bitmap; event set alignment with v2 §10. To **identity owner (reserved)** — scheme 0x02/0x03 vector generation inside the KEL Codex section; KEL contiguity rules per §8.1. To **SDK owner** — clockId lifecycle, prev tracking, revoke-by-slot tooling, ERC-7730 artifact (FM9), canonical-encoding builders.
