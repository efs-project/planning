# Architecture A — Native Manifest + Proof-Streamed Bytes (permanence-first, kernel-anchored)

**Role output.** The front-runner large-file design: one `eth_signTypedData_v4` commits a whole file (identity + every byte, cryptographically); the bytes then stream in afterward as `(index, bytes, proof)` from relayers/burners/anyone with **no further signature**; the kernel substrate accumulates them into a **contract-readable, permanent, in-state** store that is resumable, idempotent, parallel, progressive-read, and portable. Optimised for SOLID permanence + R1 contract-readability + one authorization.

**Status:** draft (spec-grade). **Tiers of surface it proposes:** **Etched** — one reserved-key row on the record kernel (`chunks`), the `FileManifest` body layout, and a **new sibling Etched contract `EFSBytes`** (chunk-tree constants + storeId derivation + storage layout + submit entrypoints + point reads). **Durable** — the `BYTES-*` read-grade flags + the pagination/serving views. **Designs strictly within** the settled substrate: `codex-envelope` (the EIP-712 Merkle envelope, `verifyLeaf`, domain-separation discipline, admission-confluence master invariant), `codex-kinds` (5 kinds, reserved-key table, VAL/REF layout, `expiresAt`-word rule), `codex-kernel` (`submit`/`submitSubset`, tombstone slots, spine, ERC-7201, the "one or two Etched artifacts" contingency), `read-lens-spec` (grade vocabulary, `BYTES-UNAVAILABLE` flag, anti-fallthrough), `deterministic-ids` (dataId/tagId/slot math, CREATE2). **All gas numbers are concrete estimates, explicitly UNMEASURED — flagged inline; the freeze-blocking CI gas snapshot supersedes them before any ADR cites them.**

---

## 0. The idea, and what is new here versus the discovery pass

**The lever (unchanged, settled).** The kernel already lets **one signature commit a whole batch**: the author signs a Merkle root once; any record in the batch verifies independently; `msg.sender` is ignored; author is recovered from the signature. Push that one level down. The file's bytes get their **own** Merkle tree — a `chunksRoot` over the file's chunks — embedded **inside the body of one signed record** (the FILE-MANIFEST). The author's single envelope signature therefore **transitively commits every byte**:

```
signature → recordsRoot → manifest-record leaf → manifest body → chunksRoot → (chunkCount n, every chunk's keccak)
```

Chunks then submit with **no signature at all** — each carries only `(chunksRoot, tier, index, bytes, proof)` and is admitted iff the bytes prove against the author-committed `chunksRoot`. Authorship is settled by the manifest; chunk integrity by the proof; `msg.sender` never matters. "Anyone can relay a signed record" becomes "anyone can relay a proven chunk." One prompt authorizes the entire multi-block upload.

**Four deliberate improvements over the discovery pass (`native-manifest-chunk-submission.md`), each argued and stress-tested in-body:**

1. **The manifest does NOT commit a storage tier.** It commits only `chunksRoot` (+ `contentHash`, `size`, `chunkSize`, `encodingTag`). Tier is a pure *submission-rail* choice; `storeId = keccak(chunksRoot, tier)`, so one file's bytes may live in several tiers at once (LOCKSS across tiers). This is what makes **permissionless promotion with no re-signature** a first-class, reader-transparent operation (§4.2) — the forward-compat "commit cheap now, promote to permanent later" pattern, delivered structurally. (Discovery put tier in the manifest + storeId, which foreclosed transparent promotion.)
2. **The byte substrate is a SEPARATE Etched contract, `EFSBytes` — zero coupling to the record kernel.** Chunk admission reads *no* record-kernel state (it self-validates against `chunksRoot`), so the two contracts share nothing at write time. This (a) relieves the record kernel's real EIP-170 pressure (`codex-kernel` amendment 11: 2,300–2,900 LoC already), (b) fills the kernel doc's explicitly-reserved "one or two Etched artifacts" slot (amendment 8), (c) lets the chunk crypto be frozen/reviewed/fuzzed independently, and (d) **eliminates a whole cross-contract-reentrancy class** because there are no write-time cross-calls.
3. **The manifest is a plain, NON-side-effecting VAL reserved key.** Because the store is a permissionless self-validating pool (§3.3), the manifest needs no `_openChunkStore` admission side-effect — it is stored verbatim like any reserved-key VAL body. This removes the discovery pass's flagged risk (a new *side-effecting* VAL admission branch) and shrinks the record-kernel delta to essentially one table row.
4. **Contiguous-run batch submission** (`submitChunkRun`): a power-of-two aligned run of chunks is admitted with a **single boundary proof** (recompute the subtree from complete contiguous data, prove that one subtree node against `chunksRoot`). Borrowed from Arweave contiguity / BitTorrent `piece layers`; safe precisely because it is *not* a sparse multiproof (§5.2). Plus Arweave's **proof-ratio floor** as anti-dust.

Everything else (count-at-apex `n`-binding, sparse bitmap accumulator, idempotence, progressive grades) is adopted from the discovery pass and tightened.

---

## 1. The signed manifest — one reserved-key row, no new kind, no tier commitment

The 5-kind model (`codex-kinds`) is preserved. The manifest is **not** a 6th kind — it is **one new reserved-key row** on `DATA`, parallel to `mirrors`/`contentHash`/`size`:

| key | parent | roles | layout | validation | side-effect |
|---|---|---|---|---|---|
| **`chunks`** | DATA | **PIN** (cardinality-1) | **VAL struct**, non-interned | fields well-formed; canonical `abi.encode`; `expiresAt` trailer word | **none** (plain body store) |

Add exactly this one row to the reserved-key table (13 rows → 14; the successor-demoted count). It slots beside `mirrors`: where `mirrors` names *external* transports by unsigned URI string, **`chunks` commits the bytes cryptographically and inline** by carrying `chunksRoot`. `mirrors` stays for redundancy/off-chain copies; `chunks` is the on-chain-native, author-committed byte identity.

**Why PIN (cardinality-1), not TAG.** One current byte-content per file version is exactly cardinality-1. The PIN **slot** gives O(1) point reads of the current `chunksRoot` (`getSlot`), O(1) supersession (re-PIN `chunks` at higher `seq` = new file version — a byte-level edit swaps the pointer in place), and clean revocation (revoke the manifest → slot tombstones → the file reads "author withdrew the bytes", never "broken"). Cross-content versioning stays the existing story (new `DATA` + `supersededBy`); within one `DATA`, re-`chunks`-PIN swaps the bytes.

**Why VAL but non-interned.** A manifest value is per-file-unique (keyed on a globally-unique `chunksRoot`); interning it would auto-mint a `propertyId` nobody reuses — pure waste. The kernel decodes the tuple and stores the body verbatim in `bodies[claimId]` (bodies-in-state ruling), so `getClaim`/`getSlot` return the manifest and readers get `chunksRoot`/`contentHash`/`size`/`chunkSize` from one point read. **No admission side-effect** (this is the key simplification over discovery — see §0.3), so it introduces no new *behaviour* on the VAL path, only a new typed body shape subject to the same round-trip/canonicality discipline as every reserved-key VAL.

### 1.1 `FileManifest` body layout (canonical `abi.encode`, round-trip-checked; `expiresAt` LAST)

