# Recovered Claude memo — Chain death case studies

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T04:31:48.131Z
**Claude task:** `ad8839beaac943a0a`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3471
**Original result length:** 22471 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
I have enough verified material. Writing up findings now.

---

# EVM L2/L3 shutdowns & what happens to the data
**Research date: 2026-08-12 / 2026-08-13 UTC** (RPC probes timestamped 2026-08-13 04:2x UTC). Evidence tags: `observed` = I fetched/probed it myself; `documented` = official docs/announcement; `reported` = news/third-party; `inferred`; `unknown`.

## Headline answer to your actual question

The determining variable is **not** "did the chain shut down" — it's **where the chain published its data**, and that split is brutal in the archived population.

`observed` — parsed from the embedded JSON of https://l2beat.com/scaling/archived (fetched 2026-08-12), **91 archived scaling projects**:

| DA layer | Count | Recoverable without the operator? |
|---|---|---|
| Ethereum | 37 (41%) | Yes, in principle |
| DAC (offchain committee) | 35 (38%) | **No, once committee stops serving** |
| Celestia | 6 | Only within Celestia's own pruning window |
| None (Plasma/ZK Stack w/o DA) | 5 | **No** |
| Alt-DA (custom, no attestation) | 4 | **No** |
| Celestia+Espresso+DAC | 1 | Mixed |
| EigenDA / NearDA / Unknown | 3 | Doubtful |

**59% of dead chains never put their data on Ethereum.** Also `observed` from the same dataset:
- **Exit window = "None" on 74 of 91 (81%)**
- **47 of 91 (52%) were RaaS-hosted**: Conduit 16, Caldera 13, Gelato 7, AltLayer 5, Zeeve 2, Alchemy 2, Gateway 2
- **$85,227,398 total value still stranded** on archived chains
- Many Orbit L3 DACs have **threshold 1/1** — literally one machine holds the only copy of chain history (WINR, Proof of Play Apex, Game7, Muster, RARI Chain — all `observed`)

`observed` — the registry at https://chainid.network/chains.json (fetched 2026-08-12): **129 of 2,693 chains carry `status: "deprecated"`**.

---

## Table of dead / frozen / dark chains

Liveness columns are my own probes on 2026-08-12/13 (`observed`).

