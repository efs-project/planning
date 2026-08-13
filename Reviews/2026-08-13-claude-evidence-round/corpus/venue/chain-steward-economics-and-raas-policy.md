# Recovered Claude memo — Chain steward economics and RaaS policy

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T04:56:39.284Z
**Claude task:** `a46de4ff17b6fed0b`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3573
**Original result length:** 14445 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
Time box reached. Findings below, with source quality flagged honestly.

---

# Steward / economic sustainability: Base, Arbitrum One, OP Mainnet, and L3s
**Check date: 2026-08-12.** Note: WebSearch quota was exhausted at session start, so all research went through WebFetch (direct URLs + DuckDuckGo HTML as a search substitute). Several primary sources (SEC EDGAR, ainvest, blockchainreporter, coinqm) returned **HTTP 403** to the fetcher — those claims are tagged `reported` at second hand and should be re-verified.

## (a) Who operates each chain

| Chain | Sequencer operator | L2Beat stage | Tag |
|---|---|---|---|
| Base | Single sequencer, modifiable by `Base Multisig 1` via `SystemConfig` | Stage 1 since 2025-04-29 | `documented` |
| Arbitrum One | Centralized, Offchain Labs; no decentralization mechanism in config | Stage 1 | `documented` |
| OP Mainnet | "single Sequencer actor" modifiable by `OpFoundationOperationsSafe` via `SystemConfig` | Stage 1 since 2024-06-10 | `documented` |

