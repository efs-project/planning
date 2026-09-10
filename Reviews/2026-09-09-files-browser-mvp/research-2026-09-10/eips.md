<!-- Research strand: EVM frontier brief: EIPs, repricing, L2s, index practice -->
<!-- Provenance: produced 2026-09-10 by a research agent under the integration-test-lead's
     workflow (harness claude-code, model Claude Fable 5). Figures carry the agent's own
     MEASURED / QUOTED / ESTIMATED labels; nothing here is a ruling. The engineering
     lead's reading, verification notes and corrections are in ../indexing-and-state-2026-09-10.md. -->

# EVM frontier brief for a cheap, contract‑readable on‑chain data layer (as of 2026‑09‑10)

Legend: **QUOTED** = number taken from a primary spec/doc; **MEASURED** = your numbers; **ESTIMATED** = my arithmetic from QUOTED schedules. Fork status: Pectra (L1, 2025‑05‑07), Fusaka (L1, 2025‑12‑03), Glamsterdam (EIP‑7773; testnets Sep–Oct 2026, mainnet tracked for ~2026‑11‑04 but not EF‑announced), Hegotá (EIP‑8081; tracked for ~2027‑05‑19).

## 1. Gas repricing that affects us

| EIP | Status / fork | Numbers (QUOTED) | Relevance |
|---|---|---|---|
| 2929 / 2930 / 3529 | Final (Berlin/London), live | cold SLOAD 2,100; warm 100; cold account 2,600; SSTORE 0→x 20,000 (+2,100 cold), x→y 2,900 warm; access list 2,400/addr, 1,900/key; clear refund 4,800; max refund = gas_used/5 | Today's baseline: a fresh cold slot = 22,100; a rewrite of an existing cold slot = 5,000 |
| 7623 calldata floor | Final, Pectra | tokens = zero + 4×nonzero; gas = max(4·tokens + exec, 10·tokens) → floor 10/40 per zero/nonzero byte | Only binds when execution gas is small vs calldata; storage‑heavy writes are unaffected; pure "post bytes" txs pay 40/byte |
| 7976 | Review; **Scheduled** in EIP‑7773 | floor token cost 10→16 → **64/64 gas per byte** (zero bytes too) | 1 KB of calldata‑only content: 40,960 → 65,536 floor |
| 7825 tx gas cap | Final, Fusaka | **16,777,216 (2^24)** per tx | L1 and OP Stack (Karst, 2026‑07‑08). Arbitrum ArbOS 51 set it to **32M** (= its block limit) |
| 7702 | Final, Pectra | 12,500 per auth tuple + 25,000 if account empty (refunded if it exists); designator `0xef0100‖addr` | Basis for no‑relayer batching/sponsorship keeping attester = user's wallet |
| 7939 CLZ | Final, Fusaka (also OP Karst, ArbOS 51) | 5 gas, 1 byte; prior Solidity impls ~184 gas; Solidity 0.8.31 (2025‑12‑03) exposes Yul `clz`, default EVM = osaka | Bitmap scanning becomes first‑class |
| 7951 P256 | Final, Fusaka | 6,900 gas at 0x100, 160‑byte input | Passkey signers |
| 7935 | Informational, Fusaka | block gas limit 45M→60M | — |
| 7904 | Informational (Glamsterdam) | "no changes": KECCAK stays 30 + 6/word (measured could be 12 + 3) | No keccak relief coming |
| **8038** state access | Review; **Scheduled** (7773) | COLD_ACCOUNT 2,600→**3,000**; COLD_STORAGE **2,100 (unchanged)**; WARM 100; STORAGE_WRITE →**10,000**; ACCOUNT_WRITE →9,000; CREATE_ACCESS 32,000→12,000 (+state gas); CLEAR_REFUND 4,800→11,616; EXTCODESIZE/COPY cold 3,100 / warm 200; access list 2,900/2,000; refund cap 20% | Rewrite of an existing cold slot: 5,000→**12,100**; warm rewrite 2,900→10,100 |
| **8037** state creation | Review; **Scheduled** (7773) | CPSB **1,530 gas/state‑byte**; new slot = 64 B → **97,920 state gas**; new account = 120 B → **183,600**; code deposit **1,530/byte** (was 200); 7702 delegation 23 B → 35,190. Spec tables: new account 25,000→183,600 (~7×), new slot 20,000→97,920, 24 kB deploy 4.95M→37.8M (~8×) | Fresh cold slot total = 2,100 + 10,000 + 97,920 = **110,020** (ESTIMATED sum of QUOTED parts, ~5×). Clearing a slot created in the same tx *refills* state gas |
| 8037 gas split | same | `gas_left = min(2^24 − intrinsic, tx.gas − intrinsic)`; remainder = `state_gas_reservoir`; block validity uses max(exec, state) vs block limit | The 2^24 cap applies to *execution* gas; state gas rides above it but is bounded by the block limit |
| 2780 intrinsic | Review; Scheduled | 21,000 = 12,000 base + 3,000 cold account + 6,000 value; transfers to *new* accounts add 183,600 state gas | — |
| 7981 | Scheduled | +64 gas per access‑list byte | Pre‑warming via 2930 lists gets pricier |
| 7778 | Review; Scheduled | refunds no longer reduce block gas accounting (users still get them) | Don't build economics on clearing refunds; EIP‑3298 (remove refunds) is PFI for Hegotá |
| 7954 | Review; Scheduled | max code 24 KiB→**64 KiB**, initcode 48→128 KiB; no per‑word load metering (7907 was dropped) | Bigger SSTORE2 chunks (but see §3) |
| 8032 size‑based SSTORE | Draft; **declined** for Glamsterdam, publicly backed by Base (2025‑11‑18) | surcharge ∝ ceil_log16(contract slot count) above ~8 GB threshold (params TBD) | Direct threat to a singleton mega‑registry |
| 8075 adaptive state cost | Draft | 4844‑style: target 36,400 state bytes/block, max 72,800, MIN 380 gas/byte, +0.1%/block max | Alternative to 8037's fixed 1,530 |

