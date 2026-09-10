<!-- Research strand: On-chain queryable indexes: prior art, costs, costed EFS design -->
<!-- Provenance: produced 2026-09-10 by a research agent under the integration-test-lead's
     workflow (harness claude-code, model Claude Fable 5). Figures carry the agent's own
     MEASURED / QUOTED / ESTIMATED labels; nothing here is a ruling. The engineering
     lead's reading, verification notes and corrections are in ../indexing-and-state-2026-09-10.md. -->

# On-chain queryable indexes: prior art, costs, and a costed design for EFS v2

Gas schedule used throughout (QUOTED, EIP-2929 Berlin 2021 / EIP-3529 London 2021): cold SLOAD 2,100; warm SLOAD 100; SSTORE zero→nonzero 20,000 + 2,100 cold = 22,100; SSTORE nonzero→nonzero 2,900 + 2,100 cold = 5,000 (100 if slot already written in the tx); nonzero→zero refunds 4,800, refunds capped at gas_used/5. keccak of one 64-byte mapping key ≈ 42 (owner MEASURED). OP-Stack/Arbitrum execution gas uses the same schedule; the L1 data fee is per calldata byte and does not scale with storage slots. All my arithmetic below is ESTIMATED unless marked otherwise.

## 1. What real systems actually do

