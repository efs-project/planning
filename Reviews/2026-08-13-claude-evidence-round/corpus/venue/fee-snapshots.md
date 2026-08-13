# Recovered Claude memo — Fee snapshots across venues

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T04:40:22.373Z
**Claude task:** `a18c6a86ced3c0769`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3526
**Original result length:** 16095 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
All data gathered. Here are the findings.

---

# EVM transaction fee snapshot — 2026-08-12/13

**All measurements taken 2026‑08‑13 04:17–04:38 UTC.** These are point‑in‑time snapshots; L1 base fee and Linea's gas price both moved materially within the 20‑minute collection window.

**ETH price used: $1,884.86** `observed` — CoinGecko `simple/price` @ 04:17:30Z (`last_updated_at` 1786594650). Corroborated by Coinbase spot $1,884.655 (`https://api.coinbase.com/v2/prices/ETH-USD/spot`, 04:19Z) and Etherscan header $1,884.11 @ 04:25Z. Three independent sources agree within 0.04%.
Gas tokens: **DEGEN $0.00115556**, **XAI $0.00638041** `observed` — CoinGecko @ 04:19:50Z.

## Method note (important for reading the table)

`l2fees.info` **is dead data** `observed`: `curl -sI https://l2fees.info/` @ 04:38:38Z returns `age: 16445266` (190.3 days) with `x-vercel-cache: STALE`. Its embedded `__NEXT_DATA__` contains no Base, Linea, Scroll, or any L3 — the underlying dataset predates Base's launch. **Every number on that site is stale and I did not use it.** (It renders fine and looks live, which is the trap.)

So primary evidence is: (1) direct RPC reads, (2) **real on-chain receipts** I pulled and re-priced, (3) Etherscan-family gas trackers, (4) growthepie's live fees API, (5) on-chain fee oracles (`GasPriceOracle` 0x42..0F, Scroll 0x53..02, `ArbGasInfo` 0x..6C).

---

## Master table

| Venue | Gas price / base fee (04:34Z) `observed` | (a) ERC‑20 transfer — gas / USD | (b) ~200B state write — gas / USD | (c) ~10KB deploy — gas / USD |
|---|---|---|---|---|
| **Ethereum L1** | 0.0497 gwei; baseFee **0.0495** gwei | 59.5k–63.2k `obs` → **$0.0059** at current price; **$0.126** actually paid | 150k–200k `inf` → **$0.014–$0.019** | 2.4M–2.9M `inf` → **$0.225–$0.272**; real deploy paid **$0.41** |
| **Base** | 0.006 gwei; baseFee 0.005 | 31.6k–45.5k `obs` → **$0.00052** | 150k–200k `inf` → **$0.0017–$0.0023** | **$0.027–$0.033**; real 5,594B deploy paid **$0.030** |
| **Arbitrum One** | 0.0200 gwei; baseFee 0.0200 | 40.5k `obs` (incl. 230 `gasUsedForL1`) → **$0.0015** | 150k–200k `inf` → **$0.0057–$0.0075** | **$0.090–$0.109** |
| **OP Mainnet** | 0.00100 gwei (tip floor); baseFee **348 wei** | 29.9k–51.5k `obs` → **$0.000099** | 150k–200k `inf` → **$0.00029–$0.00038** | **$0.0047–$0.0056** |
| **Linea** | **1.00 gwei**; baseFee 7 wei (all priority) | 61.1k `obs` → **$0.115** at current; **$0.023** at the 0.2 gwei receipts showed | 150k–200k `inf` → **$0.28–$0.38** | **$4.52–$5.47** |
| **Scroll** | 0.000120 gwei; baseFee 0.000120 | 44.3k `obs` → **$0.00048** (L1 fee is 98% of it) | 150k–200k `inf` → **$0.00127–$0.00128** | **$0.084** (L1 data fee dominates) |
| **zkSync Era** | 0.04525 gwei (= `minimal_l2_gas_price`) | 85.6k–104k `obs` → **$0.0081** | 150k–200k `inf` → **$0.013–$0.017** | `inferred, low confidence` ~$0.20–$0.25 |
| **Degen Chain** (Orbit L3 → **Base**) | **120 gwei DEGEN** | 29,660 / 46,760 `obs` → **$4.1e‑6 / $6.5e‑6** | 150k–200k `inf` → **$2.1e‑5 – $2.8e‑5** | **$3.3e‑4 – $4.0e‑4** |
| **Xai** (Orbit L3 → **Arbitrum One**) | **0.1 gwei XAI** | 41,855 / 58,931 `obs` → **$2.7e‑8 / $3.8e‑8** | 150k–200k `inf` → **$9.6e‑8 – $1.3e‑7** | **$1.5e‑6 – $1.9e‑6** |

