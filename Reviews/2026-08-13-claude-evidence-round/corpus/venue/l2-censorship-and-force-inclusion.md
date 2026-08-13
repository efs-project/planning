# Recovered Claude memo — L2 censorship and force inclusion

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T04:33:12.060Z
**Claude task:** `a856e2d5d02583db5`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3491
**Original result length:** 27639 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
Research complete. Search budget was exhausted mid-way, but I completed the work via direct fetches. All checks below were performed **2026-08-12**.

---

# Censorship resistance of Ethereum L2s — empirical findings

## ⚠️ First, a source-quality warning

Several search results surfaced confident claims like *"The Base sequencer respects OFAC SDN list filtering, with sanctioned addresses excluded from sequencer-included blocks"* and *"the Arbitrum DAO voted to censor OFAC-sanctioned addresses from its sequencer."*

I traced these to `chainscorelabs.com`. I fetched the page (`observed`, https://chainscorelabs.com/en/blog/layer-2-wars-arbitrum-optimism-base-and-beyond/sequencer-economics-and-decentralization/why-sequencer-censorship-is-the-next-big-l2-battlefield). Findings: byline "Prasad Kumkar, ChainScore Labs", **no publication date**, **no citations or links** for any OFAC claim, and — critically — **the page does not actually contain the Base OFAC claim at all**. Base is mentioned once, only as running "a single, permissioned sequencer." The search-result summarizer appears to have confabulated the specific claim.

**Treat "Base/Arbitrum filter OFAC addresses at the sequencer" as unsupported.** I found no primary evidence for it (see Q1).

---

## Q1 — OFAC / sanctions filtering at L2 sequencers

### Confirmed instance of an L2 sequencer censoring specific addresses: Linea, June 2024

This is the strongest documented case, and it is **first-party admitted**.

- `reported` (two independent outlets quoting Linea): On **2 June 2024**, Consensys' Linea halted block production and censored a hacker's addresses following the Velocore DEX exploit (~700 ETH / $2.6M; some outlets report $6.8–10M total).
- Linea's own words, quoted: **"Linea's team made a decision to halt block production by pausing the sequencer and censor attacker addresses to protect the users and builders in our ecosystem."** — `reported`, https://www.theblock.co/post/298062/linea-decentralization-velocore-hack (checked 2026-08-12)
- Mechanism specificity: **"The sequencer was paused from block 5081800 and 5081801."** — `reported`, https://cryptoslate.com/linea-under-scrutiny-for-unilateral-block-production-halt-amid-velocore-hack/ (checked 2026-08-12)
- Linea's forward commitment: *"When our network matures to a decentralized, censorship-resistant environment, Linea's team will no longer have the ability to halt block production and censor addresses."* — `reported`, same source.

Note: this was **not** OFAC-driven; it was operator discretion against a hacker. For your purposes that's arguably worse evidence, not better — it establishes both capability and willingness, on a discretionary trigger, with no legal compulsion required.

### OFAC/sanctions filtering specifically: no confirmed instance found

- `unknown` — I found **no primary-sourced, dated instance** of Base, Optimism, Arbitrum, Linea, zkSync Era, Scroll, or Polygon zkEVM filtering OFAC-sanctioned addresses at the sequencer.
- `observed` — Base's official docs on transaction ordering contain **no** mention of filtering, exclusion, censorship, or compliance-based exclusion; ordering is described purely as priority fee + arrival time within 200ms Flashblocks. https://docs.base.org/base-chain/network-information/transaction-ordering (checked 2026-08-12)
- `observed` — Arbitrum's docs acknowledge only the *capability*: **"If the Sequencer acts maliciously, it could reorder or censor certain transactions before they achieve hard finality."** No Offchain Labs policy statement on filtering appears in the docs. https://docs.arbitrum.io/how-arbitrum-works/sequencer and https://docs.arbitrum.io/how-arbitrum-works/deep-dives/sequencer (checked 2026-08-12)

### Coinbase / Base stated positions — partially retrievable

- `unknown` — **Coinbase's "Neutrality Principles for Base" blog returned HTTP 403** to my fetch (https://www.coinbase.com/blog/coinbases-neutrality-principles-for-base, attempted 2026-08-12). I could not verify its contents firsthand. Third-party summaries describe commitments about not using sequencer-derived transaction-ordering data for business purposes — that is a *data-use* commitment, **not** a non-censorship commitment. Do not rely on my second-hand read; fetch this yourself from a browser.
- `documented` — Coinbase's exchange-level OFAC policy (blocking deposits from sanctioned addresses) is real and published, but it governs the **custodial exchange**, not the Base sequencer. https://help.coinbase.com/en/coinbase/other-topics/legal-policies/ofac
- `observed` — Base *does* document an app-flagging pipeline, run by **Blockaid** and surfaced in **Coinbase Wallet**, with an appeals path at report.blockaid.io/mistake. The docs do **not** state whether flagging has any sequencer or RPC consequence — only wallet-surface consequences are implied. https://docs.base.org/base-chain/security/avoid-malicious-flags (checked 2026-08-12)

### Measurement studies

- `observed` — **"Blockchain Censorship"** (Wahrstätter, Ernstberger, Yaish, Zhou, Qin, Tsuchiya, Steinhorst, Svetinovic, Christin, Barczentewicz, Gervais), arXiv:2305.18545, submitted 2023-05-29. Finds **46% of Ethereum blocks were made by censoring actors**, and censored-transaction inclusion delayed by an average of **85%** post-Merge. **The abstract does not mention L2s or rollups at all.** https://arxiv.org/abs/2305.18545 (checked 2026-08-12)
- `unknown` — **I found no L2 equivalent of mevwatch.info / censorship.pics.** No dashboard measuring per-L2 sequencer censorship rates surfaced in any search. If one exists it is not discoverable via ordinary search.
- `observed` — **"Ethical Risk Analysis of L2 Rollups"**, arXiv:2512.12732v1, published **2025-12-14**. Hand-curated incident dataset: **32 incidents across 22 L2 projects, June 2022 – August 2025**. Breakdown: sequencer disruptions 59.4% (19), bridge/withdrawal 18.8% (6), security exploits 12.5% (4), **censorship/forced-inclusion failures 9.3% (3)**. Named censorship incidents: **Blast (2024-03-26)** and **Soneium (2025-01-14)**. Also: 86% of 129 L2Beat projects have instant upgrades without exit windows; **13.2% have sequencer failure with no forced-inclusion path**. https://arxiv.org/html/2512.12732v1 (checked 2026-08-12)
  - *Caveat:* I did not independently verify the Blast 2024-03-26 entry. Treat as `reported` pending your own check.

### Relevant legal shift (materially changes the OFAC threat model)

- `reported` (Wikipedia, with citations; **Treasury's own site timed out on three fetch attempts**): Tornado Cash sanctioned **2022-08-08**; **US Fifth Circuit, 2024-11-26**, held that immutable smart contracts are not "property" under IEEPA and OFAC lacked authority to sanction them; **OFAC delisted Tornado Cash 2025-03-21**. https://en.wikipedia.org/wiki/Tornado_Cash (checked 2026-08-12)
- **Verify this against home.treasury.gov yourself** — it's load-bearing for any long-horizon regulatory assumption and I could not reach the primary source.

---

## Q2 — Force inclusion in practice

### Mechanisms and delays (all `documented`)

| Chain | Mechanism | Delay | Source |
|---|---|---|---|
| Arbitrum One | `forceInclusion()` on `SequencerInbox` via DelayedInbox | **~24 hours** | docs.arbitrum.io |
| OP Mainnet / Base | `depositTransaction()` on `OptimismPortal` | **12 hours** (sequencing window) | docs.optimism.io |

- `documented` — OP Stack: *"the `sequencer_window` (set to 12 hours by default but may differ from chain to chain)"*; **"A core security goal of OP Stack chains is that the Sequencer should not be able to prevent users from submitting transactions."** https://docs.optimism.io/stack/rollup/outages (checked 2026-08-12)
- `documented` — OP Stack forced-transaction page: deposits included within **30 min** in normal operation ("Max Time Drift: 30 minutes"); after 12h, *"nodes begin generating blocks deterministically, incorporating only the forced-included transactions."* Explicit caveat: **"Actions remain speculative for up to 12 hours due to the sequencing window."** https://docs.optimism.io/op-stack/transactions/forced-transaction.md (checked 2026-08-12)
- `documented` — OP Stack derivation spec: *"The final requirement that each epoch must have at least one L2 block ensures that all relevant information from the L1 (e.g. deposits) is represented in the L2."* This is the structural guarantee — a censoring sequencer's chain gets **reorged out** by honest nodes. https://specs.optimism.io/protocol/derivation.html (checked 2026-08-12)
- `documented` — Arbitrum has a **"Censorship Timeout"** feature that dynamically reduces the force-inclusion threshold during prolonged censorship, because a naive 24h-per-move delay would mean *"if a challenge takes 50 sequential moves to resolve, then the delay would be 50 days."* https://docs.arbitrum.io/how-arbitrum-works/deep-dives/sequencer (checked 2026-08-12)
- ⚠️ **Correction to your premise:** OP Stack / Base is **12 hours**, not 12 minutes. The ~12-minute figure does not appear anywhere; the 30-minute figure is the *normal-operation* deposit inclusion time, not the censorship-resistance guarantee.

### How many force inclusions have actually executed on mainnet?

**`unknown` — explicitly.** No public count exists that I could find.

- No Dune dashboard tracking `forceInclusion()` calls on Arbitrum's SequencerInbox or forced `depositTransaction` calls on OptimismPortal surfaced in search.
- Etherscan returned **HTTP 403** to direct fetch (attempted on `0x1c479675ad559DC151F6Ec7ed3FbF8ceE79582B6`, 2026-08-12), so I could not observe on-chain counts directly.
- `observed` — L2Beat researcher **donnoh.eth**, "Forced txs vs based sequencing" (2024-06-11), the most relevant analysis piece, provides **no statistics on force-inclusion frequency**. https://scalability.guide/posts/forced_vs_based/ (checked 2026-08-12)

**If you need this number, it requires a custom Dune query. Nobody has published one.**

### Has force inclusion been used in anger during an outage? — `unknown`, with strong circumstantial evidence it has *not* been usable by ordinary users

- `observed` — Arbitrum AIP, **2024-02-14**, proposer Gonzacolo / **WakeUp Labs**, funded **42,500 ARB** to build a force-inclusion front-end, explicitly because the mechanism was inaccessible: non-developer users *"lack that capability"*; goal to *"demystify and simplify access to these mechanisms."* Status: **Finalized AIP** (approved). https://forum.arbitrum.foundation/t/tally-front-end-interface-to-force-transaction-inclusion-during-sequencer-downtime/21247 (checked 2026-08-12)
  - **A DAO paying to build this in 2024 is strong evidence that force inclusion had essentially no ordinary-user usage before then.**
- `observed` — The resulting tool shipped as **`wakeuplabs-io/arbitrum-connect`** (78 commits, production app live). Notably, its emergency path *"guide[s] you to use a CLI tool to bypass the sequencer"* — i.e. **even the purpose-built UI hands you off to a CLI for the actual force-inclusion step.** No usage stats published. https://github.com/wakeuplabs-io/arbitrum-connect (checked 2026-08-12)
- `observed` — the eRA paper's assessment: *"many incidents involve outages or congestion where a forced path either existed but had parameters or operational requirements that made it impractical for ordinary users."* arXiv:2512.12732v1
- `reported` — During Arbitrum's **December 2023** 78-minute outage (inscription/calldata spam), no force-inclusion usage was reported. The 24h delay exceeds the outage length by ~18x, so force inclusion was structurally irrelevant. https://dedaub.com/blog/arbitrum-sequencer-outage/

**Read-through:** every real L2 outage to date has been *shorter* than the force-inclusion delay. Force inclusion has therefore never been the operative recovery path — the operator fixing the sequencer always won the race. Force inclusion is untested in anger.

---

## Q3 — Reordering, reversal, rollback, rewriting of state

### Confirmed: Optimism regenesis — and permanently lost data

This is the most important finding for a decades-durable read requirement.

- `reported` — **First regenesis: 2021-04-09**, mainnet down 12 hours. *"transactions history before the regenesis will not be preserved."* State/balances preserved; history not. Rationale: *"Since mainnet is still in alpha mode and not yet open to the public, we made this tradeoff in order to move quickly, reduce technical debt and improve security."* https://chainbulletin.com/optimism-mainnet-upgrade-to-erase-all-transaction-history (article dated 2021-04-14, checked 2026-08-12)
- `reported` — **Final/EVM-equivalence regenesis: 2021-11-11** (delayed from late October). Network state preserved, redeployed under a new genesis block. https://twitter.com/optimismfnd/status/1451339513964359682
- `documented` — **Data permanently lost.** Optimism's own docs: three data directories used by legacy L2Geth sequencer instances covering **January 2021 – July 2021** were **"errantly deleted during an infra cleanup in August 2023."** What is gone: **"events emitted by smart contracts during each transaction and the success state of the transaction."** Raw transaction data survives on L1 via the CanonicalTransactionChain, but reconstruction would be *"labor intensive and costly"* with no guarantee of success. https://docs.optimism.io/op-mainnet/pre-bedrock-history/lost-pre-regenesis-data.md (checked 2026-08-12)
  - **Directly relevant to your project:** on OP Mainnet, event logs from a 7-month window are *unrecoverable*. If your read path depends on events/logs rather than calldata, this is the concrete precedent for "confirmed on-chain, unreadable later."
- `documented` — Optimism maintains separate "Legacy Geth" infrastructure to serve pre-Bedrock historical traces, i.e. **old history requires special, separately-operated infrastructure.** https://docs.optimism.io/node-operators/guides/configuration/legacy-geth.md

### Confirmed: Degen Chain (Arbitrum Orbit L3, settles to Base) — reorg with fund loss

- `reported` (first-party, Degen's own blog) — **May 2024.** Sequencer operator **Conduit** *"launched a batch poster update in May that was not adequately tested, and did not notify DEGEN of this update in advance."* Result: **54 hours of downtime**, corrupted chain state and transaction ordering, **$160k in lost user funds**, bridge volume down 75%+ over the following month. https://blog.degen.tips/a-frustrated-migration (checked 2026-08-12)
- `reported` — Two Conduit chains (Degen and Proof of Play Apex) stopped posting batches >24h; on resumption, *"the first batches triggered reorgs on both chains."* Nodes resynced from genesis. https://blockworks.com/news/degen-layer-3-chain-outage
- `reported`, **treat as unconfirmed** — one aggregator cites a reorg of "approximately 500,000 blocks." Degen's own post-mortem does not state a block count. Do not cite the 500k figure without verification.

### Confirmed: Polygon zkEVM — reorg + emergency state, transactions dropped

- `documented` (official Polygon forum post-mortem) — **2024-03-22 to 2024-03-24**, ~14 hours. Root cause: an **L1 reorg** the synchronizer *"did not correctly detect"*; the record wasn't cleared from the State DB *"for over two epochs, approximately 12 minutes."* Sequencer then included an incorrect Global Exit Root, creating a divergence where **"the actual state of the network was different from the one that was published."**
  - **~4,000 transactions affected**; those on Mar 22–23 *"were affected by a network reorg and may have been processed in a different block **or may not have been processed**."* Affected transactions became **"no-operation."**
  - The **Emergency Council (6/8 multisig)** activated "emergency state," which allows *"the network to be upgraded without a timelock."* https://forum.polygon.technology/t/polygon-zkevm-recent-network-outage-report/13702 (checked 2026-08-12)
  - **This is a confirmed case of a major L2 dropping user transactions that had been accepted.**

### Confirmed: Base — chain halts, June 2026

- `reported` — **2026-06-25, 16:03 UTC**, Base halted block production after an invalid block *"essentially choked up the sequencer after block 47806542."* Duration ~2 hours (one source: 116 min; L2Beat liveness recorded zero data submissions 16:05–17:23 UTC vs. a normal ~46s interval). https://www.coindesk.com/tech/2026/06/25/coinbase-s-base-blockchain-resumes-after-two-hour-outage-disrupted-network (checked 2026-08-12)
- `reported` — **Second stall 2026-06-26, 15:33–16:11 UTC (~38 min)**, "similar symptoms," attributed to a secondary race condition after reset. Occurred around the **Beryl hardfork** (20:00 UTC Thursday). Base instructed: *"Node operators will need to restart their Base Mainnet nodes in order to resume syncing."* Jesse Pollak stated root cause identified and fixed; no user funds at risk. https://www.theblock.co/amp/post/406409/base-suffers-second-mainnet-stall-in-two-days (checked 2026-08-12)
- `unknown` — **whether any Base blocks were reorged or state reverted.** Reporting does not say. The "restart nodes to resume syncing" instruction is *consistent with* a local rollback of the invalid block, but I did not find a statement confirming it. Do not assert a Base reorg.
- `reported` — a prior Base outage occurred **August 2025, ~29 minutes** (per CoinDesk's background). I did not verify this independently.

### Reversing a hack

- `reported` — **Linea, 2024-06-02**: the closest case. Linea did **not** reverse state, but it **halted the chain and censored the attacker's addresses mid-exploit**, preventing ~$6.8M from being bridged out. (Sources under Q1.)
- `unknown` — I found **no** case of an Ethereum L2 reversing a completed hack by rewriting state. Do not assume one exists.

### Not found / not checked

- `unknown` — any zkSync Era or Scroll state rollback. Nothing surfaced; absence of evidence only.

---

## Q4 — Freezing or blacklisting a specific CONTRACT

### Confirmed: Soneium (Sony, OP Stack), January 2025

- `reported` — **2025-01-14, mainnet launch day.** Soneium blacklisted **specific memecoin contract addresses** for alleged Sony IP infringement, including "Aibo" (named after Sony's robot dog, ~$700k). https://www.theblock.co/post/334414/sonys-soneium-blockchain-faces-backlash-over-alleged-blacklisting-of-memecoins-on-launch-day (checked 2026-08-12)
- `reported` — **Mechanism: RPC-level blocks + block-explorer "forbidden"/"No Access" alerts + wallet exclusion** — *not* documented as sequencer-level exclusion. Soneium's position: blacklisting *"only affects specific smart contracts on Soneium's public RPCs,"* and users *"retain the ability to access the chain through alternative methods."*
- `reported` — Impact claims: Time.fun founder Kawz claimed **>$100k** in investor losses. pump.fun's Alon: the chain was *"actively blacklisting memecoins they don't like, instantly nuking everyone's position to 0."*
- Soneium's own statement referenced its documentation: *"Our documentation outlines how we safeguard IP rights and combat malicious activities."* — `unknown`: **I could not retrieve the actual policy document.** `docs.soneium.org` root returned no policy links; `/docs/builders/support/blacklist-policy` returned 404 (both attempted 2026-08-12). Find the current URL yourself if this matters.
- Independently corroborated as a censorship incident by arXiv:2512.12732v1's incident dataset (`observed`).

**This is the single most relevant precedent for your project.** It is contract-level, not address-level; it was triggered by an IP claim, not sanctions; it happened on **day one** of the chain; and it made contracts unreachable through the default access path while leaving them technically alive on-chain. That is precisely the "confirms but unreadable" failure shape.

### Base

- `observed` — Base documents contract flagging via **Blockaid**, surfaced through **Coinbase Wallet**, with an appeals process. The docs do not state that flagging blocks RPC or sequencer access. https://docs.base.org/base-chain/security/avoid-malicious-flags (checked 2026-08-12)
- `unknown` — whether Base has ever RPC-blocked or sequencer-blocked a contract. No instance found.

---

## Q5 — L2Beat current stages and risk rows

### Stages — `observed` via https://l2beat.com/api/scaling/summary, checked **2026-08-12**

| Project | Stage |
|---|---|
| **Arbitrum One** | **Stage 1** |
| **Base** | **Stage 1** |
| **OP Mainnet** | **Stage 1** |
| **Linea** | **Stage 0** |
| **Scroll** | **Stage 0** |
| **ZKsync Era** | **Stage 0** |
| **Polygon zkEVM** | **not present in the summary list** |

Others of note: Starknet, Unichain, Ink = Stage 1. Everything else in the top ~33 is Stage 0 or "Not applicable" (Hyperliquid, Polygon PoS, Gnosis Chain, X Layer, edgeX, ApeX Omni).

Polygon zkEVM: `unknown`. Not in the summary list, and **not** in L2Beat's archived list (69 archived projects, checked 2026-08-12). Its GitHub config still exists with milestones through a pessimistic-proofs migration. I could not determine its current classification — the project page is a JS SPA that truncated on fetch. **Resolve this yourself before relying on Polygon zkEVM.**

### Risk rows — `observed` via https://l2beat.com/scaling/risk, checked **2026-08-12**

| Project | Sequencer failure | Proposer failure |
|---|---|---|
| **Arbitrum One** | Self sequence — **1d delay** | Self propose |
| **Base** | Self sequence — **12h delay** | Self propose |
| **OP Mainnet** | Self sequence — **12h delay** | Self propose |
| **Linea** | **No mechanism** | **Cannot withdraw** |
| **Scroll** | Self sequence | Self propose |
| **ZKsync Era** | **Enqueue via L1** | Replace proposer |
| **Polygon zkEVM** | not shown in the rollups table |

*Extraction caveat: these came through a page-summarizing model reading the rendered SPA, not raw DOM. High confidence, but spot-check Linea and ZKsync yourself given how consequential they are.*

### What those categories mean — `documented`, from L2Beat's own source

https://raw.githubusercontent.com/l2beat/l2beat/main/packages/config/src/common/riskView.ts (checked 2026-08-12)

- **`SEQUENCER_SELF_SEQUENCE`**: *"In the event of a sequencer failure, users can force transactions to be included in the project's chain by sending them to L1."*
- **`SEQUENCER_ENQUEUE_VIA`** (ZKsync Era): *"Users can submit transactions to an [L1] queue, but **can't force them**. The sequencers cannot selectively skip transactions but **can stop processing the queue entirely**."*
- **`SEQUENCER_NO_MECHANISM`** (Linea): *"There is **no mechanism** to have transactions be included if the sequencer is down or censoring."*
- **`PROPOSER_CANNOT_WITHDRAW`** (Linea): *"Only the whitelisted proposers can publish state roots on L1, so in the event of failure **the withdrawals are frozen**."*
- **`PROPOSER_SELF_PROPOSE_ROOTS`**: *"Anyone can be a Proposer and propose new roots to the L1 bridge."*

### Ranking for a decades-horizon write path

**Only Arbitrum One, Base, and OP Mainnet combine Stage 1 with a real force-inclusion path and permissionless proposing.** Scroll has the mechanisms but is Stage 0.

**Linea is the outlier and should be disqualified for this use case**: `SEQUENCER_NO_MECHANISM` + `PROPOSER_CANNOT_WITHDRAW` + Stage 0 + the only chain whose team has *admitted in writing* to censoring addresses. There is no L1 escape hatch. If the Linea sequencer stops or censors you, you have no recourse at all.

### One flag worth confirming — Base exit window

- `observed` (L2Beat source config, `main` branch) — the only `riskView` entry in Base's own config file reads: **"There is no window for users to exit in case of an unwanted upgrade since contracts are instantly upgradable."** It also notes: *"The single Sequencer actor can be modified by `Base Multisig 1` via the SystemConfig contract."* https://raw.githubusercontent.com/l2beat/l2beat/main/packages/config/src/projects/base/base.ts (checked 2026-08-12)
- **Caveat:** this is a source file that may contain conditional branches I didn't fully resolve, and it may lag the live site. Confirm against l2beat.com/scaling/projects/base before treating "no exit window" as current fact. If it *is* current, it means a Base contract upgrade can land with zero notice — a material risk over a decades horizon.

---

## Unverified recollections — do not rely on

- "Base sequencer respects OFAC SDN list filtering" — **traced to unsourced AI-SEO content; the cited page does not even contain the claim. Treat as false until proven.**
- "The Arbitrum DAO voted to censor OFAC-sanctioned addresses from its sequencer" — **same source class, no citation, no date. I found nothing supporting it. Treat as false until proven.**
- "Flashbots' OFAC-compliant relay censored over 70% of Ethereum blocks" — appears in the same uncited article. The peer-reviewed figure from arXiv:2305.18545 is **46%** of blocks by censoring actors. The 70%+ figure may reflect a different metric or a transient peak; do not use it.
- "Degen Chain reorged ~500,000 blocks" — appears in one aggregator; **not** in Degen's own post-mortem.
- "Base had an August 2025 outage lasting 29 minutes" — single-source background mention in CoinDesk; not independently verified.
- "Optimism regenesis was November 2021" as a *single* event — there were **multiple** regeneses (at least April 2021 and November 2021). Don't cite one date as if it were the only one.
- Blast incident of 2024-03-26 classified as a censorship/forced-inclusion failure — appears only in the arXiv incident table; I did not verify the underlying event.
- Any claim about zkSync Era or Scroll rolling back state — **I found nothing either way. Absence of evidence, not evidence of absence.**

---

## Bottom line for a decades-durable on-chain write

1. **No L2 has been proven to OFAC-filter at the sequencer.** But the OFAC threat model has also materially weakened (Fifth Circuit 2024-11-26; delisting 2025-03-21 — verify at treasury.gov).
2. **Discretionary censorship is the real, demonstrated risk, not sanctions censorship.** Linea censored addresses to stop a hacker (2024-06). Soneium blacklisted contracts over IP on launch day (2025-01). Neither required a court order or a sanctions listing — just an operator decision.
3. **Force inclusion is real, documented, and effectively untested.** 24h on Arbitrum, 12h on OP Stack/Base. No public count of executions exists (`unknown`). Every outage so far has been shorter than the delay, so it has never been the operative path. The Arbitrum DAO had to *fund* a UI for it in 2024, and even that UI defers to a CLI.
4. **Chains do drop and rewrite accepted transactions.** Polygon zkEVM turned ~4,000 accepted transactions into no-ops (2024-03). Degen Chain reorged with $160k lost (2024-05).
5. **The durability failure mode you should actually design against is Optimism's**: transactions confirmed, then their **event logs permanently deleted** (Jan–Jul 2021, deleted Aug 2023, unrecoverable per Optimism's own docs). This maps exactly onto your "confirms-but-unreadable" bug class — at the chain-operator layer rather than the app layer. **If your read path depends on events rather than L1 calldata, an L2 can silently destroy your ability to read your own writes.**
6. **Practical shortlist:** Arbitrum One, Base, OP Mainnet (Stage 1 + force inclusion + self-propose). **Avoid Linea** for anything requiring guaranteed writes. **Avoid L3s/Orbit chains entirely** — Degen is the cautionary case, and the eRA paper found 13.2% of L2s have no forced-inclusion path at all.
