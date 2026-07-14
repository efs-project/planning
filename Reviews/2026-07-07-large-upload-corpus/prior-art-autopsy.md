# Prior-art autopsy: "one authorization, chunked large-data onboarding"

**Role:** copy/avoid autopsy of prior art for EFS v2 large on-chain file uploads.
**Question:** how do the systems that already onboard large data under *one* authorization actually work — how is authorization amortized over many chunks, how is inclusion/integrity proven, how do they resume, who pays, and what is permanent — and which patterns should EFS copy vs avoid.
**Date:** 2026-07-07. Web evidence gathered July 2026; per-source staleness flagged inline. All gas/latency numbers are **UNMEASURED estimates** unless a primary source is cited.

---

## 0. Executive verdict

1. **EFS's envelope already IS the right primitive.** Every serious "one authorization, many chunks" system converges on the identical shape: **commit a Merkle ROOT over chunk hashes once; then submit chunks independently, each carrying an O(log N) inclusion proof against that pre-committed root; anyone may submit; the receiver verifies chunk-against-root with zero trust in the submitter.** EFS's EIP-712 `Envelope(author, seq, prev, recordsRoot, count)` — one signature over `recordsRoot`, per-leaf single-proof verification, author-recovered-from-signature-so-anyone-relays — is *exactly this pattern*. The autopsy's dominant finding is a validation, not a redesign: the closest production analog (Arweave native transaction chunking) is nearly 1:1 with the envelope, and BitTorrent v2, IPFS UnixFS, and Filecoin PDP are the same tree-root-over-chunks idea in different clothing.

2. **There are exactly two archetypes, and EFS picked the right one.** (a) **Root-signed / manifest-first** — Arweave native tx (`data_root`), BitTorrent (`pieces root` under an infohash), IPFS (root CID), EFS envelope: the whole file's chunk-tree root is committed *up front* in one signed/content-addressed object; every chunk is self-verifying against it from the first byte; the file's *identity exists before a single byte is submitted*. (b) **Session-handle / manifest-last** — S3 multipart (`UploadId` → parts → `CompleteMultipartUpload`), tus (creation → PATCH offset → done): a coordinator mints a session id, you push parts, and the object's identity + integrity are only settled at a *finalize* step whose authority is the server. **Copy archetype (a) for the trust layer; steal archetype (b) only as the developer-experience shell (initiate/parts/complete, parallel, resume) — never its trust model.**

3. **Copy ranking (detail in §4):** (1) Arweave `data_root` chunk-submission — the reference implementation of EFS's own idea, plus the `chunk_proof_ratio` anti-spam floor EFS is missing; (2) ANS-104/Turbo delegated-payment settlement — the author-signs / funded-relayer-pays-and-submits split, which is EFS's `msg.sender`-ignored lever already; (3) S3/tus UX shell — upload-id, idempotent parts, parallel, stateless resume; (4) BitTorrent v2 per-piece verify + partial-as-graded-state — feeds the read-lens; (5) IPFS CAR as a portable transport container; (6) Filecoin PDP's *challenge-a-random-leaf-against-the-root* as a mirror-liveness **audit** (not a write path) + PoDSI sub-piece inclusion for relayer batching.

4. **Avoid ranking (detail in §5):** (1) IPFS/UnixFS **CID non-determinism** — chunk size, chunker, DAG layout, and leaf encoding all change the root for identical bytes; fatal to EFS's deterministic-ID mission unless every chunking parameter is frozen (the envelope's pinned Merkle rules are the defense — do not import UnixFS "optionality"); (2) EthStorage/EIP-4844 **blob ephemerality mistaken for permanence** — blobs are pruned (~18 days); a permanent commitment to vanished bytes is the opposite of the mission; (3) Filecoin **deal/SP/renewal/slashing economics as the source of truth** — that is a paid service market with trusted providers and expiring deals, not permanence and not credibly neutral; (4) ANS-104 **per-item signing applied to a single large file** — it would demand N signatures for N chunks, defeating the whole goal (ANS-104 signs *each* data item; that is correct for multi-author batching, wrong for one-file-many-chunks); (5) S3/tus **finalize-gate visibility** — needing a trusted coordinator to flip a file from invisible to readable reintroduces exactly the intermediary EFS exists to remove.

5. **The forward-compatibility answer falls straight out of archetype (a):** the signed root is **carriage-independent**, so future scaling (bigger blocks, 4844 blobs, danksharding/PeerDAS) changes only the *submission rail* — bigger chunks, blob-carried chunks, more parallel CREATE2 deploys — while the authorization, the file identity, and the ID math never move. Permanence is never traded for scale because permanence lives in the root + the tier that lands bytes in state, and scale lives in the swappable rail.

---

## 1. The unifying pattern and the two archetypes

Every system in scope decouples **one O(1) authorization** from **N submission transactions** whose count is forced by `ceil(file_size / per_block_capacity)`. They differ only in *what the one authorization is* and *when integrity binds*.

