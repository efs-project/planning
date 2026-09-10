<!-- Research strand: Filesystem and content-addressed storage theory, translated on-chain -->
<!-- Provenance: produced 2026-09-10 by a research agent under the integration-test-lead's
     workflow (harness claude-code, model Claude Fable 5). Figures carry the agent's own
     MEASURED / QUOTED / ESTIMATED labels; nothing here is a ruling. The engineering
     lead's reading, verification notes and corrections are in ../indexing-and-state-2026-09-10.md. -->

# Filesystem & content-addressed storage theory, translated to an on-chain append-only setting

Report date: 2026-09-10. Labels: MEASURED (run this session), QUOTED (from a cited source), ESTIMATED (arithmetic from QUOTED constants). EFS internals cited from `/Users/james/Code/EFS/planning/Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-content-locators.md` (§5 ChunkTree/1, §7 ArtifactClosure/1, §8.4, §11 IByteStore sketch) and `contracts/docs/adr/0057-production-erc5219-bytes-store.md`.

## 0. Executive summary

1. The Linux split is inode (what the bytes are, no name) / dentry (a name pointing at an inode) / data blocks. "One set of bytes, many names" costs exactly one thing in Linux: a reference count (`i_nlink`) so the blocks can be freed when the last name goes. On an append-only chain that cost disappears; the split itself is the right model and EFS already has it (ChunkTree = inode, closure member or binding = dentry, chunk contract = data block).
2. Every disk filesystem that dedups pays for a second index (ZFS DDT: 216–424 B per live entry, consulted on every write and free; btrfs/bcachefs: refcounted indirect extents, two lookups per read). On the EVM the state trie is already a hash-keyed authenticated map, so a dedup "lookup" is one cold SLOAD/EXTCODESIZE (2,100–2,600 gas), about a tenth of one storage word. Dedup is nearly free on-chain provided the storage key is derived only from content.
3. That is the one thing the current EFS byte-store sketch gets wrong: chunk contracts are addressed by CREATE2 with salt = keccak(chunkTreeRecordId ‖ index) (§11), and v1 uses nonce-addressed SSTORE2 chunks (ADR-0057). Both make identical chunk bytes in two files two contracts. Switching to a content-only address and storing one 32-byte pointer per (tree, index) costs ~22.1k gas per chunk (ESTIMATED, ~0.5% of a 20 KiB chunk deploy) and gives cross-file chunk sharing plus proof-free contract reads.
4. Delta compression (Git packfiles) and mutable rebalancing structures (B-trees, in-place HAMT updates) are actively harmful on-chain because reads are ~100:1 and each read would walk a chain or path. Append-only accumulators (Git commit chains, Merkle Mountain Ranges, the 2026 Parent-Hash DAG at a MEASURED-by-authors 76,276 gas per append) are the right shape for history.
5. Content-defined chunking buys 10–20% more redundancy detection than fixed chunking (QUOTED, FastCDC paper) but breaks the offset→chunk-index arithmetic that makes ChunkTree range reads O(1); it is worth a ChunkTree/2 type later, not a change to /1 now.
6. A bao-tree-style "chunk group" construction (fixed small leaves, submission-size as an aligned subtree) would eliminate EFS's acknowledged "same bytes, two ChunkTree ids" problem between `CHUNK_SIZE_STATE` (20,480) and `CHUNK_SIZE_DEFAULT` (256 KiB) at the cost of 3–6 extra proof levels.

## 1. Linux VFS: inode, dentry, data blocks

QUOTED from the kernel VFS doc (docs.kernel.org, current) and the ext4 on-disk doc:

- The inode "represents an object within the filesystem" and carries no name; "a single inode can be pointed to by multiple dentries (hard links, for example, do this)." Name lookup goes through the parent directory inode's `lookup()`; dentries "live in RAM and are never saved to disc: they exist only for performance."
- ext4 on-disk inode records are 256 bytes by default (the struct itself is 160 bytes), with `i_links_count` capped at 65,000 hard links; the 60-byte `i_block` holds either the classic block map or an extent tree. So the "inode" is a fixed 256 B header plus a block-pointer structure, and the directory is just a list of (name, inode number).

