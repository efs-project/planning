<!-- Index-layer deep dive strand: On-chain prior art: lazy aggregates, keeper catch-up, permissionless backfill, verify-don't-compute, staleness failures -->
<!-- Provenance: produced 2026-09-10 by a research/design agent under the integration-test-lead's
     workflow (harness claude-code, model Claude Fable 5). Figures carry the agent's own
     MEASURED / QUOTED / ESTIMATED labels; nothing here is a ruling. The engineering lead's
     verification and position are in ../../index-layer-2026-09-10.md. -->

# Prior art: incremental, crowd-paid, and later-built derived state that contracts rely on

Scope note. Everything below is grounded in primary sources fetched 2026-09-10 (URLs dated where the source carries a date) or in vault files (cited `file:line`). Gas figures carry MEASURED / QUOTED / ESTIMATED. Three things could not be verified and are flagged inline: Lagrange's 2026 status (docs return 403), Synthetix `FeePool.sol` source (every GitHub path 404s; SIP-11 fetched instead), and any per-append gas for a production MMR beyond one 2019-era README figure.

---

## 1. Lazy aggregates: "don't maintain what readers can recompute"

**Beacon deposit contract** (Sourcify-verified mainnet source, `0x00000000219ab540356cBB839Cbe05303d7705Fa`). The whole pattern is in ~20 lines. Storage is `bytes32[32] branch; uint256 deposit_count; bytes32[32] zero_hashes;`. On `deposit()` the contract writes *exactly one* `branch[height]` slot plus `deposit_count`, walking up only while the size bit is even:

```solidity
deposit_count += 1;
uint size = deposit_count;
for (uint height = 0; height < DEPOSIT_CONTRACT_TREE_DEPTH; height++) {
    if ((size & 1) == 1) { branch[height] = node; return; }
    node = sha256(abi.encodePacked(branch[height], node));
    size /= 2;
}
```

The root is never stored; `get_deposit_root()` is a `view` that folds `branch[]` against `zero_hashes[]` for 32 levels and mixes in `deposit_count` (scratchpad copy `deposit_contract.sol:80-95, 143-155`). `deposit_count` doubles as the closure/basis: a reader holding `(root, count)` knows exactly which prefix of the log the root covers. The vault has already measured the payoff: **50,462 gas per depth-32 append MEASURED vs ~228,000 for a store-the-root keccak append; hashing is 0.5% of the append, the rest is storage traffic** (gas-engineering-2026-09-10.md:222-248).

**The three contrasting Merkle libraries confirm it is storage, not hashing, that decides:**

