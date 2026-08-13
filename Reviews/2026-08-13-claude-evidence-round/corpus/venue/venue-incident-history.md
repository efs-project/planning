# Recovered Claude memo — Venue incident history and failure modes

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T04:43:55.802Z
**Claude task:** `a50f28a45ca639180`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3527
**Original result length:** 35228 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
All four research threads are complete (three agents plus my own primary/empirical work). Here are the findings.

---

# Adversarial track record: EVM venues, dated incident ledger

**Method.** Four parallel research threads plus direct empirical probing. Claims tagged `observed` (I fetched/probed it myself), `documented` (official source), `reported` (news/third-party), `inferred`, `unknown`. My own RPC/DNS probes ran **2026-08-13 ~04:20–04:45 UTC**; web fetches **2026-08-12/13**. The session's WebSearch budget (200 calls) was exhausted partway, so the later half is direct-fetch and on-chain evidence — which is why much of this is `observed` rather than `reported`.

**Correction to two premises in the brief up front:**
- There was **no August 2024 Base halt**. Base's incidents are Sept 2023, Aug 2025, May 2026, June 2026 (below). The "Aug 2024" recollection appears to be Aug 2025. `observed`
- OP Stack/Base force-inclusion delay is **12 hours**, not 12 minutes. The 30-minute figure is normal-operation deposit inclusion, not the censorship-resistance guarantee. `documented` — https://docs.optimism.io/stack/rollup/outages, checked 2026-08-12

---

## A. Outage / halt ledger

