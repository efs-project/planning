# Recovered Claude memo — Fees, bridges, and steward economics

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T05:00:53.920Z
**Claude task:** `ad63191f6f2d6e1bf`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3591
**Original result length:** 24814 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
All four questions answered. Three sub-investigations ran in parallel; I did the fee snapshot myself via live RPC.

---

# Venue cost & durability research — snapshot 2026-08-13T04:52–04:59 UTC

*(= evening of Tue 2026-08-12 US local. All fee figures are a **dated point-in-time snapshot**, not a forecast.)*

**Tooling caveat up front:** this session's WebSearch budget was exhausted (200/200) at the start, so everything below comes from (a) direct RPC/contract reads I performed myself, and (b) WebFetch of primary documentation URLs. Several sources (etherscan.io, SEC EDGAR, growthepie's rendered dashboard) returned 403 or client-side-only content and could not be read.

---

## 1. FEES

### (a)–(b) Observed gas prices — live RPC, `eth_gasPrice` + block headers

| Venue | L2/L1 gas price (gwei) | Source |
|---|---|---|
| **Ethereum L1** | **base fee 0.0529**, `eth_gasPrice` **0.0531** | `observed` publicnode; cross-checked drpc **0.0456**, merkle **0.0454** |
| **Base** | **0.006** (base fee 0.005 + ~0.001 tip) | `observed` mainnet.base.org |
| **Arbitrum One** | **0.02002** (floor `getMinimumGasPrice` = 0.02) | `observed` arb1.arbitrum.io |
| **OP Mainnet** | **0.001** (base fee **353 wei** + ~0.001 tip) | `observed` mainnet.optimism.io |
| Degen (Orbit L3) | **120 gwei DEGEN** — gas token is not ETH | `observed` rpc.degen.tips, chainId 666666666 |
| Xai (Orbit L3) | **0.1 gwei XAI** — gas token is not ETH | `observed` xai-chain.net/rpc, chainId 660279 |

`observed` **Stability check** — I sampled all four every 10s for 2 minutes (12 samples, ending 04:58:49Z). L1 ranged 0.0387–0.0502 gwei; Base was pinned at 0.006000 for all 12; Arbitrum 0.020000–0.020096; OP 0.001000 for all 12. **The three L2s are effectively at their floors**, not tracking demand.

`observed` L1 latest block 25,743,825, gasLimit **60,000,000**, gasUsed 22.65M (**41% full** avg over 20 blocks). Sub-0.1-gwei base fees are a direct consequence of the 60M limit against ~40% utilization.

### (c) L1 data/blob component per L2 transaction

`observed` — read directly from the OP-Stack `GasPriceOracle` at `0x420...0F` and Arbitrum's `ArbGasInfo` at `0x...6C`:

| Venue | L1 data fee for a realistic ~260-byte tx | USD |
|---|---|---|
| Base | `getL1Fee` = 4.126×10⁸ wei (0.413 gwei); `getL1GasUsed` = 1,600 | **$0.00000078** |
| OP Mainnet | `getL1Fee` = 6.152×10⁸ wei (0.615 gwei); `getL1GasUsed` = 1,600 | **$0.00000116** |
| Arbitrum One | `perL1CalldataByte` = 1.738×10⁷ wei/byte → 5.21×10⁹ wei for 300B | **$0.0000099** |

Oracle params `observed`: Base `baseFeeScalar` 2269 / `blobBaseFeeScalar` 1,055,762; OP 5227 / 1,014,213; both `isFjord() = true`, `decimals = 6`. Arbitrum `getL1BaseFeeEstimate` = 1,086,280 wei; `getL1PricingSurplus` = +3.93×10¹³ (positive surplus, i.e. Arbitrum is currently over-collecting on L1 costs).