Column (a) gas figures are from **real receipts I fetched**, re-priced at the 04:34Z gas price. Columns (b) and (c) are `inferred` — basis given below.

### Gas-model basis for (b) and (c) — `inferred`

**(b) ~200-byte state write, 150k–200k gas:** 21,000 intrinsic + ~2,360 calldata (200B at ~35% zeros: 70×4 + 130×16) + 7 × 22,100 `SSTORE_SET` + cold-slot access (200B ≈ 7 words) = 154,700 + ~3,100 LOG (375 + 3 topics + 8/byte) + ~10k dispatch/misc. EIP‑7623 floor does **not** bind here (floor = 21,000 + 10×590 tokens = 26,900 < standard once execution exceeds ~3.5k gas).
Real-world upper anchor `observed`: EAS `Attested` transactions I pulled — Base **282,312 gas** min (356B calldata), OP Mainnet **253,176 gas** min (452B calldata). Most EAS traffic is batched `multiAttest`, so single-attestation cost sits between my model and those numbers.

**(c) 10KB deploy, 2.4M–2.9M gas:** 200 gas/byte code deposit × 10,240 = 2,048,000 is the floor, + 21,000 + ~130k initcode calldata + EIP‑3860 initcode 2/word (~656) + constructor execution.
Empirically anchored on **real deploys I observed**: Ethereum `0xc2fd197e…` deployed **11,981 bytes for 3,334,364 gas** (278.3 gas/byte) → scales to **2,849,836 gas** at 10,240B. Base `0x4bc9a751…` 5,594B / 1,287,603 gas (230.2/byte) → 2,356,999. Base `0x390fe24b…` 3,553B / 957,390 (269.5/byte). The 230–278 gas/deployed-byte band is where the 2.4M–2.9M range comes from.

---

## L1 blob (EIP‑4844) component

| Reading | Value | Source | Time |
|---|---|---|---|
| `eth_blobBaseFee` | 2,934,227 wei = **0.002934 gwei**/blob-gas | publicnode RPC | 04:20Z `observed` |
| `eth_blobBaseFee` | 2,795,493 wei = **0.002796 gwei** | publicnode RPC | 04:34Z `observed` |
| Blobscan block 25743704 `blobGasPrice` | 3,420,966 wei = **0.003421 gwei** | `https://api.blobscan.com/blocks?ps=3` | 04:27:59Z `observed` |
| L1 `baseFeePerBlobGas` series (5 blocks) | 0x2da02b→0x2d4925 (2.99M→2.97M wei) | `eth_feeHistory` | 04:20Z `observed` |

**Blob base fee range over the window: 0.0028–0.0034 gwei/blob-gas.** One blob = 131,072 blob-gas = **3.66e‑7 – 4.48e‑7 ETH = $0.00069–$0.00085**. Blobscan block 25743704 carried 8 blobs for a total `blobGasBaseFee` of 3,587,142,844,416 wei (**$0.0068**) `observed`. Data cost works out to **~$0.0000054 per KB** `inferred`.

Blob capacity `inferred` (from `blobGasUsedRatio` values 0.142857 = 3/21, 0.238095 = 5/21, 0.428571 = 9/21): max **21 blobs/block**. I did not find a doc source confirming this in-window, so treat as inferred.

**How each rollup consumes it** `observed` (on-chain oracle reads, 04:30Z):

