# EFS v2 — Native FILE-MANIFEST + Merkle-chunk submission (the "S3 multipart upload" for the kernel)

**Role output.** Designs the mechanism by which a large file becomes an on-chain, contract-readable, author-committed object under **one** `eth_signTypedData_v4`, with the bytes streamed afterward — chunked, parallel, out-of-order, resumable, idempotent, and portable — by relayers/burner/anyone, **with no additional user signature**.

**Status:** draft (spec-grade). **Tier of the surface it proposes:** Etched (kernel entrypoint + chunk-tree constants + storeId derivation + storage layout + one reserved-key row); Durable (the PARTIAL read grade + serving behavior). **Depends on / designs within:** `codex-envelope` (the EIP-712 Merkle envelope, verifyLeaf primitive, domain-separation discipline), `codex-kinds` (5 kinds, reserved-key table, VAL/REF layouts, auto-intern precedent), `codex-kernel` (submit/submitSubset, validate-then-commit, tombstone slots, spine, ERC-7201 layout), `read-lens-spec` (grade vocabulary, BYTES-UNAVAILABLE flag), `deterministic-ids` (dataId/tagId/slot math, CREATE2). **Gas numbers are concrete estimates, explicitly UNMEASURED — flagged inline; a CI gas snapshot replaces them before any ADR cites them.**

---

## 0. The one-paragraph idea

The kernel already lets **one signature commit a whole batch**: the author signs a Merkle root (`recordsRoot`) once, and any record in that batch verifies independently, `msg.sender` ignored, author recovered from the signature. This design reuses that lever **one level down**. The file's bytes get their own Merkle tree — a **`chunksRoot`** over the file's chunks — and that `chunksRoot` is embedded **inside the body of one signed record** (the FILE-MANIFEST). So the author's single envelope signature **transitively commits every byte of the file**: `signature → recordsRoot → manifest body → chunksRoot → every chunk hash`. Chunks are then submitted **without any signature at all** — each chunk carries only `(chunksRoot, index, bytes, proof)`, and the kernel admits it iff the bytes prove against the author-committed `chunksRoot`. Authorship is settled by the manifest; chunk integrity is settled by the proof; `msg.sender` never matters. This extends the kernel's "anyone can relay a signed record" property to "anyone can relay a proven chunk." One prompt authorizes the entire multi-block upload.

---

## 1. What the manifest *is* (no 6th record kind)

The hard-won 5-kind model (`codex-kinds`) is preserved. The manifest is **not** a new kind — it is a **new reserved-key row** on `DATA`, exactly parallel to the existing `mirrors`/`contentHash`/`size` rows, carrying a typed value:

| key | parent | roles | layout | validation | notes |
|---|---|---|---|---|---|
| **`chunks`** | DATA | **PIN** (cardinality-1) | **VAL struct** (non-interned, side-effecting) | fields well-formed; opens/consistency-checks a chunk store | admission side-effect: `_openChunkStore` |

Add exactly this one row to the frozen reserved-key table (currently 14 rows → 15). It slots beside `mirrors`: where `mirrors` points at *external* transports (`web3://`, `ipfs://`, `ar://`) by unsigned URI string, **`chunks` commits the bytes cryptographically and inline** and opens a kernel-managed on-chain store. `mirrors` stays for redundancy and off-chain copies; `chunks` is the on-chain-native, author-committed source.

Why a PIN (cardinality-1), not a TAG:
- One current byte-content per file version is exactly cardinality-1. The PIN **slot** gives O(1) point reads (`getSlot`), O(1) supersession (re-`chunks`-PIN at higher seq = update the byte-content pointer in place), and clean revocation (revoke the manifest → slot tombstones → the file reads as "author withdrew the bytes", not "file broken").
- Versioning across *different* content stays the existing story: new `DATA` + re-placement + `supersededBy` (unchanged). Within one `DATA`, re-`chunks`-PIN swaps the bytes.

Why VAL but **non-interned** (unlike other VAL reserved keys): a manifest value (keyed on a globally-unique `chunksRoot`) is per-file-unique, so interning it (auto-mint a `propertyId` nobody reuses) is pure waste. Instead the kernel decodes the tuple directly and runs a side-effect (`_openChunkStore`). Auto-intern already establishes the precedent that VAL-edge admission can have kernel side-effects; this is a *different* side-effect on a *typed* reserved key. The body is still stored verbatim in `bodies[claimId]` (bodies-in-state ruling), so `getClaim` returns the manifest and readers get `chunksRoot`/`contentHash`/`size` from one point read.

### 1.1 Manifest body layout (canonical `abi.encode`, round-trip-checked)

```solidity
// VAL body of a `chunks`-key PIN. Canonical abi.encode of this exact tuple; any trailing byte rejects
// (ports the kernel's NonCanonicalPayload discipline). expiresAt is the claim-body trailer word (envelope amendment 4).
struct FileManifest {
    bytes32 chunksRoot;     // apex-with-count commitment over the file's chunks (§2)
    uint32  chunkCount;     // advisory n (authoritative n is learned+bound from the first valid chunk, §3.3) — for reads/UX
    uint8   storageTier;    // 0 = SSTORE2 (default), 1 = inline-state, 2 = commitment-only  (§4)
    bytes32 contentHash;    // multihash over the DECODED whole file — end-to-end integrity of the reassembled bytes
    uint64  size;           // decoded byte length (UX/paging hint)
    bytes32 encodingTag;    // chunk-encoding descriptor: keccak("efs.enc.<name>.v1")  (raw / gzip / zstd / erasure-coded…)
    uint64  expiresAt;      // claim-body trailer (0 = never); clock-free storage, clock-aware reads
}
```