| Date | Venue | Duration | Cause | Resolution | Exit/force-include during halt |
|---|---|---|---|---|---|
| 2021-09-14 | Arbitrum One | 45 min (14:14–14:59 UTC) | Sequencer stuck on large tx burst | Restart; no reorg, no state loss | **Yes** — docs state users could submit directly to L1 for delayed inclusion `documented` |
| 2022-01-09 | Arbitrum One | ~7 h | **Hardware failure** in main sequencer; backup redundancy also failed due to an in-progress software upgrade | 284 pending txs posted to L1, then restart; "no re-org" | Fallback existed in design; actual use not documented `documented` |
| 2023-04-01 | zkSync Era | not stated | not detailed; post-mortem reportedly never delivered | resumed | none usable `reported` |
| 2023-06-07 | Arbitrum One | ~1–1.5 h | Batch poster stalled — geth mempool rejected its txs | fix + restart | sequencer kept ordering; batches not posted `reported` |
| 2023-09-05 | **Base** (first major) | 43–45 min | Internal infrastructure "requiring a refresh" | infra refresh | not documented `reported` |
| 2023-12-15 | Arbitrum One | 78 min sequencer (15:29–16:57 UTC); status page shows components degraded to 21:04 UTC | Ethscriptions surge → >90% of traffic; L1 data posting 3 MB/h → 80 MB/h; batch poster hard-capped at 10 unconfirmed batches in L1 mempool | limit raised; restart | 24 h force-inclusion delay ≫ 78 min outage, so structurally irrelevant `documented` + `observed` |
| 2023-12-16, 2023-12-25 | zkSync Era | Dec 25: ~4 h | Automated safety protocol tripped by an operator state-update bug | resumed; "no funds at risk" | L1 queue exists but sequencer can stop processing it `reported` |
| 2024-02-15 | OP Mainnet | ~2 h 13 m (05:04–07:17 UTC) | Network instability affecting chain sync | patched | 12 h window ≫ outage `observed` (status.optimism.io) |
| 2024-03-22→24 | **Polygon zkEVM** | ~14 h | L1 reorg not detected by synchronizer for >2 epochs → wrong Global Exit Root sequenced → published state diverged from actual | **Emergency State invoked** (6/8 council, no timelock); node v0.6.4 + prover v6.0.0 | force-inclusion existed in code but **disabled** `documented` |
| 2024-05-12→15 | **Degen Chain** (Orbit L3) | **~50 h** | RaaS provider (Conduit) raised batch size to 10 MB then reverted; batch released **after the 24 h mandatory inclusion window** → **reorg**; geth DB corrupted; resync from genesis took >40 h | resync | n/a — chain down `reported` |
| 2024-05-22→23 | OP Mainnet | ~11 h | **Proposer downtime** — withdrawal proving affected | fixed | chain live, withdrawals stalled `observed` |
| 2024-05-18→06-04 | OP Mainnet | 17 days intermittent | High-I/O txs colliding with op-geth background compaction | perf fixes + hardware | degraded, not halted `observed` |
| 2024-06-02 | **Linea** | **1 h 13 m 31 s**, blocks 5,081,800→5,081,801 (00:48:43→02:02:14 UTC) | **Deliberate operator halt** during Velocore exploit | sequencer restart | **None** — Linea has no force-inclusion at all `observed` (on-chain) |
| 2024-07-05→06 | Scroll | ~13 h 45 m finalization halt | Compression bug | **Reverted all pending unfinalized batches from index 275119**; no L2 reorg | withdrawals delayed `observed` |
| 2025-07-30 | zkSync Era | partial liveness failure | **Proof system manually paused** due to a vulnerability | resumed | — `reported` |
| 2025-08-05 | **Base** | 29–33 min (06:07/06:15–06:40/06:44 UTC) | Sequencer fell behind under congestion; Conductor failover to a **backup that had not been fully provisioned** | manual intervention; Conductor paused, controlled leadership transition | not documented `reported` |
| 2025-08-08→09 | Scroll | ~19 h finalization halt | EuclidV2 prover completeness bug — `extcodesize` returned 0 in EIP-7702 paths → sequencer/prover divergence | Security Council upgrade; batches **re-proven** | withdrawals delayed `documented` |
| 2025-09-10 | Linea | 1 h 6 m 24 s (blocks 23,145,386→387) | Sequencer performance degradation, hours before the LINEA airdrop | fix deployed | **None** `observed` (on-chain) |
| 2026-01-07 | Arbitrum One | ~4 h | "Infrastructure issue temporarily prevented posting batches to mainnet" | — | data not reaching L1 during window `observed` |
| 2026-02-05→06 | Arbitrum One | ~6.5 h | **Delays in posting an assertion** (proposer failure) | assertion posted | withdrawals stalled `observed` |
| 2026-03-23 | Arbitrum Sepolia | ~6 h | Block production halted | — | testnet `observed` |
| 2026-04-18→21 | Linea | ~3.5 days finalization halt | Status page verbatim: **"Release is blocked on required Security Council signatures."** | council signed | `observed` |
| 2026-05-13 | Arbitrum One | ~9 h | Delays posting an assertion | — | withdrawals stalled `observed` |
| **2026-05-29→31** | **Base** | **~36 h** (15:55 UTC 05-29 → 03:38 UTC 05-31) | **TEE enclave failure** halted the proposer posting state commitments to L1; days after the Azul upgrade | restored | **Block production continued.** Went largely unnoticed because Base withdrawals already carry a 7-day challenge period `reported` |
| **2026-06-25** | **Base** | **116 min** (~16:03–18:00 UTC) | Sequencer block-building bug: stale journal state persisted after a tx validation failure → subsequent valid txs executed against corrupted state → **incorrect receipts root**, invalid block after #47,806,542 | Patched (PR #3806); secondary engine-reset bug (PR #3805); node operators had to restart | `documented` (blog.base.dev postmortem) |
| **2026-06-26** | **Base** | **20–38 min** | **Same bug**, secondary race condition after reset | same patch | `documented` |
| 2026-07-07 | OP Mainnet | ~22 min (17:59–18:22 UTC) | Routine infra upgrade broke a sequencer network connection that **failed silently rather than erroring**; blocks fell outside p2p propagation windows | restored; no reorg | throughput ~zero for ~16 min `observed` |
| 2026-08-08 | Linea | **disputed** | Status page: "critical" outage affecting mainnet block production, restored by sequencer restart | restart | **Contradicted by on-chain data**: a scan of 14,200 blocks across the window found max inter-block gap **121 s**. Operator incident language and chain reality do not reconcile. `observed` |

**Pattern:** every real outage to date has been **shorter than the force-inclusion delay** (24 h Arbitrum, 12 h OP Stack). Force inclusion has therefore never been the operative recovery path — the operator fixing the sequencer always won the race.

---

## B. Censorship, intervention, state rewrite