Why the separation exists: names are a namespace concern (many, mutable, per-directory); the inode is the object's identity plus its block map; the blocks are dumb. A hard link is a second directory entry with the same inode number and an `i_links_count` increment. What "one set of bytes, many names" requires in a mutable filesystem is precisely (a) the refcount and (b) a delete path that frees blocks at zero. GC is only needed when links can be removed. In an append-only system neither (a) nor (b) is needed; the only reason to keep a count is if someone wants to query "how many names point here" (that is an index, not a lifetime mechanism).

The other lesson: Linux keeps the expensive name index (dcache) volatile. Every on-chain index slot is 22,100 gas. Of EFS's measured 2,838,264-gas tag write across 94 slots, 94 × 22,100 = 2,077,400 (73%) is slot-touching cost (ESTIMATED from the owner's MEASURED figures); the design question is which of those slots a contract will ever query.

## 2. Dedup and copy-on-write in modern filesystems

| System | Sharing unit | Per-shared-block metadata | What it costs / what breaks (QUOTED unless noted) |
|---|---|---|---|
| ZFS dedup (DDT) | block by checksum | traditional: 40 B key + up to 256 B value, live entry 424 B; Fast Dedup (OpenZFS 2.3, 2024): live 216 B, logged 144 B; TrueNAS: "300–900 bytes" per entry, "1–3 GB RAM per TB" only for pools with ≥3× ratio | "every single write and free operation requires a lookup and then a write to the dedup table, regardless of whether or not the write or free proper was actually done" (despairlabs, 2024-10-27). Unique blocks pollute the table; author's own 397 GB pool: 11.7M simulated entries, ratio 1.00×. Recommendation: use block cloning (BRT, 16 B per cloned block) with explicit "copy me" signals instead of scanning. |
| btrfs reflink / dedup | extent | a separate file-extent item pointing at the shared extent plus backrefs in the extent tree | `FIDEDUPERANGE` compares byte-by-byte then reflinks; in-band dedup "not actively developed", needs "large amounts of RAM to store the lookup table of known block hashes and adds IO overhead" (btrfs wiki). Reflink is same-filesystem only and must match NOCOW/checksum status (btrfs docs). |
| APFS clones | extent | "a constant amount of metadata is updated and the on-disk data is shared" (Leventhal, 2016-06-19); clone duplicates only the inode and its file-extent records (Eclectic Light, 2024-03-20) | No dedup at all: "furiously hard to do well" and "probably not useful for the single-user ... environments Apple cares about." User-facing surprise: "deleting a file may free no space." Clones are one-volume only. |
| bcachefs reflink | extent | extent moved to a reflink btree with a refcount; extents btree keeps an indirect key | "two btree lookups instead of one"; the transformation is one-way: once indirect, always indirect even at refcount 1 (bcachefs docs). |

Common pattern: every mutable-FS dedup needs (1) a hash→location table consulted on write, (2) a refcount per shared extent, (3) a free path. Cost is dominated by (1) being random 4K I/O and by (2)/(3) turning deletes into refcount walks. None of these systems shares "similar" data; they share identical blocks/extents only. Delta/similarity is left to backup systems (§4).

## 3. Content-addressed systems