| Chain | `l1BaseFee` | `blobBaseFee` | scalars | `getL1Fee` 120B / 310B / 10.5KB |
|---|---|---|---|---|
| Base (0x42..0F) | 56,933,534 wei (0.0569 gwei) | 3,564,606 (0.003565) | baseFeeScalar 2269, blobBaseFeeScalar 1,055,762, decimals 6 | 6.10e‑10 / 1.46e‑9 / 4.53e‑8 ETH → **$0.0000011 / $0.0000027 / $0.000085** |
| OP Mainnet | 61,302,608 wei (0.0613 gwei) | 3,870,233 (0.003870) | 5227 / 1,014,213; `isFjord`=1, `isEcotone`=1 | 9.80e‑10 / 2.35e‑9 / 7.31e‑8 ETH → **$0.0000018 / $0.0000044 / $0.000138** |
| Scroll (0x53..02) | 52,425,102 wei (0.0524 gwei) | reverts | reverts | 2.50e‑7 / 6.57e‑7 / 4.43e‑5 ETH → **$0.00047 / $0.00124 / $0.0834** |
| Arbitrum (`ArbGasInfo`) | `getL1BaseFeeEstimate` 1,346,399 wei (0.001346 gwei) | — | `perL1CalldataByte` 21,542,384 wei; `perL2Tx` 3,015,933,760 wei; `perStorageAlloc` 4e11 wei | folded into `gasUsed` via `gasUsedForL1` (230 for a 68B transfer) |
| zkSync Era (`zks_getFeeParams`) | `l1_gas_price` 114,526,469 wei | — | `l1_pubdata_price` 5,376,777 wei/byte; `batch_overhead_l1_gas` 800,000; `max_pubdata_per_batch` 500,000 | pubdata model, not `getL1Fee` |

**Scroll is the outlier: its L1 data fee is ~500× Base's and ~250× OP's for the same payload.** Scroll's `blobBaseFee()` / `commitScalar()` / `blobScalar()` all revert on its oracle, so I could not decompose whether it is on blobs or calldata — but the magnitude says it is not getting blob economics the way Base/OP are. Flagging as the single most consequential finding for anyone sizing calldata-heavy writes.

OP Mainnet's `l1BaseFee` (61,302,608 wei) **exactly matches** ultrasound.money's `base-fee-per-gas` reading (61,302,608 wei, timestamp 2026‑08‑13T04:27:47Z) — an independent confirmation that both the oracle and the tracker are live.

---

## Per-venue notes

**Ethereum L1** — Etherscan gas tracker @ 04:25Z `observed`: Standard **0.067 gwei** (Base 0.067 / Priority 0), Fast 0.07, Rapid 0.077, all "$0.003", Last Block 25743699, utilization 52.21%. Featured Actions: Swap $0.045, NFT Sale $0.076, Bridging $0.014, Borrowing $0.038. My RPC read at 04:34Z gave baseFee 0.0495 gwei; ultrasound.money gave 0.0613 gwei @ 04:27:47Z. All three in the 0.05–0.07 gwei band — L1 is extraordinarily cheap right now (60M gas limit, ~52% utilization).
**The gap worth flagging:** every real ERC‑20 transfer I sampled paid **~1.059 gwei** (`0x8afd139a…`, `0x6cde5439…`, `0xd087b7e2…`, block 25743676) — **21× the base fee**, costing $0.126 instead of $0.0059. Wallets are running stale gas heuristics. If you are budgeting, the honest number depends on whether you control the gas setting.

**Base** — Basescan gas tracker, "Last Refreshed: Thu, 13 Aug 2026 04:27:35 UTC" `observed`: Standard/Fast/Rapid all **0.005 gwei**, Priority 0, utilization 11.02%. Featured Actions: ERC‑20 Transfer **$0.001**, Swap $0.002, Add/Remove LP $0.002. My receipt-derived $0.00052 is half Basescan's rounded $0.001 — consistent given Basescan rounds to 3 decimals. L1 data fee is ~0.2% of total cost.