| Date | Venue | What happened |
|---|---|---|
| **2021-04-09** and **2021-11-11** | **Optimism** | **Two regeneses.** The April one: "transactions history before the regenesis will not be preserved." `reported`. **Empirically confirmed:** OP Mainnet block 1 has timestamp **2021-11-11 21:16:39 UTC** — its canonical chain history simply begins after the final regenesis. Arbitrum One block 1 = 2021-05-28 (full history preserved through Nitro); Base block 1 = 2023-06-15. `observed` 2026-08-13 |
| **Aug 2023 (data deleted)** | **Optimism** | **The most important precedent for your use case.** Optimism's own docs: *"Event and transaction-status data from January to July 2021 was partially lost and cannot be fully recovered."* Three legacy L2Geth data directories were **"errantly deleted during an infra cleanup."** What is gone: **events emitted by smart contracts, and transaction success status.** Raw txs survive on L1 via the CanonicalTransactionChain but reconstruction is *"labor intensive and costly"* with no guarantee. `documented` — docs.optimism.io, verified independently 2026-08-13 |
| 2024-03 | Polygon zkEVM | **~4,000 accepted transactions** "may have been processed in a different block **or may not have been processed**"; affected txs became **no-operation**. `documented` |
| **2024-05** | **Degen Chain + Proof of Play Apex** | Both Orbit L3s **reorged simultaneously** because their shared RaaS provider's config change caused batches to be released after the 24 h inclusion window. Degen's own blog: Conduit *"launched a batch poster update… that was not adequately tested, and did not notify DEGEN of this update in advance"* → 54 h downtime, corrupted state and tx ordering, **$160k user funds lost**, bridge volume −75%. `reported` |
| **2024-06-02** | **Linea** | Only first-party-admitted address censorship. Linea's own words: *"Linea's team made a decision to halt block production by pausing the sequencer and **censor attacker addresses**."* Forward commitment: *"When our network matures to a decentralized, censorship-resistant environment, Linea's team will no longer have the ability to halt block production and censor addresses."* **As of 2026-08-12 that commitment is unmet** — still Stage 0, still "No mechanism," still 0 s upgrade delay. `documented`/`observed` |
| 2024-07 | Scroll | Verbatim: *"we will revert all pending (unfinalized) batches starting from batch index 275119… applications indexing on-chain batch data should make sure they can handle both CommitBatch and RevertBatch events."* **"Committed to L1" ≠ permanent.** `observed` |
| **2025-01-14** | **Soneium** (Sony, OP Stack) | **Contract-level blacklisting on launch day.** Specific memecoin contracts blocked for alleged Sony IP infringement. Mechanism: **RPC-level blocks + explorer "forbidden" alerts + wallet exclusion** — contracts alive on-chain but unreachable via default access paths. Soneium: blacklisting *"only affects specific smart contracts on Soneium's public RPCs."* `reported` |
| 2025-04 | zkSync | 1-of-1 signer key compromise minted ~111M unclaimed ZK (~$5M). Response included **deploying a `TransactionFilterer`** — a live, standing capability to censor L1→L2 messages. `reported` |
| 2025-12-03 | Polygon zkEVM | Migrated to Pessimistic Proofs: **stopped validating full L2 state**. L2Beat now reads State validation **"None — permits invalid state roots"** and Data availability **"External."** A chain that launched as a ZK rollup ended its life neither validating state nor posting data on-chain — **without changing its name or chain ID.** `observed` |

**OFAC filtering: no confirmed instance.** No primary-sourced, dated case of Base, Optimism, Arbitrum, Linea, zkSync, Scroll, or Polygon zkEVM filtering sanctioned addresses at the sequencer. Base's ordering docs contain no mention of filtering. `observed`. Widely-circulating claims that "Base respects OFAC SDN filtering" and "the Arbitrum DAO voted to censor OFAC addresses" trace to a single undated, uncited SEO page that **does not actually contain the Base claim** — treat as false until proven. Note also the threat model shifted: Fifth Circuit ruled against OFAC on immutable contracts 2024-11-26; Tornado Cash delisted 2025-03-21 `reported`.

**The demonstrated risk is discretionary, not sanctions-driven.** Linea censored to stop a hacker; Soneium blacklisted over an IP claim. Neither required a court order.

---

## C. Upgrade power used in anger

| Date | Venue | Action | Disclosed |
|---|---|---|---|
| 2024-03-24 | Polygon zkEVM | **Emergency State** (6/8 multisig) — upgrade without timelock. **"the first time that the Emergency State mechanism has been used."** | after `documented` |
| **2024-09-25** | **Arbitrum** | Security Council (9/12) emergency upgrade to Nitro v3.2.0 across One, Nova, Sepolia — Stylus mispricing DDoS vector, node-crash vector, overcharging bug | **after** `documented` |
| 2025-04-22→25 | Scroll | Security Council fixed an OpenVM soundness bug (colluding sequencer+prover could forge proofs) and a bridge spoof (mint arbitrary tokens). **Also emergency-paused the enforced transaction gateway — the force-inclusion mechanism — for 3 days.** | after (2025-05-02) `documented` |
| 2025-05-26 | Scroll | Emergency verifier update, Plonky3 FRI folding bugs | after `documented` |
| 2025-08-09 | Scroll | Verifier upgrade for the `extcodesize`/7702 bug; ~19 h halt | after, 11 days later `documented` |
| **2025-10-13** | **Arbitrum** | Security Council called `ArbOwner.setWasmMaxStackDepth(22000)` on One + Nova + Sepolia for a Stylus stack-depth divergence bug. **Notified 12:23 pm ET, executed by 2:30 pm ET — same day.** | **after** `documented` |
| 2026-02-23 | Scroll | `ecPairing` missing G2 subgroup check → prover divergence | after (2026-03-06) `documented` |
| **2026-05-24** | **Arbitrum** | Security Council added a hash check in `Bridge.executeCall()` rejecting one specific payload — an inherited `renounceRole()` could have stripped the bridge's `PROPOSER_ROLE` and halted governance. Notified 05-22 00:24 BST, executed 05-24 18:50 BST. | **after** `documented` |
| **2026-06-01** | **Scroll** | **Removed its independent 9-of-12 Security Council**, transferring its roles on both the 3-day and **0-second-delay** timelocks to `ScrollAdminMultisig` — 3-of-4 team members. Scroll **lost L2Beat Stage 1** as a result. | `observed` |

