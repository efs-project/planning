# Forward-compatibility & data-availability lens — riding the scaling roadmap without losing permanence

**Role:** "scalability will improve" — how EFS large-file upload gets cheaper as danksharding lands while permanence stays SOLID.
**Author:** forward-compat/DA designer. **Date:** 2026-07-07. Web evidence gathered July 2026; gas/latency numbers are **unmeasured estimates**, flagged inline.
**Designs within:** [[codex-envelope]] (chain-free EIP-712 Merkle envelope, `submit`/`submitSubset`, author-from-signature), [[codex-kinds]] (DATA object, `mirrors`/`contentHash`/`size` reserved keys), [[read-lens-spec]] (BYTES-UNAVAILABLE grade), [[efs-substrate-decision]] (§5 substrate-mortality item: blob pruning "never researched — the floor is an assumption"; this doc researches it).

---

## 0. Rulings (the TL;DR)

1. **The permanence anchor is a keccak-Merkle commitment in *state*, signed once. Bytes are transport; commitments are permanence. They are orthogonal axes and EFS must never conflate them.** A file's *identity + integrity* (its `contentHash` = Merkle root over chunks, carried in the DATA record body) is permanent and portable the instant the one-signature envelope is admitted on any chain — *independent of where the bytes physically live*. This is the invariant that every scaling change rides over unchanged.

2. **Blobs (EIP-4844) are the cheapest bytes-transport today and get monotonically cheaper/faster as danksharding lands — but they are AVAILABILITY, not STORAGE.** Blob sidecars are pruned at `MIN_EPOCHS_FOR_BLOB_SIDECARS_REQUESTS = 4096 epochs ≈ 18 days`, and **PeerDAS / full danksharding do NOT change this** — they scale *throughput* (blob count, sampling), never *retention*. Treating "posted to a blob" as permanence is the trap. Confronted head-on in §8.

3. **The design is "commit once, transport anywhere, promote to permanent."** One `eth_signTypedData_v4` over the manifest root authorizes an unbounded, permissionless, chunked/parallel/resumable byte-submission campaign (the kernel recovers author from signature and ignores `msg.sender`, so a relayer streams chunks with **no further user signatures**). Bytes upload cheaply via blobs *now*; a permissionless, **trust-minimized** promoter re-materializes them into a durable tier (SSTORE2-in-state / Arweave / EthStorage) *before the 18-day window closes*, verified against the author's signed root so the promoter cannot corrupt the file. As on-chain storage gets cheaper, the *same* committed file migrates up the permanence ladder with no re-signature.

4. **KZG is not on the permanence path.** keccak-Merkle is the commitment of record: portable, ~12× cheaper to verify than a point-eval (≈4k vs 50k gas — est.), no trusted-setup dependency, works on non-EVM replicas. A blob's native KZG commitment *can* be re-proven into state (BLOBHASH→SSTORE, later verify via the 0x0A point-eval precompile) but this yields a permanent *commitment*, never permanent *bytes*, and duplicates the keccak `contentHash` EFS already has. Record the KZG versioned hash only as an optional **proof-of-publication receipt** / blob-native R1 hook. Ruling in §5.

