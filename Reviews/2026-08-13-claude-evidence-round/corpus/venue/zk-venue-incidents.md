# Recovered Claude memo — ZK venue incidents

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T04:35:37.934Z
**Claude task:** `a9cbc5ba06d8e1c1e`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3513
**Original result length:** 18912 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
Research complete. Findings below.

---

# ZK-Rollup EVM Venue Incident History
**Check date: 2026-08-12 (some RPC calls executed 2026-08-13 UTC). Every claim tagged.**

## Headline findings

1. **`observed` Polygon zkEVM is dead.** Last block **33,391,890 at 2026-07-03 15:55:44 UTC**. Verified independently on two RPCs (`https://zkevm-rpc.com`, `https://polygon-zkevm.drpc.org`), 2026-08-13. A major ZK-EVM venue stopped existing ~6 weeks ago.
2. **`observed` Every one of these chains is L2Beat Stage 0 today** — including Scroll, which *lost* Stage 1 on 2026-06-01.
3. **`observed` Scroll's public incident history has been deleted.** `status.scroll.io` → `scrollzkp.statuspage.io` returns "This Statuspage was deleted" (2026-08-12). Durable-record risk is not hypothetical.
4. **`documented` Scroll paused its own escape hatch.** April 2025: emergency pause of the *enforced transaction gateway* — the force-inclusion mechanism — for 3 days.
5. **`observed` Operator status pages diverge from chain reality** (see Linea 2026-08-08 below).

---

## 1. Halts and outages

| Chain | Date | Duration | Cause | Resolution | Escape hatch during halt | Tag |
|---|---|---|---|---|---|---|
| **zkSync Era** | 2023-04-01 | not stated | not detailed; post-mortem promised, reportedly never delivered | resumed | none usable | `reported` |
| **zkSync Era** | 2023-12-16 | not stated | not detailed | resumed | none usable | `reported` |
| **zkSync Era** | 2023-12-25 | ~4h (05:50 UTC start; restored ~10:56 CET) | "automated safety protocol triggered by a bug in the server"; edge-case bug in operator state-update computation | resumed; "no funds were ever at risk" | L1 queue exists but sequencer can stop processing it | `reported` |
| **zkSync Era** | 2025-07-30 | partial liveness failure | **proof system manually paused due to a vulnerability** | resumed | — | `reported` (L2Beat milestone) |
| **Polygon zkEVM** | 2024-03-22→24 | **~14h** (down 03-23 09:02 UTC → 03-24 00:03 UTC) | L1 reorg (1–2 blocks) dropped a Global Exit Root deposit tx; synchronizer failed to detect the reorg for >2 epochs (~12 min); bad GER published on L2 | **Emergency State invoked**; node v0.6.4 + prover v6.0.0 deployed 03-24 23:00–23:40 UTC; ~4,000 txs affected, some reorged | force-inclusion existed in code but **disabled** | `documented` |
| **Scroll** | 2024-07-05→06 | **~13h45m** finalization halt (15:21 UTC → 05:04 UTC) | compression bug | **reverted all pending unfinalized batches from index 275119**; explicitly "no L2 chain reorg" | withdrawals delayed | `observed` (archived status page) |
| **Scroll** | 2025-08-08→09 | **~19h** finalization halt (08-08 22:00 → 08-09 17:00 UTC) | EuclidV2 prover completeness bug: `extcodesize` returned 0 in 7702 code paths → sequencer/prover divergence, state-root mismatch | Security Council upgrade 08-09 17:00 UTC; pending chunks/batches **re-proven**, not reverted | withdrawals delayed | `documented` |
| **Linea** | 2024-06-02 | **1h 13m 31s** — block 5,081,800 (00:48:43 UTC) → 5,081,801 (02:02:14 UTC) | **deliberate operator halt** during Velocore exploit | sequencer restarted | **none** — Linea has no force-inclusion | `observed` (on-chain, rpc.linea.build) |
| **Linea** | 2025-09-10 | **1h 6m 24s** — block 23,145,386 (05:25:36 UTC) → 23,145,387 (06:32:00 UTC) | mainnet sequencer performance degradation; hours before the LINEA airdrop | sequencer fix deployed | **none** | `observed` (on-chain) |
| **Linea** | 2026-08-08 | **disputed — see note** | status page: "outage affecting Linea Mainnet block production… restored following a sequencer restart" (posted 11:44 UTC, resolved 08-10 03:56 UTC), impact **critical** | sequencer restart | **none** | `observed` (status page) |
| **Taiko** | 2026-06-22 | n/a (exploit, not halt) | attacker exploited SGX proof system, stole ~$1.7M | — | — | `reported` (L2Beat milestone) |