EF replay of mainnet history under 8037/8038 (2026‑08‑24): "large majority unaffected"; at‑risk patterns are 2,300 stipends, hardcoded CALL gas, `gasleft()` branches, presigned fixed‑gas txs; tool at ethereum.github.io/repricing-impact/. The EIP‑8037 thread's open objection (Jan 2026) is deploy feasibility (Uniswap V3 deploy ≈19M gas vs the cap) and linear pricing vs falling hardware cost.

**Impact on your measurements (ESTIMATED, L1 schedule):** tag write 2,838,264 gas / 94 slots (MEASURED) → if all 94 are fresh: 94×110,020 ≈ 10.34M + ~0.76M non‑storage ≈ **~11.1M gas (~3.9×)**, i.e. 9.2M of state gas ≈ 15% of a 60M block. EAS ~230k → ~0.9–1.0M; MUD 32k single slot → ~112k; Farcaster ~180k/4 slots → ~0.5M. Reads do **not** get more expensive (cold SLOAD stays 2,100; cross‑contract cold account +400).

## 2. Cross‑contract reads

- **EIP‑2330 EXTSLOAD: Stagnant** (2019). Nothing EXTSLOAD‑like is in EIP‑7773 or EIP‑8081; I found no 2025–26 successor. Not coming.
- **What exists (costs ESTIMATED from the QUOTED schedule):**
  - STATICCALL to a view: cold account 2,600 (→3,000) + ~100 call + inner cold SLOAD 2,100 + ABI ≈ 5–6k for the first slot; subsequent slots in the same call ≈ 2,100 + ~50. Uniswap v4's production pattern (`Extsload.sol`/`Exttload.sol` + `StateLibrary`): expose raw `extsload(bytes32)`, `extsload(bytes32 start, uint256 n)`, `extsload(bytes32[])` so any contract reads your slots without a per‑field ABI surface and amortizes the account‑warm cost over many slots. This is the closest thing to EXTSLOAD available today.
  - EXTCODECOPY of an SSTORE2 data contract: 2,600 (→3,100) + 3/word + memory → ~2.7k for 1 KB vs 32 cold SLOADs = 67,200. **Cheapest cross‑contract read primitive on the EVM**, and it needs no CALL.
  - EIP‑1153 TLOAD/TSTORE: Final (Cancun), 100/100; same‑tx only (locks, callback "tills", intra‑tx caches).
  - EIP‑2935: Final (Pectra). System contract `0x0000F90827F1C53a10cb7A02335B175320002935`, window 8,191 blocks (~1 day), input = 32‑byte big‑endian block number, first call pays cold account+slot warming. Enables in‑EVM verification of another contract's storage at a recent block via MPT proof (expensive, ~1 day window). EIP‑7709 (BLOCKHASH from storage) is Hegotá PFI.
  - EIP‑7928 BALs (Scheduled, Glamsterdam) + EIP‑8159 (eth/71 exchange): every block carries all touched accounts/slots with post‑values. Not an on‑chain read, but a web client can follow your contract's state diffs per block from the block itself — no logs, no indexer (applicability ESTIMATED; spec QUOTED).
  - EIP‑8304 (Draft, Jun 2026; Hegotá PFI): trustless log/tx index with a system contract `get()` readable in‑EVM; EIP‑7668 (remove bloom filters) is Stagnant.
  - EIP‑8298 SETCODEFROM (Draft): shares code hash (12,200 cold), not data.