`contentHash`, `size`, `encodingTag` fold the previously-separate reserved-key claims into the one signed manifest so the file's identity, exact byte-content, integrity, and decoding are a **single atomic, self-contained, portable unit** (the "publish self-contained units" doctrine, made structural). A reader who reassembles all chunks re-decodes per `encodingTag` and verifies against `contentHash` end-to-end. (`contentHash` remains additionally publishable as its own reserved key for cross-mirror integrity; the manifest copy is the authoritative one for the native store.)

### 1.2 Manifest derivation & slot (all offline / client-computable)

```
dataId        = keccak256(abi.encode(DOMAIN_DATA, authorWord, salt))                    // owned identity (unchanged)
chunksKeyHash = keccak256("chunks")                                                       // reserved key
chunksDefId   = keccak256(abi.encode(DOMAIN_ANCHOR, dataId, chunksKeyHash, KIND_PROPERTY))// virtual reserved-key anchor (deterministic-ids §5 carve-out)
manifestSlot  = keccak256(abi.encode(DOMAIN_SLOT, CLAIMROLE_PIN, authorWord, dataId, chunksDefId))
claimId       = keccak256(abi.encode(DOMAIN_CLAIM_V1, authorWord, seq, recordDigest))     // content-addressed (envelope ruling)
```

Everything a client needs to know *before* mining is derivable: the file's `dataId`, its manifest slot, the store to fill. No mined-tx dependency, deploys/streams parallelize.

---

## 2. The chunk Merkle tree (the byte-commitment, chain-free)

A **second** Merkle tree, disjoint from the envelope's record tree by domain constants, using the *same* hashing discipline (positional, index-committed leaves, odd-node **promotion**, `abi.encode` of fixed-width words, `abi.encodePacked` banned):

```
DOMAIN_CHUNKLEAF_V1  = keccak256("efs.kernel.chunkleaf.v1")
DOMAIN_CHUNKNODE_V1  = keccak256("efs.kernel.chunknode.v1")
DOMAIN_CHUNKSROOT_V1 = keccak256("efs.kernel.chunksroot.v1")
DOMAIN_CHUNKSTORE_V1 = keccak256("efs.kernel.chunkstore.v1")

chunkLeaf_i = keccak256(abi.encode(DOMAIN_CHUNKLEAF_V1, uint256(i), keccak256(chunkBytes_i)))   // i = 0-based
merkleApex  = fold(chunkLeaf_0 … chunkLeaf_{n-1})     // node = keccak(DOMAIN_CHUNKNODE_V1, left, right); odd promotes
chunksRoot  = keccak256(abi.encode(DOMAIN_CHUNKSROOT_V1, uint256(n), merkleApex))               // ← binds count n at the apex
```

**Binding `n` into `chunksRoot`** (the apex hash) is the key robustness move. It makes `chunksRoot` a *complete content address*: it commits the chunk count **and** every chunk's hash. Consequences:
- Two authors who chunk identical bytes identically produce the **same** `chunksRoot` → the same store → **automatic global dedup** (cross-file, cross-author).
- No `(root, count)` ambiguity: a single `bytes32` is the whole content identity.
- The submitter's claimed `count` is **cryptographically validated** on every chunk (below), so nobody can grief a store by declaring a wrong count.

Disjointness from the envelope tree: `efs.kernel.chunkleaf.v1` ≠ `efs.kernel.leaf.v1`, `efs.kernel.chunknode.v1` ≠ `efs.kernel.node.v1`. A chunk proof can never be replayed as a record proof and vice-versa (preimages differ in their first word — the same argument the envelope spec uses for its leaf/node/record disjointness). Multiproofs excluded from v1 (single-leaf proof is the only primitive), same rationale as the envelope (OZ multiproof CVE precedent).

**verifyLeaf reuse.** The chunk verifier is the envelope's `verifyLeaf` primitive with the chunk domain constants and the apex-with-count wrap:

```solidity
function _verifyChunk(bytes32 chunksRoot, uint32 n, uint32 index, bytes32 leaf, bytes32[] calldata proof)
    internal pure returns (bool)
{
    // recompute merkleApex from (index, leaf, proof) at tree width n, promoted-odd, index-committed
    bytes32 apex = _foldChunkProof(index, leaf, proof, n);
    return keccak256(abi.encode(DOMAIN_CHUNKSROOT_V1, uint256(n), apex)) == chunksRoot;
}
```

Because `chunksRoot` committed the true `n`, only the true `n` reproduces it → **`n` is authenticated per submission**, not trusted.

---

## 3. Kernel-side storage & the partial-file accumulator

### 3.1 Storage layout (ERC-7201 namespaced; frozen in the Codex — `eth_getProof` reads point at these slots)