**⚠️ Blob base fee is NOT at the 1 wei minimum.** `observed`: `eth_blobBaseFee` = **3,046,029 wei** (0.00305 gwei); over the last 20 blocks it ranged **2,258,893 – 4,249,455 wei**, with `blobGasUsedRatio` averaging 0.198 and `excessBlobGas` = 175,232,932. One full blob (131,072 blob-gas) currently costs ~3.99×10⁻⁷ ETH ≈ **$0.00075**.

This independently corroborates a `reported` claim my economics research surfaced: after roughly 20 months pinned at the 1 wei floor post-Dencun, **the blob floor broke in December 2025** and blob fees now reportedly generate ~$15M/month ([blokz.dev](https://www.blokz.dev/articles/the-blob-market-cycle-twenty-months-at-the-floor-then-the-surge), [blocklr.com](https://blocklr.com/news/ethereum-blob-fees-15m-monthly-l2-surge/) — secondary sources, but the on-chain reading confirms the direction). Absolute levels remain trivial for a single write.

### (d) ETH price

`observed` **$1,890.05** — Coinbase spot API, 04:53Z. Kraken ticker $1,890.00 the same minute. Agreement to 0.003%.

### (e) Worked cost: 200,000-gas storage-heavy write

| Venue | Execution | + L1 data | **TOTAL USD** |
|---|---|---|---|
| **Ethereum L1** | 1.062×10⁻⁵ ETH | n/a | **$0.0201** |
| **Arbitrum One** | 4.004×10⁻⁶ ETH | ~$0.00001 | **$0.0076** |
| **Base** | 1.200×10⁻⁶ ETH | ~$0.0000008 | **$0.0023** |
| **OP Mainnet** | 2.000×10⁻⁷ ETH | ~$0.0000012 | **$0.00038** |
| Degen L3 | 0.024 DEGEN | — | native-token denominated; not priced here |
| Xai L3 | 0.00002 XAI | — | native-token denominated; not priced here |

**The headline: at this snapshot, an L1 200k-gas write costs about two cents, and the L2s are 3× to 53× cheaper than that.** The L1↔L2 gap has collapsed to the point of near-irrelevance for a single write. Note also that on all three L2s the **L1 data component is now negligible (<0.05% of total)** — the cost is essentially all L2 execution at the floor price.

### Historical volatility — L1 200k-gas write

`observed` — I sampled L1 block headers at ~30-day intervals for 24 months (monthly point samples, ETH price held at today's $1,890 for the gwei→USD column):

| Date | Base fee (gwei) | gasLimit |
|---|---|---|
| 2024-08-19 | 0.98 | 30M |
| 2024-10-18 | **21.04** | 30M |
| **2024-12-17** | **30.09** | 30M |
| 2025-02-16 | 0.64 | **36M** |
| 2025-07-17 | 2.15 | 36M |
| 2025-08-16 | 0.25 | **45M** |
| 2025-12-15 | 0.043 | **60M** (Fusaka) |
| 2026-05-14 | 0.39 | 60M |
| **2026-08-13** | **0.053** | 60M |

Recomputed with **contemporaneous** ETH prices (`observed`, Coinbase daily candles):

- **2024-12-17: 30.09 gwei @ ETH ~$3,894 → $23.43** for a 200k-gas write
- **2024-10-18: 21.04 gwei @ ETH ~$2,648 → $11.14**
- **2026-08-13: 0.053 gwei @ ETH $1,890 → $0.020**

**That is roughly a 1,000× decline from the late-2024 sampled peak.** Two independent forces: base fee fell ~570×, and ETH fell ~2.1× from $3,894 to $1,890. The gas-limit ladder (30M → 36M → 45M → 60M) is the visible structural driver.

`unknown` — **these are monthly point samples, so the true 2-year intraday peak was higher than 30.09 gwei.** My attempt to scan for the actual maximum hit RPC 403s on archive queries. Treat $23 as a verified lower bound on peak cost, not the peak. For calibration: 100 gwei @ ETH $1,890 = $37.80; 100 gwei @ ETH $4,000 = $80.00.

### ⚠️ Doc-vs-reality flag

**l2fees.info is stale and should not be cited.** `observed` (fetched 04:53Z): it shows Ethereum L1 "Send ETH" at **$1.10**, which back-solves to ~**27.7 gwei** — roughly **520× higher** than the 0.053 gwei I read live from three independent RPC endpoints. Its chain list still includes Loopring, DeGate, and zkSync Lite. growthepie's `/fundamentals/transaction-costs` page rendered no per-chain numbers (client-side JS), and its public economics API returns only an **aggregate ending April 2025**. etherscan.io/gastracker returned **HTTP 403**. Live RPC was the only reliable source here.

---

## 2. LONG-TERM STATE COST

### (a) Recurring cost to keep storage alive: **none, on any venue**

`documented` — storage is a one-time gas cost at write time on all four. No rent, no expiry, no time-based charge.

- Base: L2 execution fee + L1 security fee only ([docs.base.org network-fees](https://docs.base.org/base-chain/network-information/network-fees))
- OP Mainnet: execution gas + L1 data fee + operator fee post-Isthmus ([docs.optimism.io fees](https://docs.optimism.io/stack/transactions/fees))
- Arbitrum One: parent-chain data + child-chain execution + precompile fees ([docs.arbitrum.io gas-fees](https://docs.arbitrum.io/how-arbitrum-works/gas-fees)). Its docs mention "storage charges" — that is **one-time execution cost, not rent**.

### (b) State expiry status: **stagnant, not scheduled for any fork**

`documented`, all from eips.ethereum.org, checked 2026-08-12:

- **EIP-7736** (leaf-level state expiry) — status verbatim **"Stagnant"**. Requires EIP-6800.
- **EIP-6800** (Verkle state) — verbatim **"Stagnant"**. Its being stagnant is why 7736 is dead in its current form.
- **EIP-7864** (unified binary tree) — **"Draft"**, the live successor direction (arity-2, hash-only, post-quantum). It says expiry strategies "could still be applied, requiring a change in the design" — i.e. **expiry is not designed in**.
- [ethereum.org/roadmap/statelessness](https://ethereum.org/en/roadmap/statelessness/): state expiry is "still in the research phase and not yet ready to ship" and explicitly **deprioritized** relative to weak statelessness and history expiry. Weak statelessness is "probably a few years away."

Fork timeline `documented`: Pectra shipped 2025-05-07; **Fusaka shipped 2025-12-03** (PeerDAS, 60M gas limit default); **Glamsterdam in development, Q4 2026**; Hegotá 2027. **No state-expiry or state-rent EIP appears in Glamsterdam's inclusion list.**

### (c) The real trend is the opposite of rent — new writes are getting *more expensive*

`documented` — **EIP-8037 (State Creation Gas Cost Increase) is Scheduled for Inclusion in Glamsterdam** (per [EIP-7773](https://eips.ethereum.org/EIPS/eip-7773)):

| Operation | Now | Proposed | Δ |
|---|---|---|---|
| **SSTORE (new slot)** | **20,000** | **97,920** | **~4.9×** |
| New account creation | 25,000 | 183,600 | ~7.3× |
| Code deposit / byte | 200 | 1,530 | 7.65× |

Motivation `documented`: after the 30M→60M limit raise, daily new state tripled from ~105 MiB to ~326 MiB. Also SFI: **EIP-8038** (STORAGE_WRITE 2,800→10,000, +257%), EIP-7778 (block gas accounting without refunds), EIP-7976 (calldata floor cost), EIP-7981 (access list cost). **EIP-8032** (superlinear storage pricing, scaling SSTORE by a contract's existing slot count) was **Declined** for Glamsterdam.

**Direct consequence for a storage-heavy 200k-gas write:** if EIP-8037 ships as drafted, that same write becomes a substantially larger gas number — a write dominated by cold SSTOREs could need roughly 4–5× the gas. That is a **one-time** cost increase, not rent, and it propagates to Base/OP/Arbitrum as they adopt the fork (`inferred` — their adoption plans not verified).

`documented` **EIP-4444** (history expiry) is verbatim **"Stagnant"**, though Fusaka shipped EIP-7642 (eth/69) dropping pre-merge wire fields. Flagged as doc-vs-reality: operational history dropping appears to have happened while the EIP remains Stagnant. Regardless — **history ≠ state; expiring history does not touch contract storage.**

### (d) L2 storage-over-time charges: **none found, none announced** `documented` (all three fee docs above).

---

## 3. BRIDGE DEPENDENCIES AND WITHDRAWAL DELAYS

| | Challenge period | Fault proofs | Exit window on upgrade | L2Beat stage |
|---|---|---|---|---|
| **Arbitrum One** | **6.4 days** `documented` | **Live + permissionless (BoLD)** `documented` | **~7 days**, `usersCanExitWithoutCooperation: true` `documented` | Stage 1 |
| **OP Mainnet** | **7 days** `documented` | Live + permissionless, **Guardian-vetoable** `documented` | **None** `documented` | Stage 1 |
| **Base** | **7 days** `documented` | Fraud proofs (1R, ZK) `reported` | **None** `documented` | Stage 1 |

**Arbitrum One** ([docs](https://docs.arbitrum.io/how-arbitrum-works/validation-and-proving/rollup-protocol)): BoLD is active, "anyone to participate in validating"; proposer bond 3,600 ETH with crowdsourcing pools. Worst-case confirmation ≈13–14 days (two challenge periods + 2-day Security Council grace). Force-inclusion via `SequencerInbox.forceInclusion` after **24 hours**, with a "Censorship Timeout" that dynamically lowers the threshold. **⚠️ Arbitrum's own docs conflict**: the L2-to-L1 messaging page says "approximately 7-day," the rollup-protocol page says 6.4 days. **6.4 days is the real `confirmPeriodBlocks`; 7 days is marketing rounding.**

**OP Mainnet** ([docs](https://docs.optimism.io/stack/fault-proofs/explainer)): proofs are permissionless, but the **Guardian (Optimism Security Council) can "pause withdrawals, blacklist games, or revert to a permissioned system."** L2Beat: exit window "None — upgrades take effect as soon as they are co-signed by the SuperchainProxyAdminOwner, with no onchain delay or prior notice." A Developer Advisory Board holds a 7-day veto window.

**Base** ([security council docs](https://docs.base.org/base-chain/security/security-council)): nested 2-of-2 — a **3-of-6 Coinbase multisig** AND an **8-of-11 multisig of independent entities**; "any upgrade requires the approval of 9 of them." **No upgrade delay documented**, matching L2Beat's "contracts instantly upgradable."

### Shortened challenge periods — one real finding

**Base's "Azul" upgrade cuts settlement to 1 day under a dual-proof condition.** `documented`, [docs.base.org/base-chain/specs/upgrades/azul/proofs](https://docs.base.org/base-chain/specs/upgrades/azul/proofs): an `AggregateVerifier` with a multi-proof design over TEE (Nitro Enclave) + ZK provers. Published windows: TEE only → 7 days; ZK only → 7 days; **TEE + ZK agreeing → 1 day**. `DelayedWETH` bond delay also drops to 1 day. Proposer is **permissioned**; ZK provers permissionless; anyone can challenge. **Justification given:** redundancy between two independent proof systems substitutes for the long optimistic window, since a ZK proof can override an invalid TEE-backed proposal.

**⚠️ Doc-vs-doc disagreement, flagged:** Base's user-facing [bridging page](https://docs.base.org/base-chain/network-information/bridging-and-withdrawals), checked the same day, still states a flat **"7 days"**. The Azul spec page carries no activation date or status wording. **Whether Azul is live on Base mainnet today, and whether users actually get the 1-day path, is `unknown` — this is the single biggest gap in section 3.**

OP Mainnet: no shortening; its [notices index](https://docs.optimism.io/notices/) lists Upgrade 20 (Super Root Dispute Games) and interop prep, with no challenge-period change. Arbitrum: no shortening; a Discourse search of the Arbitrum forum for "challenge period reduce" returned **no topics** (`observed`, weak evidence of absence).

### L3 chained delays and extra trust

| L3 | Settles to | Chained delay | Extra trust |
|---|---|---|---|
| **Degen** (Orbit) | **Base** | ~6.4d + 7d ≈ **13–14 days** `inferred` | **AnyTrust DAC** (offchain DA), **"upgradable with no delay"**, LayerZero adapter risk; halted 2 days in May 2024 |
| **Xai** (Orbit) | Arbitrum One | ~6.4d + 6.4d ≈ **12.8 days** `inferred` | **6-member DAC**, flagged "low DAC threshold" + **"closed proofs"**; **validator whitelist** — "funds can be stolen if none of the whitelisted verifiers checks the published state" |
| **Ham** (OP Stack) | Base | 7d + 7d = **14 days** `inferred` | **Below Stage 0**: non-functional proof system, no DA bridge, Celestia DA **without Blobstream** so "the Sequencer can single-handedly publish unavailable roots," whitelisted proposer, **"the system permits invalid state roots"** |

Sources: [l2beat degen.ts](https://raw.githubusercontent.com/l2beat/l2beat/main/packages/config/src/projects/degen/degen.ts), [xai.ts](https://raw.githubusercontent.com/l2beat/l2beat/main/packages/config/src/projects/xai/xai.ts), [l2beat.com/scaling/projects/ham](https://l2beat.com/scaling/projects/ham).

**The doubled delay is the smaller problem.** The material deltas are: DA moves offchain to a small committee or an unbridged external layer; proposers/validators are permissioned or the proof system doesn't function at all; upgrades are instant with no exit window; and the L3 inherits its host L2's trust assumptions **on top of** its own.

`documented` — Base's docs note that third-party fast bridges "do not make the underlying standard withdrawal challenge period shorter"; they front liquidity and substitute operator counterparty risk.

---

## 4. STEWARD / ECONOMIC SUSTAINABILITY

### (a) Operators

`documented` (L2Beat config source): **Base** — single sequencer modifiable by `Base Multisig 1` via `SystemConfig`; Stage 1 since 2025-04-29; **"There is no delay on upgrades."** **Arbitrum One** — centralized sequencer, Offchain Labs, no decentralization mechanism in config. **OP Mainnet** — "single Sequencer actor" modifiable by `OpFoundationOperationsSafe`; Stage 1 since 2024-06-10.

### ⚠️ MATERIAL EVENT — Base reportedly left the Superchain, Feb 2026

`reported` (multiple secondary aggregators agree; **no primary source retrieved**) — on **2026-02-18** Base announced it is leaving Optimism's OP Stack to build "its own unified, Base-operated stack." Reported consequences: OP token −25% to −28% within 48h; Optimism announced a ~20% workforce reduction.

**This invalidates the premise of the revenue-share question in your brief.** The Base→Optimism Collective arrangement (2.5% of revenue / 15% of profit) appears **terminated**, not amended. Given the significance and the absence of a primary source, **verify this before relying on it.**

### (b) Is sequencer revenue covering cost?

**This is the weakest-evidenced section.** `documented` — growthepie's public economics API returns only an **"All L2s" aggregate ending April 2025**: monthly fees $1.39M (Aug 2024) to $22.5M (Nov 2024) against ~$2.7M combined L1+blob costs in the peak month, i.e. **~88% gross margin in aggregate in late 2024** — but that is measured in the free-blob era.

`inferred` — **the blob floor breaking (which I confirmed on-chain above) is the single most important margin variable**, and the ~88% figure is very likely lower in 2026. Chains with high data volume and low fee capture — exactly the high-throughput L3 profile — are most exposed.

`reported`, single low-authority source, **not corroborated**: Arbitrum's sequencer "generates $45–60 million annually in surplus revenue (post-L1 costs)." `reported`: the Arbitrum Foundation is seeking a **$43M operating budget for 2027**; Offchain Labs will give Robinhood Chain "10% of net protocol revenue."

`unknown` — **Coinbase does not appear to break out Base's P&L.** SEC EDGAR returned 403. The Q2 2026 earnings call gave volume figures only ($32T stablecoin transfer volume over 12 months) and, per the transcript, "no specific financial breakdowns for Base revenue, sequencer fees, or profitability metrics." **Doc-vs-reality flag: Coinbase promotes Base heavily in narrative terms while apparently not disclosing its economics — so no external party can verify whether Base is self-sustaining or subsidized.**

### (c) Single-company dependence and what happens if they stop

**Arbitrum One is materially better protected than Base or OP Mainnet.** `documented`: 24-hour force-inclusion, ~7-day exit window, `usersCanExitWithoutCooperation: true`. By contrast, L2Beat records **Base exit window "None"** and **OP Mainnet exit window "None."**

`unknown` — **I found no published continuity or wind-down commitment from Coinbase, OP Labs, the Optimism Foundation, or Offchain Labs** stating what happens to the chain if the company stops. The closest public statement is `reported` from Brian Armstrong on the Q2 2026 call: **"There is a path to decentralize it over time… making good progress on that through different stages"** ([transcript, 2026-07-30](https://www.fool.com/earnings/call-transcripts/2026/07/30/coinbase-coin-q2-2026-earnings-call-transcript/)) — a roadmap statement, non-binding, undated.

### (d) RaaS obligations — **Conduit is the only one of four with a published exit obligation**

`documented`, [conduit.xyz/terms](https://conduit.xyz/terms):
- > "If this Agreement is expired or terminated for any reason, Customer will have **thirty (30) days** in which to migrate to a new set of Sequencer Keys… and Conduit will… effect such transfer of custody within such 30-day period."
- Conduit may terminate **"for any reason by providing Customer with ten (10) days prior written notice."**
- Liability carve-out: > "such actions may result in **loss of access to onchain assets, data, or smart contracts**… Conduit shall have **no liability**."
- Its [SLA](https://www.conduit.xyz/sla) commits to 99% monthly availability with fee credits, and contains **no** sunset provisions.

`documented` — **Caldera: NO published chain-sunset policy** ([terms](https://www.caldera.xyz/terms)); termination language covers only the website/account. **AltLayer: NO published chain-sunset policy** ([terms](https://altlayer.io/terms-of-service)); generic "may modify, suspend, or discontinue any part of the Service at any time." **Gelato: `unknown`** — terms URL returned a redirect loop.

**The sharpest finding here** (`inferred`): note the asymmetry in the one contract that exists. **Conduit's 30-day key handover protects the chain operator's ability to move; the liability disclaimer explicitly does not protect the end user's funds.** For an application deciding where its data lives, an L3's escape hatch is a commercial term between two companies that the user is not a party to.

### Live precedent

`reported` — **Degen Chain is sunsetting on 2026-08-31 — 19 days from today.** Announced via the Degen Token X account: "Degen Chain will officially sunset on August 31, 2026." Users must bridge out via bridge.degen.tips before the deadline. (Primary source 403'd; secondary aggregators only.) **I read Degen's RPC live today and it is still serving traffic at 120 gwei DEGEN** (`observed`) — so it is up, but reportedly on a 19-day clock.

`reported` — The **2024 Degen/Conduit incident** is the cautionary precedent: in April 2024 the L3 stopped publishing batches after Conduit configuration changes, causing a ~2-day outage and a chain reorg. Subsequent coverage titled "DEGEN L3 Faces Migration Challenges Amidst Hostile Key Control by Conduit" reports Conduit "refused to take responsibility for the community's damages" and withheld sequencer fees ([techflowpost](https://www.techflowpost.com/en-US/article/17835), [cryptonews](https://cryptonews.com/news/degen-chain-outage-network-restored-l3-debate-reignited/)).

---

## Could not verify

1. **The true 2-year L1 intraday peak base fee** — monthly point samples only; archive RPC queries 403'd. $23.43 (Dec 2024) is a verified *lower bound*, not the peak.
2. **Whether Base's Azul 1-day settlement path is live on mainnet** — spec page has no activation date; user docs still say 7 days. Biggest gap in section 3.
3. **Primary confirmation that Base left the Superchain (Feb 2026)** — all sources secondary. Verify before relying on it.
4. **Coinbase's Base revenue/cost disclosure** — SEC EDGAR 403'd. Q1 FY2026 10-Q is at `sec.gov/Archives/edgar/data/1679788/000167978826000054/coin-20260331.htm`; needs manual retrieval.
5. **Per-chain 2025–2026 revenue vs. blob cost margins** — growthepie's public endpoint is aggregate-only and stops April 2025.
6. **Exact `confirmPeriodBlocks` for Degen and Xai** — Orbit default 6.4d assumed, unconfirmed; the chained-delay figures are inferred sums.
7. **OP Stack force-inclusion window for Base / OP Mainnet** — no self-sequencing delay value surfaced.
8. **Arbitrum Security Council emergency thresholds** (commonly cited 9/12, 7/12) and L1 timelock delay — not stated on the pages reached.
9. **Gelato's terms of service** — redirect loop.
10. **Whether Base/OP/Arbitrum have committed to adopting Glamsterdam's EIP-8037 state-cost repricing.**
11. **A live OP Stack L3 gas price** — the Ham RPC (rpc.ham.fun) was unreachable; Ham's structural data came from L2Beat, not a live read.
12. **Primary confirmation of the Degen sunset date** and 2024 Conduit dispute details — secondary sources only.

**Sources:** live RPC (publicnode / drpc / merkle / mainnet.base.org / arb1.arbitrum.io / mainnet.optimism.io / rpc.degen.tips / xai-chain.net), on-chain `GasPriceOracle` `0x420…0F` and `ArbGasInfo` `0x…6C` reads via `cast`, [Coinbase spot API](https://api.coinbase.com/v2/prices/ETH-USD/spot), [Kraken ticker](https://api.kraken.com/0/public/Ticker?pair=ETHUSD), [Coinbase Exchange candles](https://api.exchange.coinbase.com/products/ETH-USD/candles), [l2fees.info](https://l2fees.info/) (stale — flagged), [eips.ethereum.org](https://eips.ethereum.org/) (7736, 6800, 7864, 7773, 7607, 8037, 8038, 8032, 7778, 7825, 4444), [ethereum.org/roadmap](https://ethereum.org/en/roadmap/), [docs.base.org](https://docs.base.org/), [docs.optimism.io](https://docs.optimism.io/), [specs.optimism.io](https://specs.optimism.io/protocol/configurability.html), [docs.arbitrum.io](https://docs.arbitrum.io/), [docs.arbitrum.foundation](https://docs.arbitrum.foundation/concepts/security-council), [l2beat.com](https://l2beat.com/) + [l2beat config on GitHub](https://github.com/l2beat/l2beat/tree/main/packages/config/src/projects), [conduit.xyz/terms](https://conduit.xyz/terms), [conduit.xyz/sla](https://www.conduit.xyz/sla), [caldera.xyz/terms](https://www.caldera.xyz/terms), [altlayer.io/terms-of-service](https://altlayer.io/terms-of-service), [api.growthepie.xyz](https://api.growthepie.xyz/v1/economics.json).

*No recommendation offered and no venue selected, per your instruction.*
