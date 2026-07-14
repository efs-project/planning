# Architecture B — DA-TRANSPORT + PERMANENCE PROMOTION (scaling-first large-file uploads)

**Role output.** A complete end-to-end design for EFS v2 large on-chain file uploads that **uploads bytes via the cheapest available data-availability (DA) rail — EIP-4844 blobs today, danksharding/PeerDAS tomorrow — under one signed keccak-Merkle commitment, then *promotes* those bytes into a permanent tier (SSTORE2-in-state or signed-leaf+durable-mirror) before the DA window closes.** The thesis: **ride Ethereum's scaling roadmap so uploads get cheaper automatically, while permanence is banked at the commitment (in state, one signature) and the bytes migrate up the durability ladder as the cost floor drops — with no re-signature, ever.**

**Status:** draft (spec-grade). **Gas/latency/throughput numbers are concrete estimates, explicitly UNMEASURED — flagged inline; a CI gas snapshot + a live blob-fee oracle replace them before any ADR cites them.**

**Design posture — B is a lifecycle/transport layer, not a replacement mechanism.** B deliberately **reuses** the sibling design's on-chain machinery ([native-manifest-chunk-submission.md] = "Architecture A": the `chunksRoot` keccak-Merkle tree, the `chunks` reserved-key manifest, `submitChunk`/`submitChunks`, the chunk accumulator/bitmap, `verifyChunk`, and `mirrors` edges). **A's SSTORE2 chunk store is one of B's promotion targets.** B's genuinely-new surface is small by design (transport rail + promotion protocol + three read-layer flags + one optional, droppable receipt entrypoint). Where A says "stream bytes straight into state under one signature," B says "**stage bytes in the cheapest DA under that same one signature, then promote to whatever permanent tier is affordable, whenever it is affordable, permissionlessly.**" The two compose; the synthesis phase should read them together.

**Depends on / designs within:** `codex-envelope` (chain-free EIP-712 Merkle envelope; author-from-signature; `msg.sender` ignored; `submit`/`submitSubset`); `codex-kinds` (DATA object, `mirrors`/`contentHash`/`size` reserved keys, VAL edges); `codex-kernel` (entrypoints, spine, ERC-7201 layout, `authorHead`); `read-lens-spec` (BYTES-UNAVAILABLE flag §2.4, PROVEN-ABSENT-vs-UNKNOWN §2.1, currency qualifiers §2.3, GATE-fail-closed); `ops-doctrine` (mortality invariant: *no signed byte names a submission channel*; censorship floor; expiry); the four discovery docs (forward-compat-da, auth-models, native-manifest-chunk-submission, prior-art-autopsy).

---

## 0. The one-paragraph idea