```solidity
// storeId = keccak256(abi.encode(DOMAIN_CHUNKSTORE_V1, chunksRoot, storageTier))
//   tier is in the identity because it changes the PHYSICAL storage; same content in two tiers = two stores.
//   Dedup happens within a (content, tier) pair. The manifest commits (chunksRoot, tier), so a file's storeId
//   is author-committed and front-run-proof (a front-runner can only *help* by storing the correct bytes).

struct ChunkStore {
    uint32 chunkCount;     // 0 until the FIRST valid chunk binds it (§3.3). Authoritative completion target.
    uint32 receivedCount;  // monotone; increments only on first arrival of a distinct index
    uint8  storageTier;    // echoes the tier in storeId (cheap local read)
    bool   bound;          // true once chunkCount is cryptographically bound by a valid chunk
    // packs in one 32-byte slot
}

mapping(bytes32 storeId => ChunkStore)                          chunkStores;
mapping(bytes32 storeId => mapping(uint256 word => uint256))    chunkBitmap;  // presence bits, 256 indices / word
mapping(bytes32 storeId => mapping(uint32 index => bytes32))    chunkPtr;     // tier 0: SSTORE2 pointer; tier 2: unused
mapping(bytes32 storeId => mapping(uint32 index => bytes))      chunkInline;  // tier 1 only: bytes in state
```

**Answering the two O(1) questions the role demands:**
- **"is chunk `i` present?"** → one word read + one bit test: `chunkBitmap[storeId][i >> 8] & (1 << (i & 0xff)) != 0`. O(1), no per-chunk SLOAD of a pointer.
- **"is the file complete?"** → `s.bound && s.receivedCount == s.chunkCount`. O(1), one slot.

The bitmap is the load-bearing structure: it is simultaneously the **idempotence gate** (already-present → no-op), the **completion counter's guard** (increment `receivedCount` only when flipping a 0→1 bit), and the **resumption cursor** (scan words for gaps). A bare counter cannot answer "which chunks are missing"; a per-index pointer probe is 1 SLOAD/chunk. The word-packed bitmap gives 256 presence bits per SLOAD for enumeration and O(1) point membership — it is the right structure on every axis.

Sparse by construction: nothing is allocated for a `chunkCount` until chunks actually arrive, so a manifest that lies about a huge count allocates **zero** state (no amplification/DoS — see §8).

### 3.2 Chunk submission entrypoints (Etched — writes live on the kernel)

```solidity
// ── single chunk: the self-submit / censorship floor ──────────────────────────────
function submitChunk(
    bytes32 chunksRoot,
    uint8   storageTier,
    uint32  chunkCount,          // claimed n; cryptographically validated against chunksRoot (§3.3)
    uint32  index,
    bytes calldata chunkBytes,
    bytes32[] calldata proof
) external;

// ── many chunks in one tx: the relayer/burner throughput path ──────────────────────
function submitChunks(
    bytes32 chunksRoot,
    uint8   storageTier,
    uint32  chunkCount,
    uint32[]   calldata indices,
    bytes[]    calldata chunkData,
    bytes32[][] calldata proofs
) external;                       // loops submitChunk logic; per-chunk idempotent skip, no whole-call revert on already-present
```

**Per-chunk admission (validate-then-commit, mirrors the record path):**

```
storeId = keccak256(abi.encode(DOMAIN_CHUNKSTORE_V1, chunksRoot, storageTier))
1. shape:  chunkBytes.length in (0, MAX_CHUNK_BYTES[tier]]; index < chunkCount
2. idempotence:  if bitmap[storeId][index] set → RETURN (no-op, no revert)          // §5 racing/resume
3. leaf  = keccak256(abi.encode(DOMAIN_CHUNKLEAF_V1, uint256(index), keccak256(chunkBytes)))
4. proof: require _verifyChunk(chunksRoot, chunkCount, index, leaf, proof)            // else revert BadChunkProof
5. bind n (first valid chunk only):                                                  // §3.3
     if !s.bound { s.chunkCount = chunkCount; s.storageTier = tier; s.bound = true; emit ChunkStoreBound(storeId, chunkCount, tier); }
     else        require(chunkCount == s.chunkCount)   // consistent by construction; cheap guard
6. store bytes by tier:
     tier 0 (SSTORE2):        ptr = SSTORE2.write(chunkBytes) via CREATE2 salted on keccak(chunkBytes);
                              if that address already has code (dedup/race) skip the deploy; chunkPtr[storeId][index] = ptr
     tier 1 (inline-state):   chunkInline[storeId][index] = chunkBytes
     tier 2 (commitment-only):(store nothing; presence is the assertion) — bytes ride the event for mirrors
7. commit: set bitmap bit; receivedCount += 1; emit ChunkStored(storeId, index, ptrOrZero, chunkBytes /*for tier2 indexers*/)
8. if receivedCount == chunkCount: emit FileComplete(storeId)
```

Steps 1–5 are pure/cheap; step 6 is the only expensive part and only runs once per distinct chunk ever (idempotence + content-addressed dedup guarantee at-most-once physical storage).

`MAX_CHUNK_BYTES[0] = 24_575` (EIP-170 24,576 minus the SSTORE2 leading STOP byte). Tiers 1/2 may set a smaller sanity cap. This is the EIP-170 chunking the role flags — but note it is a property of the **SSTORE2 tier only**; tier 2 has no code-size limit (bytes never become code), so commitment-only files can use larger logical chunks (calldata-bounded).

### 3.3 Idempotence, `n`-binding, and why nobody can grief a store

