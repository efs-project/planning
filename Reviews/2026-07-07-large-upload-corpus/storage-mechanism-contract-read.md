# EFS v2 — EVM storage mechanism + contract-read lens

**Role:** how the bytes physically land, and how a *contract* reads a large on-chain file.
**Status:** design input for the v2 large-upload spec. Gas numbers are hand-derived from opcode schedules (Cancun/Prague), **UNMEASURED** — every figure below must be replaced by a gas snapshot before any ADR cites it.
**Depends on / consistent with:** codex-kernel (bodies-in-state ruling, ERC-7201 layout, CREATE2 canonicity), codex-envelope (Merkle root, positional leaves, claimId), codex-kinds (mirrors reserved-key dual-role edges, `MAX_VALUE_BYTES=8192`), read-lens-spec (BYTES-UNAVAILABLE, PROVEN-ABSENT vs UNKNOWN), ADR-0057/0058/0059/0063 (EFSBytesStore, EIP-7617 pagination, extcodecopy survival, `data:` inline).

---

## 0. The one-paragraph answer

Separate two things the v1 corpus and this task keep adjacent: **the graph** (file identity, mirror edges, `contentHash`/`size`, the chunk manifest — all small) and **the file bytes** (KB–GB). The kernel already rules **graph bodies live in state** (`getClaim` returns reconstitutable bytes — native-kernel.md L216), and that is correct and unchanged. The *file bytes* are too large to carry in claim bodies at scale, so they land in one of **four byte-tiers**, pointed at by a `mirrors` reserved-key claim. The load-bearing design move for "SOLID" and for one-signature uploads: **make each chunk content-addressed and CREATE2-derived from the author's single signed Merkle manifest**, so (a) chunk addresses are pure functions of content computable before any deploy, (b) a relayer deploys chunks in parallel across many blocks with **no per-chunk signature**, (c) any reader or contract re-derives and verifies each chunk against the signed root, and (d) dedup is free. The default "genuinely on-chain, contract-readable, survives the already-scheduled purge" tier is **SSTORE2/SSTORE3 (bytes = contract code, in state, `extcodecopy`)**; the other three tiers trade permanence or contract-readability for cost/portability and must be labeled as such.

---

## 1. The layering: graph-in-state vs bytes-in-a-tier (settle this first)

| Layer | What it is | Size | Where it lives | Contract-readable? | Ruling |
|---|---|---|---|---|---|
| **Graph** | DATA identity claim; `mirrors` PIN/TAG edges; `contentHash`/`size`/`contentType` reserved-key value claims; the **chunk manifest** | tens–hundreds of bytes/claim | **kernel state** (bodies-in-state, ERC-7201) | **Yes** — `getSlot`→`getClaim` point reads, ~5–10k gas | Settled (native-kernel L216). Unchanged by me. |
| **File bytes** | the actual file content | KB–GB | **one of the 4 byte-tiers (§2)**, referenced by a `mirrors` claim | tier-dependent (§5) | **My design surface.** |

Why this split is non-negotiable: putting raw file bytes in claim bodies means paying `SSTORE` (~625 gas/byte, §2) for megabytes and blowing every per-claim bound (`MAX_VALUE_BYTES = 8192`). Conversely, putting the *graph* off-chain forfeits the synchronous point-read composability the whole v2 registry sells. So: **small structured facts in state; bulk bytes in a byte-tier with a state-resident commitment.** Everything below is about the byte-tier and its readers.

A file's on-chain identity is therefore: one `DATA` object (owned, permanent) + a **manifest** (either folded into the DATA body if it fits, or carried as a reserved-key value claim) that commits to `{totalSize, chunkCount, chunkCodec, merkleRoot(chunkLeaves), saltRule}` + one or more `mirrors` edges naming the transport(s) that actually hold the bytes.

---

## 2. The byte-tier taxonomy (exact gas, honestly bounded)

All gas figures **UNMEASURED**, derived from the Prague opcode schedule; `G` = gas.