| System | The "one authorization" | Chunk granularity | Integrity binds… | Trust in submitter |
|---|---|---|---|---|
| **Arweave native tx** | 1 signature over `data_root`+`data_size` | 256 KiB | …up front (chunk proven vs `data_root`) | none |
| **BitTorrent v2** | infohash = hash of info dict containing per-file `pieces root` | piece (power-of-two ≥16 KiB) | …up front (piece proven vs root) | none |
| **IPFS UnixFS** | root CID (self-certifying hash of DAG) | 256 KiB default | …up front (block proven vs its CID) | none |
| **EFS envelope** | 1 EIP-712 sig over `recordsRoot` | record leaf (and, one tier down, file chunk) | …up front (leaf proven vs `recordsRoot`) | none |
| **Filecoin PDP** | `ProofSet` = on-chain array of Merkle roots | leaf (32 B challenged) | …up front for inclusion; ongoing for possession | provider is trusted, audited by challenge |
| **ANS-104 bundle** | N *per-item* signatures + 1 settlement tx | data item (whole payload) | …per item (each item self-signed) | none per item; payer trusted for *inclusion*-in-block only |
| **S3 multipart** | `UploadId` (server-minted session) | part (5 MiB–5 GiB) | …at `Complete` (server assembles, ETag = server MD5) | **server fully trusted** |
| **tus** | upload URL (server-minted) | PATCH byte range | …never cryptographically; server holds bytes | **server fully trusted** |

**Archetype A (root-signed / manifest-first):** Arweave native, BitTorrent, IPFS, EFS. The root is the name *and* the integrity anchor *and* the authorization, all at once. A chunk is verifiable the instant it arrives, by anyone, against a value fixed before the first byte moved. Resumption, parallelism, and relaying are trivial because chunks are idempotent and self-verifying.

**Archetype B (session-handle / manifest-last):** S3, tus. A coordinator issues a mutable session; identity and (weak) integrity are settled at a finalize step the coordinator controls. Superb DX, zero neutrality: the file does not exist until the server says so, and "integrity" is the server's own checksum.

**EFS lives in A and should stay there.** The correct use of B is to *dress A in B's clothes* — expose an initiate/parts/complete SDK surface over a root-signed core, so app developers get the S3 ergonomics they expect while the trust model stays cypherpunk.

---

## 2. The load-bearing clarification for EFS: two Merkle trees, not one

A single insight makes all of this prior art copyable **without reopening the etched envelope**:

- **Tree 1 — `recordsRoot` (envelope, ETCHED).** Leaves are *records* (TAGDEF/DATA/LIST/PIN/TAG/…). One signature. Frozen rules: positional, index-committed leaves, domain-separated hashes, odd-node promotion, **single-leaf proofs only** (multiproofs excluded — OZ CVE precedent), N=1 root = wrapped leaf digest (codex-envelope §"Merkle"). This tree is the *authorization + record-admission* path and is safety-critical.
- **Tree 2 — `chunkRoot` (file body, NOT yet frozen).** Leaves are *file chunk hashes*. Its root is a **value carried inside a record** — a DATA record or a reserved-key chunk-manifest — which is itself a leaf of Tree 1. Verifying a chunk against `chunkRoot` happens in the **storage-tier contract** (the SSTORE2 chunk-store / calldata verifier), a *different* verifier from the envelope's.

**Consequence:** EFS may adopt Arweave's `data_root` chunk-submission, BitTorrent's piece-layer verification, and Filecoin's challenge-audit **wholesale for Tree 2** without touching the frozen Tree-1 rules — including bulk/contiguous-run proof strategies that the envelope's single-leaf-proof rule forbids for Tree 1. The large-file flow is: *one envelope signature commits a manifest record carrying `chunkRoot`; then N chunks stream in, each verified against `chunkRoot` by the tier contract.* That is Arweave's "sign the tx carrying `data_root`, then POST chunks vs `data_root`" reproduced natively. Everything below is scoped to Tree 2 unless stated.

---

## 3. Per-system autopsy (ranked by copy-value)

### 3.1 Arweave native transaction chunking (`data_root`) — the #1 analog