| System | File → bytes | Chunking | Directories | History/versions | Dedup evidence |
|---|---|---|---|---|---|
| Git | blob = SHA-1("blob <size>\0" ‖ content); tree entries = (mode, name, hash) | none: whole-file blobs; similarity handled by pack deltas | tree objects, sorted entries; identical subtrees share ids | commit → tree + parents (a parent-hash chain) | Identical content always yields the same id. Pack deltas: book example, 22 KB file edited → original stored as a 9-byte delta, newest kept whole "for faster access to the most recent version." MEASURED on the EFS `contracts` repo: 9,631 packed objects, 113.2 MiB uncompressed (blobs 109.2 MiB) in 10.39 MiB of packs (10.9×, zlib + delta + identical-blob sharing combined; not separable); in the main pack 5,721 of 8,374 objects are deltas occupying 1.49 MB vs 7.33 MB for 2,653 whole objects; delta chains run to length 12+. |
| Plan 9 Venti (FAST 2002) | block address = SHA-1 "score"; "pointer blocks" of scores recursively until one root score | fixed-size blocks up to 52 KB (8 KB typical) | Fossil/vac: a tree of scores; one daily archive = one vac score | write-once, append-only log in sealed arenas; "a block cannot be modified without changing its address" | Plan 9 servers over a decade: duplicate elimination saved 27.8% (bootes) and 31.3% (emelie); with fragment removal + compression 59.7% / 76.5% total; daily snapshots "almost zero" incremental cost. |
| IPFS UnixFS | File node = Links[] (CIDs) + parallel `blocksizes[]`; single-block files use raw codec | default fixed 256 KiB (`size-262144`), balanced DAG width 174; chunker choice changes the CID | Directory = sorted links (Name, Hash, Tsize); HAMTShard when serialized node exceeds 256 KiB–1 MiB: fanout 256 (≤1024), murmur3-x64-64, bitfield of occupied buckets | none in UnixFS; IPNS/MFS on top | No published ratio found this session. |
| Perkeep | `file` schema → `bytes` schema with `parts[] {size, blobRef | bytesRef, offset}`; recursive "hash tree"; missing ref = zero hole | bup-style rollsum: 64-byte window, split when low 13 bits are 1 → ~8 KiB average, max 4× (bup DESIGN; Perkeep uses "slightly different parameters") | `directory` / `static-set` schemas; `inodeRef` for hard links | permanode (immutable anchor) + signed claims = mutation log | VM-image example in the git-lfs thread: two 40 GB images differing by 2 bytes cost 40 GB + 8 KB. |
| Nix store | store object = whole file tree serialized as NAR; path digest from hash + references | none (whole object) | the store path is the directory | input-addressed by default; content-addressed (NAR sha256) optional; self-references handled by a boolean in the fingerprint | whole-object identical dedup only (no per-file figure found). |
| EthFS (Ethereum) | File struct = ordered SSTORE2 slices; 24 KB chunks; CREATE2 via Safe Singleton Factory so "the content address ... is the same across EVM chains" | fixed 24 KB | FileStore name registry | none | dedup by deterministic content address. |
| ONCHFS (fxhash) | inode store: file = "ordered list of pointers to chunks" + metadata, directory = names → inodes; inode CID = hash of inode content; content store keyed by keccak256 of chunk bytes (≤24 KB) | fixed ≤24 KB | inode records | none | chunk-level dedup by keccak key. |

Two structural facts recur: (i) the file object is always "a list of content hashes plus sizes/offsets" (Venti pointer blocks, IPFS blocksizes, Perkeep parts, ONCHFS pointers) — only EFS collapses that list to a single Merkle root; (ii) directories are always sorted (name, hash) lists inside an immutable object, with hash-sharding (HAMT) once a single object gets too big.

Whole-file vs block dedup (QUOTED, Meyer & Bolosky FAST 2011, 857 Microsoft desktops, 4 weeks): whole-file dedup "achieves about three quarters of the space savings of the most aggressive block-level deduplication for storage of live file systems, and 87% of the savings for backup images." The fixed-vs-Rabin breakdown from the paper could not be retrieved (USENIX/SNIA PDFs returned 403).

## 4. Newer research