**Note on Linea 2026-08-08 (`observed`, important):** I scanned every block from 31,639,700 → 31,653,800 (Aug 7 00:00 → Aug 8 ~12:00 UTC, 14,200 blocks) via batched `eth_getBlockByNumber`. **Maximum inter-block gap: 121 seconds.** There is no multi-minute block-production gap in the canonical chain during the window the status page describes as a critical full outage. Either the halt was <2 min, or it affected RPC/edge availability rather than the chain. **Takeaway for a decades-horizon project: operator incident language and on-chain reality do not reconcile, in both directions.**

**Scroll outage count caveat (`unknown`):** a third-party monitor claims 66+ Scroll "outages" in ~1 year, but these are unattributed uptime-monitor blips, not chain halts. Do not rely on that number. Scroll's authoritative history is gone.

**Not found:** no evidence of a zkSync Era **October 2023** halt. The verified 2023 dates are Apr 1, Dec 16, Dec 25.

---

## 2. Interventions — censorship, freezing, reversal

**Linea / Velocore, June 2024 (`documented` + `observed`)**
- Halted between blocks **5,081,800 and 5,081,801**; on-chain gap **4,411 s (1h13m31s)**, 2024-06-02 00:48:43 → 02:02:14 UTC.
- Linea's own words: it would *"halt block production by pausing the sequencer and censor attacker addresses to protect the users and builders"* and *"We also censored the hacker's addresses."*
- Justification: *"the hacker was beginning to sell a large sum of tokens into ETH."* ~$6.8M lost from Velocore; 700 ETH (~$2.6M) bridged out.
- Forward commitment: *"When our network matures to a decentralized, censorship-resistant environment, Linea's team will no longer have the ability to halt block production and censor addresses — this is a primary goal."* Product lead Declan Fox: *"a solid path to decentralising all aspects of the network in a very aggressive time window."*
- **Status of that commitment as of 2026-08-12 (`observed`): not met.** Linea is still Stage 0, still "No mechanism" for sequencer failure, still 0-second upgrade delay.
- Criticism: Mert Mumtaz — *"a clear sign that this is not crypto."* Alex Gluchowski — *"Decentralizing the sequencer isn't optional."*

**zkSync ZK token airdrop compromise, April 2025 (`reported`)**
- 2025-04-13/15: a **1-of-1 signer key** of a ZK airdrop admin multisig was compromised; attacker called `sweepUnclaimed()` on three airdrop distribution contracts, minting ~**111M unclaimed ZK** (~$5M, ~0.45% of supply). Compromised wallet `0x842822c797049269A3c29464221995C56da5587D`.
- **Response included deploying a `TransactionFilterer`** — i.e. a censorship mechanism for L1→L2 messages (`reported`, L2Beat milestone).
- Core protocol, ZK token contract and user funds unaffected. Attacker returned 90% for a 10% bounty; ~$5.7M back with the ZKsync Security Council by 2025-04-23.
- `observed` L2Beat notes the Chain Admin role can perform *"setting a transaction filterer that can censor L1 → L2 messages."* **This is a standing, live capability, not a one-off.**

**Scroll batch reversion, July 2024 (`observed`)**
- Verbatim: *"we will revert all pending (unfinalized) batches starting from batch index 275119. L2 transacions and blocks will not be affected (there will be no L2 chain reorg). However, applications indexing on-chain batch data should make sure they can handle both CommitBatch and RevertBatch events."*
- **Directly relevant to durable-data design:** L1 batch data can be reverted and re-committed. Anything indexing `CommitBatch` must handle `RevertBatch`.

