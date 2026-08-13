# Recovered Claude memo — Dead chains and RaaS risk

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T04:47:14.465Z
**Claude task:** `a14ec6f91b3516f9d`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3533
**Original result length:** 42290 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; one whitespace-only blank line cleaned; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
All research complete. Findings below.

---

# Chain death, RaaS risk, and steward dependency — evidence report
**All live probes performed 2026‑08‑13 UTC.** Evidence tags: `observed` (I directly measured it), `documented` (primary/official source), `reported` (secondary press), `inferred`, `unknown`.

Method note: WebSearch budget was exhausted at the start, and DuckDuckGo/Mojeek both served CAPTCHA/anomaly pages (not bypassed). Everything below comes from direct `curl`/WebFetch against named URLs, L2BEAT's embedded JSON payloads, Discourse `search.json` APIs, the Wayback CDX API, and direct `eth_call` against Ethereum mainnet via `https://ethereum-rpc.publicnode.com`.

---

## QUESTION 1 — CHAIN DEATH, CONCRETE CASES

### 1.0 The scoreboard (`observed`, L2BEAT, 2026‑08‑13)
- `https://l2beat.com/scaling/archived` lists **96 archived project slugs**; `https://l2beat.com/scaling/summary` lists **107 live**. Roughly half of every EVM L2/L3 L2BEAT has ever tracked is now archived.
- Archived, grouped by RaaS provider (`observed`, parsed from the archived page's JSON):

| RaaS | archived | live | ratio |
|---|---|---|---|
| No RaaS (self-run) | 44 | 63 | 0.70 |
| Conduit | 16 | 20 | 0.80 |
| Caldera | 13 | 9 | **1.44** |
| Gelato | 7 | 3 | **2.33** |
| AltLayer | 5 | 2 | **2.50** |
| Zeeve | 2 | 3 | 0.67 |
| Alchemy | 2 | 5 | 0.40 |
| Gateway | 2 | 0 | — |

Caldera, Gelato and AltLayer each have **more dead chains than live ones**.

### 1.1 Public Goods Network (PGN) — OP Stack L2, Conduit-operated — **DEAD, funds drained, read path gone**
- `documented` L2BEAT: "PGN was sunset in June 2024 and the centralized operator stopped their service. The current canonical bridge escrow contracts are modified to allow for withdrawals of ETH and ERC‑20s based on a pre-configured merkle root." — https://l2beat.com/scaling/projects/publicgoodsnetwork (checked 2026‑08‑13). `archivedAt` = 2024‑12‑13.
- `documented` Timeline from L2BEAT milestones: chain announced/launched 2023‑07‑06; switched DA to Celestia 2024‑01‑26; **2024‑12‑10 "PGN starts sunset process" — shutdown begun by pausing the bridge** (tx `0xaf8648b0…`); **2024‑12‑17 bridge unpaused after claiming contracts updated** (tx `0x49a8691b…`).
- `documented` Gitcoin governance post (announcement 2024‑10‑30): a `BalanceClaimer` contract with an **immutable merkle root** was deployed; ~$525k ETH + ~$90k tokens claimable; "**no immediate deadline for claims**, though this could change." — https://gov.gitcoin.co/t/updating-pgns-contract-to-make-funds-easier-to-claim/19569
- `observed` **Final state root WAS posted.** `L2OutputOracle` `0xA38d0c4E6319F9045F20318BA5f04CDe94208608`: `latestOutputIndex()` = 12596, root timestamp **2024‑12‑17T11:07:55Z**, L2 block **22,674,600**. No output since.
- `observed` **The escrow is empty.** `OptimismPortal` `0xb26Fd985c5959bBB382BAFdD0b879E149e48116c` = **0 ETH**, `paused()` = false. `L1StandardBridge` `0xD0204B9527C1bA7bD765Fa5CCD9355d38338272b` = 0 ETH. `BalanceClaimer` `0x0Ca4C7A370E0155c77a33e78443a54D749E0BC21` = 0 ETH. L2BEAT `totalTvs` = **0**.
- `observed` **Read path is gone.** `rpc.publicgoods.network` and `explorer.publicgoods.network` resolve (34.110.231.171) but accept no connection. `publicgoods.network` returns HTTP 404. The chain is still in the ethereum-lists registry (chainId 424) pointing at those dead endpoints — https://chainid.network/chains.json.
- `observed` **The RaaS provider still holds the keys on a chain that died two years ago.** L2BEAT permissions: `L2OutputOracle` "admin: ProxyAdmin; **ultimately Conduit Multisig 1**". Conduit's discovery changelog for PGN continues past death: signer removed 2025‑10‑03, key rotation 2025‑12‑05, "New member conduit msig" **2026‑01‑21**.
- **Contract data outcome:** `inferred` — token balances were converted to an L1 merkle claim; **arbitrary contract state was not preserved in any user-accessible form**. No public archive node, no RPC, no explorer. DA was Celestia from 2024‑01, so pre/post-migration reconstruction requires two different DA sources.

### 1.2 Astar zkEVM (Polygon/Agglayer CDK Validium, Gelato RaaS) — **DEAD, documentation deleted**
- `documented` L2BEAT milestone: **"Astar zkEVM sunsets — Astar Network has officially sunset," dated 2025‑03‑31**, citing https://x.com/AstarNetwork/status/1906658995538194650. `archivedAt` = 2025‑04‑01. — https://l2beat.com/scaling/projects/astarzkevm
- `observed` **Explorer domain deleted**: `astar-zkevm.explorer.startale.com` → NXDOMAIN. RPC `https://rpc.startale.com/astar-zkevm` → no response (host resolves to an Azure API-management endpoint; the route is gone).
- `observed` **Documentation deleted**: `https://docs.astar.network/` returns 200 but `https://docs.astar.network/docs/learn/zkEVM/` returns **404**. The blog URL L2BEAT lists as Astar zkEVM's website, `https://astar.network/blog/astar-evolution-phase-1-56`, returns **404**; `astar.network/sitemap.xml` also 404.
- `observed` L1 contracts persist: Validium `0x1E163594e13030244DCAf4cDfC2cd0ba3206DA80` under PolygonRollupManager `0x5132A183E9F3CB7C848b0AAC5Ae0c4f0491B7aB2`; last L2BEAT discovery entry is a config-only rerun 2025‑07‑14.
- `unknown` — exact withdrawal deadline, whether a final verified batch was posted, and whether an archive node was preserved. **I could not verify the announcement text itself** (X.com not fetchable; Astar's own post is 404 and the sitemap is gone). **Flag: Astar deleted its own sunset documentation.**

### 1.3 Degen Chain (Arbitrum Orbit L3 on Base) — **ALIVE; migrated Conduit → Alchemy; escape hatch was disabled for 1000 days**
This is the most instructive case and the lead checks out.

- `reported` The Block, **published 2024‑11‑07** (https://www.theblock.co/post/325132/): May 2024 Conduit pushed an unannounced upgrade causing **54 hours of downtime**; users lost **~$160,000**; Conduit declined compensation and offered six months of free service; Degen served non-renewal and sought to migrate; Conduit allegedly **confiscated sequencer fees, deleted block-explorer data, and withheld the Gnosis Safe keys** needed to migrate, despite a contractual 30‑day key-transfer provision; a six-month standoff followed. Conduit's stated position: it had not received a transfer address. Andre Cronje quoted: "if you use 'rollup as a service,' you are not in control and are at the whims of the provider."
- `observed` **On-chain corroboration of the outage and its cost to users' escape hatch.** L2BEAT discovery changelog for Degen, **2024‑05‑14**: "This update extends the sequencer-only window for degen chain by 1000x to **1000d** (`maxTimeVariation.delayBlocks`, `delaySeconds`). Context: **Big chain reorg on the L2, no batches posted for the last ~30h**." The diff shows `delaySeconds` 345,600 → **86,400,000** and `delayBlocks` 172,800 → 3,456,000. **Force-inclusion via L1 — the only user-side escape hatch — was set ~1000 days out.**
- `observed` **Restored 2025‑01‑15**: "ArbOS v32 upgrade to known shapes and **maxTimeVariation reset**" — `delaySeconds` back to 345,600 (4d), `delayBlocks` back to 172,800. So the escape hatch was effectively unusable from May 2024 to Jan 2025.
- `observed` **Migration resolved on-chain, ~6 months after the outage**: **2024‑11‑08 "Governance moved to DegenMultisig"** — diff shows `ConduitMultisig3 (0x7dCe2FEE5e30EFf298cD3d9B92649f00EBDfc104)` **Status: DELETED**, `DegenMultisig (0x871e290d5447b958131F6d44f915F10032436ee6)` **Status: CREATED**. Preceding entries show Conduit adding signers to ConduitMultisig3 on 2024‑11‑01 and 2024‑11‑05.
- `observed` **New custodian: Alchemy.** L2BEAT lists Degen's RaaS as **Alchemy**; `SequencerInbox` `base:0x6216dD1EE27C5aCEC7427052d3eCDc98E2bc2221` has "admin: ProxyAdmin; **ultimately AlchemyMultisig2**", `upgradableBy: AlchemyMultisig2, delay: **no**". Alchemy's own marketing page lists Degen Chain as a customer — https://www.alchemy.com/rollups. Alchemy multisig signer rotations observed through **2026‑03‑04**.
- `observed` **Chain is alive today**: `https://rpc.degen.tips` → head block **26,959,302**; `https://explorer.degen.tips` → HTTP 200. Latest protocol change **2026‑06‑11** ("RollupProxy `wasmModuleRoot` updated to ArbOS v51.1"). Not archived on L2BEAT.
- `observed` **Risk profile unchanged**: Stage "NotApplicable"; state validation = fraud proofs with only **2 whitelisted** challengers; DA = **external DAC (2/3)**, not on Ethereum; exit window = **None** (instantly upgradable); sequencer failure = self-sequence with up to **4d** delay.
- **State preserved or lost?** `inferred` — the L3 kept its chain identity and contract addresses across the RaaS migration (same `SequencerInbox`/`RollupProxy`, continuous block height). The **explorer data Conduit is reported to have deleted** was indexer data, not chain state. But because DA is a private DAC and not Ethereum, **there is no permissionless way to reconstruct Degen state** if the DAC stops serving. `unknown` — whether the ~$160k lost in the reorg was ever repaid; no public post-resolution statement found (degen.tips carries no status/wind-down notice).
- **Bottom line for the lead:** the migration happened, but Degen swapped one RaaS custodian for another with no-delay upgrade power. "Not your keys, not your blockchain" was not solved, only reassigned.

### 1.4 Kroma (OP Stack–derived L2, self-run) — **DEAD; final state root posted; every domain deleted**
- `documented` L2BEAT red warning: "**Kroma shut down on June 30, 2025. After this date, funds retrieval is not guaranteed.**" Announcement 2025‑06‑20 (https://x.com/kroma_network/status/1936692354603520198). `archivedAt` = 2025‑07‑09. — https://l2beat.com/scaling/projects/kroma
- `observed` **Final state root WAS posted, one day after halt.** `L2OutputOracle` `0x180c77aE51a9c505a43A2C7D81f8CE70cacb93A6`: `latestOutputIndex()` = 15966, `nextOutputIndex()` = 15967, `latestBlockNumber()` = **28,738,800**, final root timestamp **2025‑07‑01T08:38:47Z**, submitter `0x3aa00bB915a8e78b0523e4C365e3E70A19d329e6`. Nothing since — 13½ months of silence.
- `observed` **Entire web presence deleted**: `api.kroma.network`, `blog.kroma.network`, `docs.kroma.network`, `specs.kroma.network`, `bridge.kroma.network`, `kromascan.com` → all **NXDOMAIN**. `blockscout.kroma.network` unreachable. Third-party RPC `rpc-kroma.rockx.com` → HTTP 502.
- `observed` **Wayback**: `https://kroma.network/` has read "**Kroma.Network – Update Coming Soon. Site Under Construction.**" continuously from at least 2025‑07‑24 through 2026‑06‑06 (snapshots via `https://web.archive.org/cdx/search/cdx?url=kroma.network/`; text fetched from `web.archive.org/web/{ts}id_/`).
- `observed` Escape hatch on paper was good — DA **onchain**, "Proposer failure: Self propose — Anyone can be a Proposer" via `ValidatorPool` `0xFdFF462845953D90719A78Fd12a2d103541d2103`. In practice nobody has proposed since 2025‑07‑01.
- **Contract data outcome:** `inferred` — because DA was on Ethereum L1, Kroma state is in principle reconstructible from L1 calldata/blobs by anyone willing to run a derivation pipeline. But **the spec (`specs.kroma.network`) and node docs needed to do so are deleted**, and no public RPC or archive node exists. This is the "recoverable in theory, unreadable in practice" case.

### 1.5 Redstone (OP Stack, altDA/"plasma" mode, Lattice) — **DEAD May 2026; ~$58k still stranded in an unreadable chain**
This is the sharpest cautionary case for your use case, because DA was *not* on Ethereum.

- `documented` L2BEAT red warning: "**Redstone will shut down on May 15, 2026 (23:59 UTC). Users must withdraw their funds before that date, especially assets held in contracts like Uniswap pools, which will not be recoverable after shutdown.**" Announcement **2026‑04‑15** by Lattice (https://x.com/latticexyz/status/2044103611072835744). `archivedAt` = **2026‑05‑21**. — https://l2beat.com/scaling/projects/redstone
- `observed` **Final state root posted 2026‑05‑22T08:18:59Z** (a week *after* the announced halt): `L2OutputOracle` `0xa426A052f657AEEefc298b3B5c35a470e4739d69`, `latestOutputIndex()` = 1554, L2 block **33,588,000**.
- `observed` **Money is still there and still stuck**: `OptimismPortal` `0xC7bCb0e8839a28A1cFadd1CF716de9016CdA51ae` holds **22.107 ETH**, `paused()` = false. `L1StandardBridge` `0xc473ca7E02af24c129c2eEf51F2aDf0411c1Df69` = 0 ETH. L2BEAT `totalTvs` ≈ **$57,770**.
- `observed` **Read path gone**: `rpc.redstonechain.com` → no response (CloudFront distribution gone). `explorer.redstone.xyz` → HTTP 403.
- `observed` **Risk profile makes recovery near-impossible**: DA = "**External** — Proof construction and state derivation rely fully on data that is **NOT published onchain**." State validation = "**None** — the system permits invalid state roots." Proposer failure = "**Cannot withdraw** — only whitelisted proposers can publish state roots; in the event of failure withdrawals are frozen."
- **Contract data outcome:** `inferred`, high confidence — withdrawals initiated at or before block 33,588,000 are provable only if you can produce a storage merkle proof against the final root, which requires the L2 state, which requires the off-chain DA data, which is gone with the RPC. **Assets inside contracts (the announcement's own example: Uniswap pools) are unrecoverable, exactly as Lattice warned.** Escrow persists on L1 but is functionally orphaned.

### 1.6 The rest — status as of 2026‑08‑13

**ALIVE** (`observed`: on L2BEAT summary AND RPC answered `eth_blockNumber`):

| Chain | head block | note |
|---|---|---|
| Zora | 0x2fa3063 | live |
| Mode | 0x293647b | live |
| Blast | 0x251753b | live |
| Mantle | 0x5ea2b60 | live |
| Fraxtal | 0x260b5bc | live |
| Cyber | 0x22e383b | live |
| X Layer (OKX) | 0x40af342 | live; registry `status: active` |
| Immutable zkEVM | 0x2834133 | live |
| Derive (ex‑Lyra) | 0x29481af | live via `rpc.lyra.finance`; L2BEAT slug is now `derive` |
| Manta Pacific | — | live on L2BEAT as `mantapacific` (not RPC-probed) |
| Degen | 0x19b5dc6 | live, see §1.3 |

**AEVO — branding/reality mismatch** (`observed`): L2BEAT lists Aevo as **live** and its Conduit-shared `SuperchainConfig` was upgraded as recently as **2026‑08‑04**; aevo.xyz is trading normally (page dated 2026‑08‑03). But the **publicly registered RPC `rpc.aevo.xyz` is NXDOMAIN**, as are `mainnet.aevo.xyz` and `aevo.xyz/rpc`. The chain exists; the public read endpoint listed in the canonical chain registry does not. **Do not treat "chain is alive" as "chain is publicly readable."**

**DEAD / ABANDONED — canonical public RPC deleted while assets remain** (`observed` DNS + `documented` L2BEAT):

| Chain | archivedAt | canonical RPC (chainid.network) | probe | stranded TVS |
|---|---|---|---|---|
| **Sanko** (Orbit L3, Caldera) | 2026‑04‑29 | `mainnet.sanko.xyz` | **NXDOMAIN** | **~$970,387** |
| **RARI Chain** (Orbit L3, Caldera) | 2026‑06‑30 | `rari.calderachain.xyz` | **NXDOMAIN** | **~$572,953** |
| **Mint** (OP Stack) | — | `rpc.mintchain.io` | timeout; `explorer.mintchain.io` CloudFront gone | ~$42,117 |
| **Muster** (Orbit L3, AltLayer) | 2026‑04‑29 | `muster.alt.technology` | **NXDOMAIN** | ~$12,246 |
| **Kinto** | — | — | — | ~$12,057 |
| **WINR** (Orbit L3, Conduit) | 2026‑01‑08 | `rpc.winr.games` | **NXDOMAIN** | ~$9 |
| **Proof of Play Apex** (Orbit L3, Conduit) | 2025‑10‑07 | `rpc.apex.proofofplay.com` | resolves to Conduit LB, **TLS cert failure** | $0 |

Supporting on-chain signals (`observed`, L2BEAT discovery changelogs):
- **Sanko**: RollupProxy `currentRequiredStake` ratcheting 0.1→0.2→0.3→0.6→0.7 ETH through May 2026 because "the first unresolved node is past its deadline" — i.e. **assertions are stalling; nobody is resolving them**. Nearly $1M sits behind an RPC that no longer resolves.
- **RARI**: still under `Caldera Multisig 1 (arb1:0x139C5A235632EDdad741ff380112B3161d31a21C)`, explicitly "**shared with blessnet, inevm, molten**" — one Caldera multisig is the upgrade authority for **four chains at once**. Signer rotated 2026‑06‑29, after the chain's RPC died.
- **Muster**: challenge period cut from 7200 → **150 L1 blocks (~24h → ~30 min)** on 2026‑03‑25; red warning "Critical contracts can be upgraded by an **EOA**."
- **WINR**: "`stakerCount` decreased from 1 to 0, **no active validators on the chain**" (2026‑01‑09), yet Conduit added a multisig member 2026‑01‑21.
- **Proof of Play Apex**: "No more stakers. Project archived" (2025‑10‑10), then "**Upgrade to unverified Bridge contract**. Project already archived" (2025‑10‑20) — an unverified upgrade pushed to a dead chain's bridge.

**Other 2025–2026 deaths, verbatim from L2BEAT** (`documented`, https://l2beat.com/scaling/archived, checked 2026‑08‑13) — useful because they show the *range* of outcomes:

- **Mint** — "Mint Blockchain ceased operations on **April 17, 2026** and only supports withdrawals. Users must withdraw ETH, WBTC, USDC, USDT to Ethereum via mintchain.io/withdraw **before October 20, 2026. Any assets left on the chain after that date will be unrecoverable.**" ← explicit hard deadline; the explorer is already gone.
- **Everclear Hub** (Orbit L3, Gelato) — "stopped producing blocks on **May 1, 2026**. The L1 RollupProxy was **paused**, validator stakes withdrawn, and ownership of upgrade rights transferred from the **Gelato Multisig** to a new Safe (`0x1e0Ef0eb…`). **No public shutdown announcement has been issued.**" ← silent death.
- **Fluence** (Orbit, Gelato) — "sunset in **April 2026**. Rollup shut down and **bridge escrow contracts were upgraded to sweeper contracts that forward remaining assets to a 2‑of‑4 multisig**. Users can claim via Migration Tool until **April 2027**." ← escrow forcibly swept into a multisig.
- **RSS3 Value Sublayer** — "L2 halted **April 24, 2026** and VSL bridge withdrawals have been **paused**… $RSS3 migrated to Ethereum via a claim portal." https://rss3.io/blog/the-next-stage-of-rss3.html
- **re.al** — "halted block production and state updates on **June 20, 2025 without prior notice**. If state updates are not resumed, the proposer whitelist gets dropped and anyone can propose. If this happens but **the DAC doesn't serve the necessary data, funds can be compromised** as there is no way to challenge invalid state roots." ← the permissionless-fallback-meets-dead-DAC failure mode.
- **Treasure** (ZK Stack) — "planned shutdown after a governance vote" (Snapshot proposal linked). ← the one **zkSync Elastic-chain shutdown** I confirmed.
- **Kinto** — "shut down **September 30, 2025**. Remaining assets were removed from the bridges and are redistributed through onchain smart contracts and the Kinto CVR frontend."
- **Game7** — "network was sunset (2025‑08‑14), migrating $G7 token and on-chain operations to Arbitrum."
- **SNAXchain**, **Cartesi PRT Honeypot** — sunset / "permanently frozen after the team found a bug in the PRT contracts."
- **ZKsync Lite** — "enters sunset phase."
- **Witness Chain** — "operator has stopped servicing this Validium (last batch posted 2024‑12‑18)."
- **GPT Protocol** — "operator stopped servicing this Validium and a **fork was deployed outside the shared Polygon Agglayer contracts**."
- **rhino.fi** (StarkEx) — "RhinofiAdminMultisig **upgraded the core contract implementation and subsequently withdrew all funds**… funds are held in a multisig on Ethereum (2025‑03‑10)." ← admin drained escrow by upgrade.
- **Loopring** — "sunset (2026‑02); no longer accepts deposits. The team plans to send deposited assets directly to users."
- **Sorare** (StarkEx) — "froze its StarkEx rollup on **June 1, 2026**. The core rollup contract is currently frozen." + "Critical contracts can be upgraded by an **EOA**."
- **DeGate V1** — "A system **shutdown was triggered** on 2025‑06‑27 (etherscan tx `0xa3a340cf…`). This **irreversible action freezes the L2 state** and allows users to withdraw with the operator's help… if the operator does not cooperate, a **withdrawal mode** can be activated, allowing users to withdraw on their own by providing merkle proofs." ← **the only clean escape-hatch outcome in the whole dataset.**
- **dYdX v3** (StarkEx) — "shut down on October 28th and is currently processing withdrawals in **escape-hatch mode**" (https://dydx.exchange/blog/v3-product-sunset, https://explorer.dydx.exchange/tutorials/escapehatch). ← second clean escape-hatch outcome.

**Pattern across all of these:** escape hatches that actually returned user funds existed only on **StarkEx validiums and Loopring-derived ZK exchanges** (dYdX v3, DeGate) — systems designed with a forced-exit/withdrawal mode from day one. **No general-purpose EVM rollup death in this dataset produced a working forced-exit for arbitrary contract state.** The standard outcome was: a final state root posted, escrow either drained by admins or left orphaned, and a merkle-claim or manual-distribution side channel that covers **token balances only**.

**On "was contract DATA preserved":** in **zero** of these cases did anyone commit to preserving an archive node or a public RPC. In every dead case I probed, the canonical RPC and explorer DNS records were **deleted**, usually within months. Contract state survives only as (a) L1 calldata/blobs, if DA was onchain, plus your own re-derivation, or (b) whatever you personally archived.

---

## QUESTION 2 — RaaS PROVIDER RISK

**All seven providers are still trading as of 2026‑08‑13** (`observed`, HTTP 200 on all):

| Provider | URL / status | Positioning (Aug 2026) |
|---|---|---|
| **Conduit** | conduit.xyz → 200 | Claims **60+ mainnets, $4B TVL, 3B txs, "55% of chains on Ethereum."** Products: Chain Platform, **G3 Sequencer**, Privacy Suite, RPC nodes (100+ networks), professional services. Case studies: Plume, Polygon Labs/Katana, Privy. |
| **Caldera** | caldera.xyz → 200 | **75+ chains, $1B TVL, 550M txs, 17M wallets.** Rollup Engine + **Metalayer** + **ERA token** (expanded to Base and Arbitrum One, Dec 2025). |
| **AltLayer** | altlayer.io → 200 | **Expanded, not pivoted.** RaaS now one of four products alongside **8004scan** (ERC‑8004 agent registry), **AltLLM**, **AltClaw** (DeFi MCP). Heavy AI-agent emphasis. |
| **Gelato** | raas.gelato.network **redirects to app.gelato.cloud**; gelato.cloud → 200 | Still offers rollups ("Based, ZK, custom"; "Turbo Sequencer") but repositioned as **smart-wallet + paymaster/bundler infra** first. 1B+ txs, 100+ chains, $600M+ secured. |
| **Alchemy** | alchemy.com/rollups → 200 | Active. OP Stack / Orbit / ZKsync Stack. Names **World Chain** ("#1 rollup on a RaaS"), **Degen Chain**, Krafton, Syndicate, XMTP, Gensyn. Advertises **99.99% uptime SLA**, <5 min enterprise response. |
| **Zeeve** | zeeve.io → 200 | Active; docs cover node/archive-node management. |
| **Karnot** | karnot.xyz → 200 | Active, **Starknet appchains only**; maintains Madara; claims Starknet's second-largest validator by stake. |

`unknown` — **no RaaS provider has publicly shut down**, but I could not verify funding, headcount, or financial health for any of them (no search access; none disclose it on-site).

### Published SLAs and exit/offboarding terms
- **Conduit SLA** (`documented`, https://www.conduit.xyz/sla, **effective 2026‑04‑20**): **≥99% monthly availability** (Enterprise up to 99.99%). Credits against *fixed subscription fees only*: 5% (97.5–99%), 10% (95–97.5%), 20% (<95%). Must notify within 72h. Excludes maintenance (≤3h/quarter, 24h notice), emergency incidents (<3h, once/quarter), third parties, force majeure. **Contains no termination procedure, no offboarding requirement, no data-retention provision, no key-handover clause, and no statement about what happens if Conduit ceases operations.** Note 99% monthly ≈ **7.2 hours of permitted downtime per month**.
- **Alchemy**: advertises 99.99% uptime SLA on the marketing page; `unknown` — I found no published SLA document with credits/exclusions.
- **Caldera, AltLayer, Gelato, Zeeve, Karnot**: `unknown` — **no published SLA and no offboarding/exit terms found on any site or in any docs I fetched.**
- `observed` **Conduit's documentation contains no decommissioning content at all**: `https://docs.conduit.xyz/llms.txt` (the full doc index, 17,650 bytes) has **zero** matches for decommission / shutdown / sunset / terminate / wind. Caldera's `docs.caldera.xyz/llms.txt` has no key-custody, self-hosting, or offboarding material either. Zeeve's likewise (only archive-node product pages).

### Who holds the keys — and can a chain be self-hosted?
- **Conduit's own answer** (`documented`, https://docs.conduit.xyz/faq.md, fetched 2026‑08‑13, verbatim):
  > "**Do I own my chain if I launch it with Conduit?** Yes. If you need to take control of your chain or want to migrate to a different hosting platform, we'll send the necessary keys to a wallet of your specification as soon as you ask. This is standard in our contracts."

  **⚠ Branding vs. observed reality:** this is the exact promise Degen says was not honoured for ~6 months in 2024 (§1.3, `reported`). The FAQ is a unilateral marketing statement, not the SLA, and the SLA contains no key-handover clause.
- **Observed reality across chains** (`observed`, L2BEAT permissions, 2026‑08‑13) — the RaaS provider's multisig is the actual upgrade authority:
  - PGN: `L2OutputOracle` admin "ultimately **Conduit Multisig 1**" — still rotating signers in **Jan 2026**, on a chain dead since 2024.
  - Mode: `Conduit Multisig 1` = `eth:0x4a4962275DF8C60a80d3a25faEc5AA7De116A746`, **4/10 threshold**, "can update the preconfer address, the **batch submitter (Sequencer) address** and the gas configuration."
  - Aevo, Zora, PoP Apex, WINR: Conduit multisigs present and active.
  - RARI: `Caldera Multisig 1` = `arb1:0x139C5A235632EDdad741ff380112B3161d31a21C`, ProxyAdmin admin + executor, **shared across blessnet, inevm, molten**.
  - Degen: `SequencerInbox` admin "ultimately **AlchemyMultisig2**", `upgradableBy` with **no delay**.
  - Sanko/Muster/PoP Apex/WINR pages reference `Caldera Multisig 3`, `Conduit Multisig 1/2`, `Gelato Multisig`, `AlchemyMultisig2` — a small set of provider-controlled Safes sitting behind a large set of nominally independent "sovereign" chains.
- **Self-hosting**: `documented` — Conduit publishes "Run an OP Stack Node" and "Run an Arbitrum Orbit Node" guides "for self-hosting", and states "**Conduit nodes retain full chain history from genesis on all supported networks, included on every plan at no extra charge**" (https://docs.conduit.xyz/rpc-nodes/information/archive-nodes.md). That archive commitment is **contingent on being a paying customer of a live chain** — it says nothing about retention after a chain is decommissioned, and §1.1/§1.6 show the endpoints get deleted.
- **Is the data still on the settlement layer?** `observed` — depends entirely on the DA choice, not on the provider:
  - Onchain DA (Kroma, PGN post-hoc partially): reconstructible in principle from L1.
  - **DAC/AnyTrust** (Degen, Sanko, RARI, Muster, PoP Apex, WINR — i.e. essentially every Orbit L3 a RaaS sells): "Proof construction relies **fully on data that is NOT published onchain**." When the DAC stops, the data is gone.
  - **Custom altDA/plasma** (Redstone): same, plus no proof system at all.
  - **Celestia** (PGN from 2024‑01): DA outlives the chain but Celestia's own pruning window applies; `unknown` whether PGN's blobs are still retrievable.

---

## QUESTION 3 — STEWARD DEPENDENCY & PUBLIC STATEMENTS

`observed` L2BEAT risk rosettes, all fetched 2026‑08‑13. **Every one of the six has "Exit window: None."**

| Chain | Stage | Sequencer failure | Proposer failure | Exit window |
|---|---|---|---|---|
| **Base** | Stage 1 | **Self sequence** (≤12h L1 delay) | **Self propose** — anyone | **None** — "contracts are instantly upgradable. Upgrades need to be approved by 2 parties: the **Base Coordinator Multisig and the Base Security Council**." |
| **Arbitrum One** | Stage 1 | **Self sequence** (≤1d) | **Self propose** — anyone | **None** |
| **OP Mainnet** | Stage 1 | **Self sequence** (≤12h) | **Self propose** — anyone | **None** — "upgrades are initiated by the Security Council with instant upgrade power and without proper notice." |
| **Scroll** | **Stage 0** (was Stage 1) | **Self sequence** (≤7d; needs ZK proof) | **Self propose** via source-available prover | **None** |
| **Linea** | **Stage 0** | **No mechanism** — "There is no mechanism to have transactions be included if the sequencer is down or censoring." | **Cannot withdraw** — "withdrawals are frozen." | **None** |
| **ZKsync Era** | **Stage 0** | **Enqueue via L1** — "users can submit to an L1 queue, but **can't force** them… sequencers can stop processing the queue entirely." | **Replace proposer** via governance upgrade | **None** |

### Base — company dependency: Coinbase, and now *only* Coinbase
- `documented` **https://blog.base.dev/next-chapter-for-base-chain-1, published 2026‑02‑18**: Base is "moving away from the OP Stack" to an independently operated unified stack in the `base/base` repo, built on **Reth**; node operators must migrate from Optimism releases to Base's client distribution; moves from 3 to **six smaller hard forks per year**; Base is **establishing its own Security Council with "an additional independent signer"** to replace Optimism's role; commits to maintaining Stage 1 and "faster withdrawals"; continues with Optimism as a customer under "**OP Enterprise: Mission-Critical Support**." **The post contains no contingency statement about what happens if Coinbase discontinues Base operations.**
- `observed` **On-chain confirmation, 2026‑03‑04**: "Base **decouples from the shared Optimism SuperchainConfig** (`0x95703e…`) and deploys its own SuperchainConfig v2.5.0 at `0xb535ff7F118260a952CE65e7fF41B1743De8EE6c`… adds an immutable incident responder role (Base Multisig 1) and makes the guardian immutable." (L2BEAT Base changelog.)
- `observed` Base is actively hardening the *proof* side while keeping instant upgradability: **Azul multiproof activated 2026‑06‑05** (TEE attestation arm + SP1 ZK arm; `proofMaturityDelaySeconds` 7d → **1d**); **Beryll upgrade 2026‑06‑25** (optimistic finalization 7d → 5d). TEE enclave signers are rotated roughly weekly (six rotations observed Jun–Jul 2026). Base Multisig 1 threshold **3-of-12**.
- **Effect on Optimism** (`documented`, https://gov.optimism.io/t/base-the-superchain-and-governance-questions-that-merit-answers/10612, thread opened **2026‑02‑20**):
  - Original terms: Base contributed "the greater of (a) **2.5% of total gross sequencing revenue** or (b) **15% of L2 profit**."
  - In 2025 Base transferred **~3,765 ETH**, "**more than 70% of all Superchain revenue-share contributions that year**."
  - Base was eligible for up to **~118M OP (2.75% of supply) over six years**, contingent on Superchain participation.
  - Foundation response (dated **2026‑03‑03** in-thread): **the revenue-share arrangement will not continue**; **Base is ineligible for the remaining unvested OP grant**; OP Enterprise revenue flows to the Foundation but sits **outside the approved buyback program**.
- `documented` Optimism finances (https://gov.optimism.io/t/collective-year-4-budget-update-and-year-5-budget-outlook/10796, **2026‑08‑06**): Year‑4 new commitments **~150M OP, down from 229.92M OP in Year 3** (−35%); Year‑5 forecast ~272.9M OP new circulation; circulating supply 2,287,994,831 OP (53.3%); a 12‑month buyback of "up to 50% of Superchain revenue" has bought back 9M+ OP. **The Foundation published no revenue figures, no treasury runway, and no headcount**; a delegate in-thread explicitly asked for exactly that dashboard and did not get it. `unknown` — Optimism layoffs.

### Scroll — the Security Council was dissolved for cost
- `observed` L2BEAT changelog, **2026‑06‑05 entry**: "**Security Council removal.** On **2026‑06‑01**, Scroll executed a multiSend transaction replacing its independent **9‑of‑12 Security Council** (`eth:0x1a37bF…` / `scr:0x1a37bF…`) with the **3‑of‑4 `ScrollAdminMultisig` (`0xcca54B0916Cee2186b47E9709BEdcb7041A8F761`)**. This upgrade **moves the chain to Stage 0**." Completed **2026‑06‑16**: "Final Security Council removal transaction. `ScrollAdminMultisig` now controls the `scMinorityNoDelay` path (used to unpause core contracts via the PauseController)."
- `documented` **Scroll's own explanation** — https://forum.scroll.io/t/governance-update-security-council-transition-contributor-roles-operational-adjustments/1470, posted **2026‑04‑13**: Scroll proposes dissolving the Security Council, saying **continuation "is no longer justified" after evaluating "its cost relative to its actual usage over the past quarters."** Admin control of `ScrollOwner`, `AgoraGovernor` and the Timelocks moves to the Scroll Admin multisig, transition targeted "the next ten days." **The post gives the multisig address but omits signer composition, threshold, and signer independence** — a gap raised in-thread by delegate "Eureka." Simultaneously, contributor roles **Marketing Operations, Program Coordination, Accountability Lead, and Accountability Operator all end April 30, 2026**; only a Facilitator (SEED LATAM) continues through Q2 2026; Operations and Accountability committees move to "reduced operational capacity." Community critique in-thread: changes appeared finalized despite being framed as proposals, with no formal on-chain vote, creating "a sense of uncertainty and fear."
- **Read:** Scroll cut its independent security backstop as a cost line at the same time it cut most of its DAO staffing. **3-of-4 team signers now hold instant, delay-free upgrade power over the rollup.** Also `observed`: two emergency verifier upgrades in the prior year (2025‑08‑11 "**Soundness bug** and verifier emergency update. **No postmortem yet**"; 2026‑02‑23 "Emergency upgrade… due to a bug in the guest prover program").

### Linea — Consensys; the weakest steward-failure story, but the only explicit dead-man's switch
- `observed` L2BEAT: sequencer failure = **"No mechanism"**; proposer failure = **"Cannot withdraw."** Stage 0. Blocking requirements for Stage 1: "Users' withdrawals **can be censored by the permissioned operators**."
- `documented`/`observed` **Linea's actual public statement about steward failure is an on-chain fallback**: rollup upgrade **2026‑04‑02** "Refactored **Fallback Operator** to **Liveness Recovery Operator** address that gets `OPERATOR_ROLE` **after 6 months of non-finalization**"; the `CallForwardingProxy` `eth:0x3697bD0bC6C050135b8321F989a5316eACbF367D` ("can be called by any address") had its role renamed `.fallbackOperator` → `.livenessRecoveryOperator`. L2BEAT's phrasing: "Eventually (after **6 months** of no finalized blocks) the Operator role becomes public, **theoretically** allowing anyone to post data / propose state with valid proofs." Same upgrade: "**SC can pause indefinitely now**, other entities for 48 hours with a 48-hour cooldown."
- `observed` **2026‑07‑17: rollup upgraded to v8.0 — "The upgrade sets the stage for forced L1 transactions, however they are not live yet. `FORCED_TRANSACTION_SENDER_ROLE`…"** Forced inclusion is built but **not enabled** as of 2026‑08‑13.
- `observed` **New durability risk introduced in 2026**: **2026‑03‑04 "Upgraded LineaRollup to version 7 to add native ETH yield. Permissioned entities can now move ETH from the rollup contract into yield providers via `YieldManager`."** **2026‑04‑20: Lido yield provider added** (1 ETH deployed so far, "contracts fully ready for wider usage"). The L1 escrow backing Linea withdrawals is now partly a staking position with reserve thresholds. `unknown` — Consensys corporate developments in 2026 (layoffs, LINEA token mechanics, IPO status).

### ZKsync Era — Matter Labs still operationally in control
- `observed` **2026‑08‑10** (three days before this check): "**Matter Labs 4/7 multisig** upgraded boojum verifier to v29.5… Verifier is **not yet reproduced**." Prior: verifier upgrades 2026‑07‑27 ("not yet verified"), 2026‑02‑09, 2026‑01‑26; validator rotations 2026‑07‑23, 2026‑07‑08; operator EOA rotation 2026‑06‑16.
- `observed` **2026‑05‑04**: "Era multisig validator now has **3 (out of 8) threshold, instead of 0**… This multisig is also made **the only entity that can precommit, commit, revert, prove and execute blocks**." — block production authority explicitly concentrated into one multisig.
- `observed` **2026‑02‑02**: "ZKsync Era **migrated its settlement layer from Gateway back to Ethereum**" — a whole settlement-layer reversal in six months.
- `observed` **2026‑03‑04 → 2026‑04‑20**: wstETH bridge paused ~7 weeks for a potential vulnerability.
- Steward-failure statement: none found beyond L2BEAT's "**Replace proposer** — there is a decentralized Governance system that can *attempt* changing Proposers with an upgrade." `unknown` — Matter Labs corporate developments in 2026.

### Arbitrum One & OP Mainnet — best-in-class, and still council-dependent
- **Arbitrum** (`observed`): Security Council actively rotating (roster syncs 2026‑05‑22, 2026‑07‑21, 2026‑08‑06; 12-member roster). Two events worth flagging:
  - **2026‑05‑24**: "Arbitrum Bridge implementation swapped by the **Arbitrum Security Council (L1 emergency 9/12, bypassing the DAO timelock — no governance proposal)**."
  - **2026‑06‑15**: "**Inbox temporarily replaced with a custom impl exposing `sendUnsignedTransactionOverride(...)` (forge an L2 unsigned EOA tx from any `from`)**, then reverted… L1Timelock scheduled a `SpoofL2TxAction`." Also 2026‑04‑22 "Recovery of KelpDAO stolen fund."
  - **Read:** on the most decentralized general-purpose L2, a 9-of-12 council can bypass governance and **forge L2 transactions from arbitrary senders**. Good for fund recovery; it is also a description of the trust assumption under which your filesystem's state would live.
- **OP Mainnet** (`observed`): Stage 1, permissionless fault proofs. **2026‑06‑25 Upgrade 19b "Karst" (op-contracts/v7.0.0)** via `OPContractsManagerV2` — respected game type CANNON → **CANNON_KONA** (Rust kona-client on the Cannon VM). Foundation Safes gained a **`SaferSafes` module (LivenessModule + TimelockGuard)** in Jan 2026, but "**Timelock delays currently 0**." Exit window still None.
- Offchain Labs / OP Labs corporate 2026 developments: `unknown`.

---

## COULD NOT VERIFY

1. **Astar zkEVM's own announcement text and withdrawal terms.** X.com not fetchable; `astar.network/blog/astar-evolution-phase-1-56` → 404; `docs.astar.network/docs/learn/zkEVM/` → 404; `astar.network/sitemap.xml` → 404. Only L2BEAT's milestone ("Astar Network has officially sunset," 2025‑03‑31) is confirmed. Whether a final verified batch was posted, whether a withdrawal deadline existed, and whether an archive node was kept: **unknown**.
2. **Kroma's announcement text** (x.com/kroma_network/status/1936692354603520198). L2BEAT's quote is the only source. Whether Kroma stated a withdrawal deadline or archive commitment: **unknown**.
3. **Degen's post-dispute public statement.** No wind-down/resolution notice on degen.tips; syndicate.io blog not fetched. Whether the ~$160k was ever reimbursed, and the exact date/terms of the Conduit→Alchemy handover off-chain: **unknown**. (The on-chain governance move on 2024‑11‑08 is `observed`.)
4. **Whether any of these chains retain a private/archival node.** Not discoverable from outside; no provider publishes a post-decommission retention policy.
5. **Where PGN's ~195 ETH went.** `observed`: portal, bridge and BalanceClaimer all hold 0 ETH and TVS = 0. I did not trace the outflows; "all claimed" vs "swept" is **unknown**.
6. **RaaS financial health** — funding, runway, headcount, layoffs for Conduit, Caldera, AltLayer, Gelato, Alchemy, Zeeve, Karnot. No search access; none disclose it.
7. **SLA/offboarding terms for Caldera, AltLayer, Gelato, Zeeve, Karnot** — no published documents found. Alchemy's "99.99% SLA" is a marketing claim with no document behind it that I could locate.
8. **2026 corporate developments for Consensys/Linea, Matter Labs/ZKsync, Offchain Labs/Arbitrum, OP Labs** (layoffs, pivots, acquisitions, token events). Blocked by search exhaustion.
9. **Starknet appchain shutdowns.** Karnot is alive with 1 L2BEAT-tracked chain; I found no Starknet appchain death. Absence of evidence only.
10. **Manta Pacific, Mantle, Blast, Fraxtal, Cyber, X Layer, Immutable zkEVM, Zora, Mode, Derive** — confirmed live by RPC + L2BEAT listing, but not audited for governance/DA risk.
11. **Whether Mint's `mintchain.io/withdraw` portal actually works** before its 2026‑10‑20 deadline. The site 301s; the explorer's CloudFront distribution is already deleted, which is not encouraging.

---

## THE ONE-PARAGRAPH ANSWER TO YOUR ACTUAL QUESTION

When the company stops paying, the **contracts on L1 persist and a final state root usually does get posted** (verified on-chain for PGN, Kroma, and Redstone). What dies within months is **everything needed to read or use that state**: the RPC, the explorer, the docs, and the DNS records themselves — I measured NXDOMAIN or dead endpoints on 8 of 8 dead chains I probed, including chains still holding ~$970k (Sanko) and ~$573k (RARI). Escape hatches that actually returned assets existed only on **purpose-built forced-exit designs** (StarkEx's dYdX v3, DeGate's withdrawal mode); **no general-purpose EVM rollup death in this dataset produced a working forced exit for arbitrary contract data** — the recovery mechanism was always a merkle claim or manual distribution covering **token balances only**. For a durable user-owned filesystem the two variables that actually decide survival are (1) **DA on Ethereum L1 vs. a DAC/altDA** — Redstone is the proof: 22 ETH still sits unclaimed in a live, unpaused L1 portal that nobody can prove a withdrawal against, because the off-chain DA went dark with the RPC — and (2) **who holds no-delay upgrade keys**, which for every RaaS-hosted chain I checked is the provider's own multisig (sometimes one Safe governing four chains), still rotating signers on chains that died two years ago. Conduit's FAQ promises to hand over keys "as soon as you ask"; its SLA, effective 2026‑04‑20, contains no key-handover, data-retention, or cessation clause at all.