The critical robustness property: **`chunkCount` is never trusted from the manifest; it is bound from the first *cryptographically valid* chunk.** Walk the cases:

- **Honest author.** Every chunk proves against `chunksRoot` at the true width `n`; the first one binds `s.chunkCount = n`; the rest match. Completes at `receivedCount == n`.
- **Griefer opens the store with a wrong count.** They must pass a chunk with `chunkCount' ≠ n` that still satisfies `keccak(DOMAIN_CHUNKSROOT_V1, n', apex') == chunksRoot`. Since `chunksRoot` committed the true `n`, this is a second-preimage on keccak — infeasible. They **cannot bind a wrong `n`.** The worst they can do is submit valid chunks (which *helps*).
- **Griefer front-runs with correct bytes.** Content-addressed: they store exactly the author's bytes at the author's `storeId`. Pure donation of gas.
- **Griefer front-runs the tier.** `storeId` includes `storageTier`, so the griefer's fill lands in a *different* store than the author's manifest points at. No interference.
- **Author signs a manifest, never supplies bytes.** File stays `PARTIAL(0/n)` forever. Harms only the author's own file (§6 grades it honestly). No third-party impact.

So the accumulator is **monotone and grief-proof**: bits only flip 0→1, `receivedCount` only rises, `n` is bound once by proof, revocation touches the *manifest slot* not the store (§6). A store, once complete, is complete forever (SSTORE2 code is permanent).

**No prior-manifest requirement (permissionless content pool).** Because chunk admission is *fully self-validating* against `chunksRoot` (integrity from the proof, `n` from the apex-binding), `submitChunk` needs **no** opened manifest to be safe. Chunk stores are therefore **permissionless content-addressed pools**: anyone may fill any `storeId` by supplying proving bytes; a manifest merely *references* a `chunksRoot` to constitute a *file*. This buys three things:
1. **Pre-staging.** A client can stream bytes *before* the author signs the manifest (or in parallel), then the one signature lands the reference.
2. **Global dedup.** A new manifest whose `chunksRoot` is already complete on this chain resolves to a **complete file with zero chunk submissions** — instant.
3. **Trustless replication.** A replicator fills the pool on a new chain with no permission and no author involvement.

Spam surface is identical to the base kernel's ("a submitter pays linearly to store real bytes" — no amplification), so permissionless is safe. If unattributed-byte-spam ever proves undesirable on some deployment, a `require(manifestOpened[storeId])` gate is an **additive** policy — but it is not needed for safety and it would break pre-staging/dedup, so the recommendation is **permissionless**. (This is the one place a deployment could tighten without touching the crypto; flagged, not taken.)

### 3.4 What `_openChunkStore` (the manifest side-effect) actually does

Given the above, the manifest side-effect is deliberately thin — it records intent + tier for discovery/UX and is **not** a trust anchor for the bytes:

```solidity
function _openChunkStore(bytes32 chunksRoot, uint32 advisoryCount, uint8 tier) internal {
    bytes32 storeId = keccak256(abi.encode(DOMAIN_CHUNKSTORE_V1, chunksRoot, tier));
    emit ChunkStoreReferenced(storeId, chunksRoot, tier, advisoryCount);
    // no state trust: chunkCount is bound only by a valid chunk (§3.3).
    // optionally record tier if unset, purely as a read hint — never as a completion target.
}
```

---

## 4. Storage tiers (extending the three the role names, forward-compatible)

| tier | on-chain footprint | read path | portable? | when |
|---|---|---|---|---|
| **0 SSTORE2** (default) | bytes = contract code via CREATE2(keccak(bytes)); ~200 gas/byte deposit; ≤24,575 B/chunk (EIP-170) | `extcodecopy`, paginated (EIP-7617) | **yes** — resubmit chunks against the same `chunksRoot`; re-`CREATE2` gives the same store addresses | the on-chain-file default: bytes genuinely in state, contract-readable |
| **1 inline-state** | bytes in a `bytes` storage mapping; ~22.1k gas/word ≈ 690 gas/byte | direct SLOAD; `eth_getProof` slot-by-slot | yes | tiny, point-read-hot chunks where per-slot Merkle-proof reads matter more than gas |
| **2 commitment-only** | none (presence bit only); bytes ride the event | verify-a-chunk-handed-to-you (`verifyChunk` view); bytes fetched off-chain | yes — the root travels; bytes re-served from any mirror and re-proven | huge media where on-chain storage is prohibitive but you still want the author-committed root + progressive-availability tracking + trustless serving |

All three share the identical `chunksRoot`/tree/proof machinery; only step 6 of admission differs. This is exactly the role's "three storage tiers already identified" made into one mechanism with a tier byte, rather than three code paths.