A large file is chunked with **frozen** parameters; its chunks form a keccak-Merkle tree whose root — **`chunksRoot`, with the chunk count bound at the apex** — is the file's permanence anchor. The author signs **one** `eth_signTypedData_v4` over an envelope that carries a DATA identity record + a `chunks` manifest (holding `chunksRoot`, `size`, `contentHash`, …) + a placement edge. That one signature is admitted on any chain as a **tiny, permanent, portable commitment in state** — the file's identity and integrity exist the instant it lands, independent of where a single byte physically lives. The bytes are then **transport**: a relayer posts them as **EIP-4844 blobs** (the cheapest DA on Ethereum, and the one that gets monotonically cheaper as the blob-count ramp and PeerDAS land) — with **no further user signature**, because the kernel recovers the author from the manifest signature and ignores `msg.sender`. Blobs, however, are **availability, not storage**: sidecars are pruned at ~18 days. So a **permissionless, trust-minimized promoter** — the author's own SDK by default, or any third party — fetches the blob bytes within the window, **keccak-verifies every chunk against the author's signed `chunksRoot`** (so it cannot corrupt the file), and re-submits them to a **permanent tier**: SSTORE2 bytes-in-state (Architecture A's accumulator) and/or a durable `mirrors` edge (Arweave endowment / EthStorage proof-of-storage). As on-chain storage gets cheaper over the decades, the *same committed file* is promoted higher up the permanence ladder, later, by anyone, **with no re-signature**. Permanence is banked now at the commitment; the bytes ride the cost curve down.

---

## 1. The two orthogonal durability axes (the invariant everything rides over)

The whole design falls out of one distinction the corpus half-states but never makes mechanical (forward-compat-da §1):

- **Commitment-durability** — how long the *cryptographic commitment* (`chunksRoot` + `contentHash` + `size` + author signature) survives and stays verifiable. It lives in **state** (the manifest claim body, reachable via the enumeration spine / `getClaim`). Tiny (~100 bytes), permanent as long as *state* persists, portable (the chain-free envelope replays onto any chain), costs **one signature**. **This is the mission property, and it is always on.**
- **Bytes-durability** — how long the *actual file bytes* remain retrievable by someone. A separate, per-tier property with wildly different costs and lifetimes.

**A file is permanent iff (commitment in state) AND (≥1 bytes-tier still holds).** The axes are independent: you can have a permanent commitment with vanished bytes (a blob nobody promoted → read grade BYTES-UNAVAILABLE, an honest graded state), or durable bytes with no commitment (a raw CID nobody signed → unverifiable, not EFS). **EFS must never conflate them, and B's type system + read grades keep them separate by construction.**

The 2026 corollary that reframes the tier list (forward-compat-da §1; EIP-4444 live-partial since July 2025): **history expiry expires *history* (blocks, calldata, receipts, blob sidecars), NOT *state*.** So bytes-durability is set by *which structure the bytes live in*:

| Structure | Persisted by | 2026 expiry regime | B tiers here |
|---|---|---|---|
| **State** (code/storage trie) | every full node, indefinitely | The Purge / state-expiry is future & unscheduled (resurrection-witness designs keep it recoverable) | T-SSTORE2 chunk code; **the `chunksRoot` commitment** |
| **History** (calldata, logs) | shrinking: EIP-4444 → ~1yr then P2P/archival | expiring now | inline-calldata bytes (commitment stays in state; bytes → archival) |
| **Blob sidecars** | consensus nodes, **4096 epochs ≈ 18 days** | pruned by protocol; PeerDAS changes *custody*, not lifetime | **T-BLOB transport bytes** |
| **Off-Ethereum** | that network's incentives | per-network | Arweave (endowment ≈ permanent), EthStorage (proof-of-storage), IPFS (pin-life) |

---

## 2. The signed commitment / manifest format

### 2.1 What the author signs (exactly once, for any file size)

One `eth_signTypedData_v4` over the settled envelope (`codex-envelope`), unchanged:

```
Envelope(bytes32 author, uint64 seq, bytes32 prev, bytes32 recordsRoot, uint32 count)
  under chain-free domain ("EFS","1")   // no chainId, no verifyingContract
```

`recordsRoot` is the Merkle root over the file's small **record** set (Tree 1, the Etched envelope tree):
- **DATA** — file identity, owned: `dataId = keccak256(DOMAIN_DATA, author, salt)`.
- **`chunks` manifest** — a PIN on the DATA carrying the `FileManifest` VAL body (§2.3).
- **placement** — the naming edge (where the file lives in the path/folder namespace).
- optional **`contentType`**, and **`mirrors`** edges the author already intends (a durable `ar://` at upload sidesteps the blob window entirely — §5).

The transitive commitment chain is the whole game:

```
one signature → recordsRoot → manifest leaf → chunksRoot → every chunk hash
```

So the single signature **transitively commits every byte of the file**, and — because the kernel recovers author from the signature and ignores `msg.sender` — it **also authorizes** every downstream action with no further signature: blob posting, promotion to SSTORE2, promotion to a mirror, resume, and cross-chain replication. (auth-models §0–§2: authoring prompts = number of signed roots = **1** for any bounded file; `count` is `uint32` so one envelope covers any file to ~100 TB.)

### 2.2 The chunk Merkle tree (Tree 2 — the permanence anchor, chain-free, frozen params)

Reused verbatim from Architecture A (native-manifest-chunk-submission §2), because a second tree over *chunk bytes* — disjoint from the envelope's record tree by domain constants — is exactly the right primitive and the prior-art autopsy confirms it is the universal shape (Arweave `data_root`, BitTorrent `pieces root`, IPFS root CID):

```
DOMAIN_CHUNKLEAF_V1  = keccak256("efs.kernel.chunkleaf.v1")
DOMAIN_CHUNKNODE_V1  = keccak256("efs.kernel.chunknode.v1")
DOMAIN_CHUNKSROOT_V1 = keccak256("efs.kernel.chunksroot.v1")

chunkLeaf_i = keccak256(abi.encode(DOMAIN_CHUNKLEAF_V1, uint256(i), keccak256(chunkBytes_i)))
merkleApex  = fold(chunkLeaf_0 … chunkLeaf_{n-1})   // node = keccak(DOMAIN_CHUNKNODE_V1, l, r); odd promotes
chunksRoot  = keccak256(abi.encode(DOMAIN_CHUNKSROOT_V1, uint256(n), merkleApex))   // ← binds count n at apex
```

**Binding `n` at the apex** makes `chunksRoot` a *complete* content address: it commits the count **and** every chunk hash, so (a) identical bytes chunked identically → identical `chunksRoot` → **global cross-file/cross-chain dedup**, and (b) a submitter's claimed count is cryptographically validated on every chunk (a second-preimage on keccak to lie about `n`). **This is Arweave's `data_root` + `data_size` anti-overlap discipline (prior-art §3.1) made native.**

**Frozen chunking parameters (the #1 prior-art trap — IPFS CID non-determinism — defended exactly as the envelope froze Tree 1):** chunk size, tree arity, leaf/node domain tags, odd-node promotion, tail-chunk rule, and the raw-bytes-not-base64 rule are all **frozen into the ID math with published canonical vectors.** Two honest encoders MUST produce the same `chunksRoot` for the same bytes, or "anyone recomputes the same id" breaks. (prior-art §3.5 AVOID; §5 trap 1.)

> **Chunking-size note for B specifically.** Because B's *transport* is the 124 KiB-usable blob (§4), the SDK's natural file-chunk size for the blob rail is a divisor/multiple of the blob payload, while the *promotion* target (SSTORE2) is bounded by the code-size limit (runtime-read, ~24 KiB pre-EIP-7907 / ~64 KiB post — never hard-coded, forward-compat §7). **The `chunksRoot` chunk size is a frozen protocol constant independent of both**; the SDK packs frozen-size file-chunks into blobs for transport and re-emits them as SSTORE2 deploys at promotion. Recommended frozen file-chunk = **a size that divides evenly into both** (e.g. a small power-of-two like 16 KiB or 32 KiB, so k chunks pack per blob and one-or-few chunks per SSTORE2 deploy) — final value is a freeze-gate constant pending the gas snapshot.

### 2.3 The `FileManifest` body — transport-agnostic (B's one divergence from A)

```solidity
// VAL body of the `chunks`-key PIN on DATA. Canonical abi.encode; trailing bytes reject (NonCanonicalPayload).
struct FileManifest {
    bytes32 chunksRoot;    // apex-with-count commitment (§2.2) — THE permanence anchor
    uint32  chunkCount;    // advisory n for reads/UX; authoritative n is bound from the first valid chunk
    bytes32 contentHash;   // multihash over the DECODED whole file — end-to-end integrity of the reassembly
    uint64  size;          // decoded byte length (UX/paging hint)
    bytes32 encodingTag;   // keccak("efs.enc.<name>.v1") — raw / gzip / zstd / erasure-coded
    uint64  expiresAt;     // claim-body trailer (0 = never); clock-free storage, clock-aware reads
}
```

**The divergence from A: B's manifest does NOT sign a `storageTier`.** A binds tier into the manifest and into `storeId` to front-run-proof a *specific* store. B deliberately leaves the permanence tier **unbound at signing time**, because B's thesis is *defer the tier decision and let the file live in several tiers over its life* (blob → SSTORE2 → mirror), riding the cost curve. This is safe: content-addressing already front-run-proofs the *bytes* (a front-runner can only store the correct bytes at the content-derived `storeId`); the tier is chosen by whoever promotes, at promotion time, and `storeId = keccak(DOMAIN_CHUNKSTORE_V1, chunksRoot, tier)` simply means "same content in two tiers = two stores," which for B is a feature (a file provable in both SSTORE2 *and* a mirror shares the one `chunksRoot` identity). It also honors the **mortality invariant** (`ops-doctrine`: *no signed byte names a submission channel*) and the forward-compat rule (*the commitment must be transport-agnostic*) more strictly than A does.

> **A/B reconciliation (open item for synthesis).** A frozen `chunks` row can serve both: keep A's `storageTier` field but define **`storageTier = 0xFF` = "unspecified / promoter's choice / DA-staged"** as B's value. Then B is A with `tier = UNSPECIFIED` and a promotion lifecycle on top — a single frozen manifest row, two write strategies. Recommended.

### 2.4 Manifest derivation & slot (all offline / client-computable — unchanged from A)

```
dataId        = keccak256(abi.encode(DOMAIN_DATA, authorWord, salt))
chunksKeyHash = keccak256("chunks")
chunksDefId   = keccak256(abi.encode(DOMAIN_ANCHOR, dataId, chunksKeyHash, KIND_PROPERTY))
manifestSlot  = keccak256(abi.encode(DOMAIN_SLOT, CLAIMROLE_PIN, authorWord, dataId, chunksDefId))
claimId       = keccak256(abi.encode(DOMAIN_CLAIM_V1, authorWord, seq, recordDigest))
```

Everything a client needs before mining is derivable: `dataId`, the manifest slot, the `chunksRoot`. No mined-tx dependency; blob posts and promotions parallelize.

---

## 3. Kernel entrypoints & storage layout (the new surface is deliberately tiny)

B is designed so that **the minimal-footprint path adds essentially zero new Etched kernel storage.** Two tiers of ambition:

### 3.1 Minimal path (recommended) — no new Etched storage

- **Commitment**: the manifest lands via the existing `submit`/`submitSubset`. No new entrypoint.
- **Blob transport**: a vanilla EIP-4844 **type-3 transaction** carries the file bytes as blobs. This tx does **not** need to call the kernel at all — the bytes become available on the consensus-layer blob p2p network (and via EL sidecars / blob-archive services) for ~18 days. The chunk↔blob mapping (`chunksRoot` → versioned-hashes → index ranges) is carried **off-chain** (SDK hands it to the promoter — the common case, since poster and promoter are usually the same SDK) or **as a `BlobPublished` event** (§3.3) for a third-party rescuer to find the bytes.
- **Promotion to SSTORE2**: the existing `submitChunk`/`submitChunks` + chunk accumulator (Architecture A §3). No new surface.
- **Promotion to a durable mirror**: an existing `mirrors` reserved-key edge (`ar://…`, `web3://…EthStorage`). No new surface.
- **Read grades**: Durable (read-layer), not Etched (§7).

**So on the minimal path, B adds NO Etched kernel bytecode beyond what A already asks.** Its contribution is the transport rail, the promotion protocol, and the read grades. This is a virtue — less to freeze on the irreversible surface.

### 3.2 Chunk accumulator (reused from A, for the SSTORE2 promotion target)

When promoting to bytes-in-state, B uses A's accumulator verbatim (native-manifest-chunk-submission §3.1–§3.3):

```solidity
// storeId = keccak256(abi.encode(DOMAIN_CHUNKSTORE_V1, chunksRoot, tier))
struct ChunkStore { uint32 chunkCount; uint32 receivedCount; uint8 storageTier; bool bound; }
mapping(bytes32 storeId => ChunkStore)                         chunkStores;
mapping(bytes32 storeId => mapping(uint256 word => uint256))   chunkBitmap;  // 256 presence bits/word
mapping(bytes32 storeId => mapping(uint32 index => bytes32))   chunkPtr;     // SSTORE2 pointer
```

- **"is chunk i present?"** → one word read + bit test. O(1).
- **"is the file complete (in this tier)?"** → `s.bound && s.receivedCount == s.chunkCount`. O(1).
- The bitmap is simultaneously the **idempotence gate**, the **completion counter's guard**, and the **resume cursor** — and it makes promotion **resumable and permissionless across sessions and parties** (a different promoter finishes an abandoned promotion). `n` is **bound from the first cryptographically valid chunk**, never trusted from the manifest, so nobody can grief a store with a wrong count (second-preimage on the apex-bound root). Sparse by construction → a lying `chunkCount` allocates zero state.

`submitChunk` admission (validate-then-commit): shape → idempotence (bit set → no-op RETURN) → `leaf = keccak(DOMAIN_CHUNKLEAF_V1, index, keccak(chunkBytes))` → `require _verifyChunk(chunksRoot, chunkCount, index, leaf, proof)` → bind `n` (first valid chunk) → `ptr = SSTORE2.write` via CREATE2 salted on `keccak(chunkBytes)` (content-addressed; already-deployed → skip) → set bit, `receivedCount++`, emit. **The keccak proof is the integrity gate; a wrong byte reverts `BadChunkProof`.** This is what makes promotion trust-minimized (§5).

### 3.3 Optional: the proof-of-publication receipt (droppable, OFF the permanence path)

If James wants an on-chain, permanent attestation that "the bytes were really posted to DA" (useful for promotion **bounties/accountability**, §9), add ONE thin entrypoint — the *only* candidate new Etched storage in B, and it is optional:

```solidity
// Called INSIDE the same type-3 tx that carries the blobs (BLOBHASH only sees current-tx blobs).
// Reads the versioned hashes and records them as an advisory receipt. NOT on the permanence read path.
function attestBlobPublication(bytes32 chunksRoot, uint32 firstIndex, uint8 blobCount) external {
    bytes32[] memory vh = new bytes32[](blobCount);
    for (uint256 i = 0; i < blobCount; i++) vh[i] = blobhash(i);   // BLOBHASH opcode, 3 gas each
    emit BlobPublished(chunksRoot, firstIndex, vh, block.number);  // DEFAULT: event only, ~0 state
    // OPT-IN permanent receipt (costs 1 SSTORE/blob): blobReceipts[chunksRoot].push(...vh);
}
```

**Crucial honesty (forward-compat-da §5; prior-art §3.7):** the blob's KZG versioned hash is a commitment to *the blob's bytes*, **not** a proof that the blob holds *the file's* bytes — the EVM cannot cheaply prove the KZG commitment and the keccak `chunksRoot` agree (that is a ZK-equivalence or bytes-in-calldata problem). So the receipt proves **"a blob with commitment C was included at block B and was DAS-guaranteed-available for 18 days"** — a *timestamped availability receipt*, useful for "did the relayer actually publish?" accountability. **It is never a permanence claim and never the integrity gate.** The real integrity gate is the keccak proof at *promotion* (§3.2): if the fetched bytes don't match the signed `chunksRoot`, promotion rejects them. **Recommendation: ship the event by default; make the SSTORE receipt opt-in; keep it entirely off the permanence path so it can be dropped without touching the mission property.**

### 3.4 Point reads & the pure verifier (reused from A)

```solidity
function chunkPresent(bytes32 storeId, uint32 index) external view returns (bool);
function fileStatus(bytes32 storeId) external view returns (uint32 chunkCount, uint32 receivedCount, bool bound, bool complete);
function readChunk(bytes32 storeId, uint32 index) external view returns (bool present, bytes memory data);
// The verify-don't-trust primitive for mirror-tier / blob-fetched bytes (no storage needed):
function verifyChunk(bytes32 chunksRoot, uint32 chunkCount, uint32 index, bytes calldata chunkBytes, bytes32[] calldata proof)
    external pure returns (bool);
```

`verifyChunk` is load-bearing for B: it lets **any reader, any promoter, any mirror-auditor** verify a chunk handed to them (from a blob, a mirror, another chain) against the author's signed root with zero trust and zero new machinery. This is EthStorage's "client-side re-derivation" pattern (prior-art §3.7) and the substrate's verify-don't-trust default read path.

---

## 4. The transport rail — blobs today, danksharding tomorrow (the scaling engine)

### 4.1 Why blobs are the default DA rail

- **A blob is 128 KiB (~124 KiB usable), KZG-committed, carried in a type-3 tx; the EVM sees only the 32-byte versioned hash via `BLOBHASH`.** Cost ≈ **1 blob-gas per usable byte**, priced in a *separate* EIP-1559 blob-fee market, historically far below execution gas. vs calldata at ~40 gas/byte (EIP-7623 floor) → blobs are **~16–40× cheaper per byte** than calldata at equal gas price (forward-compat-da §2.1).
- **2026 wrinkle — EIP-7918 blob reserve price (Fusaka):** blob base fee is now floored relative to execution base fee, so blob data is **"cheap," not "free."** Still the cheapest bytes-transport on Ethereum. *[Budget with a live blob-fee oracle, not a constant.]*
- **The lifetime:** sidecars pruned at **4096 epochs ≈ 18 days**. This one constant is the whole permanence problem — confronted head-on in §8.

### 4.2 The scaling roadmap B rides (throughput scales, retention does not)

Published, verified ramp (forward-compat-da §2.2): pre-Pectra 3/6 → Pectra 6/9 → **BPO1 (Dec 2025) 10/15** → **BPO2 (Jan 2026) 14/21** → core-dev target **48/block by mid-2026** → **128/block under full danksharding**. Throughput I can compute (128 KiB/blob, 12 s slots): today ~21 blobs ⇒ **~19 GB/day**; mid-2026 ~48 ⇒ **~44 GB/day**; danksharding 128 ⇒ **~118 GB/day**. **This is the rate EFS pushes file bytes through the blob pipe, and it ~6×'s over the roadmap with ZERO EFS change** — because the manifest commits chunk *hashes*, not a transport. PeerDAS (EIP-7594, shipped Fusaka Dec 2025) makes blob availability cheaper/safer via data-availability sampling. **None of this touches the 18-day retention** — scaling is a transport gift and a permanence non-event (§8).

### 4.3 Why not external DA (Celestia/EigenDA/Avail)?

Rejected as anchor and as default transport (forward-compat-da §2.3): same availability-not-permanence category as blobs but **strictly worse for EFS** — off-Ethereum (not in the state EFS's R2/R1 readers verify against) and **adds a trust assumption** the mission refuses (Celestia = another chain's consensus + a bridge; EigenDA = a restaked DA-committee). Ethereum blobs inherit Ethereum's own DA with no added trust. External DA survives **only** as an opt-in `mirrors` edge for writers who explicitly accept that trust for that file.

---

## 5. The promotion mechanism — "upload cheap now, pin permanent later" (the core deliverable)

### 5.1 Lifecycle of a large file uploaded via B

```
t=0        SIGN ONCE. Author signs the manifest envelope (1 eth_signTypedData_v4).
           chunksRoot + contentHash + size land in STATE → PERMANENT, PORTABLE COMMITMENT.
           A relayer posts the file bytes as blobs (T-BLOB, cheapest DA), msg.sender ignored.
           Optionally attestBlobPublication() records a proof-of-publication receipt (§3.3).
           STATE: commitment permanent. BYTES: available ~18 days, keccak-verifiable vs chunksRoot.
           READ GRADE: LIVE @ EPHEMERAL-BYTES(expires ≈ epoch+4096).

t∈(0,18d]  PROMOTION — permissionless, trust-minimized, NO re-signature:
           any promoter (author's SDK worker by default / paid pinning service / self-interested
           reader / LOCKSS volunteer) fetches blob bytes, keccak-verifies EACH chunk against the
           AUTHOR'S signed chunksRoot, and re-submits to a durable tier:
             → T-SSTORE2  : submitChunk() → bytes into STATE, contract-readable (extcodecopy)
             → T-MIRROR   : mirrors edge → ar:// (Arweave endowment) / web3://EthStorage (proof-of-storage)
           Because promotion verifies vs the signed root, the promoter CANNOT corrupt the file:
           a wrong byte fails the Merkle check and reverts. Promotion never needs the author.

t>18d      Blob pruned. File served from the promoted tier(s).
           If promoted:     READ GRADE: LIVE, permanent. SOLID.
           If NOT promoted: commitment survives (permanent, verifiable); bytes gone →
                            READ GRADE: BYTES-UNAVAILABLE ("authentic pointer, bytes absent here";
                            a GATE read requiring bytes fails closed). Honest graded state.
                            NEVER a broken file, NEVER a false "absent".
```

### 5.2 Why this is the right shape

- **Trust-minimization is the unlock.** The author signs the *content* (`chunksRoot`), not a location. Any stranger can move the bytes between tiers and every reader re-verifies against the author's signature — so promotion, mirroring, and cross-chain replication are all **permissionless and safe**. This is **LOCKSS with cryptographic integrity: copying only ever adds truth** (the exact property the whole carrier decision is priced on — composability research §5, §0.15 "replication > proofs"). It is Filecoin's/BitTorrent's "verify each chunk vs the root by anyone" (prior-art §3.4, §3.6) and EthStorage's promote-blobs-to-permanent pattern *productized* (prior-art §3.7; forward-compat-da §7).
- **Forward-compatibility is banked at the commitment.** The file's permanent identity is fixed at t=0 at *permanent + portable + cheap*. As on-chain storage gets cheaper (bigger blocks, EIP-7907 code raise, L2 DA collapse, future state-cost cuts), the *bytes* can be promoted up the ladder **later, by anyone, with no re-signature**. A file uploaded blob-cheap in 2026 can be promoted into L1 state in 2030 when it's affordable — same `chunksRoot`, same signature. **This is exactly "scalability will improve and I want on-chain files SOLID": bank the commitment now, migrate the bytes up as the floor drops.**
- **The 18-day window is a promotion SLA, not a permanence claim.** EFS's honest guarantee: *commitment permanent immediately; bytes permanent iff promoted within the window or mirrored*. 18 days is generous for an automated promoter, and the read layer never lies about which state a file is in.

### 5.3 Who promotes (SDK/economics boundary — noted, not over-designed)

- **Default = the author's own SDK client** runs promotion as a background job immediately after the cheap blob upload (best UX: instant cheap upload, permanence lands minutes later). The 18-day window is pure slack.
- **Mirror-at-upload** (place an `ar://` edge in the *same signed envelope*) sidesteps the window entirely for cold archives — Arweave is ~$20–50/10 GB vs ~$490k L1 calldata (substrate-decision §6.2). This is the recommended default for large media where contract-readability isn't needed.
- **Alternatives:** paid pinning service; self-interested reader; **bounty/escrow** ("promote-and-prove `chunksRoot` within 18 d, claim reward") if James later wants stronger-than-best-effort — the proof-of-publication receipt (§3.3) is the accountability hook. All permissionless; none change the kernel. **This hands off cleanly to the SDK/economics lens (per the EFS-SDK-boundary doctrine).**

### 5.4 Mirror-liveness audit (trustless, free, borrowed from Filecoin PDP)

Because the signed `chunksRoot` is public and `verifyChunk` is a pure view, **any verifier can audit any mirror with zero new machinery**: demand a random `chunk[i]` from the mirror, check its proof against `chunksRoot`. This is Filecoin PDP's "challenge 5 random leaves, size-independent, cheap keccak" as a *read-lens confidence signal* for mirror-tier files (prior-art §3.6, §4.8) — **an audit over mirrors, never a permanence mechanism** (Filecoin's deal/SP/slashing economics are a hard AVOID). It lets a lens grade a mirror-backed file's byte-availability as *actively-verified* rather than *asserted*.

---

## 6. Chunk submission, parallelization & resume (the operational flow)

**The submission and authorization axes are orthogonal** (auth-models §0): the one signature is fixed; who broadcasts the N transactions is the entire design space, and every rail is a UX choice over the same signed manifest.

```
CLIENT (local, no wallet, no gas):
  1. chunk file with FROZEN params → chunk hashes → chunksRoot (count-at-apex)   (§2.2)
  2. build the small record set {DATA, chunks-manifest, placement}; Merkle → recordsRoot
  3. seq = TID (µs clock + device bits; non-unique, no coordination)

USER (exactly one interaction):
  4. eth_signTypedData_v4 over Envelope{author, seq, prev, recordsRoot, count}   ← THE ONLY PROMPT

SUBMITTER (relayer / burner / session-key agent / user's own EOA — anyone; msg.sender ignored):
  5. COMMIT: submit the envelope (register the manifest). O(1) gas, independent of N.
     Commitment now permanent + portable in state.
  6. TRANSPORT: post file bytes as blobs — pack k frozen-chunks per 124 KiB blob;
     fire type-3 txs IN PARALLEL (blob addresses/versioned-hashes are pre-computable, no ordering).
     Optionally attestBlobPublication() per tx for receipts/events.
  7. PROMOTE (within 18 d, permissionless, no re-sign): fetch blob bytes → keccak-verify each
     chunk vs chunksRoot → submitChunk()/submitChunks() to SSTORE2 (parallel, idempotent,
     out-of-order) AND/OR place a mirrors edge. Emit ChunkStored / FileComplete.
```

**Properties that fall out of the substrate (each cited, not asserted):**

- **Resume is free, zero new signatures — at BOTH layers.**
  - *Blob layer:* the `BlobPublished` events (or the SDK's local map) tell any party which chunk-ranges were posted; repost the missing ranges (idempotent — re-posting a blob is harmless).
  - *Promotion layer:* Architecture A's bitmap **is** the resumable session — a crashed/partial promotion resumes by submitting only the un-set bits (`missingChunks(storeId, cursor, PAGE)`); re-submitting an admitted chunk is a one-SLOAD no-op. **No upload session, nonce, or lock to lose, and it is global** (a different party finishes an abandoned promotion). The original signature still covers every chunk.
- **Parallel is free, coordination-free.** Blob versioned-hashes and CREATE2 chunk-store addresses are content-derived, not nonce/mined-order-derived, so both blob posts and SSTORE2 deploys fan out across M submitter accounts with zero cross-tx dependency; throughput scales ~M-fold by adding submitters (auth-models §1; sharding across M burners dodges the per-account mempool limit, ~16 executable/~64 queued on geth defaults — `[UNMEASURED]`).
- **Ordering is free.** Chunk admission depends only on `chunksRoot` (self-contained), not on any kernel record state, so there is nothing to be "out of order" with. The manifest need only exist for a *file* to resolve; a chunk submitted before its manifest just fills the permissionless content pool (native-manifest §3.3, §10).
- **A hostile/racing submitter can only help.** Idempotent no-op on re-submit ⇒ front-running a promotion means someone else paid your gas and stored exactly the right (content-addressed) bytes. The worst omission attack (drop chunks / never promote) yields a *graded partial/unavailable* read (§7), never a forged file and never a false "absent."

---

## 7. Progressive read behavior for incomplete files (never broken, never a false absent)

Two orthogonal resolution layers (as in A, extended with B's ephemerality flag):

1. **Identity/metadata** — resolved by the normal lens walk over the placement + `chunks` manifest slots. If the manifest PIN is present and unrevoked, the file's identity, `contentHash`, `size`, `chunksRoot` are **LIVE** (subject to currency qualifiers). **Independent of byte availability** — a file is a real, readable object the instant the manifest lands.
2. **Byte availability** — graded from *whichever tiers currently hold the bytes*, orthogonal to the disposition:

| grade / flag | condition | GATE read | INTERACTIVE read |
|---|---|---|---|
| **BYTES-COMPLETE** | any durable tier has all `n` chunks (`fileStatus.complete`, or a mirror audited whole) | consumable | serve/render normally |
| **LIVE @ EPHEMERAL-BYTES(exp)** *(new)* | bytes present **only** in a blob window; not yet promoted | **fail closed for permanence-class GATE** (bytes will vanish); MAY serve for immediate render | serve, but render "will vanish unless promoted (~epoch+4096)"; UI can trigger promotion |
| **BYTES-PARTIAL(k, n)** *(new, chunk-granular)* | `0 ≤ k < n` present in a durable tier; present set exact from bitmap | fail closed if it needs the whole file; MAY consume any present, proven chunk for range logic | render progress k/n; serve present byte-ranges (HTTP 206); stream-as-available; the missing set is exact |
| **BYTES-UNAVAILABLE** | committed, but no tier currently holds the bytes (blob pruned + not promoted) | **fail closed** | "bytes absent here" placeholder; identity/metadata still shown; anyone can still re-supply the bytes and re-prove them |

- **EPHEMERAL-BYTES** is a new **currency flag** proposed as a Durable addition to `read-lens-spec` §2.3/§2.4 (forward-compat-da §4.1): it decorates the *bytes* dimension the way `AS-OF(N)`/`UNKNOWN-CURRENCY` decorate the *revocation* dimension. A blob-only file renders at a currency ceiling *below* plain-LIVE so a reader/UX knows "this evaporates unless promoted." **This is the mechanism that refuses the blob-permanence trap at read time** (§8).
- **BYTES-PARTIAL(k,n)** and **BYTES-UNAVAILABLE** are refinements of the existing `BYTES-UNAVAILABLE` flag (`read-lens-spec` §2.4) — same family ("authenticated pointer, bytes status X here"), made precise at chunk granularity. This is BitTorrent's partial-as-graded-state (prior-art §3.4) made mechanical.
- **Never "broken," never a false "absent."** Byte-absence is a flag on a **PRESENT** file, categorically distinct from the file's slot being empty (`PROVEN-ABSENT`). The anti-fallthrough discipline (`read-lens` §2.1) is untouched: a partial/ephemeral/unavailable file is `PRESENT` with a byte-flag, so a lens walk never falls through it to a lower-trust author.
- **Never truncation-as-complete.** `complete` requires `receivedCount == n` with a **bound** `n`; a GATE consumer checks `isComplete` or reads chunk-by-chunk. On full reassembly a reader re-decodes per `encodingTag` and verifies `contentHash` end-to-end; a mismatch grades **CONTENT-MISMATCH** — harming only the author's own file, detectable, never silently served.

**Serving.** The web3:// router grows one classification: a complete file (any durable tier) serves 200 with reassembled bytes; an EPHEMERAL/PARTIAL file serves **206** with the available prefix (or a progress document), **never** a truncated 200; a BYTES-UNAVAILABLE file serves a graded placeholder. A `mirrors` edge MAY carry `web3://<router>/~store:<chunksRoot>` so generic web3:// clients resolve the native store with no EFS-specific code.

---

## 8. Confronting the blob-pruning permanence trap head-on (the brief's demand)

**Blobs — and every DA layer — are AVAILABILITY, not STORAGE. If EFS ever tells a user "your file is permanent because it's in a blob," EFS is lying, and the lie has an 18-day fuse.** The failure is silent and total: the tx succeeds, the file reads fine for 18 days, demos pass, then — with no error, no event, no on-chain trace — the bytes are gone forever while the pretty on-chain record still points at them. **This is the single most dangerous footgun in the whole large-file design, precisely because it works in the demo.**

**PeerDAS and full danksharding do NOT fix this — they make it worse-shaped.** They scale blob *throughput* ~6× and drive per-byte cost down, making blobs an even more tempting place to "store" files, while retention stays pinned at 18 days. **The better the transport gets, the louder the trap.** External DA is the same trap wearing a different logo, plus a trust assumption.

**B refuses the trap by construction, in four moves:**
1. **Never conflate the axes.** The permanent thing is the *commitment in state* (always, one signature). Blobs carry *bytes*, which are — in the type system (§2.3, no signed tier) and the read grades (§7, EPHEMERAL-BYTES) — explicitly a separate and expiring thing.
2. **Make promotion the named, first-class bridge** — permissionless, trust-minimized, no re-signature (§5) — so "get the bytes to permanence" is a well-defined action any party can take within a generous window, not an afterthought.
3. **Make the read layer tell the truth.** A committed-but-unpromoted-and-pruned file reads **BYTES-UNAVAILABLE**; a blob-window file reads **EPHEMERAL-BYTES**; a GATE read fails closed. The system never serves a false "present" or "absent" (§7).
4. **Bank permanence at the cheapest permanent tier available at upload, in parallel.** The recommended default is *not* "blob and hope" — it is "blob for instant cheap UX **and** immediately kick off promotion to SSTORE2/Arweave," so the permanent copy lands minutes later and the 18-day window is pure slack. Blob-only-no-promotion is a *conscious, graded, best-effort* choice (fine for scratch/ephemeral data), never the silent default.

**The honest one-sentence guarantee EFS can stand behind for 100 years:** *"Your file's identity and integrity are permanent and portable the instant you sign; its bytes are as durable as the most durable tier you (or anyone) placed them in, and the system will always tell you truthfully which tiers still hold."*

---

## 9. MetaMask prompt count per submission rail (the headline UX deliverable)

The author's key is needed for **exactly one thing**: the `eth_signTypedData_v4` over the manifest envelope. Everything after — commit, blob transport, every promotion, cross-chain replication — needs **no signature and no author key** (envelope = signature-authenticated; chunks = proof-authenticated; `msg.sender` ignored throughout). Blob-posting, however, requires a **blob-capable submitter** (a node/wallet that builds type-3 txs), which is naturally an infra/relayer job — so B leans on the relayer/burner rail even more than A does.

| rail | author key prompts | author tx confirmations | notes |
|---|---|---|---|
| **Relayer / burner (recommended default)** | **1** (`eth_signTypedData_v4`) | **0** | Author signs once; hands `{signed envelope + file bytes}` to a relayer/app-burner, which commits, posts blobs (type-3), and promotes — paying all gas, needing a blob-capable node. **Zero txs, zero gas, no blob-wallet requirement on the author.** The cypherpunk floor is preserved (the author *can* self-submit) but never required. The **faucet-dripped burner** is the hackathon gasless path; the burner's blast radius is *gas only* (it can't author). |
| **Self-pay, EIP-5792 batch wallet** | **1** (sign typed data) | **~1** (`wallet_sendCalls` batching commit + promotion `submitChunks`) | Modern wallet batches the *execution-gas* sends into one confirmation. **The blob-carrying type-3 tx is a separate wrinkle** — blob-tx UX in stock wallets is emerging/`[verify at ship time]`; in practice the SDK/relayer posts blobs even on a self-pay commitment. Effectively 2 clicks + delegated blob posting. |
| **Session key on EIP-7702 EOA (as AA matures)** | **1 grant** (`wallet_grantPermissions`, kernel-submit-only, value=0, gas-capped, minutes-boxed) **+ 1 sign** | **0 / chunk** | A local agent completes commit + promotion unattended on the user's own address; blast radius = gas budget only. Blob posting still delegated to a blob-capable submitter. |
| **Self-submit floor (always available)** | **1** (sign typed data) | **1 (commit) + type-3 blob txs + ⌈N/B⌉ promotion txs** | The censorship floor: the user's own EOA does everything. Honest wrinkle: **self-posting blobs needs a blob-capable wallet/node** (a real UX gap in 2026 stock wallets — `[verify]`); a user without one can still self-submit the *commitment* + self-promote via SSTORE2/calldata directly (skipping the blob rail), which is the A path. Still **one signature** — the extra clicks are gas confirmations, not authorizations. |

**Headline: one signature authorizes the entire multi-block, multi-tier, multi-decade lifecycle** — commit, blob transport, every promotion, and cross-chain replication. In the default relayer/burner rail that one signature is the author's only interaction: zero transactions, zero gas, and no requirement that the author's wallet even understand blobs.

---

## 10. Permanence, portability & forward-compatibility (the mission ends)

### 10.1 Permanence posture — what survives 100 years

- **The commitment** (`chunksRoot` + `contentHash` + `size` + author sig): in **state** (manifest claim body, spine-enumerable, `getClaim`), permanent, portable, one signature. **Survives EIP-4444** (state, not history). From-state-alone reconstruction holds: spine → manifest body → `chunksRoot` → `storeId` (per promoted tier) → `extcodecopy`/mirror-fetch → reassemble → verify `contentHash`. Frozen ERC-7201 layout makes every slot `eth_getProof`-derivable; no event dependence on the permanent read path.
- **The bytes**: as durable as the **most durable tier they were promoted to** —
  - **T-SSTORE2** → state (permanent as long as state persists; The Purge is the only future threat, hedged by replication + resurrection witnesses — a watch item, not a 2026 reality).
  - **T-MIRROR `ar://`** → Arweave pay-once endowment (genuinely permanence-shaped; external trust bet).
  - **T-MIRROR `web3://`EthStorage** → proof-of-storage L2 (younger; a mirror bet, not the anchor).
  - **T-BLOB only** → 18 days then gone (**NOT permanence**; ephemeral tier, graded EPHEMERAL-BYTES).
- **What must NOT be baked in** (each expires under the roadmap — forward-compat-da §9): a hard 24576 code-size chunk constant (read at runtime); any assumption blob bytes persist; **KZG/point-eval in the permanent read/replication path** (trusted setup + precompile + non-portable — the `chunksRoot` keccak proof is ~12× cheaper to verify and dependency-light); external-DA/any single mirror as the anchor; encoding file bytes as kernel record-leaves (O(filesize) spine bloat — B uses the two-level Merkle, §2.2).

### 10.2 Portability — strictly more than raw SSTORE2, reaching the *bytes*

To copy a file to a new chain:
1. Replicate the **one envelope** (manifest + DATA + placement). It re-verifies from the author's signature on the new chain — chain-free by construction. One record, tiny.
2. Seed the bytes on the new chain: `submitChunk` against the **identical `chunksRoot`** (SSTORE2), or point a `mirrors` edge (a durable mirror travels by URI). They re-prove against the same root — **no re-signing, no trust in the copier.** A copier who flips a byte produces a failing proof; a lazy copier yields an honest PARTIAL. **Dedup travels:** if the new chain already holds those bytes (any other file), the copied manifest resolves instantly complete.

**Blob-specific portability note:** blob *bytes* are per-DA and ephemeral, so **cross-chain seeding after the window is from a durable tier, not from blobs** (within the window, a promoter can bridge: fetch from chain X's blob p2p, submit to chain Y). This is expected and correct — replication of bytes follows the same LOCKSS logic as A, and the `chunksRoot` makes any copy trustlessly verifiable. Contrast raw v1 SSTORE2-via-mirror: the store must be re-deployed *and* the store↔file binding is an **unsigned attester mirror-claim** a reader must trust. Here the binding is **inside the author's signature** and content-addressed — the LOCKSS property reaching the bytes.

### 10.3 Forward-compat — how future scaling helps automatically (B's thesis, mechanically)

The authoring UX is **frozen against future scaling** because the one signature commits chunk *hashes*, not a venue. Future capacity plugs in **under the unchanged manifest**:

- **Blob-count ramp 21→48→128/block + PeerDAS** → T-BLOB upload throughput ~6×'s and per-byte cost falls. The *same SDK code* posts more blobs/block at lower cost; **no format change, no re-sign, no Etched change.** A file uploaded in 2026 and one in 2030 use the identical manifest; only transport throughput/price moved. **This is "uploads get cheaper automatically."**
- **EIP-7907 (Fusaka) code-size 24→64 KB, metered** → an SSTORE2 promotion chunk holds ~2.6× more → **~2.6× fewer deploys per file** → cheaper permanence, shorter promotion campaigns. Banked this fork, captured for free (read the limit at runtime).
- **L2 DA-cost collapse** → on-chain large-file permanence on L2s becomes affordable *first*; portability means the commitment lives everywhere; promote on the cheapest chain.
- **Future on-chain-storage cost cuts** → **deferred promotion into state becomes cheap, and already-committed files migrate up the permanence ladder with no re-signature.** Bank the commitment now; ride the bytes down the cost curve.
- **Watch items (track, don't architect around):** state expiry / The Purge; EIP-7918 blob reserve-price dynamics (keep the cost model live via an oracle); L1SLOAD/RIP-7728-class precompiles (could let L2s read an L1 commitment near-natively — softens replication for the L2 tier, 2027+ maybe).

---

## 11. Gas / cost sketch (concrete but UNMEASURED — flagged; CI snapshot + blob oracle supersede)

Order-of-magnitude; L1 pricing; per phase:

| phase | dominant cost | ~cost | notes |
|---|---|---|---|
| **Commit envelope** (one-time) | small write (DATA + manifest + placement) + spine | **~0.3–0.5M gas** | one signature; the whole permanent commitment |
| **Blob transport** (per 124 KiB usable) | ~1 blob-gas/byte in the *separate* blob-fee market (EIP-7918-floored) | **~16–40× cheaper/byte than calldata** | 1 MB ≈ 9 blobs ≈ 1–2 type-3 txs; cheapest DA; auto-cheapens on the ramp |
| **Promote → T-SSTORE2** (per 24 KB chunk) | code deposit 200×24576 ≈ 4.92M + calldata floor ≈ 0.98M + bitmap/verify ≈ 40–60k | **~6.0M gas/chunk; ~258M/MB** | A's tier-0 numbers; expensive but **deferrable to when/where it's cheap** (L2, post-EIP-7907), spread across many blocks |
| **Promote → T-MIRROR `ar://`** | external | **~$20–50/10 GB** | best default for large cold archives *today* |

**Reading:** B's whole point is that **upload is blob-cheap now** (the ~258M-gas/MB SSTORE2 number is a *promotion* cost, paid later, on the cheapest permanent tier available then — plausibly an L2 where it falls 1–2 orders, or Arweave at $-cheap). On **L2/L3** the blob transport and any execution-gas promotion fall further. **All figures UNMEASURED** — the freeze-blocking CI gas snapshot + a live blob-fee oracle supersede them; do not cite in an ADR until measured on a real L2.

---

## 12. Trying to break my own proposal (adversarial pass)

| attack / failure | outcome | why it fails / how bounded |
|---|---|---|
| **Blob prunes before promotion** (the headline risk) | bytes gone; commitment survives → **BYTES-UNAVAILABLE** | **The #1 residual.** Not corruption — an honest graded state, GATE fails closed. Mitigated (not eliminated): SDK auto-promote default; mirror-at-upload sidesteps the window; bounty/escrow for stronger-than-best-effort. Blob-only is a conscious ephemeral choice, never the silent default. |
| Relayer lies — never posts blobs / posts garbage | promoter can't fetch valid bytes → non-promotion → BYTES-UNAVAILABLE | Liveness/availability failure, **never corruption**: promotion's keccak check vs the signed `chunksRoot` is the integrity gate; wrong bytes fail the proof. Receipt (§3.3) exposes "did a blob get included," aiding accountability. |
| KZG receipt ≠ keccak `chunksRoot` (equivalence gap) | receipt is worthless for that file; integrity still fully defined by the keccak root | Two independent commitments; EVM can't cheaply prove agreement. **The receipt is advisory only, off the permanence path**; keccak at promotion is authoritative. Stated loudly (§3.3). |
| Forge a chunk (wrong bytes, valid-looking proof) | revert `BadChunkProof` at promotion | keccak second-preimage on `chunksRoot`; domain-separated leaf/node. |
| Grief a store with a wrong `chunkCount` | impossible to bind wrong `n` | `n` committed at the apex; only the true `n` reproduces `chunksRoot`. |
| Front-run a promotion (correct bytes) | helps the author (content-addressed donation) | stores exactly the right bytes at the author's `storeId`; pure gas gift. |
| Lazy/partial promoter | honest **BYTES-PARTIAL(k/n)**; anyone finishes it | bitmap is the global resumable session; same signature covers the rest. |
| Danksharding makes blobs cheaper → "just leave it in blobs" | refused by construction | EPHEMERAL-BYTES grade + auto-promote default + honest read layer (§8). The better the transport, the louder the trap — answered at design time. |
| Busy blob market (EIP-7918 reserve price) | upload "cheap," not "free"; cost model must stay live | Doesn't touch permanence (that's the promoted tier's property); needs a blob-fee oracle, flagged. |
| Cross-chain: blob on X, promote on Y after 18 d | seed Y from a durable tier, not from blobs | Expected; within-window bridging works; content-addressed so any copy is trustlessly verifiable. |
| Author wants contract-readable bytes *now* (R1) | blobs are the wrong rail (EVM can't read blob bytes) | **Route to the A path (direct-to-SSTORE2) instead.** B is for R2/cheap-now-promote-later; B and A are complementary, SDK routes by use case (§13). |
| Truncation-replay one level down | detectable vs the signed `chunkCount`/`chunksRoot`; graded partial | Same posture as the envelope's known truncation finding — bounded and detectable, defended at the read layer, not "closed." |
| Reorg of the blob tx | blob may be unavailable; repost | Idempotent; the commitment envelope is separate and already mined. |
| Author never supplies bytes at all | honest **BYTES-UNAVAILABLE** at a PRESENT file | No third-party impact; truthful grade, never "broken"/"absent." |

**Residual honest weaknesses (not fatal, flagged):**
1. **B does not make bytes-in-state cheap.** 10 GB genuinely in L1 state ≈ $490k today; nobody's design fixes that this year. B's strongest *true* claim is "permanent+portable commitment for one signature, blob-cheap upload, trust-minimized promotion to whatever permanent tier is affordable, and a read layer that never lies" — it degrades honestly, and rides the cost curve. It is **not** "cheap contract-readable on-chain bytes now" — that is the A path's premium.
2. **Best-effort promotion.** A lazy author's blob-only file dies at 18 days. Surfaced, not hidden; mitigations in §5.3; the floor case is a *graded* byte-loss with a surviving commitment, never corruption.
3. **Blob-posting UX in 2026 stock wallets** is a real self-submit-floor wrinkle (needs a blob-capable node) — flagged `[verify at ship time]`; the fallback is self-committing + self-promoting via the A path (skip blobs).
4. **The optional receipt entrypoint** is the only candidate new Etched storage; kept off the permanence path and droppable precisely so a wrong row isn't a permanent mistake.

---

## 13. B vs A — scoping, and the clean synthesis

- **Architecture A (native-manifest-chunk-submission):** *write bytes straight into state under one signature.* Permanent + contract-readable **immediately**; more expensive; the right default for **R1** (contracts reading the file — `tokenURI` composition, derivative contracts) and for anything wanting bytes-in-state now. SSTORE2 tier 0 default.
- **Architecture B (this doc):** *stage bytes in the cheapest DA under that same one signature, then promote to a permanent tier when/where it's cheap.* **Blob-cheap upload**, permanence lands on promotion, forward-compat is the primary driver; the right default for **R2** (large media served to humans — the composability research's finding that contracts almost never read *content bytes*, humans do via `eth_call`/`web3://`) and for "cheap now, permanent later."
- **They compose. A's SSTORE2 store is one of B's promotion targets.** The clean synthesis: **one frozen `chunks` manifest row + one `chunksRoot` machinery + one `submitChunk` accumulator, with two write strategies over them** — direct-to-state (A) and stage-then-promote (B) — selected by the SDK per use case (contract-readable? → A/SSTORE2; large media + cheapest upload? → B/blob→promote; cold archive? → B/mirror-at-upload). The manifest's `storageTier` field (A) with a `0xFF = DA-staged/unspecified` value (B) is the single seam that unifies them.

---

## 14. Frozen-surface summary (what B asks to Etch) & open questions

**Etched — reused from A / substrate (B adds nothing here):** `chunksRoot` keccak-Merkle constants (count-at-apex); the `chunks` reserved-key manifest row (B uses `storageTier = 0xFF` per §2.3); `submitChunk`/`submitChunks` + the chunk accumulator; `verifyChunk`; `mirrors` edges.

**Etched — new in B (minimal, optional):**
- *(Optional, droppable)* `attestBlobPublication(chunksRoot, firstIndex, blobCount)` → `BlobPublished` event by default; opt-in `blobReceipts[chunksRoot]` SSTORE. **OFF the permanence path.** Recommendation: ship the event, keep the SSTORE opt-in, be ready to drop entirely.
- **Tier-3 (T-BLOB) semantics named and shipped** as an *ephemeral transport/staging tier* (A reserved the byte; B defines it: bytes-in-blob, 18-day, promotion-required, never a permanence tier).

**Durable — read layer (B's real read-side contribution) `[→ read-lens-spec §2.3/§2.4]`:** the **EPHEMERAL-BYTES** currency flag; **BYTES-PARTIAL(k,n)** and **BYTES-UNAVAILABLE** chunk-granular refinements; a `promotionStatus(chunksRoot) → (tiers-holding, k/n per tier)` view; router 206-for-ephemeral/partial serving; the mirror-liveness audit as a confidence signal.

**SDK / economics (not Etched):** the blob-poster; the **auto-promote-by-default** job; the mirror-at-upload default for cold archives; the optional bounty/escrow (hooked to the receipt); the A-vs-B routing policy.

**Open questions (for James / synthesis / freeze):**
1. **A/B manifest reconciliation:** adopt the single frozen `chunks` row with `storageTier = 0xFF = DA-staged`? (Recommended — unifies A and B on one Etched surface.)
2. **Proof-of-publication receipt:** event-only (recommended default), opt-in SSTORE, or drop `attestBlobPublication` entirely? (It's the only new Etched candidate; off the permanence path.)
3. **Read-layer additions** (EPHEMERAL-BYTES, chunk-granular BYTES-PARTIAL/UNAVAILABLE) — ratify or reject the closed-vocabulary expansion (read-lens owner call).
4. **Default permanence bar:** is best-effort promotion (SDK auto-promote + mirror-at-upload safety nets) an acceptable *default* for v2, or does the mission want a hardened promote-or-bounty path in-scope now? *Recommendation:* ship best-effort + auto-promote as the floor (honest, read-grade-covered); reserve the bounty mechanism as a named, additive Phase-N add — do not block v2 on it.
5. **Freeze-blocking measurements:** the gas snapshot (commit / blob / SSTORE2-promotion, on a real L2) **and** a live blob-fee model under EIP-7918 supersede every number here before any ADR cites them.
