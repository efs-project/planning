# Recovered Claude memo — State rent and storage cost research

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T04:27:51.197Z
**Claude task:** `a57510bbb58842079`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3416
**Original result length:** 23355 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
All research complete. Here are the findings.

---

# Recurring cost to keep contract state alive: findings
All URLs checked **2026-08-12**.

## Bottom line

**No EVM chain — L1 or any major L2 — charges a recurring fee to keep contract state alive today, and none has such a fee scheduled for any named upgrade.** `documented`

The nearest thing to a threat is **state expiry**, which after ~7 years of research is *further* from shipping than it was in 2024: its only concrete spec (EIP-7736) is Stagnant, and the tree it depended on (Verkle) has been de facto abandoned. `documented`

The real cost change you should plan for is the opposite shape: a **one-time ~5–7.6× increase in the gas cost of *creating* new state**, scheduled for Glamsterdam. It never touches state you already own. `documented`

---

## 1. Ethereum L1 state growth management

### 1a. Fork timeline — what shipped, what's next

| Fork | Status | Date | Source |
|---|---|---|---|
| Pectra | shipped | 2025-05-07 | ethereum.org/roadmap `documented` |
| Fusaka | **shipped** | 2025-12-03 21:49:11 UTC, epoch 411392 | EIP-7607 status **Final** `documented` |
| Glamsterdam | **in development, not shipped** | targeted Q4 2026 | EIP-7773 **Draft**; activation table empty `documented` |
| Hegotá | proposal stage | 2027 | EIP-8081 **Draft** `documented` |

- https://eips.ethereum.org/EIPS/eip-7607 (Fusaka meta, **Final**)
- https://eips.ethereum.org/EIPS/eip-7773 (Glamsterdam meta, **Draft**) — "Rows in the table above will be filled as activation times are decided by client teams" → **no mainnet activation time set as of today** `observed`
- https://eips.ethereum.org/EIPS/eip-8081 (Hegotá meta, **Draft**) — 1 EIP Scheduled, 1 Considered, 33 Proposed `observed`
- https://ethereum.org/roadmap/ — page footer **last updated 2026-08-11** (yesterday) `observed`

**"Amsterdam" is not a separate fork.** Glamsterdam = *Gloas* (consensus layer) + *Amsterdam* (execution layer). The fork *after* Glamsterdam is **Hegotá** (= *Heze* CL + *Bogotá* EL). `documented` (EIP-8081; ethereum.org/roadmap)

**Fusaka contained no state expiry and no history expiry EIP.** `observed` (EIP-7607 contents)

**Neither Glamsterdam nor Hegotá contains any state expiry, state rent, storage rent, or state deletion EIP.** I checked both meta EIPs explicitly for 7736 / 7864 / 7748 / 4444 / rent / expiry — zero hits in either. `observed`

### 1b. EIP-7736 (leaf-level state expiry) — **DEAD**

- https://eips.ethereum.org/EIPS/eip-7736
- Status: **🚧 Stagnant** `observed`. Created 2024-07-05. Requires EIP-6800 (Verkle) — which is itself Stagnant. `observed`
- `FORK_TIME` constant is literally **"TBD"**. `observed`
- Not in any fork meta EIP. `observed`
- Discussion thread https://ethereum-magicians.org/t/eip-7736-leaf-level-state-expiry-in-verkle-trees/20474 — **last post 2024-07-13**, i.e. dead for ~2 years. No revival, no fork targeting. `observed`

Mechanism, for the record: expiry after inactivity across two consecutive 6-month epochs, with a paid **resurrection transaction** to reactivate. Data is not destroyed. `documented`

### 1c. Verkle — abandoned; binary trees replaced it

The entire Verkle EIP cluster has gone **Stagnant**: `observed`

| EIP | Title | Status |
|---|---|---|
| 6800 | Ethereum state using a unified verkle tree | **Stagnant** |
| 7612 | Verkle state transition via an overlay tree | **Stagnant** |
| 7545 | Verkle proof verification precompile | **Stagnant** |
| 6190 | Verkle-compatible SELFDESTRUCT | **Stagnant** |
| 7736 | Leaf-level state expiry in verkle trees | **Stagnant** |
| 7748 | State conversion to Verkle Tree | Draft (orphaned) |