| Tier | Headline cost to WRITE | Where bytes physically live | Contract can read autonomously? | EIP-170 cap | Portable (copy-forward, no redeploy)? | Survives EIP-4444 history-expiry with zero action? |
|---|---|---|---|---|---|---|
| **S — SSTORE2 / SSTORE3** (bytes = code) | **~200 G/byte** code deposit + ~32k G `CREATE` + initcode carry, per chunk | **state**, as deployed contract runtime | **Yes** (`extcodecopy`) | **24,575 B/chunk** → forces chunking + 1 deploy tx/chunk | **No** — code is chain-local; re-deploy per chain (CREATE2 gives *same address*, but bytes must be re-posted) | **Yes** — state is not history |
| **I — inline-in-state** (bytes in the claim body) | **~625 G/byte** (`SSTORE` 20k/word, cold) | **state** (kernel claim body) | **Yes** (`getClaim`) | none, but **≤ `MAX_VALUE_BYTES` 8192 B/claim** | **Yes** — it is a signed record; copies with the envelope | **Yes** |
| **C — commit-only calldata** (bytes in tx calldata / history; **hash in state**) | **~16 G/byte** (calldata non-zero) → **~40 G/byte EIP-7623 floor** for a data-only tx; state cost is one 32-byte `contentHash` | **history** (tx data). Only the commitment is in state | **No** — verify-when-handed only (§6) | none | **Yes** — it is signed bytes + a state commitment | **No** — pruned in ~1 yr (only the commitment survives → BYTES-UNAVAILABLE) |
| **B — blob commit** (EIP-4844/7594; bytes in a blob; **versioned hash in state**) | **~1 G/byte amortized** (separate blob-gas market) | **blob DA** (~18 days), then gone; `blobhash` commitment in state | **No** — same verify-when-handed shape as C, and only during the DA window | none, 128 KB/blob (6 blobs/tx today) | **Yes** (signed) | **No** — pruned in **~18 days**; hardest re-anchor obligation |
| ~~Plain `SSTORE` array~~ (bound, reject) | **~625 G/byte** (3× tier S for the *same* in-state result) | state (mapping/array) | Yes (`SLOAD`) | none | No | Yes |
| ~~Transient `TSTORE`~~ (bound, reject) | 100 G/word, **cleared at end of tx** | nowhere after the tx | intra-tx only | n/a | n/a | **No — zero persistence** |