**Polygon zkEVM, March 2024 (`documented`)** — ~4,000 transactions "may have been affected"; some processed in different blocks, some unprocessed. Reorgs on L2, no deliberate censorship reported.

**Polygon zkEVM state validation abandoned, 2025-12-03 (`observed`)** — "Migration to Pessimistic Proofs: Polygon zkEVM stops validating the full L2 state and moves to bridge accounting proofs." L2Beat's risk row then reads **State validation: "None — Currently the system permits invalid state roots. 'Pessimistic' proofs only validate the bridge accounting"** and **Data availability: "External."** A chain that launched as a ZK rollup ended its life neither validating state nor posting data onchain.

---

## 3. Upgrade power used in anger

| Chain | Date | Who | What | Disclosure |
|---|---|---|---|---|
| Polygon zkEVM | 2024-03-24 | **Security Council, 6/8 multisig, two members from Polygon Labs** | **Emergency State** — "allows the network to be upgraded without a timelock." **"the first time that the Emergency State mechanism has been used."** | after (post-mortem) `documented` |
| Scroll | 2025-04-25 | Security Council | Fixed OpenVM circuit soundness bug ("allowing a colluding sequencer and prover to generate invalid proofs") + bridge message-queue spoofing ("mint ETH or arbitrary ERC20 tokens on Scroll"). **Also executed an emergency pause on the enforced transaction gateway contract on 04-22, lifted 04-25 (3 days).** | after (report 2025-05-02) `documented` |
| Scroll | 2025-05-26 | Security Council | Emergency verifier update for Plonky3 FRI folding bugs (missing `beta^2`). "Pending blocks were re-proven and finalized shortly after." | after (report 2025-06-03) `documented` |
| Scroll | 2025-08-09 | Security Council | Verifier upgrade for `extcodesize`/7702 prover bug; ~19h finalization halt | after (report 2025-08-19, 11 days later) `documented` |
| Scroll | 2026-02-23 | Security Council | `ecPairing` missing G2 subgroup check → sequencer/prover divergence, finalization failure. Found via Immunefi bounty. | after (report 2026-03-06) `documented` |
| Scroll | 2026-06-01 | Scroll team | **Removed the independent 9-of-12 Security Council**, transferred its roles on `TimelockSCSlow` (3d) and `TimelockSCEmergency` (0s) to `ScrollAdminMultisig` (3-of-4 team members, `0xcca54B…`), plus admin of L2 `AgoraGovernor` | `observed` |
| Linea | 2026-04-18→21 | Security Council | Finalization halted ~3.5 days. Status page verbatim: **"Release is blocked on required Security Council signatures."** | during `observed` |
| zkSync | 2025-04 | Security Council / governance | TransactionFilterer deployed after key compromise | after `reported` |

**Standing emergency powers (`observed`, L2Beat, 2026-08-12):**
- **zkSync Era:** emergency path = **`EmergencyUpgradeBoard`, a 3/3 multisig of SecurityCouncil + Guardians + FoundationMultisig, with zero delay.** Standard path 4d3h (or 8d3h with Guardian veto extension); 1mo4d if Security Council does not approve. **SecurityCouncil can freeze (pause withdrawals and settlement) all chains on the ChainTypeManager** — softFreeze 12h or hardFreeze 7d; only the SecurityCouncil can unfreeze.
- **Linea:** `Timelock` **"current minimum delay is 0s"**; proposer/executor/canceller all ultimately Linea Security Council. Linea Multisig 2 is 3/5 with a 3-month Delay module, and **can assign "reserved" status to tokens to prevent them being bridged**.
- **Scroll:** all core contracts upgradable by `ProxyAdmin` ← `ScrollOwner` ← four timelocks, two now controlled by the 3-of-4 `ScrollAdminMultisig` including a **0-second-delay emergency timelock**. `PauseController` lets the team **pause batch commitment and finalization**.

