# Architecture C — THIN KERNEL + AUTHORIZATION LAYER

**Role output.** The UX-first, minimum-Etched-surface design for large on-chain file uploads. Keep the kernel a **dumb, permanent notary**; push every hard part of large-file handling (chunk verification, accumulation, pagination, progressive reads, storage tiers, blob ingest, promotion) into the **Durable / view / SDK layer where it can be fixed and improved for 100 years**. Solve "one prompt / few prompts" entirely at the **wallet/authorization layer**. Preserve portability + the self-submit floor.

**Status:** draft (spec-grade). **Surface tiers it touches:** Etched — **zero new kernel machinery required** (one *optional* reserved-key row offered as a dial). Durable — a frozen chunk-Merkle construction, a content-addressed store contract, a chunk-granular read grade. Ephemeral/SDK — the uploader/reassembler. **Designs within:** `codex-envelope` (the one signed Merkle root, `submit`/`submitSubset`, author-from-signature, `msg.sender` ignored), `codex-kinds` (5 kinds, existing reserved keys `contentHash`/`size`/`mirrors`/`contentType`, permissionless key-TAGDEF extension), `codex-kernel` (spine, ERC-7201, "everything paged/enumerating evicted to redeployable views — EIP-170 as forcing function"), `read-lens-spec` (BYTES-UNAVAILABLE flag, anti-fallthrough), v1 `contracts/specs` (SSTORE2, `EFSBytesStore`, EIP-7617 pagination, web3:// serving, ADR-0057/0058). **All gas/latency numbers are concrete estimates, explicitly UNMEASURED — flagged inline; a CI gas snapshot replaces them before any ADR cites them.**

---

## 0. The one-paragraph idea (and the thesis)

The envelope kernel is **already** a complete "one signature authorizes N submissions" machine: the author signs one `recordsRoot`; `submit`/`submitSubset` admit any subset of leaves with single-leaf proofs, `msg.sender` ignored, idempotent, resumable, parallel. **A large file needs no new kernel machinery on top of this.** It needs exactly two things, and *both live outside the Etched kernel*: (1) a content commitment the author **already signs** — the existing `contentHash`/`chunks` reserved key, whose 32-byte value is a **chunk Merkle root** under a frozen construction; and (2) **permissionless, content-addressed byte storage** (SSTORE2 chunks via CREATE2) that lives entirely **off-kernel** in redeployable stores, verified against that signed root at read time. Chunks are not authored records and not kernel calls — they are plain content-addressed deploys anyone can make, provable against the one signed root. So "one signature covers the whole multi-block upload" is *more* cleanly true here than in any fatter design: the N byte-transactions aren't kernel submissions at all, they carry no author, and they need no authorization because they are content-addressed and read-verified.

**Thesis (the reason to prefer thin over fat):** *bytes-handling technology will change many times over 100 years* (SSTORE2 → EIP-7907's 64 KB code limit → blobs → danksharding/PeerDAS → whatever comes next). A design that **freezes today's chunk mechanism into the one contract that can never change** (a fat kernel with `submitChunk`, a bitmap accumulator, a tier byte) bets that today's byte-plumbing survives a century. Architecture C freezes only the **commitment** — "the author signed a content root; the bytes are stored somewhere that re-derives that root" — and keeps the byte-plumbing **liquid** in the Durable/view layer. That is the mission's own discipline — *minimum irreversible assumptions* — applied to file bytes. **SOLID = the commitment is permanent and frozen; the transport rides the scaling curve precisely because it is not frozen.**

---

## 1. Design stance — what "thin kernel" means here

The task frames chunks two ways: *"ordinary signed-leaf records **or** plain SSTORE2 deploys."* Both are used, at opposite ends of a size spectrum, and **neither adds a kernel entrypoint**:

| Flavor | Bytes live as | Kernel path | Spine cost | Portability | Use for |
|---|---|---|---|---|---|
| **C-inline** ("chunks as records") | record body bytes inside the **signed envelope** (a DATA body, or a `data:` mirror) | existing `submit` — one small batch | O(1) records | maximal — bytes travel *in* the signed envelope | tiny files (≤ a few KB) |
| **C-store** ("plain SSTORE2 deploys") | SSTORE2 contract code in **off-kernel** content-addressed stores | **none for the bytes**; existing `submit` for the ~5-record manifest only | O(1) records/file (bytes never enter the spine) | portable via CREATE2 re-deploy + signed root | everything larger — **the main path** |

**Why not "chunks as envelope leaves" for large files.** The envelope's Merkle tree is over *records*, and every leaf becomes a claim in the append-only enumeration **spine** (`allClaims`, ~22–27k gas/record + body-in-state) — the structure that backs the from-state-reconstruction pledge, meant to enumerate **objects/files, not bytes**. Encoding a 1 GB file as ~43k chunk-leaves would put 43k chunk claims per file in the spine (~1.1B gas of spine overhead alone `[UNMEASURED]`, before byte storage) and swamp every reconstruction walk. So C-inline is capped to tiny files; the large-file story is **C-store**, where bytes are content-addressed deploys that never touch the spine. (This is the same "two Merkle trees, keep file bytes out of the kernel spine" conclusion the prior-art autopsy and the forward-compat lens reached — Architecture C's contribution is that the *second tree's verifier and storage also stay off the Etched kernel*.)

The rest of this document specs **C-store** (with C-inline as the trivial small-file degenerate case).

---

## 2. The signed manifest / commitment format

A file's identity, placement, content commitment, size, and transports are **~5 ordinary records** in **one envelope**, using **only existing reserved keys**. The author signs the envelope root once; everything below is transitively committed by that one signature.

```
ENVELOPE (one eth_signTypedData_v4 over recordsRoot; chain-free domain ("EFS","1")):
  1. DATA            dataId = keccak(DOMAIN_DATA, author, salt)         — owned file identity (existing kind)
  2. placement PIN   into the path node (parent tagId)                 — existing PIN edge
  3. chunks   VAL    key `chunks` on DATA → the file-content commitment — see §2.1 (existing OR one new row; §3)
  4. size     VAL    key `size`   on DATA → decoded byte length         — existing reserved key
  5. mirrors  PIN    key `mirrors` on DATA → web3://<store> (+ ar://…)  — existing reserved key, dual-role
  (opt) contentType / contentEncoding VAL                              — existing / blessed key-TAGDEF
```

Every id is client-computable offline before any tx (`deterministic-ids`); no mined-tx dependency; deploys and manifest submission parallelize.

### 2.1 The content commitment (the only genuinely new *value*, not new *surface*)

```solidity
// VAL body of the `chunks` key on the DATA. Canonical abi.encode; any trailing byte rejects.
struct FileChunks {
    bytes32 chunksRoot;   // apex-with-count Merkle root over the file's chunks (§2.2) — THE content identity
    uint32  chunkCount;   // n, cryptographically bound at the apex (not trusted; §2.2)
    uint32  chunkSize;    // LOGICAL chunk size (bytes) — a field, not an Etched constant (§11 forward-compat)
    uint64  totalSize;    // decoded byte length (redundant with `size`; kept for self-containment)
    bytes32 codec;        // keccak("efs.enc.<name>.v1"): raw / gzip / zstd / erasure-coded (client-defined)
}
```

- **`chunksRoot` is the file's content address.** Two authors who chunk identical bytes with identical `chunkSize` produce the **same** root → the same store → **automatic global dedup**, cross-file and cross-chain.
- **`chunkSize` is a field, not a frozen constant.** This is the forward-compat seam kept *out of Etched* (§11): the SDK picks a bigger `chunkSize` as code-size limits rise (EIP-7907) or blob tiers arrive, and each file is self-describing. Dedup holds among files sharing `(bytes, chunkSize)`.
- **`contentHash` (flat whole-file keccak) is optional and redundant.** `chunksRoot` already commits every byte and is a *strictly better* content commitment (it adds per-chunk verifiability). If a consumer wants a flat hash for legacy tooling, the SDK exposes it off-chain; on-chain we don't spend a second signed value on it. (If James prefers `contentHash` to remain flat-hash for exact-bytes dedup, keep it as its existing row unchanged and carry `chunksRoot` in the `chunks` value — they don't collide.)

### 2.2 The frozen chunk-Merkle construction (Durable spec + vectors — NOT kernel code)

The construction is **normative and frozen with golden vectors** (so `chunksRoot` is canonical, per-chunk verifiable, and dedup-deterministic — the prior-art autopsy's #1 lesson: freeze every chunking parameter or CIDs drift). It is defined in a **Durable spec**, computed by the SDK and by the store's read-time verifier — **the kernel never sees it and never verifies it.**

```
DOMAIN_CHUNKLEAF   = keccak256("efs.file.chunkleaf.v1")     // disjoint from every envelope/record domain constant
DOMAIN_CHUNKNODE   = keccak256("efs.file.chunknode.v1")
DOMAIN_CHUNKSROOT  = keccak256("efs.file.chunksroot.v1")

leaf_i   = keccak256(abi.encode(DOMAIN_CHUNKLEAF, uint256(i), keccak256(chunkBytes_i)))   // index-committed
apex     = fold(leaf_0 … leaf_{n-1})     // node = keccak(DOMAIN_CHUNKNODE, left, right); odd promotes; single-leaf proofs only
chunksRoot = keccak256(abi.encode(DOMAIN_CHUNKSROOT, uint256(n), apex))                    // ← binds count n at the apex
```

Same hashing discipline as the envelope's Merkle rules (positional, index-committed, domain-separated, odd-promote, single-leaf proofs — no multiproofs, OZ CVE precedent). **Binding `n` into the root** (the Arweave `data_size` anti-overlap lesson) makes `chunksRoot` a complete content address: a single `bytes32` commits both the count and every chunk hash, so no one can grief a store with a wrong count (second-preimage on keccak), and truncation is detectable (§7, §15). `keccak` only — no KZG, no trusted setup, no precompile in the read path (the forward-compat lens's ruling: keccak is the century-durable commitment).

**Per-chunk verifier (pure; lives in the store/view/SDK, deployable by anyone):**

```solidity
function verifyChunk(bytes32 chunksRoot, uint32 n, uint32 index, bytes calldata chunkBytes, bytes32[] calldata proof)
    external pure returns (bool)
{   bytes32 leaf = keccak256(abi.encode(DOMAIN_CHUNKLEAF, uint256(index), keccak256(chunkBytes)));
    bytes32 apex = _foldProof(index, leaf, proof, n);           // ~ceil(log2 n) keccaks
    return keccak256(abi.encode(DOMAIN_CHUNKSROOT, uint256(n), apex)) == chunksRoot; }
```

~4k gas/chunk `[UNMEASURED]`. Because it is pure and canonical, **any** party deploys the blessed instance; a consuming contract links it or inlines the ~20 lines. This is the whole "second Merkle tree" of the fat designs — here it is a **redeployable library, forever fixable**, not Etched.

---

## 3. Kernel surface it adds — essentially none (with one optional dial)

**The large-file write path adds ZERO kernel entrypoints, ZERO new storage, ZERO domain constants, ZERO tree machinery on the Etched kernel.** The manifest is ordinary records; the bytes are off-kernel deploys; verification/pagination/reads are redeployable views. The single question is *where the `chunks` value lives*, and James has a dial:

| Dial position | Etched cost | Legibility | Recommendation |
|---|---|---|---|
| **(A) user key-TAGDEF** `efs.chunks` under the DATA | **literally zero** new frozen surface (permissionless key-TAGDEF extension is already blessed in `codex-kinds`) | relies on a Durable naming convention | the true zero-Etched floor |
| **(B) one reserved-key row** `chunks` in the frozen table (VAL: `FileChunks`, non-interned, opaque to the kernel) | **one row** — the kernel stores 32+ bytes opaquely and never decodes them | blessed, frozen, legible for 100 years | **recommended** |

I recommend **(B)**: a file's on-chain content commitment is a *core file-system primitive* that deserves a frozen, legible home, and one opaque VAL row is **~1/10th** the Etched surface of a fat design (which adds a row **plus** two entrypoints **plus** four storage mappings **plus** four domain constants **plus** a tier enum, all inside the kernel that is already ~2,300–2,900 LoC fighting EIP-170). Under (B) the kernel still does nothing with the value — it stores it opaquely and exposes it via `getClaim`, exactly like `mirrors`. All chunk semantics remain off-kernel. Either dial position preserves the thesis; (A) is available if "smallest frozen surface" is taken absolutely.

> Everything from here down is identical under (A) or (B). The kernel is a dumb notary of a signed commitment; the file-system's byte-handling is Durable.

---

## 4. The off-kernel byte layer — content-addressed stores as redeployable views

Bytes live in **SSTORE2 chunk contracts** indexed by a **content-addressed store** (`EFSFileStore`, the v2 heir of v1's `EFSBytesStore` — ADR-0057). The store is a **redeployable view**: its *code* can evolve for future files, while any *given* store, once deployed, is **permanent immutable state** (SSTORE2 code + the store's own storage). Nothing here is Etched.

```solidity
interface IEFSFileStore /* ERC-5219 + EIP-7617 pagination, like v1 EFSBytesStore */ {
    function chunksRoot()               external view returns (bytes32);   // the file this store serves
    function chunkCount()               external view returns (uint32);    // n (from the committed root)
    function chunkAddr(uint32 index)    external view returns (address);   // SSTORE2 code contract for chunk i (0 if absent)
    function present(uint32 index)      external view returns (bool);
    function readChunk(uint32 index)    external view returns (bool present, bytes memory data); // extcodecopy
    // ERC-7617 paginated whole-file read + resume helper:
    function readFile(uint32 start, uint32 maxChunks) external view returns (bytes memory data, uint32 next, bool complete);
    function missing(uint32 start, uint32 maxScan)    external view returns (uint32[] memory idx, uint32 next);
    // permissionless fill (no author, no signature — content-addressed):
    function put(uint32 index, bytes calldata chunkBytes, bytes32[] calldata proof) external; // verifies vs chunksRoot, then SSTORE2-deploys
    // R1 read-time verification for on-chain consumers:
    function readChunkVerified(uint32 index, bytes32[] calldata proof) external view returns (bytes memory data);
}
```

### 4.1 Store address is author-committed (kills v1's "unsigned mirror-claim" weakness)

```
storeAddr = CREATE2(FILE_STORE_FACTORY, salt = chunksRoot, init = FILE_STORE_INITCODE)
```

Because `chunksRoot` is signed, `storeAddr` is **derivable before mining, identical on every chain, and front-run-proof** (a front-runner can only *help* by storing the correct bytes at the correct address). The `mirrors = web3://<storeAddr>` PIN is then a *redundant discovery hint*, not a trust anchor. In v1 the store↔file binding was an unsigned attester mirror string a reader had to trust; here the binding is **inside the author's signature**, transitively: `signature → recordsRoot → chunks value → chunksRoot → CREATE2 → storeAddr`. (Robustness note: the derivation depends on a canonical factory/initcode — a Durable Schelling constant. The *integrity bedrock does not*: a reader reassembles bytes from **any** source and re-derives `chunksRoot`, so store-code evolution never breaks integrity, only the address-derivation convenience. See §15.)

### 4.2 Chunk contracts are content-addressed (dedup + tamper-proof by construction)

Each chunk's SSTORE2 code contract is `CREATE2(salt = keccak(chunkBytes))`, so a given address holds **exactly** the bytes whose hash derives it. You *cannot* deploy wrong bytes at a right address. Redeploying an existing address is a no-op (the EVM's "address already has code" **is** the presence bit — no kernel bitmap needed). Identical chunks across files store once (dedup). Physical packing may pack multiple logical chunks per code contract post-EIP-7907 (a store-implementation detail; the logical `chunkSize` in the commitment is what fixes the root).