**Bounding the two rejected rows so the spec is closed:**
- **Plain `SSTORE`** stores 32 bytes per 20,000-gas word = **625 G/byte** and gives you the *same* "in state, contract-readable" property as SSTORE2 at **~3.1× the cost** (SSTORE2's 200 G/byte code-deposit is the cheapest in-state byte the EVM sells). There is no scenario where a file byte belongs in a plain storage slot; use tier S. Plain `SSTORE` is correct only for the small structured graph (which the kernel already does).
- **Transient storage (`TSTORE`/`TLOAD`, EIP-1153)** is 100 G/word but **wiped at tx end** — it persists nothing. Its only legitimate role in this system is *intra-transaction reassembly scratch* (e.g. a contract streaming chunks through a hash within one call). It is never a storage tier; naming it closes the "what about transient storage" question with "it stores nothing across blocks."

**Reading the table:** exactly two tiers put file bytes **in state where a contract can read them and where the already-scheduled purge (EIP-4444) cannot touch them**: **S (SSTORE2)** for anything past 8 KB, **I (inline)** for tiny files. Tiers C and B are cheaper and portable but are **commitments + an availability bet** — the bytes leave state, and the contract can only *verify* them, never *fetch* them.

---

## 3. SSTORE2 / SSTORE3 in depth (the default large-file tier)

### 3.1 Mechanics and the EIP-170 forcing function
SSTORE2 stores a blob as the **runtime code of a throwaway contract**, prefixed with a single `0x00` (`STOP`) byte so the "code" can never be entered as a call and the first data byte isn't mistaken for an opcode. Reads use `EXTCODECOPY(addr, destOffset, 1, len)` (skip the STOP). EIP-170 caps deployed code at **24,576 bytes**, so with the prefix a chunk holds **≤ 24,575 data bytes** — this is *why* a large file must be split, and why each chunk is its own deploy transaction. There is no way around EIP-170 on this tier; chunking is intrinsic, not a choice.

### 3.2 Deploy economics (the "many txs across many blocks" reality, quantified)
Per full 24 KB chunk (**UNMEASURED**):
- code deposit: 24,575 × 200 ≈ **4.92M G**
- `CREATE`/`CREATE2`: 32,000 G + initcode word cost (2 G/word × ~768) ≈ **1.5k G**
- initcode byte carry: the ~24 KB init payload rides in the deploy tx's calldata/memory (~24 KB × 16 G ≈ 393k G if via top-level calldata; less from a factory holding it in memory)
- **≈ 5.0–5.3M G per chunk.**

At a 30M-gas block that is **~5–6 chunks/block theoretical, 1 chunk/tx in practice** (headroom for the attestation writes and safety). A **1 MB file ≈ 43 chunks ≈ 43 deploy txs**; a **10 MB file ≈ 427 chunks**. This is exactly the "exceeds one block's gas, must span many transactions across many blocks" the mission names. The design job is to make that span **need no additional signatures and be parallel + resumable** — §4 does that.

### 3.3 SSTORE3 = SSTORE2 + CREATE2 content-addressing (adopt this, not bare SSTORE2)
Bare SSTORE2 uses `CREATE` (nonce-ordered) → the chunk's address depends on the deployer's transaction order, so you can't know addresses until mined, and parallel/out-of-order deploys collide. **SSTORE3** deploys each chunk via **`CREATE2` with `salt = keccak256(chunkData)`** from a fixed minimal factory with fixed init code. Then:

```
chunkAddr_i = address(keccak256(0xff ‖ FACTORY ‖ keccak256(0x00 ‖ data_i) ‖ keccak256(INITCODE))[12:])
```

Consequences that are all load-bearing for the mission:
1. **Address = pure function of content** — computable client-side *before any deploy*, so the signed manifest can reference addresses that don't exist yet (the "CREATE2 gives predictable chunk-store addresses before mining" substrate promise, made concrete).
2. **Deploys parallelize and reorder freely** — no chunk deploy depends on another's mined address; a relayer (or several) fire all N as independent txs across many blocks.
3. **Dedup is free** — identical bytes → identical address → the second deploy is a cheap no-op revert (address already has code); a file re-using a chunk pays zero to "store" it.
4. **Independently verifiable** — anyone handed `chunkAddr_i` checks `EXTCODEHASH(chunkAddr_i) == keccak256(0x00 ‖ data_i)` against the manifest leaf, no trust in the deployer.

This is the single most important upgrade over v1's `EFSBytesStore`, whose chunk contracts were plain-`CREATE` and whose manager stored every chunk address explicitly.

### 3.4 The manifest *is* the manager (kills v1's write-cap)
v1's `EFSBytesStore` constructor "stores every chunk address in one tx, so a single store tops out around the documented chunk count" (ADR-0057) — a **write-cap** on file size. In v2, because chunk addresses are CREATE2-derived from content, **no contract needs to store the address list**. The state-resident manifest is just:

```
Manifest { uint64 totalSize; uint32 chunkCount; bytes1 codec; bytes32 chunksRoot; }   // ~40 bytes, fits a claim body
```

where `chunksRoot = merkleRoot([keccak256(0x00‖data_0), …, keccak256(0x00‖data_{N-1})])` using the **envelope's own positional Merkle construction** (codex-envelope: index-committed leaves, odd-node promotion, domain-separated node hash, single-leaf proofs — reuse it verbatim; do NOT invent a second tree shape). Any reader derives every `chunkAddr_i` from `(i, chunkCodec, saltRule)` and the chunk's own bytes; the manifest's job is to bound `i < chunkCount` and to let each chunk be verified against `chunksRoot`. **File size is now unbounded on the read side and on the identity side** — only the per-chunk *deploy* is gas-bounded, and that's inherent to any on-chain-bytes system.

For the **standalone `web3://` path** (a generic EIP-4804/5219 client holding a bare `web3://<store>` URL — §5.4), you still deploy a **constant-size `EFSBytesStore` view contract**: it stores only `{chunksRoot, chunkCount, codec, contentType}` (four words), derives `chunkAddr_i` on the fly, `extcodecopy`s, and serves EIP-7617-paginated `request()`. Constant state, **no per-chunk SLOAD, no write-cap** — a strict improvement over ADR-0057's array-holding manager. This store is a per-file deployable helper; its address is never hashed into a schema/kernel identity (freeze-safe, exactly as ADR-0057 established).

---

## 4. Per-chunk content-addressing and the one-signature tie-in

This is where storage meets the mission's "ONE user signature, chunked/parallel/resumable behind that authorization."

**Author-side (one signature):** the author computes chunk leaves `L_i = keccak256(0x00‖data_i)`, the `chunksRoot`, and the DATA/manifest claim; the manifest is one record leaf in the envelope's records Merkle tree; the author signs the **envelope root once** (`eth_signTypedData_v4`). The signature authorizes the *file identity that commits to the chunk set*, not each chunk.

**Submitter-side (no more signatures):** because the kernel recovers author from the signature and **ignores `msg.sender`**, a relayer submits the DATA/manifest claim + proof, and *separately and permissionlessly* deploys the N chunks via CREATE2 (chunk deploys are not authored records — they are content-addressed storage; their authenticity is `EXTCODEHASH == L_i`, not a signature). No chunk needs the author's key.

**Parallel:** all N chunk deploys are independent CREATE2 txs (addresses pre-derived), spread across blocks and even across multiple relayers.

**Resumable:** to resume, recompute `chunkAddr_i` for all `i` and deploy only those with `EXTCODESIZE(chunkAddr_i) == 0`. State itself is the progress ledger — no external upload-session state, no coordination. A crashed upload is resumed by anyone, including a different machine, from the manifest alone.

**Verifiable partiality:** a reader checks completeness = `∀ i < chunkCount: EXTCODESIZE(chunkAddr_i) > 0 ∧ EXTCODEHASH(chunkAddr_i) == L_i`. This is what makes §7's graded reads mechanical.

**Dedup across files:** two files sharing a chunk share its address; the shared chunk is stored once. Content-addressing at the chunk grain gives block-level dedup for free (think common headers, embedded fonts, re-uploads).

The chunk Merkle tree doubling as the file `contentHash` also means the *same* proof machinery serves three purposes: envelope leaf verification, per-chunk storage verification, and the read-lens `contentHash` integrity check. One tree, three consumers — do not fork it.

---

## 5. The reader side — how a CONTRACT reads, and the honest R1/R2 boundary

### 5.1 The three read shapes, by cost class (UNMEASURED)
| Read | Mechanism | Gas | R1 (contract-to-contract, same tx)? |
|---|---|---|---|
| **Graph point read** (identity, mirror URI, a property, the manifest) | `getSlot`→`getClaim` (SLOAD of a small body) | **~5–10k G** | **Yes** — this is the composability surface |
| **Single chunk** (≤24 KB) | `chunkAddr_i` (derive) + `EXTCODECOPY` | **~5–10k G** (2600 cold access + 3/word copy + memory) | **Yes** |
| **Whole large file** (e.g. 1 MB) | loop all chunks into memory + concat | **see §5.2** | **Effectively no** — memory-bound; an off-chain `eth_call` (R2) job |

### 5.2 Reading 1 MB on-chain — two very different numbers
**Whole-file materialize (naive, all 43 chunks concatenated in memory):** memory expansion is quadratic — 1 MB ≈ 31,250 words, memory cost `3·w + w²/512 ≈ 93,750 + 1,907,000 ≈ **~2.0M G just for memory**`, + ~43×2600 cold access (~112k) + ~94k copy ≈ **~2.2M G**. Fits an `eth_call` (gateways cap ~50M) but is absurd inside a transaction (and pointless — no contract needs a megabyte in memory).

**Streaming verify/consume (the pattern to actually use):** read each 24 KB chunk into the **same** memory offset, fold it into a running `keccak` (or feed a consumer), discard. Memory expansion is paid **once** (~768 words ≈ 2.4k G), not cumulatively. Per chunk ≈ 2600 (cold `EXTCODECOPY`) + ~2.3k (copy) + ~4.6k (keccak of 24 KB) ≈ **~9.5k G/chunk**; 1 MB ≈ 43 × 9.5k ≈ **~410k G**. Order-of-magnitude cheaper, and it fits in a transaction if a contract genuinely must hash a megabyte on-chain. **This memory-reuse trick is the difference between a large-file on-chain read being 2.2M G and 410k G** — spec it explicitly for any streaming reader/verifier.

### 5.3 The honest boundary (aligns with the composability research)
Contracts read **coordinates, commitments, and small facts** synchronously (graph point reads, one chunk, a `contentHash`); **humans read bytes** via `eth_call`/gateways (R2). The composability corpus is blunt: of ten apps, only NFT-metadata and dapp-structured-records have a contract-reader story, and both are **point-lookup-shaped, same-chain**. So the storage layer must make **point reads and single-chunk reads first-class and cheap** (it does), and must **not** pretend a contract will stream a whole large file in the money path (it won't; that's R2). "A contract reads a large on-chain file" concretely means: *reads the manifest and a bounded number of chunks, or verifies chunks handed to it* — never "materializes the file autonomously in one tx."

### 5.4 EIP-7617 chunk pagination (the web3:// / R2 large-file read)
For the human/gateway path, a whole-file `request()` fails on large files (gateways cap `eth_call` size/gas). **EIP-7617** is the answer: `request()` returns **one chunk per call** plus a `web3-next-chunk: /?chunk=<n+1>` header; the client walks the chain and concatenates. This is a **read-side protocol between the store and a web3:// client**, not a contract-to-contract mechanism. v2 carries forward the ADR-0057/0058 hardening verbatim — with two fixes already in the corpus that must survive into v2:
- **leading-slash next-chunk value** (`/?chunk=`), or the reference `web3protocol-js` client throws (ADR-0057);
- **router path + lens params preserved across chunks** (ADR-0058 Approach A), or chunk N+1 re-resolves under a different lens and splices foreign bytes mid-file.
Error responses (404 out-of-bounds, no-code chunk) must carry **no** `web3-next-chunk`, so a client never loops on a fault, and a codeless chunk must fail the whole `eth_call` rather than concatenate an error body into the stream (ADR-0057).

### 5.5 A contract paginating a multi-chunk file (the R1 form of §5.4)
A contract that must process a multi-chunk file iterates `for i in 0..chunkCount`, derives `chunkAddr_i`, `EXTCODECOPY`s into the reused memory window (§5.2), and folds. It reads `chunkCount` from the manifest (one SLOAD), never a stored array. Bounded-work variant (gate that only needs the first K bytes, or a specific chunk): read exactly the chunks it needs — random access is O(1) per chunk because addresses are derived, not linked.

---

## 6. Tier C/B contract access — "verify-handed," quantified

Tiers C (commit-only calldata) and B (blob) put bytes in **history/DA, not state**, with only a commitment (`contentHash` / `blobhash`) in state. The precise contract capability:

- **A contract CANNOT initiate a read** of tier-C/B bytes. There is no opcode to pull historical calldata or an expired blob into the EVM. Full stop. This is the fundamental R1 limitation and must be stated plainly wherever tier C/B is offered.
- **A contract CAN verify bytes handed to it** by a caller/relayer: `verifyChunk(bytes calldata chunk, uint256 idx, bytes32[] proof)` checks `merkleVerify(keccak256(0x00‖chunk), idx, proof, chunksRoot_from_state)`. Cost (**UNMEASURED**): keccak over a 24 KB chunk ≈ **~4.6k G** + `O(log₂ N)` proof (~100 G/level, ~1.2k for N=4096) + the calldata carry of the chunk (~16 G/byte the *caller* pays) ≈ **~6k G contract-side** per chunk. Cheap — but the contract is a *checker*, not a *fetcher*; a human/relayer must supply the bytes each time.

So tier C's honest one-liner: **portable and cheap to write, contract-*verifiable*, but not contract-*readable*, and the bytes are gone from a default node in ~1 year (tier B: ~18 days) unless an availability layer keeps them.** This is the source of the read-lens **BYTES-UNAVAILABLE** grade ("authentic pointer, bytes absent here") — that grade exists precisely for the tier-C/B outcome, and a GATE read requiring bytes fails closed under it.

---

## 7. Partial / incomplete stored files — safe-by-construction reads

A large upload is many txs across many blocks; at any moment before completion the file is physically partial. The representation must guarantee reads are a **graded state, never truncated garbage and never a false "complete."**

**Ordering rule (identity-after-bytes for the strong grade):** the manifest commits to `chunksRoot` *up front* (the author signs it), but a reader's **completeness predicate** is evaluated against storage:

```
present(i)  := EXTCODESIZE(chunkAddr_i) > 0 ∧ EXTCODEHASH(chunkAddr_i) == leaf_i
state(file) := COMPLETE           if ∀ i<chunkCount: present(i)
             = INCOMPLETE(missing) if ∃ i: ¬present(i)     // missing = the exact set
```

Grades and their obligations (maps onto read-lens §2/§5):
- **COMPLETE** → serve bytes; `contentHash` verifies against `chunksRoot`.
- **INCOMPLETE(missing)** → a **first-class graded answer** carrying the present/absent chunk sets. A **GATE read fails closed** (BYTES-UNAVAILABLE); an **INTERACTIVE read may render available chunks labeled "partial: chunks k…m present, j absent"** — e.g. progressive image/video, a resumable-download UI — but **never emits a partial byte-stream to a machine consumer as if whole**, and never lets a missing middle chunk be silently skipped (that would splice non-adjacent bytes — the storage-layer analog of the lens anti-fallthrough rule).
- **CORRUPT(i)** → `EXTCODESIZE(chunkAddr_i) > 0` but `EXTCODEHASH ≠ leaf_i` (someone deployed wrong bytes to a CREATE2 address — only possible if they had the preimage, in which case the hash matches, so this is effectively unreachable; it exists as a defensive grade and MUST fail closed if ever hit).

**Critical safety property:** because `chunkAddr_i` is CREATE2-derived from content, a "present" chunk is *always* the right bytes — you cannot deploy wrong bytes to the address the manifest points at (the address *is* the content hash). So incompleteness is the only failure mode, and it is **detectable per-chunk from state alone**, with no trust and no external session state. A half-uploaded file is unambiguously INCOMPLETE with a precise missing-set, and completion is monotone (chunks only appear, never vanish — barring §8 state-expiry). This is the storage-tier realization of the read-lens "proven-absent vs unknown; a partial file reads as a graded state, never a broken file or a false absent."

**Distinguishing INCOMPLETE from UNKNOWN (venue-relative):** on a total-state venue (home chain), `EXTCODESIZE == 0` *proves* the chunk absent → INCOMPLETE is certain. On a partial replica that may not have imported the chunk deploys, `EXTCODESIZE == 0` is **UNKNOWN**, not proven-absent — the reader must qualify it exactly as the lens spec qualifies absence (checkpoint/venue bound). A replica serving "INCOMPLETE" without that qualifier would slander a complete file as broken.

---

## 8. Permanence posture over 100 years (the load-bearing honesty)

"On-chain files, SOLID" lives or dies here. What actually survives, and what needs re-anchoring:

| Threat (status) | Tier S (SSTORE2) | Tier I (inline) | Tier C (calldata) | Tier B (blob) | Graph (state) |
|---|---|---|---|---|---|
| **EIP-4444 history expiry** (SCHEDULED; prunes block history >~1 yr, **not state**) | **Survives** (code is state) | **Survives** | **Bytes pruned ~1 yr** → commitment-only | **Bytes pruned ~18 d** | **Survives** |
| **State expiry / "The Purge"** (PROPOSED, unscheduled; inactive state needs a resurrection witness) | **At risk** — cold chunks may need periodic touch or a resurrection proof to read | **At risk** (same) | n/a (already history) | n/a | **At risk** (same touch/resurrect) |
| **Verkle transition** (migration, re-commits state) | Survives — migration re-roots existing state, doesn't delete it | Survives | n/a | n/a | Survives |
| **EOF removes legacy `EXTCODECOPY`** (POSSIBLE) | **At risk** — mitigated by ADR-0059 multi-mirror redundancy; SSTORE2 chunks are legacy accounts, historically preserved | n/a (uses `getClaim`, not extcodecopy) | n/a | n/a | Survives (SLOAD, not extcodecopy) |
| **Chain death** | bytes die with the chain; **re-deploy on another chain** (CREATE2 → same addresses) from any surviving copy | copies with the envelope (portable) | portable (signed) if bytes were archived | portable if archived in window | copies with the envelope |

**The honest posture, stated for a 50-year reader:**
1. **Only tiers S and I put bytes in a place the *already-scheduled* purge (EIP-4444) cannot touch.** For "SOLID," the **default large-file tier is SSTORE2 (S)**; inline (I) for tiny files. Tiers C and B are cost/portability options that are **commitment + availability bet** — the state keeps a hash forever, the bytes need an availability layer (archive nodes, a mirror, re-posting) or they are gone (~1 yr / ~18 days). The read layer already has the vocabulary for when the bet is lost: **BYTES-UNAVAILABLE**.
2. **The one un-hedgeable coupling is state expiry (The Purge).** It is not scheduled, is heavily contested, and **every serious proposal includes resurrection** (bring expired state back with a witness) — so the realistic outcome is not data loss but a **periodic re-anchoring obligation**: cold chunks may need a "touch" tx or a resurrection proof every expiry-epoch. This is the honest ceiling on "bytes are permanent with zero action" — write it down, don't paper it. A conservative archive keeps a **second, off-state mirror** (ar://) precisely so an unexpected purge/EOF regression is a fall-through, not a loss (ADR-0059's redundancy-is-the-mitigation posture, generalized).
3. **"Genuinely on-chain" ≠ "eternal without maintenance."** The strongest truthful claim is: *bytes-in-state (S/I) survive everything currently scheduled with zero action, survive Verkle, and degrade under a hypothetical future purge to a re-anchoring chore, not a loss — while the file's authenticity and identity (the signed manifest + `chunksRoot`) are unconditional and portable to any chain forever.* That is a strong, defensible "solid," and it is stronger than any off-chain mirror, but it is not "fire-and-forget for 100 years," and the SDK should say so and default to attaching one durable off-chain mirror alongside SSTORE2.