---

## 4. Decentralization status — checked 2026-08-12

| | Linea | Scroll | zkSync Era | Polygon zkEVM | Taiko Alethia |
|---|---|---|---|---|---|
| **Stage** | **0** | **0** (was Stage 1 from 2025-04-24; lost 2026-06-01) | **0** | *not listed / chain dead* | **0** |
| **State validation** | Validity proofs (SN) | Validity proofs (ST, SN) | Validity proofs (ST, SN), 3h execution delay | **None — "permits invalid state roots"** | Validity proofs (2 of SGX-Geth/SGX-Reth/SP1/RISC0, ≥1 SP1 or RISC0) |
| **Data availability** | Onchain (full tx data, not state diffs) | Onchain | Onchain (state diffs) | **External** | Onchain |
| **Sequencer failure** | **No mechanism** | Self sequence (up to 7d delay) | Enqueue via L1 (can't force) | No mechanism (code exists, **disabled**) | Enqueue via L1 (can't force) |
| **Proposer failure** | Cannot withdraw | Self propose | Replace proposer | Cannot withdraw | Cannot withdraw |
| **Exit window** | **None** | **None** | **None** (emergency); 4d3h regular | **None** | **None** |
| **Upgrade delay** | **0s** | 0s emergency timelock | 0 (emergency path) | — | — |
| **TVS** | $338.89M | $41.63M | $192.75M | — | $10.53M |

Stage-1 blockers, verbatim (`observed`):
- **Linea:** withdrawals censorable by permissioned operators; <7d exit window; **"Security Council members are not publicly known."**
- **Scroll:** withdrawals censorable; <7d exit window; the 2026-06-01 Security Council replacement **"does not meet the size or organisational-diversity requirements of a Security Council."**
- **zkSync Era:** withdrawals censorable; upgrades by actors more centralized than a Security Council.
- **Taiko:** withdrawals censorable; <7d exit window; **"The Security Council is not properly set up."**

**Proof systems:** Linea's became complete 2024-06-09 ("covers 100% of the zkEVM") but proposing stays whitelisted. Scroll and zkSync run live validity proofs; **none of the five is permissionless in proposing.** Taiko's 2026-08-03 Unzen upgrade requires ≥1 SP1/RISC0 validity proof per proposal range, but proving is gated by `ProverWhitelist` and proposing by `PreconfWhitelist`.

**Long-stop clauses (`observed`):** Linea — *"after 6 months of no finalized blocks the Operator role becomes public, theoretically allowing anyone to post data."* That is the only Linea escape hatch, and it is a six-month one.

---

## 5. Polygon zkEVM sunset — confirmed

- `documented` Announced **2025-06-11** on the Polygon forum. Reasons: EIP-4844 support delays, ZK counters making DeFi transactions impractical, lack of differentiation, inability to adapt. Sequencer to run 12 more months with "forced transactions permanently enabled."
- `documented` Caveat in the same post: *"No funds will be lost — users will always have the ability to withdraw bridged assets,"* but **"unsophisticated users should exit before the sequencer stops running"** because forced transactions are expected to be difficult.
- `observed` **Actual last block: 33,391,890, 2026-07-03 15:55:44 UTC.** Chain is not producing blocks.
- `reported` Sequencer sunset date **2026-07-01**; wallet-held (EOA) balances snapshotted and auto-migrated to Ethereum L1, claimable via a Polygon zkEVM Claims interface until **2027-12-31**, after which unclaimed assets are "considered abandoned."
- `reported` **Assets in smart contracts / LPs / DeFi cannot be automatically migrated** — Polygon "does not own or control decentralized applications operating on the network and therefore cannot recover or transfer those assets." Contract-held state may be permanently inaccessible.
- `documented` Alchemy: **"There is no migration path for Polygon zkEVM, as the network itself was shut down."** Both mainnet and Cardona testnet endpoints dropped.
- `observed` L2Beat still lists a Polygon zkEVM project page but it carries no Stage badge and does not appear on `/scaling/summary`; it is also **not** on `/scaling/archived` as of 2026-08-12.