### 4.3 Storage tiers = ordinary `mirrors` transports, not a kernel tier byte

| Tier | Where bytes live | `mirrors` scheme | On-chain? | When |
|---|---|---|---|---|
| **inline** | in the signed envelope (C-inline) | `data:` | committed **and** in state (calldata→history) | tiny files |
| **state (default)** | SSTORE2 code, contract-readable | `web3://<storeAddr>` | **yes — bytes in state** | the on-chain-file default |
| **commitment + mirror** | ar:// / ipfs:// / https:// | those schemes | committed on-chain, bytes off | huge media, cheap durability |
| **blob-ingest → promote** | EIP-4844 blob now → SSTORE2 later | blob receipt + `web3://` | committed now, in-state after promote | cheap upload, §11 |

All four share the identical signed `chunksRoot`; only the mirror scheme + store differ. **Adding a blob tier later is a new store + a new mirror scheme — ZERO Etched change** (contrast a fat design's frozen tier enum). Consistent with ADR-0056 (no scheme allowlists on immutable contracts; `web3://` is the universal zero-infra default) and the memory note that web3:// is the write default.

---

## 5. Chunk submission + parallelize + resume + idempotent + dedup

The authorization that matters (this file is Alice's, at this path, with this content root) is the **one signed envelope**. The bytes are permissionless content-addressed storage — **no author, no signature, verified against the signed root**.

```
CLIENT (local, no wallet, no gas):
  1. chunk file at chunkSize → build chunksRoot (§2.2); compute dataId, storeAddr, per-chunk CREATE2 addrs, manifest slot.
USER (exactly one interaction):
  2. eth_signTypedData_v4 over the envelope {DATA, placement, chunks, size, mirrors}.          ← THE ONLY PROMPT
SUBMITTER (relayer / burner / session-key agent / the user's own EOA — anyone, msg.sender ignored):
  3. MANIFEST tx: submit the envelope → kernel admits the ~5 records, attributes them to the recovered author.
  4. BYTE txs (N of them, off-kernel): store.put(i, bytes_i, proof_i)  — OR bare CREATE2 deploys the store observes.
     Each verifies bytes_i against the signed chunksRoot at index i, then SSTORE2-deploys. No author. No signature.
     ANY submitter, ANY order, idempotent (address-has-code skip), parallel, resumable.
```

- **Resume is free, zero new signatures, zero session.** The store's populated-address set **is** the resumable cursor. `store.missing(start, maxScan)` returns the exact gaps; resubmit only those. A different relayer/burner can resume an upload the first abandoned — completeness is a pure function of on-chain state, not server memory. (The manifest itself resumes via the kernel's existing `submitSubset` skip-already-admitted.)
- **Parallel is free and coordination-free.** CREATE2 chunk addresses are content-derived (not nonce/mined-order-derived), so N deploys shard across M submitter accounts with no cross-tx dependency; throughput scales ~M-fold by adding burners (the auth lens's mempool analysis applies: ~16 executable/~64 queued per geth account; shard across burners to exceed it).
- **Idempotent / racing.** Two relayers racing one chunk: single-threaded EVM, first deploy wins, the second hits "address has code" and no-ops. No corruption, at-most-once physical storage.
- **Dedup.** Same bytes → same CREATE2 address → stored once (cross-file, cross-chain). A new file whose `chunksRoot` is already complete on this chain resolves **instantly complete with zero byte-txs**.
- **A hostile/lazy submitter can only omit.** They cannot forge (bytes are content-addressed + root-verified), cannot alter (a flipped byte fails its proof / lands at a different address), cannot misattribute (chunks have no author). Omission → honest graded PARTIAL (§7), always completable by anyone from the same signed root.

**Resume protocol (SDK, informative):**
```
loop until complete:
  idx = store.missing(cursor, PAGE)     // exact gaps from on-chain state
  if none: done
  put(idx…)  parallel, batched, self-pay or hand to relayer/burner
```

---

## 6. The authorization / UX layer — MetaMask prompt count per rail

Authorization and submission are **orthogonal axes**: the author signs **exactly one** typed-data envelope (irreducible — no ERC-1271, no delegated authoring pre-KEL: `codex-envelope`); every scheme below differs only in *who broadcasts the gas-paying txs and how many wallet prompts that costs*. Architecture C's twist over any fatter design: **the N byte-txs are not kernel calls and carry no author**, so a submitter needs no signed permission specific to them — it just deploys bytes that will verify against the signed root. The relayer/burner is a **pure gas utility with blast radius = gas only** (never authorship, never funds).

| Rail | Author key prompts | Author tx confirmations | Notes |
|---|---|---|---|
| **Relayer / faucet-burner (recommended default)** | **1** (`signTypedData_v4`) | **0** | Author signs once; hands `{signed envelope + file bytes}` to a relayer or a **faucet-dripped local burner**, which submits the manifest tx + fires all N byte-deploys, paying gas. Author needs no ETH, no gas UX. **This is the cypherpunk floor** (self-submit always available) **and the hackathon gasless faucet-drip must-have — shipped with zero new kernel code.** |
| **Self-pay, EIP-5792 batch wallet** | **1** (sign) | **~1–few** (`wallet_sendCalls` batching manifest + byte-deploys) | Sequential batching lands manifest + a bounded batch of byte-deploys per approval; very large N may need a few approvals or a session key. |
| **Self-pay, legacy wallet (no batching)** | **1** (sign) | **1 (manifest) + ⌈N/B⌉ (byte-deploys, B/tx)** | The honest worst case: one sign + gas confirmations. Still **one signature**; the extra clicks are gas confirmations, not authorizations, and vanish under batching/relay. |
| **Session key (ERC-7715 grant on a 7702 EOA)** | **1 grant, then 0/chunk** (+ the 1 authoring sign) | 0 (agent auto-submits) | Grant once: "may call `FILE_STORE_FACTORY`/store `put` + kernel `submit`, value=0, gas-capped, minutes-boxed"; a local agent completes unattended on the user's own address, relayer-free. Emerging wallet support — the "as AA matures" answer. |

**Headline: one signature authorizes the entire multi-block upload**, and in the default (relayer/faucet-burner) rail that one signature is the author's *only* interaction — zero txs, zero gas. The N-transaction reality of a large file (unavoidable — it exceeds one block's gas) is fully absorbed behind that single authorization. (This table is deliberately identical to the auth-lens ranking, because the auth layer is architecture-independent — that is the whole point of separating it from the kernel. Architecture C makes the relayer/burner path *simpler still*: byte-deploys are plain CREATE2, not kernel entrypoints.)

**Honoring two standing constraints:**
- **Attester-invariant / "no shared relayer" (memory).** In v1 EAS the attester = `msg.sender`/delegated signer, so a shared relayer *becomes* the attester and breaks lens keying — the memory's caution. In v2 native, **author = recovered signer, `msg.sender` ignored**, so a relayer/burner **never becomes the author**. The v2 envelope resolves that concern structurally; the burner is offered as the cypherpunk (user-controlled) default, a third-party relayer as an equivalent option, and **neither is ever the attester**.
- **ERC-2771 is not used** (redundant anti-pattern): the envelope is already a zero-trust meta-tx forwarder; adding 2771 would reintroduce a trusted forwarder to recover a property EFS already has more safely.

---

## 7. Progressive read — incomplete files as graded states, never broken, never false-absent

Two orthogonal resolution layers (mirrors the read-lens; the mandate is a partial file reads as a *graded* state):

1. **Identity / placement / metadata** — resolved by the normal lens walk over the placement slot and the `chunks` slot (kernel reads). The instant the manifest envelope lands, the file's identity, `chunksRoot`, `size`, tier, `chunkCount` are **LIVE** (subject to usual currency qualifiers). **Never depends on byte availability** — so a partial file is a real, present file with a progress state, never a 404, never a broken file.
2. **Byte availability** — graded from the **store** (a redeployable view read), orthogonal to disposition. Because `chunksRoot` makes each chunk independently verifiable at its index, the present/missing set is **exact and provable**:

| Grade/flag | Condition | GATE read | INTERACTIVE read |
|---|---|---|---|
| **BYTES-COMPLETE** | store present-count == `chunkCount` (bound `n`) | consumable (whole file) | serve/render normally |
| **BYTES-PARTIAL(k, n)** | 0 ≤ k < n, present set exact from the store | **fail closed** if it needs the whole file; MAY consume any present, *proven* chunk for range logic | render progress (k/n), serve present byte-ranges (HTTP 206), stream-as-available; the missing set is exact and displayable |
| **BYTES-UNBOUND** | no store / no chunk yet | fail closed | "upload pending" placeholder; identity/metadata still shown |
| **CONTENT-MISMATCH** | reassembled bytes fail `chunksRoot` | fail closed | flagged; harms only the author's own file, detectable |

`BYTES-PARTIAL(k,n)` is a **Durable refinement of the existing `BYTES-UNAVAILABLE` flag** (`read-lens-spec §2.4`) — same family ("authenticated pointer, bytes status X here"), made *precise* at chunk granularity. **This is a read-lens (Durable) addition, not Etched** — the exactness comes from the off-kernel store, not a kernel bitmap. Consequences: never "broken" (identity LIVE independent of bytes), never a false "absent" (byte-absence is `BYTES-PARTIAL`/`UNBOUND` at a *present* file, categorically distinct from an empty slot — the anti-fallthrough discipline is untouched), never truncation-as-complete (`complete ⟺ present-count == n` with bound `n`; `readFile` stops at the first gap; GATE fails closed). Progressive availability (byte-range reads, resumable downloads, stream-as-it-arrives) falls out for free.

---

## 8. Reads & serving — point reads split kernel vs view; R1 composability preserved

Following the kernel's Etched discipline (writes + point reads on the kernel; enumerating/paged reads in redeployable views):

- **On the kernel:** the manifest point reads only — `getSlot(chunks-slot)` / `getClaim` return `chunksRoot`, `chunkCount`, `chunkSize`, `size`, `mirrors`, disposition. **No byte logic on the kernel.**
- **In the redeployable store/view:** `readChunk`, `readFile` (EIP-7617 pagination — ported from v1 unchanged in spirit), `missing`, `present`, and the pure `verifyChunk`.
- **web3:// serving:** the router (redeployable, ERC-5219, existing grammar) resolves `~data:<dataId>` → its `chunks` value → `storeAddr` → paginated `readFile`. Complete → 200 with reassembled bytes; **BYTES-PARTIAL → 206** with the available prefix (never a truncated 200). The `mirrors` PIN carries `web3://<storeAddr>` so generic web3:// clients (`web3protocol`, w3link, eth.limo) resolve the native store with no EFS-specific code — the store *is* a web3:// source and, when complete, the highest-integrity one.
- **R1 on-chain composability (the two apps that need it — NFT metadata, dapp records):** a consuming contract reads bytes via the store's `readChunkVerified(i, proof)` (or reassembles + checks the root, or inlines the ~20-line `verifyChunk`). **This is the one real tradeoff vs a fat kernel:** verification happens at *read time* in a view/linked-lib rather than being guaranteed by kernel write-time admission. It is the *same* verify-don't-trust posture EFS already takes for every read, the verifier is tiny/pure/codehash-canonical, and the composability research shows both R1 categories are point-lookup-shaped and same-chain — so a linked verifier lib serves them. Honest cost: no single Etched-blessed verifier; interop leans on a canonical store codehash (a Schelling convenience, the same model the kernel itself uses for canonicity). Flagged in §14/§15.

---

## 9. Portability — strictly more than v1 SSTORE2, fully trustless

To copy a file to a new chain:
1. **Replicate the one manifest envelope.** It re-verifies from the author's chain-free signature on the new chain (envelope property; no re-signing). One tiny record batch.
2. **Re-materialize the bytes.** Re-run the CREATE2 chunk deploys on the new chain → identical addresses → the store re-derives the **same** `storeAddr` (same `chunksRoot`). Each chunk re-proves against the same signed root — **no trust in the copier**: a flipped byte fails its proof, a lazy copier yields an honest PARTIAL. Dedup travels (if the new chain already holds those bytes from any file, the copy resolves instantly complete).

Contrast v1, where the store↔file binding was an **unsigned attester mirror-claim** a reader had to trust and the store had to be re-deployed with a fresh address: here the binding is **inside the author's signature** (`chunksRoot` → CREATE2 → `storeAddr`) and **content-addressed**, so replication is mechanical and trustless — the LOCKSS property reaching the *bytes*, not just the namespace. Honest limit (inherited, unchanged): a dead author's `dataId` can't be re-minted on a fresh chain (owned-kind identity binds the author), but the **bytes** (`chunksRoot`, content-addressed) copy freely regardless. This design widens what travels trustlessly; it does not reopen the identity model.

**Portability cost vs a fat kernel:** the store *code* must exist on each chain (like any SSTORE2), but it is a redeployable view deployed via a canonical CREATE2 factory + codehash — "same store code everywhere" is a Schelling convenience, and the **bytes + signed binding are fully portable independent of it** (reassemble-from-any-source + re-derive-root is source-agnostic).

---

## 10. Permanence — bytes in state, from-state reconstructible, no frozen plumbing

- **State, not history.** Tier-state bytes live in SSTORE2 **code** (extcodecopy). EIP-4444 history expiry touches blocks/receipts, **not** account code/state — bytes and commitment both sit in the permanent state set. Inline (calldata) bytes are commitment-permanent + bytes-archival (honest, graded). Blob-only-never-promoted is commitment-permanent + bytes-ephemeral (18-day fuse) — graded BYTES-UNAVAILABLE, never silently "complete" (§11).
- **From-state-alone reconstruction holds.** The spine lists the manifest claim; decode its `chunks` value → `chunksRoot`/`chunkCount` → `storeAddr = CREATE2(factory, chunksRoot)` → read the store's `chunkAddr(0..n-1)` from the store's storage → `extcodecopy` each → reassemble → re-derive `chunksRoot` and verify. No event dependence on the permanent read path.
- **The 100-year bet is minimal.** What must survive a century is only: *keccak, EIP-712/ecrecover, extcodecopy, and the frozen chunk-Merkle construction* — all plain, VM-portable, no trusted setup, no proof vendor, no precompile. The **byte-plumbing that will churn** (chunk sizing, physical packing, tiers, blob bridges) is Durable and replaceable, so churn never touches the permanent commitment. **This is why thin is more permanent, not just smaller.**

Honest permanence caveat (the price of thinness, flagged): reconstruction reads the **store's storage layout** (its `chunkAddr` list), which is Durable (documented + codehash-canonical) rather than ERC-7201-frozen on the kernel. A *given* store is immutable once deployed and its layout is codehash-verifiable; for maximally-critical files the SDK can additionally carry a fallback address list. This is weaker than a fat kernel's Etched-frozen layout — a deliberate, bounded trade (§14).

---

## 11. Forward-compatibility — scaling rides underneath a frozen commitment

The authoring UX and the signed commitment are **frozen against future scaling** because the one signature commits to a chunk *root*, not a storage venue or a physical size. Every capacity gain plugs in **underneath the unchanged manifest, with zero Etched change**:

- **Bigger blocks / lower calldata floor** → more byte-deploys per tx, smaller N. No change.
- **EIP-7907 (Fusaka, code limit 24 KB→64 KB, metered)** → the store packs bigger physical chunks; the SDK raises the logical `chunkSize` **field** for new files. Already banked this fork — a fat design that hard-codes a 24,576 tier constant would need an Etched revision; here `chunkSize` is a plain field and physical packing is store code.
- **Blobs / EIP-4844 / danksharding / PeerDAS** → **blob-ingest → promote**: post bytes as blobs (cheapest transport, ~16–40× under calldata) for instant cheap upload; a **permissionless, trust-minimized promoter** (author's SDK worker / paid pinner / self-interested reader / LOCKSS volunteer) fetches blob bytes, verifies each against the signed `chunksRoot`, and re-materializes into the state tier **before the ~18-day prune** — the promoter *cannot corrupt the file* (a wrong byte fails the root check). Blobs are an **availability accelerator, not a permanence tier**: the read-lens grades a committed-but-unpromoted file BYTES-UNAVAILABLE and a GATE read fails closed, so the blob-pruning trap is a documented graded state, never a silent loss. Adding the blob tier is a new store + mirror scheme + promoter — **all Durable, zero Etched**.
- **Future on-chain-storage cost cuts** → a file committed blob-cheap today can be promoted into L1 state permanence later, by anyone, **with no re-signature** — same `chunksRoot`, same signature. "Bank the commitment now, migrate the bytes up as the floor drops" is exactly "scalability will improve and I want on-chain files to be SOLID."

**Must-not-bake-in (each expires under the roadmap; Architecture C avoids all by keeping them Durable):** a hard 24,576 chunk constant; a blob-persistence assumption; KZG/point-eval in the permanent path; an external-DA/single-mirror anchor; encoding file bytes as spine leaves.

---

## 12. Gas / cost sketch (concrete but UNMEASURED — CI snapshot supersedes)

Order-of-magnitude, L1 cold-slot pricing:

| Item | Dominant cost | ~gas |
|---|---|---|
| **Manifest envelope** (~5 records) | spine ~25k/record + small bodies + one ecrecover ~3k | **~150–300k** total, independent of N |
| **Per 24 KB chunk (state tier)** | SSTORE2 code deposit 200×24,576 ≈ 4.92M + calldata (EIP-7623 floor) ≈ 0.25–1M + CREATE2 ~32k + store index SSTORE ~22k + verify ~4k | **~5.2–6.0M** |
| **1 MB state tier** (~43 chunks) | above ×43, across many blocks | **~225–260M** |
| **Commitment + ar:// mirror** | manifest only; bytes off-chain (~$20–50 / 10 GB on Arweave) | **~150–300k** on-chain |

Reading: state-tier bytes-on-chain are expensive **by physics**, not by architecture — the storage cost equals a fat design's state tier. Architecture C **avoids** the fat design's per-chunk kernel `submitChunk` call + its per-chunk spine claim (~22–27k each) + kernel bitmap churn, so it is **marginally cheaper per chunk and dramatically lighter on the enumeration spine** (bytes never become spine claims). Large on-chain files are primarily an **L2/L3 play** (calldata via blob DA, cheap execution) — these numbers fall 1–2 orders there; L1 is the premium-permanence tier. **All figures UNMEASURED — a freeze-blocking CI gas snapshot on a real L2 supersedes them before any ADR cites them.**

---

## 13. New Etched surface it adds — the headline

- **Kernel entrypoints:** **none.** (Manifest uses existing `submit`/`submitSubset`; bytes are off-kernel.)
- **Kernel storage:** **none.** (Bytes/index live in redeployable stores; the manifest reuses existing claim/slot storage.)
- **Domain constants / tree machinery on the kernel:** **none.** (The chunk-Merkle construction is Durable; its verifier is a redeployable pure library.)
- **Reserved-key table:** **zero rows (dial A) or one opaque row `chunks` (dial B, recommended).**
- **Everything else is Durable/Ephemeral:** the frozen chunk-Merkle construction + vectors; the `EFSFileStore` content-addressed store (redeployable view, CREATE2-derived, ERC-5219/EIP-7617); the `BYTES-PARTIAL(k,n)` read grade; the SDK uploader/reassembler; the blob-ingest promoter.

**Net Etched cost: ~zero (at most one opaque reserved-key row).** For comparison, a fat/native chunk kernel adds a reserved-key row **plus** `submitChunk`/`submitChunks` entrypoints **plus** `chunkStores`/`chunkBitmap`/`chunkPtr`/`chunkInline` storage **plus** four chunk domain constants **plus** a tier enum **plus** ~150–250 LoC — all frozen forever, inside the kernel already fighting EIP-170.

---

## 14. Architecture C vs a fat/native chunk kernel — the honest tradeoff

| Axis | Thin kernel + auth (C) | Fat/native chunk kernel (A) |
|---|---|---|
| New Etched surface | **~zero** (≤1 opaque row) | row + 2 entrypoints + 4 mappings + 4 constants + tier enum + ~150–250 LoC |
| EIP-170 budget on the kernel | untouched | adds to an already-tight kernel; may force a 2nd Etched artifact |
| Where chunk verification runs | read-time, redeployable view / linked lib (verify-don't-trust) | write-time, kernel-guaranteed admission |
| R1 composability | store `readChunkVerified` / inlined lib (linked call) | kernel `readChunk`/`isComplete` (kernel call) — **A's advantage** |
| Forward-compat (bigger chunks, blobs) | new store/scheme, **zero Etched change** | tier enum + constants are Etched; extension is a frozen-surface revision |
| Reconstruction layout guarantee | store layout is Durable (codehash-canonical) | kernel layout ERC-7201-frozen — **A's advantage** |
| Spine cost of bytes | zero (bytes never become claims) | zero (also a 2nd tree) — parity |
| Auth / MetaMask prompts | 1 sig; byte-txs are author-less deploys | 1 sig; byte-txs are author-less kernel calls — parity |
| Permanence bet | keccak + ecrecover + extcodecopy + frozen construction | same + the frozen chunk subsystem must also survive 100 years |

**The trade in one line:** Architecture C buys **minimum irreversible surface + free forward-compat** at the cost of **moving chunk verification from Etched-write-time to Durable-read-time** (a small, bounded R1-composability and layout-guarantee concession). For a mission that prizes minimum irreversible assumptions and a kernel already at EIP-170's edge, this is the right default; a James who ranks kernel-guaranteed on-chain composability above frozen-surface minimalism would weigh toward the fat design. **Not fatal either way — this is a dial, and the auth layer (the headline UX win) is identical for both.**

---

## 15. Trying to break it (adversarial pass)

| Attack / worry | Outcome | Why |
|---|---|---|
| Forge a chunk (wrong bytes) | rejected at read-time verify / lands at a different CREATE2 address | content-addressed + index-committed leaf vs signed root; second-preimage-hard |
| Grief a store with wrong count | impossible | `n` bound at the apex; only the true `n` reproduces `chunksRoot` |
| Front-run store / chunks | helps the author | content-addressed; correct bytes at the author-committed address |
| Malicious store returns wrong bytes for index i | caught at read time → PARTIAL/CONTENT-MISMATCH, never wrong-bytes-served | reader verifies each chunk against the signed root at its index; the store's index map is **untrusted** |
| Racing relayers on one chunk | first wins, second no-ops | single-threaded EVM; "address has code" gate; at-most-once deploy |
| Author never supplies bytes | honest PARTIAL(0/n) | no third-party impact; truthful grade, never "broken"/"absent" |
| Truncation: serve k<n as complete | impossible / detectable | `complete ⟺ present==n` with bound `n`; `readFile` stops at first gap; GATE fails closed; count bound in root |
| Blob-only, never promoted | BYTES-UNAVAILABLE, GATE fails closed | availability ≠ permanence; graded honestly, never silent |
| Spine bloat via C-inline on a huge file | avoided by SDK routing; kernel-agnostic | large files → C-store (off-spine); C-inline capped to tiny (Durable guideline) |
| **R1 consumer trusts a buggy/malicious verifier view** | **real residual** — mitigated, not eliminated | verifier is pure/tiny/codehash-canonical; consumer links the blessed lib or inlines ~20 lines; same verify-don't-trust posture as all EFS reads. **The sharpest honest cost vs a fat kernel.** |
| **Reconstruction depends on Durable store layout** | **real residual** | a given store is immutable + codehash-verifiable; SDK can carry a fallback address list for critical files; weaker than ERC-7201-frozen kernel layout — bounded trade |
| **Store address-derivation depends on canonical factory/initcode** | convenience only, not integrity | integrity bedrock = reassemble-from-any-source + re-derive-root (source-agnostic); a changed factory breaks discovery convenience, never verification |
| No single Etched-blessed verifier → cross-chain interop drift | Schelling/codehash convention | same canonicity model the kernel itself uses (deploy-by-factory + verify-by-codehash); bytes+root portable regardless |
| Relayer/burner key leaks | blast radius = gas only | never the author (author-from-signature); value=0 byte-deploys; keep burner balance small |
| Cost of on-chain bytes is high | inherent to any bytes-on-chain design | mitigated by L2/L3, blob-ingest+promote, ar:// tier; "archival not commodity" |

**Residual honest weaknesses (not fatal, flagged):** (1) read-time verification shifts the R1-composability guarantee off Etched (§8, §14) — the deliberate price of thinness; (2) store storage layout is Durable, not Etched-frozen (§10); (3) on-chain bytes are expensive by physics (§12); (4) the frozen chunk-Merkle construction is a new canonical surface that must ship with golden vectors + Solidity↔TS differential fuzz (the same discipline the envelope's Merkle rules carry) even though it is not Etched — a wrong construction is a Durable-but-painful mistake.

---

## 16. Open questions & handoffs

1. **Dial A vs B** (zero-Etched user key-TAGDEF vs one blessed `chunks` reserved-key row). Recommend **B** — one opaque row is worth a frozen, legible home for a core FS primitive at ~1/10th a fat design's surface. James's call; both preserve the thesis.
2. **`contentHash` disposition** — drop the flat whole-file hash (redundant with `chunksRoot`) or keep it as its existing row for exact-bytes dedup? Recommend keeping it *optional*; `chunksRoot` is the authoritative content address.
3. **R1-composability weight** — if kernel-guaranteed on-chain chunk reads are a first-class requirement (2 app categories), that is the one axis pulling toward a fat kernel; otherwise the store's linked verifier serves it. Decision for the synthesis phase.
4. **Store canonicalization** — a canonical `EFSFileStore` codehash + CREATE2 factory (Durable), with golden reconstruction vectors, so cross-chain readers agree on the store; port v1's `EFSBytesStore` (ADR-0057/0058) as the base.
5. **[SDK]** the uploader (chunk→root→1 sign→relay/burner deploys + manifest submit→resume via `store.missing`), the reassembler/verifier, and the blob-ingest promoter — all SDK/Durable, honoring the EFS-SDK-boundary (machinery in the SDK, thin in client code).
6. **[read-lens]** ratify `BYTES-PARTIAL(k,n)` as a Durable refinement of `BYTES-UNAVAILABLE`.
7. **Gas snapshot** (state tier per chunk, manifest, on a real L2) is freeze-blocking before any §12 number is cited.