- `documented` — Base reached Stage 1 via "an upgrade in their governance process and a Security Council". Contracts are upgradable by a nested 2/2 `Base Governance Multisig` = `Base Coordinator Multisig` + `Base Security Council`; **"There is no delay on upgrades."** ([l2beat config, base.ts](https://raw.githubusercontent.com/l2beat/l2beat/main/packages/config/src/projects/base/base.ts), 2026-08-12)
- `documented` — OP Mainnet: upgradable by `SuperchainProxyAdmin` controlled by "a 2/2 multisig composed by the Optimism Foundation and a Security Council"; a Developer Advisory Board has a 7-day veto window. ([optimism.ts](https://raw.githubusercontent.com/l2beat/l2beat/main/packages/config/src/projects/optimism/optimism.ts))
- `documented` — Arbitrum One is the only one of the three with a real exit window: `usersCanExitWithoutCooperation: true`, ~7 days non-emergency (L2 timelock + challenge window + L1 timelock). ([arbitrum.ts](https://raw.githubusercontent.com/l2beat/l2beat/main/packages/config/src/projects/arbitrum/arbitrum.ts))
- `reported` — Brian Armstrong on Base decentralization, Q2 2026 call: **"There is a path to decentralize it over time… making good progress on that through different stages."** That is a roadmap statement, not a commitment or date. ([Motley Fool transcript, 2026-07-30](https://www.fool.com/earnings/call-transcripts/2026/07/30/coinbase-coin-q2-2026-earnings-call-transcript/))
- `unknown` — I could not verify whether Base or OP Mainnet have added any multi-sequencer / rotating-proposer mechanism in 2026. Both configs still describe a *single* sequencer actor.

### MATERIAL EVENT — Base left the Superchain (Feb 2026)
- `reported` (multiple secondary sources agree; primary not reached) — On **2026-02-18** Base announced it is leaving Optimism's OP Stack to build "its own unified, Base-operated stack." Consequences reported: OP token −25% to −28% within 48h; Optimism announced a ~20% workforce reduction. ([DDG aggregate: paragraph.com/@arcabot, kucoin, cleansky.io, coinalertnews](https://html.duckduckgo.com/html/?q=%22Base%22+leaves+Superchain+February+2026+Coinbase+Optimism+revenue+share+ended+official), 2026-08-12)
- **This directly answers your revenue-share question and invalidates the premise.** The 2.5%-of-revenue / 15%-of-profit arrangement appears to be **terminated**, not merely amended.

## (b) Is sequencer revenue covering cost?

**This is my weakest section — treat the numbers as indicative, not audited.**

- `documented` — growthepie's public economics API (`api.growthepie.xyz/v1/economics.json`) returns only an **"All L2s" aggregate ending April 2025** — no per-chain 2026 breakdown at that endpoint. Aggregate monthly fees ranged $1.39M (Aug 2024) to $22.5M (Nov 2024) against ~$2.7M combined L1+blob costs in the peak month, i.e. **~88% gross margin at the aggregate level in late 2024**. ([api.growthepie.xyz/v1/economics.json](https://api.growthepie.xyz/v1/economics.json), 2026-08-12). The rendered `/economics` page is client-side JS and returned no numbers to the fetcher.
- `reported` — Arbitrum's sequencer "generates $45–$60 million annually in surplus revenue (post-L1 costs), accumulating in the Arbitrum DAO Treasury." Single low-authority source; **not corroborated**. ([decentralised.news](https://backend.decentralised.news/the-l2-sequencer-revenue-play-4-tokens-capturing-real-transaction-fee-cash-flows/))
- `reported` — Arbitrum Foundation is seeking a **$43M operating budget for 2027**, with a separate proposal to route 97% of subscription revenue to the DAO treasury. Also: Offchain Labs will give Robinhood Chain "10% of net protocol revenue" (8% DAO / 2% development). ([coinalertnews 2026-07-22](https://coinalertnews.com/news/2026/07/22/arbitrum-dao-budget-revenue-proposal); [crypto.news](https://crypto.news/arbitrum-gets-a-robinhood-chain-revenue-stream-as-l2-race-heats-up/))
- `reported` — **Blob fee environment has genuinely turned.** After ~20 months at the 1 wei floor post-Dencun, "in December 2025, the floor broke." Blob fees now reportedly generate ~$15M/month with "the blob base fee well above its minimum threshold for extended periods." ([blokz.dev](https://www.blokz.dev/articles/the-blob-market-cycle-twenty-months-at-the-floor-then-the-surge); [blocklr.com](https://blocklr.com/news/ethereum-blob-fees-15m-monthly-l2-surge/))
  - **`inferred`** — This is the single most important margin variable. The ~88% aggregate margin above is measured in the *free-blob* era; it is very likely lower in 2026. Rollups with high data volume and low fee capture (exactly the high-throughput L3 profile) are the most exposed.
- `unknown` — **Coinbase's actual Base revenue disclosure.** SEC EDGAR returned 403 to the fetcher. The Q1 FY2026 10-Q is at [coin-20260331.htm](https://www.sec.gov/Archives/edgar/data/1679788/000167978826000054/coin-20260331.htm) — needs a manual fetch. The Q2 2026 earnings call gave **volume** figures only ($32T stablecoin transfer volume over 12 months; >90% of agentic stablecoin transactions) and, per the transcript, "no specific financial breakdowns for Base revenue, sequencer fees, or profitability metrics."
  - **doc-vs-reality flag:** Coinbase promotes Base heavily in narrative terms while apparently not breaking out its P&L. If Base's economics aren't separately disclosed, no external party can verify whether it is self-sustaining or subsidized.

## (c) Single-company dependence and escape hatches

**Arbitrum One is materially better protected than Base or OP Mainnet.**

- `documented` — Arbitrum: users can force-include via `SequencerInbox.forceInclusion` after a **24-hour** delay; a "Censorship Timeout" feature dynamically *lowers* the force-inclusion threshold when delays occur. L2Beat: "Forced txs can be delayed up to [~24h]". ([docs.arbitrum.io/how-arbitrum-works/sequencer](https://docs.arbitrum.io/how-arbitrum-works/sequencer); arbitrum.ts)
- `documented` — Arbitrum exit window: ~7 days, `usersCanExitWithoutCooperation: true`.
- `documented` — **Base exit window: "None."** L2Beat: *"There is no window for users to exit in case of an unwanted upgrade since contracts are instantly upgradable."*
- `documented` — **OP Mainnet exit window: "None"** — *"upgrades take effect as soon as they are co-signed by the SuperchainProxyAdminOwner, with no onchain delay or prior notice, so users cannot exit."*
- `unknown` — I did **not** verify OP Stack's L1 deposit-based force-inclusion parameters for Base/OP Mainnet in this pass; the L2Beat configs did not surface a self-sequencing delay value for either. OP Stack does have a `OptimismPortal` deposit path, but I could not confirm the current window. This is the top follow-up.
- `unknown` — I found **no published continuity or wind-down commitment** from Coinbase, OP Labs, the Optimism Foundation, or Offchain Labs stating what happens to the chain if the company stops operating it. Armstrong's "path to decentralize" is the closest public statement and it is non-binding.

## (d) RaaS contractual obligations — the clearest result of this research

**Conduit is the only one of the four with an actual published, contractual exit obligation.**

- `documented` — **Conduit Terms of Service** ([conduit.xyz/terms](https://conduit.xyz/terms), 2026-08-12):
  - > "If this Agreement is expired or terminated for any reason, Customer will have **thirty (30) days** in which to migrate to a new set of Sequencer Keys for each Customer Chain and Conduit will, itself or through its service providers, effect such transfer of custody within such 30-day period."
  - Conduit may terminate **"for any reason by providing Customer with ten (10) days prior written notice."**
  - Liability carve-out: > "Customer acknowledges that, in the event of a breach of this Agreement resulting in termination of Services, such actions may result in **loss of access to onchain assets, data, or smart contracts**. Customer agrees that Conduit shall have **no liability** for any inaccessibility, loss, or unavailability arising from such deprecation."
  - Pro-rata refund of prepaid unused subscription fees.
- `documented` — **Conduit SLA** ([conduit.xyz/sla](https://www.conduit.xyz/sla)): 99% monthly availability commitment ("commercially reasonable efforts"), up to 99.99% for Enterprise. Credits: 5% (97.5–99%), 10% (95–97.5%), 20% (<95%), all nonrefundable, applied only to fixed subscription fees. **No chain sunset or termination provisions in the SLA.**
- `documented` — **Caldera: NO published chain-sunset policy.** ([caldera.xyz/terms](https://www.caldera.xyz/terms)) The only termination language covers the *website/account*: "We may suspend or terminate your rights to use the Site (including your Account) at any time for any reason at our sole discretion." No sequencer key handover, no data export, no wind-down obligation.
- `documented` — **AltLayer: NO published chain-sunset policy.** ([altlayer.io/terms-of-service](https://altlayer.io/terms-of-service)) Generic: "We may suspend or terminate your access at any time, with or without notice," and AltLayer "may modify, suspend, or discontinue any part of the Service at any time, with or without notice." No transition procedures, no asset recovery mechanism, no sequencer key clause.
- `unknown` — **Gelato: could not verify.** `gelato.network/terms-of-service` returned a redirect loop. No conclusion either way.

### Real precedent — this is the important part
- `reported` — **Degen Chain (Arbitrum Orbit L3, on Conduit) is sunsetting 2026-08-31** — i.e. **19 days from today**. Announced via the Degen Token X account: "Degen Chain will officially sunset on August 31, 2026. Today, the strongest momentum is happening on Base and through @POVMarket." Users must bridge assets off via bridge.degen.tips before the deadline. ([DDG aggregate](https://html.duckduckgo.com/html/?q=Degen+Chain+sunset+August+31+2026+bridge+assets+announcement); coinqm.com/news/288204 returned 403 directly)
- `reported` — **The 2024 Degen/Conduit precedent is the cautionary tale.** April 2024: the L3 "stopped publishing batches" after Conduit made configuration changes on April 11 at 03:00 UTC, causing a ~2-day outage and a chain reorganization. Subsequently, coverage titled "DEGEN L3 Faces Migration Challenges Amidst Hostile Key Control by Conduit" reports Conduit "refused to take responsibility for the community's damages" and withheld sequencer fees; DEGEN indicated readiness to "create a new chain and remunerate all holders." ([techflowpost](https://www.techflowpost.com/en-US/article/17835); [cryptonews](https://cryptonews.com/news/degen-chain-outage-network-restored-l3-debate-reignited/); [blockchainreporter](https://blockchainreporter.net/degen-l3-faces-migration-challenges-amidst-hostile-key-control-by-conduitxyz/) — 403 to fetcher, snippet only; [cointime](https://www.cointime.ai/news/a-frustrated-migration-84330))
- **`inferred`, and the sharpest finding:** the Conduit ToS 30-day key-handover clause exists *because* of disputes of exactly this shape. Note the asymmetry — the customer gets a key handover, but Conduit disclaims all liability for "loss of access to onchain assets, data, or smart contracts." **The contract protects the chain operator's ability to move, not the end user's funds.** For an app deciding where to live, an L3's escape hatch is a commercial term between two companies that the user is not a party to.

## Bottom line for a data-permanence decision
`inferred` — On steward risk, the ordering is: **Arbitrum One (24h force-inclusion + 7d exit window, permissionless proofs) > Base ≈ OP Mainnet (Stage 1 but exit window "None", instant upgrades, single sequencer) >> any RaaS-hosted L3 (no user-facing guarantee at all; Caldera and AltLayer publish nothing; Conduit's protection runs to the chain operator, not the user).** Degen Chain sunsetting on 2026-08-31 is a live, dated demonstration that L3s do go away and the remedy is "bridge out before the deadline or lose access."

## Could not verify
1. **Coinbase's actual Base revenue/cost/profit disclosure** — SEC EDGAR 403'd. The Q1 FY2026 10-Q URL is identified above; needs manual retrieval.
2. **Per-chain 2025–2026 revenue vs. blob cost margins** for Base, Arbitrum, OP Mainnet — growthepie's public economics endpoint stops at April 2025 and is aggregate-only. L2Beat's costs page and Dune dashboards were not reached.
3. **The exact prior Base↔Optimism revenue-share terms** (2.5% of revenue vs. 15% of profit) — I found only secondary claims of "15% revenue share" and ~$16M cumulative. No primary Optimism governance doc retrieved. And the arrangement appears to have ended in Feb 2026 anyway.
4. **Primary confirmation of Base leaving the Superchain** — all sources were secondary aggregators. No base.org or Optimism Foundation post retrieved. Given the significance, verify before relying on it.
5. **OP Stack force-inclusion window for Base / OP Mainnet** — no self-sequencing delay value surfaced from L2Beat configs.
6. **Gelato's terms** — redirect loop.
7. **Xai and any specific OP Stack L3** — not reached at all. The L3 analysis rests on Degen (Orbit) plus the RaaS terms.
8. **Current blob base fee level and its measured margin impact per chain** — only narrative secondary sources; no on-chain figure verified.
9. **Arbitrum DAO official financial report** — only secondary snippets; no primary treasury report retrieved.