- Content-defined chunking. LBFS (SOSP 2001) introduced Rabin-window boundaries (low 13 bits match → ~8 KiB average, 2 KiB min, 64 KiB max). FastCDC (USENIX ATC 2016, QUOTED from the paper text): Gear hash `fp = (fp<<1) + Gear[b]`, judgment `!(fp & Mask)`, cut-point skipping below MinSize 2 KB, normalized chunking around 8 KB (masks of 15/13/11 one-bits), MaxSize 64 KB; "about 10× faster than the best of open-source Rabin-based CDC, and about 3× faster than ... Gear- and AE-based CDC, while achieving nearly the same deduplication ratio"; CDC in general detects "about 10–20% more redundancy than the FSC [fixed-size chunking] approach"; without limits ~22.12% of Rabin chunks would fall under 2 KB and 0.03% over 64 KB. Gregoriadis et al. (arXiv 2409.06066, 2024) compared nine algorithms, corrected AE's chunk-size formula (it under-estimated by 13–39%), found RAM "failed catastrophically on low-entropy datasets like source code," and recommend Gear + normalized chunking or AE. VectorCDC (ACM TOS, 2025) and VSEQ/SeqCDC (2025, 30.5 GB/s with AVX-512) push throughput ~10× past FastCDC. Post-dedup similarity: Finesse (FAST 2019) speeds super-feature resemblance detection 3.2–3.5×; Palantir (ASPLOS 2024) does hierarchical similarity — this is the machinery that finds "similar but not identical" chunks for delta encoding.
- HAMT directories. IPFS UnixFS HAMTShard (fanout 256, murmur3, 256 KiB–1 MiB threshold) is the production example; IPLD's generic HAMT ADL is the spec form. Insert into an immutable HAMT is path-copying: O(log_fanout N) new nodes per change.
- Authenticated data structures. Miller/Hicks/Katz/Shi (POPL 2014): any pointer-based structure becomes authenticated by replacing pointers with hashes; the verifier checks a compact proof per operation. CT logs (RFC 6962/9162) are the deployed append-only Merkle log with inclusion and consistency proofs, using 0x00 leaf / 0x01 node domain prefixes — the same tags EFS ChunkTree/1 uses. SUNDR (OSDI 2004) gives fork consistency over an untrusted block store keyed by hash.
- BLAKE3/Bao. Bao encodes the BLAKE3 tree (1 KiB chunks, 64-byte parents — derived: the README's 1,000,000-byte example yields a 62,472-byte outboard file = 8 + 976 × 64) so clients can "stream ... or do random seeks into it, while verifying that every byte they read matches the root hash"; overhead ~6.2%; the decoder "must not expose the length ... before the final chunk is validated." bao-tree (n0) adds runtime chunk groups and post-order outboards, which "have advantages for synchronizing append only files."
- Append-only accumulators. Merkle Mountain Ranges are "strictly append-only" with peaks bagged into a root (Grin docs); "Merkle Mountain Ranges are Optimal" (ePrint 2025/234) shows O(n log n) witness updates. Moore & Paredes Garcia (arXiv 2606.09593, June 2026): Parent-Hash DAG appends touch "a constant number of storage writes to previously-untouched slots," measured "depth-invariant at 76,276 gas (standard deviation about 6 gas)" on Base Sepolia, versus incremental Merkle trees whose cost grows with depth; registries are reconstructible from event logs in linear time.
- Immutable/append-only filesystems: Venti + Fossil (daily archive = one root score) remains the reference design; Nix's store is the immutable whole-object variant; Perkeep is the schema-blob variant. No newer "append-only on-chain filesystem" paper beyond EthFS/ONCHFS was found.

## 5. The key translation

Gas constants (QUOTED, go-ethereum `params/protocol_params.go` + EIP-2929): SSTORE zero→nonzero 20,000 + cold 2,100 = 22,100; nonzero→nonzero cold 5,000; SLOAD cold 2,100 / warm 100; cold account access 2,600; KECCAK256 30 + 6/word; CREATE 32,000; code deposit 200/byte; initcode 2/word; calldata 16/byte (nonzero); LOG 375 + 375/topic + 8/byte; tx base 21,000; max code 24,576; EIP-7825 tx cap 16,777,216 (per EFS §8.4).

ESTIMATED unit costs that drive every decision below:

| Operation | Gas |
|---|---|
| Hash a 20,480 B chunk | 3,870 |
| Hash a 256 KiB chunk | 49,182 |
| Dedup lookup (cold SLOAD or EXTCODESIZE) | 2,100–2,600 |
| One 32-byte storage word (cold, new) | 22,100 |
| ChunkTree/1 body (48 B = 2 words) | 44,200 (+ id/index slots) |
| Deploy 20,480 B chunk as code (deposit 4,096,200 + CREATE 32,000 + initcode ~1,300 + calldata ~327,700) | ≈4.46M, i.e. ≈218 gas/byte |
| Deploy 8 KiB chunk | ≈1.80M, ≈220 gas/byte (per-byte cost is nearly chunk-size independent) |
| Read 20 KiB via EXTCODECOPY (2,600 + copy 1,920 + memory ~800) | ≈5.3k — ~800× cheaper than writing it; SSTORE2 README quotes 176.89× vs SLOAD at 24 KB |
| Event with 2 topics + 64 B data | 1,637 (13.5× cheaper than one slot) |

What survives:

1. Content addressing as the storage key (Venti/Git/IPFS/ONCHFS). Hashing is free; the state trie is the DDT; there is no refcount and no free path. The ZFS objection ("unique entries pollute the table") inverts: on-chain every unique entry must be stored anyway because it is the data. Requirement: the key must depend on content only.
2. Inode/dentry/data split, minus `i_nlink`. Hard link = second dentry (32-byte ref + name) with no counter. "Who points at me" is an index decision (EFS's reverse-membership backlink), costing ≥ 22,100 per enumerable reference plus ~5,000 per counter bump.
3. Merkle commitments with count-at-apex and domain separation (Arweave data_root+data_size, Bao's length prefix, CT's 0x00/0x01). Needed only for data outside contract-readable state: off-chain chunks and the chunk manifest. SSTORE2 code is already authenticated by the state root, so contracts reading it need no proof; the proof is needed once at submit (to bind chunk→tree).
4. Git-tree structural sharing (identical subtrees share one id): ArtifactClosure/1 already does this.
5. Parent-hash chains for history (Git commits, PHDAG): one extra word per version, O(1) fresh slots, no Merkle update in state.
6. HAMT — but only for immutable snapshots. A mutable on-chain directory should be `mapping(dirId, keccak(name)) → childId` (2,100-gas lookup, 22,100 insert) because the state trie already is the hash map; an immutable HAMT insert is depth × (record write ≈ 44k+) by path copying.

What is harmful:

1. Delta compression in state. Reads are 100:1; a delta chain makes every read decode a chain (Git keeps the newest whole for exactly this reason). On an L2 the write cost is the 200 gas/byte code deposit, not the 16 gas/byte calldata deltas would save. Keep deltas for off-chain transport only.
2. Refcounts/GC and any "delete" semantics: pure cost (5k–22k per reference) with nothing to reclaim.
3. Rebalancing structures (B-trees, in-place HAMT, sorted arrays with shifting): each rebalance rewrites warm-then-cold slots; append-only structures write only fresh slots.
4. A second dedup index (ZFS DDT shape): the trie is the index.
5. Small chunks are not per-byte harmful (220 vs 218 gas/byte above) but each chunk adds a transaction (21k), a proof (≤768 B calldata ≈ 12.3k), and a pointer/coverage write (22.1k or 5k): ≈4.3 gas/byte overhead at 8 KiB vs ≈1.7 at 20 KiB.

Minimal on-chain inode/dentry/data split (ESTIMATED costs):

```
data   : chunk contract, addr = CREATE2(store, salt = keccak(0x00‖chunk) or constant,
         initcode embedding 0x00‖chunk)            -> 200 gas/B, one copy per unique chunk
inode  : ChunkTree/1 {chunkSize, chunkCount, totalSize, merkleRoot}  -> ~44k
         + block map: store.leaf[treeId][i] = leafHash (written by submitChunk after
           verifyChunk)                              -> 22.1k per chunk (= ext4 i_block)
dentry : immutable: ArtifactClosure member {name, kind, size, ref}
         mutable : binding(position -> recordId)     -> 22.1k; hard link = 2nd dentry, no refcount
history: binding.prev = prior binding id             -> +1 word, O(1) (PHDAG/Git shape)
lookup : mapping(dirId, keccak(name)) -> childId      -> 2,100 read; enumeration via
         append-only array (22.1k/entry) or events (1.6k/entry, eth_getLogs, no indexer)
```

Worked example: a 20 KiB single-chunk file = 4.46M (bytes) + 44k (inode) + 22k (pointer) + 22k (dentry) ≈ 4.55M; bytes are 98%. A second name for it: +22k (0.5%). A second file whose one chunk is identical: 88k instead of 4.55M (≈50× cheaper) — but only if the chunk address is content-only.

## 6. EFS ChunkTree/1 + chunk staging versus the prior art

What it gets right (each has a direct precedent):

- Count-at-apex (`chunkCount`, `chunkSize`, `totalSize` in the RecordId): Arweave data_root + data_size; Bao's length prefix and "don't expose length before the final chunk validates" — EFS's `expectLen` check is the same defence.
- Leaf/node domain tags 0x00/0x01, ordered pairing, no sorted-pair multiproofs: identical to RFC 6962 hashing; odd-node promotion is the MMR/CT shape.
- "The chunk-hash manifest is content, not a Record" (§5.4): Venti pointer blocks and Perkeep `bytesRef` do exactly this (manifest-as-data, recursively); 50 GB → 6.55 MB manifest → 25 chunks is the Venti recursion.
- Fixed-size chunks with `chunkSize` a declared field: IPFS's chunker parameter, Arweave's 256 KiB; fixed size keeps `readRange(offset)` O(1) (index = offset / chunkSize), which no CDC scheme can offer.
- Anyone-may-submit, proof-verified, idempotent chunk admission with address-commits-to-bytes: EthFS's cross-chain deterministic CREATE2 with the squatting analysis done correctly (§11).
- No name/media-type in the inode (Git blob / Venti score discipline), naming in closures (Git tree / IPFS directory), `size` duplicated in members like IPFS `Tsize` with a read-side check.

What it is missing, and what each costs:

1. Cross-file chunk sharing (the headline gap). Salt = keccak(treeId ‖ index) means the same 20 KiB in two trees is deployed twice (≈4.46M each). Fix: salt derived from chunk bytes only (or constant, since initcode hash already commits the bytes) plus `leaf[treeId][i]` pointer slots. Cost +22,100 per chunk (≈0.5% of the deploy); break-even at a 0.5% duplicate-chunk rate, and Venti (27.8–31.3% duplicate blocks) and Meyer & Bolosky (whole-file dedup alone ≈75% of block-level savings) suggest real corpora are far above that. Side benefits: the pointer array replaces the coverage bitmap (nonzero pointer = present), contracts read chunk i without a proof, and the on-chain manifest becomes contract-readable for state-tier files — which is constraint (1). Note the trade honestly: tree-keyed salts were chosen because they make addresses computable from (T, i) with zero pointer storage; the pointer slot buys that property back for 22.1k.
2. One identity across submission sizes. Today the same bytes at 20,480 and 262,144 yield two RecordIds bridged by RepresentationBinding. The bao-tree "chunk group" construction removes this: fix the leaf at `CHUNK_SIZE_ALIGN` (4,096), and treat any aligned power-of-two group of leaves as a submittable unit whose root is the interior node (with the promote-when-odd rule, aligned group roots computed standalone equal the full-tree interior nodes because pairing never crosses an aligned boundary). Cost: proof depth +3 (20 KiB → 5 leaves) to +6 (256 KiB), hashing unchanged (the chunk is hashed once either way, in 4 KiB pieces), roughly +100–200 B of calldata per proof. This is a ChunkTree/2 decision because it changes the root formula.
3. Sub-tree/prefix sharing between similar files. With positional fixed chunks, an insertion shifts every later chunk; sharing exists only before the edit point. CDC (FastCDC, 2/8/64 KB) recovers 10–20% more redundancy but requires (a) the chunker and its parameters inside the type (identity fragility, the IPFS CID problem), (b) byte-length annotations on interior nodes (`node = keccak(0x01 ‖ leftLen ‖ L ‖ R)`, IPFS `blocksizes`) so offset → chunk is an O(log n) descent instead of arithmetic, and (c) ~2.5× more chunks at state tier. On-chain verification cost is nearly unchanged (+8 B per proof level); the cost is client complexity and a second identity space. Recommend a `ChunkTree/2` with a `chunker` field only when a fixture with large, edited, state-tier files appears; for files under one chunk (most on-chain files) CDC gains nothing.
4. Closure fan-out. `MAX_CLOSURE_MEMBERS = 16` means 1M names need depth 5, and a snapshot that changes one leaf rewrites 5 closure records; a 16-member closure with 24-byte names is ≈1,074 B ≈ 34 words ≈ 750k gas, with maximal names ≈4,770 B ≈ 3.3M. That is Git-tree path copying at state prices. Prior art's answer is IPFS's 256 KiB–1 MiB directory node with HAMT beyond it; EFS's answer should be: closures for releases/snapshots only, a mutable state mapping (+ parent-hash history) for live directories, and a raised member cap if SR-18e's 16-reference bound can be revisited for closure-typed records.
5. Delta/resemblance is correctly absent; keep it absent in state.

Bottom line: ChunkTree/1 is a sound Venti/Arweave/Bao-family commitment. The design's real dedup leak is not in the record but in the byte store's key, and it is a one-line salt change plus a 22.1k-per-chunk pointer.

## 7. Not found / caveats

- No published dedup ratio for IPFS UnixFS or for `nix-store --optimise` was located this session.
- The Meyer & Bolosky fixed-vs-Rabin per-chunk-size table and the FastCDC absolute MB/s numbers were not retrievable (403 on USENIX/SNIA PDFs; the FastCDC text was extracted locally via pypdf for the parameters and percentage claims cited).
- ZFS classic "320 B per DDT entry" guidance was not re-verified; the despairlabs and TrueNAS figures above are used instead.
- The local Git measurement mixes zlib and delta savings; Git does not expose them separately.

## Sources

- Linux VFS overview, docs.kernel.org/filesystems/vfs.html (current); ext4 inodes, docs.kernel.org/filesystems/ext4/inodes.html (struct sizes as of Aug 2019).
- OpenZFS dedup: despairlabs.com "OpenZFS deduplication is good now and you shouldn't use it" (2024-10-27); TrueNAS "ZFS Deduplication" reference; Klara "Introducing OpenZFS Fast Dedup" (2024).
- btrfs: archive.kernel.org btrfs wiki "Deduplication"; btrfs.readthedocs.io "Reflink".
- APFS: A. Leventhal, "APFS in Detail: Space Efficiency and Clones" (2016-06-19); Eclectic Light, "APFS: Files and clones" (2024-03-20).
- bcachefs: bcachefs-docs.readthedocs.io "Reflink".
- Git: git-scm.com Pro Git ch. 10 "Git Objects", "Packfiles"; local MEASURED `git count-objects -vH` / `git verify-pack -v` on `/Users/james/Code/EFS/contracts` (2026-09-10).
- Venti: Quinlan & Dorward, FAST 2002, mirror 9p.io/sys/doc/venti/venti.html; Fossil manual, man.cat-v.org/plan_9/4/fossil.
- IPFS: specs.ipfs.tech/unixfs (current); docs.ipfs.tech Kubo CLI (`size-262144`, max width 174); IPFS HAMT sharding spec issue #32.
- Perkeep: perkeep.org/doc/schema, /schema/bytes, /schema/file; bup DESIGN.md (rollsum parameters); git-lfs issue #355 (Camlistore example).
- Nix: nix.dev manual "Content-Addressing Store Objects" (2.26), "Store Path Specification" (2.22), RFC 0062.
- CDC: Muthitacharoen et al., LBFS, SOSP 2001; Xia et al., FastCDC, USENIX ATC 2016 (paper text); Gregoriadis et al., arXiv 2409.06066 (2024); VectorCDC, ACM TOS 2025 (arXiv 2508.05797); VSEQ/SeqCDC, arXiv 2505.21194 (2025); Zhang et al., Finesse, FAST 2019; Palantir, ASPLOS 2024.
- ADS/append-only: Miller, Hicks, Katz, Shi, POPL 2014; RFC 6962 / RFC 9162; Li, Krohn, Mazières, Shasha, SUNDR, OSDI 2004; Grin MMR docs; "Merkle Mountain Ranges are Optimal", ePrint 2025/234; Moore & Paredes Garcia, "Parent-Hash DAG", arXiv 2606.09593 (2026-06-08).
- BLAKE3/Bao: github.com/oconnor663/bao README + docs/spec.md; github.com/n0-computer/bao-tree README.
- On-chain prior art: github.com/frolic/ethfs README; docs.fxhash.xyz/onchfs (system overview); github.com/0xsequence/sstore2 README; Arweave data_root docs (docs.arweave.org HTTP API).
- Gas: EIP-2929; go-ethereum `params/protocol_params.go` (master, 2026-09); EIP-3860; EIP-7825 via EFS §8.4.
- Meyer & Bolosky, "A Study of Practical Deduplication", FAST 2011 (abstract figures via USENIX/HighScalability summaries).