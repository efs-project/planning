# Recovered Claude memo — L3 and appchain venues

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T04:29:11.347Z
**Claude task:** `a99f3bc6f67b70911`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3425
**Original result length:** 42437 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
## Scope & method

Everything below was checked **2026‑08‑12/13** (RPC observations timestamped `2026-08-13T04:20–04:21Z`). Primary sources: `docs.arbitrum.io`, `specs.optimism.io`, `docs.optimism.io`, `docs.berachain.com`, L2BEAT project pages **and** L2BEAT's own machine-readable config/discovery in `github.com/l2beat/l2beat` (used because l2beat.com HTML truncates under WebFetch — the repo values are the same numbers the site renders). Tags: `observed` (I ran it), `documented` (primary doc/config), `reported` (third party), `inferred` (my arithmetic/derivation), `unknown`.

⚠️ My WebSearch budget was exhausted mid-task; later gaps were closed with WebFetch/curl only. See the "could not verify" list.

---

# 1. Degen Chain — Arbitrum Orbit L3 on Base, AnyTrust

**Still alive?** Yes. `observed` — `eth_getBlockByNumber(latest)` on `https://rpc.degen.tips` returned block **26,959,293**, timestamp **2026‑08‑13T04:20:11Z**. Chain ID 666666666, gas token DEGEN. `documented` (chain config): https://raw.githubusercontent.com/l2beat/l2beat/main/packages/config/src/projects/degen/degen.ts

**DA mode: AnyTrust DAC, not a rollup.** `documented` — `customDa: AnytrustDAC({ discovery, hostChain: 'base' })` in degen.ts. On-chain keyset read from `SequencerInbox` (`base:0x6216dD1EE27C5aCEC7427052d3eCDc98E2bc2221`): **`membersCount: 3`, `requiredSignatures: 2`** → **2-of-3 DAC**. `documented`: https://raw.githubusercontent.com/l2beat/l2beat/main/packages/config/src/projects/degen/discovered.json

### 1. Censorship resistance
- Single centralized sequencer; **one batch-poster EOA** `base:0xc98A32DdD1b30B3788670C9992f3B18EF83Da491`, and `batchPosterManager` is the **zero address**. `documented` (discovered.json, checked 2026‑08‑12).
- No permissionless sequencing of any kind. `documented` — Arbitrum's own doc says only the Sequencer can post batches: https://docs.arbitrum.io/how-arbitrum-works/deep-dives/sequencer (checked 2026‑08‑12).
- L2BEAT renders sequencer as "Centralized (EOA 2)". `reported`: https://l2beat.com/scaling/projects/degen

### 2. Force inclusion / escape hatch — **this is the load-bearing one for a decades-durable contract**
- Mechanism: user calls `sendMessage`/`sendMessageFromOrigin` on the **Inbox on Base**, message lands in the Bridge's *delayed inbox*; after the delay anyone calls **`forceInclusion`** on the **SequencerInbox on Base**. `documented`: L2BEAT orbitStack template text + https://docs.arbitrum.io/how-arbitrum-works/deep-dives/sequencer
- **Delay constant name: `maxTimeVariation.delaySeconds` / `delayBlocks`** (settable by the Rollup Owner). Degen's values: **`delaySeconds: 345600` (= 4 days)**, **`delayBlocks: 172800`**. `documented` (discovered.json).
  - `inferred`: on Base, `block.number` returns Base's *own* L2 block number at 2 s (L2BEAT sets `blockNumberOpcodeTimeSeconds: 2` for exactly this reason), so `172800 × 2 s = 345,600 s = 4 days` — both constraints bind at **4 days**.
- **It lands on Base (the L2), not Ethereum.** `documented` — the SequencerInbox/Inbox/Bridge are all `base:` addresses in discovered.json.
- **Stacking:** L2BEAT's `orbitStackL3` computes a `stackedRiskView` that **sums the L3 delay with the host chain's delay** (`sumRisk(common.riskView.sequencerFailure, baseChain.riskView.sequencerFailure, …)`). `documented`: https://raw.githubusercontent.com/l2beat/l2beat/main/packages/config/src/templates/orbitStack.ts (lines ~726‑765). Base's own self-sequencing delay is the OP Stack sequencing window, hardcoded in L2BEAT as `SEQUENCING_WINDOW_SECONDS: 3600 * 12` = **12 h** (`documented`, `packages/config/src/discovery/values/hardcoded.ts`; corroborated by https://docs.optimism.io/stack/rollup/outages — "default duration of 12 hours"). **4 d + 12 h = 4 d 12 h**, which is exactly the figure L2BEAT displays. `inferred` + `reported` (https://l2beat.com/scaling/projects/degen: "Self sequence … up to a 4d 12h delay on this operation").
- **Parent-chain liveness dependency:** yes, total. If **Base's** sequencer is down, your force-inclusion transaction on Base itself must go through Base's own L1 deposit path (`OptimismPortal` on Ethereum, 12 h sequencing window) before it can even be mined on Base — *then* Degen's 4-day clock starts. `inferred` from the two documented mechanisms; L2BEAT encodes the same worst case as the 4 d 12 h sum.
- **Can an ordinary user do it?** Mechanically yes (permissionless function), practically expensive: `reported` — https://scalability.guide/posts/forced_vs_based/ puts forced L1 inclusion at ~$6 on Arbitrum vs ~$0.0021 sequenced, i.e. ~2,800× cost, and characterizes force inclusion as "a last-resort liveness guarantee rather than a practical mechanism."
- **Has anyone demonstrably done it?** `reported` / `inferred` — scalability.guide states: an Orbit chain "was down for almost 2 days and someone managed to force include a tx from the DelayedInbox to the main Inbox after the 24h force inclusion delay invalidating certain preconfirmed transactions." The 2-day-outage detail matches Degen's May 2024 halt, **but the article does not name the chain and cites a 24 h delay, not Degen's 4 d** — so the attribution is `inferred` and I rate it **unconfirmed for Degen specifically**.
- Force inclusion does **not** require the L3 sequencer to be alive — that is its whole point. `documented`.