**Optimism/Base:** the OP Stack Guardian pause (blocks all L2→L1 withdrawals Superchain-wide, cannot be targeted, expires after 3 months) has been **tested but no real use is on record** — planned test pauses on OP Sepolia 2024-01-23 and OP Mainnet 2024-02-15, each ~1 hour. Docs contain no record of an actual emergency pause. `observed` — docs.optimism.io + status.optimism.io, checked 2026-08-12/13.

**Every single one of these was disclosed after execution.**

---

## D. The exit-window finding

`observed`, extracted directly from L2Beat's live project pages **2026-08-13**:

| Venue | Exit window | Sequencer failure | Proposer failure | Data availability | Stage |
|---|---|---|---|---|---|
| Arbitrum One | **None** | Self sequence (1 d) | Self propose | Onchain | 1 |
| Base | **None** | Self sequence (12 h) | Self propose | Onchain | 1 |
| OP Mainnet | **None** | Self sequence (12 h) | Self propose | Onchain | 1 |
| Linea | **None** | **No mechanism** | **Cannot withdraw** | Onchain | 0 |
| Scroll | **None** | Self sequence | Self propose | Onchain | 0 (lost Stage 1 on 2026-06-01) |
| ZKsync Era | **None** | **Enqueue via L1 (can't force)** | Replace proposer | Onchain (SD) | 0 |
| Arbitrum Nova | **None** | Self sequence | Self propose | **External (DAC)** | — |
| Polygon zkEVM | — | No mechanism (code exists, **disabled**) | Cannot withdraw | **External** | dead |

**Every single major EVM L2 has Exit window = "None"** — contracts are instantly upgradable. Verbatim for Base: *"There is no window for users to exit in case of an unwanted upgrade since contracts are instantly upgradable. Upgrades need to be approved by 2 parties: the Base Coordinator Multisig and the Base Security Council."* Arbitrum's DAO path gives 10 days (7 d L2 + 3 d L1 + 1 d force), but the Security Council 9/12 emergency path is instant — and it has been used three times.

Linea verbatim: *"There is no mechanism to have transactions be included if the sequencer is down or censoring. **Eventually (after 6 months of no finalized blocks) the Operator role becomes public**, theoretically allowing anyone to post data."* That six-month long-stop is Linea's only escape hatch.

---

## E. Chain death case studies

### The population

`observed` from L2Beat's archived list (2026-08-12): **91 archived scaling projects**, of which by DA layer — Ethereum **37 (41%)**, offchain DAC **35 (38%)**, Celestia 6, none/Plasma 5, custom alt-DA 4, other 3. **59% of dead chains never put their data on Ethereum.** Exit window "None" on **74 of 91 (81%)**. **47 of 91 (52%) were RaaS-hosted** (Conduit 16, Caldera 13, Gelato 7, AltLayer 5, Zeeve 2, Alchemy 2, Gateway 2). **$85.2M still stranded.** Separately, `observed`: **129 of 2,693 chains in chainid.network carry `status: "deprecated"`**.

**Caveat: "archived" on L2Beat means L2Beat stopped tracking, not that the chain is dead.** Swellchain and Degen are archived-or-flagged yet still producing blocks.

### My own liveness probes — `observed` 2026-08-13

I probed documented RPC endpoints, alternates, DNS, and explorers, with live controls (Arbitrum One, Base, OP Mainnet, Ethereum all responded normally, so failures are real).

**Dead — RPC does not respond on any documented endpoint:**
PGN (Public Goods Network), Redstone, Sanko, RARI Chain, Muster, WINR, Game7, Xterio, Mint, Form, Aleph Zero EVM, Ham, Molten, Proof of Play Apex.

**DNS gone entirely (NXDOMAIN):** `mainnet.sanko.xyz`, `muster.alt.technology`, `rpc.winr.games`, `xterio-eth.alt.technology`, `rpc.form.network`, `rpc.alephzero.raas.gelato.cloud`, `explorer.game7.io`, `explorer.form.network`, `muster-explorer.alt.technology`.

**Host explicitly de-provisioned the tenant** — the clearest RaaS-death signature:
- Kinto → `{"error":"message: API key disabled, **reason: tenant disabled**"}`
- Corn → `{"error":"message: API key is not allowed to access blockchain"}`
- Swellchain → `401 Unauthorized`
- PGN, Game7, Proof of Play Apex → DNS still points at Conduit's shared load balancer **34.110.231.171**, which now fails TLS because the cert only covers `*.t.conduit.xyz`. **One decommissioned load balancer is the tombstone for multiple chains.**

**Still alive:** Degen Chain (head 26,959,3xx), Xai, Zora, Arbitrum Nova, Metis, Boba, Aurora, Manta, Fraxtal, Blast, opBNB, Mode.

### Case 1 — Polygon zkEVM: the rollup that stopped being a rollup before it died

The most important case, and it inverts the naive assumption.

- Sunset announced **2025-06-11** `documented`. Reasons: EIP-4844 support delays, ZK counters making DeFi impractical, no differentiation. Promised "forced transactions permanently enabled" but warned *"unsophisticated users should exit before the sequencer stops running"* because forced txs would be difficult.
- **2025-12-03**: migrated to Pessimistic Proofs — stopped validating full L2 state, DA reclassified **External**. `observed`
- **Chain froze at block 33,391,890, last block timestamp 2026-07-03 15:55:44 UTC.** I verified this independently on two providers (`zkevm-rpc.com`, `polygon-zkevm.drpc.org`) — identical head, not advancing. `observed` 2026-08-13
- **The RPC still serves archive-depth reads today** — I successfully read contract storage at block 1,000,000 on the frozen chain. `observed`
- **But the canonical explorer is already gone**: `zkevm.polygonscan.com` → **NXDOMAIN** (while `polygonscan.com` returns HTTP 200); `zkevm.blockscout.com` → 404. **Six weeks after freeze.** `observed`
- Alchemy: *"there is no migration path for Polygon zkEVM, as the network itself was shut down."* `documented`
- EOA balances snapshotted and claimable on L1 until **2027-12-31**, then "considered abandoned." **Assets in smart contracts / LPs cannot be automatically migrated** — Polygon "cannot recover or transfer those assets." `reported`

**The lesson: a chain can silently downgrade its durability guarantee while keeping the same name and chain ID.** Anything written after 2025-12-03 is, by the operator's own classification, not derivable from L1.

### Case 2 — dYdX v3: the one demonstrated multi-year survival

- Shut down **2024-10-28 12:05 UTC**, contracts frozen 2024-10-30. `documented`
- DA = **Onchain**; proposer failure = **"Use escape hatch — users can trustlessly exit by submitting a Merkle proof of funds."**
- dYdX's own commitment was to host read-only historical data *"for at least 1 year"* — i.e. it expired around Oct 2025.
- **I fetched `explorer.dydx.exchange` on 2026-08-13: HTTP 200, live.** Banner: *"dYdX v3 has been discontinued and the exchange contracts are frozen. Use the Escape Hatch functionality to withdraw your funds."* Stats: **24,082 state updates, 3,057 forced transactions**, most recent state update **653 days old**. `observed`
- This works because **L2Beat's open-source StarkEx Explorer rebuilds everything from Ethereum L1** with no operator cooperation.
- **But $32.2M is still stranded** ~21 months later, despite a working escape hatch. Caveat: dYdX v3 published *balances/state updates, not transactions* — positions are recoverable, full tx history is not.

### Case 3 — ZKsync Lite: an escape hatch that was actually used

- **2026-05-04**: block production halted, **exodus mode activated**. 2026-05-12: deposits paused, claim-distribution mode. `observed`
- Funds migrated to a claim distributor (`0x0a14B696350546110a0D8acDb86226983af9D2a0`); users **permissionlessly claim against a Merkle root**. Emergency exit required submitting a ZK proof of funds.
- This is the correct pattern and it is **rare**.

### Case 4 — Redstone: an alt-DA chain that told users their data wasn't coming back

- Lattice announced shutdown **2026-04-15**; chain shut down **2026-05-15 23:59 UTC** — **30 days' notice**. `observed`
- Verbatim: *"Users must withdraw their funds before that date, especially assets held in contracts like **Uniswap pools, which will not be recoverable after shutdown**."*
- OP Stack with **custom alt-DA** (OP Plasma-style DA challenges), fraud proofs never completed.
- **`rpc.redstonechain.com` does not respond on any endpoint I tried.** `observed`

### Case 5 — Astar zkEVM: validium, data gone

- Sunset **2025-03-31** (moved up from April 1). Astar's own words: *"Assets left on Astar zkEVM after this date **may no longer be accessible**."* `reported`
- **Validium, DAC 3/5**, economic security "None," sequencer failure "No mechanism," exit window "None," proposer failure "Cannot withdraw."
- RPC dead; `astar-zkevm.explorer.startale.com` **NXDOMAIN**. `observed`
- **Nothing on Ethereum but hashes. The chain's history is, as far as I can verify, unrecoverable by any public means.**

### Case 6 — PGN: Celestia DA plus a host that stopped hosting

- Announced Jan 2024, EoL **June 2024**; withdrawal deadline June 30. Gitcoin's stated reason: *"Critical infrastructure was missing at launch."* The recap post says **nothing about archival or post-shutdown data access.** `documented`
- OP Stack, **DA = Celestia**, and critically: *"**Sequencer tx roots are not checked against the Blobstream bridge**"* — so even the Celestia commitment wasn't verified on Ethereum. Proposer failure = "Cannot withdraw."
- RPC and explorer both dead behind Conduit's decommissioned load balancer. `observed`

### Case 7 — The 1-of-1 DAC cohort

`observed`: **WINR, Proof of Play Apex/Boss, Game7, Muster, RARI Chain, XCHAIN, Powerloom, Ebi Chain, HYCHAIN, Edgeless, L3X, Onyx, inEVM, Geist** and more — Arbitrum Orbit, DA = DAC, many at **threshold 1/1**, exit window "None," all archived. RARI Chain posts to **Celestia with a 1/1 committee**.

**A 1-of-1 DAC means one machine, run by the operator or its RaaS host, holds the only copy of the chain's transaction history.** Every one I probed has a dead RPC, and several have NXDOMAIN'd domains.

---

## F. Ethereum L1 contrast — and the finding that matters most

### L1 liveness, measured

- **The DAO fork**: block **1,920,000, 2016-07-20**, 3.6M ETH moved, created Ethereum Classic. `documented`. **I read the block on a public RPC today — its `extraData` literally reads `"dao-hard-fork"`.** Still served, 10 years later. `observed` 2026-08-13. *(Two of four public RPCs I tried returned no result for it — even on L1, which provider you use matters for historical reads.)*
- **May 2023 finality delays**: I scanned 700 consecutive blocks around each incident window. **May 11 2023, 19:55–22:26 UTC: max inter-block gap 96 seconds** (~7 missed slots), average 13.0 s vs nominal 12 s. May 12 window: max gap 24 s. **The chain never stopped producing blocks — this was a finality degradation, not a liveness failure.** `observed`
- **Post-Merge liveness, whole period**: I sampled 84 windows of 100,000 blocks each from the Merge (block 15,537,394) to block ~23,990,000. **Worst window: 12.26 s/block against a 12.00 s nominal — a 2.2% deviation. Best: 12.05.** The worst windows are exactly March–May 2023, consistent with the known finality incidents. `observed`. *Honest caveat: 100k-block windows would smooth a contiguous halt of a few hours; this rules out multi-day halts, not short ones. Combined with the fine-grained scan above and no reported L1 halt, it supports "Ethereum L1 has never stopped producing blocks post-Merge."*
- Fork history read from the **live mainnet consensus spec**: Merge epoch 144,896 (2022-09-06), Capella 194,048 (2023-04-12), Deneb 269,568 (2024-03-13), Electra 364,032 (2025-05-07), **Fulu 411,392 (2025-12-03, currently active)**; Gloas not scheduled. `observed`

### The blob finding — this is the headline for a decades-scale project

`observed`, read from the **live Ethereum mainnet consensus spec** 2026-08-13:
```
MIN_EPOCHS_FOR_BLOB_SIDECARS_REQUESTS         = 4096 epochs = 18.20 days
MIN_EPOCHS_FOR_DATA_COLUMN_SIDECARS_REQUESTS  = 4096 epochs = 18.20 days
MIN_EPOCHS_FOR_BLOCK_REQUESTS                 = 33024 epochs = 146.77 days
```

And I checked how the major L2s actually publish today. Every one of them uses **type 0x3 blob transactions**:

| Venue | Batch tx type | Blobs | Calldata bytes |
|---|---|---|---|
| Arbitrum One (`SequencerInbox`) | **0x3** | 3 | 842 |
| Base (`0xFf00…8453`) | **0x3** | 6 | **0** |
| OP Mainnet (`0xFF00…0010`) | **0x3** | 5 | **0** |

Then I tested retrieval of the **first blob ever posted** (versioned hash `0x0175f5…c5cf`, block 19,426,589, **2024-03-13**):
- **Ethereum beacon API → HTTP 403 / no data.** The protocol no longer has it. `observed`
- **Blobscan → returns the actual blob data**, backed by **Google Cloud, WeaveVM/Arweave, and IPFS**. `observed`
- Control: the beacon API happily returned full blob data for a recent slot. `observed`

**So: L2Beat classifies Arbitrum, Base, OP Mainnet, Linea and Scroll as "Onchain" data availability — but "onchain" means *posted to* Ethereum, not *permanently retrievable from* Ethereum. After ~18 days, the raw data needed to reconstruct these chains survives only because volunteers and companies archive it.**

By contrast, **L1 execution-layer calldata persists**: I read block 15,000,000 (2022-06-21) and retrieved all 348 transactions' full calldata — 103,952 bytes — served today. `observed`

Durability ordering, evidenced: **L1 calldata > blobs > Celestia/EigenDA > DAC > nothing.**

### History expiry on L1 itself

- **EIP-4444 is formally "Stagnant"** but **partial history expiry shipped 2025-07-08**: all execution clients support dropping pre-Merge block data (300–500 GB); Nethermind enables it **by default** from v1.32.2. The EF's own framing: the network *"maintain[s] a **1-of-N trust assumption** … that if at least one entity provides the historical blocks, nodes will be able to retrieve the history via **out-of-protocol means**"* — institutional archives, torrents, and voluntary full-history nodes. `documented`

---

## G. Dead onchain data — the testnet natural experiment

`observed` 2026-08-13, DNS + HTTP probes:

| Testnet | Explorer | Status |
|---|---|---|
| Ropsten | `ropsten.etherscan.io` | **NXDOMAIN** |
| Rinkeby | `rinkeby.etherscan.io` | **NXDOMAIN** |
| Kovan | `kovan.etherscan.io` | **NXDOMAIN** |
| **Holesky** | `holesky.etherscan.io` | **NXDOMAIN** (deprecated Sept 2025 `documented`) |
| Goerli | `goerli.etherscan.io` | DNS resolves (Cloudflare), **HTTP fails**; Ankr Goerli RPC blocked |
| Sepolia | `sepolia.etherscan.io` | **HTTP 200** — alive |
| Hoodi | `hoodi.etherscan.io` | HTTP 403 (Cloudflare bot gate — inconclusive) |

Once nobody pays to run a chain, **the explorers vanish within a few years and the domains are released.** Holesky was deprecated ~11 months ago and its explorer domain is already gone.

### Archive-state reads on live chains

Even for healthy chains, historical **state** is not uniformly available on canonical public endpoints. `observed` 2026-08-13:
- **Arbitrum One's official public RPC rejects historical state reads**: `eth_getStorageAt` at block 1,000,000 → `"missing trie node"`. It is not an archive node.
- Base and OP Mainnet public RPCs **did** serve contract storage at block 1,000,000.
- A common public Ethereum L1 endpoint gates archive requests behind a paid token.
- All three L2s **do** still serve historical block *headers* from block 1, including across the Nitro and Bedrock migrations.

---

## H. Force inclusion — how much has actually been used?

**`unknown` for Arbitrum, Optimism, and Base. Nobody has published a count.**

- I attempted to count `forceInclusion()` calls on Arbitrum's SequencerInbox directly. Blockscout's method filter is **broken** — it returns 0 items even for `addSequencerL2BatchFromBlobs`, which I can see in the unfiltered response. **I therefore have no valid count and will not assert one.** The contract has 1,314,595 total inbound transactions. Etherscan returns 403 without an API key. Getting this number requires a custom Dune query nobody appears to have written.
- **The one real number I have is for a StarkEx chain: dYdX v3 shows 3,057 forced transactions** against 24,082 state updates, lifetime. `observed`
- Strong circumstantial evidence that ordinary-user force inclusion was ~zero before 2024: **the Arbitrum DAO funded 42,500 ARB (AIP, 2024-02-14) to WakeUp Labs to build a force-inclusion front-end**, explicitly because non-developer users *"lack that capability."* The shipped tool still **hands users off to a CLI** for the actual force-inclusion step. `observed`
- L2Beat researcher donnoh.eth's "Forced txs vs based sequencing" (2024-06-11), the most relevant analysis, contains **no usage statistics**. `observed`
- **Force inclusion has never been used in anger during an outage**, because every outage has been shorter than the delay. `inferred` from the outage ledger.
- No L2 equivalent of mevwatch.info / censorship.pics exists. `unknown`

**Academic sources found:** "Blockchain Censorship" (arXiv:2305.18545, 2023-05-29) — 46% of Ethereum L1 blocks by censoring actors post-Merge; **does not cover L2s**. "Ethical Risk Analysis of L2 Rollups" (arXiv:2512.12732v1, 2025-12-14) — 32 incidents across 22 L2 projects Jun 2022–Aug 2025: sequencer disruptions 59.4%, bridge/withdrawal 18.8%, exploits 12.5%, **censorship/forced-inclusion failures 9.3%**; **86% of 129 L2Beat projects have instant upgrades with no exit window; 13.2% have no forced-inclusion path at all.**

---

## I. Could not verify

- **Force-inclusion execution counts on Arbitrum / OP Mainnet / Base.** `unknown` — requires a custom Dune query.
- **Shutdown/announcement dates** for RARI Chain, Sanko, Muster, WINR, Proof of Play Apex/Boss, Game7, Corn, Kroma, Mint, Form, Ham, Aleph Zero EVM, Capx, Milkomeda, Canto, Evmos. I have `observed` dead infrastructure but **no dated announcement** for any.
- **Coinbase's "Neutrality Principles for Base"** — HTTP 403 on fetch. Third-party summaries describe a *data-use* commitment, not a non-censorship commitment. **Fetch this yourself.**
- **Soneium's blacklist policy document** — `docs.soneium.org/.../blacklist-policy` returns 404.
- **Whether Base reorged or reverted state in the June 2026 halts.** The "restart your nodes to resume syncing" instruction is *consistent with* a local rollback, but no source confirms it. **Do not assert a Base reorg.**
- **Exact Ropsten / Rinkeby / Goerli shutdown dates** — I have `observed` proof they are dead but not the formal dates. (Holesky: Sept 2025, `documented`.)
- **Nov 2020 Infura/Geth consensus split and Aug 2021 Geth chain split** — not verified this session.
- **Scroll's incident history before ~2026** — `status.scroll.io` → *"This Statuspage was deleted."* The authoritative record no longer exists. Partially recovered via Wayback.
- **Taiko's 2026-06-22 SGX exploit (~$1.7M)** — appears as an L2Beat milestone citing an unfetchable x.com post; Taiko's own status page reports 100% uptime for June 2026. Directionally credible, primary source unconfirmed.
- **Kinto, Canto, Redstone explorer status** — HTTP 403 is Cloudflare bot protection, inconclusive.
- **Polygon zkEVM's precise post-2025-12-03 DA mechanism** — Etherscan needs an API key.
- **Whether any dead chain's data has been archived by a third party** (Arweave/IPFS snapshots, Portal Network) — not investigated. This is the obvious follow-up.

## J. Unverified recollections — do not rely on

- "Base sequencer respects OFAC SDN filtering" — traced to unsourced SEO content that **does not contain the claim**. Treat as false until proven.
- "The Arbitrum DAO voted to censor OFAC-sanctioned addresses" — same source class, no citation, no date. Treat as false until proven.
- "Flashbots' relay censored over 70% of Ethereum blocks" — the peer-reviewed figure is **46%**; do not use 70%.
- "Degen Chain reorged ~500,000 blocks" — one aggregator only; **not** in Degen's own post-mortem.
- "zkSync Era had an October 2023 halt" — searched, **not found**. Verified 2023 halts are Apr 1, Dec 16, Dec 25.
- "A later (2025–26) Linea intervention involving a bridge exploit or token rollback" — **not found.**
- "Optimism's regenesis was November 2021" as a single event — there were **at least two** (Apr 2021, Nov 2021).
- "Blast had a censorship incident 2024-03-26" — appears only in the arXiv incident table; underlying event unverified.
- Any zkSync Era or Scroll **state** rollback (as opposed to Scroll's batch reversion) — nothing found either way. Absence of evidence only.
- That Conduit or Caldera published a de-provisioning policy — I saw the **effects** (dead shared load balancer, NXDOMAIN'd subdomains, "tenant disabled" errors) but found no policy document.

---

**One structural observation, offered as evidence rather than recommendation:** the failure mode with the most precedent behind it is not a chain halting — every halt in this ledger was resolved in hours. It is data that confirmed on-chain and later became unreadable: Optimism's deleted Jan–Jul 2021 event logs (operator's own docs, unrecoverable), Polygon zkEVM's silent shift to external DA seven months before freezing, 35 archived chains whose only copy of history sat behind a DAC that stopped answering, and the ~18-day protocol retention on the blobs that Arbitrum, Base, and OP Mainnet all use today.