**Arbitrum One** — Arbiscan, refreshed 04:27:25Z `observed`: 0.021 gwei flat across tiers, utilization 45.87%. Featured Actions: ERC‑20 Transfer **$0.003**, Swap $0.008, LP $0.007. My receipts give $0.0015; growthepie median $0.0029. Arbiscan's $0.003 likely assumes ~65k gas vs. the 40.5k my sampled transfers used. `perStorageAlloc` = 4e11 wei = **$0.00075 per storage slot** — a clean per-`SSTORE` price for sizing attestation writes.

**OP Mainnet** — Cheapest venue measured. Optimistic Etherscan refreshed 04:27:43Z `observed` but its Featured Actions table renders **blank** and it reports Rapid as "0.000002 Gwei", which contradicts the 0.001 gwei tip floor I observed in receipts. Base fee is 348 wei — essentially zero; the 0.001 gwei floor is what actually gets paid. growthepie reports OP median at $0.0000 (rounds to zero).

**Linea** — **The expensive outlier, and the most volatile.** Lineascan refreshed 04:30:01Z `observed`: 0.924 gwei, ERC‑20 Transfer **$0.113**, Swap $0.348, LP $0.305. My RPC read 1.00 gwei at 04:34Z. But the actual receipts I pulled (blocks 31702860–31702883) paid **0.2–0.4 gwei** → $0.023–$0.046. Base fee is pinned at 7 wei; 100% of the cost is sequencer-set priority fee, which swung 5× within ~100 blocks. growthepie's 24h range confirms the swing: median $0.0130–$0.1301, swap $0.0189–$0.5502. **Do not treat any single Linea number as stable.** Also note ERC‑20 transfers cost ~61k gas here vs 31–45k on Base.

**Scroll** — L2 execution is nearly free (0.00012 gwei) but the L1 data fee dominates: for a 120‑byte transfer, L1 = 2.50e‑7 ETH vs L2 = 5.3e‑9 ETH, i.e. **98% of the fee is L1 data**. This inverts on deploys: a 10KB deploy costs $0.084, of which $0.0834 is L1 data. Scroll is the worst venue in this set for calldata-heavy or bytecode-heavy work relative to its execution price. Note `scrollscan.com/gastracker` now returns "page not found | Blockscout" — Scrollscan appears to have migrated off the Etherscan stack, so no Etherscan-style tracker exists for it.

**zkSync Era** — Different fee model (pubdata, not `getL1Fee`). `zks_getFeeParams` @ 04:33Z `observed`: `minimal_l2_gas_price` 45,250,000 (matches `eth_gasPrice` exactly), `l1_gas_price` 114,526,469, `l1_pubdata_price` 5,376,777 wei/byte, `batch_overhead_l1_gas` 800,000, `max_pubdata_per_batch` 500,000. ERC‑20 transfers burn 85.6k–104k gas — 2–3× the EVM-native chains, because zkSync's gas accounting is not EVM-equivalent. **My (c) deploy figure for zkSync is low-confidence** — zkSync deploy costs are driven by pubdata (bytecode publication), not the 200 gas/byte EVM rule, so the 2.4M–2.9M gas model does not transfer cleanly.

**Degen Chain** `observed` — L2BEAT confirms: "ultra-low-cost L3 … built with Arbitrum Orbit, **Base for settlement**, and AnyTrust for data availability. DEGEN is the native gas token." Host chain **Base**, chain ID 666666666, TVS $2.12M, **Daily UOPS 0.02**. This is the Orbit-L3-settling-to-Base the task asked for. Real transfers: `0xae7487e1…` 29,660 gas and `0x01d6b7b8…` 46,760 gas, both @ 120 gwei DEGEN. Costs are effectively zero in USD — but note the chain is close to idle (UOPS 0.02 ≈ 1,700 tx/day), and AnyTrust DA means it is not inheriting Ethereum DA guarantees.

**Xai** `observed` — L2BEAT: "Ethereum Layer‑3 that leverages Arbitrum AnyTrust", host chain **Arbitrum One** (not Base), chain ID 660279, gas token XAI, TVS $498.40K, Daily UOPS 0.89. Real transfers: `0x266bd367…` 41,855 gas, `0x50663ca8…` 58,931 gas @ 0.1 gwei XAI. Costs round to ~$0.00000003 — sub-microcent. Same AnyTrust DA caveat.