### 3. Sequencing / soft confirmations / reorg risk
`documented` — https://docs.arbitrum.io/how-arbitrum-works/deep-dives/sequencer: soft confirmations come from the Sequencer feed and are provisional; "if the Sequencer acts maliciously, it could reorder or censor certain transactions before they achieve hard finality." Ordering only becomes canonical when the batch (or a forced message) hits the parent chain.
`reported` — the May 2024 Degen incident **actually produced a state/ordering corruption**, not a theoretical one: "corrupted the chain state and transaction ordering, and led to $160k in lost user funds" (https://www.theblock.co/post/325132/…, https://cryptoslate.com/degen-l3-migration-hindered-by-conduit-standoff-and-financial-losses/).

### 4. Finality / settlement / fault proofs
- Path: **Degen → Base → Ethereum**. Two settlement hops, therefore **two challenge windows in series** for an L1-verifiable exit. `inferred` from architecture; L2BEAT models it as `pickWorseRisk`/`sumRisk` stacking. `documented` (orbitStack.ts).
- Degen challenge window: **`confirmPeriodBlocks: 241920`**, `extraChallengeTimeBlocks: 200`. At Base's 2 s block accounting: `241,920 × 2 s = 483,840 s` = **5 d 14 h**. `documented` (discovered.json) + `inferred` (arithmetic) + `reported` (L2BEAT UI shows "Fraud proofs (INT) — 5d 14h challenge period").
- **Proofs are permissioned.** `validators: ["base:0x3cAF7ceF6B2aECA72102E8835325B26BF99FE9E0", "base:0xc207cbC35DD3CD172059730380A45aE14eb0e403"]` — **exactly 2 whitelisted validators**, who are also the only entities that can propose state roots. `documented` (discovered.json). L2BEAT tags this `CLOSED_PROOFS` = "There are less than 5 external actors that can submit challenges." `documented`: https://raw.githubusercontent.com/l2beat/l2beat/main/packages/config/src/common/reasonsForBeingOther.ts
- **Challenge period can be bypassed entirely.** `anyTrustFastConfirmer: base:0xc207cbC35DD3CD172059730380A45aE14eb0e403` — a non-zero fast confirmer, which is *the same address as one of the two validators*, named `DegenFastConfirmerMultisig` in L2BEAT's discovery. `documented` (discovered.json entry names include `DegenFastConfirmerMultisig`). What it does: "Transactions reaching a unanimous vote across the committee will be immediately confirmed", bypassing the multi-day challenge period. `documented`: https://docs.arbitrum.io/launch-arbitrum-chain/configure-your-chain/advanced-configurations/fast-withdrawals
- Proposer failure / self-propose: L2BEAT shows "**6d 15h of inactivity from the currently whitelisted Proposers**" before others may propose. `reported` (l2beat.com/scaling/projects/degen).
- **Exit window: None.** "There is no delay on code upgrades (CRITICAL)"; contracts upgradeable by ProxyAdmin with `delay: 'no'`. `documented` (degen.ts includes `CONTRACTS.UPGRADE_NO_DELAY_RISK`) + `reported` (L2BEAT).

### 5. Data availability — what breaks if the DAC lies/colludes/shuts down
- **Only the DACert goes to Base. The transaction data does not.** `documented`: https://docs.arbitrum.io/how-arbitrum-works/data-availability — "Only 'a cryptographic proof that the data has been stored by the DAC (Data Availability Certificate, or DACert)' gets posted to the parent chain."
- DACert contents: data hash + expiration time + BLS-aggregated signatures over (hash, expiry) + keyset hash + signer bitmap. Nodes check the expiry is **at least two weeks ahead** of the child-chain timestamp; typical expiry is **~three weeks out**. `documented`: https://docs.arbitrum.io/how-arbitrum-works/inside-anytrust and L2BEAT's AnyTrust template text.
- **Guarantee is time-bounded and honesty-bounded.** The DACert only proves "the block's data will be available from at least one honest DAC member, at least until the expiration time." `documented` (inside-anytrust). **Nothing obliges any member to retain data past expiry.**
- **Degen threshold = 2-of-3.** `inferred` from the threshold semantics: to guarantee ≥1 honest signer among the 2 signers, **at most 1 of the 3 may be dishonest/unavailable**. Two colluding members can mint a valid DACert for data nobody holds. L2BEAT flags this as `SMALL_DAC`: "Projects without a sufficiently decentralized data availability committee rely on few entities … A small set of entities can collude with the proposer to finalize an unavailable state, which can cause loss of funds." `documented` (reasonsForBeingOther.ts).
- L2BEAT's per-project DA risk text: **"Funds can be lost if a malicious committee attests to an invalid data availability certificate"** and "if the bridge contract or its dependencies receive a malicious code upgrade. There is no delay on code upgrades." `documented`: https://raw.githubusercontent.com/l2beat/l2beat/main/packages/config/src/templates/anytrust-template.ts
- **Liveness fallback exists (and is the good news):** "If the Sequencer fails to collect enough signatures within a few minutes, it abandons the DAC approach and falls back to Rollup mode by posting full data directly" to the parent chain. `documented` (inside-anytrust; L2BEAT sets `fallback: DA_LAYERS.ETH_CALLDATA`). **This protects future writes if the DAC quits — it does nothing for data already committed under a DACert.** `inferred`.

### 6. State availability / reconstructability from parent data alone
- **No.** `documented`, and unusually explicit: https://docs.arbitrum.io/how-arbitrum-works/data-availability — "a node cannot reconstruct chain state from parent-chain data alone in AnyTrust mode. The node must verify the DACert and then query the data from the DAC… Without DAC access, the parent chain alone provides insufficient information for full state reconstruction."
- **Tool name:** the node software is **Arbitrum Nitro** (https://github.com/OffchainLabs/nitro), plus a **DAS (Data Availability Server)** REST endpoint per committee member to fetch blobs by hash. `documented` (inside-anytrust; anytrust-template daTechnology.md: "the REST API enables anyone to fetch data by hash"). Nitro alone is not sufficient without a reachable DAS.
- L2BEAT does **not** currently certify Degen's node software as available: **"The requirement for available node software is under review."** `reported` (l2beat.com/scaling/projects/degen) — and `documented` as to *why*: the `orbitStack` template defaults `rollupNodeSourceAvailable: templateVars.isNodeAvailable ?? 'UnderReview'`, and degen.ts never sets `isNodeAvailable`. (orbitStack.ts line ~1351.)

### 7. L2BEAT classification (checked 2026‑08‑12)
- **"Degen Chain is not even a Stage 0 project."** `reported` (l2beat.com/scaling/projects/degen).
- Type label rendered: **"Other"** — *not* "Rollup", and in this build **not** the word "Optimium" either. `reported` (site) + `documented` (degen.ts declares `reasonsForBeingOther: [CLOSED_PROOFS, SMALL_DAC]`, which moves a project out of the Rollups table into "Others").
- ⚠️ **Naming contradiction to flag:** Degen's own launch messaging calls it an "L3 … with Base for settlement, and AnyTrust for DA" and the ecosystem calls it a rollup/L3; L2BEAT does not count it as a rollup at all and gives it no stage. Also note L2BEAT reserves "Optimium" for AnyTrust/off-chain-DA **L2s** (e.g. Arbitrum Nova); Degen is typed `layer3` and lands under "Others" instead. `inferred` from the config typing + `reported` from the summary page ("23 Rollups, 6 Validiums & Optimiums, 78 Others").
- TVS **$2.12M**; activity "Past Day Ops count: 2.08 K". `reported` (l2beat.com/scaling/projects/degen).

### 8. Outage / abandonment history — **the richest evidence base of any venue here**
- **May 12–15 2024: 54 hours of total chain downtime.** Cause: RaaS provider Conduit pushed a "custom config change" that halted block production on Degen and Proof of Play Apex. Recovery required resyncing from genesis, and Conduit **filtered transactions from ~5 addresses** to get the replay to complete. `reported`: https://cryptoslate.com/degen-chain-restarts-after-two-day-outage-still-stabilizing-infrastructure/, https://www.coindesk.com/business/2024/05/15/degen-chain-back-online-after-two-day-hiatus. `documented` as an L2BEAT milestone: "Degen Chain halts for two days due to a chain misconfiguration" (2024‑05‑13, degen.ts).
- **Consequences:** ~$160k user funds lost, corrupted state/tx ordering, ~75% drop in bridge volume over the following month. `reported` (theblock.co/post/325132, cryptoslate).
- **Key-custody hostage situation (2024‑11):** Degen could not migrate RaaS providers because **Conduit held the rollup keys**. "As long as Conduit holds its rollup keys, it cannot upgrade its chain or finalize a migration." Conduit also reportedly **deleted the block explorer data with no backups** despite two requests to preserve it. Degen leadership publicly contemplated relaunching on a new chain and compensating holders. `reported`: https://www.theblock.co/post/325132/not-your-keys-not-your-blockchain-degen-l3-cant-switch-rollup-as-a-service-providers-from-firm-holding-its-keys, https://cryptoslate.com/degen-l3-migration-hindered-by-conduit-standoff-and-financial-losses/, https://blog.degen.tips/a-frustrated-migration
- **The migration did eventually complete.** `documented` — L2BEAT's current Degen discovery contains **`AlchemyMultisig2` (`base:0x871e290d5447b958131F6d44f915F10032436ee6`)** as a live watched contract, and degen.ts carries `BADGES.RaaS.Alchemy`; `ConduitMultisig3` appears only in the historical diff log. A signer rotation on `AlchemyMultisig2` is recorded as recently as **2026‑03‑04**. (degen.ts, discovered.json, diffHistory.md.)
- ⚠️ **This is the single most instructive datapoint for a decades-durable filesystem:** the operator held keys the chain's own community could not obtain, and off-chain historical data (the explorer index) was destroyed. `reported`.

---

# 2. Xai — Arbitrum Orbit L3 on Arbitrum One, AnyTrust

**Still alive?** Yes. `observed` — `https://xai-chain.net/rpc` returned block **134,928,988** at **2026‑08‑13T04:21:12Z**. Chain ID 660279, gas token XAI. `documented`: https://raw.githubusercontent.com/l2beat/l2beat/main/packages/config/src/projects/xai/xai.ts

### 1. Censorship resistance
Single sequencer; **one batch poster** `arb1:0x7F68dba68E72a250004812fe04F1123Fca89aBa9`, with a `batchPosterManager` multisig `arb1:0x000d8C5A70B8805DF02f409F2715d05B9A63E871` ("XaiMultisig2"). No permissionless sequencing. `documented` (discovered.json, config.jsonc).

### 2. Force inclusion / escape hatch
- Same Orbit mechanism, but the inbox lives on **Arbitrum One**, not Ethereum: `SequencerInbox` = `arb1:0x995a9d3ca121D48d21087eDE20bc8acb2398c8B1`. `documented`.
- Constants: **`maxTimeVariation = { delayBlocks: 5760, futureBlocks: 96, delaySeconds: 86400, futureSeconds: 3600 }`** → **24 h**. `documented` (discovered.json). `inferred`: on Arbitrum One, `block.number` returns the **L1** block number, so `5760 × 12 s ≈ 19.2 h`; the binding constraint is `delaySeconds` = **24 h**.
- **Stacked with the parent:** Arbitrum One's own `maxTimeVariation.delaySeconds` is also **86400 (24 h)**. `documented` (https://raw.githubusercontent.com/l2beat/l2beat/main/packages/config/src/projects/arbitrum/discovered.json). So worst case **24 h (Xai) + 24 h (Arbitrum One) = 48 h** to get a transaction irreversibly ordered against Ethereum. `inferred` via L2BEAT's documented `sumRisk` stacking rule.
- **If Arbitrum One's sequencer is down:** your Xai force-inclusion call is itself a transaction on Arbitrum One, so it must first be force-included there via Arbitrum One's L1 delayed inbox (24 h), *then* Xai's 24 h clock runs. `inferred` from the two documented mechanisms.
- **Documented L3-specific pathology:** Arbitrum's own docs acknowledge that for L3s on Arbitrum One/Nova, *every challenge move* may need to be force-included, so "challenge resolution would be delayed by a time `t` where `t = (24 hours) × number of moves`", mitigated by a **Censorship Timeout** feature that lowers the threshold during outages. `documented`: https://docs.arbitrum.io/how-arbitrum-works/deep-dives/sequencer (checked 2026‑08‑12). Whether Xai has the buffered/BoLD variant enabled: **`unknown`** — no `bufferConfig` key appears in Xai's discovered SequencerInbox.
- **Demonstrated use on Xai:** `unknown` — I found no record.

### 3. Sequencing / reorg
Identical to Degen: provisional Sequencer feed, hard finality only at parent-chain inclusion. `documented` (docs.arbitrum.io/how-arbitrum-works/deep-dives/sequencer).

### 4. Finality / fault proofs
- **`confirmPeriodBlocks: 45818`**. L2BEAT's field metadata is explicit: "Challenge period. (Number of **ETHEREUM** blocks until a node is confirmed, **even for L3s**)." `45,818 × 12 s = 549,816 s` ≈ **6 d 9 h**. `documented` (discovered.json fieldMeta) + `inferred` (arithmetic).
- **Exactly 2 whitelisted validators**: `arb1:0x0C2EbD821c68EC405Fb425596486F5b0f6dFff53`, `arb1:0x25EA41f0bDa921a0eBf48291961B1F10b59BC6b8`. Only they can propose/challenge. `documented`.
- **`anyTrustFastConfirmer: 0x0000…0000`** — Xai does **not** have the fast-confirm bypass Degen has. `documented`. (Notable contrast.)
- **The "Sentry Node" network is not a fault-proof system.** L2BEAT's Xai state-validation note, verbatim: *"There is no integrated way to flag an invalid state root, sentry nodes will have to raise the alarm by external means, making them just observation nodes."* And: "The challenge protocol can be subject to delay attacks." `documented`: https://raw.githubusercontent.com/l2beat/l2beat/main/packages/config/src/projects/xai/stateValidationFraudProofs.md
- ⚠️ **Contradiction to flag:** Xai markets Sentry Nodes as chain-securing verifiers; L2BEAT's assessment is that they cannot challenge anything on-chain. `documented` (L2BEAT) vs `reported` (xai.games marketing framing).
- Risk text: **"Funds can be stolen if none of the whitelisted verifiers checks the published state. Fraud proofs assume at least one honest and able validator"** — marked **critical**. `documented` (xai.ts).
- **Parent chain (Arbitrum One) is materially stronger than Base's relationship to Degen:** `validatorWhitelistDisabled: true` (BoLD — **permissionless validation**), `confirmPeriodBlocks: 45818` (~6 d 9 h), `challengeGracePeriodBlocks: 14400` (48 h), `validatorAfkBlocks: 201600` (**28 days**, after which anyone may propose), proof system **BoLD**, `permissioned: false`. `documented`: arbitrum.ts + arbitrum/discovered.json. Arbitrum One's L2BEAT stage config shows all Stage 0 + Stage 1 boxes satisfied and Stage 2 blocked by `proofSystemOverriddenOnlyInCaseOfABug: false` and `delayWith30DExitWindow: false` → **Stage 1**. `documented` (arbitrum.ts `getRollupStage`).

### 5. Data availability
- **On-chain keyset: `membersCount: 5`, `requiredSignatures: 3` → 3-of-5.** `documented` (xai/discovered.json, `SequencerInbox.dacKeyset`).
- `inferred` threshold semantics: to guarantee ≥1 honest signer among 3, **at most 2 of the 5 may be dishonest**. Three colluding members forge a valid DACert.
- ⚠️ **Contradiction to flag:** Xai's own docs and L2BEAT's `knownMembers` list **six** entities — Xai, Ex Populus, Alt Layer, LayerZero, Team Secret, Offchain Labs (`documented`: xai.ts; https://xai-foundation.gitbook.io/xai-network/about-xai/xai-protocol/anytrust-revolutionizing-blockchain-infrastructure/data-availability-servers-das) — while the **on-chain keyset has only 5 members**. Which of the six is not in the active keyset is `unknown`. A third-party summary also states the threshold as "3/5", consistent with chain state.
- L2BEAT reason: **`LOW_DAC_THRESHOLD`** — "The data availability committee threshold is too low… These entities can collude with the proposer to finalize an unavailable state." `documented` (reasonsForBeingOther.ts + xai.ts).
- Same DACert semantics, same ~2-week-minimum / ~3-week expiry, same rollup-mode fallback on signature failure. `documented` (inside-anytrust).

### 6. State reconstructability
Same as Degen: **not reconstructable from Arbitrum One data alone** — DACert only. Requires a live DAS. `documented` (docs.arbitrum.io/how-arbitrum-works/data-availability). Node software = Nitro (`repositories: ['https://github.com/OffchainLabs/nitro']` in xai.ts), but L2BEAT again leaves `isNodeAvailable` unset → **`rollupNodeSourceAvailable: 'UnderReview'`**. `documented` (xai.ts + orbitStack.ts).

### 7. L2BEAT classification (checked 2026‑08‑12)
- `reasonsForBeingOther: [CLOSED_PROOFS, LOW_DAC_THRESHOLD]` → rendered as **"Other"**, no stage. `documented` (xai.ts).
- Badges: EVM, **Data Availability Committee**, Arbitrum Orbit, **L3ParentChain.Arbitrum**. `documented` + `reported` (l2beat.com/scaling/projects/xai).
- ⚠️ Xai's own docs call it "an Ethereum Layer-3"; L2BEAT does not classify it as a rollup and assigns no stage.

### 8. Outage / abandonment history
`unknown` — I found **no** record of a Xai chain halt or operator abandonment. Mainnet launched 2024‑01‑09 (`documented`, xai.ts milestone) and was producing blocks at check time (`observed`). Absence of evidence here is genuinely weak evidence — my search budget ran out before I could search incident history directly.

---

# 3. OP Stack L3s on Base

I covered **two** L2BEAT-tracked OP Stack L3s that settle to Base, because one is live and one is a corpse — both are informative.

## 3a. B3 — OP Stack L3 on Base, Celestia DA

**Still alive?** Yes. `observed` — `https://mainnet-rpc.b3.fun/http` returned block **64,219,616** at **2026‑08‑13T04:21:13Z**. Chain ID 8333. `documented`: https://raw.githubusercontent.com/l2beat/l2beat/main/packages/config/src/projects/b3/b3.ts

- **Stack/DA:** OP Stack L3, host chain **Base**, RaaS **Caldera**, `daProvider: CELESTIA_DA_PROVIDER(DA_LAYERS.ETH_CALLDATA)`, Celestia namespace `AAAAAAAAAAAAAAAAAAAAAAAAAMod4SqMAivUaAM=`. `documented` (b3.ts).
- **1. Censorship resistance:** single sequencer; `unsafeBlockSigner` = `base:0x54bB68f8FE08Ff315DBe1A89265103ebcDcFfd39`, batcher hash `base:0x1af3F4e08a16B93ccBDF6887549697F17f9cf78A`. No permissionless sequencing. `documented` (b3/discovered.json).
- **2. Force inclusion:** OP Stack deposit path — user posts to the **`OptimismPortal` on Base** (`base:0x3a314A6a3c1470Bf2854960D3Ce9D2435c7Ba794`); deposits are guaranteed inclusion within the **sequencing window**. `documented`: https://docs.optimism.io/stack/rollup/outages + b3/discovered.json. Constant name: **`sequencer_window` / `SEQUENCING_WINDOW_SIZE`**, OP Stack default **12 h**; `documented` (docs.optimism.io; L2BEAT `HARDCODED.OPTIMISM.SEQUENCING_WINDOW_SECONDS = 3600*12`). L2BEAT's own comment concedes it does not read B3's actual value: *"the value is inside the node config, but we have no reference to it, so we assume it to be the same value as in other op stack chains"* — so B3's real window is **`unknown`**, assumed 12 h. `documented` (opStack.ts ~line 1487).
  - **Stacked: 12 h (B3) + 12 h (Base) = 24 h**, matching L2BEAT's rendered "**Self sequence … up to 1 day delay**". `inferred` + `reported` (l2beat.com/scaling/projects/b3).
  - **If Base's sequencer is down**, the B3 portal transaction must itself be force-included on Base via Ethereum's `OptimismPortal` first. `inferred`.
  - Demonstrated use on B3: `unknown`.
- **3. Reorg semantics:** OP Stack chains "automatically reorganize to guarantee inclusion of transactions sent through the L1 deposit path" if the sequencer misses the window — i.e. **unsafe-head reorgs are a designed behavior**, not an anomaly. `documented` (docs.optimism.io/stack/rollup/outages).
- **4. Finality / proofs — worst in the set.** B3 still uses the **legacy `L2OutputOracle`** (`base:0x536cf1ABfD22E61a13753c0F08613aDdF4ca0595`), with `finalizationPeriodSeconds: 604800` = **7 days**, `submissionInterval: 3600`, `l2BlockTime: 1`. **`proposer` is a single address** `base:0x9c9Db06722b3E33fa356C7347f7fBe328a26Dc7d`; **`challenger` is a single address** `base:0xEAC870005Fe175eEc9365502eAEb2A6f50De1eff`. `documented` (b3/discovered.json). L2BEAT: **"State validation: None — the proof system isn't fully functional"**, i.e. **no fault proofs at all**; "the system permits invalid state roots." `documented` (`reasonsForBeingOther.NO_PROOFS`) + `reported` (l2beat.com/scaling/projects/b3).
  - ⚠️ Minor contradiction: B3's `SystemConfig` also carries a `disputeGameFactory` pointer (`base:0xadA565Abc1Fe7358259c22dd0A7372229d943388`), yet the live output path L2BEAT reads is the L2OutputOracle. Whether a dispute-game path is actually active is **`unknown`**. `documented` (discovered.json) / `inferred`.
  - Two challenge windows in series to Ethereum: B3's 7 d + Base's dispute-game finality. `inferred`.
- **5. DA — Alt-DA-ish, but worse: no DA bridge.** L2BEAT reason **`NO_DA_ORACLE`**: "Projects without a data availability bridge fully rely on single entities (the sequencer) to honestly relay available data roots on Ethereum. A malicious sequencer can collude with the proposer to finalize an unavailable state." `documented` (reasonsForBeingOther.ts + b3.ts). L2BEAT UI: "**Full reliance on Celestia; sequencer can post unavailable roots without Blobstream bridge verification**." `reported`.
  - For OP Stack **Alt-DA/plasma** generally (not necessarily B3's exact config): commitments go to L1, with a **challenge window** and a **resolve window**; if a challenge goes unresolved, "derivation of the L2 canonical chain will reorg starting from this first block", and "**Beyond that window, data is lost unless stored independently by applications.**" `documented`: https://specs.optimism.io/experimental/alt-da.html
- **6. State reconstructability: explicitly no.** B3 sets **`isNodeAvailable: false`** in L2BEAT's config — the strongest form of this signal in the whole dataset (Degen/Xai are merely "UnderReview"). `documented` (b3.ts). Combined with off-chain Celestia DA and no DA bridge, reconstruction from Base/Ethereum alone is not possible; you would need Celestia blocks for that namespace within Celestia's retention. Named tool: **`unknown`** for B3 specifically.
- **7. L2BEAT:** **"B3 is not even a Stage 0 project."** Type **"Other"**; banners "The proof system isn't fully functional" and "There is no data availability bridge". TVS **$275.77K**. `reported` (l2beat.com/scaling/projects/b3, checked 2026‑08‑12).
- **8. Outages:** `unknown`.

## 3b. Syndicate Frame Chain — OP Stack L3 on Base — **ARCHIVED**

- L2BEAT: **"This project is archived and no longer maintained."** Type "Other"; host chain Base; state validation "None — Currently the system permits invalid state roots"; exit window "None"; self-sequence up to 1 day. **TVS $7.77K; 9 ops in the past day.** `reported`: https://l2beat.com/scaling/projects/syndicateframe (checked 2026‑08‑12).
- This is the clearest "operators walked away" datapoint in the L3-on-Base category, and it is the **same operator (Syndicate) that launched Degen Chain** (`documented`: degen.ts lists `https://syndicate.io/blog/degen-chain` as Degen's website and `docs.syndicate.io` as its documentation).
- ⚠️ The archived page reports DA as "Onchain (Ethereum L1 calldata)" for a chain whose host is Base — I could not reconcile that label; treat as `unknown`.

## 3c. Base itself (the settlement layer both L3s depend on) — material changes since my cutoff

- **Base achieved Stage 1** on 2025‑04‑29. `documented` (base.ts milestone + https://base.mirror.xyz/tWDMlGp48fF0MeADcLQruUBq1Qxkou4O5x3ax8Rm3jA).
- **Base left the Superchain.** L2BEAT milestone: *"Base decouples from Optimism Superchain governance with its own upgrade path"*, dated **2026‑03‑04**, https://blog.base.dev/next-chapter-for-base-chain-1. `documented` (base.ts).
  - ⚠️ **Date contradiction:** press coverage dates the announcement **2026‑02‑18** (https://www.coindesk.com/business/2026/02/18/coinbase-s-base-moves-away-from-optimism-s-op-stack-in-major-tech-shift; Chainstack "Base Migration: From OP Stack to base/base (2026)"). `reported`. Announcement date vs. governance-decoupling date is the likely reconciliation, but I did not confirm that. Also note L2BEAT **still lists `stacks: ['OP Stack']`** for Base as of the config I read — a live docs-vs-tracker inconsistency. `documented`.
- **Base Azul multi-proof**, 2026‑05‑26: "Base activates the multiproof system combining **TEE attestations and SP1 ZK proofs**" (https://blog.base.dev/introducing-base-azul). `documented` (base.ts). Corroborated by discovery: `AggregateVerifier`, `SP1VerifierGateway`, multiple `RiscZeroVerifierEmergencyStop`, `NitroEnclaveVerifier`, `TEEProverRegistry`; `OptimismPortal2.respectedGameType: 621`, `disputeGameFinalityDelaySeconds: 0`. `documented` (base/discovered.json).
- Base stage flags: Stage 0 all true, Stage 1 all true, **`fraudProofSystemIsPermissionless: true`**, Stage 2 blocked by `proofSystemOverriddenOnlyInCaseOfABug: false` and `delayWith30DExitWindow: false` → **Stage 1**. `isNodeAvailable: true`, node at https://github.com/base-org/node. `documented` (base.ts).
- Incident on record: "Base halts block production for 33mins". `documented` (base.ts milestone; exact date not captured in my excerpt).

**Consequence for L3s:** a Degen or B3 contract's ultimate L1-anchored escape depends on Base's Stage-1 machinery **and** on Base's newly independent, faster-moving upgrade path (target: six hard forks/year vs three). `reported` (coindoo/AMBCrypto/Chainstack coverage of the Feb 2026 announcement) + `inferred`.

---

# 4. Sovereign appchain contrast — Berachain (sovereign EVM L1)

**1. Censorship resistance / ordering.** Block proposer is drawn from a **staked validator active set**, weighted by voting power. Consensus is **CometBFT** wrapped by **BeaconKit**; execution is **Bera-Reth** (a modified Reth fork) over the Engine API. `documented`: https://docs.berachain.com/nodes/architecture/beaconkit-consensus.md, https://docs.berachain.com/general/introduction/what-is-berachain.md (checked 2026‑08‑12).
- **Active set is hard-capped at 69 validators.** Entry: **250,000 BERA** minimum if the set isn't full; if full, you must out-stake the last member by **10,000 BERA**. Activation takes up to **3 epochs (192 blocks/epoch)**. Voting power = deposited BERA rounded down to the nearest 10,000. `documented`: https://docs.berachain.com/nodes/architecture/validator-lifecycle.md
- So: sequencing is **permissionless in principle, capital-gated and set-capped in practice** — the opposite trade from an L2/L3's single sequencer + escape hatch. `inferred`.

**2. Force inclusion / escape hatch: none exists.** There is no parent chain, no delayed inbox, no `forceInclusion`, no portal. If ≥1/3 of voting power refuses to include your transaction, your only recourse is social/governance. `inferred` from architecture; the docs describe **no** such mechanism (`documented` by absence across the pages fetched). This is the central structural difference from every venue above.

**3–4. Sequencing / finality.** **Single Slot Finality / instant finality** via CometBFT — "compared to Ethereum's finality of ~13 minutes." `documented` (beaconkit-consensus.md). Under the standard CometBFT assumption (<1/3 Byzantine voting power) a committed block is final and **not reorgable** — no soft/hard confirmation split, no challenge window, no fraud proofs, no state roots posted anywhere. `documented` (instant finality claim) + `inferred` (the <1/3 safety condition — the Berachain docs I fetched do not state it).
- Trade: **no settlement path to Ethereum at all.** There is no external verifier of Berachain state. `inferred`.

**5–6. DA / state availability.** Data availability = whatever the validator set and full-node/archive operators retain. There is no DAC, no DA bridge, no external DA layer, and no L1 to reconstruct from. I found **no** documented history-retention or archive-node guarantee. `unknown`.

**7. L2BEAT:** not applicable — Berachain is an L1 and is not on l2beat.com/scaling. `inferred`.

**8. The abandonment case for this category — Evmos.** Governance **Proposal #331 "Evmos Shutdown"** passed with ~99.8% in favor; nodes ceased operation at **block height 37,318,000**; website, block explorer and infrastructure went offline; TVL to zero. `reported`: https://www.kucoin.com/news/flash/cosmos-evm-chain-evmos-network-officially-shut-down-website-and-infrastructure-unavailable, https://phemex.com/news/article/evmos-halts-operations-following-shutdown-proposal-approval-85093
- ⚠️ **I could not confirm the year.** Sources say "passed May 15, ceased ~May 18"; the search summarizer said 2025 but I did not verify against a primary governance record. `unknown` (year).
- The mechanism worth noting: **a sovereign chain can be voted out of existence, and when it stops, nothing remains** — no parent chain holds its data, no permissionless software can replay it. That is the categorical contrast to an L2/L3, where at minimum a parent-chain inbox retains *something*. `inferred`.

---

# Comparison table (all values checked 2026‑08‑12/13)

| | **Degen Chain** | **Xai** | **B3** | **Syndicate Frame** | **Berachain** |
|---|---|---|---|---|---|
| Type / stack | Orbit L3, AnyTrust | Orbit L3, AnyTrust | OP Stack L3, Celestia | OP Stack L3 | Sovereign EVM L1 |
| Parent / settles to | **Base** | **Arbitrum One** | **Base** | **Base** | *(none)* |
| Live at check? | ✅ blk 26,959,293 `observed` | ✅ blk 134,928,988 `observed` | ✅ blk 64,219,616 `observed` | **ARCHIVED** `reported` | ✅ (not RPC-probed) |
| Sequencer | 1 EOA, no permissionless | 1 EOA + manager multisig | 1 signer | — | 69-validator capped set |
| Force-inclusion constant | `maxTimeVariation.delaySeconds` = **345,600 s (4 d)** `documented` | same field = **86,400 s (24 h)** `documented` | `sequencer_window` ≈ **12 h** (assumed) `documented`/`unknown` | ~12 h | **none** |
| Force-inclusion lands on | **Base** | **Arbitrum One** | **Base** | Base | n/a |
| Stacked worst case to L1 | **4 d 12 h** (4 d + Base 12 h) `inferred`/`reported` | **48 h** (24 h + Arb One 24 h) `inferred` | **1 day** (12 h + 12 h) `inferred`/`reported` | ~1 day | n/a |
| Needs L3 sequencer alive? | No | No | No | No | n/a (needs 2/3 validators) |
| Needs **parent** sequencer alive? | **Yes** (else +Base's 12 h L1 path) `inferred` | **Yes** (else +Arb One's 24 h L1 path) `inferred` | **Yes** `inferred` | Yes | n/a |
| Challenge window | `confirmPeriodBlocks` 241,920 → **5 d 14 h** | `confirmPeriodBlocks` 45,818 → **~6 d 9 h** | `finalizationPeriodSeconds` **604,800 (7 d)** | — | none |
| Fault proofs | Interactive, **2 whitelisted validators** | Interactive, **2 whitelisted validators**; Sentry nodes cannot challenge | **None** — invalid roots permitted | **None** | n/a |
| Challenge bypass | **YES** — `anyTrustFastConfirmer` = a validator (`DegenFastConfirmerMultisig`) | **No** (`0x0`) | n/a | n/a | n/a |
| Who posts state roots | 2 whitelisted proposers; self-propose after **6 d 15 h** | 2 whitelisted proposers | **1 proposer** address | 1 proposer | n/a |
| DA | AnyTrust **2-of-3** `documented` | AnyTrust **3-of-5** `documented` | Celestia, **no DA bridge** | onchain (label unclear) | validator set only |
| DA failure mode | 2 colluders forge DACert; data gone after expiry (~3 wk) | 3 colluders forge DACert; same | sequencer can post unavailable roots freely | — | chain-wide loss on shutdown |
| Reconstruct from parent alone? | **No** (DACert only) `documented` | **No** (DACert only) `documented` | **No**; `isNodeAvailable: false` | — | **No parent exists** |
| Node software | Nitro + DAS REST; L2BEAT: **UnderReview** | Nitro + DAS REST; **UnderReview** | **`isNodeAvailable: false`** | — | BeaconKit + Bera-Reth |
| Exit window | **None** (no upgrade delay) | None | **None** (instant upgrades) | None | n/a |
| L2BEAT stage | **"not even a Stage 0 project"**; type **"Other"**; reasons `CLOSED_PROOFS` + `SMALL_DAC` | **no stage**; type **"Other"**; reasons `CLOSED_PROOFS` + `LOW_DAC_THRESHOLD` | **"not even a Stage 0 project"**; reasons `NO_PROOFS` + `NO_DA_ORACLE` | not Stage 0; archived | not tracked |
| TVS | $2.12M | (not captured) | $275.77K | $7.77K | n/a |
| Outage / abandonment record | **54 h halt (2024‑05), $160k lost, state+ordering corrupted, RaaS held keys hostage, explorer data deleted**; migrated Conduit→Alchemy | none found | none found | **abandoned** | Evmos precedent: voted dead, all infra offline |

**Parent-chain reference points:** Arbitrum One — **Stage 1**, BoLD, `validatorWhitelistDisabled: true` (**permissionless** validation), `confirmPeriodBlocks` 45,818 (~6 d 9 h), `challengeGracePeriodBlocks` 14,400 (48 h), `validatorAfkBlocks` 201,600 (**28 d** then anyone proposes), `isNodeAvailable: true`. Base — **Stage 1**, permissionless fault proofs, Azul multi-proof (TEE + SP1) since 2026‑05‑26, left Superchain governance 2026‑03‑04, `isNodeAvailable: true`. Both `documented` from L2BEAT config.

---

# Cross-cutting contradictions flagged

1. **Xai DAC size:** docs + L2BEAT `knownMembers` say **6 members**; on-chain `dacKeyset.membersCount` says **5**. Docs vs chain state.
2. **Xai Sentry Nodes:** marketed as securing the chain; L2BEAT states they have "no integrated way to flag an invalid state root… making them just observation nodes."
3. **"L3 / rollup" naming:** Degen, Xai and B3 all self-describe as L3s/rollups; **L2BEAT classifies none of them as a rollup**, assigns them to "Other", and gives Degen and B3 explicitly "not even a Stage 0". Note L2BEAT applies "Optimium" to AnyTrust **L2s** (Arbitrum Nova); these three are typed `layer3` and fall into the "Others" bucket instead — so the exact word on their pages is **"Other"**, not "Optimium".
4. **Base's stack:** L2BEAT config still declares `stacks: ['OP Stack']` while also recording the 2026‑03‑04 Superchain departure; press dates the announcement 2026‑02‑18.
5. **B3 proof path:** `SystemConfig` references a `disputeGameFactory`, but the live output path is the legacy `L2OutputOracle` with a single proposer — L2BEAT reads it as "no proofs".
6. **Force-inclusion delay quoted by third parties:** scalability.guide and Arbitrum's own FAQ page both say "24 hours" as *the* Arbitrum constant; **Degen's actual on-chain value is 4 days** (172,800 blocks / 345,600 s). Generic Arbitrum guidance does not transfer to Orbit chains — `delaySeconds` is settable by the chain owner.
7. **Degen force-inclusion precedent:** the one third-party account of a real force-inclusion describes a 2-day Orbit outage (matching Degen's May 2024 halt) but cites a 24 h delay and names no chain — so it is *probably* not Degen. Treat "someone has demonstrably force-included on Degen" as **unproven**.

---

# What I could not verify

- **Berachain:** block time; explicit reorg/safety condition (<1/3 Byzantine) from Berachain's own docs; archive-node / history-retention policy; whether any escape or exit mechanism exists at all (absence of documentation ≠ absence of mechanism).
- **Evmos shutdown year** (May 15 pass / block 37,318,000 ceased ~May 18 — year unconfirmed against a primary governance record).
- **Xai:** outage/incident history (search budget exhausted before I could query it directly); which of the 6 named DAC entities is absent from the 5-member on-chain keyset; whether Xai's SequencerInbox has the BoLD delay-buffer / Censorship Timeout enabled (no `bufferConfig` key present).
- **B3:** its actual `sequencerWindowSize` — L2BEAT itself says it has "no reference to it" and assumes 12 h; whether its `disputeGameFactory` is live; any outage history; Celestia's retention window for its namespace.
- **Degen:** an official public statement confirming the Conduit→Alchemy migration completed (I inferred it from L2BEAT's live `AlchemyMultisig2` discovery + `BADGES.RaaS.Alchemy`, with Conduit multisigs appearing only in historical diffs); whether any force-inclusion has ever actually executed on Degen; the exact membership of the 3-member DAC.
- **All AnyTrust venues:** whether any DAC member retains data past DACert expiry, and whether any independent party mirrors Degen/Xai batch data. The protocol obligation ends at expiry (~3 weeks) — **for a decades-durable filesystem this is the most consequential unverified item.**
- **Base:** exact fault-dispute-game clock parameters (`MAX_CLOCK_DURATION`, split depth) — the discovery entries I read returned zeroed placeholder values on the game implementations; the date of the 33-minute Base halt.
- **Syndicate Frame Chain:** why L2BEAT labels its DA "Onchain (Ethereum L1 calldata)" for a Base-hosted L3; whether its RPC still answers (not probed).
- **Alt-DA on B3 specifically:** whether B3 uses the OP Stack `alt-da` challenge/resolve contracts at all (no `daChallengeProxy`/`daChallengeWindow` keys appeared in its discovery), so the alt-da spec text I quoted is category-level, not B3-specific.
- I did **not** find a named, packaged tool that reconstructs an AnyTrust L3's state from parent-chain data alone — because per Arbitrum's own docs, no such tool can exist; reconstruction requires a live DAS. Nitro + a reachable DAS REST endpoint is the only documented path.