```solidity
// VAL body of a `chunks`-key PIN. Canonical abi.encode of this exact tuple; any trailing byte rejects
// (ports the kernel's NonCanonicalPayload discipline). expiresAt is the claim-body trailer word (envelope amendment 4).
struct FileManifest {
    bytes32 chunksRoot;    // count-at-apex commitment over the file's chunkSize-byte chunks (§2).
                           //   Implicitly binds BOTH n (via the apex wrap) AND chunkSize (via the leaf partition).
    uint32  chunkCount;    // n — convenience copy for readers/UX; AUTHORITATIVE n is committed inside chunksRoot
                           //   and re-validated on every chunk (§2, §3.3). A lie here cannot bind a wrong n.
    uint32  chunkSize;     // C — leaf granularity in bytes (last chunk 1..C). Reader range-read math (§7). Implicitly
                           //   bound by chunksRoot (a different C repartitions → different apex → different root).
    bytes32 contentHash;   // multihash over the DECODED whole file — end-to-end integrity of the REASSEMBLED bytes.
    uint64  size;          // decoded byte length (UX / paging hint).
    bytes32 encodingTag;   // chunk-encoding descriptor keccak("efs.enc.<name>.v1") (raw / gzip / zstd / erasure-coded…).
    uint8   preferredTier; // ADVISORY hint {0,1,2,3} for readers/UX; NON-BINDING — readers probe tiers by priority (§6.3)
                           //   regardless, and promotion (§4.2) can move bytes to a better tier without touching this.
    uint64  expiresAt;     // claim-body trailer (0 = never); clock-free storage, clock-aware reads. MUST be the last word.
}
```

`contentHash`, `size`, `chunkSize`, `encodingTag` fold the file's identity, exact byte-content, integrity, and decoding into **one signed, self-contained, portable unit** (the "publish self-contained units" doctrine, made structural). A reader who reassembles all chunks re-decodes per `encodingTag` and verifies against `contentHash` end-to-end. `contentHash` MAY additionally be published as its own reserved key for cross-mirror integrity; the manifest copy is authoritative for the native store (they MUST agree; a disagreement grades `CONTENT-MISMATCH`, §6).

**Crucially: no `storageTier` field.** The author authorizes *the bytes* (via `chunksRoot`), not *where they land*. Where they land is decided at submission time and can change over the file's life (§4.2). `preferredTier` is a non-binding UX hint only.

### 1.2 Manifest derivation & slot (all offline / client-computable)

```
dataId        = keccak256(abi.encode(DOMAIN_DATA,   authorWord, salt))                       // owned identity (unchanged)
chunksKeyHash = keccak256("chunks")                                                            // reserved key
chunksDefId   = keccak256(abi.encode(DOMAIN_ANCHOR,  dataId, chunksKeyHash, KIND_PROPERTY))    // virtual reserved-key anchor
manifestSlot  = keccak256(abi.encode(DOMAIN_SLOT,    CLAIMROLE_PIN, authorWord, dataId, chunksDefId))
claimId       = keccak256(abi.encode(DOMAIN_CLAIM_V1, authorWord, seq, recordDigest))          // content-addressed (envelope)
```

Everything a client needs *before* mining is derivable: the file's `dataId`, its manifest slot, and — from `chunksRoot` + tier — the exact `storeId` to fill in `EFSBytes`. No mined-tx dependency; deploys/streams parallelize.

---

## 2. The chunk Merkle tree (byte-commitment, chain-free, count-bound)

A **second** Merkle tree, disjoint from the envelope's record tree by domain constants, using the *same* hashing discipline as `codex-envelope` (positional, index-committed leaves, odd-node **promotion**, `abi.encode` of fixed-width words, `abi.encodePacked` banned). Constants are namespaced to the *byte* substrate (`efs.bytes.*`), disjoint from the envelope's `efs.kernel.*`:

```
DOMAIN_CHUNKLEAF_V1  = keccak256("efs.bytes.chunkleaf.v1")
DOMAIN_CHUNKNODE_V1  = keccak256("efs.bytes.chunknode.v1")
DOMAIN_CHUNKSROOT_V1 = keccak256("efs.bytes.chunksroot.v1")
DOMAIN_CHUNKSTORE_V1 = keccak256("efs.bytes.chunkstore.v1")

leaf_i     = keccak256(abi.encode(DOMAIN_CHUNKLEAF_V1, uint256(i), keccak256(chunkBytes_i)))   // i = 0-based
apex       = fold(leaf_0 … leaf_{n-1})           // node = keccak(DOMAIN_CHUNKNODE_V1, left, right); odd promotes
chunksRoot = keccak256(abi.encode(DOMAIN_CHUNKSROOT_V1, uint256(n), apex))                     // ← binds count n at the apex
```

