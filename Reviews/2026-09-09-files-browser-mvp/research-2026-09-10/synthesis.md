<!-- Research strand: Synthesis of the four strands -->
<!-- Provenance: produced 2026-09-10 by a research agent under the integration-test-lead's
     workflow (harness claude-code, model Claude Fable 5). Figures carry the agent's own
     MEASURED / QUOTED / ESTIMATED labels; nothing here is a ruling. The engineering
     lead's reading, verification notes and corrections are in ../indexing-and-state-2026-09-10.md. -->

# EFS v2 — synthesis of four research strands (MUD, filesystems, EIPs, indexing)

Date: 2026-09-10. Labels preserved from the strands: **MEASURED** (forge gas reports, local runs, or the owner's numbers), **QUOTED** (spec/doc/paper text), **ESTIMATED** (arithmetic from QUOTED/MEASURED parts). Where I re-verified a claim today I say so and give the date. Owner baseline (MEASURED): tag write 2,838,264 gas / 94 slots; EAS attestation ~230k; MUD cold single-slot record ~32k; Farcaster signer key ~180k / ~4 slots; reads:writes ≈ 100:1.

---

## 1. Executive findings

1. **The tag write's problem is slot count, not per-slot cleverness.** 94 × 22,100 = 2,077,400 gas (ESTIMATED from MEASURED) ≈ 73% of the 2,838,264 MEASURED write is fresh-slot cost. MUD stores a comparable record in 1–4 slots: 32,095 gas cold single-slot (MEASURED, `packages/store/gas-report.json` @ 0e49b51b). An EFS tag modeled as Store records (64-byte record 2 slots + binding 1 + claim/posting ~2) ≈ 150–200k through a World-style entry (ESTIMATED), 14–19× cheaper, in EAS's band. Batching will not fix it; the per-record slot count will. [mud, filesystems]

2. **Glamsterdam repricing makes 94 slots unsurvivable.** EIP-8037/8038 are SFI in EIP-7773 (verified today on eips.ethereum.org; EIP-8037 status is *Review*, created 2025-10-01; activation table still empty). Fresh cold slot 2,100 + 10,000 + 97,920 = **110,020** (ESTIMATED sum of QUOTED parts, ~5×); rewrite of an existing cold slot 5,000 → **12,100**; new account 25,000 → 183,600; code deposit 200 → **1,530/byte** (QUOTED). Tag write → **~11.1M gas** (ESTIMATED, L1 schedule) ≈ 15% of a 60M block. Reads unchanged (cold SLOAD stays 2,100; cross-contract cold account 2,600 → 3,000). Mainnet tracked for Q4 2026 (press; not EF-announced); L2s ~6–8 months later (ESTIMATED from the 7-month Fusaka→Karst lag). [eips]

3. **The rewrite-vs-allocate gap widens from 4.4× to 9.1×.** 5,000 vs 22,100 today → 12,100 vs 110,020 (ESTIMATED). Every index that stores one 32-byte id per entry pays the allocate price; only bitmaps/packed posting lists over small-integer ordinals in pre-existing slots pay the rewrite price. This is the single fact that should decide EFS's index shape. [eips, indexing]

4. **No EXTSLOAD, ever.** EIP-2330 Stagnant since 2019, no successor in EIP-7773 or EIP-8081. Contract-readability must be built in: Uniswap v4 `extsload(bytes32)/extsload(start,n)/extsload(bytes32[])` raw slot getters (STATICCALL ≈ 5–6k for the first slot, ≈ 2,150 per additional slot, ESTIMATED) for mutable bindings/indexes; **EXTCODECOPY of SSTORE2 bodies ≈ 2.7k per KB vs 67,200 for 32 cold SLOADs** (ESTIMATED) for immutable record bodies — the cheapest cross-contract read on the EVM, no CALL needed, and safe long-term (EOF Stagnant; EIP-7954 raises code to 64 KiB). [eips]

5. **A bitmap-over-directory-ordinals index answers all four owner queries at 2,100 gas per 256 files per predicate, and NOT costs the same as positive.** Per-file index overhead ≈ **32k (positional bindings, no counts) to 76k (both ordinal maps + counts)** today (ESTIMATED), vs MUD's hook modules +110k/+128k (MEASURED) and EAS Indexer ≈ 135k (ESTIMATED). Membership test ("is f nsfw?") = 2 SLOADs ≈ 4,300 cold. Under Glamsterdam the bitmap layer becomes ≈ 52k–296k (ESTIMATED, mostly 12,100 dirty writes) while id-per-entry indexes go ≈ 700k+ (EAS Indexer, ESTIMATED). [indexing, eips]

6. **Negative filters require a write-path-maintained index plus a closure.** Opt-in indexes (EAS `Indexer.sol`: permissionless `indexAttestation`, never prunes, ignores revocation) prove existence but never absence. `alive & ~nsfw` over ordinals = 2 SLOADs = 4,200 per 256 files; with arrays/sets an anti-join costs ~4,200 **per file** (256× worse). Sequential counter `count[D]` is the only closure that survives multi-`eth_call` pagination with a pinned `blockTag`. [indexing]

7. **Lattice is dead; MUD is a fork, not a dependency.** Confirmed today: X post 2026-04 "After five years, Lattice is winding down"; Redstone shuts 2026-05-15; MUD/Quarry/Dozer open-sourced; DUST moved to its own chain under 0xPARC. `main` frozen at 2.2.23 (2025-09-30), last push 2026-04-10, external PRs closed unmerged (MEASURED via GitHub API); MIT; OZ audit 2024-02-11. ERC-7813 is **Last Call, deadline 2026-06-16, past deadline, not Final** (verified today). Dozer still pushed 2026-08-31. EVE Frontier — cited by the MUD strand as a production user — announced a move to Sui on 2025-10-08 and migrated testnet in March 2026 (verified today). MUD's live production base is effectively DUST. [mud, indexing]

8. **Reuse `@latticexyz/store`'s physical layer and ERC-7813's event protocol; reject the World.** Store gives one keccak per record, tight packing, on-chain schema registry (`Tables`), 1–2-SLOAD access checks (MEASURED `hasAccess` cold 9,086 / warm 1,582), and — by emitting `Store_SetRecord`-compatible logs — inherits `store-sync` (RPC-only `eth_getLogs` hydration, `maxBlockRange` 1000), `protocol-parser`, `stash`, `store-indexer`, Dozer, the explorer and SQL API unchanged. World is incompatible on every EFS axis: one truth per key, no attribution, no history, writer-chosen keys, root systems `DELEGATECALL` with unrestricted storage, ~40k routing per call (MEASURED 39,980). [mud]

9. **The byte store leaks dedup at the key.** Chunk salt = keccak(chunkTreeRecordId ‖ index) (§11) and v1 nonce-addressed SSTORE2 (ADR-0057) mean identical bytes in two files deploy twice (≈4.46M per 20 KiB chunk, ≈218 gas/byte, ESTIMATED). Fix: content-only salt + one `leaf[treeId][i]` pointer (22,100/chunk ≈ 0.5% of the deploy). Break-even at 0.5% duplicate chunks; Venti saw 27.8–31.3% duplicate blocks (QUOTED), whole-file dedup alone ≈ 75% of block-level savings (QUOTED, Meyer & Bolosky). Under 8037 the pointer becomes 110,020 but the duplicate deploy becomes ≈31.5M (ESTIMATED: 20,480 × 1,530 + 183,600 + 12,000), break-even ≈ 0.35%. Side effects: pointer array replaces the coverage bitmap, contracts read chunk i without a proof, on-chain manifest becomes contract-readable — constraint (1). [filesystems, eips]

10. **Logs are cheap but not authoritative.** Event with 2 topics + 64 B ≈ 1,637 gas (ESTIMATED), 13.5× cheaper than a slot; but EIP-4444/7642 partial history expiry is live, hosted RPCs cap `eth_getLogs` ("10K logs or a 2K block range", QUOTED Alchemy), and EIP-7668/8304 point at removing bloom-based log lookup. State must be the authoritative index; events serve hot-window sync. EIP-7928 BALs (SFI, Glamsterdam) will let the web client follow state diffs from blocks themselves — no logs, no indexer (applicability ESTIMATED). [eips, indexing, filesystems]

11. **Append-only shapes win; mutable/rebalancing shapes lose at 100:1 reads.** Delta compression in state, refcounts/GC, B-trees/in-place HAMT, sorted arrays are harmful (each read walks a chain or each write rewrites warm-then-cold slots). Parent-hash chains (Git commits; PHDAG **76,276 gas/append, depth-invariant, σ≈6**, MEASURED by the authors on Base Sepolia, arXiv 2606.09593) are the history primitive: +1 word per version, O(1) fresh slots. Live directories = `mapping(dirId, keccak(name)) → childId` (2,100 read / 22,100 insert); immutable closures for snapshots only — a 16-member closure with 24-byte names ≈ 34 words ≈ 750k gas (ESTIMATED), path-copied at depth 5 for 1M names. [filesystems]

12. **Open-ended attester sets resolved at read time are the first EFS feature to fall off the on-chain cliff.** Bitmaps keyed by `(D, tag)` or `(D, tag, attester)` are cheap; a Lens admitting k attesters costs k SLOADs per word; a Lens over an unbounded attester set has no on-chain answer at these prices. Materialize per-lens bitmaps at write time for lenses registered on the directory; everything else is an indexer or a ZK coprocessor (Brevis live; Axiom shut its coprocessor 2025-05-30). [indexing]

---

## 2. MUD

**Status (verified 2026-09-10).** Company wound down (X post, April 2026: "MUD is feature complete, OpenZeppelin-audited, fully open source"); Redstone off 2026-05-15; repo `main` @ 0e49b51b (2025-09-30), v2.2.23; canary `2.2.24-<sha>` 2026-04-09/10; 510 open issues; last four external PRs (May–June 2026) closed unmerged (MEASURED via API). ERC-7813 Last Call, deadline 2026-06-16, not Final. Dozer alive (pushed 2026-08-31). Who maintains MUD going forward: **could not find** (0xPARC continues DUST; CCP left for Sui). Adopting MUD = forking ~15 audited Solidity files + a TS toolchain.

**Measured gas (forge `startGasReport` spans; no 21k intrinsic, no calldata) — all MEASURED @ 0e49b51b:**

| Operation | Gas |
|---|---|
| `setRecord` 4 static fields = 6 bytes, cold, internal | 32,095 |
| 2-slot static record | 54,603 |
| first dynamic field 1 slot / second | 55,968 / 36,193 |
| `Mixed` {uint32,uint128,uint32[2],string} set internal / external | 102,753 / 107,581 |
| same struct, native Solidity | 91,999 (MUD ≈ +12%) |
| get `Mixed` warm internal / external | 14,378 / 16,687 |
| non-existing record / field | 7,047 / 3,322 |
| delete (3 slots) | 7,326 |
| register table via StoreCore / World | 650,835 / 572,591 |
| set with one hook subscriber / hook call | 106,642 / 37,625 |
| offchain-table `setRecord` (event only, external) | 32,481 |
| World `setRecord` incl. access check + event | 64,661 |
| World `call` non-root system, no writes / via `WorldProxy` | 39,980 / 44,897 |
| register namespace / system / selector | 143,841 / 185,170 / 116,398 |
| `UniqueEntity` nonce | 82,173 |
| deploy World via factory | 12,742,614 |
| KeysInTable: install / set with it / delete | 1,462,000 / 193,018 (+~128k ESTIMATED) / 149,159 |
| KeysWithValue: install / set / change / `getKeysWithValue` warm | 717,993 / 174,377 (+~110k ESTIMATED) / 167,214 / 9,614 |

**Storage layout (QUOTED from `StoreCore.sol`):** `h = keccak(tableId ‖ keyTuple)` once; static data at `keccak("mud.store") ^ h`, tightly packed across consecutive slots; one lengths word (uint56 total + 5 × uint40) at `keccak("mud.store.dynamicDataLength") ^ h`; dynamic field i at `keccak("mud.store.dynamicData") ^ bytes1(i) ^ h`. Limits: 28 fields, ≤5 dynamic, statics ≤32 B, keys static-only. Delete zeroes static + lengths but leaves dynamic bytes (reads bounded by stored length). Schema/FieldLayout are each one `bytes32` and are readable on-chain via `getFieldLayout/getKeySchema/getValueSchema` — that is what "introspectable" buys.

**Reuse directly (MIT, no World):** `FieldLayout`, `Schema`, `EncodedLengths`, `Storage` (masked multi-slot store/load), `Slice`, `Bytes`, `tightcoder`; `ResourceId` (2-byte type ‖ 14-byte namespace ‖ 16-byte name); `AccessControl` (namespace-or-resource); `bytes21` hook encoding; the `IStoreEvents` protocol (`Store_SetRecord` carries the full encoded value → schema-agnostic replicas). Emitting ERC-7813-shaped logs + registering schemas in a `Tables` table inherits the entire client stack: `createStoreSync` (snapshot if an indexer exists, else `eth_getLogs` replay from `startBlock`, chunked at 1000 blocks), storage adapters (RECS/Zustand/Stash/SQLite/Postgres), Dozer point-in-time (`block_num/log_idx` + `expired_*`), explorer, SQL API. `docs/guides/replicating-onchain-state.mdx` does the replay in ~40 lines of TS. This is the no-indexer path for constraints (2)/(3).

**Copy as pattern:** one event per write with the full value + on-chain schema registry; codegen'd typed accessors (`tablegen`) in the SDK; "offchain table" as an explicit event-only tier (usable *only* for data no contract reads — and per §5 below, only for data the client can afford to lose past the RPC log window); modules as on-chain install scripts for optional per-write-paid indexes; write-once via `onBeforeSetRecord` revert for content-addressed keys.

**Incompatible (do not adopt World):** exactly one value per `(table, keyTuple)`, last writer with access wins — the opposite of Lens; no sender in events, no author column; no version counter, no previous value; keys chosen by writer (`UniqueEntity` nonces), not content; single-owner namespaces; root systems `DELEGATECALL`; ~40k routing per call. A bridge (records table keyed by contentId with write-once hook; `bindings(position) → recordId`; `claims(author, position) → recordId`; Lens resolved by the reader) is EFS logic on Store, not use of World.

**On-chain query capability (QUOTED docs/world/tables.mdx):** "by default MUD does not keep a list of keys written to a table onchain." KeysInTable indexes only the first five key fields, only post-install records; KeysWithValue keys by `keccak(staticData ‖ encodedLengths ‖ dynamicData)` — the *whole* value, not a field — with "naive and inefficient" linear removal. Verified today: the Sky Strife retrospective (lattice.xyz, ~2023) reports transactions jumping from ~1M to up to 45M gas when KeysInTable tracked the `Player` table under an old MUD version that emitted the full array in `StoreSetRecord`; the fix was hand-maintained `MatchPlayers: bytes32[]` tables. The modules are still listed on mud.dev with no deprecation notice. Both strands' conclusion holds: generic auto-indexes do not survive production; purpose-specific hand-maintained indexes do.

**Verdict.** MUD is better engineered than EFS today at: physical storage (1–4 slots vs 94), event/replay protocol and the whole sync/indexer stack, codegen, access check, schema registry, audit and incident process. EFS exceeds MUD's model at: pluralistic resolution, retained history, content addressing, attribution, contract-readable enumerable indexes — MUD has no primitive for any of these, and its games solved them by convention plus off-chain replicas. Fork `store` + adopt ERC-7813 event compatibility; design only the EFS envelope (records/bindings/claims/postings) on top; price in that upstream is frozen and the ERC may never reach Final.

---

## 3. Filesystem theory translated on-chain

**The split.** Linux: inode (object identity + block map, no name) / dentry (name → inode, volatile dcache) / data blocks; hard link = second dentry + `i_links_count` (ext4 cap 65,000; inode record 256 B, QUOTED). The refcount exists only so blocks can be freed at zero. Append-only removes both the refcount and the free path; "how many names point here" becomes an optional index, not a lifetime mechanism. EFS already has the split: ChunkTree = inode, closure member or binding = dentry, chunk contract = data block.

**Dedup on-chain is nearly free — if the key is content-only.** Every mutable dedup FS pays a second index (ZFS DDT 216–424 B/live entry, consulted on "every single write and free", QUOTED despairlabs 2024-10-27; btrfs backrefs; bcachefs "two btree lookups instead of one"; APFS declines to dedup at all). On the EVM the state trie *is* the hash-keyed map: a dedup lookup is one cold SLOAD/EXTCODESIZE at 2,100–2,600 (→ 2,100/3,100 under 8038), ~a tenth of one storage word.

**Gas primitives (QUOTED constants; ESTIMATED unit costs), today's schedule:** hash 20,480 B = 3,870; hash 256 KiB = 49,182; new word 22,100; ChunkTree/1 body (48 B = 2 words) = 44,200; deploy 20,480 B as code ≈ 4.46M ≈ 218 gas/byte (deposit 4,096,200 + CREATE 32,000 + initcode ~1,300 + calldata ~327,700); 8 KiB ≈ 1.80M ≈ 220 gas/byte; read 20 KiB via EXTCODECOPY ≈ 5.3k (~800× cheaper than writing); per-chunk overhead ≈ 4.3 gas/byte at 8 KiB vs 1.7 at 20 KiB (tx 21k + proof ≤768 B calldata ≈ 12.3k + pointer 22.1k). Under 8037 (ESTIMATED): 20 KiB deploy ≈ 31.5M *state* gas (fits a 60M block via the state-gas reservoir, not bounded by the 2^24 exec cap); per-pointer fixed cost 195,600 (12,000 + 183,600) favors fewer, larger chunks; practical ceiling ≈ 39 KB/tx at a 60M block; a full 64 KiB chunk needs ≥~100M blocks.

**Minimal on-chain inode/dentry/data split (ESTIMATED, today / Glamsterdam):**

```
data   : chunk contract, CREATE2(store, salt = keccak(0x00‖chunk) or constant,
         initcode embedding 0x00‖chunk)           200 → 1,530 gas/B; one copy per unique chunk
inode  : ChunkTree/1 {chunkSize, chunkCount, totalSize, merkleRoot}   ~44k → ~220k
         + block map  leaf[treeId][i] = leafHash   22.1k → 110k per chunk  (= ext4 i_block)
dentry : immutable  ArtifactClosure member {name, kind, size, ref}
         mutable    binding(position -> recordId)  22.1k → 110k; hard link = 2nd dentry, no refcount
history: binding.prev = prior binding id           +1 word, O(1)   (Git / PHDAG shape)
lookup : mapping(dirId, keccak(name)) -> childId   2,100 read; enumerate via append-only
         array (22.1k/entry) or events (1.6k/entry, eth_getLogs, hot window only)
```

Worked (today): 20 KiB single-chunk file ≈ 4.55M, bytes 98%; second name +22k (0.5%); second file with an identical chunk 88k instead of 4.55M (≈50×) — only with a content-only address.

**What ChunkTree/1 already gets right (each with precedent):** count-at-apex (`chunkCount/chunkSize/totalSize` in the id; Arweave `data_root+data_size`, Bao length prefix and "don't expose length before the final chunk validates" = EFS `expectLen`); 0x00/0x01 leaf/node tags, ordered pairing, odd-node promotion (RFC 6962/MMR); manifest-as-content not Record (Venti pointer blocks, Perkeep `bytesRef`; 50 GB → 6.55 MB manifest → 25 chunks); fixed `chunkSize` keeping `readRange(offset)` O(1) (index = offset / chunkSize) — no CDC scheme can offer this; anyone-may-submit proof-verified idempotent chunk admission with address-commits-to-bytes (EthFS cross-chain CREATE2); no name/media-type in the inode; `size` duplicated in members with read-side check (IPFS `Tsize`).

**What it lacks, costed:**
1. Cross-file chunk sharing — the headline gap (finding 9). One-line salt change + `leaf[treeId][i]` pointer.
2. One identity across submission sizes. Same bytes at 20,480 and 262,144 yield two RecordIds bridged by RepresentationBinding. bao-tree "chunk groups": fix the leaf at `CHUNK_SIZE_ALIGN` 4,096 and treat aligned power-of-two groups as submittable units whose root equals the full tree's interior node (pairing never crosses an aligned boundary under promote-when-odd). Cost: proof depth +3 (20 KiB) to +6 (256 KiB), ~+100–200 B calldata/proof, hashing unchanged. A ChunkTree/2 decision (changes the root formula).
3. Prefix/subtree sharing between similar files. Fixed positional chunks share only before an edit point; FastCDC (2/8/64 KB, Gear hash, normalized masks; "10–20% more redundancy than FSC", QUOTED) recovers it but needs the chunker in the type (CID-style identity fragility), byte-length-annotated interior nodes (`node = keccak(0x01 ‖ leftLen ‖ L ‖ R)`) making offset→chunk O(log n), and ~2.5× more chunks at state tier. Defer to a `ChunkTree/2` with a `chunker` field only when a fixture of large, edited, state-tier files appears; for files under one chunk CDC gains nothing.
4. Closure fan-out. `MAX_CLOSURE_MEMBERS = 16` → 1M names at depth 5; one-leaf change rewrites 5 closure records; 16 members × 24-byte names ≈ 1,074 B ≈ 34 words ≈ 750k gas (ESTIMATED), maximal names ≈ 3.3M. Prior art: IPFS 256 KiB–1 MiB directory node then HAMT (fanout 256, murmur3). EFS answer: closures for releases/snapshots only; mutable state mapping + parent-hash history for live directories; revisit SR-18e's 16-reference bound for closure-typed records.
5. Delta/resemblance correctly absent; keep it absent in state (Git keeps the newest object whole for the same reason).

**Harmful on-chain:** delta compression in state; refcounts/GC/delete semantics (5k–22k per reference, nothing to reclaim); rebalancing structures; a second dedup index. Small chunks are not per-byte harmful today (220 vs 218) but every chunk adds ≥55k fixed overhead today and ≥195,600 under 8037.

---

## 4. Indexing

**What production does (QUOTED unless noted):** Dark Forest — dense id arrays with `bulkGetPlanetIds(start,end)`, *no per-owner planet list*, client filters; MUD — point lookup only unless KeysInTable/KeysWithValue installed (+128k/+110k per write, MEASURED); Farcaster — two OZ `EnumerableSet`s per fid, `maxKeysPerFid` 1000, remove = move between sets (`testFuzzRemove` μ 351,150 vs add 307,872, harness-inclusive), docs: `keysOf` "Don't call this onchain!"; ENS — "no practical way" to list a user's names on-chain; EAS — core has no index, `Indexer.sol` is opt-in, never prunes, ignores revocation; Verax — sequential ids (`chainPrefix + counter`), no subject/schema enumeration; Uniswap v3 — `tickBitmap`, at most one 256-bit word per call; Aave v3 — 128 reserves × 2 bits in one user word, `MAX_RESERVES_COUNT` 128; Compound — `accountAssets[]` capped by `maxAssets`; ERC721Enumerable mint 154,814 vs ERC721A 76,690 (≈78k for enumeration). DeFi makes queries cheap by *closing the universe*; games and attestation systems delegate set queries off-chain and say so.

**Structure costs (ESTIMATED unless QUOTED), today's schedule:**

| Structure | Insert | Remove | Membership | Enumerate N |
|---|---|---|---|---|
| dense array + count | 27,100 | tombstone 5,000 | none | 2,100·N |
| OZ EnumerableSet | ≈49,200 | swap-and-pop ≈19,600 net | 2,100 | 2,100·(N+1); `values()` "may render the function uncallable" (QUOTED) |
| Safe-style sentinel list | ≈34,200 | ≈10,000 net (needs prev) | 2,100 | 2,100·(N+1), no random access |
| Liquity `SortedTroves` hinted list | O(1) with valid hints, O(N) fallback, documented OOG on stale hints | same | 2,100 | ordered walk |
| packed posting list (8×uint32/word) | ≈12,100 amortized | tombstone 5,000 | none | ≈263/entry |
| bitmap over ordinals | ≈5,070 amortized (22,100 new word) | 5,000 | 2,100 | 2,100 per 256 + 60–100/set bit |
| two-level bitmap | +5,000 on word open | +5,000 on word close | 2,100 | 2,100 per 65,536 (summary) + 2,100 per non-empty word |
| BokkyPooBah RB-tree (QUOTED, pre-Berlin) | 68,459 → 127,210 avg @ 9,999 keys | 44,835 → 81,486 | O(log N) | in-order |
| 256-bit bloom (one slot) | 5,000 + k keccaks | n/a | 2,100 + k·50; FP ≈0.13% @ n=10,k=3 | cannot enumerate |
| skip list / treap | **not found in any production EVM system** | | | |

Floor: any id-per-entry structure ≥22,100 write / 2,100 read per entry; only bitmaps and packed postings over small-integer ordinals break it. So the first decision is whether an ordinal space exists — inside a directory it does.

**Costed minimal index set (per directory D, n files, `tagId = keccak(tagString)`, monotonic never-reused ordinals; if the binding table is already positional the ordinal is free):**

Storage: `count[D]` (closure); `ord[D][fileId]→uint32` and `entry[D][ord]→binding` (skip if positional); `alive[D][word]` + `aliveSum[D][sword]`; `bits[D][tagId][word]` + `bitsSum[D][tagId][sword]`; optional `tagCount[D][tagId]` (sparsest-first planning).

Per-write, adding one file tagged {image, image/png} (ESTIMATED; today → Glamsterdam):

| Item | Today | Glamsterdam |
|---|---|---|
| `count[D]` bump | 5,000 (22,100 first) | 12,100 |
| ordinal maps | 0 positional; 22,100 one-way; 44,200 both | 0 / 110,020 / 220,040 |
| `alive` bit | ≈5,070 | ≈12,500 |
| tag bits ×2 | ≈10,140 | ≈25,000 |
| summary transitions | 5,000 each, once per 256 files per tag | 12,100 |
| `tagCount` ×2 (optional) | 10,000 | 24,200 |
| keccaks + hook | ≈2,000 | ≈2,000 |
| **Total** | **≈32k – 76k** | **≈52k – 296k** |

Later "nsfw" on an existing file: 5,070 (+5,000 count). Remove a tag: 5,000. Rebind a position to a new record: 5,070 per differing bit. Index must be keyed on the **binding position**, never the record id; superseded records stay resolvable by id but are never indexed. Note: this does not shrink the tag *record* — the 94 slots are a separate problem (findings 1, 8).

Per-query (ESTIMATED; W = ceil(n/256), h hits; reads unchanged under Glamsterdam):

| Query | Words | Ordinals | Materialize ids |
|---|---|---|---|
| Q1 tagged image | W | 2,100·W + ~80·h | 2,100·h |
| Q2 image/png (materialize both major and full type at write; +5,070/bit) | W | same | same |
| Q3 nsfw (sparse) | summary + non-empty | 2,100·(⌈W/256⌉ + nonempty) + 80·h | 2,100·h |
| Q4 NOT nsfw | 2W (alive, nsfw) | 4,200·W + 80·h | 2,100·h |
| image AND nsfw | 2W or sparse-first | 4,200·W, or 2,100·(summary + 2·nonempty) | 2,100·h |

n=1,000 (W=4): Q1 ≈ 8.4k+80h, Q4 ≈ 16.8k+80h; h=300 → ordinals 33–41k, materializing ids +630k. n=10,000: Q1 ≈ 84k, Q4 ≈ 168k. n=100,000 (W=391): Q1 ≈ 821k, Q4 ≈ 1.64M — fine for `eth_call`, marginal in-tx; expose `(fromWord,toWord)` so a game contract pages like Uniswap. 1M-file directory with 10 nsfw files via two-level summary: ≈55k vs 8.2M flat. Web client: pure `eth_call`, pinned `blockTag`, compare `count[D]`/`version[D]` before and after — no indexer, no Graph, no log-range caps. Per-file 256-bit tag bloom (add 5,000; check 2,100 + 3 keccaks; FP ≈0.13% @ 10 tags) gives certain negatives for one known file without touching the directory index — prefilter only.

**Completeness / negative filters.** Closure patterns that work: sequential counter (Verax, Farcaster `idCounter`, ERC-721 `totalSupply`, Dark Forest `getNPlanets`); sentinel list (no pagination); fixed universe in a word (Aave/Compound); version stamp (5,000/write) for multi-call consistency. Opt-in secondary indexes are never complete. Any NOT query needs an authoritative `alive` set *and* an index maintained on every write path that creates/changes a binding — hooks or the binding writer itself, not volunteers. Attester dimension: key by `(D, tag, attester)` (write unchanged per attester; read k SLOADs/word for a k-attester lens) or materialize per-lens bitmaps at write time for lenses registered on D.

**The line beyond which an indexer (or coprocessor) is required:**
- Global/cross-directory predicates over large corpora: dense tag over 1M files ≈ 8.2M gas per scan; only sparse tags via two-level summaries stay in budget.
- Any predicate not materialized as a bit at write time: prefix/regex over tag strings, numeric ranges (RB-tree 68–127k/insert), "any of these N attesters" over open sets, lens resolution over unbounded attester sets.
- Sorting/ranking beyond insertion order.
- History ("nsfw at block B") — only current bindings are indexed; history via `eth_getLogs` (Alchemy: 10K logs or 2K-block range, QUOTED), MPT proof against EIP-2935 (8,191-block window), or Dozer point-in-time if ERC-7813-compatible.
- Returning thousands of full record bodies in one tx (2,100/slot/hit).
- Off-chain but trustless: Brevis ZK coprocessor live (accessed 2026-09-10); Axiom coprocessor discontinued (Trail of Bits, 2025-05-30). Off-chain untrusted: MUD `store-sync` replay, Dozer, BALs (Glamsterdam).

---

## 5. EIPs and EVM practice — ranked

Fork status: Pectra L1 2025-05-07; Fusaka 2025-12-03; Glamsterdam EIP-7773 (SFI list verified today includes 8037, 8038, 7976, 7928; activation table empty; press tracks Q4 2026); Hegotá EIP-8081 ~2027-05. OP Stack Karst (mainnet 2026-07-08; Base not in that list) activates 7825/7939/7951; Arbitrum ArbOS 51 (2026-01-08) sets the tx cap at 32M and instruments storage-growth as a separate resource with constraints off.

1. **EIP-8037 + 8038 (Review; SFI Glamsterdam).** CPSB 1,530/state-byte; new slot 64 B → 97,920; new account 120 B → 183,600; code 200 → 1,530/byte; COLD_ACCOUNT 2,600 → 3,000; STORAGE_WRITE → 10,000; cold slot rewrite 5,000 → 12,100; warm rewrite 2,900 → 10,100; CREATE_ACCESS 32,000 → 12,000; EXTCODECOPY cold 3,100 / warm 200; refund cap 20%; state gas rides in a separate reservoir above the 2^24 exec cap (all QUOTED). Fresh slot total **110,020** (ESTIMATED). Tag write ≈ 11.1M; EAS ≈ 0.9–1.0M; MUD single slot ≈ 112k; Farcaster ≈ 0.5M (ESTIMATED). EF replay (2026-08-24): "large majority unaffected"; at-risk = 2,300 stipends, hardcoded CALL gas, `gasleft()` branches. Open objection (Jan 2026): deploy feasibility (Uniswap V3 ≈ 19M).
2. **EIP-7825 (Final; live L1/OP; Arbitrum 32M).** 16,777,216 exec gas per tx. Batching must chunk; under 8037 one tag write's exec+state ≈ 2/3 of the cap (ESTIMATED; state gas technically separate).
3. **EIP-8032 (Draft, declined for Glamsterdam, Base-backed 2025-11-18) + 8075 (Draft).** Size-based surcharge ∝ ceil_log16(contract slot count) above ~8 GB; adaptive 4844-style state pricing (target 36,400 B/block, MIN 380/byte). Shard state across contracts (per-namespace stores, SSTORE2 bodies); no singleton mega-registry.
4. **No EXTSLOAD (2330 Stagnant).** Uniswap v4 `Extsload/Exttload` + `StateLibrary` raw slot reads (~5–6k first slot, ~2,150 thereafter, ESTIMATED); EXTCODECOPY ≈ 2.7k/KB; EIP-1153 TLOAD/TSTORE 100/100 same-tx; EIP-2935 8,191-block hashes for in-EVM MPT proofs; EIP-8304 (Draft, Hegotá PFI) in-EVM trustless log/tx index.
5. **Rewrite-vs-allocate 4.4× → 9.1×.** Uniswap `TickBitmap`, OZ `BitMaps`, Solady `LibBitmap`; EIP-7939 CLZ 5 gas (Final Fusaka, Solidity 0.8.31 Yul `clz`) makes word scans first-class. Never iterate user-growable arrays in state-changing paths (Slither `calls-loop`/`costly-loop`; OZ `values()` docstring).
6. **EIP-7928 BALs (SFI Glamsterdam) + 8159.** Every block carries touched accounts/slots with post-values → client state sync from blocks; disjoint write sets parallelize, so avoid global `nextId`/head slots (content-addressed ids + per-namespace/per-directory heads already do).
7. **EIP-7954 (Scheduled: code 24 → 64 KiB, initcode 128 KiB) + EOF Stagnant.** Code-as-data safe indefinitely; 8037 caps practical deposits ≈ 39 KB/tx at 60M.
8. **History expiry: EIP-4444 partial live (~May 2025), 7642 (Fusaka) mandatory; 7668 Stagnant; 8304 direction.** Logs = hot-window sync only.
9. **State expiry trajectory:** EIP-8188 (Draft, Hegotá PFI) `last_written_block` per slot — *reads do not refresh it*; EF options (2025-12-18): expiry / archive / partial statelessness; EIP-7864 binary tree Draft (hash TBD; EIP-4762 adjacent-slot 200 vs 2,100), unscheduled. 10-year records should be revivable by proof (content addressing fits).
10. **EIP-7702 (Final; 12,500/auth tuple; 35,190 state gas under 8037) → EIP-8141 Frames (Hegotá SFI, ~2027-05).** Per-user attester without a relayer; build on ERC-5792 `wallet_sendCalls`. Also: 7623 calldata floor 10/40 → 7976 **64/64** per byte (Scheduled); 7904 "no changes" to KECCAK (30 + 6/word stays — EFS's 576 keccaks ≈ 26k MEASURED in the tag will not get cheaper); 7951 P256 6,900; 8125 temporary storage (Draft, TBD cost); zkSync repeated-write key ≤8 B and intra-batch rewrites free on DA (favors bitmaps further); Stylus SLOAD/SSTORE "cost as they do in the EVM" (compute cheap, state not); MegaETH storage pricing **not found**.

---

## 6. Open questions and contradictions between strands

**Contradictions (resolved where I could verify today):**
- *Sky Strife / KeysInTable.* EIPs strand: "caused unbounded gas growth… Lattice replaced them with hand-maintained indexes." Indexing strand: no deprecation statement found. Verified: the retrospective attributes ~1M → up to 45M gas to an old MUD version emitting full arrays in `StoreSetRecord` while KeysInTable tracked `Player`; replaced by `MatchPlayers` tables; KeysWithValue not mentioned; modules still listed on mud.dev. Mechanism was event/array bloat under a generic index, not linear index growth per se — conclusion unchanged.
- *EVE Frontier.* MUD strand: confirmed production user. Indexing strand + verification: Sui migration announced 2025-10-08, testnet March 2026. MUD's production base is DUST only.
- *ERC-7813 status.* A search snippet says Draft; eips.ethereum.org (fetched today): Last Call, deadline 2026-06-16, not Final. MUD strand is right.
- *EIP-8037 status.* Press (CCN) says "finalized in May 2026"; eips.ethereum.org: **Review**, SFI in 7773, no activation dates. "Finalized" is press for SFI.
- *Chunk deploy economics.* Filesystems strand priced everything at 200 gas/byte and concluded "small chunks are not per-byte harmful"; EIPs strand's 8037 numbers change the fixed per-chunk cost to 195,600 and the per-byte to 1,530, so larger chunks become strictly better and `CHUNK_SIZE_STATE` 20,480 costs ≈ 31.5M state gas per chunk (ESTIMATED) — half a 60M block. Filesystems' dedup break-even (0.5% → ≈0.35%) survives; its chunk-size indifference does not.
- *Events.* Filesystems strand treats events (1,637 gas) as a cheap enumeration channel; EIPs strand says logs are not durable (4444/7642, 7668/8304). MUD's "offchain table" tier inherits the same caveat: fine for constraint (2) only within the RPC's log window or with a BAL/indexer path.
- *Two different "EFS tag" estimates.* MUD strand: tag as Store records ≈ 150–200k (record + binding + claim). Indexing strand: index overhead ≈ 32–76k. They are additive, not competing: ≈ 180–280k today (ESTIMATED), ≈ 0.6–0.95M under Glamsterdam (ESTIMATED, 5 fresh slots × 110,020 + bitmap layer).

**Open questions:**
1. **Where do the 94 slots go?** No strand had a slot-level profile of the tag write (only 46.8% SSTORE share, MEASURED). Choosing a Store encoding requires it; the 5-slot target is an assumption until measured.
2. **Is the binding table positional?** Decides 32k vs 76k index overhead today and 52k vs 296k under Glamsterdam.
3. **Lens registration after the fact.** Per-lens bitmaps are materialized at write time for registered lenses; a lens registered on a directory with n existing files needs a backfill of n bit flips — who pays, and is it bounded?
4. **Attester dimension key.** `(D, tag, attester)` vs per-lens bitmaps: the former is write-cheap and read-linear in k; the latter read-cheap and registration-bound. Neither handles open attester sets.
5. **Offchain-table tier vs constraint (2).** If the client's only source is logs, what is the durability contract on a chain with 4444-style expiry and capped RPCs? BALs (Glamsterdam) may answer it; nothing answers it on a pre-Glamsterdam L3.
6. **Closure cap.** Can SR-18e's 16-reference bound be raised for closure-typed records, or must live directories be mutable mappings with closures only at snapshot time?
7. **ChunkTree/2 trigger.** Chunk groups (one identity across submission sizes) and CDC both change the root formula; neither strand had a fixture showing edited, large, state-tier files exist in EFS's actual workload.
8. **Target L2 and its schedule.** OP (16.7M cap, Karst; Base excluded) vs Arbitrum (32M; multidimensional pricing staged) vs zkSync (state-diff DA) vs MegaETH (pricing unknown). Glamsterdam repricing lands on L2s at unknown dates; Base says account-creation costs "can be tweaked at the L2 level" — the 110,020 figure may never apply uniformly.
9. **State expiry.** EIP-8188 makes read-only data look cold; a read-heavy (100:1) index would be exactly the state that expires first. No mitigation exists yet.
10. **MUD maintenance.** Who owns a fork of `store` + `store-sync` (0xPARC? nobody?); whether ERC-7813 reaches Final; whether `stash`'s "experimental" indices/derived tables (2.2.23) are stable enough to lean on.
11. **KECCAK stays 30 + 6/word (7904).** The 576-keccak / 26k MEASURED overhead in today's tag write is a design cost, not a fork-relief candidate.

**Could not be found (across all strands):** MegaETH storage pricing; a first-party Lattice wind-down blog post; who maintains MUD; production on-chain skip lists/treaps; published gas for on-chain bloom filters; IPFS UnixFS or `nix-store --optimise` dedup ratios; Meyer & Bolosky fixed-vs-Rabin per-size table (403); EVM-era EVE Frontier view-call vs World-API split; Scroll's current precompile/gas table.

**Sources verified today (2026-09-10):** eips.ethereum.org EIP-7813 (Last Call, deadline 2026-06-16, created 2024-11-08), EIP-8037 (Review, created 2025-10-01; CPSB 1,530; 97,920 / 183,600), EIP-7773 (SFI list incl. 8037/8038/7976/7928; activation table empty); lattice.xyz/blog/patching-a-world-sky-strife-playtest-engineering-retrospective (~2023; 1M → 45M gas; `MatchPlayers` replacement); x.com/latticexyz/status/2044103611072835744 via search excerpt (April 2026 wind-down; "MUD is feature complete"); blog.sui.io EVE Frontier migration (March 2026), decrypt.co 2025-10-08. All other sources as listed in the four strands.