**Forward-compatibility with scaling (the role's explicit requirement).** The tier byte is the extension seam:
- **Bigger blocks / cheaper calldata** (post-EIP-7623 relaxations, L2 DA): reduce chunking / raise `MAX_CHUNK_BYTES` for tiers that aren't EIP-170-bound (tiers 1/2). No format change.
- **Blobs / EIP-4844 / danksharding / PeerDAS**: reserve **tier 3 = blob-committed** — chunk bytes posted as blobs, the kernel storing the versioned-hash → index mapping; the *same* `chunksRoot` bridges blob-DA (transient) to a permanent on-chain commitment. Additive tier, no change to tiers 0–2, and the manifest already carries the tier byte and root. This is how permanence survives moving the *bytes* onto danksharding DA: the **commitment** stays in state forever; the bytes ride whatever DA the era offers, always re-provable against the frozen root. Reserve tier 3's semantics now; ship the machinery when the precompiles/opcodes land.

---

## 5. Idempotence, resumability, parallelism, racing (the operational core)

- **Crash at 237/430 → resume.** Any client reads the bitmap (one `getSlot`-class read per 256 chunks) or subscribes to `ChunkStored`, computes the missing set, resubmits only those. `missingChunks(storeId, start, maxScan)` (view, §7) returns the gaps directly. **No coordination state, no session, no lock** — the bitmap *is* the resumable upload session, and it is global (a different relayer can resume an upload the original one abandoned).
- **Re-submit = no-op.** Bitmap bit set → early `RETURN` after one SLOAD. Costs base tx + 1 SLOAD + calldata; never reverts, never double-charges storage. (`submitChunks` skips per-index, so a batch that overlaps already-present chunks admits the novel ones and no-ops the rest in one tx.)
- **Out-of-order + parallel.** Each chunk's proof is independent of every other chunk; `index` order is irrelevant to admission; N relayers fill N disjoint index ranges concurrently. Nothing serializes (no nonce, no head, no prev — the same properties the envelope layer deliberately has).
- **Multiple relayers racing the same chunk.** EVM execution is single-threaded per block: whichever tx mines first flips the bit; the second, mined later, hits the step-2 no-op. No corruption, no double-store (content-addressed CREATE2 also makes the physical deploy at-most-once). The only cost of an uncoordinated race is the loser's wasted calldata — bounded to one redundant submission, and avoided in practice by bitmap-polling / event-subscription before submitting. (A two-phase "claim then upload" was considered and rejected: it adds a round-trip and state to save calldata the cooperative protocol already avoids.)
- **Reorgs.** A `submitChunk` in a reorged-out block reverts its bit + bytes with the block; resubmit. Idempotent, so a client that replays its whole missing-set after a reorg converges with no special handling.

**The resumption protocol (client/SDK, informative):**
```
loop until complete:
  s = fileStatus(storeId)                 // (chunkCount, receivedCount, complete)
  if s.complete: done
  gaps = missingChunks(storeId, cursor, PAGE)
  submit gaps  (self-pay, or hand to relayer/burner)  // parallel, batched via submitChunks
```

---

## 6. Completion semantics & progressive read grades (never "broken", never a false "absent")

The role's hard requirement: a partial/incomplete file reads as a **graded state**, never a broken file and never a false "absent." Here is the mapping onto the `read-lens-spec` grade vocabulary.

Two independent resolution layers:
1. **Identity/placement/metadata** — resolved by the normal lens walk over the file's placement slot and the `chunks` manifest slot. If the manifest PIN is present and unrevoked, the file's identity, `contentHash`, `size`, `chunksRoot`, tier are **LIVE** (subject to the usual currency qualifiers). This never depends on byte availability.
2. **Byte availability** — a **new flag** graded from the store accumulator, orthogonal to the disposition:

| grade/flag | condition | GATE read | INTERACTIVE read |
|---|---|---|---|
| **BYTES-COMPLETE** | `s.bound ∧ receivedCount == chunkCount` | consumable (bytes in state, `readFile` returns whole file) | serve/render normally |
| **BYTES-PARTIAL(k, n)** | `0 ≤ receivedCount = k < n` (present set exactly known from bitmap) | **fail closed** if it needs the whole file; MAY consume any *present, proven* chunk for range logic | render progress (k/n), serve present byte-ranges (HTTP 206), stream-as-available; the missing set is exact and displayable |
| **BYTES-UNBOUND** | `!s.bound` (no valid chunk yet — even `n` unconfirmed) | fail closed | "upload pending" placeholder; identity/metadata still shown |

`BYTES-PARTIAL(k,n)` is proposed as a Durable refinement of the existing `BYTES-UNAVAILABLE` flag (`read-lens-spec` §2.4) — same family ("authenticated pointer, bytes status X here"), but **precise**: the reader computes exactly which chunks are present and can verify and use each present chunk immediately. Flagged `[→ read-lens-spec §2.4]` as a Durable addition (not Etched — it is read behavior; the Etched surface is the accumulator that makes k/n exact).

Consequences that satisfy the role:
- **Never "broken."** The file object, its identity, hash, size, and placement are fully readable the instant the manifest lands, independent of bytes. A UI shows a real file with a progress state, not a 404.
- **Never a false "absent."** Byte-absence is `BYTES-PARTIAL`/`BYTES-UNBOUND` at a *present* file, categorically distinct from the file's slot being empty. The anti-fallthrough discipline (`read-lens` §2.1) is untouched: a partial file is `PRESENT` with a byte-flag, not `PROVEN-ABSENT`, so a lens walk never falls through it to a lower-trust author.
- **Never a truncation-as-complete.** `complete` requires `receivedCount == chunkCount` with a **bound** `n`; `readFile` refuses to report `complete` past a gap. A GATE consumer (e.g., a `tokenURI` composer) checks `isComplete` or reads chunk-by-chunk and handles gaps — it can never be handed a silently-short file.
- **Progressive availability is a feature, not a degradation.** Indexed content-addressed chunks mean byte-range reads, resumable downloads, and stream-as-it-arrives (video that plays the delivered prefix) all fall out for free.
- **End-to-end integrity.** On full reassembly a reader re-decodes per `encodingTag` and checks `contentHash`; a mismatch (author committed a `chunksRoot` of garbage but a real `contentHash`) grades **CONTENT-MISMATCH** — again harming only the author's own file, and detectable, never silently served.

**Contract reads of an incomplete file** (the R1 composability case): `readChunk(storeId,i) → (present, bytes)` and `isComplete(storeId) → bool` are O(1) point reads on the Etched kernel. A composing contract gates on `isComplete` or tolerates gaps explicitly. Traversal-shaped/whole-file reassembly is a **view** concern (EIP-7617 pagination, §7), never forced into a single contract call.

---

## 7. Reads & serving (point reads on kernel; pagination in redeployable views)

Following the kernel's Etched-discipline (writes + point reads on the kernel; enumerating/joining reads evicted to redeployable stateless views — the EIP-170 forcing function):

**On the Etched kernel (point reads):**
```solidity
function chunkPresent(bytes32 storeId, uint32 index) external view returns (bool);
function fileStatus(bytes32 storeId) external view returns (uint32 chunkCount, uint32 receivedCount, bool bound, bool complete);
function readChunk(bytes32 storeId, uint32 index) external view returns (bool present, bytes memory data); // extcodecopy/SLOAD by tier
function isComplete(bytes32 storeId) external view returns (bool);
// pure verifier for tier-2 / off-chain-served bytes (verify-don't-trust, no storage needed):
function verifyChunk(bytes32 chunksRoot, uint32 chunkCount, uint32 index, bytes calldata chunkBytes, bytes32[] calldata proof)
    external pure returns (bool);
```

**In a redeployable view (`EFSBytesView`, stateless, forever-fixable):**
```solidity
// EIP-7617-style pagination — serves a COMPLETE file across calls, or contiguous-until-gap for PARTIAL
function readFile(bytes32 storeId, uint32 startIndex, uint32 maxChunks)
    external view returns (bytes memory data, uint32 nextIndex, bool complete);
// resumption helper — enumerate gaps
function missingChunks(bytes32 storeId, uint32 startIndex, uint32 maxScan)
    external view returns (uint32[] memory missing, uint32 nextIndex);
```

`readFile` concatenates present chunk bytes (via `extcodecopy` for tier 0, SLOAD for tier 1) from `startIndex` until the first gap or `maxChunks`, returning `nextIndex` (cursor) and whole-file `complete`. This ports v1's EIP-7617 chunk pagination onto the native store unchanged in spirit.

**web3:// serving.** The router (redeployable, ERC-5219, existing URL grammar) grows one classification: a `~store:<chunksRoot>` (or `~data:<dataId>` → its `chunks` manifest → store) path resolves to the paginated `readFile`. A complete file serves 200 with the reassembled bytes; a `BYTES-PARTIAL` file serves 206 with the available prefix (or a progress document), **never** a truncated 200. The `mirrors` reserved key MAY additionally carry `web3://<router>/~store:<chunksRoot>` so generic web3:// clients (`web3protocol`, w3link, eth.limo) resolve the native store with no EFS-specific code — the native store *is* a web3:// source, and the highest-integrity one (author-committed root + on-chain bytes), so it takes top transport priority over external mirrors when present and complete.

---

## 8. Portability & permanence (the mission ends)

**Portability — strictly more than raw SSTORE2** (the role's claim, substantiated). To copy a file to a new chain:
1. Replicate the **one envelope** carrying the manifest record (+ DATA + placement). It re-verifies from the author's signature on the new chain — chain-free by construction. One record, tiny.
2. Stream the chunks: `submitChunk` against the **identical `chunksRoot`** on the new chain. They re-prove against the same root — **no re-signing, no trust in the copier.** A copier who flips a byte produces a failing proof; a lazy copier who supplies only some chunks yields an honest `PARTIAL`.

Contrast raw v1 SSTORE2-via-mirror: the store must be re-deployed *and* the store↔file binding is an **unsigned attester mirror-claim** a reader must trust. Here the binding is **inside the author's signature** (`chunksRoot` in the signed manifest) and **content-addressed** (root commits the bytes). Replication is therefore mechanical and trustless — the LOCKSS property the whole carrier decision is priced on, now reaching the *bytes*, not just the namespace. Dedup travels too: if the new chain already holds those bytes (from any other file), the copied manifest resolves **instantly complete**.

Honest portability limit (inherited, stated): a **dead author's `dataId`** can't be re-minted on a fresh chain under replication model A (owned-kind identity binds `msg.sender`/attester). That limit is the file's *identity* object, unchanged by this design; the **bytes** (`chunksRoot`, content-addressed) and their store are model-independent and copy freely. This design widens what travels trustlessly; it does not reopen the model-A/C question.

**Permanence — bytes end in state, contract-readable, state-reconstructible.**
- Tier 0 bytes live in contract **code** (SSTORE2), read by `extcodecopy`. EIP-4444 history expiry touches historical blocks/receipts, **not** account code/state — so the bytes and the commitment both sit in the permanent state set.
- **From-state-alone reconstruction** (the kernel's pledge) holds: the enumeration **spine** lists every claim incl. the manifest; decoding a manifest body yields `(chunksRoot, tier, …)` → `storeId` → probe `chunkPtr[storeId][0..n-1]` (deterministic, `n` from `s.chunkCount`) → `extcodecopy` each pointer → reassemble → verify `contentHash`. The frozen ERC-7201 layout makes every one of these slots `eth_getProof`-derivable. No event dependence on the permanent read path (events are conveniences for indexers/tier-2 mirrors only).

---

## 9. The exact MetaMask prompt/click count (the headline deliverable)

The author's key is needed for **exactly one thing**: the `eth_signTypedData_v4` over the envelope that carries the manifest. Everything after — submitting the envelope, opening the store, and streaming every chunk — needs **no signature and no author key** (envelope = signature-authenticated; chunks = proof-authenticated; `msg.sender` ignored throughout). So:

| path | author key prompts | author tx confirmations | notes |
|---|---|---|---|
| **Relayer / burner (recommended default)** | **1** (`eth_signTypedData_v4`) | **0** | Author signs once; hands `{signed envelope + file bytes}` to a relayer/app-burner, which submits the envelope and streams all chunks, paying gas. Kernel attributes the file + every byte to the author. No ETH in the author's wallet, no gas UX. This is also the **cypherpunk floor**: the author *can* self-submit, but is never *required* to. Matches the hackathon gasless faucet-drip must-have. |
| **Self-pay, EIP-5792 batch wallet** | **1** (sign typed data) | **~1** (`wallet_sendCalls` batching `submit` + all `submitChunks`) | Modern wallet batches the sends into one confirmation. Effectively 2 clicks total. |
| **Self-pay, legacy wallet (no batching)** | **1** (sign typed data) | **1 (`submit`) + ⌈N / B⌉ (`submitChunks`, B chunks per tx)** | The honest worst case: one sign + one envelope confirm + a confirm per chunk batch. Still **one signature** — the extra clicks are gas confirmations, not authorizations, and vanish under batching or relay. |

**Headline: one signature authorizes the entire multi-block upload.** In the default (relayer/burner) path that one signature is also the author's *only* interaction — zero transactions, zero gas from the author. The N-transaction reality of a large file (unavoidable — it exceeds one block's gas) is fully absorbed behind that single authorization, exactly as the role requires.

---

## 10. Parents-first / atomicity interaction

- **Atomic, one block:** the envelope `{DATA, chunks-PIN(manifest), placement-PIN [, contentType…]}` — small, fits one block, single revert scope (batch atomicity by construction). This is the moment the file is **committed**: identity, placement, and *exact byte-content* (via the signed `chunksRoot`) are permanently pinned. The file is "on-chain-committed" after one signature + one cheap tx, **before** any bytes arrive.
- **Non-atomic, many blocks (by necessity):** the chunks. This is correct and is the whole point — a large file cannot be atomic; what *is* atomic is the tiny signed commitment. Availability then converges idempotently.
- **Ordering:** the manifest need not precede chunks for *safety* (§3.3 permissionless pool), but for a *file* to resolve, its manifest must be present — the normal parents-first rule (manifest references `dataId`; `dataId` minted in the same atomic batch; `submitSubset`/replication of a chunk-before-manifest is harmless, it just fills the pool). No new ordering machinery: chunk admission has **no dependency** on kernel record state at all (it depends only on `chunksRoot`, which is self-contained), so there is nothing to be "out of order" with. This is *simpler* than record parents-first, not more complex.

---

## 11. Trying to break my own proposal (adversarial pass)

| attack | outcome | why it fails |
|---|---|---|
| Forge a chunk (wrong bytes, valid-looking) | revert `BadChunkProof` | keccak second-preimage on `chunksRoot`; domain-separated leaf/node |
| Grief a store with a wrong `chunkCount` | impossible to bind wrong `n` | `n` committed at the apex; only the true `n` reproduces `chunksRoot` (§3.3) |
| Front-run the store (correct bytes) | helps the author | content-addressed; stores exactly the right bytes at the author's `storeId` |
| Front-run at the wrong tier | no effect | `storeId` includes tier; author's manifest points at author's tier's store |
| Amplification via huge `chunkCount` | zero allocation | mappings sparse; nothing stored until a proven chunk arrives; `n` bound only by a valid chunk |
| Racing relayers on one chunk | first wins, second no-ops | single-threaded EVM; step-2 bitmap gate; CREATE2 at-most-once deploy |
| Replay a chunk proof as a record proof (or vice-versa) | revert | disjoint domain constants (`chunkleaf`/`chunknode` vs `leaf`/`node`) |
| Truncation: serve k<n as complete | impossible | `complete` ⟺ `bound ∧ receivedCount==n`; `readFile` stops at first gap; GATE fails closed |
| `chunksRoot` of garbage + real `contentHash` | CONTENT-MISMATCH on reassembly | end-to-end `contentHash` check; harms only the author's file, detectable |
| Author never supplies bytes | honest `PARTIAL(0/n)` | no third-party impact; grade is truthful, never "broken"/"absent" |
| Revoke manifest, bytes remain | correct | slot tombstones → file reads "withdrawn"; bytes orphaned (permanence), not served |
| Un-complete a completed file | impossible | monotone accumulator; SSTORE2 code permanent; revocation touches the manifest slot, not the store |
| Two manifests share a `storeId`, one revoked | independent | each file resolves via its own manifest slot; store completeness is shared, monotone, content-level |
| Unattributed byte spam (permissionless pool) | linear-cost, no amplification | attacker pays full storage for real bytes; identical to base-kernel economics; optional manifest-gate available but unneeded |

**The residual honest weaknesses (not fatal, flagged):**
1. **Cost.** On-chain bytes are expensive by design (SSTORE2 ~200 gas/byte + EIP-7623 calldata floor) — see §12. Mitigated by tiers 2/3, L2/L3 economics, and the "archival not commodity" doctrine, not eliminated. This is a property of *any* bytes-on-chain system, not of this mechanism.
2. **The `chunks` reserved-key row is Etched.** A wrong row is permanent (the mini-schema-registry risk the reserved-key table already carries). Mitigation: numbered Codex chapter, per-row golden vectors, the one shared reserved-key enforcement engine, and the VAL/REF differential fuzz the kinds ruling already mandates.
3. **VAL-tail canonicality on a *typed* (non-interned) reserved key** is a new sub-branch of the VAL decode path — the kinds ruling's #1 engineering risk (VAL layout fork) gains one more shape. Mitigation: fold the manifest tuple into the same round-trip re-encode discipline + Solidity↔TS differential fuzz; add manifest vectors to the freeze suite.

---

## 12. Gas estimates (concrete but **UNMEASURED** — flagged; CI snapshot replaces before any ADR cites)

Order-of-magnitude, L1 cold-slot pricing, per 24 KB chunk:

| tier | dominant costs (per 24 KB chunk) | ~gas/chunk | ~gas / 1 MB (≈43 chunks) |
|---|---|---|---|
| 0 SSTORE2 | code deposit 200×24 576 ≈ 4.92M + calldata (EIP-7623 floor ≈ 40×24 576 ≈ 0.98M) + bitmap/verify ≈ 40–60k | **~6.0M** | **~258M** |
| 1 inline-state | 22.1k/word × 768 words ≈ 17.0M + calldata ≈ 0.98M | **~18.0M** | **~774M** |
| 2 commitment-only | calldata ≈ 0.98M + bitmap SSTORE ≈ 22k + verify ≈ 20k | **~1.0M** | **~44M** |

Reading (per §12 caveats): SSTORE2 (tier 0) is the right default (3–4× cheaper than inline-state while staying contract-readable). On **L2/L3** these numbers fall by 1–2 orders (calldata priced via blob DA, execution gas cheap) — **large on-chain files are primarily an L2/L3 play**, with L1 as the premium-permanence tier. Per-chunk cost is spread across many blocks (a 258M-gas tier-0 MB is ~7 L1 blocks at 36M, far fewer on high-gas L2s). Manifest envelope itself is a normal small write (~0.3–0.5M, the kernel's placement-flow estimate). All figures **unmeasured** — the freeze-blocking CI gas snapshot (a named gate) supersedes them; do not cite in an ADR until measured on a real L2.

---

## 13. Frozen-surface summary (what this design asks to Etch) & open questions

**Etched (new):**
- `submitChunk` / `submitChunks` entrypoints; `chunkPresent` / `fileStatus` / `readChunk` / `isComplete` / `verifyChunk` point reads.
- Chunk-tree constants `DOMAIN_CHUNKLEAF_V1`, `DOMAIN_CHUNKNODE_V1`, `DOMAIN_CHUNKSROOT_V1` (count-at-apex binding), `DOMAIN_CHUNKSTORE_V1`; `storeId = keccak(DOMAIN_CHUNKSTORE_V1, chunksRoot, tier)`.
- Storage layout: `chunkStores` / `chunkBitmap` / `chunkPtr` / `chunkInline` (ERC-7201, slot-derivations in the Codex).
- Reserved-key table **row 15: `chunks`** (DATA parent, PIN, VAL struct, non-interned, side-effecting) + the `FileManifest` body layout.
- `MAX_CHUNK_BYTES[0] = 24_575`; tier byte semantics {0,1,2}, tier 3 reserved (blob-committed).
- Estimated added kernel size: ~150–250 LoC (verify + SSTORE2 write + bitmap + manifest branch); pagination views are redeployable (not Etched). Folds into the kernel's §1 EIP-170 budget — flag for the skeleton compile.

**Durable (read layer):** `BYTES-PARTIAL(k,n)` / `BYTES-UNBOUND` / `BYTES-COMPLETE` / `CONTENT-MISMATCH` flags `[→ read-lens-spec §2.4]`; `readFile`/`missingChunks` view; router `~store:` serving + 206-for-partial.

**Open questions (for James / freeze):**
1. **Permissionless pool vs manifest-gate.** Recommend permissionless (safe per §3.3, enables pre-staging/dedup/replication). Confirm — it is the one policy knob a deployment could tighten.
2. **`chunks` reserved-key row + `FileManifest` layout** join the reserved-key table's per-row golden-vector obligation and the VAL-tail differential-fuzz gate. Confirm inclusion.
3. **Tier 3 (blob-committed) reservation** now vs at first blob-DA adoption — recommend reserve-the-tier-byte-now (cheap, forward-compatible), ship machinery later.
4. Gas snapshot (tier 0/1/2, per chunk, on a real L2) is freeze-blocking before any number here is cited.