| System | What other contracts can query on-chain | How it is stored | Cost per index entry | Delegated off-chain |
|---|---|---|---|---|
| Dark Forest v0.6 (QUOTED: `LibStorage.sol`, `DFGetterFacet.sol`) | `getNPlanets()`, `bulkGetPlanetIds(startIdx,endIdx)`, `bulkGetPlanets(start,end)`, `bulkGetPlanetsByIds(ids[])`, `getNPlayers`, `bulkGetPlayerIds`, `getArtifactsOnPlanet(loc)`, `getPlanetArrivals(loc)` | Dense arrays `uint256[] planetIds`, `revealedPlanetIds`, `address[] playerIds`, `mapping(uint256=>uint256[]) planetArtifacts`. **No per-owner planet list exists**; the client filters. The universe itself is derived (planet = hash of coords); only touched planets are in storage. | array push ≈ 22,100 + 5,000 length = ~27,100 (ESTIMATED) | Coordinates (mined client-side); the subgraph is optional, a "read-only spreadsheet" over the same public state. Client loads via paginated bulk getters. |
| OPCraft / MUD v1 (2022) (QUOTED: Lattice blogs) | Component contracts (Position, Item) keyed by entity id; per-entity reads only | ECS: "every block was an entity" with components | n/a (per-component set) | Everything relational; "took around 20 minutes to load the client state, and that was even with an indexer". Terrain was derived on-chain (procedural), not stored. |
| MUD v2 Store/World (QUOTED: `packages/world/gas-report.json`, `world-modules/gas-report.json`, accessed 2026-09-10) | Tables readable by any contract via key tuple; **enumeration only if you install a module**: KeysInTable (all keys), KeysWithValue (value-hash → keys[]) | Modules run as store hooks. KeysInTable: push key + `UsedKeysIndex(has,index)`, swap-and-pop delete. KeysWithValue: `keccak(value) → keys[]`, delete by "naive and inefficient" array filtering; only `keyTuple[0]` indexed | Baseline `setRecord` via World 64,661. With KeysInTable 193,018 (**+128k**), delete 149,159. With KeysWithValue 174,377 (**+110k**), change 167,214, delete 86,583, `getKeysWithValue` 9,614 (small list) | Everything else: MUD indexer replicates Store events to Postgres/SQLite; "for any sophisticated application the calls needed to get the full picture… are very complex". |
| Primodium (QUOTED, developer.primodium.com) | Same as MUD tables | MUD | same | Custom indexer: "querying the full state [from a node] could take upwards of an hour". |
| EVE Frontier (QUOTED) | In its EVM era: Smart Assemblies as MUD tables on Redstone; on-chain tables vs off-chain (event-only) tables | MUD | same as MUD | Listing/aggregation via MUD indexer & World API. **Caveat:** CCP announced a move to Sui on 2025-10-08; testnet migrated March 2026 — no longer EVM prior art going forward. |
| Loot (2021) (QUOTED lootproject.com) | `getWeapon(tokenId)` etc. — pure functions | Nothing indexed; `pluck()` derives gear from tokenId; Synthetic Loot derives from address | 0 (derivation) | Nothing needed; derivatives call the view functions. Pattern: derive, do not index. |
| Farcaster (QUOTED: `KeyRegistry.sol`, docs, `.gas-snapshot`) | `keys[fid][key]`, `totalKeys(fid,state)`, `keyAt(fid,state,i)`, `keysOf(fid,state)`; `IdRegistry.idCounter` = highest fid (sequential, so all fids enumerable) | Two OZ EnumerableSets per fid: `_activeKeysByFid`, `_removedKeysByFid`; `maxKeysPerFid` = 1000. Remove = remove from active set + add to removed set | Owner MEASURED ~180k / ~4 slots. Foundry `testFuzzAdd` μ 307,872, `testFuzzRemove` μ 351,150 (harness-inclusive, QUOTED) | Docs: `keysOf` — "Don't call this onchain! This function is very gas intensive." Messages/social graph live in hubs. |
| ENS (QUOTED docs.ens.domains/web/enumerate) | `registry[node] → owner,resolver,ttl` by node hash only | Mapping, overwritten in place | n/a | "if you wanted to list all of a user's owned names, there's no practical way to do this through ENS contracts" → subgraph/ENSNode. |
| EAS (QUOTED `EAS.sol`, `Indexer.sol`) | Core: `getAttestation(uid)` only; `_db[uid]`, UID = hash(schema,recipient,attester,time,…,bump). **No index in EAS.sol.** Optional `Indexer.sol`: permissionless `indexAttestation(uid)`; arrays by (recipient,schema), (attester,schema), (schema,attester,recipient), (schema); reads `get*UIDs(..., start, length, reverseOrder)` and `*Count` | Append-only arrays + `_indexedAttestations[uid]` flag. Does **not** check revocation/expiry and has **no unindex** | Core attest ≈ 230k (owner MEASURED). Indexer call ≈ 4 pushes + flag ≈ 4×27,100 + 22,100 + cold CALL ≈ 135k (ESTIMATED) | easscan GraphQL indexer for everything; Indexer.sol is opt-in, so it is never complete. |
| Verax (QUOTED `AttestationRegistry.sol`) | `getAttestation(id)`, `getAttestationIdCounter()`; ids are `chainPrefix + counter` (closed, enumerable universe) | Mapping; `revoke` sets `revoked`, `replace` sets `replacedBy` | n/a | No on-chain enumeration by subject/schema; `AttestationRegistered` events → indexers. |
| Uniswap v3 (QUOTED `TickBitmap.sol`) | `tickBitmap[int16 word] → uint256`; `nextInitializedTickWithinOneWord` — searches at most one 256-bit word per call | `flipTick`: `self[wordPos] ^= mask` | 5,000 (word already nonzero) / 22,100 (first bit in word) (ESTIMATED) | None for swaps; analytics via subgraph. Key trick: bounded scan per call. |
| Aave v3 (QUOTED `UserConfiguration.sol`, Pool docs) | `getReservesList()` (id → asset, `_reservesCount`), `getUserConfiguration(user)` bitmap: 2 bits per reserve, `MAX_RESERVES_COUNT` 128 → whole universe in one slot; `_getFirstAssetIdByMask` = find-first-set | One uint256 per user | 5,000 per bit flip; `isUsingAsCollateral` = 1 SLOAD | Nothing for protocol logic. |
| Compound v2 (QUOTED `ComptrollerStorage.sol`) | `allMarkets[]`, `accountAssets[account][]` ("capped by maxAssets"), `markets[cToken].accountMembership[account]` | Array + membership mapping | push 27,100 + membership 22,100 ≈ 49k (ESTIMATED) | Nothing for protocol logic; bounded by `maxAssets`. |
| ERC721Enumerable (QUOTED Alchemy blog) | `tokenOfOwnerByIndex`, `tokenByIndex`, `totalSupply` | 4 mappings + 1 array, written on every transfer | mint 154,814 vs ERC721A 76,690 → ~78k for enumeration | — |

Takeaways: (a) every production game on the EVM stores per-entity state on-chain and delegates *set queries* to an indexer; the only on-chain set structures that survived in games are dense id arrays with start/end pagination (Dark Forest) and MUD's hook-maintained reverse indexes at +110–128k per write. (b) Data-heavy DeFi protocols make queries cheap by **closing the universe** (Aave 128 reserves in one word; Compound `maxAssets`; Uniswap one word per call). (c) Attestation systems (EAS, Verax, ENS) keep zero on-chain indexes and are honest about it.

