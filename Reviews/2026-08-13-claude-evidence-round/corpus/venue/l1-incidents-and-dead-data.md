# Recovered Claude memo — L1 incidents and dead data

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T04:52:38.831Z
**Claude task:** `ad19d3f637c98f56a`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3552
**Original result length:** 26686 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
Research complete. Findings below.

---

# Ethereum L1 liveness/finality track record + unreadable-onchain-data precedents

**All checks performed 2026-08-13 ~04:00–05:00 UTC** (host clock; user-local date 2026-08-12). Evidence tags: `observed` = I fetched/probed it myself · `documented` = official spec/announcement · `reported` = third-party press · `inferred` · `unknown`.

---

## PART A — Ethereum L1 track record

### A1. The May 11–12 2023 finality delays

Primary source: Prysm's own postmortem page, https://prysm.offchainlabs.com/docs/misc/mainnet-postmortems/ (`documented`, checked 2026-08-13) and Offchain Labs' writeup, https://medium.com/offchainlabs/post-mortem-report-ethereum-mainnet-finality-05-11-2023-95e271dfd8b2 (`documented`).

| | Incident 1 | Incident 2 |
|---|---|---|
| Start | **2023-05-11 20:06:47 UTC**, epoch 200,551 | **2023-05-12 17:20:23 UTC**, epoch 200,750 |
| Recovered | epoch 200,555 | epoch 200,760 |
| Duration | ~24–25 min | ~54 min – 1 hr |
| Epochs unfinalized | 4 | 9 |
| Blocks missed | ~47 | ~149 |