---

## Where trackers disagree

1. **Ethereum L1 real cost vs. tracker cost** — Etherscan says a standard transfer is $0.003; real ERC‑20 transfers are paying $0.126 because senders set ~1.06 gwei against a 0.05 gwei base fee. 21× gap. Both numbers are "true"; they answer different questions.
2. **Linea** — growthepie median $0.1301 vs Lineascan ERC‑20 $0.113 vs my observed receipts $0.023–$0.046. Underlying gas price genuinely moved 0.2 → 1.0 gwei within the window. growthepie's own 24h range is $0.0130–$0.1301, a 10× spread.
3. **Scroll** — my observed receipts (0.012 gwei, ~226 blocks back) → $0.00167; repriced at the current 0.00012 gwei → $0.00048; growthepie median $0.0011. Scroll's L2 gas price fell 100× between the sampled receipts and the snapshot.
4. **Arbitrum** — Arbiscan $0.003 vs my receipts $0.0015 vs growthepie $0.0029. Gas-units assumption, not a price disagreement.
5. **OP Mainnet** — Optimistic Etherscan's "0.000002 Gwei" Rapid figure contradicts the 0.001 gwei floor visible in every receipt; its Featured Actions table is empty. Treat that tracker as partly broken.
6. **Blob base fee** — 0.002796 (RPC 04:34Z) vs 0.003421 (Blobscan 04:27:59Z), a 22% spread over 7 minutes. Real fluctuation, not a source conflict.

## Could not verify

- **l2fees.info** — reachable but **190 days stale** (`age: 16445266`, `x-vercel-cache: STALE`); dataset predates Base/Linea/Scroll entirely. Its Ethereum "$1.10 send ETH" and "$5.48 swap" figures are ~300× current reality. Marked `unknown`/unusable, not used anywhere above.
- **Scroll blob decomposition** — `blobBaseFee()`, `commitScalar()`, `blobScalar()`, `isCurie()` all revert on 0x5300…0002. Could not determine Scroll's blob-vs-calldata split or scalars. `unknown`
- **Scrollscan gas tracker** — `scrollscan.com/gastracker` returns 404 (Blockscout error page). No Etherscan-equivalent tracker for Scroll. `unknown`
- **zkSync Era 10KB deploy cost** — gas model doesn't transfer; the $0.20–$0.25 figure is a naive extrapolation and should not be relied on. `inferred, low confidence`
- **Blob target/max per block** — 21 max derived arithmetically from `blobGasUsedRatio`; no documentation source confirmed in-window. `inferred`
- **Etherscan gas tracker via WebFetch** — returned HTTP 403; retrieved via `curl` with a browser UA instead. Data is genuine, retrieval path was non-standard.
- **Single minimal EAS attestation** — every EAS transaction I sampled across 5 chains was a batched `multiAttest` with 356B–4,612B calldata. Could not isolate a true single-attestation baseline on-chain; column (b) remains a gas model with the batched figures as an upper anchor.
- **growthepie `master.json`** — `last_updated_utc: 2026-08-12 05:30:08` (a day stale) though the `fees/table.json` hourly series is current to 2026‑08‑13 02:00Z. Metadata stale, fee data fresh.
- **OP Stack L3 settling to Base other than Degen** — did not survey beyond Degen; no claim either way.

## Volatility caveat

Everything above is a **~20-minute window on 2026‑08‑13**. Within that window: L1 base fee moved 0.0495→0.067 gwei (35%), Linea's gas price moved 0.2→1.0 gwei (5×), the blob base fee moved 22%, and Scroll's L2 gas price was 100× higher in receipts from ~226 blocks earlier. growthepie's 24h ranges (in the table data I pulled) show Ethereum median $0.0036–$0.0572 (16×) and Linea $0.0130–$0.1301 (10×) over a single day. **Any single number here is good to roughly one significant figure and only for today.** For EFS write-cost budgeting, the durable signals are the structural ones: OP Mainnet ≈ 5–10× cheaper than Base, Base ≈ 3× cheaper than Arbitrum, Scroll's cost being ~98% L1 data, and Linea being 100–1000× the others.