## 3. Storage cost reduction primitives

- **SSTORE2 (Solady, lineage Solmate/0xSequence/SSTORE3; z0r0z SSTORE4 for short data).** Today: CREATE 32,000 + 200/byte deposit; read via EXTCODECOPY. 1 KB write ≈ 237k vs 32 fresh cold slots ≈ 707k (ESTIMATED). Under 8037/8038: 12,000 + 183,600 (new account) + 1,530/byte → 1 KB ≈ **1.76M** vs 32×110,020 = 3.52M; per‑byte 1,530 vs ~3,440 per slot‑byte; break‑even stays ~100 bytes (ESTIMATED). Ceiling: state gas for a 64 KiB chunk ≈ 100M > a 60M block, so ~39 KB max per tx at 60M, full 64 KiB only at ≥~100M blocks (ESTIMATED). Fixed 195,600 per pointer favors fewer, larger chunks.
- **EOF (EIP‑7692): Stagnant**, removed from Fusaka; Vitalik's March 2026 plan targets RISC‑V (Offchain Labs argues WASM). Consequence: EXTCODECOPY‑based code‑as‑data stays valid indefinitely; no EOF data sections coming.
- **EIP‑8125 temporary contract storage (Draft):** TMPLOAD/TMPSTORE, lives ~2 periods, cost "between transient and persistent" (TBD); motivated by ">60% of slots written once and never read again on‑chain".
- **EIP‑7702:** live; under 8037 a delegation costs 35,190 state gas.
- No "cheap persistent storage" ethresear.ch proposal beyond 8125/8075/8032 surfaced; state‑rent threads are 2018–19 vintage (EIP‑2026, stagnant).

## 4. State growth / expiry / statelessness (10‑year horizon)

- **EIP‑4444:** partial (pre‑merge) expiry live since ~May 2025; EIP‑7642 (Fusaka) makes client support mandatory; 300–500 GB saved. EIP‑7927 meta is Stagnant; no rolling window specified. Old logs/receipts are not guaranteed servable by default nodes.
- **Trees:** EIP‑6800 Verkle Stagnant; EIP‑7736 leaf expiry Stagnant; **EIP‑7864 binary tree Draft** (hash undecided: BLAKE3 placeholder, Poseidon2 under assessment; 256‑slot stems; first 4 slots in the account header); EIP‑7748 migration Draft (TBD); EIP‑4762 gas Draft (branch 1,900, chunk 200, subtree edit 3,000, chunk edit 500, fill 6,200; **adjacent slots in a stem 200 vs 2,100**). None appear in EIP‑7773 or EIP‑8081. Not scheduled for any named fork.
- **Direction signals:** EF Stateless Consensus team (2025‑12‑18): 80% of state untouched >1 year; options = state expiry (mark‑expire‑revive / multi‑era), state archive (hot/cold), partial statelessness. EIP‑8188 (Draft, Hegotá PFI): `last_written_block` per account/slot (+5/+6 bytes; would lift 8037 to 125/70 bytes); **reads deliberately don't refresh it**, so read‑only data looks cold. EIP‑8372 (Hegotá PFI) normalizes the state‑gas limit. EIP‑8037's own target: 120 GiB/yr at 150M gas.
- **Data:** "EVM Workloads in the Wild" (arXiv, Jun 2026): 2025 persistent state growth Base 435 GB vs Ethereum 30 GB; Base gas 29.2% storage reads; Ethereum 34.9% storage writes; cold reads 49.7% (Base) vs 39.6% (L1).

## 5. L2 specifics