| Library | Per insert writes | Root | Staleness signal |
|---|---|---|---|
| Beacon deposit (above) | 1 branch slot + count | lazy, in `view` | `deposit_count` |
| OpenZeppelin `Bytes32PushTree` (`utils/structs/MerkleTree.sol`) | 1 `_sides` slot + `_nextLeafIndex`; recomputes root each push but "The `root` and the updates history is not stored within the tree" — `push` *returns* `(index, newRoot)` and the caller decides whether to store it | caller's choice | index |
| Tornado `MerkleTreeWithHistory` (`tornado-core`) | ~depth/2 `filledSubtrees` slots + ring-buffer root; `ROOT_HISTORY_SIZE = 30`, `isKnownRoot()` accepts any of the last 30 roots | stored, 30-deep history | root history window |
| zk-kit `LeanIMT` (`InternalLeanIMT.sol`) | root at `sideNodes[depth]` recomputed on every insert; `_insertMany` batches to amortize; `update`/`remove` require caller-supplied sibling nodes (verify-don't-compute) | stored | `size`, `depth` |

**Merkle Mountain Ranges** are the append-only accumulator of choice when the *readers* also need cheap witness updates: ePrint 2025/234 ("Merkle Mountain Ranges are Optimal", https://eprint.iacr.org/2025/234) proves MMRs minimise witness-update frequency among accumulators. Deployed: Herodotus's historical block-hash accumulator (STARK-proven batches of "~1350 blocks", StarkWare blog, accessed 2026-09-10), Axiom V1 ("Keccak Merkle roots of groups of 1024 consecutive block hashes" in an MMR from genesis, docs dated 2023-07-28), Relic Protocol (claims "over 1,000,000 block hashes in a single transaction", litepaper). Herodotus's `solidity-mmr` README: the caller supplies the current peaks + size and the contract checks them against the stored root before appending — i.e. the *append itself is a verified claim*. The only per-append gas number found is wanseob/solidity-mmr's "To append 1000 items, MMR used 95307 gas on average" (QUOTED, undated ~2019, pre-Berlin pricing; not comparable to today's schedule). **Failure mode already exploited in this family:** ChainSecurity, 2023-12-22 — Herodotus's peak check "only hashed peaks against the stored size and root", so an intermediate bagging hash could be submitted as a peak, enabling "abnormal growth of the MMR and incorrect updating of the root"; the fix verifies each peak, the peak count against size, and bounds proof length by depth (https://www.chainsecurity.com/blog/merkle-mountain-range-mmr-the-case-of-herodotus). Verified-claim appends are only as good as the claim's constraint set.

**Kernel-level ring buffers** are the same idea at protocol level: EIP-2935 (Final, Pectra, mainnet 2025-05-07 per EF blog 2025-04-23) serves 8,191 block hashes from a system contract; EIP-4788 (Final) serves 8,191 beacon roots keyed by timestamp. Both **revert on a miss** ("If the timestamp does not match, the contract must revert") — absence is an error, never a zero.

---

## 2. Keeper-called accrual and "anyone may call" catch-up

| System | Catch-up entry point | "As of when" representation | What a reader gets if stale |
|---|---|---|---|
| Compound v2 `CToken.accrueInterest()` | called by every mutating op; short-circuits `if (accrualBlockNumberPrior == currentBlockNumber)` | `accrualBlockNumber`, `borrowIndex` | Twin API: `exchangeRateStored()` / `borrowBalanceStored()` return the last accrued value; `…Current()` variants call `accrueInterest()` first (caller pays) |
| Compound `Comptroller.claimComp(address holder)` | `public` — anyone can accrue and claim *for any holder* | `compSupplyState[cToken].{index, block}` | `distributeSupplierComp` computes `deltaIndex = supplyIndex − supplierIndex` at claim time; see §7 for the $80–90M sentinel bug |
| Aave v3 `ReserveLogic` | `updateState()` on every op; skips if `timestamp == block.timestamp` | `lastUpdateTimestamp`, `liquidityIndex` | **Project-on-read**: `getNormalizedIncome()` returns `calculateLinearInterest(rate, timestamp).rayMul(index)` — a stale reserve still reads *correct*, extrapolated to now, with no write |
| MakerDAO `Jug.drip(ilk)` / `Pot.drip()` | permissionless; `require(now >= rho)`; `rpow` over `now − rho` | `rho` (last drip timestamp), `rate`/`chi` | `Vat.rate` simply stays stale. But `Pot.join()` enforces `require(now == rho, "Pot/rho-not-updated")` — a **hard freshness gate on the consumer**, while `exit()` has none |
| Synthetix `FeePool.closeCurrentFeePeriod()` | permissionless since SIP-11 (2019-07-10): "the auto bot closing has failed twice already in the last 2 weeks… any SNX holder may call this" (https://sips.synthetix.io/sips/sip-11); an authority service still polls every 10 min | `recentFeePeriods[].startTime`, `feePeriodDuration` | Rewards for the open period are not claimable until closed (source not fetchable — every GitHub path 404'd; behaviour from SIP-11 and the v2.101.3 search summary) |
| Uniswap v3 `Oracle.grow()` | "Anyone can pay the SSTOREs to increase the maximum length of the oracle array" (`Oracle.sol`); pre-writes `blockTimestamp = 1` per slot | `slot0.observationCardinality` vs `observationCardinalityNext`; the array only grows into pre-paid slots as swaps write | `observe()` **reverts `'OLD'`** when the requested lookback predates the oldest observation. Pools start at cardinality 1 ("each pool tracks only a single observation, overwriting it as blocks elapse"; max 65,535 ≈ "~9 days", developers.uniswap.org) |
| Lido `AccountingOracle` | HashConsensus quorum submits per frame | `refSlot`; `getLastProcessingRefSlot()`, `getProcessingState().{currentFrameRefSlot, mainDataSubmitted, processingDeadlineTime}` | No report → no rebase: "Oracle daemons could stop pushing their reports… no oracle reports and no stETH rebases for this whole period"; `OracleReportSanityChecker` bounds deltas per report |

Transferable observation: every one of these systems that survived exposes **two things**: a basis stamp (block, timestamp, refSlot, cardinality) and a consumer-side choice (pay to catch up, extrapolate, or revert). The ones that are *safe* by default are those where the stale read is still *correct as of its stamp* (Aave, Compound `Stored`, Maker `rate`), not merely "old".

---

## 3. Permissionless backfill / indexing contracts and verify-a-claim schemes

**EAS `Indexer.sol`** (fetched from `eas-contracts/contracts/Indexer.sol`): `indexAttestation(uid)` / `indexAttestations(uid[])` are open; the only check is `_eas.getAttestation(uid).uid != EMPTY_UID` — "The code does not explicitly check revocation status. Revoked attestations are indexed if they exist"; "no unindexing or removal functions"; four append-only `bytes32[]` mappings with `(start, length, reverseOrder)` getters and an `Indexed(uid)` event. Consequence, already in the vault: it "can prove existence but never absence" (research-2026-09-10/indexing.md:23, 60). The EFS v1 kernel hit the same shape and had to fence it: ADR-0066 made permissionless `index()` "discovery-only" because a volunteer index call "could manufacture *positive* folder presence without placing real content" (0066-index-discovery-only-no-folder-presence.md:17-28); ADR-0008 removed the write-time qualifying-folder index and noted the sticky-semantics cost ("a folder that once contained matching content stays in the qualifying index even if all content is removed", 0008:57).

**MUD `KeysInTable`/`KeysWithValue`** index "only records written after installation" (mud.md:90) at +128k/+110k per write (MEASURED) — later-installed indexes are silently incomplete over the past.

**ENS.** Reverse records are half a fact: "you **must** verify it by performing a forward resolution… If the addresses don't match, display the original address" (docs.ens.domains/web/reverse). The 2020 registry migration used **read-through, not backfill**: `ENSRegistryWithFallback.owner/resolver/ttl` do `if (!recordExists(node)) return old.owner(node);` — unmigrated names resolve from the old registry until touched.

**Block-hash oracles / coprocessors, status 2026-09-10:**
- EIP-2935 / EIP-4788: live (Pectra, 2025-05-07); 8,191-entry windows; revert on miss.
- Axiom V1: MMR of 1024-block roots "kept updated by ZK proofs"; `mmrRingBuffer` caches recent MMR commitments "to facilitate asynchronous proving against a Merkle mountain range which may be updated on-chain during proving" (docs 2023-07-28) — a concrete answer to the "index moved while I was building my claim" race. Axiom's coprocessor is **shut down**; the circuits live on as an OpenVM dependency (Trail of Bits, 2025-05-30).
- Herodotus: STARK-proven ~1,350-block batches, root on a "Proofs Aggregation" contract; who may grow it is not documented as permissionless (operator-run in the sources found); Snapshot X uses it (April 2026).
- Relic: "Anyone can generate a proof and submit it" (litepaper); MMR root periodically committed.
- Brevis: ZK coprocessor v2 "live on mainnet" (blog 2025-01-08); app contracts implement `handleProofResult`; **coChain mode** (2024-01-18) posts results optimistically with an application-defined challenge window and a slashing window; "Anyone can challenge a result by submitting a challenge claim along with a monetary bond"; ZK proof produced only on challenge. Per-callback verification gas: **not published in any page fetched.**
- Lagrange: docs and product pages return 403; the homepage now reads "Verifiable Compute for AI & Autonomy". **Could not verify whether the SQL coprocessor still serves mainnet queries.**
- Optimism fault proofs: "anyone to make proposals… anyone to challenge"; bisection to a single Cannon step; "~1 week challenge period"; "approximately 14 ETH for proposals over a 7-day window"; airgap window with GUARDIAN veto (docs.optimism.io). Arbitrum BoLD: mainnet 2025-02-12, permissionless validation, disputes bounded to ~7 days (The Block).
- UMA OOv3 (`docs.uma.xyz`): `assertTruth` posts a bonded claim ("**not stored on-chain**, only emitted"), default liveness two hours; "After liveness passes **and** the assertion is **not disputed**, anyone can call `settleAssertion`"; result delivered via `assertionResolvedCallback(assertionId, assertedTruthfully)`.

Pattern the whole group shares: a *claim* has three states — pending, settled-true, settled-false — and consumers are only allowed to act on settled. Nothing in this group lets a reader treat "no claim yet" as "false".

---

## 4. Verify-don't-compute: sorted inserts, sortedness checks, hints

| Contract | What the caller supplies | What the contract checks | Fallback when wrong |
|---|---|---|---|
| Liquity `SortedTroves.insert(_id, _NICR, _prevId, _nextId)` | two neighbour hints from `HintHelpers.getApproxHint` (random sampling, "for `numTrials = k * sqrt(n)`… worst case `O(sqrt(n))` if k >= 10") + `findInsertPosition` | `_validInsertPosition`: adjacency and `prev.NICR ≥ new ≥ next.NICR` — O(1) | "Sender's hint was not a valid insert position. Use sender's hint to find a valid insert position" — descend/ascend walk; README: stale hints "can cause increased gas consumption and potential out-of-gas failures, particularly affecting redemption operations" |
| Gnosis EasyAuction `IterableOrderedOrderSet.insert(elementToInsert, elementBeforeNewOne)` | one predecessor hint computed off-chain | hint must exist (`prevMap != 0`) and be smaller; then `while (current.smallerThan(elementToInsert))` walks forward; skips removed nodes backward via `prevMap` | bounded by distance from hint |
| Safe `checkNSignatures` | signatures in ascending signer order | `if (currentOwner <= lastOwner \|\| owners[currentOwner] == 0 …) revertWithError("GS026")` — O(n) sortedness check proves uniqueness without a set | revert |
| Balancer v2 `InputHelpers.ensureArrayIsSorted` | sorted token array at registration | `_require(previous < current, Errors.UNSORTED_ARRAY)` | revert |
| EFS v1 `EFSSortOverlay.processItems` | `expectedStartIndex`, items, `leftHints[]`, `rightHints[]` | each item `== kernelArray[currentIndex]` via `getChildAt` ("callers cannot inject arbitrary UIDs"); `isLessThan(left,item) && isLessThan(item,right)`; `currentIndex >= start+len` → **silent no-op**, `!= start` → `StaleStartIndex` revert | revert `InvalidPosition` (specs/07-Sort-Overlay-Architecture.md:84-109, 287-294) |

The honest EVM reading of "verify is cheaper than compute": the saving is in **storage traffic and bounded worst case**, not arithmetic. Sorting 256 keys in memory is ~10⁵ gas; the same keys read from storage are 256 × 2,100 = 538k regardless of who sorts; and shipping 256 × 32 bytes of claimed order as calldata is ≈131k at 16/byte, ≈328k at EIP-7623's 40/byte floor (Final; `tokens = zero + 4·nonzero`, floor 10/token). Hints win because they replace an O(n) SLOAD walk with O(1) SLOADs (Liquity), not because comparison is cheaper than sorting. The vault's own crossover numbers agree: proof-guarded writes beat direct storage only below depth ~11, and from depth ≈16 "verifying and *not* verifying cost the same to the gas" because calldata dominates (gas-engineering §8.1:201-207).

---

## 5. Retroactive derived indexes over an append-only log: deployed examples

Searched specifically for "chunked, idempotent, order-independent, word-wise OR, `indexedThrough` cursor" contracts. Found:

- **TornadoTrees** (`tornado-trees/contracts/TornadoTrees.sol`): the canonical cursor-ordered chunked fold. Source events are queued as hashes `deposits[i] = keccak(instance, commitment, blockNumber)` (write path, `onlyTornadoProxy`); `updateDepositTree(proof, argsHash, _currentRoot, _newRoot, _pathIndices, TreeLeaf[CHUNK_SIZE] _events)` is **`public` with no modifier**; `CHUNK_SIZE = 2**8 = 256`; preconditions `require(_currentRoot == depositRoot)` and per-leaf `require(leafHash == deposit)` against the queued hash; on success it `delete deposits[offset+i]` (refund) and sets `lastProcessedDepositLeaf = offset + CHUNK_SIZE`. Migration from V1 was done by reading the old contract's queue lazily: `offset + i >= depositsV1Length ? deposits[offset+i] : tornadoTreesV1.deposits(offset+i)` and seeding the cursor in the constructor. This is the closest deployed analogue to the owner's v1 sort scheme, with a SNARK replacing the on-chain `isLessThan` checks.
- **EAS Indexer**: idempotent (`_indexedAttestations` flag), order-independent, batchable — but unverified and pruneless (§3).
- **Uniswap MerkleDistributor `claimedBitMap`**: `claimedBitMap[index/256] |= (1 << index%256)` — idempotent set-bit into a word; the "claim" is a Merkle proof against a fixed root. This is the only deployed word-wise-OR-under-proof found; it is a write-once bitmap over a closed, pre-committed universe, not a derived index.
- **Uniswap `tickBitmap.flipTick`** is `^=` — XOR, so a replayed flip corrupts; contrast with OR. Any crowd-built bitmap must be OR/assert with an ordinal check, never toggle.
- **Axiom V1 `mmrRingBuffer`**: keeps recent accumulator states so a proof built against an older state still lands — the pattern for "the index advanced while my chunk was in the mempool".
- **ENSRegistryWithFallback**: no backfill at all; read-through until write.

**Not found:** any deployed contract that accepts third-party *unproven* word-wise OR claims into a secondary index, or any production "add an index family later and let volunteers populate it" that reaches provable completeness. Every deployed later-built index is either (a) verified per chunk against the source log with a cursor (TornadoTrees, EFS v1 sorts), (b) proof-carrying (Merkle/ZK), or (c) admittedly incomplete (EAS, MUD modules). The only "index families declared later and built in the background" that reach completeness are off-chain databases (CockroachDB's index backfill design surfaced in search) — the on-chain systems that tried it either verify every chunk or give up completeness.

---

## 6. Recompute versus accept-and-verify: the arithmetic

Setting: the crowd wants to set bit `i` in `bits[scope][attester][concept][word]` for a `TagSet` record `R` bound at directory-local ordinal `i` (indexing-and-state-2026-09-10.md:94-120 for the kind-10 ordinal; tag-system-2026-09-10.md:152-161 for the family and the mandatory ≈8,400-gas ordinal verification).

**Path A — contract recomputes the entry from source records** (ESTIMATED, today's schedule; reads unchanged under Glamsterdam):

| Step | Gas |
|---|---|
| ordinal verification (kind-10 scope word + head) | ≈8,400 (QUOTED tag-system:158-159) |
| binding head at that position → current record id | 2,100 |
| record body: 2–4 cold slots, or SSTORE2 `EXTCODECOPY` | 4,200–8,400 / ≈2,700 |
| key keccaks (~5) | ≈210 |
| **reads per entry** | **≈13–19k** |
| bit write (word rewrite) | 5,000 today / 12,100 Glamsterdam |
| fresh word, amortised over 256 entries | 86 / 430 |

Per 256-entry word: **≈3.3–4.9M reads + 5k write**. Recompute is read-bound (~99%); it fits EIP-7825 (16,777,216) at ≤3 words per transaction. A 65,536-entry column is ≈0.85–1.25G gas ≈ 50–75 transactions — so *any* retroactive family is a multi-transaction crowd job by construction, and a cursor is not optional.

**Path B — accept a claimed word and verify it against the same on-chain data:** identical SLOADs, so ≈ Path A. Claims only pay when the verifier avoids storage reads that computation would need — three ways:

| Claim type | Verification cost | Break-even vs Path A | Trust / latency |
|---|---|---|---|
| B1 trusted-signer fold (a principal signs its own column, or a delegated vocabulary — tag-system:156-158) | ecrecover 3,000 + calldata ~1–2k + word rewrite 5,000 (12,100) ≈ **10–15k per word** | immediate (≈300× cheaper than recompute) | authorisation by the column owner; no latency |
| B2 Groth16 proof of correct derivation | pairing 45,000 + 34,000×4 = 181,000 (EIP-1108, QUOTED) + inputs/calldata ≈ **220–250k** per proof, size-independent | ≈12–19 entries; a 256-entry word ≈14–20× cheaper | needs a circuit over keccak-MPT state (what Axiom built and shut down; Brevis sells); Poseidon trees would cost 353–950× keccak (gas-engineering §8.2). EFS has none |
| B3 optimistic claim + bond (UMA/coChain/OP shape) | claim record 22,100 (110,020 Glamsterdam) unless slot-recycled + bond moves ≈10k + settle tx ≈30–50k ≈ **60–150k per claim**, size-independent; dispute = Path A on ≤3 words | ≈5–10 entries | window latency (2h UMA default … 7d OP); consumer may only read settled claims; disputes must fit one tx |
| B4 Merkle proof against an on-chain root of the *same* chain's state | ≈1,280 calldata + 245 compute per level (gas-engineering §8.1) → depth 20 ≈ 30k | never: one cold SLOAD is 2,100 | only useful for other-chain, historical, or log-only data |

**Glamsterdam shifts every ratio toward lazy and word-packed.** Reads do not move; a rewrite goes 5,000→12,100 (×2.4) and a fresh slot 22,100→110,020 (×5). Bitmap folds (rewrites) stay in the tens of thousands per word; anything that allocates a slot per claim or per entry (B3 without slot recycling, id-per-entry postings) becomes the dominant cost (indexing-and-state:37-46, 143-147).

---

## 7. How deployed systems signal staleness, and what broke

Signals in production: `accrualBlockNumber` + `Stored`/`Current` twins (Compound); `lastUpdateTimestamp` + project-on-read (Aave); `slot0.observationCardinality/Index` + `'OLD'` revert (Uniswap v3); `updatedAt` (Chainlink; `answeredInRound` is "Deprecated"); `publishTime` + consumer-chosen `getPriceNoOlderThan(age)` that reverts (Pyth); `getLastProcessingRefSlot`/`processingDeadlineTime` (Lido); `rho` + `require(now == rho)` (Maker Pot); `merkleRootCreationDates[root] + merkleTreeDuration` → `Semaphore__MerkleTreeRootIsExpired` (Semaphore v4, default 1 hour); 30-root ring (Tornado); `ERC5805FutureLookup` revert for future timepoints (OZ `Votes`); revert-on-miss (EIP-2935/4788); EFS v1 `getSortStaleness = kernelCount − lastProcessedIndex` (specs/07:169-179) and the SDK's `efs.sorts.staleness` (sdk-architecture.md:623-624). **EAS Indexer has no signal at all** — nothing distinguishes "not indexed" from "does not exist".

Failures from stale or mis-derived state:

| Incident | Class | What went wrong |
|---|---|---|
| Compound Proposal 62, executed 2021-09-29; up to ~280k COMP (~$80–90M) misdistributed; fixed by Proposals 64 (2021-10-08) and 65 (`_fixBadAccruals`) | **sentinel collision in a derived index** | `distributeSupplierComp` used `supplierIndex == 0` as "never seen" and `compInitialIndex = 1e36` as the floor; after the change, markets whose `supplyIndex` equalled the initial index skipped initialisation, so `deltaIndex = 1e36 − 0` paid out on every token (BlockSec/Neptune via search; amounts from compound.substack.com) |
| Inverse Finance, 2022-04-02, $15.6M | **thin-basis aggregate reported as fresh** | Keep3r TWAP "applies the TWAP with a 30-min time window, however only 15 seconds had passed" — the oracle answered from a window it had not actually observed (Inspex/Inverse post-mortems) |
| dForce 2023-02, Sentiment 2023-04-04 (~$1M), Sturdy 2023-06-12 (~$800k) | **derived aggregate read mid-update** | Curve `get_virtual_price` read during `remove_liquidity` re-entrancy returned a deflated value; view functions had no reentrancy guard |
| Chainlink consumers without `updatedAt` checks (Code4rena LoopFi 2024, Sherlock Yieldoor 2025, Knox 2022, L2 sequencer-down cases) | **consumer forgot the staleness parameter** | the feed exposes the stamp; the reader ignores it |
| Herodotus MMR, 2023-12-22 | **under-constrained claim verification** | intermediate bagging hashes accepted as peaks |
| Uniswap v3 pools at cardinality 1 | **honest absence** | `observe()` reverts `'OLD'` rather than answering; readers must grow the array first — the correct behaviour, and the one EFS should copy |
| Liquity stale hints | **fallback walk unbounded** | documented out-of-gas on redemptions when hints go stale |
| Synthetix fee-period bot (pre-SIP-11, 2019) | **keeper liveness** | "failed twice already in the last 2 weeks" → made permissionless |

---

## 8. Transferable patterns (10) and the failure modes a crowd-built EFS index layer must design against

**Answer to the owner's framing first.** Prior art says a separate, crowd-paid index layer *can* be relied on by contracts, but only under four conditions that every surviving system meets and that EAS/MUD's modules do not: (1) the source is a closed, ordinal-addressed log (EFS has it: the kind-10 scope list, indexing-and-state:94-120); (2) progress is a per-column cursor verified chunk-by-chunk against that log (TornadoTrees, EFS v1 `processItems`); (3) every read carries a basis and a consumer-chosen freshness rule, and absence beyond the basis is a revert/UNKNOWN, never empty (Maker Pot, Uniswap `'OLD'`, Pyth, Semaphore); (4) a stale read is still *correct as of its stamp* (Aave, Compound `Stored`). The v1 sort overlay already had (1), (2) and (4) and half of (3) — `getSortStaleness` exists but `getSortedChunk` does not require a basis (specs/07:133-145). "Turning indexes off" is out of scope, but note EAS's lesson: never-pruned data lives forever; a retired family needs a `retiredAt` ordinal so readers know its basis is frozen.

Patterns:

1. **Frontier, not root** (beacon): per-append write is one slot; aggregates (`count`, `live`, `last`, `flags` on `PostingRow`) are recomputed in `view` — the ablation the vault already flagged (gas-engineering §8.3:239-248). Keep `count` as the closure.
2. **Stored/Current twin API** (Compound) + **project-on-read** (Aave): every index read returns `(result, basisOrdinal)`; a `…Current` variant folds outstanding chunks at the caller's expense; a pure read never lies about its basis.
3. **Consumer-side freshness gate, mandatory in the ABI** (Maker `now == rho`, Pyth `age`, Semaphore duration): reads take `minBasis`; if `indexedThrough[scope][attester] < minBasis` the call reverts. This is the direct antidote to the "silent absence" class (indexing-and-state:1-10; efs-silent-absence memory).
4. **Cursor-ordered, chunked, verified fold** (TornadoTrees `lastProcessedDepositLeaf` + `require(_currentRoot == depositRoot)`; EFS v1 `expectedStartIndex`): exact-match → apply; fully-behind → silent no-op; partial overlap → revert. Per-chunk atomicity, monotone cursor, idempotent OR (never XOR).
5. **Verify-don't-compute with bounded fallback** (Liquity, EasyAuction, Safe GS026, Balancer): claims carry positions; verification is O(1)/O(n) SLOAD-light; the fallback walk has a hard bound (`maxTraversal` exists in v1 reads, specs/07:155-165, but not in the insert path).
6. **Capacity/family growth paid by the beneficiary** (Uniswap `grow`, SIP-11): a new family or a Lens-triggered column is opened by whoever wants the query, with an explicit backfill cost surfaced up front — the open question in indexing-and-state:444-451 ("backfill cost when a Lens is registered… who pays, is it bounded") is answered by pattern 4 plus per-column cursors.
7. **Read-through fallback during backfill** (ENSRegistryWithFallback): for entries in `(indexedThrough, count]`, readers scan the scope list directly; cost bounded by the gap and visible to the caller.
8. **Optimistic claim + bonded challenge** (UMA, OP, BoLD, Brevis coChain) only for derivations whose dispute re-execution fits one transaction (≤ ~3 bitmap words at 3.3–4.9M each); consumers read settled claims only; claim slots recycled (ring buffer) so Glamsterdam's 110k fresh-slot price is paid once.
9. **Accumulator-with-history for in-flight claims** (Axiom `mmrRingBuffer`, Tornado 30 roots, Semaphore duration): accept chunks built against any basis within a window, or the crowd's transactions fail each other under load.
10. **ZK verification is a post-v2 option, not a dependency**: ≈220–250k per proof beats recompute above ~20 entries, but requires keccak-MPT circuits EFS does not have; the one deployed coprocessor in this design space (Axiom) is gone, Brevis is a service, Lagrange is unverifiable today.

Failure modes to design against:

- **F1 Sentinel collision** (Compound 62): a 0 bit means both "not tagged" and "not yet folded". Every column needs `indexedThrough` plus the placer-maintained `alive` bitmap the tag design already calls for (tag-system:303-304); a bit is meaningful only below the cursor.
- **F2 Thin-basis aggregates** (Inverse): counts or sums over a partially folded column must report coverage, or be forbidden until `indexedThrough == count`.
- **F3 Mid-update reads** (read-only reentrancy): multi-transaction folds expose intermediate states by design; consumers must gate on the cursor, never on bits alone; chunks must be atomic.
- **F4 Consumer forgets the stamp** (Chainlink): make the basis a required argument, not a returned afterthought.
- **F5 Under-constrained claim checks** (Herodotus peaks): hints and chunks are validated against the *source* (kernel `getChildAt`, scope word, binding head), never against the derived structure alone — the v1 spec's "fabricated UIDs rejected" rule (specs/07:289) generalised to every family.
- **F6 Liveness and griefing**: keeper failure (Synthetix), stale hints → OOG (Liquity), troll sorts prompting wallets (specs/07:281), unbounded fallback walks. Bound everything; silent no-op on duplicates; UI folds only the active family.
- **F7 Non-idempotent ops** (`flipTick` XOR): replay-safe OR with ordinal check, or cursor-gated exactly-once.
- **F8 Volunteer indexes that never prune** (EAS, MUD modules): "not in index ≠ absent" and "in index ≠ current". Key families on binding position, re-derive from current bindings, and fold only under a cursor — matching the vault's write-time-maintenance verdict (indexing-and-state:180-187).
- **F9 Allocation-dominated backfill under Glamsterdam**: a Type author must not be able to declare a family that allocates per entry; retroactive folds must be word-packed (≈430 amortised per entry vs 110,020) or they are unaffordable — the exact reason D-D's "adding one later needs a paid pass" (tag-system:244) is tolerable only for bitmaps.
- **F10 Cursor granularity**: scope ordinals are per principal, so `indexedThrough` must be per `(scope, attester, family)` column; a global cursor would assert completeness for columns nobody folded — a new instance of "nobody writes into another principal's column" (tag-system:156-158).

**Could not be found:** any production contract that reaches provable completeness for a later-added index family without per-chunk verification or proofs; Brevis per-callback verification gas; Lagrange's 2026 operational status; a post-Berlin per-append gas figure for a deployed MMR; Synthetix `FeePool.sol` source at any GitHub path (SIP-11 and search summaries used instead); Herodotus documentation stating that accumulator growth is permissionless.

Sources (web, all accessed 2026-09-10): Sourcify deposit contract source (`sourcify.dev/server/v2/contract/1/0x00000000219ab540356cBB839Cbe05303d7705Fa`); OpenZeppelin `MerkleTree.sol`, `Votes.sol`; zk-kit `InternalLeanIMT.sol`; Tornado `MerkleTreeWithHistory.sol`, `TornadoTrees.sol`; Semaphore `Semaphore.sol`; https://eprint.iacr.org/2025/234; https://www.chainsecurity.com/blog/merkle-mountain-range-mmr-the-case-of-herodotus (2023-12-22); https://starkware.co/blog/proving-ethereums-state-on-starknet-with-herodotus/; HerodotusDev/solidity-mmr and wanseob/solidity-mmr READMEs; https://github.com/axiom-crypto/axiom-v1-contracts (docs 2023-07-28); https://blog.trailofbits.com/2025/05/30/a-deep-dive-into-axioms-halo2-circuits/; https://docs.relicprotocol.com/developers/litepaper/; https://blog.brevis.network/2025/01/08/… and …/2024/01/18/introducing-brevis-cochain…; https://docs.uma.xyz/developers/optimistic-oracle-v3.md; https://docs.optimism.io/stack/fault-proofs/explainer; https://www.theblock.co/post/340278 (BoLD, 2025-02-12); Compound `CToken.sol`, `Comptroller.sol`; https://compound.substack.com/p/compound-treasury-updates-comp-bug; BlockSec/Neptune Mutual analyses (via search); Aave `ReserveLogic.sol`; https://docs.lido.fi/contracts/accounting-oracle; Uniswap `Oracle.sol`, `MerkleDistributor.sol`, developers.uniswap.org price-oracles; MakerDAO `jug.sol`, `pot.sol`; https://sips.synthetix.io/sips/sip-11 (2019-07-10); EAS `Indexer.sol`; ENS `ENSRegistryWithFallback.sol`, https://docs.ens.domains/web/reverse; Liquity `SortedTroves.sol`, liquity/dev README; Gnosis `IterableOrderedOrderSet.sol`; Safe `Safe.sol`; Balancer `InputHelpers.sol`; https://docs.pyth.network/price-feeds/best-practices; https://docs.chain.link/data-feeds/api-reference; Inverse Finance/Inspex post-mortems (2022-04); Halborn/CertiK on Sentiment, dForce, Sturdy (2023); EIP-1108, EIP-2935, EIP-4788, EIP-7623; https://blog.ethereum.org/2025/04/23/pectra-mainnet.