Replacements, both hash-based (post-quantum motivated):
- **EIP-7864** "Ethereum state using a unified binary tree" — Draft, created 2025-01-20. https://eips.ethereum.org/EIPS/eip-7864 `observed`
- **EIP-8297 "Partitioned Binary Tree"** — Draft, **created 2026-06-11**, authored by Vitalik Buterin, Ballet, Feist, Hagopian, Merriam, et al. https://eips.ethereum.org/EIPS/eip-8297 `observed`. This is the live one — magicians thread https://ethereum-magicians.org/t/eip-8297-partitioned-binary-tree/28776 has posts as recent as **2026-07-31**. `observed`
  - Stated motivation: MPT "is unfriendly to validity proofs"; "SNARK friendliness and post-quantum security". Hash function **not final** (BLAKE3 in the reference impl; Poseidon2 "still not considered safe for use in L1"). `observed`
  - **No fork target named.** `observed`

⚠️ **Documentation conflict, flagging honestly:** https://ethereum.org/roadmap/verkle-trees/ still says Verkle is the plan and claims "Verkle tree testnets are already up and running", page last updated **2026-06-24**. But https://ethereum.org/roadmap/ (updated **2026-08-11**) **does not list Verkle at all**. Given every Verkle EIP is Stagnant and Vitalik co-authored a *new* binary-tree EIP in June 2026, I read the verkle-trees page as **stale/orphaned**, not as current policy. `inferred` — I could not find a formal ACD "Verkle is cancelled" statement. `unknown`

### 1d. EIP-4762 (statelessness gas cost changes) — orphaned

- https://eips.ethereum.org/EIPS/eip-4762 — Status **Draft**, created 2022-02-03. `observed`
- Self-describes as targeting "the fork coming right before the verkle tree fork" — a fork that no longer exists. `observed`
- Not in any fork meta EIP. `observed`
- Note: even this EIP's charges are **per-access, at execution time** (branch access 1,900; chunk access 200; chunk init 6,200) — a repricing, **not a rent**. `documented`

### 1e. Block-level access lists — shipping, and irrelevant to rent

**EIP-7928 (Block-Level Access Lists)** — Status **Review**, Scheduled for Inclusion in Glamsterdam, one of two headliners alongside EIP-7732 (ePBS). `observed` It pre-declares state access to enable parallel execution. **It imposes no storage cost and no recurring charge.** `documented`

### 1f. Statelessness / state expiry official status

https://ethereum.org/roadmap/statelessness/ — **page last updated 2026-06-30** `observed`

Two direct quotes:
> "State expiry is still in the research phase and not yet ready to ship."

> "With state expiry it is important to note that inactive state is not deleted, it is just stored separately from the active state. The inactive state can be resurrected into the active state."

`observed` — This is the single most load-bearing quote for your question. Even in the *hypothetical* future where state expiry ships, the design intent is **archival + resurrection, never destruction**.

The main https://ethereum.org/roadmap/ page (2026-08-11) lists **statelessness** as a technical upgrade but has **no state-expiry roadmap item at all**. `observed`

### 1g. Every state-rent EIP ever proposed, and its fate