**Cause** (`documented`): Prysm and Teku mishandled *valid but old-target* attestations — attestations voting to an old beacon block forced repeated expensive beacon-state regeneration, exhausting node resources. Prysm specifically "was regenerating the state for canonical slot 25 if used as target root on epoch 1 during slot 33." Prysm was ~33% of the network at the time. Lighthouse dropped the problematic attestations and stayed healthy — client diversity is what saved it (`reported`, https://www.coindesk.com/tech/2023/05/17/ethereums-loss-of-finality-what-happened).

**Resolution** (`documented`): self-healing both times, no human intervention on-chain. Prysm shipped v4.0.4; permanent fix changed attestation verification to use the head state instead of regenerating prior states, plus rules to discard unviable old attestations.

**Liveness vs finality — I verified this empirically** (`observed`, via `eth_getBlockByNumber` against https://ethereum-rpc.publicnode.com):

| Incident | Blocks retrieved | Numbering | Wall span | Missed-slot rate | **Worst contiguous gap** |
|---|---|---|---|---|---|
| May 11 2023 (from block 17,239,357) | 180 consecutive | unbroken | 46.0 min | 22.2% | **96 s** (7 empty slots, at block 17,239,426) |
| May 12 2023 (from block 17,245,574) | 330 consecutive | unbroken | 98.8 min | 33.4% | 84 s (6 empty slots) |

**The chain never stopped.** It degraded — roughly a quarter to a third of slots went empty — but block production continued throughout, and the longest it ever went without a block was 96 seconds. Finality paused; liveness did not.

### A2. Post-Merge incidents, Sept 2022 → Aug 2026

**Upgrades that actually shipped** (`documented`, https://ethereum.org/en/history/, block timestamps independently `observed` via RPC — all matched exactly):

| Upgrade | Date/time (UTC) | Block |
|---|---|---|
| The Merge (Paris) | 2022-09-15 06:42:59 | 15,537,394 |
| Shapella (Shanghai-Capella) | 2023-04-12 | — |
| Dencun | 2024-03-13 13:55:35 | 19,426,587 |
| Pectra | 2025-05-07 10:05:11 | 22,431,084 |
| **Fusaka** | **2025-12-03 21:49:23** | **23,935,694** (epoch 411,392) |
| BPO1 | 2025-12-09, epoch 412,672 | — |
| BPO2 | 2026-01-07, epoch 419,072 | — |
| Glamsterdam | **Q4 2026, "in development"** — not shipped | — |

Sources: https://blog.ethereum.org/2025/11/06/fusaka-mainnet-announcement, https://blog.ethereum.org/2025/04/23/pectra-mainnet, https://ethereum.org/en/roadmap/ (all `documented`, checked 2026-08-13). Fusaka carried 9 core EIPs incl. EIP-7594 (PeerDAS). **No mainnet hard fork has occurred in 2026** — BPO2 (Jan 7 2026) was a blob-parameter-only fork scheduled as part of Fusaka.

**Mainnet consensus-layer incidents:**

**2025-12-04 — Fusaka/Prysm attestation-processing incident** (`documented`, Prysm postmortem + release notes v7.0.1/v7.1.0/v7.1.1):
- ~02:45 → ~04:45 UTC, ~2h45m, the day after Fusaka activated
- Same bug class as May 2023: Prysm v7.0.0 regenerated beacon states while processing attestations referencing prior-epoch blocks
- **248 of 1,344 slots missed (18.5%)**; participation fell to ~74.7% at epoch 411,448 (`reported`, https://cointelegraph.com/news/ethereum-prysm-bug-fusaka-client-diversity-risk, pub. 2025-12-05) — about 9 points above the ⅔ finality threshold
- **Finality was NOT lost.** Recovered to ~99% by epoch 411,712
- Mitigation: `--disable-last-epoch-targets` runtime flag, then permanent fixes in v7.0.1 (2025-12-08) and v7.1.0 (2025-12-10)
- My measurement (`observed`): 330 consecutive blocks from 23,937,100, unbroken numbering, 26.2% missed slots, **worst contiguous gap 60 s (4 empty slots)**

**Execution-layer client failures (chain unaffected, but users of those clients were blinded):**
- **2024-01-06 — Besu mainnet halt** at block 18,947,893, a selfdestruct/Bonsai state defect. Hotfix `23.10.3-hotfix` published 2024-01-07T00:45:48Z; required a resync to repair state (`documented`, Besu release notes via GitHub API).
- **2024-01-21 — Nethermind consensus failure.** Issue #6588 opened 2024-01-21T20:52:17Z: "Invalid - block 19056922 … is known to be a part of an invalid chain," starting ~15:51 UTC. Affected v1.23.0 through v1.26; v1.22.0 and below unaffected. Mandatory hotfix v1.25.2 shipped 2024-01-21T22:00:25Z (`documented`, GitHub API).

**Testnet incidents (mainnet unaffected):**
- **2025-02-24 → 2025-03-11 — Holesky failed to finalize for ~2 weeks** after Pectra activation. Root cause was *not* Pectra itself but a client config bug: EIP-6110 moved deposit detection to the EL, and Holesky/Sepolia deposit-contract addresses differ from mainnet's. Recovered at epoch 119,090 (`reported`, https://www.coindesk.com/tech/2025/03/11/ethereum-s-holesky-hits-finality-after-2-weeks-as-pectra-testing-continues). This incident is why Holesky was later killed.
- **2025-03-05 — Sepolia Pectra incident**: permissioned deposit contract blocked EL clients from including transactions after an attacker sent zero-value token transfers; empty blocks; resolved by 14:00 UTC (`documented`, EF blog, "Sepolia Pectra Incident Update").

**2026 (Jan–Aug):** No mainnet liveness or finality incident found. `inferred` from: (a) the EF protocol blog has published nothing since 2025-11-06 (`observed`); (b) the Prysm mainnet-postmortem page contains exactly **two** entries — 2023-05-12 and 2025-12-04 (`observed`); (c) I scanned all 2026 release notes for Geth, Lighthouse, Nimbus, and Teku via the GitHub API for incident/chain-split/postmortem language and found none referencing a mainnet event (`observed`). Nimbus tags every release `high-urgency` as a matter of course, so that is not signal.

### A3. Pre-Merge incidents

**2020-11-11 — Geth minority chain split.** Block 11,234,873 timestamp **2020-11-11T07:08:03Z** (`observed`, mainnet RPC). The relevant Geth consensus flaw is CVE-2020-26265 (`documented`, https://github.com/ethereum/go-ethereum/security/advisories/GHSA-xw37-57qp-9mm4): `createObject` returned deleted accounts with prior balances intact, so a particular tx sequence made Geth compute different balances than other implementations. Affected v1.9.4–v1.9.19, patched in v1.9.20, advisory published **2020-12-11**. ⚠️ The advisory itself does **not** confirm a mainnet split, block number, or date — it says only "could cause a chain split." **The linkage between this CVE and the Nov 11 2020 Infura outage is `reported`, not `documented`** — I could not fetch the Infura post-mortem (404 at both consensys.io and blog.infura.io). Treat the causal attribution as unconfirmed; the date is solid.

**2021-08-27 — Geth chain split, confirmed by official advisory.** CVE-2021-39137 (`documented`, https://github.com/ethereum/go-ethereum/security/advisories/GHSA-9856-9gg9-qcmq): a memory-corruption bug in the EVM caused affected nodes to compute a different state root on a malicious transaction. **"exploited on Mainnet at block 13107518," producing a minority chain split.** Block 13,107,518 timestamp **2021-08-27T12:50:07Z** (`observed`). Affected Geth 1.10.0–1.10.7; patch v1.10.8 had shipped **2021-08-24T07:07:47Z** — three days *before* exploitation. Nodes that hadn't updated forked off.

**2016 Shanghai DoS attacks** (`documented`, https://ethereum.org/en/history/): DoS attacks on the network in **September/October 2016** exploiting underpriced opcodes. Two responses:
- **Tangerine Whistle**, block 2,463,000, **2016-10-18 13:19:31 UTC** — repriced the urgent underpriced opcodes
- **Spurious Dragon**, block 2,675,000, **2016-11-22 16:15:44 UTC** — further opcode repricing, state "debloat" (empty-account removal), replay protection

Note: Spurious Dragon's state debloat *deleted empty accounts* — a state change, but housekeeping, not asset recovery.

### A4. The DAO fork — the canonical state rewrite

- **Block 1,920,000, 2016-07-20 13:20:40 UTC** (`documented` via ethereum.org; **independently `observed`** — I queried block 1,920,000 on mainnet today and got timestamp `2016-07-20T13:20:40+00:00`, which itself demonstrates the forked chain is the canonical one you read when you say "Ethereum").
- **What changed** (`documented`): funds were moved out of the compromised DAO contract into a recovery contract with a single `withdraw` function; holders could redeem 1 ETH per 100 DAO tokens. This was an irregular state transition — balances rewritten by fiat, not by EVM execution.
- **Ethereum Classic** is the unforked chain and **is still running** (`observed`): chainId `0x3d` (61), block **25,136,921**, served by both https://etc.rivet.link and https://etc.etcdesktop.com; explorer https://etc.blockscout.com returns HTTP 200.
- **Has any state rewrite happened since? No.** ethereum.org's fork history describes exactly one fund-moving fork (`documented`). The strongest counter-precedent: **EIP-999** (created 2018-04-04), which proposed restoring the self-destructed Parity WalletLibrary code at `0x863DF6BFa4469f3ead0bE8f9F2AAE51c91A907b4` to unfreeze ~half a million ETH, has status **Withdrawn** (`documented`, https://eips.ethereum.org/EIPS/eip-999). Ethereum declined to rewrite state even for a nine-figure loss. The DAO fork is a 2016 artifact with no successor in ten years.

### A5. Post-Merge uptime — I measured it rather than trusting a claim

I sampled **every 2,000th block across the entire post-Merge chain** (5,104 checkpoints, block 15,537,394 → 25,743,679; zero missing after gap-filling), giving **5,103 consecutive 2,000-block windows**. An ideal window is exactly 24,000 s (6.67 h). **A contiguous chain halt of duration H inflates exactly one window by H.** (`observed`)

```
worst window : 2023-04-13 00:32Z  blocks 17,035,394–17,037,394  →  7.65 h   (+59.0 min, 12.9% slots missed)
 2nd         : 2023-04-13 08:11Z                                    7.42 h   (+45.0 min)
 3rd         : 2025-12-04 04:03Z  (Fusaka/Prysm)                    7.40 h   (+44.0 min)
 4th         : 2023-05-12 16:43Z  (finality incident #2)            7.34 h   (+40.4 min)
 5th         : 2025-12-03 20:48Z  (Fusaka activation)               7.25 h   (+35.2 min)
 6th         : 2024-03-27 18:29Z  (post-Dencun, cause unknown)      7.14 h   (+28.4 min)
median = 24,144 s   mean = 24,175 s   max = 27,540 s   min = 24,000 s
```

Two conclusions:

1. **Rigorous upper bound: no contiguous halt longer than 59 minutes has occurred anywhere in post-Merge Ethereum.** No window's excess exceeds that, and a halt cannot hide across window boundaries.
2. **In practice it is vastly better than that bound.** I then densely scanned the worst window and the known incidents block-by-block: the April 13 2023 window's worst contiguous gap was **48 s** (3 empty slots), and March 27 2024's was **72 s** (5 empty slots). Combined with the incident scans in A1/A2, **the longest observed gap between consecutive Ethereum blocks in the entire post-Merge era is 96 seconds** (May 11 2023).

Ethereum L1 has never stopped producing blocks post-Merge. It has twice stopped *finalizing* — for 25 and 54 minutes, in May 2023 — and came within ~9 percentage points of a third time in December 2025.

**Live confirmation right now** (`observed`, 2026-08-13 04:22 UTC): head block **25,743,679** @ 04:22:59Z, `finalized` = 25,743,598 @ 04:06:35Z, `safe` = 25,743,630. Finality lag 81 blocks ≈ 2 epochs — nominal.

---

## PART B — Dead / unreadable onchain data precedents

### B6. Testnet deprecations — the natural experiment

**Official announcements** (`documented`):

| Network | Deprecation announced | Shutdown stated | Source |
|---|---|---|---|
| Ropsten, Rinkeby, Kiln | **2022-06-21** | Ropsten Q4 2022; Rinkeby Q2/Q3 2023; Kiln week of 2022-09-12 | blog.ethereum.org/2022/06/21/testnet-deprecation |
| Ropsten (final) | 2022-11-30 | validators off **2022-12-15 → 12-31** | blog.ethereum.org/2022/11/30/ropsten-shutdown-announcement |
| Goerli | Dencun was "Goerli's last upgrade before core teams stop supporting it" | EOL 2024 | blog.ethereum.org/2024/01/10/goerli-dencun-announcement |
| Holešky | **2025-09-01** | validators off "2 weeks after Fusaka finalized on Holešky" | blog.ethereum.org/2025/09/01/holesky-shutdown-announcement |
| Kovan | not found | not found | `unknown` |

**Critically: none of these announcements says anything about preserving data.** I read the Ropsten and Holešky shutdown posts specifically for archive/data-preservation language and there is none (`observed`). The Holešky post covers migration paths (Hoodi for stakers, Sepolia for dapps, Ephemery for validator testing) and is silent on what happens to the chain's history.

**What I actually observed today** (all `observed`, 2026-08-13, DNS checked against both 1.1.1.1 and 8.8.8.8):

| Domain | DNS | HTTP |
|---|---|---|
| ropsten.etherscan.io | **no A record** | unreachable |
| rinkeby.etherscan.io | **no A record** | unreachable |
| kovan.etherscan.io | **no A record** | unreachable |
| holesky.etherscan.io | **no A record** | unreachable |
| goerli.etherscan.io | resolves (Cloudflare 104.20.37.229 / 172.66.149.96) | **HTTP 522 on 3/3 tries** — Cloudflare cannot reach origin |
| sepolia.etherscan.io | resolves | **HTTP 200** |
| hoodi.etherscan.io | resolves | HTTP 403 (bot block — origin alive, not 522) |

Goerli is the interesting one: **the DNS record and CDN edge survive, but the origin server is decommissioned.** The link doesn't 404 — it hangs and times out. Anything that checks "does the domain resolve" would report Goerli's explorer as healthy.

**Public RPCs** — 8 Goerli endpoints attempted, **zero working** (`observed`):
- `ethereum-goerli-rpc.publicnode.com` → plain text: *"Our Ethereum Goerli RPC is deprecated. Please use another provider."*
- `endpoints.omniatech.io/v1/eth/goerli/public` → JSON `code: 410`, *"The network you are trying to access has been deprecated."*
- `goerli.drpc.org` → `{"message":"Not Found"}`
- `eth-goerli.public.blastapi.io` → *"Blast API is no longer available."*
- `rpc.ankr.com/eth_goerli`, `rpc.goerli.mudit.blog`, `goerli.infura.io/v3/demo`, `goerli.blockpi.network` → 403 / empty

**Goerli is functionally dead as of 2026.** No explorer, no reachable RPC, config repo `eth-clients/goerli` **archived, last push 2024-03-07** (`observed`, GitHub API). Whether the chain still has any block producer at all is `unknown` — there is no way left to ask it.

**Holesky is more interesting and more instructive.** One provider survives: `holesky.drpc.org` responds. Its head block is **5,765,077, timestamp 2026-06-03T08:17:36Z**, and it was **byte-identical after a 45-second wait** (`observed`). So Holesky limped on for roughly eight months past its announced sunset and then **froze around 2026-06-03**. Today the data is readable through exactly one endpoint and no explorer.

**Alive:** Sepolia (block 11,477,826), Hoodi (3,408,556), mainnet (25,743,679). Config repos `eth-clients/sepolia` and `eth-clients/hoodi` both last pushed 2026-07-31; `eth-clients/holesky` last pushed 2025-10-10, not yet archived; `ethereum/ropsten` archived, last push 2022-12-15 (`observed`).

**Were archives preserved? Mostly no — and this is the sharpest finding for your use case.** The official community registry is https://eth-clients.github.io/history-endpoints/ (`observed`, raw HTML read). Its complete contents:

- **PoW era1 archives:** Mainnet, Sepolia — *only*
- **PoS beacon era archives:** Mainnet, Sepolia, Holesky, Hoodi
- **Goerli, Ropsten, Rinkeby, Kovan appear nowhere on the page.**

And the registry has already rotted: **`holesky.era.nimbus.team` is listed as a live mirror but has no DNS A record at all** (`observed` — `curl` exit 6, could not resolve host). The official archive index points at a host that does not exist, two months after the chain it archives went quiet. Meanwhile `data.ethpandaops.io/era1/mainnet/` and its `checksums.txt` both return HTTP 200, as do `mainnet.era1.nimbus.team`, `sepolia.era1.nimbus.team`, `hoodi.era.nimbus.team` (`observed`).

The pattern is consistent and fast: **announcement → validators stop → RPCs return "deprecated" within months → explorer origin decommissioned → DNS record removed → the chain is gone from the reachable internet.** Ropsten went from shutdown (Dec 2022) to NXDOMAIN in under four years. Nobody promised otherwise, and no announcement ever addressed the data.

### B7. Blob expiry and history expiry — the L1 readability question

**EIP-4844 blob retention.** Status **Final**, shipped in **Deneb/Dencun (2024-03-13)**. Parameter **`MIN_EPOCHS_FOR_BLOB_SIDECARS_REQUESTS = 4096` epochs ≈ 18 days** (`documented`, https://eips.ethereum.org/EIPS/eip-4844). The EIP is explicit that this is intentional: blob data "can be deleted after only a relatively short delay," and "there is no expectation that the blobs need to be stored for as long as an execution payload."

ethereum.org states it even more plainly (`documented`, https://ethereum.org/en/roadmap/danksharding/): blob data "is automatically deleted after a fixed time period (set to 4096 epochs at time of writing, or about 18 days)… **The actual data can be stored offchain by rollup operators, users or others.**"

**I verified this empirically rather than taking it on faith** (`observed`, against https://ethereum-beacon-api.publicnode.com, head slot 14,980,944):

| Slot age | `/eth/v1/beacon/blob_sidecars/{slot}` | `/eth/v1/beacon/blocks/{slot}` |
|---|---|---|
| 1 h → 45 days | HTTP 200, blob bytes present | — |
| 60, 75, 90, 120, 150 days | **HTTP 403, no data** | — |
| **180 days** | **HTTP 403** | **HTTP 200** |
| **365 days** | **HTTP 403** | **HTTP 200** |

And on the execution side, I pulled a real type-3 transaction from block **24,447,680** (2026-02-13, ~6 months old): tx `0xf9f5cec31c5023c3bd77454baeba177e45d0d5c451d96c2d646913dbbf95c562`. It **still carries its 5 `blobVersionedHashes`** and the block still has `blobGasUsed`/`excessBlobGas`. The KZG commitments are permanent. **The bytes they commit to are gone.** (`observed`)

> **Direct answer to your question: No. An L2's historical state is NOT reconstructable from L1 alone after ~18 days.** L1 permanently retains only the versioned hashes — commitments that let you *verify* blob data if someone hands it to you, but not *recover* it. The 18 days is a protocol *minimum*; this particular provider happened to retain ~45–60 days, but that is a business decision, not a guarantee. Beyond that window, L2 history depends entirely on off-protocol archives (rollup operators, Blobscan, third-party indexers). Anchoring decades-durable data in blobs would be a category error.

**EIP-4444 history expiry status as of 2026:**
- **The formal EIP is `Stagnant`** (`documented`, https://eips.ethereum.org/EIPS/eip-4444), created 2021-11-02. It specifies `HISTORY_PRUNE_EPOCHS` ≈ 82,125 epochs (~1 year) and uses **SHOULD NOT**, not MUST: "Clients SHOULD NOT serve headers, block bodies, and receipts that are older than `HISTORY_PRUNE_EPOCHS` epochs on the p2p network."
- **But history expiry shipped anyway, by another route.** EF blog, **2025-07-08**, "Partial History Expiry Announcement" (`documented`): *"As of today, all Ethereum execution clients support partial history expiry in accordance with EIP-4444."* Scope: **all pre-Merge blocks (genesis → 2022-09-15)**, freeing 300–500 GB. **Nethermind enables it by default from v1.32.2**; other clients require a flag.
- **Fusaka hardened this at the wire level**: EIP-7642 (`eth/69`) was included in the Dec 2025 fork (`documented`, Fusaka mainnet announcement), dropping pre-merge history from the protocol.
- **The trust model is now explicit and weak-by-design**: *"We maintain a 1-of-N trust assumption… that if at least one entity provides the historical blocks, nodes will be able to retrieve the history via out-of-protocol means."*
- **Rolling/full history expiry (i.e. eventually expiring post-Merge history too) is `ongoing`, not shipped** as of the 2025-07-08 announcement, and the roadmap page mentions it only in passing (`documented`). **This is the risk to track.** Today's answer — "post-Merge execution history is still served by default" — is a current-configuration fact, not a protocol guarantee.

**Current retention window in practice:** pre-Merge history is optional (and off by default in at least one major client); post-Merge history is still retained by default; blob data is ~18 days minimum. The archives that backstop the expired portion are the era1/era files at eth-clients.github.io/history-endpoints, sha256-verifiable against `checksums.txt`, hosted by ethPandaOps and the Nimbus team on a volunteer basis — one of whose listed mirrors, as shown above, has already vanished from DNS.

### B8. Live (non-test) EVM chains whose explorers have disappeared

Two clean cases, both `observed` 2026-08-13 — **chain still running, canonical explorer domain gone from DNS entirely**:

| Chain | Chain status now | Canonical explorer | DNS (1.1.1.1 & 8.8.8.8) |
|---|---|---|---|
| **Fantom Opera** (chainId 250) | **LIVE** — block 122,862,115 via `rpc.fantom.network` | `ftmscan.com` | **no A record** (also `www.ftmscan.com`) |
| **Polygon zkEVM** (chainId 1101) | **LIVE** — block 33,391,890 via `zkevm-rpc.com` | `zkevm.polygonscan.com` | **no A record** |

Both were production mainnets holding real user funds. Fantom's replacement `sonicscan.org` covers Sonic, a *different* chain; `explorer.fantom.network` returns 200 but is not the explorer every Fantom link on the internet points to. `zkevm.blockscout.com` and `fantom.blockscout.com` both return **404**. **The reason the DNS records were removed is `unknown`** — I found no announcement for either; only the resulting state is observed.

Contrast with a *graceful* migration: `explorer.celo.org` 301s to `celo.blockscout.com` (200), and `klaytnfinder.io` 301s to `kaiascan.io` (200) after the Klaytn→Kaia rebrand — though `scope.klaytn.com`, Klaytn's original explorer, has **no A record**, while Kaia itself is live at block 224,395,179. So even the well-handled migrations lose one of their two historical domains.

Also gone: `mumbai.polygonscan.com`, `kovan-optimistic.etherscan.io`, `rinkeby-explorer.arbitrum.io` (all no A record) — L2 testnets, same pattern.

---

## What this means for data that must stay readable for decades

1. **L1 liveness is not the risk.** Ten years, zero halts longer than 96 seconds, two finality pauses totalling ~80 minutes, both self-healing. The measured worst case across 5,103 windows is a 12.9% missed-slot rate.
2. **The failure mode is repetition of one bug class.** May 2023 and December 2025 are the *same* bug — old-target attestation processing — in the same client, 31 months apart. Both were survived by client diversity, not by protocol robustness. A 2/3 supermajority client would have converted both into real finality loss.
3. **State-rewrite risk is essentially retired.** One rewrite, in 2016, with a surviving unforked chain. EIP-999's withdrawal is the load-bearing precedent: Ethereum declined to do it again when it mattered.
4. **The real threat to decades-readability is not consensus — it is the read path and the retention policy.** Blobs are gone in ~18 days by design, leaving only commitments. Pre-Merge history is already optional and off by default in one major client, backed by a self-declared 1-of-N volunteer archive whose own index already contains a dead host. Explorers and RPCs for anything unfunded evaporate within a few years, and DNS removal is the terminal state — for testnets *and* for live billion-dollar mainnets.
5. **Practical implication:** put durable data in L1 *contract state or calldata*, not blobs; do not assume any third-party RPC or explorer will exist in ten years; and treat "readable" as requiring your own archive plus a content hash, since the 1-of-N model means you should plan to be the 1.

---

## Unverified recollections — do not rely on

- That Infura specifically ran an outdated Geth (v1.9.9 or similar) in Nov 2020 — the Infura post-mortem URL 404s at both consensys.io and blog.infura.io.
- **The causal tie between CVE-2020-26265 and the Nov 11 2020 mainnet split.** The date and block timestamp are `observed`; the advisory is `documented`; the *connection* is `reported` only and the advisory explicitly declines to confirm a mainnet occurrence.
- Rinkeby's actual final shutdown date. Announced as "Q2/Q3 2023"; no shutdown-completion announcement found.
- Kovan's deprecation and shutdown dates — no EF announcement located. Only its explorer's NXDOMAIN state is observed.
- Whether the Goerli chain still has any block producer. Zero reachable RPCs, so unanswerable.
- Why `ftmscan.com` and `zkevm.polygonscan.com` DNS records were removed. No announcement found.
- The Etherscan tweet (2022-09-12) about Rinkeby/Ropsten explorers being "set to read-only… and eventually sunset" appeared in search results but I did not fetch or verify it.
- The cause of the elevated missed-slot rate in the 2024-03-27/28 windows (6.6% and 4.2% excess, two weeks post-Dencun). The anomaly is `observed`; the cause is `unknown` — I found no postmortem.
- Whether Sepolia has a permissioned validator set (frequently claimed; I did not verify it, and it would matter for Sepolia's long-term durability).

**Note:** my web-search budget was exhausted partway through (200/200 calls); the second half of this research was conducted via direct WebFetch of known-good URLs, the GitHub API, and live DNS/HTTP/JSON-RPC probing. That shifted the evidence base toward `observed` primary measurement, which is why the uptime, blob-expiry, and explorer-decay findings are first-hand rather than cited. The gaps it left are the `unknown` items listed above.