## 2. Index data structures on the EVM, costed

Let N = set size, h = hits returned. Costs per operation; "materialize" = fetching the 32-byte id per hit (2,100 cold each) — often the dominant term.

| Structure | Insert | Remove | Membership | Enumerate N | Bounded scan |
|---|---|---|---|---|---|
| Mapping + counter (dense array `ids[i]`, `count`) | 22,100 + 5,000 (length) ≈ 27,100 | swap-and-pop needs a position map (see EnumerableSet) or tombstone (5,000) | none without position map | 2,100 + 2,100·N | `(start,end)` slices (Dark Forest, EAS Indexer, Farcaster `keyAt`) |
| OZ EnumerableSet (QUOTED layout `bytes32[] _values; mapping(value=>pos+1)`) | ≈ 49,200 (2 fresh slots + length); 66,300 if first | swap-and-pop ≈ 29,200 minus ≤ 9,600 refund ≈ 19,600 net | 2,100 (+42) | 2,100·(N+1); `values()` "copies the entire storage to memory… may render the function uncallable" (QUOTED) | `at(i)` |
| Solady EnumerableSetLib (QUOTED) | first 3 elements live in the root slots with no length/position slots (~22,100 each); O(1) amortized after | swap-and-pop | 1–3 SLOADs | same | same |
| Linked list w/ sentinel (Safe `owners[owner] → next`, QUOTED) | ≈ 34,200 (read head, write new→head 22,100, sentinel→new 5,000, count 5,000) | needs caller-supplied `prevOwner`: 2 writes + clear ≈ 10,000 net | 1 SLOAD (`owners[x] != 0`) | 2,100·(N+1), no random access | none (must walk) |
| Sorted linked list with hints (Liquity `SortedTroves`, QUOTED) | O(1) with valid `(prevId,nextId)` hints checked on-chain (`_validInsertPosition`), else O(N) walk (`_descendList/_ascendList`); Liquity documents out-of-gas cases when hints are stale | same | 1 SLOAD | ordered walk 2,100/node | hints computed off-chain, verified on-chain |
| Packed posting list (8×uint32 or 16×uint16 ordinals per word) | amortized ≈ (22,100 + 7×5,000)/8 + 5,000 length ≈ 12,100 | tombstone 5,000; compaction impractical | none (scan) | 2,100·N/8 ≈ 263/entry | slice by word |
| Bitmap over ordinals (OZ BitMaps, Uniswap tickBitmap) | 5,000 typical; 22,100 when the word goes zero→nonzero; amortized ≈ 5,070 | 5,000 (refund only if word returns to zero) | 1 SLOAD = 2,100 | 2,100 per 256 ordinals + ~60–100 gas per set bit to extract (`x & -x` loop) | per-word (Uniswap: max 256 ticks per call) |
| Two-level bitmap (summary bit per non-empty word; Uniswap's word index generalized) | +5,000 when a data word transitions zero→nonzero (rare) | +5,000 when it returns to zero | 2,100 | 2,100 per summary word (covers 65,536 ordinals) + 2,100 per non-empty data word — sparse sets stay cheap | word ranges |
| Red-black tree (BokkyPooBah, QUOTED README, measured 2018–2020 pre-Berlin, ~739 mainnet instances as of 2024-04-13) | 68,459 (empty) → 127,210 avg at 9,999 keys | 44,835 → 81,486 avg at 10,000 keys | O(log N) SLOADs | in-order walk | `first/next` |
| Skip list / treap on-chain | **Not found** in any production EVM system; no measured numbers exist that I could locate. Sorted needs are met by RB-trees or hinted lists. | | | | |
| Bloom filter (single-slot 256-bit, wanseob/solidity-bloom-filter, QUOTED; no gas numbers published) | 5,000 (dirty word) + k keccaks (~50 each) | not supported | 2,100 + k·50; FP e.g. m=256, n=10, k=3 → ≈0.13%; n=50, k=4 → ≈8.6% (ESTIMATED) | **cannot enumerate** | Ethereum `logsBloom` is the canonical on-chain bloom: 2,048 bits, 3 bits per element, FP 0.5–1.5% (QUOTED, 2018) |
| Secondary index maintained by hook (MUD KeysWithValue / KeysInTable; EAS Indexer) | +110k / +128k (MUD, QUOTED); ≈135k (EAS Indexer, ESTIMATED) | 86k / 149k (MUD, QUOTED); EAS Indexer none | via arrays | copies whole array | EAS: `(start,length,reverseOrder)` |

Rule of thumb from these numbers: any structure that stores one 32-byte id per entry costs ≥ 22,100 per entry to write and 2,100 per entry to read; only bitmaps and packed posting lists over **small-integer ordinals** break that floor (5,000 / 8 gas per entry on the read side). Therefore the first design decision is whether an ordinal space exists — it does inside a directory.

## 3. The completeness problem

An on-chain reader can only assert "this enumeration is complete" if the structure gives *closure*: a bound it can compare against. Patterns in production:

1. **Sequential counter** — Verax `attestationIdCounter` (ids are `chainPrefix + counter`), Farcaster `idCounter`, ERC-721 `totalSupply/tokenByIndex`, Dark Forest `getNPlanets`. Completeness = "I read ordinals 0..count-1 at block B". Cost: 1 SLOAD for the count, then N reads. This is the cheapest closure and the only one that survives pagination across multiple `eth_call`s — the web client pins a `blockTag` and reads pages; no external dependency.
2. **Sentinel-terminated list** (Safe) — completeness = reached the sentinel; no random access, no pagination, O(N) walk.
3. **Fixed-size universe in a word** (Aave 128 reserves × 2 bits; Compound `maxAssets`) — closure is structural; the complement is a bitwise NOT masked by the "exists" bits. Cost: 1–2 SLOADs for the whole universe.
4. **Opt-in secondary indexes are never complete** — EAS `Indexer.sol` only contains attestations someone chose to `indexAttestation`, and never prunes. A reader can prove existence from it but never absence. Anything answering "NOT tagged X" must be maintained by the *same write path* that creates entries, not by volunteers.
5. **Version stamp** — a per-container `version` slot bumped on any membership/tag change (5,000 per write) lets a multi-call reader verify consistency (read version before and after); inside one transaction this is unnecessary (atomic).

Negative filters ("NOT tagged nsfw") therefore need two things the positive index alone does not give: an authoritative "alive" set (closure) and a guarantee the positive index is maintained on every write. With bitmaps over ordinals the cost is `alive & ~nsfw` per word: 2 SLOADs = 4,200 per 256 files. With arrays/sets it is an anti-join: enumerate the universe (2,100/entry) and probe membership (2,100/entry) = ~4,200 **per file**, i.e., 256× worse than the bitmap. This is the single strongest argument for ordinal bitmaps: NOT queries cost the same as positive queries.

## 4. Multi-predicate queries

Strategies and when each is feasible:

- **Bitmap AND/OR/NOT over a shared ordinal space** — cost is 2,100 per word per predicate, independent of selectivity; order of predicates does not matter. "image AND nsfw AND in D": if bitmaps are keyed by `(D, tag)`, the directory is the partition key, not a predicate: cost ≈ W × 4,200 where W = ceil(n_D/256). n_D = 1,000 → 16,800; n_D = 10,000 → 168k; n_D = 100,000 → 1.68M (view-only territory). Uniswap's discipline applies: expose a per-word-range function so an in-tx caller bounds its gas.
- **Two-level bitmaps for sparse predicates** — scan the sparser tag's summary word(s), then probe only the other tags' data words where the sparse tag is non-empty. With a per-`(D,tag)` count (one slot, 5,000 per update) the reader can pick the sparsest predicate. Example: 1M-file directory, 10 nsfw files: summary 16 SLOADs + ≤10 data words ≈ 55k instead of 3,906 words × 2,100 = 8.2M.
- **Posting-list zig-zag** — scan the smallest list (263/entry packed, 2,100/entry unpacked) and probe each candidate's membership bit in the other predicates (2,100 each). Cost ≈ |smallest| × (263 + 2,100·(k−1)). Good when one list is tiny; bad when all are large.
- **Hierarchies** — "tagged image" vs "image/png": materialize both bits at write time (media-type major and full type) rather than prefix-matching strings on read; +5,070 per extra bit.

Where it becomes infeasible and the honest answer is "this needs an indexer" (or a proof-carrying one):
- Cross-directory / global predicates: the universe becomes all files; W grows with total corpus (1M files → 8.2M gas per predicate scan). Only viable with two-level summaries *and* sparse predicates.
- Predicate combinations not pre-materialized over one ordinal space (e.g., "tagged by any of these 500 attesters", regex/prefix over tag strings, numeric ranges over non-ordinal keys → RB-tree at 68–127k per insert).
- Ranking/sorting other than ordinal (insertion) order.
- History ("was this nsfw at block B") — see §5; only current state is indexable at this price.
- Returning full record bodies for thousands of hits in one tx (2,100 per slot per hit).
Off-chain options that keep the on-chain reader trustless: ZK coprocessors that deliver a proof the contract verifies — Brevis is live (coprocessor-docs.brevis.network, accessed 2026-09-10); Axiom shut down its coprocessor and folded the circuits into OpenVM (Trail of Bits, 2025-05-30). Plain `eth_getLogs` from any node is the zero-infra fallback for the web client, but hosted RPCs cap it (Alchemy: "any block range with a cap of 10K logs… OR a 2K block range with no cap", QUOTED; QuickNode 10,000 blocks paid), so it cannot be the primary index.

## 5. Current state vs history

How production systems avoid returning stale entries, and what the join costs:

| System | Mechanism | Who pays |
|---|---|---|
| EAS | `_revoke` sets `revocationTime`; `Indexer.sol` never removes → reader must `getAttestation(uid)` per hit (cold CALL 2,600 + ~7 slots × 2,100 ≈ 17k per hit, ESTIMATED) and filter; stale ratio unbounded | Reader, per hit, forever |
| Verax | `revoked` flag + `replacedBy` pointer; reader follows the chain | Reader, 1–2 SLOADs per hop |
| Farcaster KeyRegistry | Key is *moved* between `_activeKeysByFid` and `_removedKeysByFid` at write time (≈ 6 slots touched); "current" = the active set, no join | Writer (`testFuzzRemove` μ 351,150 vs add 307,872, QUOTED, harness-inclusive) |
| MUD KeysWithValue | On set, key is removed from the old value's list and pushed to the new (167,214 QUOTED); index always reflects current | Writer |
| Uniswap | `flipTick` clears the bit when liquidity at the tick reaches zero; bitmap is always current | Writer, 5,000 |
| ENS | Mapping overwritten in place; history exists only in events | Writer; history off-chain |

Four generic patterns, costed:
1. **Write-time maintenance** (index reflects current; superseded entry removed in the same tx): +5,000 (bit clear) to +20–50k (swap-and-pop with position map). Reads are clean. This is what every protocol that needs on-chain consumers chose (Farcaster, Uniswap, Aave, MUD modules).
2. **Read-time join** (append-only index + validity check per hit): 2,100–17,000 per hit and wasted work proportional to churn. Acceptable only for off-chain readers (EAS).
3. **Tombstone/alive bitmap** over ordinals: 5,000 per state change; reader ANDs `alive` at 2,100 per word.
4. **Version stamps**: index stores `(ordinal, version)`, reader compares to the binding's current version — 2 SLOADs per hit.

For EFS specifically: records are immutable and content-addressed, bindings are mutable, and a Lens decides whose claims count. The index must be keyed on the **binding position** (directory ordinal), never the record id: when a binding switches to a new record, the writer re-derives the new record's tag set and flips the delta bits (5,000 each). Superseded records stay resolvable by id (history) but are never indexed; the index answers "current" only. Attester dimension: either key bitmaps by `(D, tag, attester)` (write cost unchanged per attester; read cost k SLOADs per word for a lens admitting k attesters), or let a resolver materialize a per-lens bitmap at write time for lenses registered on the directory. Open-ended attester sets resolved at read time is the first EFS feature that falls off the on-chain cliff.

## 6. Costed minimal index set for the four thought-experiment queries (inside a directory)

Assumptions: directory D with n files; tags identified by `bytes32 tagId = keccak(tagString)` (no registry storage); a file added to D receives a monotonically increasing ordinal (never reused). If EFS's directory binding table already addresses entries by position, that position *is* the ordinal and costs nothing extra.

**Storage (all mappings; three nested keys ≈ 3 keccaks ≈ 126 gas):**
- `count[D]` — closure counter.
- `ord[D][fileId] → uint32`, `entry[D][ord] → binding slot` (skip if the binding table is positional).
- `alive[D][word] → uint256` + summary `aliveSum[D][sword]`.
- `bits[D][tagId][word] → uint256` + summary `bitsSum[D][tagId][sword]`.
- `tagCount[D][tagId]` (optional; enables sparsest-first planning).

**Per-write cost (ESTIMATED), adding one file with tags {image, image/png} and no nsfw:**

| Item | Gas |
|---|---|
| `count[D]` bump | 5,000 (22,100 first ever) |
| ordinal mapping(s) | 0 if positional binding; else 22,100 (one) or 44,200 (both directions) |
| `alive` bit | ≈ 5,070 amortized (22,100 when a new word opens) |
| summary-bit transitions (alive + each tag) | ≈ 5,000 each, occurs once per 256 files per tag |
| tag bits: image, image/png | 2 × 5,070 ≈ 10,140 |
| `tagCount` ×2 (optional) | 10,000 |
| keccaks + hook overhead | ≈ 2,000 |
| **Total index overhead** | **≈ 32k (positional, no counts) to ≈ 76k (both ordinal maps + counts)** |

Compare: the current EFS tag write is 2,838,264 gas across 94 slots (owner MEASURED); EAS attests for ~230k; MUD's on-chain index costs +110–128k per write. The proposed index layer is 6–10 slot touches, mostly 5,000-gas dirty writes, i.e., roughly 1–3% of today's tag write. Adding "nsfw" later to an existing file: 5,070 (+5,000 count). Removing a tag: 5,000 (−4,800 refund only if the word empties). Rebinding a position to a new record: 5,070 per differing tag bit. Note this does not reduce the cost of the tag *record* itself; 94 slots for a tag is the bigger problem and is independent of indexing.

**Per-query cost (ESTIMATED; W = ceil(n/256) data words, h = hits):**

| Query | Words read | Gas to get ordinals | Gas to materialize ids (unpacked, 2,100/hit) |
|---|---|---|---|
| Q1 tagged image | W (bits) | 2,100·W + ~80·h | 2,100·h |
| Q2 tagged image/png | W | same | same |
| Q3 tagged nsfw (sparse) | summary + non-empty words | 2,100·(ceil(W/256) + nonempty) + 80·h | 2,100·h |
| Q4 NOT tagged nsfw | 2W (alive, nsfw) | 4,200·W + 80·h | 2,100·h |
| image AND nsfw | 2W (or sparse-first) | 4,200·W, or sparse path ≈ 2,100·(summary + 2·nonempty) | 2,100·h |

Worked numbers: n = 1,000 (W = 4): Q1 ≈ 8.4k + 80h; Q4 ≈ 16.8k + 80h; with h = 300 hits, ordinals cost ≈ 33k–41k and materializing ids adds 630k. n = 10,000 (W = 40): Q1 ≈ 84k, Q4 ≈ 168k, plus hits. n = 100,000 (W = 391): Q1 ≈ 821k, Q4 ≈ 1.64M — fine for `eth_call`, marginal for a tx; expose `(fromWord, toWord)` ranges so a game contract can page like Uniswap does. Membership tests ("is file f tagged nsfw?") are 2 SLOADs (ordinal, bit) ≈ 4,300 cold, ~250 warm — the operation an MMORPG contract will actually run most, and it is O(1). A per-file 256-bit tag bloom in one slot (add: 5,000; check: 2,100 + 3 keccaks) gives certain negatives for "NOT nsfw" on a single known file without touching the directory index; FP ≈ 0.13% at 10 tags, k = 3 — useful as a prefilter, never as the index.

Consistency for the web client: every query above is a pure `eth_call`; paginate with a pinned `blockTag`, and compare `count[D]` (and an optional `version[D]`) before/after — no indexer, no Graph, no RPC log-range limits. The MMORPG contract gets the same functions in-tx, bounded by word range. Read:write ≈ 100:1 favors this shape: reads are 2,100 per 256 files, writes are ~5,000 per bit.

**Not achievable on-chain at these prices (say so in the design):**
- Global (cross-directory) tag queries over a large corpus — only sparse tags via summary bitmaps; dense tags need an indexer or a ZK coprocessor (Brevis; Axiom is gone).
- Any predicate not materialized as a bit at write time (prefix/regex over tag strings, numeric ranges, "any of these attesters" over open sets, lens resolution over unbounded attester sets).
- Sorting/ranking beyond insertion order; sorted secondary keys cost 68–127k per insert (RB-tree, QUOTED, pre-Berlin).
- Historical queries ("as of block B") — only current bindings are indexed; history via events (`eth_getLogs`, provider-capped) or proofs.
- Returning thousands of full records in one transaction (2,100 per slot per hit).
- Reusing ordinals or compacting deleted positions — keep ordinals monotonic; `alive` handles gaps.

Could not find: any production on-chain skip list or treap; published gas numbers for on-chain bloom filters; a MUD statement deprecating KeysInTable/KeysWithValue (they remain listed on mud.dev/world/modules with no gas warning, accessed 2026-09-10); an EVM-era EVE Frontier document specifying which queries used view calls vs the World API.

Sources (accessed 2026-09-10 unless dated): EIP-2929 (2020) https://eips.ethereum.org/EIPS/eip-2929 · EIP-3529 (2021) https://eips.ethereum.org/EIPS/eip-3529 · Dark Forest `DFGetterFacet.sol` / `LibStorage.sol` https://github.com/darkforest-eth/eth · DF subgraph guest post https://blog.zkga.me/v5-subgraph · Lattice "MUD from zero to v2" https://lattice.xyz/blog/mud-zero-to-v2 · OPCraft part 1 https://lattice.xyz/blog/making-of-opcraft-part-1-building-an-on-chain-voxel-game · MUD modules https://mud.dev/world/modules · MUD indexer https://mud.dev/indexer · MUD gas reports https://github.com/latticexyz/mud (packages/world, world-modules, store `gas-report.json`) · KeysWithValueHook / KeysInTableHook sources (same repo) · Primodium indexer https://developer.primodium.com/indexer · EVE Frontier → Sui (Decrypt, 2025-10-08) https://decrypt.co/343962/eve-frontier-jumps-ship-ethereum-sui-heres-why ; Sui blog (2026-03) https://blog.sui.io/eve-frontier-migrates-to-sui-hackathon-live/ ; EVM-era Smart Infrastructure https://dev.to/q9/getting-started-with-smart-infrastructure-in-eve-frontier-45n4 · Loot https://www.lootproject.com/resources · Farcaster KeyRegistry docs https://docs.farcaster.xyz/reference/contracts/reference/key-registry ; IdRegistry docs https://docs.farcaster.xyz/reference/contracts/reference/id-registry ; source + `.gas-snapshot` https://github.com/farcasterxyz/contracts · ENS enumerate https://docs.ens.domains/web/enumerate/ · EAS `EAS.sol`, `Indexer.sol` https://github.com/ethereum-attestation-service/eas-contracts · Verax `AttestationRegistry.sol` https://github.com/Consensys/linea-attestation-registry · Uniswap `TickBitmap.sol` https://github.com/Uniswap/v3-core · Aave `UserConfiguration.sol` https://github.com/aave/aave-v3-core ; Pool docs https://aave.com/docs/aave-v3/smart-contracts/pool · Compound `ComptrollerStorage.sol` https://github.com/compound-finance/compound-protocol · OZ `EnumerableSet.sol`, `BitMaps.sol` https://github.com/OpenZeppelin/openzeppelin-contracts · Solady `EnumerableSetLib.sol` https://github.com/Vectorized/solady · Safe `OwnerManager.sol` https://github.com/safe-fndn/safe-smart-account · Liquity `SortedTroves.sol` https://github.com/liquity/dev · BokkyPooBah RB-tree README https://github.com/bokkypoobah/BokkyPooBahsRedBlackTreeLibrary · ERC721 vs ERC721A (Alchemy) https://www.alchemy.com/blog/erc721-vs-erc721a-batch-minting-nfts · Alchemy eth_getLogs limits https://www.alchemy.com/docs/deep-dive-into-eth_getlogs · QuickNode 10k-block limit https://support.quicknode.com/hc/en-us/articles/10258449939473 · logsBloom https://www.jvillella.com/ethereum-bloom-filter · solidity-bloom-filter https://github.com/wanseob/solidity-bloom-filter · Brevis docs https://coprocessor-docs.brevis.network/ · Axiom shutdown (Trail of Bits, 2025-05-30) https://blog.trailofbits.com/2025/05/30/a-deep-dive-into-axioms-halo2-circuits/