| Chain | Announced | Actual shutdown | Type / DA | Public RPC now | Explorer now | L1-recoverable? |
|---|---|---|---|---|---|---|
| **Polygon zkEVM** (1101) | 2025-06-11 `documented` | **frozen 2026-07-03 15:55 UTC** `observed` | ZK; calldata→**External** after 2025-12-03 `observed` | **LIVE, frozen, archive reads work** | `zkevm.polygonscan.com` **NXDOMAIN** | Partial — see case 1 |
| **Polygon zkEVM Cardona** (2442) | same | **frozen 2026-07-03 12:03** `observed` | testnet | LIVE, frozen | — | n/a |
| **dYdX v3** | 2024 `documented` | **2024-10-28 12:05 UTC**; frozen 2024-10-30 `documented` | ZK Rollup, **Ethereum DA** | n/a | **L1-derived explorer LIVE** | **YES — proven** |
| **Astar zkEVM** (3776) | Jan 2025 `reported` | **2025-03-31** `observed` (L2Beat milestone) | **Validium, DAC 3/5** | **DEAD** | **NXDOMAIN** | **NO** |
| **PGN / Public Goods Network** (424) | Jan 2024 `reported` | EoL **June 2024** `documented` | OP Stack, **Celestia DA** | **DEAD** (Conduit LB, dead TLS) | **DEAD** (cert `*.t.conduit.xyz`) | **NO** |
| **Kinto** (7887) | Sep 2025 `reported` | **~2025-09-30** `reported` | Optimistic Rollup, **Ethereum DA** | 403 (inconclusive) | 403 (inconclusive) | **Likely yes** |
| **RARI Chain** | `unknown` | `unknown` | Orbit L3, Celestia/Espresso/**DAC 1/1** | **DEAD**; `rari.calderachain.xyz` **NXDOMAIN** | 404 | **NO** |
| **Sanko** | `unknown` | `unknown` | Orbit L3, **DAC 2/3** | **DEAD** | 404 | **NO** |
| **Muster** | `unknown` | `unknown` | Orbit L3, **DAC 1/1** | **DEAD** | **NXDOMAIN** | **NO** |
| **WINR** | `unknown` | `unknown` | Orbit L3, **DAC 1/1** | **DEAD** | **NXDOMAIN** | **NO** |
| **Proof of Play Apex / Boss** | `unknown` | `unknown` | Orbit L3, **DAC 1/1** | **DEAD** both | **DEAD** (Conduit LB) | **NO** |
| **Game7** | `unknown` | `unknown` | Orbit L3, **DAC 1/1** | **DEAD** | **DEAD** (Conduit LB) | **NO** |
| **Corn** | `unknown` | `unknown` | Orbit, **DAC**; $19.2M stranded | **DEAD** (3 endpoints) | **DEAD** | **NO** |
| **Kroma** (255) | `unknown` | `unknown` | OP Stack, **Ethereum DA** | **DEAD**; `api.kroma.network` **NXDOMAIN** | **NXDOMAIN** | Likely yes |
| **Redstone** (690) | `unknown` | `unknown` | OP Stack, **Alt-DA, no attestation** | **DEAD** | 403 | **NO** |
| **Evmos** (9001) | `unknown` | `unknown` | Cosmos EVM | **DEAD** (2 endpoints) | `escan.live` **NXDOMAIN** | n/a (sovereign) |
| **Canto** (7700) | `unknown` | `unknown` | Cosmos EVM | **DEAD** (2 endpoints) | 403 | n/a |
| **Milkomeda C1/A1** | `unknown` | `unknown` | sidechain | **DEAD** both | **NXDOMAIN** | **NO** |
| **Mint, Form, Ham, Aleph Zero EVM, Capx** | `unknown` | `unknown` | mixed | **DEAD** | mostly dead | mixed |
| **Optimism Goerli (420), Base Goerli (84531), Goerli L1** | — | Goerli sunset | testnets | **ALL DEAD** `observed` | — | n/a |

**Still alive** (probed producing blocks 2026-08-13, so the rumors are wrong): Arbitrum Nova, Metis Andromeda, Boba, Fuse, Aurora, Kava EVM, Manta Pacific, Xai, Fraxtal, Immutable zkEVM, Blast, Zora, opBNB, Mode, **Degen Chain**, Forma, and **Swellchain** — the last is on L2Beat's archived list yet still producing blocks. **L2Beat "archived" means L2Beat stopped tracking, not that the chain is dead.** Do not read that list as a death certificate.

---

## Case study 1 — Polygon zkEVM: the rollup that stopped being a rollup before it died

This is the most important case for you, and it inverts the naive assumption.

- `documented` — Announced 2025-06-11, https://forum.polygon.technology/t/sunsetting-polygon-zkevm-mainnet-beta-in-2026/21020: 12-month wind-down; "No funds will be lost—users will always have the ability to withdraw bridged assets"; **forced transactions remain permanently enabled**. The announcement says **nothing** about contract state, RPC, explorer, or historical data access.
- `observed` — L2Beat tracked-tx config (raw page payload, 2026-08-12) shows batch submission via `sequenceBatches(tuple(bytes transactions, ...)[] batches, ...)` at L1 `0x519E42c24163192Dca44CD3fBDCEBF6be9130987`, selector `0xb910e0f9`. The `bytes transactions` argument means **L2 transaction data travelled in Ethereum L1 calldata** — consistent with the claim it never adopted blobs.
- `observed` — that tracking config carries `untilTimestamp: 1764753203`. On **2025-12-03T09:13:23 UTC, Ethereum block 23,931,951** (I fetched the tx: `0xd8eb9f7b…efe2a5`, a Gnosis Safe `execTransaction` to `0x242dae44…3e21`), Polygon zkEVM **migrated to Pessimistic Proofs** and "stops validating the full L2 state and moves to bridge accounting proofs."
- `observed` — L2Beat's **current** classification of Polygon zkEVM: badge `CustomDA` / "Custom DA solution"; `daLayer: ["None"]`; `stage: "Not applicable"`; Data availability = **"External — Proof construction and state derivation rely fully on data that is NOT published onchain"**; DA bridge = "None"; Exit window = "None"; Sequencer failure = "No mechanism"; State validation = "None — Currently the system permits invalid state roots."
- `observed` — chain is **frozen at block 33,391,890, last block timestamp 2026-07-03T15:55:44 UTC**, confirmed identical across four consecutive probes and independently via a second provider (`zkevm-rpc.com` and `polygon-zkevm.drpc.org`). chainId `0x44d`.
- `observed` — **the RPC still works and still serves archive-depth reads**: `eth_getCode` at latest returns bytecode; `eth_getBalance` at block 1,000,000 returns a value; `eth_getLogs` over a historical range returns logs. So the frozen chain is fully readable *today* — via one operator's servers.
- `observed` — **the canonical block explorer is gone**: `zkevm.polygonscan.com` returns **NXDOMAIN**, while L2Beat still lists it as the project's explorer. `zkevm.blockscout.com` returns 404.
- `documented` — https://www.alchemy.com/docs/reference/polygon-zkevm-deprecation-notice: Alchemy ended support 2026-07-01; "there is no migration path for Polygon zkEVM, as the network itself was shut down." No mention of historical data preservation.
- `reported` — a post-shutdown claim interface for wallet-held assets exists, executed entirely on Ethereum; DeFi-locked funds could **not** be auto-migrated and risk being inaccessible (cryptonews.net/outposts.io, ~July 2026).
- `observed` — the AggLayer shared bridge `0x2a3DD3EB832aF982ec71669E178424b10Dca2EDe` still holds **6,980.6 ETH** on Ethereum. Caveat: this is *shared* escrow across AggLayer chains, not zkEVM-exclusive.
- `reported` — Lorenz Lehmann (growthepie) claimed zkEVM "was never upgraded to incorporate Ethereum's Blob data structure", ~$1M/yr operating loss, TVL −80% in 2025 to $16.25M from a $187M ATH (cryptopotato.com; **article date not shown on the page — treat as undated**).

**Takeaway:** a chain can silently downgrade its durability guarantee *while still calling itself the same chain*. For ~2.7 years zkEVM's data was on Ethereum calldata; then in Dec 2025 it moved to external DA with no onchain data and no state validation, and seven months later it froze. Anything written in that final window is, per L2Beat's own classification, not derivable from L1. **I could not independently confirm the exact post-2025-12-03 DA mechanism** (Etherscan API requires a key; keyless call returned `Missing/Invalid API Key`) — flagged as a verification gap.

## Case study 2 — dYdX v3: proof that Ethereum DA actually works decades-style

The single best positive datapoint I found, and it is `observed` live today.

- `documented` — https://www.dydx.xyz/blog/v3-product-sunset: shutdown **2024-10-28 12:05 UTC**; contracts registered as **frozen 2024-10-30**; post dated 2025-01-24. Positions settled to USDC at oracle prices. "dYdX Trading does not and will never custody your funds. The state of all accounts and all funds is stored on the Ethereum smart contract." And explicitly: **"dYdX Trading plans to host read-only historical data via API for at least 1 year after the shut-down date"** — i.e. the operator's own commitment expired around Oct 2025.
- `observed` — L2Beat project entry: `archivedAt: 1733356800` (2024-12-05); banner "dYdX v3 shut down on October 28th and is currently processing withdrawals in escape-hatch mode."; DA = **"Onchain — All of the data needed for proof construction is published on Ethereum L1"**; Exit window 9d; Proposer failure = "Use escape hatch — Users are able to trustlessly exit by submitting a Merkle proof of funds."
- `observed` — L2Beat's own note: state "can be independently derived from data (state updates) published on Ethereum by running an open-source StarkEx Explorer"; "No compression is used, state updates and other metadata are simply serialized for L1."
- `observed` — **I fetched https://explorer.dydx.exchange/ on 2026-08-12 and it is LIVE**, rendering: "dYdX v3 has been discontinued and the exchange contracts are frozen. Use the Escape Hatch functionality to withdraw your funds." Statistics: **24,082 state updates, 3,057 forced transactions, 153 offers**, most recent state update **653 days** old. https://github.com/l2beat/starkex-explorer returns 200.
- `observed` — **$32,201,482 still secured on dYdX v3** per L2Beat, ~21 months after shutdown, despite a working escape hatch. **3,057 forced transactions is your "did users actually exit" number — and clearly most did not.**

**Takeaway:** with data on Ethereum, a *third party* (L2Beat) rebuilt a working explorer and exit path that still functions ~2 years after the operator walked away. That is the durability property you want. Important caveat: dYdX v3 published **balances/state updates, not transactions** — so positions are recoverable, full tx history is not.

## Case study 3 — Astar zkEVM: validium, data gone

- `observed` — L2Beat milestone: **"Astar zkEVM sunsets" 2025-03-31**; page states "This project is archived and no longer maintained."
- `reported` — Astar's own X post (@AstarNetwork, 2025-03-28): sunset moved up from April 1 to **March 31, 2025**; "Assets left on Astar zkEVM after this date **may no longer be accessible**."
- `observed` — DA = **"External (DAC)… data that is NOT published onchain. There exists a Data Availability Committee (DAC) with a threshold of 3/5"**; "Economic security: None" (no slashing); Sequencer failure = **"No mechanism"**; Exit window = **"None"**; Proposer failure = **"Cannot withdraw"**. Stack: Agglayer CDK, RaaS: Gelato.
- `observed` — **RPC `rpc.startale.com/astar-zkevm` DEAD; explorer `astar-zkevm.explorer.startale.com` NXDOMAIN; testnet `rpc.startale.com/zkyoto` DEAD.**

**Takeaway:** validium + 3/5 DAC + no escape hatch + host walked away = **the chain's history is, as far as I can verify, unrecoverable by any public means.** Nothing on Ethereum but hashes. This is the exact failure mode that kills a decades-durability design.

## Case study 4 — PGN: Celestia DA plus a RaaS host that stopped hosting

- `documented` — https://gov.gitcoin.co/t/pgn-shutdown-a-recap/18794 (post dated 2024-05-14): announced Jan 2024, completion by June 2024; Gitcoin "working to ensure that all assets will still be available and claimable post shut down." **No statement about archival or post-shutdown data access.** Reason: "Critical infrastructure was missing at launch."
- `reported` — withdrawal deadline June 30 (coindar); Contract Secured Revenue proved unviable; low bridge liquidity, no DEX infra, no token/airdrop pull.
- `observed` — L2Beat: OP Stack, **DA layer = Celestia**, RaaS = **Conduit**, Stage 0, TVS **$0**. DA risk: "state derivation fully rely on data that is posted on Celestia. **Sequencer tx roots are not checked against the Blobstream bridge**"; Sequencer failure = "Self sequence"; Proposer failure = **"Cannot withdraw"**; Exit window = "None".
- `observed` — `rpc.publicgoods.network` and `explorer.publicgoods.network` both resolve to **34.110.231.171** (Conduit's shared GCP load balancer) and **fail TLS — the cert only covers `*.t.conduit.xyz`**. Sepolia PGN also dead. Effectively: DNS still points somewhere, nothing serves the chain.
- `observed` — the **same IP 34.110.231.171** also fronts the now-dead endpoints for **Proof of Play Apex, Game7, and Corn**. One decommissioned RaaS load balancer is the tombstone for multiple chains.

**Takeaway:** offchain DA (Celestia, not even Blobstream-verified) + a RaaS host with no ongoing obligation. TVS $0 suggests funds got out; the *data* did not.

## Case study 5 — The Orbit L3 cohort with 1-of-1 DACs

`observed`, all from the L2Beat archived dataset: **WINR, Proof of Play Apex, Proof of Play Boss, Game7, Muster, RARI Chain, XCHAIN, Powerloom, Ebi Chain, Fluence, OEV Network, HYCHAIN, Edgeless, Everclear Hub, L3X, Onyx, Blessnet, inEVM, Geist, Re.al** — Arbitrum Orbit, DA = DAC, most with **threshold 1/1**, Sequencer failure = "Self sequence", Exit window = **"None"**, all archived.

A 1-of-1 DAC means **a single machine, run by the chain's operator or its RaaS provider, holds the only copy of the chain's transaction history.** When that operator stops paying the bill, the history ceases to exist. `observed`: every one of these I probed has a dead RPC, and `rari.calderachain.xyz`, `muster-explorer.alt.technology` and `explorer.winr.games` are **NXDOMAIN** — the domains themselves are gone.

Related `reported` datapoint on L3 fragility: Degen Chain (Orbit L3 on Base, **AnyTrust** DA, Conduit-hosted) halted block production for **50+ hours in May 2024** with a **~500,000-block reorg** caused by a Conduit config change (theblock.co, thedefiant.io). Degen Chain itself is `observed` alive today (head 26,959,29x, 2026-08-13). But a 500k-block reorg on a live chain is itself a data-destruction event.

## Case study 6 — Kinto: Ethereum DA didn't save the business, but should save the data

- `reported` — July 2025 exploit drained ~577 ETH (~$1.6M) via an ERC-1967 proxy flaw; shutdown announced Sept 2025; users urged to withdraw by **2025-09-30** "to avoid having to use a perpetual claim contract later"; token −85…91% (unchainedcrypto, thedefiant, cryptotimes).
- `observed` — L2Beat: **Optimistic Rollup, Stage 1, DA = "Onchain — All of the data needed for proof construction is published on Ethereum L1"**, RaaS Caldera, Proposer failure = **"Self propose"**, TVS $12,057 remaining.
- `observed` — `rpc.kinto.xyz` and `explorer.kinto.xyz` return **Cloudflare 403**; `kinto-mainnet.calderachain.xyz` dead. **403 is bot-blocking, not proof of death — inconclusive.**

Note the phrase "**perpetual claim contract**" — that's the correct pattern, and it's rare.

---

## Cross-cutting finding: Ethereum's own history is not guaranteed forever

This matters because "recoverable from L1" is doing a lot of work above.

- `documented` — https://eips.ethereum.org/EIPS/eip-4444 — status **"Stagnant"**, created 2021-11-02. Proposes clients "stop serving historical headers, bodies, and receipts older than one year on the p2p layer" (`HISTORY_PRUNE_EPOCHS` = 82,125 epochs ≈ 1 year). Preserving history is delegated *outside* the protocol — torrents, IPFS, Portal Network, The Graph. It explicitly names "censorship/availability risks if there is a lack of incentives to keep historical data."
- `documented` — https://ethereum.org/en/roadmap/statelessness/: "EIP-4444 is not yet ready to ship, but it is under active discussion"; obstacles are community-management rather than technical; preservation falls to Portal Network, apps' own archives, "altruistic actors" and DAOs.
- `observed` — a public Ethereum RPC (`ethereum-rpc.publicnode.com`) still served block 1,000,000 (2016-02-13) on 2026-08-12. History has not yet been dropped in practice on that provider.
- **Blobs vs calldata is decisive here**: L2Beat's own glossary (`observed`) — "Blobs persist on Ethereum's Beacon Chain **ephemerally**… blobs do not interact with the execution layer and **are deleted after a certain period of time**." A modern rollup posting to blobs gives you ~18 days of retrievability from consensus nodes, after which you depend on archivers. A rollup posting to **calldata** puts data in execution-layer history — durable today, but explicitly targeted by EIP-4444.

For a decades horizon: **calldata > blobs > Celestia/EigenDA > DAC > nothing**, and even calldata is a policy decision that could change.

---

## Could not verify

- **Exact shutdown/announcement dates** for: RARI Chain, Sanko, Muster, WINR, Proof of Play Apex/Boss, Game7, Corn, Kroma, Redstone, Mint, Form, Ham, Aleph Zero EVM, Capx, Milkomeda, Canto, Evmos. I have `observed` dead infrastructure but **no dated announcement** for any of them. My WebSearch budget hit its 200-call session cap partway through, so I could not run announcement searches for these.
- **Whether Canto and Evmos formally shut down** vs. merely lost their public RPCs/explorers. `observed`: all listed RPCs dead, `escan.live` NXDOMAIN. Status otherwise `unknown`.
- **Polygon zkEVM's post-2025-12-03 DA mechanism** in precise terms (did it switch to `sequenceBatchesValidium`, or is L2Beat's "External" a consequence of the pessimistic-proof model?). Etherscan API needs a key.
- **Whether Polygon zkEVM's pre-2025-12 L1 calldata is still fetchable** — highly likely `inferred` yes, but I did not retrieve an actual historical `sequenceBatches` tx to prove it.
- **Kinto, Canto, Redstone explorer status** — HTTP 403 is Cloudflare bot protection; inconclusive.
- **PGN's actual unbridged residual value** — the recap post gives no figures; L2Beat shows TVS $0.
- **Aevo, Lyra/Derive** — not probed; no evidence gathered either way.
- **Polygon Miden** — no evidence gathered.
- **growthepie's inactive-chain list** — not fetched (search budget exhausted before I got to it). L2Beat links growthepie.com/chains/polygon-zkevm as a source, so a cross-check there is the obvious next step.
- **Whether any of these chains' data has been archived by a third party** (Arweave/IPFS snapshots, Portal Network) — not investigated.

## Unverified recollections — do not rely on

These are things I believed going in but **could not source in this session**. Treat as leads, not facts:
- That Polygon Hermez (Hermez 1.0) was formally deprecated in favour of zkEVM around 2023 — L2Beat lists it archived with Ethereum DA, 7d exit window, "Force via L1", $235,298 TVS `observed`, but I found **no dated shutdown announcement**.
- That OMG Network formally ceased operations — L2Beat lists it archived, Plasma, **DA layer "None"**, `observed`; no date sourced.
- That Loopring wound down its L2 after its 2024 exploit — archived on L2Beat with Ethereum DA `observed`; no date sourced.
- That Fuel v1 was deliberately retired for Fuel v2 — archived, Ethereum DA, **Stage 2**, exit window **∞** `observed`; no date sourced.
- That ZKsync Lite was deprecated in favour of ZKsync Era — archived, Ethereum DA `observed`; no date sourced.
- That Conduit or Caldera published a formal policy on de-provisioning chains — **I saw the effects (dead shared load balancer, NXDOMAIN'd Caldera subdomains) but found no policy document.**

---

## What this means for a decades-readable design

1. **"It's an L2, it settles to Ethereum" is not a durability guarantee.** 59% of dead chains put no data on Ethereum. Settlement ≠ data availability.
2. **The DA classification can change under you.** Polygon zkEVM went from L1 calldata to external DA on 2025-12-03 without changing its name or chain ID. Any assumption baked at deploy time can be invalidated by a later upgrade — and with "instantly upgradable" contracts and a "None" exit window, you get no warning period.
3. **A frozen chain with a live archive RPC is one invoice away from unreadable.** Polygon zkEVM is readable today only because someone still runs `zkevm-rpc.com`. Its official explorer's DNS is already gone, six weeks after freeze.
4. **The only demonstrated multi-year recovery is dYdX v3** — and it worked *because* an independent party could rebuild everything from Ethereum L1 with open-source software. That's the property to design for: can a stranger with an Ethereum archive node reconstruct your data with no cooperation from anyone?
5. **Escape hatches don't get used.** $32.2M still stranded on dYdX v3 after ~21 months with a working escape hatch and only 3,057 forced transactions. Design for data that doesn't need anyone to take an action.
6. **Avoid 1-of-1 DAC chains categorically.** One machine, one bill, zero recourse.
7. **Even on Ethereum, prefer calldata over blobs for anything you need past ~18 days**, and assume EIP-4444-style history expiry eventually lands — plan for an independent archival copy regardless.