---

## 9. Recommended storage layout for the kernel

1. **Graph in state, bytes in a tier (§1).** Kernel stores DATA identity + `mirrors` edges + `contentHash`/`size`/`contentType` value claims + the manifest — all bodies-in-state, unchanged from the settled ruling.
2. **Manifest = `{uint64 totalSize, uint32 chunkCount, bytes1 codec, bytes32 chunksRoot}`** (§3.4), `chunksRoot` built with the **envelope's positional Merkle construction** (no second tree). Folded into the DATA body if it fits, else a reserved-key value claim. This *is* the file `contentHash`.
3. **SSTORE3 chunking (§3.3):** CREATE2, `salt_i = keccak256(0x00‖data_i)`, fixed factory + fixed init code, so `chunkAddr_i` is content-derived, pre-computable, dedup-free, order-free, resumable.
4. **`mirrors` reserved-key rows (from codex-kinds' dual-role mirror):** PIN = primary transport, TAG = additional. For the on-chain tier the URI is `web3://<EFSBytesStore>:<chainId>`; the store is the **constant-size, write-cap-free** view of §3.4. Small files use the `data:` inline row (tier I, ADR-0063 carried forward). **Default policy: an SSTORE2 primary + ≥1 durable off-chain mirror** for anything meant to outlive EVM evolution (ADR-0059).
5. **No scheme allowlist on any immutable contract** (ADR-0056, and the memory note): the store/kernel never gate transport scheme; render safety is the client's.
6. **Tier C/B are opt-in, labeled** as verify-handed + availability-bet (§6, §8); never a silent default for "on-chain."

---

## 10. The exact contract-read access pattern

```solidity
// GRAPH (R1, cheap, synchronous) — the composability surface
(bytes32 claimId, ..., bool empty) = kernel.getSlot(slotId);        // ~5k G
bytes memory body                  = kernel.getClaim(claimId);       // ~5–10k G; manifest/mirror/property
// → parse Manifest {totalSize, chunkCount, codec, chunksRoot}

// SINGLE CHUNK (R1) — random access, O(1)
address a_i = _deriveChunkAddr(chunksRoot_context, i, codec);        // CREATE2 formula, pure
require(a_i.code.length > 0 && a_i.codehash == leaf_i);              // completeness + integrity (§7)
bytes memory chunk_i = _extcodecopySkip1(a_i);                       // ~5–10k G

// LARGE FILE (R1 streaming verify) — reuse ONE memory window (§5.2)
bytes32 h; for (uint i; i < chunkCount; ++i) {                       // ~9.5k G/chunk → ~410k G/MB
    _extcodecopyInto(scratch, _deriveChunkAddr(root,i,codec));       // same offset each iter
    h = keccak256(abi.encodePacked(h, keccak256(scratch)));          // fold; never accumulate
}

// TIER C/B (verify-handed only — contract CANNOT fetch, §6)
require(_merkleVerify(keccak256(bytes.concat(hex"00", chunk)), i, proof, chunksRoot)); // ~6k G

// WEB3:// (R2 / human / gateway) — EIP-7617 pagination, one chunk per call
(uint16 status, bytes memory b, KV[] memory hdr) = store.request(res, params); // hdr: web3-next-chunk /?chunk=n+1
```

Point reads and single-chunk/random-access reads are first-class R1. Whole-large-file is streaming-verify (bounded memory) in R1 or paginated in R2 — never naive whole-file materialize in a transaction.

---

## 11. Trying to break my own proposal

- **"CREATE2 content-addressing lets an attacker front-run a chunk deploy."** They can only deploy the *correct* bytes to `chunkAddr_i` (the address *is* `keccak(0x00‖data_i)`; wrong bytes → wrong address). Front-running a chunk deploy just does the uploader's work for them (and is the dedup mechanism). No integrity risk. The only griefing is deploying a chunk the uploader will also try to deploy → the uploader's tx reverts (address occupied); the SDK must treat "already deployed with matching codehash" as success, not failure. **Flag:** SDK resumability logic must check codehash, not just existence.
- **"A chunk with a hash-collision could impersonate another."** keccak-256 preimage/collision resistance (~2^128). Same assumption the whole envelope rests on. Not a new surface.
- **"State expiry kills the whole thesis."** It doesn't kill it, it *taxes* it — resurrection is in every serious proposal, so the honest cost is periodic re-anchoring, not loss (§8.2). But I am **flagging this as the single biggest threat to the "solid" claim** and recommending (a) SSTORE2-primary-plus-durable-mirror default, (b) an SDK "touch/re-anchor" maintenance verb reserved now, (c) not marketing "zero-maintenance 100-year permanence." If James wants literal fire-and-forget permanence, no on-chain tier can promise it against an unscheduled purge — that's a substrate limit, not a design miss.
- **"Manifest-as-manager means no deployed store, so a bare `web3://` doesn't resolve."** Correct — that's why §3.4 still deploys the *constant-size* store for the standalone client path. The manifest kills the *write-cap*, not the store. Both coexist: kernel reads via derived addresses (no store needed); generic web3:// clients read via the thin store.
- **"Streaming-verify 410k G/MB is still too much for a contract in the money path."** Yes — which is exactly why §5.3 says whole-large-file is not an R1 money-path pattern. A gate that needs to *trust* a large file's content uses the `contentHash`/`chunksRoot` **commitment** (one SLOAD) and lets a human/off-chain job verify bytes; it does not hash a megabyte on-chain per call. The 410k G number is the ceiling for the rare contract that genuinely must, with the memory-reuse trick making it *possible*; the common case is the commitment read (~5k G).
- **"EIP-7623 ~40 G/byte for tier C is more than tier S's 200 G/byte would suggest is 'cheap' — why offer C at all?"** Tier C is ~5× cheaper per byte than S *and* portable, but the bytes leave state (not contract-readable, pruned in ~1 yr). C is the right tier for **large, portability-first, human-read, redundantly-mirrored** content where SSTORE2's 200 G/byte and per-chain redeploy are too dear and a contract never needs to read it — i.e. most archival bulk. The design offers all four and labels the trade; it does not pick one for the user. **Flag as Tier-2:** the *default* tier per file-size/use is an SDK policy call (my recommendation: ≤8 KB → I; "must be contract-readable or maximally purge-proof" → S; "bulk archival, human-read, mirrored" → C with a durable off-chain mirror; B only as a cheap write-accelerator that is immediately re-anchored to S or an off-chain mirror).
- **"Inline tier I at 625 G/byte is worse than SSTORE2's 200 — why keep it?"** For a ~1 KB file, tier I is one claim, **zero deploy txs, portable, bodies-in-state, one signature** — the deploy overhead of SSTORE2 (32k + a whole tx + the round-trip) dominates at small sizes, and I copies with the envelope for free. The crossover is roughly where `MAX_VALUE_BYTES` (8 KB) meets one SSTORE2 chunk (24 KB); ≤~8 KB → I is simpler and portable, above → S. **Flag:** exact crossover is UNMEASURED.

---

## 12. Open questions / flags for later phases

- **All gas numbers are UNMEASURED** — hand-derived from the opcode schedule. The pre-promotion gate is a gas snapshot (per codex discipline). Highest-value measurements: SSTORE2 chunk deploy (§3.2), streaming-verify per-chunk (§5.2), graph point read, tier-C verify-handed.
- **State-expiry / re-anchoring maintenance verb** — reserve an SDK "touch/resurrect" operation now; it is the only defense if The Purge ships. (Tier-2 — affects the permanence claim.)
- **Default-tier-by-size/use policy** — an SDK taste call with ecosystem-default stickiness; recommendation in §11. (Tier-2.)
- **Manifest placement** — folded into DATA body vs a separate reserved-key value claim: depends on whether `{totalSize,chunkCount,codec,chunksRoot}` (~40 B) fits the DATA body layout the kinds doc freezes. Confirm against codex-kinds' DATA body definition.
- **`chunksRoot` domain separation** — must use a distinct domain constant from the envelope's *records* root so a chunk leaf can never be confused with a record leaf (same collision-resistance argument as claimId vs objectId). Add `DOMAIN_CHUNK_LEAF` / `DOMAIN_CHUNKS_ROOT`.
- **SSTORE3 factory address is part of every chunk address** — it must be a canonical, hash-pinned, permissionlessly-deployable factory (same discipline as the kernel's CREATE2 canonicity), or chunk addresses diverge across chains and dedup/portability break. This factory joins the genesis manifest.
- **EOF timeline** — watch item; ADR-0059's multi-mirror redundancy is the standing mitigation. No action unless EOF schedules legacy-extcodecopy removal.