---

## 6. Escape-hatch reality (the decisive question for decades-scale data)

- **Linea — no escape hatch.** No force-inclusion at all. If the sequencer censors or stops, you wait 6 months for the Operator role to open. Upgrade delay 0s, exit window None. Linea proved willing to censor addresses and halt the chain (June 2024) and has not given up that power.
- **Scroll — nominally the best (self-sequence + self-propose), but demonstrably revocable.** Scroll paused the enforced transaction gateway for 3 days in April 2025, and on 2026-06-01 handed emergency (0-delay) upgrade rights to a 3-of-4 team multisig.
- **zkSync Era — "enqueue via L1" is not force-inclusion.** L2Beat verbatim: *"Users can submit transactions to an L1 queue, but can't force them… the sequencers can stop processing the queue entirely."* Plus a Security Council freeze power (12h soft / 7d hard) and a 0-delay 3/3 emergency board.
- **Polygon zkEVM — force-inclusion was in the code and disabled**, right up to the chain's death.
- **Taiko — enqueue via L1, cannot force; proposer failure = cannot withdraw.**

Also durability-relevant: **Scroll's July 2024 revert of 55+ committed L1 batches** means "committed to L1" ≠ "permanent" — indexers must handle `RevertBatch`. And **Scroll's status page deletion** means the incident record itself did not survive two years.

---

## 7. Unverified recollections — do not rely on

- **zkSync Era October 2023 halt** — searched; found no such incident. Verified 2023 halts are Apr 1, Dec 16, Dec 25. `unknown`
- **A later (2025–2026) Linea intervention involving a bridge exploit or token-related rollback** — **not found.** L2Beat lists only one Linea incident milestone after Velocore (2025-09-10 halt). Linea's status page (50 most recent incidents, back to ~2025-11-19) shows finalization/RPC/bridge-frontend outages but **no rollback, no censorship, no reversal**. Treat as unverified. `unknown`
- **Polygon zkEVM halts other than March 2024** — none found in L2Beat milestones or the Polygon forum. Absence of evidence only; Polygon zkEVM's records are now orphaned. `unknown`
- **Polygon zkEVM "prover failures" as distinct incidents** — the March 2024 event bundled a prover+verifier upgrade, but I found no standalone prover-failure incident. `unknown`
- **Taiko 2026-06-22 SGX proof exploit (~$1.7M)** — appears as an L2Beat incident milestone citing an x.com post I could not fetch (HTTP 402). Taiko's own status page reports **"No notices reported this month"** for June 2026 and 100% uptime across all components. Directionally credible, primary source unconfirmed. `reported`
- **Scroll's "66+ outages"** from a third-party uptime aggregator — unattributed, not chain halts. `unknown`

---

## Method and limitations

Sources fetched: L2Beat project pages for all five chains (parsed from embedded JSON, 2026-08-12), L2Beat `/scaling/risk`, `/scaling/summary`, `/scaling/archived`; Polygon community forum post-mortem and sunset announcement; Scroll governance forum emergency-upgrade reports (2025-04-25, 2025-05-26, 2025-08-08, 2026-02-23) and Discourse search API; Linea Statuspage API (`linea.statuspage.io/api/v2/incidents.json`, 50 incidents); Scroll's deleted Statuspage recovered via Wayback (snapshot 2026-02-16); Taiko status page; live JSON-RPC against `rpc.linea.build`, `zkevm-rpc.com`, `polygon-zkevm.drpc.org`.

Blocked/unavailable: x.com (HTTP 402), `zksync.mirror.xyz` (Cloudflare), Blockworks (403), Scroll's live status page (deleted), Linea Statuspage history beyond ~2025-11-19, no public zkSync status page exists (probed six candidate hostnames). WebSearch budget (200 calls) was exhausted mid-task by the session; the second half of this research was done via direct fetch and on-chain queries, which is why the Linea and Polygon zkEVM figures are `observed` rather than `reported`.