- **OP Stack:** EVM‑equivalent gas. Jovian (mainnet 2025‑12‑02) explicitly did *not* activate Osaka; **Karst** (Sepolia 2026‑06‑17, mainnet 2026‑07‑08 for op, ink, zora, mode, lisk, metal, unichain, soneium…) activates 7825 (2^24), 7939, 7951 (6,900), 7883/7823. Base was not in that list. Expect Glamsterdam repricing on OP chains ~6–8 months after L1 (ESTIMATED from the 7‑month Fusaka→Karst lag). Base publicly favors EIP‑8032 and says account‑creation costs "can be tweaked at the L2 level".
- **Arbitrum:** ArbOS 51 "Dia" (2026‑01‑08): 7951, 7939, 7823/7883, 2537, 7825 at **32M**; STF now instruments compute / storage access / **storage growth** / history growth as separate resources with "none of the constraints enabled" — multidimensional pricing is staged. **Stylus:** SLOAD/SSTORE "cost as they do in the EVM"; 1 gas = 10,000 ink; compute 10–100× cheaper, memory 100–500× cheaper (64 KB pages); keccak host‑IO 12.18 + 2.1w gas; cached call init 352 vs 8,832 uncached; activation 1,659,168 gas. Index *logic* gets cheap; state writes don't.
- **zkSync:** state‑diff pubdata: initial write key 32 B, **repeated write key ≤8 B**, only the final value per batch is published (intra‑batch rewrites free on DA); keccak256 is a precompile priced for proving; EVM interpreter live at **5:1 ergs:gas**; try/catch on unknown contracts discouraged.
- **Scroll:** docs list only COINBASE/PREVRANDAO=0/SELFDESTRUCT‑reverts, London base + Shanghai/Cancun features, no BLOBHASH/4788; Feynman added a fee compression penalty. Precompile/gas table not verified (rollup.codes fetch failed).
- **MegaETH:** OP‑Stack‑derived, mainnet 2026‑02‑09, custom state tree; **no public storage pricing found.** No L2 with native on‑chain indexing found. web3:// (ERC‑4804 Final, ERC‑6860) is an access protocol, not an index.

## 6. Frontier practices for on‑chain indexes (with auditor context)

- **Mutate, don't allocate.** Existing‑slot rewrite vs fresh slot: 5,000 vs 22,100 today (4.4×) → 12,100 vs 110,020 under Glamsterdam (9.1×). Pack fields; keep counters/heads/bitmaps in slots that already exist.
- **Bitmaps:** 256 members/slot; Uniswap v3 `TickBitmap` (production since 2021; word‑scan with MSB/LSB) is the canonical audited example; OZ `BitMaps`, Solady `LibBitmap` (≈500 gas saved per ERC721Psi burn). CLZ at 5 gas makes `findLastSet`/next‑set scans trivial.
- **Sparse set:** OZ `EnumerableSet` (values array + index map, swap‑and‑pop; docstring warns `values()` "may render the function uncallable if the set grows" too large to copy in a block); Solady `EnumerableSetLib`. Cost ≈ 2 fresh slots + length per add.
- **Sorted list:** Liquity `SortedTroves` — doubly linked list, off‑chain hints, O(1) with correct hints, O(n) fallback, `getApproxHint` O(√n); audited by Trail of Bits (Jan & Mar 2021) and Coinspect (Mar 2021); known edge case where end‑of‑list hints go stale and re‑insertion runs out of gas. No audited production skip list or RB‑tree found in this pass.
- **Inverted index / postings:** EAS `Indexer.sol` is a *separate* contract with 5 mappings (recipient→schema→uids, attester→schema→uids, schema→attester→recipient→uids, schema→uids, indexed flag); ~8 SSTOREs per index (4 pushes + lengths + flag); cursor pagination `start/length/reverseOrder`. Gas not published (ESTIMATED ~150k today, ~700k+ under Glamsterdam L1).
- **Generic auto‑indexes fail in production:** MUD's `KeysInTable`/`KeysWithValue` caused unbounded gas growth in Sky Strife; Lattice replaced them with hand‑maintained purpose‑specific indexes.
- **Append‑only registries:** Parent‑Hash DAG paper (arXiv, Jun 2026): **76,276 gas/append**, depth‑invariant (σ≈6 gas), beats incremental Merkle trees, reconstructable from logs in linear time.
- **Auditor stance:** Trail of Bits' secure‑contracts DoS page could not be fetched (404), but its Slither detectors (`calls-loop`, `costly-loop`) and the OZ docstring above encode the rule: never iterate user‑growable arrays in state‑changing paths; bound iteration; pull over push; cursor pagination in views.
- **Parallelism (BALs):** disjoint write sets execute in parallel; a global `nextId`/head slot serializes every writer. Content‑addressed ids already avoid this; keep per‑namespace heads.

