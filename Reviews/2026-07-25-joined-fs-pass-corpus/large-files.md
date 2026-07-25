# Large on-chain files as a first-class feature — the coherent file-bytes model

**Lane:** large-files lane, 2026-07-25 joined KEL × authority × lens filesystem reconciliation pass (ruling 6 + tension T3)
**Question owned:** how a file references and verifies its bytes as ONE coherent generation; the honest storage-tier ladder; the write journey at scale; the mounted read journey; and how each of those breaks
**Status:** reconciliation input; nothing here is ceremony-final
**Inputs:** [[large-file-uploads]] (base mechanism, read in full), [[onchain-completeness]] (item 16 + The Line), [[mountable-filesystem-semantics]] (§§3.4, 4–5, ranked cracks, open questions), [[playable-archive-requirements]] (PAF-2/PAF-3), [[owner-rulings]], [[owner-decision-inbox]], [[human-overview]], [[codex-kinds]], [[kel]] (envelope seam), [[client-os-pressure-report]] (P11), [[solana]] (ByteStore port), [use-cases.md](use-cases.md) (register rows R-BA1–R-BA8, journey (e), §6 T3)
**Audience:** the pass synthesizer and critic first; James's packet second

#status/draft #kind/review #repo/planning #topic/efsv2 #topic/large-files #topic/storage

---

## 0. Verdict in one page

The [[large-file-uploads]] mechanism survives this lane's re-examination intact: one signature transitively commits every byte; chunks are proof-admitted, unsigned, permissionless, resumable, dedupable; the trilemma (one signature ≠ author-bound permanence ≠ funded completion) stays honestly named. Nothing below replaces it. What this lane adds is the layer the mechanism never specified — the layer [[mountable-filesystem-semantics#9. Ranked cracks and their likely homes]] flags as **critical**: *"size, codec, commitment, mirror, and bytes cannot come from different winners; a whole-file hash cannot authenticate an arbitrary range."*

Four results:

1. **The file generation model (§1).** Today the byte-facing facts of a file — `contentHash`, `size`, encoding, the `chunks` manifest, the `mirrors` set — are separate LWW slots that can resolve to different winners at one basis, producing a torn file. The fix is structural, not procedural: **the manifest IS the generation.** One signed reserved-key row carries the complete byte-coherence tuple; every other byte-facing row is either derived-and-must-match or advisory. Range reads verify per chunk against the manifest's Merkle root with dual keccak/SHA-256 leaves (adopting [[client-os-pressure-report]] P11); a cacheable self-verifying **leaf vector** (~0.14% of file size) makes seek-heavy mounts cheap. Two genuinely new conformance rules fall out: **chunk-length exactness** (§1.4, closes a range-arithmetic forgery by the author) and **generation-scoped mirror claims** (§1.5, closes the stale-mirror-noise gap in the dual-role `mirrors` row of [[codex-kinds]]).
2. **T3 dissolves under the tier ladder (§2), exactly as [use-cases.md](use-cases.md#6-tension-reconciliations-as-the-use-case-corpus-sees-them) T3 sketched, now at mechanism level.** Ruling 6's "large on-chain files first-class" and item 16's "calldata bytes are off-chain DA-tier" never conflicted: the first-class on-chain file is **state-tier bytes** (contract-readable in bounded gas — passing item 16's own test); the calldata rail stays @EPHEMERAL. The reconciliation work is vocabulary hygiene: §2.5 is the kill-list of every wording that lets DA-tier masquerade as on-chain, including two phrases in [[large-file-uploads]] itself. File grades become a clean two-axis algebra: *authorization grade × availability grade*, never collapsed (§2.6) — which also keeps T4's axes separable.
3. **The write journey ports and survives the KEL reopen (§3).** The mechanism is drive-local by construction (ruling 2 check passes: same manifest + same proofs replay on any EVM drive; nothing chain-specific enters file identity). The KEL seam check yields one sharp, previously unstated invariant: **chunk admission is authorization-free and must stay that way** — rotation, revocation, and `authEpoch` bumps affect the *manifest's record grade*, never in-flight byte submission. Costs are stated order-of-magnitude honest (state tier ≈ 2×10⁸ gas/MB, DA tier ≈ 2–4×10⁷ gas/MB from protocol constants; fiat and venue numbers are exactly what E2/E1 must measure — no number here is a measurement).
4. **The mounted 2GB file works, and this lane supplies the conformance answers the mount contract's open questions asked for (§4):** the selected-file-generation tuple, the carrier range-verification table (with the useful corollary that *any* range-capable carrier becomes chunk-verifiable once a manifest exists — the manifest, not the carrier, is what buys authenticated seeking), the partial-availability error mapping (UNKNOWN ≠ missing-bytes ≠ absent), and streaming-playback rules for the playable archive.

How this page breaks: if the reader takes "the manifest is the generation" to mean the *bytes* are trustworthy because the manifest is signed, they have re-created the manifest-vs-bytes confusion — a signed manifest proves the author *committed* to this chunk tree, not that the tree's concatenation matches its own `contentHash` claim (§5.3), not that anyone will ever fund completion (§5.4), and not that the geometry is sane (§5.5). Every guarantee in this file is scoped to exactly what a proof checks.

---

## 1. The file generation model

### 1.1 The blind spot as it stands (VERIFIED against the current docs)

The current pieces, each individually sound:

- **DATA is pure identity** — `dataId = keccak(author, salt)`, owned, unforgeable, carrying no content ([[large-file-uploads#Files, mirrors, and integrity — on-chain vs off-chain (ADR-0049 carried forward)]]).
- **The `chunks` reserved-key row** carries a `FileManifest` body `{chunksRoot, chunkCount, chunkSize, contentHash, size, encodingTag, preferredTier, expiresAt}` ([[large-file-uploads#The mechanism]]).
- **`contentHash`/`size`/`type`/`name`** exist as separate Tier-1/2 point-readable facts ([[onchain-completeness#2a. The strong core — genuinely on-chain, matches or exceeds v1 (Tier 1/2, KEEP)]]).
- **`mirrors`** is a dual-role reserved key: PIN = primary mirror, TAG = additional mirrors ([[codex-kinds]] MIRROR row).

The blind spot: these are **independent (author,key) LWW slots**. Nothing today forces them to agree. An author who updates a file by writing a new `chunks` row and a new `size` row in two envelopes (or whose second envelope half-fails replication to a mirror venue) leaves a basis at which `size` says 40 MB, `chunks` commits 12 MB, and `mirrors` points at bytes for either. Every downstream consumer — the mount's `stat`, the archive's preflight ([[playable-archive-requirements#PAF-3: Verified, Low-Friction Loading]]), a contract reading file metadata — would be reading a **torn generation**. [[mountable-filesystem-semantics#Open questions]] asks for exactly the missing object: *"What selected-file-generation tuple prevents size, encoding, content commitment, mirror, and bytes from resolving from different claims?"*

### 1.2 The fix: the manifest IS the generation

**Rule: one signed manifest row is the single authoritative source of every byte-coherence fact for a file, and a "file generation" is one resolved winner of that row.**

Candidate recut of the `FileManifest` body (exact field encoding is delegated ceremony work; the *tuple membership* is the design claim):

```text
FileGenerationV1 (the body of the `chunks` reserved-key PIN row on a DATA)
  size            uint64   — exact logical byte length
  keccakContent   bytes32  — keccak256 of the logical byte stream
  sha256Content   bytes32  — SHA-256 of the logical byte stream (SRI/import-map interop; P11)
  encodingTag     word     — stored-stream ↔ logical-stream relationship (identity default; §1.7)
  chunksRoot      bytes32  — keccak Merkle root over chunk leaves, chunk count bound at the apex
  chunkCount      uint32
  chunkSize       uint32   — uniform stored-chunk length; last chunk = remainder (§1.4 exactness rule)
  capabilityFloors bits    — author-committed floors: `contractReadable` (adopted 2026-07-07), reserved bits
  (dropped: preferredTier — see Reconciliation ledger #13)
  (reserved: extension frame for future digests/floors, fail-closed on unknown critical bits)
```

Resolution rule (the mount/SDK/read-layer contract):

1. Resolve the `chunks` slot winner **once** at the pinned basis. That one record body supplies size, both content digests, codec, chunk geometry, root, and floors. There is no second place to look.
2. The **generation identity** is the winning manifest's claim/record identity (its `claimId`/record digest), *not* `chunksRoot`. `chunksRoot` is the **byte-store address** — deliberately shareable: two files (or two generations) committing identical bytes share one chunk store and dedup across files and chains ([[large-file-uploads#The mechanism]] storage key). Generation-of-file and bytes-of-generation are different objects, and conflating them is how splicing confusion starts (§5.1).
3. Legacy/simple point rows (`contentHash`, `size`) become **derived conveniences**: valid only when they match the winning manifest at the same basis; a mismatch is a diagnostic (`METADATA-DIVERGENT`), never an alternative answer. Whether they are kept at all is a recut economy question — they were the v1 pattern; under the manifest-is-generation rule they are redundant state. (Delegated, flagged for the codex-kinds recut.)
4. The **mirror set is the one byte-facing thing resolved separately** — it is availability advice, not coherence data — and every mirror observation must state which `chunksRoot` (or content digest) it serves (§1.5).

This preserves ADR-0049 exactly: identity is never content-derived (dataId stays owner/salt-derived; generation identity is claim-derived); content commitments remain claims about bytes, with verification happening where bytes flow ([[large-file-uploads#Files, mirrors, and integrity — on-chain vs off-chain (ADR-0049 carried forward)]]).

### 1.3 How a file node references its bytes, exactly

The full reference chain, one hop per line, with what each hop proves:

```text
DATA identity (dataId)                         — who owns this file node (unforgeable, contentless)
  └─ `chunks` PIN slot winner at basis B       — WHICH generation (lens/authority-resolved, graded)
       └─ FileGenerationV1 body                — size, digests, codec, geometry, floors (signed)
            └─ chunksRoot                      — commits every chunk hash + the true count at apex
                 └─ chunk leaf (index i)       — dual digest of chunk i's exact bytes
                      └─ chunk bytes           — from ANY carrier; admitted/served only if proven
```

The signature chain from [[large-file-uploads#The mechanism]] is unchanged: `signature → recordsRoot → manifest leaf → chunksRoot → every chunk hash`. What §1.2 adds is that the *reader's* chain is now equally total: there is exactly one path from "open this file" to "these bytes are the ones committed," and every link is either a signature check, a slot resolution with a grade, or a hash proof. No link is a mirror's word, a Content-Length header, or a second slot that could disagree.

### 1.4 Range verification: leaves, proofs, the leaf vector, and the exactness rule

**Whole-file hashes do not authenticate ranges.** A reader holding only `sha256Content` must fetch and hash the entire stream before releasing byte one — [[mountable-filesystem-semantics#12. Falsification tests]] test 16 makes refusing unverified prefixes a conformance requirement. Chunk-level commitments are what make a 2 GB seek O(chunk), and they are already reserved; this section pins their semantics.

**Leaf construction (adopting P11).** Each leaf commits chunk `i` as a dual digest:

```text
leaf_i = keccak256(DOMAIN_CHUNK_LEAF_V1, keccak256(chunk_i), sha256(chunk_i))
```

- keccak is the EVM-native digest (`submitChunk` verification stays cheap; the SHA-256 precompile at 0x02 keeps on-chain dual verification affordable — PLAUSIBLE, price in the E2 snapshot).
- SHA-256 is what browsers, Subresource Integrity, import maps, IPFS, and most non-EVM platforms speak natively. [[client-os-pressure-report]] P11 names the retrofit pain if this word is missing when EFSBytes vectors freeze: clients re-hash every module in a service worker and forfeit browser-enforced pinning. This lane adopts P11 into the leaf itself rather than as a parallel manifest array — one tree, either digest usable at read time. (PLAUSIBLE — the alternative, a separate sha256 leaf array in the manifest, trades proof-size for submit-gas; settle with vectors + the gas snapshot.)
- Proofs bind **(leaf, index, root)**: the Merkle path position is the chunk index, so a valid proof for chunk 7 cannot authenticate those bytes as chunk 9 (§5.1).

**The chunk-length exactness rule (new — must be normative).** The manifest declares uniform `chunkSize`; range arithmetic (`offset → chunk index`) is only sound if actual chunk byte-lengths match the declared geometry. A malicious author can build an *internally consistent* Merkle tree over irregular-length chunks while declaring uniform `chunkSize`: every chunk then verifies against its leaf, but assembled ranges are silently misaligned — bytes that prove correctly and are still the wrong bytes for the requested offsets. The full-file digest would catch it, but range readers never compute the full digest. Therefore:

> For `i < chunkCount−1`: `len(chunk_i) == chunkSize` exactly. For the last chunk: `len == size − chunkSize·(chunkCount−1)`, with `0 < len ≤ chunkSize`. `EFSBytes.submitChunk` MUST enforce this on-chain (it knows index, declared geometry via the store's creation parameters, and the submitted length); every off-chain verifier MUST enforce the same rule; a generation whose committed tree violates it grades `CONTENT-MALFORMED` (attributable to the author — the manifest is signed).

This closes the geometry attack at the write path for on-chain tiers and at first verification for mirror tiers. (Caveat, VERIFIED-gap: the current `submitChunk(chunksRoot, tier, index, bytes, proof)` signature takes the root but not the geometry; the store must learn `{chunkCount, chunkSize, size}` at store creation — e.g. bound into store initialization and checked against the apex count — a small but real EFSBytes interface delta for the recut.)

**The leaf vector (new derived artifact).** Sibling-path proofs per range read are wasteful for seek-heavy workloads. The better shape: the full ordered vector of chunk leaves — `chunkCount × 32` bytes ≈ **0.13%** of the file at 24 KB chunks — is itself self-verifying (recompute the root, compare to the signed `chunksRoot`), carrier-independent, and cacheable forever. A mount daemon fetches it once per generation from any mirror (or reconstructs it from state-tier bytes), verifies it in one pass, then serves every subsequent range read with **zero further proof traffic**: fetch chunk, hash, compare to `leaf_i`, serve. Convention, not kernel surface: publish the leaf vector as an unsigned derived sibling artifact alongside mirrors (it needs no signature — it is checkable against the root). For a 2 GB file: ~87,400 leaves ≈ 2.8 MB, one fetch, then O(1) verification per chunk. (PLAUSIBLE, new; the SDK/mount design should adopt it; nothing freezes.)

**Bounding rule:** a reader MUST sanity-bound `chunkCount` *before* fetching or allocating for a leaf vector (§5.5) — the vector is attacker-priced (the author sets `chunkCount`), so profile-level maxima are reader policy, not trust.

### 1.5 Update = new generation; old generations are preserved

File update requires **no new machinery** — it is the existing supersession model applied to the manifest slot:

1. Author signs a new envelope carrying a new `FileGenerationV1` row at a higher `order` on the same `(author, chunks-key, dataId)` slot. LWW makes it the current generation.
2. The **old generation is not erased**: the full-body spine (adopted items 17/18, [[owner-rulings#2026-07-15]]) keeps the superseded manifest body state-resident forever, and its chunk store is untouched — pool bytes are permanent and unattributed by ruling ([[large-file-uploads#James rulings (2026-07-07)]] #2). A pinned read at an old basis, or an explicit generation-addressed read (`~store:<chunksRoot>` — generation-addressed by construction), reproduces the old file exactly. This is what makes `(id, basis, contentHash)` citations (register row R-PA2, [use-cases.md](use-cases.md#51-portable-artifact-pa)) re-verifiable forever.
3. **Shared chunks dedup across generations.** An appended log or a re-encoded video shares most chunk leaves with its predecessor; identical chunks land at the same content-addressed store slots, so generation N+1 pays gas only for changed chunks in on-chain tiers. This is a property, not a promise: alignment-shifting edits (insert one byte at offset 0) share nothing under fixed-boundary chunking. Content-defined chunking would fix that but is a codec-layer choice under `encodingTag`, not kernel surface. (PLAUSIBLE; note for SDK guidance.)
4. **`relatedVersion`/`supersededBy` rows** ([[codex-kinds]] REDIRECT rows) carry the human versioning story; the manifest slot carries the mechanical one. Neither substitutes for the other.

**Generation-scoped mirror claims (new — closes a real gap).** The `mirrors` dual-role row is *file*-scoped: mirrors added for generation 1 remain attached to the DATA after generation 2 wins the manifest slot. Integrity is safe (gen-1 bytes fail gen-2's leaf checks) but availability honesty is not: the best-mirror view would rank mirrors that can only ever produce `CONTENT-MISMATCH` for the current generation, and a reader cannot tell a stale mirror from a lying one. Rule: **a mirror claim SHOULD name the `chunksRoot` (or content digest) it serves; the bounded best-mirror view and client mirror selection MUST prefer generation-matching mirrors and MUST label generation-unknown mirrors as such.** Old mirrors remain valid *for the old generation* — which is exactly what a basis-pinned historical read wants. This is a row-shape amendment for the [[codex-kinds]] MIRROR recut, zero new index state (the mirror hierarchy is already kept — [[owner-rulings#2026-07-15]] item C).

### 1.6 Small files: one model, degenerate case

A 100 KB file is a 5-chunk manifest; a 3 KB file is a 1-chunk manifest whose root is (domain-separated) its own leaf. The recommendation is **uniformity downward**: every byte-bearing file uses the generation model, because (§4.2's corollary) the manifest is what buys verified range reads on *every* carrier, and a second "simple small file" path is a second code path, a second verification story, and a second place for coherence to tear. The one honest exception: values small enough to intern inline (≤ `MAX_VALUE_BYTES` = 8192, [[codex-kinds]]) already live state-resident inside record bodies, where the body IS the bytes and no manifest is needed. Boundary and exact encoding: delegated to the recut with vectors, not an owner call.

### 1.7 Codec/encoding semantics (pinning what `encodingTag` means)

The base doc carries `encodingTag` without semantics. Pinned here:

- **The chunk tree always commits the *stored* byte stream.** All chunk verification, range arithmetic, tier storage, and the exactness rule operate on stored bytes.
- `size`, `keccakContent`, `sha256Content` describe the **logical** stream; `encodingTag` names the stored→logical mapping. `identity` (stored = logical) is the default and the strongly recommended v2 posture.
- **Seekable verified logical ranges exist only under `identity`** (or a future explicitly-seekable framing declared by tag). A gzip-stored file cannot honestly serve a verified logical range without full decode; a mount facing a non-identity encoding it does not support exposes the stored stream + metadata rather than lying.
- **`contractReadable`-floored files SHOULD be `identity`-encoded**: a contract reading bytes through `extcodecopy` pages should not need a decompressor for "bounded gas" to stay honest. (PLAUSIBLE-recommendation; make it a SHOULD in the profile, not kernel enforcement — the pool is permissionless.)

---

## 2. The storage-tier ladder, reconciled with T3 and priced honestly

### 2.1 The ladder

| Tier | Where bytes live | Contract-readable (bounded gas)? | Client-verifiable? | Lifetime | Grade |
|---|---|---|---|---|---|
| **State (tier 0, SSTORE2)** | contract code via `CREATE2(keccak(bytes))`, read via paginated `extcodecopy` | **YES** | yes | permanent state (chains-don't-die; untouched by EIP-4444) | `BYTES-COMPLETE@STATE` |
| *(tier 1, inline SSTORE — reserved, not shipped)* | contract storage slots | yes | yes | permanent state | — reserved ([[large-file-uploads#The mechanism]] #4) |
| **DA (tier 2, calldata)** | transaction history; commitment + presence bit in state | **NO** — past calldata is not readable by contracts | yes, while history is retained (archival ~1 yr+, EIP-4444-prunable) | pruning-bounded **regardless of chain health** | `BYTES-COMPLETE@EPHEMERAL` (a.k.a. @DA) |
| *(tier 3, blob — reserved)* | blob sidecars, ~18-day prune | no | yes, ~18 days | reserved until durable-blob tech (EthStorage-class) exists ([[large-file-uploads#Adopted from B (additive now, transport-independent)]]) | — reserved |
| **Mirror** | Arweave / IPFS / HTTPS / any carrier | no | yes (against the manifest; natively for CID/data_root carriers) | carrier-dependent: endowment / pinning / operator | `BYTES-COMPLETE@OFFCHAIN` |

Plus the incompleteness grades that cut across tiers: `BYTES-PARTIAL(k/n)` (n is root-bound, never trusted from a field), `BYTES-UNBOUND`, `CONTENT-MISMATCH`, and (new, §5.3) `CONTENT-MALFORMED`. All from [[large-file-uploads#The mechanism]] #6 except the last.

### 2.2 Item 16's own test, applied per tier — T3 dissolves

James's governing definition ([[owner-rulings#2026-07-15]] item 16): **"if a contract can't read it in bounded gas, it's off-chain."** Applied honestly:

- **State-tier bytes PASS the test.** `extcodecopy` over content-addressed chunk contracts is a bounded keyed read; a contract can read chunk `i` of a floored file in bounded gas today (G-DAPP-2's fully on-chain NFT is the existing consumer — [use-cases.md](use-cases.md#212-contract-consuming-dapps--g-dapp-the-on-chain-composability-cases)). So ruling 6's "large on-chain files first-class" has a non-empty, item-16-compliant referent: **a large on-chain file IS a state-tier file.** Item 16 never excluded these — its text classifies *calldata* bytes, and its companion item 18 explicitly scopes no-elision to record bodies, "not large file BYTES (those stay ephemeral per 16)."
- **DA-tier bytes FAIL the test and stay off-chain, exactly as ruled.** The chain carried them once and keeps only the commitment + presence bit in state. They are client-verifiable (better than a bare mirror: publication was proof-checked once, on the record) but no contract can consume them and history retention — not chain death — bounds their life. The middle-tier honesty note in item 16 ("client-verifiable-without-trust but not contract-composable") is preserved verbatim as this tier's definition.
- **Mirror-tier bytes were never claimed on-chain.** Their commitment is on-chain; their availability is a labeled external fact.

So T3's apparent conflict was a vocabulary collision, not a design fork: *"large on-chain files are first-class"* (ruling 6) and *"calldata file bytes are off-chain"* (item 16) are statements about **different tiers**. The reconciled sentence, proposed for the constitution:

> **A file is "on-chain" exactly to the extent its bytes are state-resident and contract-readable in bounded gas. EFS supports large on-chain files as a first-class feature at the state tier; the DA rail and mirrors are first-class *transports and carriers* whose grades never claim the state tier's properties.**

### 2.3 Which use cases earn the state tier

The state tier is the expensive, powerful tier; pricing it honestly (§2.4) means naming who pays it and why. From the [use-cases.md](use-cases.md) register and the adopted rulings:

1. **Bytes a contract must read** — the non-substitutable case, and the ruled rationale for the `contractReadable` floor ("you cannot get it from Arweave/IPFS/anywhere off-chain" — [[large-file-uploads#James rulings (2026-07-07)]] #1). Fully on-chain NFTs (UC-A6/G-DAPP-2), on-chain-rendered assets, data a folder-gated contract consumes (G-DAPP-1/3), small critical manifests a gate verifies.
2. **Century-critical bytes whose survival must not depend on any operator, endowment, or pin** — "extremely important historical documents" (ruling 4's L1 exception; the L2/L3 state tier is the affordable primary for this class). State-permanence and contract-readability are coupled in the EVM — the documented caveat of the floor ruling — so this class rides the same tier.
3. **Roots of trust for other storage** — leaf vectors or package release manifests for archives whose *bulk* lives on mirrors: small state-tier anchors, large mirror bodies. (PLAUSIBLE pattern; the archive's PAF-2 closure wants exactly this shape.)

Everything else — the 20k-photo archive (G-PHOTO-1), the web archive (UC-A9), podcast media (G-WEB-2), the 40 MB game (journey (e)) — defaults to **commitment + indexes on-chain, bytes on Arweave-class mirrors, DA publication optional**, per the adopted storage direction (on-chain + Arweave, L2/L3-first — [[owner-rulings#2026-07-10]] Storage, [[owner-decision-inbox]] settled list). Where the default publish ceremony lands on this ladder is LF-J1 (Decisions).

### 2.4 Honest cost shape (order-of-magnitude; E2/E1 are the gates)

Stated in gas from protocol constants (VERIFIED as constants; totals are arithmetic; **no fiat, no venue numbers — those are exactly what E1/E2 must measure**, per [[owner-rulings#2026-07-23]] "none of the chain/authority space is measurement-backed yet"):

- **State tier:** code-deposit cost 200 gas/byte + calldata carriage (~16/byte) + CREATE2/proof/bitmap overhead ⇒ roughly **220–240 gas/byte ≈ 2.3×10⁸ gas per MB**, in ~5.5 M-gas transactions per 24 KB chunk. Scale anchor: 1 MB of state bytes ≈ several *full L1 blocks* of gas — which is why L1 is "exceptional documents" and the state tier is an L2/L3 product (ruling 4). A 1 GB state-tier file is ~43,700 transactions; nothing about the mechanism forbids it, and the bill says why it will be rare.
- **DA tier:** calldata at 16 gas/nonzero byte, with the EIP-7623 floor pushing data-dominated transactions toward ~40 gas/byte ⇒ **~2–4×10⁷ gas per MB** — roughly 5–10× cheaper than state, no state growth, pruning-bounded life. (PLAUSIBLE on the 7623 figure — re-verify the exact floor constants during the costing pass.)
- **Mirror tier:** orders of magnitude cheaper per byte than any chain tier; Arweave's pay-once endowment is the durable off-chain bet ([[owner-rulings#2026-07-10]] Storage). Not gas-denominated; not measured here.
- **Fixed overhead per file (any tier):** one envelope admission + one manifest row + mandatory indexing — the per-record kernel bill that E2's single aggregate snapshot must price ([[onchain-completeness#4. The corrected keep/demote line + the one gas bundle]]).
- **EIP-7907 upside** (24→64 KB code): bigger tier-0 chunks, ~2.6× fewer transactions per file, automatic under runtime `chunkSize` — the forward-compat design already banks this without freezing it ([[large-file-uploads#Forward-compat (rides the scaling curve, zero Etched change)]]).

**The gate, named:** no tier choice, default ceremony, or product promise built on these ratios is sign-off-able until the **E2 aggregate gas/state snapshot** exists — and the [[large-file-uploads#The de-risking experiment (a few days, one L2 testnet)]] slice is the cheapest way to convert two of these rows from arithmetic to measurement.

### 2.5 The masquerade kill-list (wording that must not survive the recut)

Tier (b) masquerading as tier (a) is T3's actual failure mode. Kill or fence these:

1. [[large-file-uploads#What this rules]]: *"permanent bytes on-chain"* in the headline sentence — true only for state tier; the sentence covers both rails. → "permanent commitment on-chain; bytes per tier."
2. [[large-file-uploads]] tier-2 description *"cheapest; bytes ride in history"* — add the mandatory suffix *"not contract-readable, not state, prunable: off-chain by the adopted definition."* The doc's own §"Etched vs Durable" and grades already know this; the prose shortcuts don't.
3. Any UI/SDK string "stored on-chain" for a DA-tier or mirror-tier file. Reader-facing rule: **the tier is part of the grade, and the grade is part of the read** (pass ruling 3's every-read-shows-its-grade, applied to bytes). `BYTES-COMPLETE@EPHEMERAL` must render as its own thing — "published via chain, retention-bounded" — never as "on-chain."
4. "Presence bitmap set" ⇒ "bytes available": the bitmap is per `(chunksRoot, tier)` store; a tier-2 bit means *published-and-verified-once*, not *retrievable now*. Completeness answers MUST be tier-labeled; bits MUST NOT be summed across tiers into one number (§5.1d).
5. `preferredTier` (advisory manifest field): an author-side tier *wish* with no enforcement is precisely the wording that invites "the author said on-chain" claims. Drop it; the `contractReadable` capability floor (enforced at read: no `COMPLETE` until a contract-readable tier holds the bytes) is the honest replacement and already ruled. (Reconciliation ledger #13.)
6. The phrase "the file is on Arweave" as an identity claim — mirrors are transports; the file is its DATA + generation ([[large-file-uploads#Files, mirrors, and integrity — on-chain vs off-chain (ADR-0049 carried forward)]] already rules this; keep it ruled).

### 2.6 The grade algebra: authorization × availability, never collapsed

A file generation's read grade is the **product of two orthogonal axes**, mirroring the seam-6/seam-7 axis discipline in [[human-overview#7. The seams that must be closed]]:

- **Authorization axis** (the manifest *record's* grade, owned by the KEL/authority lanes): `AUTHORITY-ADMITTED` (+receipt) / `PORTABLE-EVIDENCE` / revoked-actor / disputed-window states. The two-grade working hypothesis (pass ruling 3) lives entirely on this axis.
- **Availability axis** (this lane): `BYTES-COMPLETE@{STATE|EPHEMERAL|OFFCHAIN}` / `BYTES-PARTIAL(k/n)` / `BYTES-UNBOUND` / `CONTENT-MISMATCH` / `CONTENT-MALFORMED`.

Every combination is legal and honest: a strongly-admitted file can be `BYTES-PARTIAL` (authorized-but-unfunded upload); a bare-EOA evidence-grade file can be `BYTES-COMPLETE@STATE` (anyone paid to promote its bytes — the pool is permissionless). Readers, gates, and the mount consume the pair; collapsing them into one scalar is how "verified!" UI lies get built. This keeps T4 separable by construction: nothing in the byte model assumes any authority topology — the availability axis is computed identically under N1A/B/C/D.

---

## 3. The write journey at scale, re-checked

### 3.1 The flow (unchanged; restated with the generation model)

1. **Client-side:** chunk the stored stream (uniform `chunkSize`, exactness rule); compute dual-digest leaves; build `chunksRoot` (count-at-apex); assemble `FileGenerationV1`; optionally set `contractReadable`.
2. **One signature:** the ordinary v2 envelope commits `{DATA (if new), the manifest row, placement rows, any package-ledger rows}` — one `eth_signTypedData_v4`-class act for a 100-file game or a 100 GB dataset ([[large-file-uploads#The mechanism]] #1–2; UC-A4's blessed bulk pattern).
3. **Envelope admission:** the venue kernel admits the records (authority lane rules per the KEL recut); mandatory indexing fires; the commitment is durable and portable *from this instant*, whatever happens to the bytes.
4. **Byte streaming, permissionless:** any account calls `submitChunk(chunksRoot, tier, index, bytes, proof)`; admission = proof + length-exactness, `msg.sender` ignored; presence bitmap records progress; chunks land out-of-order, in parallel, across any number of submitters; re-submission is a no-op ([[large-file-uploads#The mechanism]] #3, #5).
5. **Resumption/completion:** `missingChunks` from the bitmap; a different relayer finishes an abandoned upload under the original signature; `BYTES-PARTIAL(k/n)` until done; the `contractReadable` floor holds `COMPLETE` hostage to a state-tier copy if set.

### 3.2 Per-chain check (ruling 2): does it port unchanged? YES, with the invariant named

- **What is portable (file identity):** the signed envelope, `dataId`, the manifest body, `chunksRoot`, leaves, chunk bytes, proofs. Replication to drive B = re-submit the same envelope + re-run `submitChunk` with the *same proofs* against B's EFSBytes ([[large-file-uploads#James rulings (2026-07-07)]] #4 correction). Same file, same generation, same verification, N drives.
- **What is drive-local (and must never enter identity):** the EFSBytes contract address, CREATE2 chunk-store addresses (initcode-version-dependent — red-team fix #2 anchors pledges on the ERC-7201 layout, not addresses), presence bitmaps, tier availability, `storeId` *instances*. Note `storeId = keccak(DOMAIN_CHUNKSTORE_V1, chunksRoot, tier)` contains no chainId — intentionally: the same key on every drive is what makes replication mechanical. The rule to keep: **per-drive byte state is observation; the manifest is identity.** This is exactly [[solana]]'s `ByteStore` port boundary (`putVerified/get/stat` with venue-specific storage, portable commitment — [[solana#6. Solana feasibility map]] "large bytes" row), so the model extends beyond EVM without change to the committed artifacts.
- **One EVM-shape residue:** the tier *vocabulary* (SSTORE2/calldata) is EVM-specific; the portable layer should speak **capabilities** (`contractReadable` → venue-native-program-readable) per [use-cases.md](use-cases.md#decisions-for-james) J2. This lane words the floor venue-neutrally and takes no position on J2.
- **Cross-chain currency stays honestly unsolved:** a replicated generation on drive B is an AS-OF snapshot; whether it is the *current* generation is the staleness question the substrate decision already marked "not sold" ([[large-file-uploads#James rulings (2026-07-07)]] #4). Nothing here needs or builds cross-chain machinery — consistent with the register's §5.8 finding and T2's stop-rule posture.

### 3.3 KEL-seam check (the reopened envelope): one new invariant, three clean interactions

The envelope recut adds `authorityId` + `authEpoch` and routes admission through the authority lane ([[kel]] envelope §: `authorityId = grantId, zero only for bare EOA`; [[human-overview#7. The seams that must be closed]] seam 3). Checked against the byte mechanism:

1. **The manifest is an ordinary claim.** Its authorization is the envelope's business: bare-EOA manifests are `PORTABLE-EVIDENCE`; authority-admitted manifests carry receipts. The byte layer inherits the record grade through §2.6's algebra and adds nothing to the authority surface. No chunk-specific KEL machinery exists or is needed.
2. **NEW INVARIANT — chunk admission is authorization-free, and must stay so.** `submitChunk` checks a hash proof, not a signer, grant, epoch, or KEL state. Consequences, stated so nobody "fixes" them later: a revoked author's already-signed manifest continues to admit chunks forever; an `authEpoch` bump mid-upload does not strand the remaining 40% of a file; a thief's pre-revocation manifest can be *completed* by anyone post-revocation (the pointer is revocable, the pool is not — mandatory fix #3). Coupling chunk admission to live KEL state would (a) re-introduce exactly the cross-state coupling EFSBytes was designed without ("zero coupling to kernel state"), (b) break resumability across rotation events, and (c) buy nothing — the *record* grade is where authorization honesty lives. If the KEL lane ever proposes epoch-checking `submitChunk`, this paragraph is the concrete pushback.
3. **Mid-upload rotation, exactly:** manifest admitted at epoch *e*; epoch bumps to *e+1* while chunks stream → completion unaffected, grades unaffected (the admission already happened at *e*, receipts are permanent). Manifest signed but *not yet admitted* when the epoch bumps → an authority-lane question with an authority-lane answer (stale-epoch envelopes grade evidence-only or are re-signed); the byte layer simply follows whatever grade the manifest ends with. During a *pending recovery*, the OS-side rule already covers intent: queue new publications locally ([[human-overview#3. The system, from write to read]]); in-flight byte streaming for already-admitted manifests may continue — bytes are not new claims.
4. **Relayer/payer separation is untouched:** author ≠ submitter ≠ payer was already the design (`msg.sender` ignored; register row R-MODE3); native-AA payer lanes (EIP-8130-class) remain a submission adapter, never manifest surface ([[large-file-uploads]] Base note).

### 3.4 Cost shape and scale honesty

§2.4's ladder plus the transaction-count shape: `1 + ceil(size/chunkSize)` transactions per drive per tier. Parallelism is structural (precomputed CREATE2 targets, shardable across M submitters for M-fold throughput; front-running a chunk deploy is *acceleration*, not attack — same bytes, same address, idempotent). Funding/completion remains **exogenous and unsolved** — every red team flagged it; the honest default outcome of an unfunded upload is a permanent `BYTES-PARTIAL` (§5.4). The E2 snapshot plus the de-risking slice are the named gates before any of this is priced into product promises.

---

## 4. The read/mount journey: a mounted 2 GB file (ruling 9 check)

Cast: Dana (no wallet) opens `/archive/talks/keynote-2026.mp4` (2 GB, `identity` encoding, bytes on Arweave + 3 HTTP mirrors, manifest on the drive) in her platform's file manager; then a player streams it. Every step maps to [[mountable-filesystem-semantics#4. Cross-platform read-only mount contract]].

### 4.1 The walk

- **`lookup` + `stat`:** resolve the name → DATA → `chunks` slot winner at the mount's pinned basis. **`st_size` = the manifest's `size`, full stop** — never a mirror's Content-Length, never a sum of available chunks, never a second slot. If the manifest slot is `UNKNOWN` at this basis (withheld page, unreachable venue), `stat` fails transient (`EAGAIN`/`EIO`-class) — the file does not appear with a guessed size, and `UNKNOWN` never becomes not-found ([[mountable-filesystem-semantics#3.5 EFS absence can be UNKNOWN; POSIX lookup wants an answer]]).
- **`open`:** the handle pins `(dataId, generation = winning manifest claim, chunksRoot, basis)`. A newer generation admitted mid-read does not move the handle (falsification test 4); a fresh `open` sees the new winner.
- **First read / leaf vector:** the daemon fetches the ~2.8 MB leaf vector (any mirror, or reconstructed from state-tier stores), verifies it against `chunksRoot` in one pass, caches it keyed by `chunksRoot` (content-addressed cache — shared across files/generations/drives that share bytes, immune to lens/basis cache-poisoning because the key is the commitment itself).
- **`read(offset, len)`** → chunk indexes via exactness-rule arithmetic → per chunk: verified local cache → state tier (`extcodecopy` pages) → mirrors in best-mirror order (generation-matching mirrors first, §1.5) → hash fetched bytes, compare to `leaf_i`, serve. **No unverified byte ever crosses the mount boundary** (test 16). A seek to byte 1.9 G costs one chunk fetch + one hash — O(chunk), not O(file).
- **Failure mapping (the three-way split, normative):**
  1. *Cannot resolve the generation* (venue/evidence problem) → transient error at `lookup`/`stat`/`open`; retryable; never `ENOENT` unless absence is proven.
  2. *Generation resolved; chunk unavailable everywhere* → `EIO`/`ENODATA`-class at the offending offset, with diagnostics (which chunk, which tiers/mirrors tried) in the control surface; reads of **available** ranges still succeed — a `BYTES-PARTIAL(k/n)` file serves its k chunks honestly ("progressive reads, never broken" — [[large-file-uploads#The mechanism]] #6). `st_size` stays the committed logical size; availability is surfaced via `user.efs.*` (e.g. `user.efs.bytes = PARTIAL 39321/87400 @OFFCHAIN`), not by lying about size.
  3. *Chunk fetched but fails its leaf* → treat as unavailable-from-that-carrier (`CONTENT-MISMATCH` diagnostic), try the next source; only when all sources fail does the read error. A lying mirror is availability noise, never data.
- **Metadata ops never hydrate bytes:** `stat` storms, Explorer thumbnailing crawls, `find` over the archive touch manifests only (the mount checklist's history-amplification/crawler-storm budget items). Thumbnails are client-derived cache, out of scope of the byte model.

### 4.2 The carrier range-verification table (a mount-contract open question, answered)

[[mountable-filesystem-semantics#Open questions]]: *"Which byte carriers can authenticate arbitrary ranges, and which must fully fetch/hash/cache before returning any requested range?"*

| Carrier | Native range authentication | With a `FileGenerationV1` manifest |
|---|---|---|
| EFSBytes state tier | per-chunk by construction (content-addressed code + proofs) | per-chunk, dual digest |
| DA tier (calldata replay) | none live; requires archival history access | per-chunk once bytes are recovered; archive-gated |
| Arweave | native `data_root` Merkle path per ~256 KB region | per-chunk against the manifest (carrier proof optional belt-and-braces) |
| IPFS (UnixFS DAG) | native block-level verification against the CID | per-chunk against the manifest |
| Plain HTTPS mirror | **none** | **per-chunk** via HTTP Range requests aligned to chunk boundaries |
| Any carrier, **no manifest** (whole-file hash only) | none | n/a — **full-fetch-verify-before-serve is mandatory** |

**The corollary worth stating loudly:** the verification unit is the *chunk*, and the manifest travels with the file — so **the manifest, not the carrier, is what buys authenticated seeking.** Even a dumb HTTPS mirror becomes chunk-verifiable. The only files condemned to full-fetch-before-serve are those *without* a chunk commitment — which is the strongest argument for §1.6's uniformity-downward recommendation. Conversely a carrier's own proof system (CID/data_root) never *substitutes* for the manifest check: the manifest is what the author signed; the CID is what someone linked (a lens-scoped trust claim, per ADR-0049's carried-forward rule).

### 4.3 Streaming playback (the playable archive's requirement)

PAF-3 splits bytes into **launch-critical** (verify fully before execution — code, WASM, the entrypoint closure) and **streamable data** (verify incrementally under the generic large-file rules) ([[playable-archive-requirements#PAF-3: Verified, Low-Friction Loading]]). The generation model gives that split exact semantics:

- Launch-critical files: full linear verify (all chunks + logical digest check) → only then execute. This also closes §5.3's malformed-generation hole for the one class where it matters most.
- Streamed media: chunk-at-a-time verified serving; prefetch next-k chunks; player seeks are chunk-aligned range reads. A 40 MB game's data files stream during play; a 2 GB video plays from byte 0 while chunk 80,000 has never been fetched.
- Privacy note carried from P11: chunk-fetch sequences fingerprint files through any relay; the SDK owes chunk-size normalization and prefetch/padding guidance ([[client-os-pressure-report]] P11). Reserved, not designed here (pass ruling 8).

### 4.4 Conformance answers delivered to the mount contract

Explicit closure of the mount doc's byte-facing open questions: the **selected-file-generation tuple** is §1.2's `FileGenerationV1` + the one-slot resolution rule; the **carrier split** is §4.2's table; **honest absence vs unavailability** is §4.1's three-way mapping; **`st_size` provenance** is the manifest, always. The remaining mount open questions (naming, control namespace, basis identity) belong to other lanes.

---

## 5. How it breaks

Each attack, its defense, and the residue that stays honestly unsolved.

### 5.1 Chunk-proof splicing (across files, generations, indexes, tiers)

- **(a) Cross-root splicing** — present chunk bytes of root A as satisfying root B: fails cryptographically (leaf ∉ B's tree; second-preimage against keccak).
- **(b) Same-root, cross-file "splicing"** — two DATAs commit the same `chunksRoot`: *not an attack — that is dedup working.* Safe precisely because §1.2 separates generation identity (claim-derived, per-file, signed) from byte-store identity (content-derived, shared). A reader never trusts "these bytes belong to file X"; it trusts "these bytes match the root that file X's signed generation commits."
- **(c) Index transplant** — replay chunk 7's bytes+proof at index 9: fails; the Merkle path *is* the index binding (§1.4).
- **(d) Tier transplant** — count a DA-tier presence bit toward state-tier completeness (e.g., toward a `contractReadable` floor): blocked by rule — `storeId` includes the tier; completeness is computed per `(root, tier)` and reported tier-labeled; bits are never summed across tiers (§2.5.4). The floor is satisfiable *only* by the state-tier bitmap.
- **(e) Geometry forgery** — uniform-`chunkSize` declaration over an irregular-length committed tree, making per-chunk-valid range reads assemble wrong logical bytes: closed by the length-exactness rule at on-chain submission and first off-chain verification (§1.4); graded `CONTENT-MALFORMED`, attributable to the signing author.

### 5.2 A mirror serving stale-generation bytes

The mirror has generation-1 bytes; the reader pinned generation 2. Every fetched chunk fails gen-2's leaves → `CONTENT-MISMATCH` for that source → next source. **Integrity is never at risk; availability and cost are.** The real damage pre-fix is systemic: file-scoped mirror rows keep ranking gen-1 mirrors for gen-2 reads forever (wasted fetches, misleading "5 mirrors" health signals). §1.5's generation-scoped mirror claims fix ranking; the residue: a *deliberately* stale mirror is indistinguishable from an innocently stale one (fine — the reader treats both as unavailable), and a *basis-pinned historical read wants* those gen-1 mirrors — which the generation-scoped claims preserve, correctly labeled.

### 5.3 Manifest-vs-bytes mismatch discovered mid-stream

The chunk tree verifies chunk-by-chunk, but its concatenation does not hash to the manifest's own `keccakContent`/`sha256Content` (author error or malice — the two digests and the tree are independently author-supplied). A streaming reader discovers this only when a full linear pass completes; by then a player consumed 1.9 GB. Honest semantics, not prevention:

- Chunk-verified ranges mean exactly **"bytes the author committed in this generation's tree"** — already enough to make third parties (mirrors, relayers, MITM) powerless.
- The logical-digest check is a **separate, stronger predicate** run on full linear reads, background full-verify jobs, or launch-critical preflight. On failure: grade the generation `CONTENT-MALFORMED`, quarantine it client-side, surface it in diagnostics — and note the failure is *attributable and permanent* (the manifest is signed; the inconsistency is reproducible by anyone — portable evidence of author malfeasance, which is more than most systems can say).
- Prevention would require either full-verify-before-first-byte (kills streaming; kept only for launch-critical classes per §4.3) or defining the logical digest *as* the tree root (kills SRI/external interop — the world speaks flat SHA-256). The trade is taken with eyes open; gates that cannot tolerate the window MUST use the full-verify predicate (a lens/gate policy knob, not a kernel change).

### 5.4 Upload abandoned at 90%

Default outcome, by design: a **permanent, honest `BYTES-PARTIAL(k/n)`** — commitment durable, available ranges served, missing ranges erroring per §4.1 (falsification: no grade may round 90% up to complete, and no UI may render PARTIAL as broken-file-delete-it; both directions of dishonesty occur in the wild). Recovery: the bitmap is the stateless global session — anyone, years later, funds `missingChunks` and finishes under the original signature ([[large-file-uploads#The mechanism]] #5). Funding remains exogenous/unsolved (named by all three red teams; §3.4). **Garbage story, stated plainly:** there is none, and none is needed for correctness — pool bytes are paid-at-write, permanent, unattributed; orphaned partial stores persist as state forever (accepted consequence of the permissionless-pool ruling). The costs that DO need managing are reader-side: clients cache per-chunk negative-availability with TTLs so partial files don't trigger refetch storms, and `expiresAt`'s semantics must be pinned in the recut as **staging-intent advisory only** (UI/relayer hint; no protocol effect; a permissionless pool cannot expire) — currently underspecified in the manifest field list.

### 5.5 A hostile file sized to blow enumeration or cache budgets

The pool is permissionless and manifests are attacker-authored input. Shapes and defenses:

- **Absurd geometry** (`chunkCount` = 2³²−1, tiny `chunkSize` → a 137 GB leaf vector; or `size` = 90 TB with zero bytes ever submitted): the *reader* is the defense perimeter — bound `chunkCount`/`size`/`chunkSize` sanity **before any allocation or fetch** (§1.4 bounding rule); out-of-profile manifests grade `MANIFEST-UNREASONABLE` and render as inert metadata, not as a 90 TB file Explorer will try to copy. Profile constants (min chunkSize, max count) stay **Durable reader policy, not Etched kernel limits** — the kernel stores the row opaquely by design (C-discipline), and freezing today's "reasonable" into the ceremony is how 2050's real 10 TB files get orphaned. (Delegated gate; see ledger.)
- **Leaf-vector amplification:** the vector can't be incrementally verified against a bare root (recomputing the root needs all leaves) — so the count-bound check MUST precede the fetch, and daemons stream-hash with hard allocation caps.
- **Generation churn** (10⁶ supersessions of one file): current-generation resolution must stay O(1) via the slot index regardless of history depth — the R-QC8 history-amplification budget applied to the manifest slot ([use-cases.md](use-cases.md#53-query-completeness-qc)); benchmark fixture owed.
- **Hostile manifests as daemon input** (the required pairing: malicious public data into a kernel-facing daemon): every field — geometry, `encodingTag`, mirror URIs, extension frames — is untrusted; the mount daemon parses with hard caps, treats unknown critical extension bits fail-closed, and never lets a manifest field size a buffer, a fetch loop, or a recursion. Same posture the envelope parser already owes; stated here so the byte path is explicitly in scope.
- **Hot-folder byte spam** (thousands of junk large files in a public folder): admission is paid and permissionless (ruled); the lens filters; metadata-only browsing never hydrates bytes (§4.1) — so spam costs the spammer gas and costs readers only listing-budget, which R-QC8 already governs.

### 5.6 Tension touchpoints owned by other lanes (stated, not settled)

- **T1:** chains-don't-die keeps *state-tier* bytes readable forever on any surviving venue; **DA-tier lifetime is orthogonal to chain health** (pruning is not chain death — already the ruling's KEEP rationale, [[owner-rulings#2026-07-10]]). Venue-*service* decline (fees/censorship) affects future writes/completions, not committed bytes. Nothing byte-shaped forces a position on T1's authority-home scope.
- **T2:** nothing in the byte model needs a cross-chain locator — replication is re-submission (§3.2); this lane adds zero consumers to the L1 pointer, consistent with the register's §5.8 finding.
- **T4:** §2.6's two-axis algebra is this lane's contribution to keeping the two-grade hypothesis, the maximal topology, and N1's axes separable — availability grades are computed identically under every candidate topology.

---

## Reconciliation ledger

1. **Item 16 DA-tier ruling ([[owner-rulings#2026-07-15]])** — **still-valid**; T3 reconciled at mechanism level (§2.2): state-tier bytes pass item 16's own bounded-gas test; calldata stays off-chain/@EPHEMERAL. No wording of item 16 needed changing — only the loose prose around it (§2.5).
2. **Items 17/18 full-body spine + no-elision** — **still-valid**; scope re-affirmed per item 18's own text: record bodies (including manifest rows) are spine-permanent; large file bytes are tier-graded. The manifest row being spine-resident is what makes every generation reconstructable forever.
3. **The four 2026-07-07 James rulings in [[large-file-uploads#James rulings (2026-07-07)]]** (`contractReadable` floor; fully permissionless pool; frozen EFSBytes dev→immutable; L2/L3-first bytes; blob reserved) — **still-valid**; the floor is extended with venue-neutral wording pending [use-cases.md](use-cases.md#decisions-for-james) J2; the permissionless pool's consequences are re-affirmed and extended by §3.3's authorization-free-chunks invariant and §5.4's no-GC story.
4. **ADR-0049 (identity never content-derived; off-chain hashes are claims)** — **still-valid**; the generation model preserves it structurally (§1.2: dataId owner-derived, generation claim-derived, chunksRoot = shared byte-store address only).
5. **Red-team mandatory fixes 1–4 ([[large-file-uploads#Mandatory fixes (applied — from the red teams)]])** — **still-valid**; fix 2 (anchor on ERC-7201 layout, not CREATE2 addresses) is load-bearing for §3.2's portability rule; fix 3 (no content-erasure) is load-bearing for §3.3 and §5.4; fix 4 (honest headline) is extended by §2.5's kill-list.
6. **P11 per-chunk SHA-256 ([[client-os-pressure-report]] P11)** — **changed: adopted into the design** as dual-digest leaves (§1.4) rather than left as an open retrofit warning; exact leaf encoding is delegated to vectors + the gas snapshot.
7. **The `FileManifest` field set ([[large-file-uploads#The mechanism]] #1)** — **changed: recut required before vectors** — §1.2's tuple adds `sha256Content`, pins `encodingTag` semantics (§1.7), adds the length-exactness geometry contract (§1.4), pins `expiresAt` as advisory-only (§5.4), drops `preferredTier` (#13 below), and reserves a fail-closed extension frame.
8. **The [[codex-kinds]] MIRROR dual-role row** — **newly-exposed gap**: mirror claims need generation binding (SHOULD name the `chunksRoot`/digest served) so best-mirror ranking stays honest across updates (§1.5). Zero new index state; a row-shape amendment for the recut.
9. **[[mountable-filesystem-semantics]] coherent-generation crack + byte-facing open questions** — **answered by this lane** (§1.2 tuple, §4.2 carrier table, §4.1 error mapping, §4.4); the mount doc's ranked-cracks "critical" row for coherent generations should point here after synthesis.
10. **`BYTES-*` grade set ([[large-file-uploads#The mechanism]] #6)** — **still-valid, extended**: adds `CONTENT-MALFORMED` (§5.3, author-attributable inconsistency) and `MANIFEST-UNREASONABLE` (§5.5, reader-policy bound), plus the normative two-axis algebra (§2.6) and the tier-labeled completeness rule (§5.1d).
11. **Chains-don't-die ([[owner-rulings#2026-07-10]])** — **still-valid**; sharpened for bytes: DA-tier lifetime is pruning-bounded independent of chain health — which the ruling's own KEEP list (EIP-4444 rationale) already anticipated. No chain-death machinery reintroduced.
12. **[use-cases.md](use-cases.md) rows R-BA1/BA3/BA5/BA8 and journey (e)** — **still-valid**; this file is their mechanism-level elaboration; R-BA8's "refuse unverified prefixes" becomes §4.2's table + the no-manifest full-fetch rule.
13. **`preferredTier` (advisory manifest field)** — **superseded-recommended**: drop in the recut; the ruled `contractReadable` capability floor + submitter tier choice + tier-labeled grades cover every honest need, and an unenforced author tier wish is masquerade fodder (§2.5.5). (Recommendation of this lane, not yet an owner ruling.)
14. **EFSBytes "zero novel crypto / zero kernel coupling" discipline** — **still-valid**; the one interface delta this lane requires (store learns `{chunkCount, chunkSize, size}` at creation for the exactness rule, §1.4) preserves both properties: it is arithmetic, not crypto, and store-local, not kernel state.
15. **Sequencing hold ([[owner-decision-inbox]])** — **complied with**: no held N/Q item is re-asked; the three items below are new, use-case-shaped, byte-lane-specific axes.

**Delegated technical gates surfaced (not owner votes, per the [[owner-decision-inbox]] delegation rule):** exact `FileGenerationV1` encoding + golden vectors + Solidity↔TS differential fuzz of the dual-digest tree; the EFSBytes creation-parameter delta; leaf-vector artifact convention; reader-policy geometry bounds (min chunkSize / max count as Durable profile constants); the inline-value/manifest boundary for small files (§1.6); chunk-size normalization/prefetch privacy guidance (P11's second half); the R-QC8 generation-churn benchmark fixture.

---

## Decisions for James

Only the genuinely-owner items this lane surfaces. None re-asks a held N/Q item.

### LF-J1 — What does the default "publish this file" ceremony buy?

**Example:** Sam right-clicks `/photos/2026/` → "make permanent" (journey (d) in [use-cases.md](use-cases.md#3-anchor-journeys-mandatory-record-level)). The commitment, records, and indexes go on-chain either way. Do the *bytes* of an ordinary 4 GB folder default to (i) Arweave-class mirrors only, (ii) Arweave + DA-tier publication, or (iii) state-tier on the L2 drive?

- **A — Default = commitment + records + indexes on-chain; bytes to Arweave; state tier is an explicit per-file/per-folder upgrade** (the `contractReadable` floor or a "critical documents" toggle), DA publication an explicit option. **Recommended, contingent on E2/E1 numbers** — it matches the adopted storage direction (on-chain + Arweave; L2/L3-first — [[owner-rulings#2026-07-10]] Storage) and §2.4's ~10⁸-gas-per-MB state arithmetic, while keeping the state tier one click away for the files that earn it (§2.3).
- **B — Default = state-tier bytes on the L2/L3 drive for everything.** Maximally on-chain, matches the "bigger on-chain files become normal" bet directly, and the E2 snapshot may prove it affordable on the chosen venue — but it prices every family photo at state-growth rates and makes the default ceremony's cost unpredictable across venues.
- **C — Per-vertical defaults** (archive apps default state-tier for small critical roots, media apps mirror-first). Honest but complex; defer until two real verticals exist.

This is decide-after-evidence-shaped: the recommendation is A *as the working default for prototypes*, with the real signature waiting on the E2 aggregate snapshot + the de-risking slice ([[large-file-uploads#The de-risking experiment (a few days, one L2 testnet)]]). Reason trail: §2.3–2.4, [[owner-rulings#2026-07-10]] Storage, [[owner-rulings#2026-07-15]] item 16, [[onchain-completeness#4. The corrected keep/demote line + the one gas bundle]].

### LF-J2 — Is DA-tier (calldata) publication a user-facing product tier, or an internal rail?

**Example:** the publish dialog could offer "Publish bytes via chain (~1 year+ archival visibility, then pruning; not readable by contracts) — 5–10× cheaper than permanent state." Or that rail could exist only inside the SDK (staging, replication transport) and never as a user-named durability choice.

- **A — Internal rail only.** Users choose between "permanent on-chain (state)" and "mirrored (Arweave/IPFS)"; the DA rail is plumbing. **Recommended** — it keeps the product vocabulary two-valued and honest, avoids selling a pruning-bounded tier to users who will hear "on the chain" as "forever" (exactly the L8 preservation-words risk, [[owner-decision-inbox]] L8), and loses nothing: the tier still exists for transport and for sophisticated callers.
- **B — User-facing with exact honest labeling.** More choice, real cost savings for short-horizon publication — but every label test so far ("preserved," "permanent") shows durability wording is hard enough with two tiers; a third, *time-bounded* one multiplies the confusion surface, and §2.5's masquerade risk becomes a UI-copy problem forever.

Reason trail: §2.1–2.2, §2.5, [[owner-rulings#2026-07-15]] item 16, [[owner-decision-inbox]] L8/L14.

### LF-J3 — Ratify the tier-vocabulary honesty rule (cheap, wording-level, now)

**Example:** a dapp's docs say "game assets are stored on-chain" about DA-tier bytes. Under the rule, EFS's own docs, SDK strings, grades, and reference UI may say "on-chain" **only** for state-tier bytes; DA-tier renders as "published via chain, retention-bounded"; mirrors as "mirrored (carrier)." Third parties will say what they say — the rule governs every surface EFS controls.

- **A — Ratify the rule + the §2.5 kill-list as a normative wording obligation** on all EFS-controlled surfaces, folded into the same disclosure discipline as L8/L14. **Recommended** — it is the enforcement half of the T3 reconciliation; without it the tier ladder's honesty depends on every future doc author's memory.
- **B — Leave it as style guidance.** Free today, and historically how "half-presence" wording drifts back in ([[owner-rulings#2026-07-15]]'s mandatory-indexing rationale is the direct precedent for closing wording escape hatches).

Reason trail: §2.2, §2.5, [[owner-rulings#2026-07-15]] items 12/16, [[owner-decision-inbox]] L8.

---

## Confidence

**VERIFIED (read directly from the cited corpus documents this pass):** the [[large-file-uploads]] mechanism, manifest field list, grades, trilemma, mandatory fixes, tier definitions, storeId construction, replication-by-resubmission correction, and all five 2026-07-07 James rulings; item 16/17/18 text and James's bounded-gas definition from [[owner-rulings#2026-07-15]] and [[onchain-completeness]]; the mount contract, ranked cracks, falsification tests (esp. 16/17), and the byte-facing open questions from [[mountable-filesystem-semantics]]; PAF-2/PAF-3 requirements from [[playable-archive-requirements]]; P11's SHA-256 ask from [[client-os-pressure-report]]; the envelope `authorityId`/`authEpoch` seam and epoch-bump semantics from [[kel]]; the ByteStore port boundary from [[solana]]; the [[codex-kinds]] MIRROR dual-role row and `MAX_VALUE_BYTES`; the use-case register rows and T3 sketch from [use-cases.md](use-cases.md).

**PLAUSIBLE (this lane's design analysis; falsifiable by the critic, the recut, or vectors):** the FileGenerationV1 tuple membership and the manifest-is-the-generation resolution rule (§1.2–1.3) — the central claim, attackable by finding a byte-coherence fact that legitimately cannot live in one slot; the dual-digest leaf construction and its on-chain cost being acceptable (§1.4); the length-exactness rule closing the geometry attack completely (§1.4/§5.1e); the leaf-vector artifact economics (§1.4); generation-scoped mirror claims being sufficient for honest best-mirror ranking (§1.5); the uniformity-downward recommendation for small files (§1.6); the encoding semantics (§1.7); the two-axis grade algebra as complete (§2.6); the authorization-free-chunks invariant having no hidden authority hole (§3.3 — the KEL lane should attack it); every gas figure in §2.4 (protocol-constant ratios are stable knowledge, but none were re-verified against current specs today, EIP-7623's exact floor constants specifically flagged; totals are arithmetic, not measurement); the claim that no byte-model element assumes an authority topology (§5.6/T4).

**Could not verify:** whether the EFSBytes skeleton (now including the creation-parameter delta) fits EIP-170 as one contract — the de-risking experiment remains unrun; any real per-venue cost (E1/E2 open — every cost statement here is order-of-magnitude gas arithmetic, and the file says so at each use); Arweave endowment pricing (deliberately not quoted); whether the current `submitChunk` proof path binds the index exactly as asserted — the construction implies it, but the frozen-vector check is the proof and vectors do not exist yet; the interaction of the manifest recut with the envelope re-cut's final field layout (both are open surfaces; §3.3's analysis holds under the current [[kel]] draft but must be re-walked when the envelope freezes); whether `MANIFEST-UNREASONABLE` reader bounds can stay Durable without an eventual profile-constant freeze fight (flagged as a delegated gate, not settled).