**Binding `n` into `chunksRoot`** (Arweave's `data_size` anti-overlap lesson, made a hash-level invariant) is the load-bearing robustness move. It makes `chunksRoot` a *complete content address* committing both the chunk count and every chunk hash:

- Two authors who chunk identical bytes at the same `C` produce the **same** `chunksRoot` → the same store → **automatic global dedup** (cross-file, cross-author, cross-chain).
- No `(root, count)` ambiguity: a single `bytes32` is the whole content identity.
- The submitter's claimed `count` is **cryptographically validated on every chunk** (§3.3), so nobody can grief a store by declaring a wrong count.

**Disjointness.** `efs.bytes.chunkleaf.v1 ≠ efs.kernel.leaf.v1`, etc.: a chunk proof can never be replayed as a record proof or vice-versa (preimages differ in their first word — the envelope's own leaf/node/record disjointness argument). **Single-leaf proofs are the safety floor** (the envelope excludes multiproofs, OZ CVE precedent); the batch primitive is a *contiguous-run* recomputation (§5.2), which is a single-path proof, not a sparse multiproof.

**Byte length is implicitly committed.** `keccak256(chunkBytes_i)` is in `leaf_i`, so a wrong-length or altered chunk hashes differently and fails its proof. The store therefore need not know `C`; whole-file coherence is `contentHash`'s job (§6). `C` lives in the manifest purely for reader range-math.

---

## 3. `EFSBytes` — the separate Etched byte substrate

`EFSBytes` is a **single global content-addressed store**: one Etched contract per chain, holding *every* file's chunks keyed by `storeId`. It is a **sibling** of the record kernel, not a per-file contract (contrast v1's per-file `EFSBytesStore`). Its canonicity story mirrors the kernel's: deterministic factory + fixed salt, no admin/constructor args, verified by codehash + genesis vectors; venue plurality splits *availability*, never *authenticity* (content-addressed).

**Zero coupling to the record kernel.** Chunk admission validates `(index, bytes, proof)` against `chunksRoot` alone — it reads no kernel state and requires no opened manifest (§3.3). Consequences: the two contracts never cross-call at write time (no reentrancy surface), `EFSBytes` can be frozen/reviewed independently, and its LoC do not count against the record kernel's EIP-170 budget.

### 3.1 Storage layout (ERC-7201 namespaced; frozen in the Codex — `eth_getProof` reads point at these slots)

```solidity
// storeId = keccak256(abi.encode(DOMAIN_CHUNKSTORE_V1, chunksRoot, uint8(tier)))
//   Tier is in the identity because it changes PHYSICAL storage; the same content in two tiers = two stores.
//   Dedup is within a (content, tier) pair. Tier is NOT author-committed (§1) — it is a submission choice; a file's
//   bytes may populate several stores (tiers) at once, and PROMOTION fills a higher tier from a lower one (§4.2).

struct ChunkStore {
    uint32 chunkCount;    // 0 until the FIRST valid chunk binds it (§3.3). Completion target; equals n from chunksRoot.
    uint32 receivedCount; // monotone; increments only on first arrival of a distinct index
    uint8  tier;          // echoes storeId's tier (cheap local read)
    bool   bound;         // true once chunkCount is cryptographically bound by a valid chunk
    // packs in one 32-byte slot
}

mapping(bytes32 storeId => ChunkStore)                        chunkStores;
mapping(bytes32 storeId => mapping(uint256 word => uint256))  chunkBitmap;  // presence bits, 256 indices / word
mapping(bytes32 storeId => mapping(uint32 index => address))  chunkPtr;     // tier 0: SSTORE2 pointer; else unused
mapping(bytes32 storeId => mapping(uint32 index => bytes))    chunkInline;  // tier 1 only: bytes in storage
// tier 2 (calldata-published): no bytes persisted; bytes ride the ChunkPublished event; bitmap only.
// tier 3 (reserved, blob-committed): mapping(storeId => mapping(index => bytes32 versionedHash)); ship later (§4.3).
```

**The two O(1) questions the role demands:**
- **"is chunk `i` present?"** → `chunkBitmap[storeId][i >> 8] & (1 << (i & 0xff)) != 0`. One word read, one bit test.
- **"is the file complete?"** → `s.bound && s.receivedCount == s.chunkCount`. One slot.

The bitmap is load-bearing on every axis: the **idempotence gate** (already-present → no-op), the **completion counter's guard** (increment only on a 0→1 flip), and the **resume cursor** (scan 256 bits/word for gaps). Sparse by construction: nothing is allocated for a `chunkCount` until chunks actually arrive, so a manifest that lies about a huge count allocates **zero** state (no amplification — §11).

### 3.2 Chunk submission entrypoints (Etched on `EFSBytes`)

```solidity
// ── single chunk: the self-submit / censorship floor ─────────────────────────────────────────────
function submitChunk(
    bytes32 chunksRoot, uint8 tier, uint32 chunkCount,
    uint32 index, bytes calldata chunkBytes, bytes32[] calldata proof
) external;

// ── scattered chunks (resume/gap-fill): per-chunk proof, per-chunk idempotent skip ────────────────
function submitChunks(
    bytes32 chunksRoot, uint8 tier, uint32 chunkCount,
    uint32[] calldata indices, bytes[] calldata data, bytes32[][] calldata proofs
) external;

// ── contiguous run: ONE boundary proof for a power-of-two aligned run (throughput path, §5.2) ──────
function submitChunkRun(
    bytes32 chunksRoot, uint8 tier, uint32 chunkCount,
    uint32 startIndex, bytes[] calldata runChunks, bytes32[] calldata boundaryProof
) external;   // recomputes the run's subtree from complete data; proves that subtree node once against chunksRoot
```

**Per-chunk admission (validate-then-commit; mirrors the record path):**

```
storeId = keccak256(abi.encode(DOMAIN_CHUNKSTORE_V1, chunksRoot, tier))
1. shape:  MIN_CHUNK_BYTES[tier] ≤ len(chunkBytes) ≤ MAX_CHUNK_BYTES[tier]; index < chunkCount;
           proof-ratio floor: reject if 32*len(proof) > len(chunkBytes)  (Arweave anti-dust; §5.3)     // non-final chunks
2. idempotence:  if bitmap bit set → RETURN (no-op, no revert)                                          // resume/racing
3. leaf  = keccak256(abi.encode(DOMAIN_CHUNKLEAF_V1, uint256(index), keccak256(chunkBytes)))
4. proof: require _verifyChunk(chunksRoot, chunkCount, index, leaf, proof)  else revert BadChunkProof   // n authenticated here
5. bind n (first valid chunk only):
     if !s.bound { s.chunkCount = chunkCount; s.tier = tier; s.bound = true; emit ChunkStoreBound(storeId, chunkCount, tier); }
     else        require(chunkCount == s.chunkCount)                                                    // cheap consistency guard
6. store bytes by tier:
     tier 0 (SSTORE2):    ptr = SSTORE2.write(chunkBytes) via CREATE2 salted on keccak(chunkBytes);
                          if that address already has code (dedup/race) skip the deploy; chunkPtr[storeId][index]=ptr
     tier 1 (inline):     chunkInline[storeId][index] = chunkBytes
     tier 2 (calldata):   store nothing; bytes ride emit ChunkPublished(storeId, index, chunkBytes)      // DA via history
     tier 3 (reserved):   record versioned hash (§4.3)
7. commit: set bitmap bit; s.receivedCount += 1; emit ChunkStored(storeId, index, ptrOrZero)
8. if s.receivedCount == s.chunkCount: emit FileComplete(storeId)
```

Steps 1–5 are pure/cheap; step 6 is the only expensive part and runs **at most once per distinct chunk ever** (idempotence + content-addressed CREATE2 dedup ⇒ at-most-once physical storage).

`MAX_CHUNK_BYTES[0]` = the runtime code-size limit minus the SSTORE2 STOP byte — **read at deploy/runtime, never hard-coded** (24,575 today; ~65,535 post-EIP-7907; the forward-compat "don't bake in 24576" rule). Tiers 1/2/3 are not EIP-170-bound and set their own sanity caps (calldata-bounded). `MIN_CHUNK_BYTES[tier]` + the proof-ratio floor route dust files to inline/calldata instead of the chunked path (§5.3).

### 3.3 Idempotence, `n`-binding, permissionless pool, and why nobody can grief a store

**`chunkCount` is never trusted from the manifest; it is bound from the first *cryptographically valid* chunk** and re-checked thereafter. Because `chunksRoot` committed the true `n` at the apex, only the true `n` reproduces `chunksRoot` in step 4 → **`n` is authenticated per submission, not trusted.** Walk the cases:

- **Honest author.** Every chunk proves at the true width `n`; the first binds `s.chunkCount = n`; the rest match. Completes at `receivedCount == n`.
- **Griefer opens with a wrong count.** Must pass a chunk with `n' ≠ n` satisfying `keccak(DOMAIN_CHUNKSROOT_V1, n', apex') == chunksRoot` — a keccak second-preimage. Infeasible. **Cannot bind a wrong `n`.**
- **Griefer front-runs with correct bytes.** Content-addressed: stores exactly the author's bytes at the author's `storeId`. Pure gas donation.
- **Author signs a manifest, never supplies bytes.** File stays `BYTES-UNBOUND`/`BYTES-PARTIAL(0,n)` forever — harms only the author's own file (§6 grades it honestly), zero third-party impact.

**No prior-manifest requirement (permissionless content pool).** Because chunk admission is fully self-validating against `chunksRoot`, `EFSBytes` needs **no** opened manifest to be safe. Stores are therefore **permissionless content-addressed pools**: anyone fills any `storeId` by supplying proving bytes; a manifest merely *references* a `chunksRoot` to constitute a *file*. This buys:
1. **Pre-staging** — stream bytes *before* the author signs (or in parallel); the one signature then lands the reference.
2. **Global dedup** — a new manifest whose `chunksRoot` is already complete on this chain resolves to a complete file with **zero** chunk submissions, instantly.
3. **Trustless replication / promotion** — a replicator or promoter fills a store on any chain/tier with no permission and no author involvement (§4.2, §8).

Spam surface equals the base kernel's (a submitter pays linearly to store real bytes — no amplification), so permissionless is safe. A `require(manifestOpened[storeId])` gate is an *additive* per-deployment policy but would break pre-staging/dedup/promotion; **recommendation: permissionless** (the one policy knob a deployment could tighten without touching the crypto — flagged, not taken).

### 3.4 What the manifest side-effect is: nothing

Because the pool is permissionless and self-validating, admitting the manifest record on the *record kernel* triggers **no** `EFSBytes` call and no store "opening" — the first chunk binds the store. The manifest is a plain VAL body store. Discovery/UX learns the file's `storeId` purely by reading the manifest (`chunksRoot`) and probing `EFSBytes`. This is the §0.3 simplification: no new side-effecting admission branch anywhere.

---

## 4. Storage tiers, promotion, and forward-compatibility

### 4.1 The tier menu (all bind the same `chunksRoot`; only step 6 of admission differs)

| tier | bytes live in | ~write cost/byte | permanence | R1 contract-readable? | portable? | forward-compat lever |
|---|---|---|---|---|---|---|
| **0 SSTORE2** (default) | **state (code)** via CREATE2(keccak(bytes)) | ~200 gas + calldata | **permanent** (state; survives EIP-4444) | **yes** — `extcodecopy`, EIP-7617 paginated | yes — re-`CREATE2` gives same store addresses | EIP-7907 raises code limit ⇒ bigger `C`, fewer deploys, auto |
| **1 inline-SSTORE** | **state (storage)** | ~625–690 gas | **permanent** (state) | yes (SLOAD) | yes | **storage-proof-native**: bytes directly `eth_getProof`-able (cross-chain / light-client R3 byte reads without code-proofs) |
| **2 calldata-published** | **history** (calldata + `ChunkPublished` event) | ~16–48 gas | **archival** (~1yr → P2P/archival, EIP-4444; commitment stays in state) | no (post-tx) | yes (bytes are the calldata) | cheaper calldata / L2 DA lowers this automatically |
| **3 blob-committed** (reserved) | **blob sidecar** (18-day) + versioned-hash in state | ~1 blob-gas | **ephemeral** bytes / permanent commitment | no | commitment yes | **blob-count ramp 21→48→128, PeerDAS/danksharding** — the transport firehose |

**The mission bias is tier 0.** It is the only default that puts bytes *genuinely in state, contract-readable, permanent*. Tier 1 is the niche where a **cross-chain storage-proof / light-client reader** must prove the bytes directly (SSTORE2 code needs a code-proof; inline storage needs only a slot-proof) — this is the composability research's R3 path, kept available but not default. Tiers 2/3 are cheap *availability* rails with a promotion path to permanence (§4.2).

**Honest permanence taxonomy (the forward-compat doc's core distinction, made mechanical):** *commitment-durability* (the signed `chunksRoot` in state — always permanent, always portable, one signature) is orthogonal to *bytes-durability* (per-tier). A file is permanent iff its commitment is in state (always true once the manifest lands) **and** ≥1 bytes-tier holds. The read grade (§6) never conflates these: it reports which tiers actually hold bytes and never lets a demo's blob "storage" masquerade as permanence.

### 4.2 Promotion — cheap now, permanent later, no re-signature (the payoff of not committing tier)

Because the manifest commits `chunksRoot` but **not** tier, and `storeId = keccak(chunksRoot, tier)`, **anyone** can move a file's bytes *up* the permanence ladder at any time, and readers see it transparently:

```
mirror-only  →  tier 2 (calldata DA)  →  tier 0 (state permanent)          // add copies; never remove
```

**How.** A promoter fetches the bytes (from a lower tier's event, an off-chain mirror, or a blob before it prunes), and calls `submitChunk(chunksRoot, tier=0, …)` — each chunk re-proves against the **same author-signed `chunksRoot`**, so a promoter who flips a byte fails the proof, and a lazy promoter who supplies some chunks yields an honest `PARTIAL`. **No author signature, no author involvement, no `msg.sender` in the auth path.** The manifest still references `chunksRoot`; the reader's tier-priority probe (§6.3) now finds the tier-0 store complete and serves permanent, in-state, R1-readable bytes.

This is exactly "bank the commitment now, migrate the bytes up as the cost floor drops": a 2026 file uploaded via cheap calldata (or, later, blobs) can be promoted into L1 state permanence in 2030 when it is affordable — same `chunksRoot`, same signature. Had the manifest committed a tier (discovery pass), promotion would require either a re-signature (new manifest at the new tier) or every reader probing all tiers anyway; decoupling makes promotion both trustless *and* reader-transparent.

### 4.3 Tier 3 (blob-committed) — reserved now, shipped when the precompiles land

Reserve the semantics; ship the machinery at blob-DA adoption. Chunk bytes post as EIP-4844 blobs; `EFSBytes` stores the `index → versionedHash` mapping (captured via `BLOBHASH` in the *same* tx that carries the blob — an SDK sequencing constraint). The **same `chunksRoot`** bridges transient blob-DA to a permanent in-state commitment; the bytes are *availability, not permanence* (pruned ~18 days) and MUST be promoted to tier 0/1 within the window (or mirrored) for the 100-year pledge. This is how permanence survives moving *bytes* onto danksharding DA: the commitment stays in state forever; the bytes ride whatever DA the era offers, always re-provable against the frozen root. keccak-Merkle (`chunksRoot`), not KZG, stays the commitment of record (portable, ~12× cheaper to verify, no trusted-setup/precompile dependency in the permanent read path — the forward-compat ruling); a blob's KZG versioned hash is at most an optional proof-of-publication receipt.

**Forward-compat is banked at the commitment.** Because the one signature commits chunk *hashes*, not a venue: bigger blocks / cheaper calldata ⇒ larger `C`, smaller `N`, same signature; EIP-7907 code raise ⇒ tier-0 chunks get bigger/cheaper (auto, read the limit at runtime); blobs/PeerDAS/danksharding ⇒ tier-3 transport firehose feeding promotion. **The write-authorization design never has to change again.**

---

## 5. Submission flow — parallel, out-of-order, idempotent, resumable, with the contiguous-run fast path

### 5.1 The canonical flow (S3-multipart ergonomics over a root-signed core)

```
CLIENT (local, no wallet, no gas):
  1. (optionally compress →) chunk the file at fixed C → chunk tree → chunksRoot (count-at-apex)
  2. build the envelope: { DATA(dataId), chunks-PIN(FileManifest), placement-PIN, [contentType…] } → recordsRoot
USER (exactly one interaction):
  3. eth_signTypedData_v4 over Envelope{author, seq, prev, recordsRoot, count}  under domain ("EFS","1")   ← THE ONLY PROMPT
SUBMITTER (relayer / burner / session-key agent / the user's own EOA — anyone):
  4. record-kernel tx: submit(envelope)   — O(1), lands DATA + manifest + placement atomically. FILE IS COMMITTED.
  5. EFSBytes: stream chunks to storeId=keccak(chunksRoot, tier):
        - submitChunkRun for power-of-two aligned runs (batched, ONE boundary proof/run)
        - submitChunk / submitChunks for stragglers and resume gap-fill
     ANY submitter, ANY order, idempotent, resumable, parallel.
```

Properties (each inherited from the substrate, not asserted):
- **Resume is free, zero new signatures.** Read the bitmap (one word / 256 chunks) or subscribe to `ChunkStored`; resubmit only the gaps. The bitmap **is** the resumable session — global (a different relayer resumes an abandoned upload), stateless (no session/nonce/lock), and covered by the *original* signature (chunks carry no signature at all).
- **Parallel is coordination-free.** CREATE2 store/chunk addresses are pre-computable; N deploys shard across M submitter accounts with zero cross-tx dependency. Throughput scales ~M-fold by adding submitter accounts (mempool `accountslots` is the per-account limit; shard across burners to exceed it — `[UNMEASURED]`).
- **Racing is harmless.** Single-threaded EVM: first tx flips the bit; the later one hits the step-2 no-op; content-addressed CREATE2 makes the physical deploy at-most-once. Worst case = one loser's wasted calldata, avoided by bitmap-polling before submitting.
- **Reorgs converge.** A reorged-out `submitChunk` reverts its bit+bytes; idempotent replay of the missing-set reconverges with no special handling.

**Resume protocol (SDK, informative):**
```
loop until complete:
  s = fileStatus(storeId);  if s.complete: done
  gaps = missingChunks(storeId, cursor, PAGE)
  submit gaps  (submitChunkRun for aligned sub-runs; submitChunk for the rest) — parallel, any submitter
```

### 5.2 The contiguous-run fast path (`submitChunkRun`) — one proof for a whole subtree, and why it is safe

Submitting each chunk with its own O(log N) proof repeats proof work N times. Instead, a **power-of-two aligned run** `[startIndex, startIndex+2^k)` is admitted with a **single boundary proof**:

1. The verifier recomputes `leaf_i` for each chunk in the run from the **complete, contiguous** run bytes, and folds them into the run's **subtree node** at layer `k` (2^k − 1 internal hashes).
2. It proves that one subtree node against `chunksRoot` with a single O(log(N) − k) path (`boundaryProof`), applying the count-at-apex wrap.
3. It then commits all `2^k` chunks (bitmap + storage + count) in one call.

**Safety (the OZ-multiproof distinction, stated precisely).** The OZ multiproof CVE was a *sparse* proof where attacker-supplied **internal** nodes let an out-of-tree leaf verify. `submitChunkRun` accepts **no attacker-supplied internal nodes for the run** — every internal node under the subtree root is recomputed from the complete leaf data; only the single ordinary path from the subtree root upward is attacker-supplied, exactly as safe as `submitChunk`'s single-leaf path. A run that straddles an odd-promotion boundary or overhangs `n` simply **fails to reproduce `chunksRoot`** and reverts `BadChunkProof` — so the SDK confines runs to promotion-free aligned subtrees and falls back to single-leaf for right-edge stragglers; safety is enforced by the proof check, not by trusted pre-conditions. **Freeze-gate obligation (named):** a differential fuzz vector proving *no* crafted `(runChunks, boundaryProof)` admits any byte string not under `chunksRoot` at `(index, n)`.

### 5.3 Anti-dust (Arweave's floor, ported)

`MIN_CHUNK_BYTES[tier]` + the **proof-ratio floor** (`reject if 32·len(proof) > len(chunkBytes)` for non-final chunks) stop a griefer (or a naive author) from inflating relayer gas / state with dust chunks whose proofs dwarf their payloads. Small files never chunk — they route to the inline calldata body or a `data:` mirror. This is Arweave's `chunk_proof_ratio_not_attractive`, whose own rationale is "if the original data is too small, it should not be uploaded in chunks."

---

## 6. Progressive read grades — partial ≠ broken ≠ false-absent, and permanence is legible

The role's hard requirement: a partial/incomplete file reads as a **graded state**, never a broken file, never a false "absent". Byte-availability is a **new flag dimension** composed onto the existing `read-lens` grade `(position-state | disposition, currency, flags)` — **orthogonal** to the disposition, exactly as the read-lens models flags.

**Two independent resolution layers:**
1. **Identity/placement/metadata** — the normal lens walk over the file's placement slot and the `chunks` manifest slot. If the manifest PIN is present/unrevoked, the file's identity, `contentHash`, `size`, `chunksRoot`, `chunkSize` are **LIVE** (with the usual currency qualifiers). **This never depends on byte availability** — a file object is fully readable the instant its manifest lands, before any byte arrives.
2. **Byte availability** — a flag graded from `EFSBytes`, computed **per tier** and then reduced across tiers by priority (§6.3):

| byte-flag | condition (best tier) | GATE read | INTERACTIVE read |
|---|---|---|---|
| **BYTES-COMPLETE@STATE** | some state tier (0/1) `bound ∧ received==n` | consumable (permanent in-state bytes) | serve/render; permanent |
| **BYTES-COMPLETE@EPHEMERAL** | only tier 3 (blob) complete, pre-prune | consumable **with expiry warning** | serve; label "expires ≈ epoch+4096 unless promoted" |
| **BYTES-COMPLETE@OFFCHAIN** | only tier 2 (history) / mirror complete | consumable **iff app accepts archival** | serve; label "archival/off-chain bytes" |
| **BYTES-PARTIAL(k,n)** | best tier `0 ≤ received=k < n` | **fail closed** if whole-file needed; MAY consume any present, proven chunk for range logic | render progress k/n; serve present byte-ranges (HTTP 206); stream-as-available; missing set is exact |
| **BYTES-UNBOUND** | no valid chunk in any tier | fail closed | "upload pending" placeholder; identity/metadata still shown |
| **CONTENT-MISMATCH** | reassembly ≠ `contentHash` | fail closed | error; harms only the author's own file, detectable |

`BYTES-PARTIAL(k,n)` and the `@STATE`/`@EPHEMERAL`/`@OFFCHAIN` permanence qualifiers are proposed as a **Durable refinement** of the read-lens `BYTES-UNAVAILABLE` flag (§2.4) — same family ("authenticated pointer, bytes status X here"), but **precise** (exact present set from the bitmap; exact permanence posture from the tier) `[→ read-lens-spec §2.4]`. The permanence qualifier is what keeps the mission honest: a reader is *told*, in the grade, whether the bytes are in permanent state or merely ephemeral/archival — the blob-permanence trap is a documented, gradeable state, never a silent lie.

**Consequences that satisfy the role:**
- **Never "broken."** Identity/hash/size/placement readable the instant the manifest lands, independent of bytes.
- **Never a false "absent."** Byte-absence is `BYTES-PARTIAL/UNBOUND` at a *present* file — categorically distinct from an empty slot. The anti-fallthrough rule (`read-lens` §2.1) is untouched: a partial file is `PRESENT`+byte-flag, not `PROVEN-ABSENT`, so a lens walk never falls through it to a lower-trust author.
- **Never truncation-as-complete.** `complete ⟺ bound ∧ received==n`; `readFile` stops at the first gap; a GATE consumer checks `isComplete` and can never be handed a silently-short file. Across chains this is the envelope's truncation-replay posture one level down: a copier who fills only `k<n` yields an honest `PARTIAL(k,n)` on the foreign chain — bounded and detectable, never served-as-whole (`n` is `chunksRoot`-bound; `isComplete` is computed, not claimed).
- **Progressive availability is a feature.** Indexed content-addressed chunks give byte-range reads, resumable downloads, and stream-as-it-arrives (video that plays the delivered prefix) for free.

### 6.3 Multi-tier reduction (reader-side, cheap)

A reader/router resolves best-available bytes by probing stores in a fixed **permanence-priority** order and taking the first complete one (or the most-complete for progressive render):

```
priority: tier 0 (SSTORE2, state, R1)  >  tier 1 (inline, state)  >  tier 3 (blob, pre-prune)  >  tier 2 (history/off-chain)
```

Each probe is one `isComplete(storeId)` point read; `preferredTier` (manifest hint) may be tried first to short-circuit. **R1 contract readers** that stored the file themselves skip probing — they target the exact `storeId = keccak(chunksRoot, tier)` they wrote, one point read. This matches the composability research: R1 is a same-chain point lookup, never a scan.

---

## 7. Reads & serving (point reads Etched on `EFSBytes`; pagination in redeployable views)

Following the kernel's Etched discipline (writes + point reads on the Etched contract; enumerating/joining reads evicted to redeployable stateless views):

**Etched on `EFSBytes` (point reads):**
```solidity
function chunkPresent(bytes32 storeId, uint32 index) external view returns (bool);
function fileStatus(bytes32 storeId) external view returns (uint32 chunkCount, uint32 receivedCount, bool bound, bool complete);
function readChunk(bytes32 storeId, uint32 index) external view returns (bool present, bytes memory data); // extcodecopy/SLOAD by tier
function isComplete(bytes32 storeId) external view returns (bool);
function bestTier(bytes32 chunksRoot) external view returns (uint8 tier, bool complete);                    // §6.3 priority probe
// pure verifier for tier-2/-3/off-chain-served bytes (verify-don't-trust; no storage needed):
function verifyChunk(bytes32 chunksRoot, uint32 chunkCount, uint32 index, bytes calldata chunkBytes, bytes32[] calldata proof)
    external pure returns (bool);
```

**In a redeployable view (`EFSBytesView`, stateless, forever-fixable):**
```solidity
// EIP-7617-style pagination — serves a COMPLETE file across calls, or contiguous-until-gap for PARTIAL
function readFile(bytes32 chunksRoot, uint8 tier, uint32 startIndex, uint32 maxChunks)
    external view returns (bytes memory data, uint32 nextIndex, bool complete);
// resumption helper — enumerate gaps
function missingChunks(bytes32 storeId, uint32 startIndex, uint32 maxScan)
    external view returns (uint32[] memory missing, uint32 nextIndex);
```

`readFile` concatenates present chunk bytes (`extcodecopy` tier 0, SLOAD tier 1) from `startIndex` until the first gap or `maxChunks`, returning the cursor and whole-file `complete`. This ports v1's EIP-7617 chunk pagination onto the native store unchanged in spirit.

**web3:// serving.** The router (redeployable, ERC-5219) grows one classification: `~store:<chunksRoot>` (or `~data:<dataId>` → its `chunks` manifest → `chunksRoot`) resolves to the paginated `readFile` at the best tier. A complete file serves 200 with reassembled bytes; a `BYTES-PARTIAL` file serves 206 with the available prefix (or a progress document), **never** a truncated 200. A `mirrors` reserved key MAY additionally carry `web3://<router>/~store:<chunksRoot>`, so generic web3:// clients (`web3protocol`, w3link, eth.limo) resolve the native store with no EFS-specific code — and, being author-committed + in-state, the native store takes **top transport priority** over external mirrors when present and complete.

---

## 8. Portability & permanence (the mission ends)

**Portability — strictly more than raw SSTORE2, and now more than the discovery pass too.** To copy a file to a new chain:
1. Replicate the **one envelope** carrying the manifest (+ DATA + placement). It re-verifies from the author's signature — chain-free by construction. One record, tiny.
2. Fill **any tier's** store on the new chain by streaming `submitChunk` against the identical `chunksRoot`. Bytes re-prove against the same root — **no re-signing, no trust in the copier.** A copier who flips a byte fails the proof; a lazy copier yields an honest `PARTIAL`. Dedup travels: if the new chain already holds those bytes (from any other file/copier), the copied manifest resolves **instantly complete**.

Because tier is not committed, the copier is free to pick the cheapest available tier on the new chain and a later promoter upgrades it — LOCKSS across *both* chains and tiers, all keyed to the author's one signature. This is the replication-over-proofs thesis (composability research §0.5) reaching the **bytes**, not just the namespace.

*Honest portability limit (inherited, unchanged):* a **dead author's `dataId`** can't be re-minted on a fresh chain under owned-kind identity (binds author+salt). That limit is the file's *identity* object; the **bytes** (`chunksRoot`, content-addressed) copy freely and model-independently. This design widens what travels trustlessly; it does not reopen the identity model.

**Permanence — bytes end in state, contract-readable, state-reconstructible.**
- Tier 0 bytes live in contract **code** (SSTORE2), read by `extcodecopy`. **EIP-4444 history expiry touches historical blocks/receipts, not account code/state** — so tier-0 bytes and the commitment both sit in the permanent state set. (Tier 2 bytes live in history and are therefore *archival*, graded `@OFFCHAIN`; tier 3 blobs are *ephemeral*, graded `@EPHEMERAL` — the grades tell the truth.)
- **From-state-alone reconstruction** holds, spanning the two Etched contracts (both in the same chain state trie, both ERC-7201-frozen, both `eth_getProof`-derivable):
  ```
  record-kernel spine (allClaims) → find the chunks-PIN manifest → decode body → (chunksRoot, n, C, contentHash, encodingTag)
    → storeId = keccak(chunksRoot, 0) → EFSBytes.chunkPtr[storeId][0..n-1] → extcodecopy each → reassemble
    → decode per encodingTag → verify contentHash.
  ```
  No event dependence on the permanent read path (events are conveniences for indexers/tier-2 mirrors only). The reader must know **both** canonical addresses (record kernel + `EFSBytes`) — the same codehash-verification story the kernel already carries, now for two artifacts (a documented cost of the separation, §13).
- **State expiry / The Purge** (future, unscheduled) is the only threat to bytes-in-state permanence; the hedge is exactly this design's replication (LOCKSS across chains) + the portable commitment (rehydrate from any surviving copy). Track it; don't architect around it.

---

## 9. The exact MetaMask prompt/click count (the headline)

The author's key is needed for **exactly one thing**: the `eth_signTypedData_v4` over the envelope carrying the manifest. Everything after — submitting the envelope, and streaming every chunk to `EFSBytes` — needs **no signature and no author key** (envelope = signature-authenticated; chunks = proof-authenticated; `msg.sender` ignored throughout).

| submission rail | author key prompts | author tx confirmations | notes |
|---|---|---|---|
| **Relayer / burner (recommended default)** | **1** (`eth_signTypedData_v4`) | **0** | Author signs once; hands `{signed envelope + file bytes}` to a relayer or app-managed burner, which submits the envelope and streams all chunks, paying gas. Kernel attributes file + every byte to the author. No ETH in the author's wallet, no gas UX. The **cypherpunk floor** is preserved (author *can* self-submit, never *required* to). A **faucet-dripped burner** is the same at 1 prompt with no external relayer — the hackathon gasless path. |
| **Self-pay, EIP-5792 batch wallet** | **1** (sign typed data) | **~1** (`wallet_sendCalls` batching `submit` + `submitChunkRun`s, per bounded batch) | Modern wallet batches sends into one confirmation; very large N may need a few batch approvals or a session key. Effectively ~2 clicks. |
| **Self-pay, legacy wallet (no batching)** | **1** (sign typed data) | **1 (`submit`) + ⌈N / B⌉ (`submitChunkRun`, B chunks/run)** | Honest worst case: one sign + one envelope confirm + a confirm per run. Still **one signature**; the extra clicks are gas confirmations, not authorizations, and vanish under batching/relay. Contiguous runs cut ⌈N/B⌉ well below N. |
| **Session key (ERC-7715 on a 7702 EOA)** | **1 grant + 1 sign** up front, then **0/chunk** | 0 (local agent submits) | Grant a kernel/`EFSBytes`-submit-only, value-0, gas-capped, minutes-boxed session key; a local agent completes the upload unattended on the user's own address. Blast radius = gas only (a submission key **cannot author** — no ERC-1271, no delegated authoring in v2). "As AA matures" answer. `[verify wallet support at ship time]` |
| **Self-submit floor (always available)** | **1** | 1 + ⌈N/B⌉ | The censorship floor: needs nobody. Every rail above is UX over this and none weakens it — the signed manifest is always self-submittable by anyone, forever. |

**Headline: one signature authorizes the entire multi-block upload.** In the default rail that one signature is also the author's *only* interaction — zero transactions, zero gas from the author. The N-transaction reality of a large file (unavoidable — it exceeds one block's gas) is fully absorbed behind that single authorization.

*The one genuine exception:* **streaming/unbounded input** (a live capture of unknown length) can't be pre-hashed into one covering `chunksRoot`, so it needs a few signatures (sign per-GB envelope) or the KEL-era delegated-authoring key (post-v2). Flagged, not hidden.

---

## 10. Parents-first / atomicity interaction

- **Atomic, one block:** the envelope `{DATA, chunks-PIN(manifest), placement-PIN[, contentType…]}` — small, single revert scope (batch atomicity by construction). This is the moment the file is **committed**: identity, placement, and *exact byte-content* (via the signed `chunksRoot`) permanently pinned — **before** any bytes arrive.
- **Non-atomic, many blocks (by necessity):** the chunks. A large file cannot be atomic; what *is* atomic is the tiny signed commitment. Availability then converges idempotently.
- **Ordering:** chunk admission has **no dependency on record-kernel state at all** (it depends only on `chunksRoot`, self-contained) — so there is nothing for chunks to be "out of order" *with*. This is *simpler* than record parents-first. For a *file* to resolve, its manifest must be present (normal parents-first: manifest references `dataId`, minted in the same atomic batch); a chunk-before-manifest submission is harmless — it just fills the permissionless pool.

---

## 11. Trying to break this proposal (adversarial pass)

| attack | outcome | why it fails |
|---|---|---|
| Forge a chunk (wrong bytes, valid-looking) | revert `BadChunkProof` | keccak second-preimage on `chunksRoot`; domain-separated leaf/node |
| Grief a store with a wrong `chunkCount` | impossible to bind wrong `n` | `n` committed at the apex; only true `n` reproduces `chunksRoot` (§3.3) |
| Front-run the store (correct bytes) | helps the author | content-addressed; stores exactly the right bytes at the right `storeId` |
| **Crafted contiguous-run admits out-of-tree bytes** | revert `BadChunkProof` | run internals recomputed from complete data; only a single ordinary path is attacker-supplied (§5.2). **Named freeze-gate fuzz vector required.** |
| Amplification via huge `chunkCount` | zero allocation | mappings sparse; nothing stored until a proven chunk arrives; `n` bound only by a valid chunk |
| Dust-chunk griefing (tiny payloads, huge proofs) | rejected | proof-ratio floor + `MIN_CHUNK_BYTES` route small data off the chunked path (§5.3) |
| Racing relayers on one chunk | first wins, second no-ops | single-threaded EVM; step-2 bitmap gate; CREATE2 at-most-once deploy |
| Replay a chunk proof as a record proof (or vice-versa) | revert | disjoint domain constants (`efs.bytes.*` vs `efs.kernel.*`) |
| Truncation: serve k<n as complete (incl. cross-chain) | impossible | `complete ⟺ bound ∧ received==n`; `isComplete` computed not claimed; `readFile` stops at first gap; GATE fails closed |
| `chunksRoot` of garbage + real `contentHash` | `CONTENT-MISMATCH` on reassembly | end-to-end `contentHash` check; harms only the author's file, detectable |
| **Tier "downgrade" (fill only a cheap tier)** | no downgrade; honest grade | tier not committed ⇒ nobody can *prevent* a tier-0 fill; read grade reflects the best tier present; a cheap-only file grades `@OFFCHAIN`/`@EPHEMERAL`, truthfully |
| **Fake `EFSBytes` deployment injects bad bytes** | impossible | readers use the canonical (factory+salt) address; bytes are content-addressed (proof vs `chunksRoot`) so even a fake store can't serve non-proving bytes |
| **Cross-contract reentrancy (kernel ↔ EFSBytes)** | none | no write-time cross-calls; reads are views. Decoupling *removes* this class |
| Author never supplies bytes | honest `BYTES-UNBOUND`/`PARTIAL(0,n)` | no third-party impact; grade truthful, never "broken"/"absent" |
| Revoke manifest, bytes remain | correct | manifest slot tombstones → file reads "withdrawn"; bytes orphaned (permanence), not served |
| Un-complete a completed store | impossible | monotone accumulator; SSTORE2 code permanent; revocation touches the manifest slot, not the store |
| Two manifests share a `storeId`, one revoked | independent | each file resolves via its own manifest slot; store completeness is shared, monotone, content-level |
| Permissionless-pool byte spam | linear-cost, no amplification | attacker pays full storage for real bytes; identical to base-kernel economics; optional manifest-gate available but unneeded |
| Blob bytes prune (tier 3), never promoted | honest `BYTES-COMPLETE@EPHEMERAL` → later `BYTES-UNAVAILABLE` | grade tells the truth; promotion is the named bridge; blob-only is a conscious graded choice, never a silent "permanent" |

**Residual honest weaknesses (not fatal, flagged):**
1. **Cost.** On-chain bytes are expensive by design (SSTORE2 ~200 gas/byte + calldata floor). Mitigated by tiers 2/3, L2/L3 economics, and the "archival not commodity" doctrine — not eliminated. A property of *any* bytes-on-chain system.
2. **Two Etched artifacts.** Reconstruction/verification now spans record kernel **and** `EFSBytes` (two codehashes, two canonical addresses). The kernel doc already reserves the two-artifact option (amendment 8); this is the documented cost of the (large) benefits in §0.2. Mitigation: both artifacts in the same state trie, both codehash-verified, genesis vectors for both.
3. **`chunks` reserved-key row + `EFSBytes` crypto are Etched.** A wrong row/constant is permanent. Mitigation: per-row golden vectors, the shared reserved-key enforcement engine, VAL/REF differential fuzz, the §5.2 contiguous-run fuzz, an independent external review of `EFSBytes` as a standalone artifact, and the EIP-170 skeleton compile.
4. **`chunkSize`/tier coupling.** An author committing `C` larger than a chain's runtime code limit forecloses tier-0 (SSTORE2) permanence *on that chain* (bytes can still go tier 1/2/3). Mitigation: SDK default `C` ≤ the smallest code limit you care about (permanence-first bias); flagged.
5. **Promotion is best-effort.** A lazy author who uses only cheap tiers and never promotes leaves bytes archival/ephemeral. The grade is honest (`@OFFCHAIN`/`@EPHEMERAL`), the SDK default is tier-0, and a bounty/escrow promoter is a named additive Phase-N option — but "permanent" is never claimed for un-promoted cheap-tier bytes.

---

## 12. Gas estimates (concrete but UNMEASURED — flagged; CI snapshot supersedes)

Order-of-magnitude, L1 cold-slot pricing, per 24 KB chunk:

| tier | dominant costs (per 24 KB chunk) | ~gas/chunk | ~gas / 1 MB (≈43 chunks) |
|---|---|---|---|
| 0 SSTORE2 | code deposit 200×24,576 ≈ 4.92M + calldata bytes ~0.4–1.0M + proof/bitmap/verify ~30–60k | **~5.4–6.0M** | **~230–258M** |
| 1 inline-SSTORE | 22.1k/word × 768 words ≈ 17.0M + calldata ~0.4–1.0M | **~18M** | **~774M** |
| 2 calldata-published | calldata+log bytes ~0.6–1.2M + bitmap SSTORE ~22k + verify ~20k | **~0.7–1.3M** | **~30–56M** |
| 3 blob-committed (reserved) | ~1 blob-gas/byte (separate fee market) + versioned-hash SSTORE ~22k | cheapest bytes | ephemeral; promote later |

**`submitChunkRun` savings:** batching B chunks amortizes the ~21k tx base and the boundary-proof calldata across B chunks and replaces B per-chunk proofs with one. For tier 0 the *bytes* (deposit + calldata) dominate, so runs mainly save proof + tx overhead (modest, ~5–15%); for tiers 2/3 where proof/tx overhead is a larger fraction, runs save materially more. `[UNMEASURED]`

**Reading:** SSTORE2 (tier 0) is the right permanence default (3–4× cheaper than inline while staying R1-readable). On **L2/L3** all figures fall 1–2 orders (calldata via blob DA, cheap execution) — **large on-chain files are primarily an L2/L3 play**, L1 the premium-permanence tier. Per-chunk cost spreads across many blocks by construction. Manifest envelope itself is a normal small write (~0.3–0.5M). **All figures unmeasured; the freeze-blocking CI gas snapshot on a real L2 supersedes them before any ADR cites them.**

---

## 13. Frozen-surface summary & open questions

**Etched (record kernel) — minimal:**
- Reserved-key table **row: `chunks`** (DATA parent, PIN, VAL struct, **non-interned, non-side-effecting**) + the `FileManifest` body layout (§1.1). No new entrypoints, no new kernel storage, no new admission side-effect. This is the *entire* record-kernel delta.

**Etched (new sibling contract `EFSBytes`):**
- Chunk-tree constants `DOMAIN_CHUNKLEAF_V1`, `DOMAIN_CHUNKNODE_V1`, `DOMAIN_CHUNKSROOT_V1` (count-at-apex), `DOMAIN_CHUNKSTORE_V1`; `storeId = keccak(DOMAIN_CHUNKSTORE_V1, chunksRoot, tier)`.
- Entrypoints `submitChunk` / `submitChunks` / `submitChunkRun`; point reads `chunkPresent` / `fileStatus` / `readChunk` / `isComplete` / `bestTier` / `verifyChunk`.
- Storage layout `chunkStores` / `chunkBitmap` / `chunkPtr` / `chunkInline` (ERC-7201, slot-derivations in the Codex).
- `MIN/MAX_CHUNK_BYTES[tier]` (tier 0 = runtime code limit − 1, read at runtime, never hard-coded); tier byte semantics {0,1,2}, **tier 3 reserved** (blob-committed); proof-ratio floor.
- Canonicity via deterministic factory + fixed salt + genesis vectors; codehash-verified like the kernel.
- Estimated size ~200–350 LoC (verify + subtree recompute + SSTORE2 write + bitmap + tier branch). Fills the kernel doc's reserved second-artifact slot; own EIP-170 budget, own review.

**Durable (read layer):** `BYTES-COMPLETE@{STATE,EPHEMERAL,OFFCHAIN}` / `BYTES-PARTIAL(k,n)` / `BYTES-UNBOUND` / `CONTENT-MISMATCH` flags `[→ read-lens-spec §2.4]`; `readFile` / `missingChunks` / `EFSBytesView`; router `~store:` serving + 206-for-partial; the §6.3 tier-priority reduction.

**Open questions / decision points (for James / freeze):**
1. **Separate `EFSBytes` contract vs fold into the record kernel.** Recommend **separate** (zero coupling makes it free semantically; relieves the real EIP-170 pressure; independent freeze/review; removes cross-contract reentrancy). Fold only if the skeleton compile shows ample room *and* one-codehash simplicity is preferred over the separation benefits.
2. **Tier NOT committed in the manifest.** Recommend **not committed** (enables reader-transparent, no-re-signature promotion + LOCKSS across tiers). Confirm — this is the main departure from the discovery pass.
3. **Permissionless pool vs manifest-gate.** Recommend **permissionless** (safe per §3.3; enables pre-staging/dedup/promotion). The one policy knob a deployment could tighten.
4. **`chunkSize` default `C`.** Recommend `C` ≤ smallest code limit you care about (permanence-first). Confirm the SDK default.
5. **Golden-vector + fuzz obligations:** `FileManifest` body (reserved-key per-row vectors + VAL-tail differential fuzz); chunk-tree vectors (leaf/node/count-at-apex); **the §5.2 contiguous-run soundness fuzz**; independent external review of `EFSBytes` as a standalone artifact. Confirm inclusion in the freeze gates.
6. **Tier 3 (blob-committed) reservation** now vs at first blob-DA adoption — recommend reserve-the-tier-byte-now, ship machinery later.
7. **Gas snapshot** (tiers 0/1/2 per chunk + `submitChunkRun` savings, on a real L2) is freeze-blocking before any number here is cited.