**Mechanism.** An Arweave transaction signs a header containing `data_root` (Merkle root of the data's 256 KiB chunks) and `data_size`. The bytes are *not* in the signed tx; they are uploaded afterward via `POST /chunk`, each call carrying `{ data_root, data_size, data_path, offset, chunk }`. The node recomputes the chunk's position from `offset`, verifies `data_path` (an offset-indexed binary Merkle inclusion proof) against `data_root`, and accepts. ([Arweave HTTP API](https://docs.arweave.org/developers/arweave-node-server/http-api), [chunk upload HackMD](https://hackmd.io/@arweave/HJ2Whd9cU), [arweave-js transaction.ts](https://github.com/ArweaveTeam/arweave-js/blob/master/src/common/lib/transaction.ts))

- **Authorization amortization:** *perfect.* One signature over `data_root` authorizes unbounded data; chunk count is invisible to the signer.
- **Inclusion proof:** `data_path` = Merkle path with byte-offset boundaries at each node; `data_size` is submitted alongside `data_root` **specifically to prevent chunk-overlap** — the same root can front different sizes, so root-without-size is ambiguous.
- **Resumability & parallelism:** chunks are independent and idempotent; `offset` positions each, so any order, any parallelism, re-POST is a no-op. Resume = ask the node which offsets it has and POST the rest. **No session state on the client beyond the signed header.**
- **Anti-spam (the thing EFS is missing):** `chunk_proof_ratio_not_attractive` — the node **rejects a chunk whose `data_path` is larger than the chunk itself**. Rationale verbatim: "if the original data is too small, it should not be uploaded in chunks." Also `chunk_too_big` (>256 KiB). This is a proof-to-payload ratio floor that stops a griefer from paying for tiny chunks with huge proofs.
- **Who pays / permanence:** uploader pays once (AR); a 200-year **storage endowment** funds ongoing replication across the miner set. This is one of only two *true* permanence models in scope (the other is bytes-in-EVM-state).

**COPY (high):** (1) the `data_root` + `data_size` commitment — EFS's manifest record MUST carry both `chunkRoot` **and** total byte length / chunk count, for the identical anti-overlap reason; a bare root is ambiguous. (2) The `chunk_proof_ratio` floor — adopt a minimum chunk size and a proof-≤-payload rule per tier (see §6). (3) Offset/index-addressed idempotent chunk submission — EFS's index-committed leaves already give this; make chunk re-submission an explicit no-op.
**AVOID:** Arweave's base64url-then-chunk detail bloats size 33% before chunking — EFS should chunk raw bytes. Arweave's endowment economics are AR-token-specific; EFS's permanence comes from state + replication, not a token endowment (do not import the token model).

### 3.2 Arweave ANS-104 bundles + Turbo/bundlr — the delegated-payment settlement layer

**Mechanism.** A bundle packs many **DataItems** into one Arweave transaction: 32-byte header (item count N), an index of `(size, id)` pairs (64×N bytes), then the payloads. **Each DataItem is signed independently** by its own owner (deep-hash over `["dataitem","1",owner,target,anchor,tags,data]`; the item id = SHA-256 of the signature). The top-level tx pays *one* reward for all items. ([ANS-104 spec](https://github.com/ArweaveTeam/arweave-standards/blob/master/ans/ANS-104.md), [ar.io bundles](https://docs.ar.io/learn/ans-104-bundles/)) Turbo/bundlr adds a funded service: authors sign items with an Arweave/EVM/Solana key, a funded node pays (fiat or crypto) and guarantees settlement, and the item is usable immediately. ([ArDrive Turbo](https://ardrive.io/turbo-bundler), [turbo-upload-service](https://github.com/ardriveapp/turbo-upload-service))

- **Authorization amortization:** *per author, not per file.* N items → N signatures, 1 payer, 1 settlement. This is the **multi-author batch** shape, not the one-file-many-chunks shape.
- **Inclusion proof:** each item is self-contained and self-verifying (id = SHA-256(sig)); the bundle index gives O(1) offset lookup. "Inclusion in the bundle" is implied by the item verifying and the bundle being mined; there is no separate sparse proof because each item stands alone.
- **Who pays:** decoupled from authorship — "delegation of payment to a 3rd party while maintaining the identity and signature of the creator, without them needing a funded wallet." **This is EFS's `msg.sender`-ignored / author-recovered-from-signature lever, already shipped in production by someone else.**

**COPY (high):** the **author-signs / funded-relayer-pays-and-submits** split is EFS's exact relayer model. Turbo is the existence proof that "sign with any key, a funded node settles, usable immediately" is a Web2-grade UX on a permanent substrate. EFS's map: one EFS envelope (1 author, many record leaves) ≈ one Arweave *tx with `data_root`*; a relayer submitting *many authors' envelopes in one EVM tx* ≈ an ANS-104 *bundle* (many independently-signed items, one payer). **EFS has both needs and they cleanly map to two layers.**
**AVOID (important trap):** do **not** model a single large file as N ANS-104-style per-item-signed chunks — that is N signatures and defeats the one-authorization goal. Per-item signing is correct only for genuinely independent items from (possibly) different authors. One file = one signed root (§3.1), full stop.

### 3.3 S3 multipart upload + tus resumable upload — the UX shell to steal

**S3 mechanism.** Three calls: `CreateMultipartUpload` → `UploadId`; repeated `UploadPart(UploadId, partNumber)` → per-part `ETag`; `CompleteMultipartUpload(UploadId, [{partNumber, ETag}])` assembles parts in ascending `partNumber`. Parts upload in **any order, in parallel**; re-uploading a `partNumber` **overwrites** (idempotent retry); part numbers 1–10 000, non-consecutive allowed; resume via `ListParts`. ([S3 multipart overview](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html), [CompleteMultipartUpload](https://docs.aws.amazon.com/AmazonS3/latest/API/API_CompleteMultipartUpload.html))

**tus mechanism.** `Creation` extension mints an upload URL; `PATCH` with `Upload-Offset` + `Content-Type: application/offset+octet-stream` appends at the offset; `HEAD` returns current offset to resume after an interruption; the `Concatenation` extension (`Upload-Concat: partial` → final) enables **parallel and non-contiguous** chunk uploads that are concatenated server-side. ([tus 1.0](https://tus.io/protocols/resumable-upload/1-0-x), [tus v2 IETF draft](https://tus.github.io/tus-v2/draft-ietf-httpbis-resumable-upload.html))

- **Authorization amortization:** the `UploadId` / upload URL is a *session*, not a signature — it authorizes nothing on its own; the server's IAM does the auth once at create time.
- **Integrity:** S3 `ETag` is the server's MD5 of the part; "integrity" means "matches what the server stored," i.e., **trust-the-server**. tus has no content integrity at all — it is a byte-transport.
- **Resumability:** best-in-class DX — `ListParts` / `HEAD offset` make resume a single round-trip. But it is **server-side state**: the coordinator remembers the session.

**COPY (high, DX only):** the **initiate → parts → complete** mental model, **explicit part/chunk index**, **idempotent re-submit** (same index overwrites — EFS re-submitting a proven chunk = no-op), and **parallel out-of-order upload**. Wrap the root-signed core in this shell so `efs.upload(file)` feels like `s3.upload(file)`. Also copy tus's `HEAD`-to-get-offset as EFS's "ask any node which chunks it already has" resume probe — except EFS makes it *stateless and trustless* because completeness is computed from the signed manifest, not from server memory.
**AVOID:** (1) the **finalize-gate** — S3's object is invisible until `Complete`; EFS must NOT require a coordinator step to make a file readable (see §3.4 read grades — the file is readable-as-partial from the first chunk). (2) `ETag`-as-integrity — never let a submitter's self-asserted checksum stand in for a proof against the signed root. (3) Session-as-authorization — EFS's authorization is the signature, which outlives any session and needs no coordinator.

### 3.4 BitTorrent v2 (BEP-52) — swarm submission, per-piece verify, partial-as-graded

**Mechanism.** v2 replaces v1's flat SHA-1 piece list with a **per-file SHA-256 Merkle tree**; the info dict holds each file's `pieces root`; the `piece layers` field (kept outside the info dict but verified against the roots inside) stores "the layer of the tree where one hash covers `piece length` bytes." The **infohash** = hash of the info dict = the single commitment to the whole torrent. A peer can request **any** piece from **any** peer in the swarm and verify it independently against the file's root via a Merkle path. ([BEP-52](https://www.bittorrent.org/beps/bep_0052.html), [libtorrent v2 writeup](https://blog.libtorrent.org/2020/09/bittorrent-v2/))

- **Authorization amortization:** the torrent (manifest) is authored once; it is content-addressed (infohash), not signed, but it plays EFS's manifest role exactly.
- **Inclusion proof:** per-piece Merkle path to the file root — O(log N) hashes, verified by the receiver, no trust in the sender. The **`piece layers` idea is a tunable EFS should note**: you need not commit at leaf granularity — you commit at whatever tree layer makes "one hash = one submission unit," trading proof length vs unit count.
- **Read/partial semantics (the gem):** a client that has 40% of verified pieces has a *graded partial* — every held piece is proven-good, the rest are proven-missing, and nothing is ever "corrupt/absent" ambiguously. Dedup falls out for free: identical file content → identical `pieces root` → shared across torrents.
- **Who pays / permanence:** nobody pays; permanence = seeders exist. Dies when the swarm dies. **Availability, not permanence.**

**COPY (high):** (1) **per-chunk independent verification against the signed root** by the receiving contract/client — the swarm-submission model is EFS's relayer model with the trust already solved. (2) **`piece layers` as a proof/granularity tunable** for Tree 2 — pick the chunk-tree layer that balances proof size against submission-unit size (feeds §6 chunk-size math). (3) **Partial-as-graded-state → the read-lens.** BitTorrent proves that "some verified chunks, rest missing" is a first-class, renderable, honest state. This is precisely the read-lens-spec mandate that a partial file reads as a *graded* state, never a broken file or a false "absent." Map: `PROVEN-COMPLETE` (all leaves present+proven) / `PARTIAL(k/N)` (k verified, renderable) / `PROVEN-ABSENT(chunk i)` (root exists, chunk i provably never landed) / `UNKNOWN(chunk i)` (haven't looked).
**AVOID:** the torrent manifest is unsigned (content-addressed only) — fine for BitTorrent's "the hash IS the name" world, but EFS needs the *author*-signed envelope so authorship and revocation attach. Don't drop the signature to gain BitTorrent's pure content-addressing; EFS's `claimId = keccak(DOMAIN, author, seq, recordDigest)` already fuses content-addressing with authorship.

### 3.5 IPFS UnixFS / IPLD / CAR — the Merkle-DAG shape and the determinism trap

**Mechanism.** A file is chunked (default 256 KiB; chunker ∈ fixed/Rabin/Buzhash), each chunk hashed to a CID, and the chunks assembled into a **Merkle DAG** (UnixFS over IPLD) with a chosen layout (balanced/trickle), max-links fan-out, and raw-vs-dag-pb leaves; the **root CID** self-certifies the whole DAG. A **CAR** (Content-Addressable aRchive) is the serialized DAG — a portable, verifiable container of blocks + roots. Unlike a pure Merkle *tree*, a DAG lets two parents point at the same child → **structural dedup**. ([How IPFS works](https://docs.ipfs.tech/concepts/how-ipfs-works/), [content addressing datasets](https://docs.ipfs.tech/how-to/content-addressing-data-sets/))

- **Authorization amortization:** none native (no signatures); the root CID is the commitment. Pinning services / IPNS add mutability + persistence.
- **Inclusion proof:** every block is verified against its CID; walking the DAG from the root verifies the whole file. Point-verifying one block = the path of CIDs from root to block.
- **Permanence:** none by default — unpinned blocks are garbage-collected. Persistence = someone pins (Filecoin/Pinata/self). **Availability, not permanence.**

**COPY (medium):** (1) **CAR as EFS's portable transport container** — a CAR-like framing (roots + blocks) is exactly what a relayer or a cross-chain replicator ships: a self-verifying bundle of chunks + manifest that any node can validate against the root before submitting on-chain. This aligns with EFS's "write once, anyone copies to any chain." (2) **DAG-over-tree for dedup** *iff* EFS wants sub-file block sharing across files — a chunk present in two files need land on-chain once. Weigh against determinism cost below.
**AVOID (the #1 trap in the whole autopsy):** **CID non-determinism.** UnixFS itself documents that chunk size, chunking algorithm, DAG layout, max-link count, and raw-vs-dag-pb leaves **all change the resulting CID for identical bytes** — two honest encoders produce different roots for the same file. For EFS, whose entire identity model is *deterministic, client-computable, chain-free IDs* (`dataId = keccak(author, salt)`, `chunkRoot` feeding into a signed record), this optionality is poison: it would make `chunkRoot` encoder-dependent and break "anyone recomputes the same id." **The defense is already in the envelope:** the frozen Merkle construction (fixed arity, index-committed leaves, domain-separated hashes, odd-node promotion) is precisely the anti-drift rule UnixFS lacks. EFS must **freeze every Tree-2 chunking parameter** (chunk size, tree arity, leaf domain tag, tail-chunk rule) into the frozen ID math the same way, and publish canonical vectors. Copy the *shape* of the Merkle DAG; reject the *optionality* that makes CIDs non-canonical.

### 3.6 Filecoin storage deals + PDP — ongoing proofs (mostly avoid) and two ideas worth mining

**Mechanism.** Classic Filecoin: a **storage deal** between client and storage provider (SP); the SP seals data and periodically submits **PoRep/PoSt** (proof-of-replication / spacetime) — heavy, hardware-bound. New (mainnet 2025): **PDP (Proof of Data Possession)** — a `PDPVerifier` contract holds `ProofSet`s (each *an array of Merkle roots*, appendable via `addRoots(setId, rootData, extraData)`); every ~24h, chain randomness selects leaves and the SP returns **5 Merkle inclusion proofs per challenge, independent of dataset size** (each challenged leaf 32 B); the contract recomputes the challenge and checks the proofs against the roots; a missed proof emits a failure event. A **sybil-burn fee** deters spam proof-sets. PDP is for *hot* storage (retrieval/dApp frontends/AI). ([Filecoin PDP intro](https://filecoin.io/blog/posts/introducing-proof-of-data-possession-pdp-verifiable-hot-storage-on-filecoin/), [PDP deep-dive](https://medium.com/@z1286679231/pdp-tour-a-deep-dive-into-how-filecoin-pdp-works-0a077d488ad5), [curio PDP contract](https://pkg.go.dev/github.com/filecoin-project/curio/pdp/contract)) **Deal aggregation:** many small files (<4 GiB) are combined into one deal; the client submits a sub-piece CID (`CommPc`); an aggregator assembles them and issues **PoDSI (Proof of Deal Sub-piece Inclusion)** so each small dataset is provably inside the aggregate. ([aggregated deal-making](https://docs.filecoin.io/smart-contracts/advanced/aggregated-deal-making))

- **Authorization amortization:** one deal covers a large dataset / many aggregated files; `addRoots` appends to a ProofSet without re-dealing.
- **Who pays / permanence:** client pays the SP **over the deal term** (ongoing, FIL); permanence = deal renewal + SP incentives + (future) slashing. **Deals expire; this is a paid service market with trusted providers, not intrinsic permanence.** The PDP deep-dive is candid that on-chain payment/slashing/discovery are still "future plans."

**COPY (targeted, medium):** (1) **Challenge-a-random-leaf-against-the-signed-root as a mirror-liveness AUDIT.** EFS's tier-3 (signed leaves + off-chain mirror) already publishes the signed `chunkRoot`; therefore *any* verifier can, with zero new machinery, demand a random `chunk[i]` from a mirror and check its proof against `chunkRoot` — a trustless "is this mirror still serving the bytes?" probe. PDP is the proof that "5 random Merkle proofs, size-independent, cheap SHA" is enough to audit possession. This becomes EFS's read-lens confidence signal for off-chain mirrors *without* an SP contract or deal. (2) **PoDSI ≈ EFS relayer batching** — many authors' files aggregated into one settlement while each remains provably included is EFS's envelope-batch story; the inclusion-proof discipline is worth mirroring.
**AVOID:** the **deal / SP / renewal / slashing / expiry** economic machinery as EFS's *source of truth*. It is a trusted-provider hot-storage market with expiring commitments — antithetical to "permanent, credibly neutral, no trusted intermediary." Use PDP-style proofs only as an *audit over mirrors*, never as the permanence mechanism; permanence stays in state + replication.

### 3.7 EthStorage / Web3Q + EIP-4844 blobs, web3:// — the fourth tier and the ephemerality trap

**Mechanism.** A file is split into **EIP-4844 blob-shaped chunks (~128 KiB each)** using the exact blob encoding + KZG commitment as Ethereum's blob protocol; on L1 the EthStorage contract records **only each blob's 32-byte versioned hash** (the KZG-commitment-derived hash `BLOBHASH` exposes); the bytes live in an EthStorage L2 network that inherits L1 security. Retrieval is via gateway; **verification is client-side**: "take the bytes the gateway served, re-run the exact blob encoding + KZG commitment locally, derive the versioned hash, compare" to the L1-committed hash. `web3://` (ERC-4804/6860) serves the content straight from the on-chain contract with no central host. ([EthStorage client-side verification](https://blog.ethstorage.io/client-side-verification-for-on-chain-frontends/), [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844), [eip4844-blob-hash-getter](https://github.com/ethstorage/eip4844-blob-hash-getter))

- **Authorization amortization:** blobs are batched into transactions (multiple chunks committed together), so a large file is a handful of blob txs, each committing several 128 KiB blobs — far fewer signatures than 24 KiB SSTORE2 chunking.
- **Integrity:** the versioned hash is a **succinct KZG commitment** to a blob; client re-derivation is the proof. This is a *commitment tier*, distinct from bytes-in-state.
- **Who pays / permanence:** an L2 storage fee (endowment-like long-term model via staking/discounted L1 DA); permanence = the L2 network's incentives + the L1 commitment.

**COPY (medium-high):** (1) **A named fourth storage tier: "blob-committed."** Between EFS's calldata-hash tier and its pure-mirror tier sits: *bytes posted as 4844 blobs (cheap DA, roughly an order of magnitude below calldata per byte), L1/kernel keeps the 32-byte versioned hash as the commitment, retrievable + client-verifiable during availability.* This is the cheapest way to get a large file **on-chain-committed** (the mission's floor) even when full bytes-in-state is too dear. (2) **Client-side re-derivation of the commitment as the verify path** — the stateless-client pattern (server serves, client re-derives commitment, compares) is exactly EFS's verify-don't-trust and should be the default read path for the blob and mirror tiers. (3) **web3:// as the serving scheme** — already EFS's top-ranked transport (ADR-0012); EthStorage/Web3Q are the reference for `web3://` at file scale.
**AVOID (the #2 trap):** **blob ephemerality mistaken for permanence.** EIP-4844 blobs are pruned by consensus nodes after ~18 days — the versioned-hash *commitment* is permanent, the *bytes* are not, unless a persistence network (EthStorage) re-stores them, which reintroduces a trusted holder for the *data*. So blobs are an excellent cheap **ingest/DA rail and commitment tier**, but EFS must be explicit that **blob availability ≠ permanence**: the bytes must additionally land in state (SSTORE2/calldata) or in a replicated store to satisfy the 100-year mission. Treat blob-committed as "on-chain-*committed*, off-chain-*available*" and grade it below bytes-in-state in the read-lens.

---

## 4. Ranked patterns EFS should COPY (with the EFS mechanism each maps onto)

1. **Sign a root once; stream self-verifying chunks against it (Arweave `data_root`, BitTorrent `pieces root`).** → EFS Tree-2: a manifest record carries `chunkRoot` + `chunkCount` + `byteLen`; chunks submitted independently, each proven against `chunkRoot` by the tier contract. *Already the envelope's philosophy; extend it one level down to file bytes.*
2. **Commit `size`/`count` alongside the root (Arweave `data_size` anti-overlap).** → the manifest record MUST bind byte length and chunk count, not just `chunkRoot`; a bare root is size-ambiguous and enables overlap/truncation games.
3. **Author-signs / funded-relayer-pays-and-submits (ANS-104 delegated payment, Turbo).** → EFS's `msg.sender`-ignored, author-recovered-from-signature kernel rule. Ship a Turbo-grade relayer: "sign with your wallet, a funded node settles all chunks, file usable immediately." This is the single biggest UX win and EFS already has the primitive.
4. **initiate → parts → complete + idempotent indexed parts + parallel/out-of-order + stateless resume (S3 multipart, tus).** → SDK surface `efs.upload(file)` over the root-signed core; chunk index = leaf index; re-submit = no-op; resume = probe any node for held chunks (stateless because completeness derives from the signed manifest, not server memory).
5. **Per-chunk independent verification by the receiver + partial-as-graded-state + content dedup (BitTorrent v2).** → read-lens grades for chunk-completeness (`PROVEN-COMPLETE` / `PARTIAL(k/N)` / `PROVEN-ABSENT(i)` / `UNKNOWN(i)`); identical `chunkRoot` ⇒ automatic cross-file dedup.
6. **Proof-≤-payload / minimum-chunk anti-spam floor (Arweave `chunk_proof_ratio_not_attractive`).** → reject chunk submissions whose Merkle proof exceeds the chunk; enforce a per-tier minimum chunk size (protects relayers and gas — see §6).
7. **CAR-style portable, self-verifying transport container (IPFS CAR).** → the wire format a relayer/replicator ships: `{manifest, chunks[], proofs[]}` validatable against `chunkRoot` before any on-chain submission; the vehicle for "anyone copies to any chain."
8. **Challenge-a-random-leaf mirror-liveness audit (Filecoin PDP), client-side commitment re-derivation (EthStorage).** → trustless "is this mirror alive?" probe over the already-signed `chunkRoot`; default verify-don't-trust read path for blob/mirror tiers.
9. **Blob-committed as a named cheap on-chain-*commitment* tier (EthStorage/4844).** → fourth storage tier for large files where full bytes-in-state is too expensive but on-chain commitment (mission floor) is still wanted.

---

## 5. Traps to AVOID (ranked)

1. **CID-style non-determinism (IPFS/UnixFS).** Any chunking optionality (variable chunk size, content-defined chunking, layout choices, leaf-encoding choices) makes the root encoder-dependent and destroys deterministic IDs. **Freeze every Tree-2 chunking parameter into the ID math and ship canonical vectors**, exactly as the envelope froze Tree-1 Merkle rules.
2. **Blob availability mistaken for permanence (EthStorage/4844).** 4844 blobs prune (~18 days); a permanent commitment to vanished bytes fails the mission. Grade blob-committed strictly below bytes-in-state; require the bytes to also land in state or a replicated store for permanence claims.
3. **Deal/SP/renewal/slashing economics as source of truth (Filecoin).** Expiring, provider-trusted, market-priced hot storage is not permanence and not credibly neutral. Use PDP-style challenges only as a mirror *audit*, never as the permanence layer.
4. **Per-item signing applied to one large file (ANS-104 misuse).** N signatures for N chunks defeats the one-authorization goal. Per-item signing is only for independent (multi-author) items; one file = one signed root.
5. **Finalize-gate visibility + session-as-authorization + checksum-as-integrity (S3/tus trust model).** A coordinator that flips a file from invisible→readable, a session id that stands in for auth, and a server MD5 that stands in for a proof each reintroduce the trusted intermediary EFS exists to remove. Steal the DX shell, discard the trust model.
6. **Multiproofs in the safety-critical path (general).** The envelope already excludes multiproofs (OZ CVE precedent). For Tree-2 bulk submission, get efficiency via **contiguous-run subtree recomputation** (§6), which is safe (recomputes a full subtree from complete data, no sparse proof), *not* via sparse multiproofs.
7. **Unbounded chunk count / griefing via tiny chunks (partly Arweave-mitigated).** Without a proof-ratio floor and a minimum chunk size, an adversary inflates relayer gas and state with dust chunks. Adopt the Arweave floor.
8. **Off-chain manifest as the only manifest (BitTorrent `piece layers` outside the info dict).** Keep the size/count/root binding *inside* the signed record; anything kept outside the signed structure must be verified back against an in-structure commitment (BitTorrent does exactly this check — replicate the discipline).

---

## 6. Concrete EFS recommendations for the large-file flow

**6.1 The flow (Arweave `data_root` reproduced natively, dressed as S3 multipart).**
1. **Client** chunks the file with *frozen* parameters, builds `chunkRoot` (Tree 2), computes `dataId`/manifest, and signs **one** envelope whose leaves include the manifest record `{chunkRoot, chunkCount, byteLen, tier}`. *One signature; file identity now exists.*
2. **Relayer** (Turbo-style, funded) submits the envelope, then streams chunks in parallel/any-order to the tier contract, each with a proof against `chunkRoot`. `msg.sender` ignored; author attributed from the envelope signature.
3. **Tier contract** verifies each chunk vs `chunkRoot`, applies the proof-ratio floor, stores idempotently at its CREATE2/index-addressed slot; re-submit = no-op.
4. **Readers** compute completeness from the signed manifest (present/expected) and render a **graded partial** at any point; no finalize step, no coordinator.
5. **Resume** = probe any node for held chunk indices, submit the complement. Stateless on the client beyond the (small, on-chain-storable) signed manifest.

**6.2 Chunk-size / proof-ratio math (UNMEASURED estimates; validate).**
- **SSTORE2 tier:** chunk ≤ 24 KiB forced by EIP-170; one CREATE2 deploy per chunk (parallelizable, no cross-tx mined dependency). A ~14-level proof (~448 B) against a 24 KiB chunk is <2% overhead — comfortably above any proof-ratio floor. ~200 gas/byte to store (as given) ⇒ a 1 MiB file ≈ 44 chunks ≈ ~220M gas total spread across many txs/blocks (**unmeasured**; spans multiple blocks by construction).
- **Calldata-body tier (~40 gas/byte EIP-7623 floor, as given):** pick chunk size where the O(log N) proof is negligible — **≥4–8 KiB chunks** keep a ~448 B proof under ~10% and clear the Arweave-style floor. 1 MiB ≈ 128–256 chunks. Portable (no EIP-170), hash-in-state.
- **Blob-committed tier (EthStorage-style, 4844):** ~128 KiB per blob, several blobs per tx ⇒ a large file is a handful of blob txs; cheapest per-byte on-chain commitment, but availability-graded below state (§5.2).
- **Proof-ratio floor:** reject any chunk submission where `len(proof) > len(chunk)`; set a **minimum chunk size** per tier (SSTORE2: no practical need given 24 KiB; calldata: ~2–4 KiB min) — directly ported from `chunk_proof_ratio_not_attractive`.

**6.3 Bulk submission without reopening the etched envelope.** For a large file's many chunks, avoid repeating O(log N) proofs per chunk by submitting a **contiguous run** of chunks with a single boundary proof: the tier verifier recomputes the run's subtree root from the *complete contiguous data* and checks that subtree's single proof against `chunkRoot`. This is safe (no sparse multiproof — recomputation from full data, dodging the OZ multiproof CVE class), efficient (one proof per run), and lives entirely in Tree 2 / the tier contract, so it never touches the frozen Tree-1 single-leaf-proof rule. (Shape borrowed from Arweave contiguity + BitTorrent `piece layers`.)

**6.4 Read grades for partial files (BitTorrent → read-lens-spec).** Extend the read-lens with chunk-completeness grades: `PROVEN-COMPLETE` (all `chunkCount` leaves present + proven), `PARTIAL(k/chunkCount)` (k proven, renderable range-partial), `PROVEN-ABSENT(i)` (root admitted, chunk i provably never submitted — distinct from), `UNKNOWN(i)` (unqueried). This satisfies the mandate that a partial file is a *graded state*, never a broken file or a false "absent."

**6.5 Forward-compat invariant (the answer to "don't give up permanence for scale").** Declare explicitly: **the signed `chunkRoot` and the file identity are carriage-independent; only the submission rail is versioned.** Bigger blocks → bigger chunks; blobs/danksharding/PeerDAS → blob-carried chunks; more parallelism → more concurrent CREATE2 deploys. None of these change the root, the ID math, or the authorization. Permanence is anchored in the root + the bytes-in-state/replicated tiers; scale is absorbed by the swappable rail. This is the same carriage-independence the envelope already asserts for `claimId` — state it for file bytes too.

---

## 7. Attempts to break my own proposal

- **"Two trees doubles the proof surface."** True but bounded: Tree 1 (records) is small (a manifest is one leaf); Tree 2 (chunks) is where size lives and where EFS is *free* to optimize (contiguous-run proofs, §6.3). The separation is what *lets* EFS adopt the prior art without reopening the etched envelope — the cost buys de-risking. Net positive.
- **"Contiguous-run recomputation is just a multiproof in disguise → same CVE class."** No: the OZ multiproof CVE was about *sparse* proofs where crafted internal nodes let an out-of-tree leaf verify. Recomputing a subtree from the *complete contiguous leaf data* accepts no attacker-supplied internal nodes for the run — only the single boundary proof from the subtree root upward, which is an ordinary single-path proof. The distinction is real, but **it must be a freeze-gate vector** (fuzz: can a crafted run + boundary proof admit bytes not under `chunkRoot`?). Flagged.
- **"Manifest-first leaks the file's existence before bytes arrive → censorship/targeting."** Real: because identity exists at signature time, a censor learns `dataId`/`chunkRoot` before submission completes. But this is inherent to any content-addressed system (BitTorrent infohash, IPFS CID leak identity pre-download too), and EFS's neutrality answer is the self-submit floor + many relayers — the same defense already in ops-doctrine. Not unique to large files; no new mitigation owed.
- **"Blob-committed tier contradicts permanence."** Only if mis-graded. The recommendation explicitly grades it *below* bytes-in-state and requires state/replication for permanence claims. If a future EFS ships blob-committed as a *permanence* tier, that would be the trap — so §5.2 is a hard AVOID, not a soft note.
- **"Proof-ratio floor blocks small files."** By design (Arweave's own rationale: small data shouldn't be chunked). Small files use the inline calldata body / `data:` mirror, not the chunked path — the floor correctly routes them there. No regression.
- **"Single signature can't authorize truly unbounded data — the manifest itself grows."** The manifest is O(1) in the number of *records* (one manifest record carries a 32-byte `chunkRoot` regardless of chunk count). Chunk count lives in a `uint`, not in the signed leaf set. So authorization is genuinely O(1) in file size. The only O(N) thing is submission, which is the physical floor James accepts. Holds.
- **"Truncation replay against `chunkRoot`."** A relayer could submit only some chunks and a foreign chain could serve a partial as complete. This is the envelope's already-known truncation-replay finding (codex-envelope amendment 6) one level down: the defense is the read layer (home-certain vs foreign-best-effort; graded partials from §6.4), and the `byteLen`/`chunkCount` binding (§4.2) makes "how many chunks should exist" part of the signed commitment, so a truncated serve is *detectable* against the manifest. Bounded and detectable, not closed — same posture as the envelope.

---

## 8. Numbers (all UNMEASURED unless a primary source is cited)

| Quantity | Value | Source / status |
|---|---|---|
| Arweave chunk max | 256 KiB | primary (HTTP API) |
| Arweave anti-spam | `data_path` must be ≤ chunk | primary (`chunk_proof_ratio_not_attractive`) |
| BitTorrent v2 piece | power-of-two ≥16 KiB; SHA-256 tree | primary (BEP-52) |
| IPFS UnixFS default chunk | 256 KiB (tunable → CID drift) | primary (IPFS docs) |
| EIP-4844 blob | ~128 KiB; 32-byte versioned hash; ~18-day prune | primary (EIP-4844) |
| Filecoin PDP challenge | ~24 h; 5 Merkle proofs/challenge, size-independent; 32-byte leaves | primary (PDP deep-dive) |
| S3 part | 5 MiB–5 GiB; 1–10 000; any order; overwrite-by-number | primary (S3 docs) |
| SSTORE2 chunk | ≤24 KiB (EIP-170); ~200 gas/byte | given by task |
| Calldata body floor | ~40 gas/byte (EIP-7623) | given by task |
| EFS Merkle proof depth | ~ceil(log2(chunkCount)) × 32 B (e.g. 14 levels ≈ 448 B @ 10k chunks) | **estimate** |
| 1 MiB @ SSTORE2 | ~44 chunks, ~220M gas total across many blocks | **estimate** |
| 1 MiB @ calldata (8 KiB chunks) | ~128 chunks | **estimate** |

---

## 9. Source register

**Primary/authoritative:** [ANS-104 spec](https://github.com/ArweaveTeam/arweave-standards/blob/master/ans/ANS-104.md); [Arweave HTTP API](https://docs.arweave.org/developers/arweave-node-server/http-api) + [chunk upload HackMD](https://hackmd.io/@arweave/HJ2Whd9cU) + [arweave-js](https://github.com/ArweaveTeam/arweave-js/blob/master/src/common/lib/transaction.ts); [ArDrive Turbo](https://ardrive.io/turbo-bundler) + [turbo-upload-service](https://github.com/ardriveapp/turbo-upload-service); [S3 multipart](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html) + [CompleteMultipartUpload](https://docs.aws.amazon.com/AmazonS3/latest/API/API_CompleteMultipartUpload.html); [tus 1.0](https://tus.io/protocols/resumable-upload/1-0-x) + [tus v2 IETF draft](https://tus.github.io/tus-v2/draft-ietf-httpbis-resumable-upload.html); [IPFS how-it-works](https://docs.ipfs.tech/concepts/how-ipfs-works/) + [content addressing](https://docs.ipfs.tech/how-to/content-addressing-data-sets/); [BEP-52](https://www.bittorrent.org/beps/bep_0052.html) + [libtorrent v2](https://blog.libtorrent.org/2020/09/bittorrent-v2/); [Filecoin PDP intro](https://filecoin.io/blog/posts/introducing-proof-of-data-possession-pdp-verifiable-hot-storage-on-filecoin/) + [PDP deep-dive](https://medium.com/@z1286679231/pdp-tour-a-deep-dive-into-how-filecoin-pdp-works-0a077d488ad5) + [aggregated deal-making](https://docs.filecoin.io/smart-contracts/advanced/aggregated-deal-making); [EthStorage client-side verification](https://blog.ethstorage.io/client-side-verification-for-on-chain-frontends/) + [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844).
**Commentary (weighted low):** Medium/blog explainers (PDP tour, EthStorage) corroborated against primaries; vendor marketing (ArDrive) used only for UX/economic claims.
**Known gaps / staleness:** no vendor publishes clean per-byte on-chain pricing; Filecoin PDP on-chain payment/slashing/discovery are self-described "future plans" (2025-26) — do not model EFS on unshipped Filecoin economics. EFS contracts specs read are v1 (EAS-era); v2 substrate grounding taken from codex-envelope + the composability research.