5. **External DA (Celestia/EigenDA/Avail) is rejected for both the permanence anchor and the default transport.** It is the same availability-not-permanence category as blobs, but *worse* for EFS: off-Ethereum, not contract-readable, and it adds a trust assumption (Celestia = another chain's consensus; EigenDA = a restaked DA-committee). It survives only as one more `mirrors` target for those who opt into that trust. §2.3.

6. **Forward-compat is already banked.** EIP-7907 (Fusaka, Dec 2025) raised the code-size limit 24KB→64KB with gas metering → SSTORE2 permanence got ~2.6× cheaper in chunk-count *this fork*. Blob count is on a published ramp 21→48→128/block. EFS captures both **for free** because the manifest is transport-agnostic — no Etched change. The only things EFS must NOT bake in are the ones that expire under the roadmap (§9): a hard code-size chunk constant, a blob-availability assumption, or a KZG/precompile dependency in the permanent read path.

Nothing here is fatal to the settled substrate. Everything is additive over the existing kernel semantics.

---

## 1. The frame: two orthogonal durability axes

Everything in this document falls out of one distinction the corpus half-states but never makes mechanical:

- **Commitment-durability** — how long the *cryptographic commitment* to the file (its `contentHash` Merkle root + `size` + author signature) survives and stays verifiable. In EFS this lives in **state** (the DATA record body, reachable via the enumeration spine / `getObject`). It is tiny (~32–100 bytes), permanent as long as *state* persists, portable (the chain-free signed envelope replays onto any chain), and costs **one signature**.
- **Bytes-durability** — how long the *actual file bytes* remain *retrievable* by someone. This is a separate, per-tier property with wildly different costs and lifetimes.

A file is **permanent** iff *(commitment in state)* AND *(≥1 bytes-tier still holds)*. The two axes are independent: you can have a permanent commitment with vanished bytes (a blob that nobody promoted → read grade BYTES-UNAVAILABLE, an honest graded state, never a broken file or a false-absent), or durable bytes with no on-chain commitment (a raw IPFS CID nobody signed → unverifiable, not EFS). **The mission property is that the commitment is always cheap, always in state, always portable; bytes-durability is a menu of independently-scored bets, LOCKSS-style.**

The critical, under-appreciated corollary for 2026: **EIP-4444 history expiry (live, partial, since July 2025) expires *history* — past blocks, transactions, receipts, and blob sidecars — but NOT *state*.** So the bytes-durability of each tier is set by *which structure it lives in*:

| Structure | Persisted by | Expiry regime (2026) | EFS tiers that live here |
|---|---|---|---|
| **State** (account/storage/code trie) | every full node, indefinitely | The Purge / state-expiry is *future & unscheduled* (Verkle + resurrection witnesses) — a watch item, not a 2026 reality | SSTORE2 chunk code; the `contentHash` commitment; SSTORE'd words |
| **History** (blocks, tx calldata, receipts) | shrinking: EIP-4444 → ~1yr then P2P/archival | **expiring now** | inline-calldata chunk bytes (commitment stays in state; *bytes* degrade to archival) |
| **Blob sidecars** | consensus nodes, **4096 epochs ≈ 18 days** | pruned by protocol; PeerDAS changes custody, not lifetime | blob-transport bytes |
| **Off-Ethereum** | that network's incentives | per-network | Arweave (endowment), EthStorage (proof-of-storage), IPFS (pin-lifetime), Celestia/EigenDA (DA-window) |

**Consequence that reframes the substrate doc's tier list:** "inline signed body in calldata (hash-in-state, portable)" is **not a bytes-permanence tier** post-EIP-4444 — it is a *commitment-permanent + bytes-archival* tier. The only tiers whose **bytes** are genuinely permanent are (a) **state** (SSTORE2) and (b) **a durable external mirror** (Arweave endowment / EthStorage proof-of-storage / a live LOCKSS mirror set). This is not a defect to hide; it is the exact thing the read-lens grades must (and do) express.

---

## 2. 2026 scaling status (the moving parts EFS rides)

### 2.1 EIP-4844 blobs — the cheap transport (a)

- **What:** a blob is 128 KiB (4096 field elements × 32 bytes; ~**124 KiB usable**, top byte of each field element reserved). Carried in a type-3 transaction, KZG-committed, **but the EVM never sees blob bytes** — execution can read only the 32-byte *versioned hash* (`0x01 ‖ sha256(commitment)[1:]`) via the `BLOBHASH` opcode (3 gas), and can verify evaluations via the point-eval precompile (§5).
- **Cost:** each blob burns `GAS_PER_BLOB = 2^17 = 131,072` blob-gas ⇒ **≈1.03 blob-gas per usable byte**, priced in a *separate* EIP-1559 blob-fee market historically ≪ execution gas. vs calldata at **40 gas/nonzero-byte** (EIP-7623 floor, live since Pectra May 2025) — so blobs are **~16–40× cheaper per byte** than calldata at equal gas price, and often far more when the blob market is quiet.
- **The 2026 wrinkle — EIP-7918 blob reserve price (Fusaka):** blob base fee is now floored relative to execution base fee, so blob data is **no longer effectively free** when the chain is busy; the post-Fusaka blob base fee spiked ~7 orders of magnitude off its old ~1-wei floor. Still the cheapest bytes-transport on Ethereum, but budget it as "cheap," not "free." *(Estimate; verify against a live blob-fee oracle at integration.)*
- **The lifetime:** sidecars pruned at **4096 epochs ≈ 18 days** (`MIN_EPOCHS_FOR_BLOB_SIDECARS_REQUESTS`). This is the whole permanence problem in one constant.

### 2.2 PeerDAS / danksharding roadmap — throughput scales, retention does not (b)

- **Fusaka (Dec 3 2025)** shipped **PeerDAS (EIP-7594)**: data-availability sampling so not every node downloads every blob (nodes custody *columns*). This *unlocks safe blob-count scaling*; it does **not** change the 18-day retention.
- **Blob-count ramp (published, verified):** pre-Pectra 3/6 (target/max) → Pectra 6/9 → **BPO1 (Dec 9 2025) 10/15** → **BPO2 (Jan 7 2026) 14/21** → core-dev target **48/block by mid-2026** → **128/block under full danksharding** (years out; Glamsterdam is the next fork, 2026; full DAS is "The Surge," ongoing).
- **Throughput I can compute** (128 KiB/blob, 12s slots): today ~21 blobs ⇒ ~2.6 MiB/slot ⇒ **~0.22 MB/s ≈ 19 GB/day**; mid-2026 target 48 blobs ⇒ **~0.5 MB/s ≈ 44 GB/day**; danksharding 128 blobs ⇒ **~1.4 MB/s ≈ 118 GB/day**. This is the rate at which EFS can push file *bytes* through the blob pipe — and it **~6×'s over the roadmap with zero EFS change.**
- **The load-bearing fact for permanence:** none of this touches retention. Danksharding makes the *transport* a firehose; the *bytes still evaporate in 18 days*. Scaling is a transport gift and a permanence non-event.

### 2.3 External DA — Celestia / EigenDA / Avail (c): rejected for anchor & default

March-2026 numbers (commentary sources, treat as order-of-magnitude): **Celestia ≈ $0.35–0.45/MB**, DAS-verifiable, ~1.33 MB/s; **EigenDA** much cheaper at volume (~$730/yr for 100 MB/day vs Celestia ~$12.8k) but is a **restaked DA-committee (DAC)** — availability rests on committee honesty, not sampling; **Avail** targets neutral multichain coordination.

Why EFS rejects them as anchor and as default transport, and keeps them only as opt-in mirrors:
1. **Same category as blobs** — availability with a retention/liveness window, not permanent storage.
2. **Strictly worse for EFS than Ethereum blobs:** off-Ethereum (not in the state EFS's R1 consumers can read), and **it adds a trust assumption** EFS's mission ("no trusted intermediaries; credibly neutral") specifically refuses — Celestia = trust another chain's consensus + a bridge; EigenDA = trust a restaking committee. Ethereum blobs inherit Ethereum's own DA with no added trust.
3. **No permanence upside** to justify the trust cost. If you're going to delegate bytes-durability to an external network, **Arweave** (pay-once endowment, genuinely permanence-shaped) or **EthStorage** (proof-of-storage over promoted blobs, §7) dominate a DA layer for EFS's use.

**Verdict:** external DA appears in EFS only as another `mirrors` reserved-key edge for writers who explicitly opt into that trust for that file. It is never the anchor and never the default upload path.

---

## 3. The transport design

### 3.1 Two-level Merkle: keep file bytes OUT of the kernel spine

The kernel's envelope Merkle tree is over **records** (`Record{op,kindTag,body}`), signed once as `recordsRoot`. A large file must **not** be encoded as millions of chunk-leaves in that tree — that would bloat the enumeration spine (bodies-in-state) to O(filesize) and make every full node store the file in the record trie. Instead:

- **Level 1 (kernel, signed, O(1) records):** one **DATA** record. Its body carries `contentHash` = **the file-chunk Merkle root**, plus `size`, `contentType`, `contentEncoding` (§6), and `mirrors`. The one envelope signature covers `recordsRoot` ⊇ this DATA leaf ⊇ `contentHash`. *The file's whole identity is this one ~100-byte record in state.*
- **Level 2 (transport, off-spine):** the **chunk bytes**, chunked at the transport tier's natural size, each verifiable against `contentHash` by an O(log N) keccak-Merkle proof. Chunks live in a **chunk store** (SSTORE2 code / calldata / blob), addressed by **CREATE2** so addresses are known before mining (parallel deploys, no cross-tx mined-dependency — deterministic-ids property). Reads paginate chunks (the **EIP-7617** lineage from v1) and verify each against `contentHash`.

This keeps spine cost **O(1) per file**, makes `getObject`/`getSlot` reads point-shaped, and means the "1 signature" covers an arbitrarily large file because it signs the *root*, not the bytes.

### 3.2 The one-signature permissionless streaming campaign (the whole ask)

The kernel already delivers the "one signature, chunked/parallel/resumable behind it" requirement — this design just *names the pattern*:

1. **Sign once.** Author computes `contentHash` client-side over the (optionally compressed, §6) chunk set, builds the DATA record, signs the envelope root with one `eth_signTypedData_v4`. *No chainId in the domain → this authorization is valid on every chain at once.*
2. **Stream permissionlessly.** Because `submit`/`submitSubset` recover author from the signature and **ignore `msg.sender`**, a relayer / pinning service / the author's own background worker submits chunk-bearing transactions across many blocks **with no additional user signatures**. Each chunk-store deploy or calldata batch stands alone.
3. **Parallel.** CREATE2 chunk-store addresses are pre-computable, so N chunk deploys have no ordering dependency and fan out across the mempool concurrently.
4. **Resumable / idempotent.** `submitSubset` "skips already-admitted claimIds (monotone replication)"; a crashed or partial upload resumes by submitting **only the missing chunks** — re-submitting an admitted one is a no-op. There is no upload session, nonce, or lock to lose. A file half-uploaded is a *graded partial* (§3.4), never a corrupt state.

This is the cypherpunk floor made concrete: the author can self-submit every chunk from their own wallet (censorship floor), *or* hand the signed manifest to any relayer and pay nothing further. Same mechanism; the only difference is who pays gas.

### 3.3 The transport tiers (all bind to the same signed `contentHash`)

Pick per economics and permanence need; the commitment is identical across all of them, so a file can even use several at once (LOCKSS redundancy) or migrate between them over time.

| Tier | ~Cost/byte (unmeasured) | Bytes live in | Bytes-durability | Contract-readable (R1)? | Portable? | Auto-cheapens with roadmap? |
|---|---|---|---|---|---|---|
| **T-BLOB** | ~1 blob-gas/byte (separate market, EIP-7918 floor) | blob sidecar | **18 days** then gone | No (EVM can't see blobs) | Bytes yes, commitment yes | **YES — blob count 21→48→128, DAS** |
| **T-CALLDATA** | ~40 gas/byte (EIP-7623 floor) | history | ~1yr → archival/P2P (EIP-4444) | No (post-tx) | **Yes** (signed bytes = calldata) | Indirectly (L2 DA via blobs) |
| **T-SSTORE2** | ~200 gas/byte + deploy overhead | **state** (code) | **permanent** (as long as state) | **Yes** (EXTCODECOPY) | No (redeploy per chain) | **YES — EIP-7907 24→64KB chunks** |
| **T-MIRROR** | external ($ per network) | Arweave / EthStorage / IPFS / on-chain `data:` | per network (Arweave≈permanent) | No | Yes (URI travels) | per network |

Default decision tree the SDK should encode (economics/SDK owns the final policy per the memory boundary; this is the shape):
- **Small file (≤ a few KB):** inline in the envelope's `submit` calldata — one tx, commitment + bytes both landed, done. Simplest; no promote race.
- **Contract-readable file (NFT metadata / dapp records — the 2 R1 app categories):** **T-SSTORE2** chunk store — permanent bytes *in state*, EXTCODECOPY-readable, EIP-7617 paginated. EIP-7907 makes this ~2.6× cheaper in chunk-count than v1.
- **Large file (MB–GB), cheap-upload priority:** **T-BLOB now → promote later** (§4), and/or a **T-MIRROR ar://** edge for immediate external permanence at $-cheap.
- **Any file:** as many `mirrors` edges as the writer wants — each an independent survival bet.

---

## 4. The promote pattern — "upload cheaply via blobs now, pin to permanent later"

This is the core deliverable: how to get blob-cheap upload *and* SOLID permanence, and how the read layer stays honest across the lifecycle.

**Lifecycle of a large file uploaded via blobs:**

```
t=0        Author signs manifest (1 sig). contentHash + size + mirrors → DATA record in STATE (permanent commitment).
           Relayer posts file bytes as blobs (T-BLOB, cheapest). Optionally kernel records blob versioned hashes
           (BLOBHASH→SSTORE) as a proof-of-publication receipt (§5).
           STATE: commitment permanent. BYTES: available for 18 days, keccak-verifiable against contentHash.
           READ GRADE: LIVE claim, bytes-present-but-ephemeral (venue-qualified; see §4.1).

t∈(0,18d]  PROMOTION (permissionless, trust-minimized, no re-signature):
           any promoter — author's worker / paid pinning service / self-interested reader / LOCKSS volunteer —
           fetches blob bytes, keccak-verifies each chunk against the AUTHOR'S signed contentHash, and re-submits
           to a durable tier:  → T-SSTORE2 (bytes into state, contract-readable)   and/or
                               → T-MIRROR ar:// / web3://EthStorage (external endowment / proof-of-storage).
           Because promotion is verified against the signed root, the promoter CANNOT corrupt the file:
           a wrong byte fails the Merkle check and is rejected. Promotion adds a `mirrors` edge / chunk store;
           it never needs the author.

t>18d      Blob pruned. File served from the promoted tier(s).
           If promoted:      READ GRADE: LIVE, permanent. Done. SOLID.
           If NOT promoted:  commitment survives (permanent, verifiable), bytes gone →
                             READ GRADE: BYTES-UNAVAILABLE ("authentic pointer, bytes absent here"; a GATE read
                             requiring bytes fails closed). Honest graded state. Never a broken file, never false-absent.
```

**Why this is the right shape:**
- **Trust-minimization is the unlock.** The author signs the *content*, not a location. Any stranger can move the bytes between tiers and the kernel/reader re-verifies against the author's signature — so promotion, mirroring, and cross-chain replication are all **permissionless and safe**. This is LOCKSS ("Lots Of Copies Keep Stuff Safe") with cryptographic integrity: copying only ever *adds* truth.
- **Forward-compatibility is banked at the commitment.** The file's permanent identity is fixed at t=0 at *permanent + portable + cheap*. As on-chain storage gets cheaper (bigger blocks, EIP-7907-style code raises, future state-cost cuts, L2 DA collapse), the *bytes* can be promoted up the permanence ladder **later, by anyone, with no re-signature**. A file uploaded blob-cheap in 2026 can be promoted into L1 state permanence in 2030 when it's affordable — same `contentHash`, same signature. **This is exactly "scalability will improve and I want on-chain files to be SOLID": bank the commitment now, migrate the bytes up as the floor drops.**
- **The 18-day window is a promotion SLA, not a permanence claim.** EFS's honest guarantee is: *commitment permanent immediately; bytes permanent iff promoted within the window or mirrored*. The window is generous (18 days is a long time for an automated promoter) and the read layer never lies about which state a file is in.

**Who promotes (economics/ops boundary — noted, not over-designed):** default = the author's own SDK client runs promotion as a background job right after the cheap blob upload (best UX: instant cheap upload, permanence lands minutes later). Alternatives: a paid pinning service; a self-interested reader who wants the file to persist; a bounty/escrow ("promote-and-prove within 18d, claim reward") if James later wants a stronger-than-best-effort guarantee. All are permissionless; none change the kernel. **This hands off cleanly to the SDK/economics lens.**

### 4.1 Read-grade integration (works with [[read-lens-spec]], one proposed refinement)

The read-lens already has the exact grade this needs: **BYTES-UNAVAILABLE** — "claim authenticated, payload bytes unfetchable at this venue... a GATE read requiring bytes fails closed." That covers the post-prune-not-promoted case perfectly. Two additions I recommend, both additive to the closed vocabulary (Codex-revision, not reader-invented):
- **A partial/streaming disposition for chunked files:** a file whose chunk `i` fails to fetch/verify reads as **BYTES-UNAVAILABLE at chunk granularity** (byte range [i·C, …) absent), so a media player can render the available prefix and a downloader can report "N% retrievable, verified," never a false "file absent" or a silent truncation. This is the "partial/incomplete file reads as a graded state" mandate made mechanical at chunk resolution.
- **An ephemeral-transport currency flag:** bytes served *only* from a T-BLOB source inside the 18-day window should render at a currency ceiling below plain-LIVE (e.g. `LIVE @ EPHEMERAL-BYTES(expires ≈ epoch+4096)`) so a reader/UX knows "this will vanish unless promoted." Mirrors the existing venue-qualified currency machinery (AS-OF(N)/UNKNOWN-CURRENCY); it decorates the *bytes* dimension the way currency decorates the *revocation* dimension.

---

## 5. KZG vs Merkle for chunked files (e) — ruling: keccak-Merkle is the commitment of record

**The mechanism exists and is real:** a contract can verify blob-native data on-chain. `BLOBHASH i` (3 gas) returns the versioned hash of the i-th blob *in the current tx*; the **point-evaluation precompile 0x0A** (50,000 gas) verifies a KZG proof that the polynomial committed by that versioned hash evaluates to `y` at point `z`. So to make a blob's KZG commitment permanent: capture `BLOBHASH` in the carrying tx and `SSTORE` it (32 bytes → state). Thereafter — **even after the blob is pruned** — a contract can verify "field-element i of blob B = these bytes" by point-eval against the stored commitment, given the opening proof. *This is the "re-prove a KZG commitment into kernel state" capability the brief asks about, and yes, it works.*

**But it does not belong on EFS's permanence path.** Ruling, with the reasoning:

1. **It makes a permanent *commitment*, never permanent *bytes*.** Re-proving KZG into state stores a 32-byte pointer; verifying a chunk still requires someone to supply the bytes + opening. It is a *commitment* tier, and EFS **already has** a commitment tier that is strictly better for its purposes: the signed keccak `contentHash`.
2. **keccak-Merkle is cheaper to verify.** A keccak-Merkle chunk proof on even a million-chunk file is ~log₂(10⁶)=20 node-hashes ≈ **~4k gas** (est.) incl. ecrecover; point-eval is **50k gas flat**. KZG's O(1) proof size is not a gas win here — keccak wins by ~12×.
3. **keccak-Merkle is portable and dependency-light; KZG is neither.** KZG carries a **trusted-setup** (powers-of-tau) dependency and requires the **0x0A precompile** — an EVM feature that is chain-version-bound and absent on non-EVM replicas. The composability research's explicit **AVOID** is "never place a proof vendor, circuit, or chain-version-bound Merkle format in a permanent read or replication path." KZG-point-eval *is* a chain-version-bound verification format. keccak is a plain hash available on every VM for the 100-year horizon.
4. **Cross-commitment equivalence is the hidden cost.** The EVM cannot keccak-hash a blob (it never sees blob bytes) — so a blob's KZG commitment and EFS's keccak `contentHash` are two commitments to the same bytes with **no cheap on-chain proof they agree** (that's a ZK-equivalence or bytes-in-calldata problem). If EFS verified chunks via KZG, it would have to make KZG the *authoritative* commitment (abandoning keccak portability) or eat the equivalence cost. Neither is worth it.

**Where KZG earns its keep (optional, transport-tier only):**
- **Proof-of-publication receipt.** Recording the blob versioned hash in state (BLOBHASH→SSTORE at upload) gives an on-chain, permanent attestation that "a blob with commitment C was included in block B" — and under PeerDAS, on-chain inclusion means the network's DAS *guaranteed availability at that time*. That is a meaningful "the upload really happened and was retrievable for 18 days" receipt, useful for promotion accountability/bounties. It is **not** permanence; it is a timestamped availability proof.
- **Blob-native R1 hook.** For the niche where an on-chain consumer wants to verify blob-delivered chunks *without* the bytes in calldata (e.g. a contract accepting a KZG opening), the stored commitment + point-eval is the tool. Field-element-to-byte-range layout (z = ωⁱ over roots of unity, evaluation form) is fiddly but doable.

**Net:** keccak-Merkle `contentHash` is THE commitment. KZG is the blob's free transport checksum, optionally banked in state as a receipt. EFS does not verify file chunks via point-eval on the permanence path.

---

## 6. Compression + dedup (f)

Both are client-side + a content-addressed chunk store; both reduce every tier's cost linearly; both are forward-compatible (no Etched change).

- **Compression:** compress the file (zstd/brotli/gzip) *before* chunking and hashing, so `contentHash` commits to the compressed bytes and every transport tier pays for fewer bytes. Declare the codec in a **`contentEncoding` reserved-key** (permissionless key-TAGDEF extension is already blessed in [[codex-kinds]]; `contentEncryption` already exists as sibling precedent). A reader decompresses after chunk-verification. Compression is pure win on cost and neutral on permanence (the commitment is over whatever bytes you chose).
- **Dedup via per-chunk content addressing:** key the chunk store by `keccak(chunkBytes)` (a content-addressed store, CAS/IPFS-shaped). Then **identical chunks across different files store once** — the second file's manifest references the same chunk hash and pays **zero** incremental storage for shared blocks. This is high-value for versioned files (a 1-byte edit re-stores one chunk, not the file), package registries (shared dependencies), and web archives (shared assets). The DATA `contentHash` Merkle root references chunk-hashes; a chunk-registry `getChunk(hash)` point-lookup serves both dedup and the R1 read. Content-defined chunking (Rabin/FastCDC, variable boundaries) maximizes cross-file overlap vs fixed-size chunks — a client-side choice the manifest is agnostic to.
- **Interaction to flag:** compression *reduces* dedup opportunity (compressed blocks diverge on small edits) — so the SDK should choose per-use-case (compress-then-chunk for cold archives that won't be diffed; chunk-then-optionally-compress-per-chunk for versioned/diffable content). Client policy; the manifest supports both.

---

## 7. EIP-170 raise + storage-EIP roadmap (g)

- **EIP-7907 (shipped in Fusaka, Dec 2025):** raises the contract **code-size limit 24 KB → 64 KB** and initcode 48 KB → 128 KB, with **gas metering (2 gas/word) above 24 KB** to price the DoS risk EIP-170 originally blocked. *(Final constants were still being tuned late — a "reduce limit / raise per-word cost" revision existed; verify the exact number at integration, but the direction — bigger metered code — is firm and shipped.)* **Direct EFS impact:** an SSTORE2 chunk can now hold ~64 KB instead of ~24 KB → **~2.6× fewer chunks and deploy-txs per file** → materially cheaper T-SSTORE2 permanence and shorter upload campaigns. Amendment 8 of [[codex-kernel]] already treats EIP-170 as a live now-gate ("compile a representative skeleton immediately"); the *chunk-store* sizing should read the limit at deploy time, **never hard-code 24576** — the constant just moved and will move again.
- **EIP-4444 history expiry (live, partial, since July 2025):** clients drop ~300–500 GB of pre-merge history; target ~1-year retention then P2P/archival. **This is the fact that demotes T-CALLDATA from a bytes-permanence tier to a commitment-permanent + bytes-archival tier** (§1). It does **not** touch state, so T-SSTORE2 and the `contentHash` commitment are untouched. The kernel's "bodies-in-state / from-state-alone reconstruction" pledge is *why* the DATA record (commitment) survives EIP-4444 while raw calldata bytes do not — this is a feature of putting the commitment in state, and it should be stated as such.
- **EthStorage (live, mainnet alpha):** decentralized key-value storage L2 that **captures blobs before pruning and holds them long-term with zk proof-of-storage challenges + a P2P layer that syncs expired blobs** — i.e. it is the "promote blobs to permanent" pattern *productized*, and it is **web3://-native** (ERC-4804; QuarkChain/EthStorage team). This is a first-class **T-MIRROR** target: a `mirrors` → `web3://…` (or `es://`) edge points at EthStorage-held bytes, verifiable against `contentHash`. EFS should reference it as both a reference design for the promote pattern and a ready-made durable tier — *without* taking a hard dependency (it's a young L2 with its own token/provider trust; it's a mirror bet, not the anchor).
- **Arweave:** the one genuinely permanence-shaped external tier (pay-once endowment; ~$20–50 for 10 GB per the substrate doc vs ~$490k L1 calldata). Best default T-MIRROR for large cold archives *today*, pending on-chain storage getting cheap. `mirrors` → `ar://…`, verified against `contentHash`.
- **State expiry / The Purge (future, unscheduled — WATCH ITEM):** the one thing that could eventually threaten T-SSTORE2 bytes-in-state permanence. Verkle/binary-tree state + state-expiry with resurrection witnesses is on the very-long-horizon roadmap. Not a 2026 reality, and the planned designs keep expired state *resurrectable* via witnesses (not deleted-forever). EFS's answer is already correct-by-construction: **replication** (the same file's bytes on multiple chains + mirrors) is the LOCKSS hedge, and the portable commitment means resurrection/rehydration is always possible from any surviving copy. Track it; don't architect around it yet.

---

## 8. Confronting the blob-pruning permanence trap head-on

The brief demands this be faced squarely. Here it is, unhedged:

**Blobs and every DA layer are AVAILABILITY, not STORAGE. If EFS ever tells a user "your file is permanent because it's in a blob," EFS is lying, and the lie has an 18-day fuse.** The failure is silent and total: the transaction succeeds, the file reads fine for 18 days, demos pass, and then — with no error, no event, no on-chain trace of the bytes — the file's bytes are gone forever while the pretty on-chain record still points at them. This is the single most dangerous footgun in the whole large-file design, precisely because it *works in the demo*.

**PeerDAS and full danksharding do not fix this — they make it worse-shaped.** They scale blob *throughput* 6× and drive per-byte cost down, which makes blobs an even more tempting place to "store" files, while the retention window stays pinned at 18 days. The better the transport gets, the louder the trap. External DA (Celestia/EigenDA) is the same trap wearing a different logo, plus a trust assumption.

**The design refuses the trap by construction, in four moves:**
1. **Never conflate the axes.** The permanent thing is the *commitment in state* (always, one signature). Blobs carry *bytes*, which are explicitly, in the type system and the read grades, a separate and expiring thing.
2. **Make promotion the named, first-class bridge** — permissionless, trust-minimized, no re-signature — so "get the bytes to permanence" is a well-defined action any party can take within a generous window, not an afterthought.
3. **Make the read layer tell the truth.** A committed-but-unpromoted file reads **BYTES-UNAVAILABLE** ("authentic pointer, bytes absent"), and a GATE read fails closed. The system never serves a false "present" or a false "absent"; it serves the honest graded state (§4.1). *The blob-pruning outcome is a documented, gradeable state, not a corruption.*
4. **Bank permanence at the cheapest permanent tier available at upload, in parallel.** The recommended default is *not* "blob and hope" — it's "blob for instant cheap UX **and** immediately kick off promotion to SSTORE2/Arweave," so the permanent copy lands minutes later and the 18-day window is pure slack. Blob-only-no-promotion is a *conscious, graded, best-effort* choice (fine for scratch/ephemeral data), never the silent default.

The honest one-sentence guarantee EFS can stand behind for 100 years: **"Your file's identity and integrity are permanent and portable the instant you sign; its bytes are as durable as the most durable tier you (or anyone) placed them in, and the system will always tell you truthfully which tiers still hold."**

---

## 9. Forward-compatibility ledger

**Auto-improves with the roadmap, zero EFS change (because the manifest is transport-agnostic):**
- Blob-count ramp 21→48→128/block → T-BLOB upload throughput ~6×'s and per-byte cost falls.
- PeerDAS/DAS → cheaper, safer blob availability.
- EIP-7907 code raise → T-SSTORE2 chunks get bigger/cheaper (already banked this fork).
- L2 DA-cost collapse (rollups on cheaper blobs) → on-chain large-file permanence on L2s becomes affordable first; portability means the commitment still lives everywhere.
- Future on-chain-storage cost cuts → deferred promotion into state becomes cheap, and already-committed files migrate up with no re-signature.

**Must NOT bake in (each expires under the roadmap):**
- ❌ A hard 24576 code-size chunk constant (EIP-7907 already moved it; read it at runtime).
- ❌ Any assumption that blob bytes persist (18-day fuse).
- ❌ KZG/point-eval in the permanent read/replication path (trusted setup + precompile + non-portable).
- ❌ External-DA or any single mirror as the permanence anchor (trust + liveness window).
- ❌ Encoding file bytes as kernel record-leaves in the enumeration spine (O(filesize) state bloat; use the two-level Merkle, §3.1).

**Watch items (track, don't architect around):**
- State expiry / The Purge (the only threat to bytes-in-state permanence; resurrection-witness designs keep it recoverable; replication is the hedge).
- EIP-7918 blob reserve-price dynamics (blobs no longer ~free; keep the cost model live).
- EIP-7907 final constants (still settling late).
- L1SLOAD/RIP-7728-class precompiles (could let L2s read an L1 commitment near-natively; proposal-stage; softens replication for the L2 tier only — a 2027+ maybe).

---

## 10. Trying to break my own proposal (adversarial self-review)

- **"The BYTES-UNAVAILABLE outcome means large-file permanence is best-effort, so EFS hasn't actually solved on-chain files."** Partly conceded, and it's the honest truth of 2026 physics: **10 GB of genuinely-in-state bytes costs ~$490k on L1 today** (substrate doc; my calldata estimate ≈ 4×10¹¹ gas concurs) — nobody's design makes that cheap this year. What EFS *can* and *does* solve now: permanent+portable *commitment* for one signature, blob-cheap *upload*, trust-minimized *promotion* to whatever permanent tier is affordable (Arweave $20–50 today; L1 state later), and a read layer that never lies about which holds. The claim is not "10 GB in L1 state is cheap today"; it's "the architecture banks permanence at the commitment now and lets bytes ride the cost curve down." That is the strongest *true* claim available, and it degrades honestly.
- **"Promotion is best-effort — a lazy author's file dies at 18 days."** True, and it's the right default-risk to surface, not hide. Mitigations are all available and non-fatal: SDK auto-promotes by default; mirror-at-upload (Arweave) sidesteps the window entirely; a bounty/escrow can harden it if James wants better-than-best-effort. The floor case (nobody promotes) is a *graded* loss of bytes with a surviving commitment, not a corruption.
- **"Why not just always Arweave and skip blobs?"** Arweave is a fine default for cold archives *today*, but (1) it's an external trust/endowment bet, not on-Ethereum credibly-neutral state, and not R1-contract-readable; (2) it doesn't ride Ethereum's scaling curve; (3) blobs give a censorship-resistant, no-added-trust, self-submittable cheap-upload path and a DAS-backed publication proof. The design keeps *both*: blob transport + Arweave/EthStorage/SSTORE2 as promotion targets. Not either/or.
- **"BLOBHASH only sees current-tx blobs — can a later, separate tx record the commitment?"** No — the versioned hash must be captured in the *same* tx that carries the blob (SSTORE it then). This is a minor SDK sequencing constraint (the receipt-recording must ride the upload tx), not a blocker, and it's optional anyway (receipts are transport-tier, not permanence).
- **"Two commitments to the same bytes (keccak `contentHash` + KZG versioned hash) can disagree."** They can if the client is buggy/malicious — but the keccak `contentHash` is the *only* authoritative one; the KZG receipt is advisory. A disagreement just means the receipt is worthless for that file; the file's integrity is still fully defined by the signed keccak root. No kernel concern.
- **"Does the two-level Merkle break `submitSubset` streaming?"** It changes *what* streams: chunk bytes go to the chunk store (CREATE2/calldata/blob) verified against the DATA body's `contentHash`, **not** as envelope leaves via `submitSubset`. `submitSubset` still streams *records* (e.g. multi-file batches, mirror edges). This is a clarification the chunk-store spec must state explicitly so nobody tries to encode a GB file as a billion envelope leaves.
- **Residual honest unknowns:** (1) all gas/cost/throughput numbers are **unmeasured** — a gas snapshot must replace them before any ADR cites them; (2) EIP-7907's final constant; (3) live blob-fee-market pricing under EIP-7918 (needs an oracle, not a guess); (4) whether the two read-grade refinements in §4.1 are worth the closed-vocabulary expansion — a read-lens-owner call.

---

## 11. What this asks of the other lenses / next phases

- **Kernel/contracts:** a `contentEncoding` reserved key; a content-addressed **chunk store** view contract (CREATE2-addressed, EIP-7617-paginated reads, keyed by `keccak(chunkBytes)` for dedup) with a runtime-read code-size limit (no hard 24576); an *optional* blob-receipt slot (SSTORE the versioned hash). All additive; none touch the Etched envelope.
- **Read-lens:** ratify (or reject) the two §4.1 refinements — chunk-granular BYTES-UNAVAILABLE and the EPHEMERAL-BYTES currency flag.
- **SDK/economics:** owns the upload decision tree (§3.3), the default auto-promote job, and any bounty/escrow for stronger-than-best-effort promotion. This is the natural home for the "who pays / who promotes" question — flagged, not designed here, per the EFS-SDK-boundary doctrine.
- **James, one ruling worth surfacing:** is best-effort promotion (with SDK auto-promote + mirror-at-upload as the safety nets) an acceptable *default* permanence guarantee for v2, or does the hackathon/mission bar want a hardened promote-or-bounty path in-scope now? My recommendation: ship best-effort + auto-promote as the floor (it's honest and the read grades cover it); reserve the bounty mechanism as a named, additive Phase-N add — do not block v2 on it.