I pulled the **complete EIP index** (https://eips.ethereum.org/all, 1,201 rows) and grepped for rent/expiry/state-growth. Exhaustive result: `observed`

| EIP | Title | Status |
|---|---|---|
| **1682** | Storage Rent | **🛑 Withdrawn** |
| **1418** | Blockchain Storage Rent Payment | **Stagnant** (created 2018) |
| **2026** | State Rent H – Fixed Prepayment for accounts | **Stagnant** (created 2019) |
| **2027** | State Rent C – Net contract size accounting | Stagnant |
| **2029** | State Rent A – State counters contract | Stagnant |
| **2031** | State Rent B – Net transaction counter | Stagnant |
| **2035** | Stateless Clients – Repricing SLOAD/SSTORE | Stagnant |
| **7736** | Leaf-level state expiry | Stagnant |

**EIP-1418 is the only true recurring-rent proposal ever written** — it would "deduct an amount of value ('rent') from every account based on the quantity of storage used by that account" *at each block*. It is **Stagnant since 2018** and was never implemented. `observed`

**There is no state-rent or state-expiry EIP created after EIP-7736 (July 2024).** The newest work in this space (EIP-8297, June 2026) explicitly *defers* the question: `observed`
> "The mechanism itself is left to a separate EIP."

That separate EIP **does not exist**. `observed`

### 1h. ⚠️ The one cost change that IS scheduled: EIP-8037

**This is the finding that actually matters for an onchain filesystem.** `observed`

- https://eips.ethereum.org/EIPS/eip-8037 — **"State Creation Gas Cost Increase"**, Status **Review**, **Scheduled for Inclusion in Glamsterdam**. Created 2025-10-01.
- Verified parameters directly from the spec: `CPSB = 1530`, `STATE_BYTES_PER_STORAGE_SET = 64`, `STATE_BYTES_PER_NEW_ACCOUNT = 120`.

| Operation | Today | Under EIP-8037 | Multiple |
|---|---|---|---|
| New storage slot (`SSTORE`) | 20,000 | 64 × 1530 = **97,920** | **4.9×** |
| New account (`GAS_NEW_ACCOUNT`) | 25,000 | 120 × 1530 = **183,600** | **7.3×** |
| Code deposit (`GAS_CODE_DEPOSIT`) | 200/byte | **1,530/byte** | **7.65×** |
| `GAS_CREATE` | 32,000 | 120 × 1530 = 183,600 | 5.7× |

Critical properties for your use case:
- **One-time, at write. Not recurring.** `documented`
- **Existing contracts are charged nothing.** It only prices *new* state creation. `documented`
- Charged to a **separate "state gas" dimension** (multidimensional metering), not the normal execution gas limit — which is what lets larger deployments proceed. `observed`
- **Freeing state refills it**: clearing a slot that was zero at transaction start gets `STATE_BYTES_PER_STORAGE_SET × CPSB` **refilled**. `observed`
- Motivation quote: Geth state DB is **~390 GiB as of January 2026**, growing ~116 GiB/yr at the 60M gas limit, projected ~387 GiB/yr at a 200M limit, breaching the 650 GiB degradation threshold "in less than a year". Target: hold growth to **120 GiB/yr at a 150M reference gas limit**. `observed`

**Read this as the answer to "will they ever charge rent?"** — the core devs' chosen lever for state growth is **raising the up-front price of creating state**, explicitly instead of charging for holding it. That is a strong directional signal. `inferred`

---

## 2. L2 recurring storage rent

**None of the six chains charges recurring storage rent, and none has published a plan to.** `documented`

| Chain | Finding | Source (checked 2026-08-12) |
|---|---|---|
| **Arbitrum One** | Two-part fee model (parent-chain data + child-chain gas). No rent, no expiry, no pruning of existing state anywhere in the fee docs. | https://docs.arbitrum.io/how-arbitrum-works/deep-dives/gas-and-fees `observed` |
| **Arbitrum (watch item)** | **ArbOS 51 "Dia"** (released 2026-01-08) instruments the STF to track **computation, storage access, storage growth, history growth** as separate resource dimensions. But: "none of the constraints are enabled, so there won't be any impact on current gas prices". Measurement only. | https://docs.arbitrum.io/run-arbitrum-node/arbos-releases/arbos51 ; https://blog.arbitrum.io/dynamic-pricing-update-2026/ (2026-02-05) `observed` |
| **Base** | Docs contain no mention of storage rent, state rent, state expiry, or recurring storage fees. | https://docs.base.org/chain/differences-between-ethereum-and-base `observed` |
| **OP Mainnet** | Differences page covers bridging, opcodes, tx fees, finality. **No** storage-rent / state-expiry / state-pruning content. | https://docs.optimism.io/stack/differences `observed` |
| **Linea** | Differences are opcode- and precompile-level (`BLOBBASEFEE`, `BLOBHASH`, `BLAKE2f`, `MODEXP` 512-byte cap, 60,000-byte calldata cap). **No** storage rent/expiry. "Storage functionality appears identical to Ethereum Mainnet." | https://docs.linea.build/network/overview/ethereum-differences `observed` |
| **Scroll** | Differences are opcode/precompile/fee-market level (`SELFDESTRUCT` disabled, no ETH burn, no 4844 opcodes). **No** storage rent/expiry. | https://docs.scroll.io/en/technology/chain/differences/ `observed` |
| **zkSync Era** | State-diff rollup: "the pubdata is published not for transactions, but for storage changes". Charged **only at write time**. **"There is NO recurring charge for keeping storage alive."** No rent/expiry/prune/state-growth in the fee docs. | https://docs.zksync.io/zksync-protocol/era-vm/transactions/fee-model/fee-structure `observed` |

**Arbitrum's `storage growth` dimension is the only item on the horizon worth monitoring.** Even so, "storage growth" is by construction a *write-time* metric (bytes added by a transaction), structurally identical to EIP-8037, not a per-block holding charge. Arbitrum has published **no** rent design. `inferred` — whether the eventual dynamic pricing bills storage growth once or ongoing is **not stated in the docs**. `unknown`

---

## 3. Historical precedent: has any EVM chain deleted or expired contract state?

**No EVM chain has ever expired or deleted live contract state as a protocol rule.** `documented` What has happened is history deletion, which is a different thing.

### Ethereum L1
- **Never deleted state.** Partial history expiry (2025) explicitly preserved it — see §4. `documented`
- The only state-touching precedent is **EIP-161** (empty-account clearing, 2016) and **EIP-6780** (SELFDESTRUCT restriction) — neither expires *used* state. `inferred`

### OP Mainnet — 2 regenesis events, both preserved state
- **2021-04-09 regenesis** (pre-public-mainnet, alpha): network redeployed at a block as a new genesis. **Transaction history wiped; contract state preserved.** Quoted: "funds are safu and balances, contracts and storage will not be impacted". ~12h downtime; historical withdrawals no longer viewable in the explorer. History was dropped because preserving it "would have required another two months of engineering work."
  https://blog.synthetix.io/optimism-mainnet-upgrade-scheduled-downtime-and-regenesis/ `documented`
- **2023-06-06 Bedrock migration** at block 105235063 (L2 ts 1686068903): **state preserved**, DB converted rather than reset; the migration emits a verifiable state root — "any discrepancy or alteration in the information during migration would lead to the production of an incorrect state root". Unlike the earlier events, **"historic chain data will still be accessible after the Bedrock upgrade, and a 'regenesis' will not be required."**
  https://www.optimism.io/blog/here-s-how-you-can-reproduce-op-mainnet-s-migration-to-bedrock `documented`

**Pattern across all precedent: history gets dropped; state gets carried forward.** `inferred`

### Non-EVM precedent (Solana rent, NEAR storage staking)
Not verified in this session — WebSearch budget was exhausted before I reached it. `unknown` (see could-not-verify list)

---

## 4. EIP-4444 history expiry — status, and the L2 reconstruction question

### Status: the EIP is Stagnant but the practice has partially SHIPPED

- https://eips.ethereum.org/EIPS/eip-4444 — "Bound Historical Data in Execution Clients", **Networking**, Status **🚧 Stagnant**, created 2021-11-02. `observed`
- Despite that status, **partial history expiry went live 2025-07-08**: "As of today, all Ethereum execution clients support partial history expiry in accordance with EIP-4444." Geth v1.16.0, Nethermind 1.32.2 (default on), Besu 25.7.0, Erigon v3.0.12, Reth v1.5.0. Saves 300–500 GB. https://blog.ethereum.org/2025/07/08/partial-history-exp `observed`
- Scope shipped: **pre-Merge block bodies and receipts only** (before block 15537394). `observed`
- Supporting EIPs: **EIP-7642 (eth/69) — Final** ✅ shipped in Fusaka; EIP-7639 (eth/70) Stagnant; EIP-7643 (history accumulator) Stagnant; **EIP-7927 (History Expiry Meta) Stagnant**. `observed`
- **Rolling/full history expiry is NOT scheduled for any fork.** "work on full, rolling history expiry is ongoing". Not in Fusaka, Glamsterdam, or Hegotá meta EIPs. `observed`
- ethereum.org/roadmap/statelessness/ (2026-06-30): "EIP-4444 is not yet ready to ship, but it is under active discussion. The challenges with EIP-4444 are not so much technical, but mostly community management." `observed`

### It deletes HISTORY, not STATE — confirmed verbatim

Direct quotes from the EF announcement: `observed`
> "Accounts that have been dormant since genesis are also not affected, **because the state for every account continues to be maintained**."

> "Accessing a current balance, executing a trade, borrowing assets, etc. will not be interrupted by history expiry."

What is dropped: **block bodies and receipts**. What is kept: **all headers** ("The execution layer will continue to provide all headers which allows cryptographic verification of the chain from genesis") **and the complete current state**. `observed`

What you *lose*: **past** state. "only the current state is maintained. Therefore a user's balance at a specific point in the past is not easily determinable from the history alone. Such queries require an archive node with specialized indexes." `observed`

**→ For a contract-storage-based filesystem: your data is state. History expiry does not touch it.** `inferred`

### The L2 reconstruction caveat — this is the real risk, and it's already live

The EF announcement names L2s explicitly as an affected class: `observed`
> "For L2s that have posted transactions using calldata, they would need the chain history to fully validate their chain or construct indexes."

Availability model post-expiry is an explicit **1-of-N trust assumption**: "if at least one entity provides the historical blocks, nodes will be able to retrieve the history via out-of-protocol means." Three channels: institutional providers, torrents, p2p. Mirror list: https://eth-clients.github.io/history-endpoints/ `observed`

**More importantly — blob data already expires, and always has.** From EIP-4844 (https://eips.ethereum.org/EIPS/eip-4844): `observed`
- `MIN_EPOCHS_FOR_BLOB_SIDECARS_REQUESTS = 4096` epochs — the EIP itself says this is **"around 18 days"**.
- The spec describes blob data as "fully downloaded by all consensus nodes (**but can be deleted after only a relatively short delay**)".

So: **every rollup that posts to blobs (which is all of the major ones post-Dencun) already relies on out-of-protocol archives for reconstruction beyond ~18 days.** This is not a future risk from EIP-4444 — it is the current, shipped, deliberate design. `documented`

**Answer to your framed question — "if L1 history is pruned, can an L2's state still be reconstructed from L1?":**
- **Not from L1 alone, and this is already true today** (18-day blob window). `documented`
- L2 *state* itself lives on L2 nodes and is not affected by L1 history pruning. `inferred`
- Reconstruction-from-scratch requires archived L1 data from a 1-of-N provider. `documented`
- **Durability implication: for a filesystem that must outlive its founders, L1 contract storage is strictly stronger than any L2's.** L1 state is maintained by every full node forever with no expiry mechanism scheduled; an L2's reconstructability from first principles already depends on out-of-protocol archival. `inferred`

---

## Could not verify

1. **A formal ACD/AllCoreDevs decision record cancelling Verkle.** I found the evidence pattern (every Verkle EIP Stagnant; new binary-tree EIP-8297 authored by the same team + Vitalik in June 2026; Verkle absent from the 2026-08-11 roadmap) but no minuted decision. `unknown`
2. **The ethereum.org/roadmap/verkle-trees/ contradiction.** That page (updated 2026-06-24) still presents Verkle as active. I believe it is stale but cannot prove it. `unknown`
3. **Direct ACD meeting notes / ethereum/pm repo.** Not fetched — WebSearch budget (200/200) was exhausted mid-session, and I did not have the exact notes URLs. All fork-scheduling claims above rest on the **meta EIPs** instead, which are the authoritative machine-readable record. `unknown`
4. **ethresear.ch primary threads on state expiry.** Not fetched directly; covered indirectly via ethereum.org/roadmap/statelessness/ and the EIP corpus. `unknown`
5. **Whether Arbitrum's future dynamic pricing bills "storage growth" once or on an ongoing basis.** Docs say the mechanism is not yet designed/enabled. `unknown`
6. **Non-EVM rent precedent (Solana rent-exempt minimum, NEAR storage staking).** Not verified live — do not rely on my recollection here. `unknown`
7. **Base and Linea "official plans" for state growth** beyond their differences pages — neither publishes a state-management roadmap I could locate. `unknown`
8. **Whether Glamsterdam's activation date has been set in the last few days.** EIP-7773's activation table was empty at time of check. `observed` but volatile.

---

## Sources

- [EIP-7736: Leaf-level state expiry in verkle trees](https://eips.ethereum.org/EIPS/eip-7736)
- [EIP-8297: Partitioned Binary Tree](https://eips.ethereum.org/EIPS/eip-8297)
- [EIP-7864: Ethereum state using a unified binary tree](https://eips.ethereum.org/EIPS/eip-7864)
- [EIP-6800: Ethereum state using a unified verkle tree](https://eips.ethereum.org/EIPS/eip-6800)
- [EIP-4762: Statelessness gas cost changes](https://eips.ethereum.org/EIPS/eip-4762)
- [EIP-8037: State Creation Gas Cost Increase](https://eips.ethereum.org/EIPS/eip-8037)
- [EIP-7773: Hardfork Meta – Glamsterdam](https://eips.ethereum.org/EIPS/eip-7773)
- [EIP-8081: Hardfork Meta – Hegotá](https://eips.ethereum.org/EIPS/eip-8081)
- [EIP-7607: Hardfork Meta – Fusaka](https://eips.ethereum.org/EIPS/eip-7607)
- [EIP-4444: Bound Historical Data in Execution Clients](https://eips.ethereum.org/EIPS/eip-4444)
- [EIP-7927: History Expiry Meta](https://eips.ethereum.org/EIPS/eip-7927)
- [EIP-4844: Shard Blob Transactions](https://eips.ethereum.org/EIPS/eip-4844)
- [EIP-1418: Blockchain Storage Rent Payment](https://eips.ethereum.org/EIPS/eip-1418)
- [EIP-1682: Storage Rent (Withdrawn)](https://eips.ethereum.org/EIPS/eip-1682)
- [EIP-2026: State Rent H](https://eips.ethereum.org/EIPS/eip-2026)
- [Full EIP index](https://eips.ethereum.org/all)
- [Ethereum roadmap](https://ethereum.org/roadmap/)
- [Statelessness, state expiry and history expiry](https://ethereum.org/roadmap/statelessness/)
- [Verkle trees (stale page)](https://ethereum.org/roadmap/verkle-trees/)
- [Partial history expiry announcement — EF blog](https://blog.ethereum.org/2025/07/08/partial-history-exp)
- [EIP-8297 magicians thread](https://ethereum-magicians.org/t/eip-8297-partitioned-binary-tree/28776)
- [EIP-7736 magicians thread](https://ethereum-magicians.org/t/eip-7736-leaf-level-state-expiry-in-verkle-trees/20474)
- [Arbitrum gas and fees](https://docs.arbitrum.io/how-arbitrum-works/deep-dives/gas-and-fees)
- [ArbOS 51 Dia](https://docs.arbitrum.io/run-arbitrum-node/arbos-releases/arbos51)
- [Arbitrum dynamic pricing update](https://blog.arbitrum.io/dynamic-pricing-update-2026/)
- [OP Stack differences](https://docs.optimism.io/stack/differences)
- [Base vs Ethereum differences](https://docs.base.org/chain/differences-between-ethereum-and-base)
- [Linea Ethereum differences](https://docs.linea.build/network/overview/ethereum-differences)
- [Scroll differences](https://docs.scroll.io/en/technology/chain/differences/)
- [ZKsync fee structure](https://docs.zksync.io/zksync-protocol/era-vm/transactions/fee-model/fee-structure)
- [Reproducing OP Mainnet's Bedrock migration](https://www.optimism.io/blog/here-s-how-you-can-reproduce-op-mainnet-s-migration-to-bedrock)
- [Optimism 2021 regenesis](https://blog.synthetix.io/optimism-mainnet-upgrade-scheduled-downtime-and-regenesis/)

*Read-only session — no files were written or modified.*