## 7. Ranked: what most changes what you build

1. **EIP‑8037/8038 (Glamsterdam, ~Nov 2026 L1; L2s ~2027):** fresh slot 22,100→110,020; new account 25k→183.6k; code 200→1,530/byte; reads unchanged. Your tag write ≈ 2.84M→~11M on L1 pricing. Minimize *fresh slots per write*; 94 is not survivable.
2. **EIP‑7825 (live L1, OP Stack, Arbitrum=32M):** 16,777,216 exec gas per tx. Batching must be chunked; under 8037 pricing one tag write already uses ~2/3 of it.
3. **EIP‑8032 (Draft, Base‑backed) + EIP‑8075:** size‑based/adaptive state pricing punishes singleton mega‑registries. Shard state across contracts (per‑namespace data contracts, SSTORE2 bodies) rather than one 100M‑slot store.
4. **No EXTSLOAD, ever (2330 Stagnant, no successor):** contract‑readability must be designed in: `extsload`‑style raw slot getters with range/batch reads (Uniswap v4 pattern) for mutable bindings; **SSTORE2/EXTCODECOPY (≈2.7k per KB)** for immutable record bodies.
5. **Rewrite‑vs‑allocate gap widens to 9×:** bitmap/packed indexes in pre‑existing slots are the only index shape that stays cheap; CLZ (5 gas, Solidity `clz`) makes them scannable.
6. **EIP‑7928 BALs (Glamsterdam):** blocks ship full state diffs with post‑values → the web client can sync your contract's state from blocks without logs or The Graph; also avoid hot shared slots for parallel execution.
7. **EIP‑7954 (64 KiB code) + EOF Stagnant:** code‑as‑data is safe long‑term and chunks can grow; but 8037 caps practical deposits at ~39 KB/tx at a 60M block.
8. **History expiry (4444/7642 live) + 7668/8304 direction:** logs are not durable storage; state must be the authoritative index; logs only for hot‑window sync.
9. **State‑expiry trajectory (8188 last‑written metadata; EF Dec 2025 options):** nothing scheduled, but 10‑year records should be revivable by proof (content addressing fits) and should not depend on reads keeping data "warm".
10. **EIP‑7702 (live) → EIP‑8141 Frames (Hegotá SFI, ~May 2027, 2‑D gas, P256 6,700):** per‑user attester without a relayer is protocol‑native; build on ERC‑5792 `wallet_sendCalls`.

Sources (dates): eips.ethereum.org EIP‑7623/7976/7825/7702/2929/3529/1153/2935/2330/7692 (Stagnant 2024‑04)/7864 (2025‑01)/4762/7748/6800/7736/7927/8037 (2025‑10)/8038/2780/7778/7954/7981/8032/8075/8125/8188/8198/8298/8304 (2026‑06)/8372/7997/7939/7951/7904/8007/7773/8081/8141; ethereum.org roadmap fusaka/glamsterdam and "Building on Ethereum in 2026"; blog.ethereum.org 2025‑10‑21 (7825), 2025‑11‑06 (Fusaka), 2025‑07‑08 (partial history expiry), 2026‑08‑24 (repricing replay); ethereum‑magicians EIP‑8037 thread (through 2026‑01‑08); eipsinsight upgrade schedule (Glamsterdam Sep 21/Oct 5/Nov 4 2026; Hegotá May 19 2027); The Block 2026‑03‑01 (RISC‑V/7864 plan) and 2025‑12‑18 (EF state‑bloat research); arXiv 2606.09593 (PHDAG) and 2606.19869 (EVM workloads); docs.optimism.io Upgrade 17/19 and gov.optimism.io Upgrade 17; docs.arbitrum.io ArbOS 51, Stylus gas metering/pricing; docs.zksync.io pubdata and EVM interpreter; docs.scroll.io differences; blog.base.dev 2025‑11‑18; Solidity 0.8.31 release (2025‑12‑03); Vectorized/solady, OpenZeppelin EnumerableSet, Uniswap v4‑core StateLibrary/Extsload, liquity/dev and docs.liquity.org audits, EAS Indexer.sol, Lattice Sky Strife retrospective.