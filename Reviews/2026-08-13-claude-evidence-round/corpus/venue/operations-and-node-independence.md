# Recovered Claude memo — Operations and node independence

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T04:30:38.462Z
**Claude task:** `a3c284e1197680ea8`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3434
**Original result length:** 35399 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
Research complete. Here are the findings.

---

# Operational independence & long-term readability of EVM venues
**Check date: 2026-08-12.** All `observed` rows are live JSON-RPC probes I ran today. Evidence tags: `observed` (I saw it), `documented` (venue's own docs), `reported` (third-party), `inferred`, `unknown`.

---

## 0. Live chain state (all `observed`, 2026-08-12)

| Venue | chainId | Head block | `web3_clientVersion` of public RPC |
|---|---|---|---|
| Ethereum L1 | 1 | 25,744,691 | `Geth/v1.17.1-stable-16783c16` (ethereum-rpc.publicnode.com) |
| Base | 8453 | 49,895,066 | `reth/v2.3.0-9384bc5/.../base/v1.1.1` |
| Arbitrum One | 42161 | 493,269,185 | `nitro/v3.11.3-rc.9-beb2108` |
| OP Mainnet | 10 | 155,890,735 | `op-reth/v2.4.1-a9a8dad3` |
| Linea | 59144 | ~31.7M (from getLogs error) | n/a |
| Scroll | 534352 | — | n/a |
| zkSync Era | 324 | — | n/a |
| Degen Chain (L3) | 666666666 | — | n/a |
| Xai (L3) | 660279 | — | n/a |

Note the Base public RPC is **already serving from `base/v1.1.1` reth**, not op-geth — corroborating the stack migration below (`observed`).

---

## 1. Independent full node: software, disk, sync

### Ethereum L1

| Client | Full/snap disk | Archive disk | Source |
|---|---|---|---|
| Geth | 500GB+ | 12TB+ | ethereum.org run-a-node table (`documented`) |
| Nethermind | ≥2 TB (fig. as of Oct 2024) | ≥14 TB, +60 GB/week (fig. as of Jul 2023; page updated 2026-07-15) | docs.nethermind.io/get-started/system-requirements (`documented`) |
| Besu | 800GB+ | 12TB+ | ethereum.org (`documented`) |
| Erigon 3 | Full 419.04 GB actual / 2 TB rec.; Minimal 378.97 GB / 1 TB rec. | 2.03 TB actual / 4 TB rec. | docs.erigon.tech/get-started/hardware-requirements, **data stamped 2026-07-19** (`documented`) |
| Reth | ≥1.2 TB | ≥2.8 TB | reth.rs/run/system-requirements, stamped 2025-06-23 @ block 22.7M (`documented`) |

- ethereum.org minimums: 2+ cores, 8 GB RAM, 2TB SSD, 10+ Mbit/s; recommended 4+ cores, 16 GB+, 2+TB, 25+ Mbit/s; **+~200 GB for beacon data** (`documented`, ethereum.org/en/developers/docs/nodes-and-clients/run-a-node/).
- Erigon sync-time estimates (self-described "indicative, not CI-measured"): archive ≈8 h, full ≈4–6 h, minimal ≈2 h (`documented`, same URL).
- **Client diversity (clientdiversity.org, `documented` but self-flagged unreliable):** CL — Teku 53.86%, Prysm 21.17%, Lighthouse 20.6%, Nimbus 3.12%, Grandine 0.72%, Lodestar 0.53%. EL — Nethermind 43%, Geth 43%, Besu 8%, Reth 3%, Erigon 3%. **The page itself warns** the EL figures are from supermajority.info, "based on 59.4% self-reported network coverage with the remaining assumed to be mostly Geth," and that manually-gathered datasets are stale. Treat EL percentages as `unknown` in precision, `documented` only in ordering. Teku at 53.86% of CL is itself a supermajority-risk datapoint.

### L2s / L3s

| Venue | Node software | Disk (documented) | Notes |
|---|---|---|---|
| Base | `base-reth-node` (execution) + `base-consensus` | Snapshots: **Archive 3.9 TB, Full 3.3 TB, Minimal 713.4 GB** (chain.base.org/snapshots, `documented`) | 32 GB RAM min / 64 GB rec.; sizing rule "2 × chain size + snapshot + 20%"; prod = AWS `i7i.12xlarge` RAID0 NVMe (`documented`, github.com/base/node + docs.base.org/base-chain/node-operators/performance-tuning) |
| OP Mainnet | op-node + **op-reth** (primary) or Nethermind | **Full ≈700 GB (+~100 GB/6mo); Archive ≈14 TB (+~3.5 TB/6mo)**, figures "as of June 2025" | 16 GB RAM min. **`op-geth` reached end-of-support 2026-05-31** and cannot follow canonical chain after Karst (`documented`, docs.optimism.io/operators/node-operators/tutorials/mainnet) |
| Arbitrum One | Nitro (`nitro/v3.11.3`) | Full: `pruned` HashDB ≈**2.3 TB**, `full-path` PathDB ≈**2.4 TB**. Archive: `archive-path` ≈**3.7 TB** (HashDB archive "considerably larger") | Archive: 64 GB RAM min /128 GB rec., 8–16 cores (`documented`, docs.arbitrum.io/run-arbitrum-node/run-full-node + .../more-types/run-archive-node) |
| Linea | Linea Besu | `unknown` — docs URLs I tried 404'd | Sequencer single-operator, ConsenSys (`reported`) |
| Scroll | `l2geth`, binary `scroll-v5.8.38`+ | Archive snapshot **≈2 TB**, needs **≥4 TB disk** to unpack; AWS `t3.2xlarge`-class (`documented`, docs.scroll.io/en/developers/guides/running-a-scroll-node/) | Requires `--l1.endpoint` to a synced L1 |
| zkSync Era | External Node (read-only replica) | `unknown` | See §2 — architecturally not L1-derived |
| Degen Chain (L3) | Arbitrum Orbit / AnyTrust, operated by Conduit | `unknown` — no public node docs found | |
| Xai (L3) | Arbitrum Orbit / AnyTrust | "Sentry Node" ≠ full node: 4 GB RAM, 2 cores, 60 GB disk (`reported`, xai-foundation.gitbook.io) | Sentry is "an **observation node** that monitors the Xai rollup protocol and if an incorrect block is proposed, it raises an alarm" (`documented`) — it is a watcher, not a chain verifier |

---

## 2. Does running an L2 node require a trusted input?

| Venue | Can it derive purely from L1? | Trusted inputs actually required | Source |
|---|---|---|---|
| OP Mainnet / OP Stack | **Yes.** Consensus-layer sync "reads transaction data from L1 and derives blocks... does not rely on P2P networking from other L2 nodes"; "every block is derived from L1 and independently verified, but it's much slower." Snapshots "are not required" with snap sync. | L1 execution RPC (`--l1`) + **L1 beacon RPC** (`--l1.beacon`) + L2 engine endpoint. For history >18 days old, a **blob archiver** (see §4). | `documented` — docs.optimism.io/operators/node-operators/management/snap-sync, .../configuration/base-config, .../management/snapshots |
| Base | Same OP-derivation lineage; snapshots framed as optional acceleration ("nodes can perform genesis synchronization"). Post-migration derivation properties of `base-consensus` **not yet documented** → `unknown`. | "You'll need your own L1 RPC URL... If running your own L1 node, it needs to be synced before Base will be able to fully sync." | `documented` — docs.base.org/base-chain/node-operators/run-a-base-node, .../snapshots |
| Arbitrum One | **Partially no.** `--init.url` is "**(Required for Arbitrum One)** URL to download the genesis database from. Only required for Arbitrum One nodes, when running them for the first time." Docs say snapshots let you "initialize without syncing from genesis" but never state genesis-sync is possible for Arbitrum One. | L1 RPC (`--parent-chain.connection.url`) + **L1 beacon** (`--parent-chain.blob-client.beacon-url`) + **downloaded genesis DB**. Sequencer feed `--node.feed.input.url` defaults to the official Offchain Labs feed (real-time only). | `documented` — docs.arbitrum.io/run-arbitrum-node/run-full-node. **Flag: docs vs. need.** The genesis-DB download is a hard trusted input for Arbitrum One and the docs do not explain why or offer an alternative. |
| Arbitrum One (pre-Nitro history) | No. "You need an Arbitrum **Classic archive node** to execute data on pre-Nitro blocks," image `offchainlabs/arb-node:v1.4.6-551a39b3`, snapshot at `snapshot.arbitrum.foundation/arb1/classic-archive.tar`. Nitro node forwards via `--execution.rpc.classic-redirect`. | A second, separately-maintained legacy client + a foundation-hosted tarball. | `documented` — docs.arbitrum.io/run-arbitrum-node/more-types/run-classic-node |
| Degen / Xai (Orbit AnyTrust L3) | **No.** Data goes to a permissioned **Data Availability Committee**; only a DACert is posted to the parent chain. L2BEAT on Degen: "less than 5 external actors that can attest data availability," 2/3 threshold. | DAC members must serve you the data. If they don't, the chain is unreconstructible. | `documented` (docs.arbitrum.io/how-arbitrum-works/data-availability) + `documented` (l2beat.com/scaling/projects/degen) |
| Scroll | Requires a synced L1 RPC; docs present snapshot-based Docker as the standard path; **no L1-follower-only mode documented** → `unknown` whether pure-L1 derivation is supported. | L1 RPC + snapshot in practice. | `documented` — docs.scroll.io |
| zkSync Era | **No.** The External Node is "a read-only replica of the main node... synchronized chain data **from the main node**... could not produce blocks, generate proofs, or act as a consensus node." | The Matter Labs main node. | `documented` — docs.zksync.io/zksync-era/tooling/external-node |
| Linea | `unknown` | `unknown` | docs URLs 404'd |

**Arbitrum One is a Rollup, not AnyTrust** — "Arbitrum One does not use a DAC"; data goes to L1 as calldata or blobs (`documented`, docs.arbitrum.io/how-arbitrum-works/data-availability). The DAC question applies to Nova and to the Orbit L3s.

---

## 3. RPC dependency and rate limits

All `observed` 2026-08-12 unless noted.

| Venue | Public endpoint | Documented ToS | Observed behavior |
|---|---|---|---|
| L1 | many (publicnode, drpc, cloudflare-eth, ankr…) | n/a — no single canonical default | publicnode: **`"Archive requests require a personal token. Get one at: allnodes.com/publicnode"`** for any historical query. ankr: `"Unauthorized: You must authenticate your request with an API key."` llamarpc: HTTP 521 (down). cloudflare-eth: `eth_getBlockReceipts` → `"Method not found"`. drpc: worked. |
| Base | `https://mainnet.base.org` | "The public endpoints above are rate-limited and **not suitable for production traffic**" (`documented`) | `-32614 "eth_getLogs is limited to a 10,000 range"` |
| Arbitrum One | `https://arb1.arbitrum.io/rpc` | "**No uptime, latency, or rate-limit guarantees.** Any application that depends on availability should use a third-party node provider or run its own node." (`documented`) | `-32000 "logs matched by query exceeds limit of 10000"` (result cap, not range cap) |
| OP Mainnet | `https://mainnet.optimism.io` | "rate limited and do not support websocket connections" (`documented`) | On one query: **`-32011 "no backend is currently healthy to serve traffic"`**; on retry `-32062 "Block range is too large"`. **Doc vs. reality flag:** docs describe rate-limiting; observed failure mode was an outright backend outage. |
| Linea | `https://rpc.linea.build` | `unknown` | `-32602 "range 31702934 exceeds limit of 10000"` |
| Scroll | `https://rpc.scroll.io` | `unknown` | `-32062 "Block range is too large"` |
| zkSync Era | `https://mainnet.era.zksync.io` | `unknown` | `-32602 "Query returned more than 10000 results. Try with this block range [0x0, 0xc63]"` — i.e. ~3,171 blocks on a full-chain query |
| Degen | `https://rpc.degen.tips` | `unknown` | `-32600 "You can make eth_getLogs requests with up to a 10000 block range"` |
| Xai | `https://xai-chain.net/rpc` | `unknown` | 10,000-**result** cap; a 100,000-block topic-filtered query **succeeded** |

**Structural read:** L1 is the only venue with no single canonical default RPC — there is a competitive field of independent public endpoints, several of which served me full historical bodies today. Every L2/L3 has exactly one branded default endpoint operated by the chain's own company, and each one's own docs disclaim it for production use.

---

## 4. Archival access without a commercial provider

### Ethereum L1

- **EIP-4444 formal status: `Stagnant`** (Standards Track: Networking). Abstract: "Clients must stop serving historical headers, bodies, and receipts older than one year on the p2p layer. Clients may locally prune this historical data." `HISTORY_PRUNE_EPOCHS` = 82,125 beacon epochs ≈ 1 year (`documented`, eips.ethereum.org/EIPS/eip-4444). **Flag: the EIP is Stagnant while partial expiry has already shipped** — spec and reality diverge.
- **Partial history expiry shipped 2025-07-08**: pre-Merge block data droppable; supported in Geth v1.16.0+, Nethermind 1.32.2+, Besu 25.7.0+, Erigon v3.0.12+, Reth v1.5.0+; saves 300–500 GB (`documented`, blog.ethereum.org/2025/07/08/partial-history-exp).
- **Where pre-Merge history lives now** (`documented`, eth-clients.github.io/history-endpoints/): **era1 files**, genesis → merge block 15,537,393 (2022-09-15). Mirrors: `data.ethpandaops.io/era1/mainnet/`, `mainnet.era1.nimbus.team`. Torrent + magnet via `ethereum-mainnet-pre-merge-era-files.fra1.cdn.digitaloceanspaces.com`. **"Each era1 source includes a list of sha256 hashes in checksums.txt"** — content-addressed and self-verifying, which is the load-bearing property.
- **Observed today:** pre-Merge block 10,000,000 full body (103 txs) **and** `eth_getBlockReceipts` (103 receipts) both served by publicnode and drpc. So pre-Merge history is still widely served in practice as of 2026-08-12, notwithstanding expiry support.
- **Full/rolling history expiry**: targeted at an unspecified 2026 hardfork (`reported`). Glamsterdam's locked EIP set is headlined by EIP-7732 (ePBS) and EIP-7928 (Block-Level Access Lists); mainnet H2/Q4 2026, no date locked (`reported`). Whether rolling expiry is in Glamsterdam: **`unknown`**.
- **Portal Network** (the intended permissionless replacement): Trin's own repo states it "**should not be relied upon in a production setting**" and "lacks comprehensive data validation" (`reported`, via ethereum.org + github.com/ethereum/trin). Four implementations exist (Trin/Fluffy/Ultralight/Shisui). **Not a dependable 10–20 year answer today.**
- **State expiry / state rent**: "inactive state is **not deleted**, it is just stored separately from the active state"; "State expiry is still in the research phase and not yet ready to ship" (`documented`, ethereum.org/en/roadmap/statelessness/). No state rent on any roadmap I could verify.

### Blobs — the sharpest long-term hazard for every L2

- Retention **4096 epochs ≈ 18 days**; OP's own words: "**Standard beacon nodes prune blobs after 18 days**" (`documented`, docs.optimism.io/operators/node-operators/management/blobs).
- OP: a blob archiver is required if "You're syncing a new node from a snapshot or genesis older than 18 days" or "Your node has been offline for more than 18 days." Options: no-prune beacon node, `base-org/blob-archiver`, or QuickNode. Fallbacks via `--l1.beacon-fallbacks` "to fetch blob sidecars not available at the l1.beacon (e.g. expired blobs)" (`documented`).
- Arbitrum: "new node operators joining a network or node operators who come online following an extended period of offline time will require access to **historical** blob data to sync up to the latest state." Named historical-blob providers: **Ankr, Chainstack, Conduit, Nirvana Labs, QuickNode, dRPC — all six commercial** (`documented`, docs.arbitrum.io/run-arbitrum-node/l1-ethereum-beacon-chain-rpc-providers).
- **Net effect (`inferred`, high confidence):** for any rollup posting via blobs, L1 guarantees the data only for ~18 days. Beyond that, reconstructing L2 history from L1 alone is impossible; you must obtain archived blobs, and the documented sources are commercial or chain-operator-run. There is **no era-file/torrent/checksummed equivalent for blobs** that I could verify — this is the single biggest divergence between L1 and every L2 on the 10–20 year question.
- Fusaka/PeerDAS activated mainnet 2025-12-03 at slot 13,164,544; BPO forks raised blob target/max (BPO1 → 10/15, BPO2 → 14/21) (`reported`, blog.ethereum.org/2025/11/06/fusaka-mainnet-announcement + Figment). **Whether Fusaka changed the 4096-epoch retention: `unknown`.**

### Observed archive availability on the free/default endpoint

| Venue | Historical state via public RPC? | Evidence (2026-08-12) |
|---|---|---|
| L1 (publicnode) | **No** | `"Archive requests require a personal token"` |
| Base | **Yes** | `eth_getBalance(WETH, block 5,000,000)` → `0x90ea401b653dc0424a3`; `eth_call` USDC `totalSupply()` @5,000,000 → valid |
| OP Mainnet | **Yes**, incl. pre-Bedrock | `eth_getBalance(vitalik, block 2,000,000)` → `0xde5acfd41909449`; block 1 header shows legacy clique `geth 1.15.13` extraData |
| Arbitrum One | **No** | `"missing trie node ... state is not available"` even at head−100,000 |
| Arbitrum One (pre-Nitro) | **Yes, bodies** | blocks 1,000,000 and 22,207,816 returned with txs — official endpoint has `classic-redirect` wired |
| Linea | **Yes** | balance @2,000,000 → `0x49f6f3bc82000` |
| Scroll | **Yes** | → `0x803d1ee9d000` |
| zkSync Era | **Yes** | → `0x221b262dd8000` |
| Degen | inconclusive | returned `0x0` (no error) |
| Xai | **No** | `"missing trie node ... not found"` |

---

## 5. Reading a contract's full event history

| Venue | Cap type | Exact observed error | Archive node needed? |
|---|---|---|---|
| L1 | provider-gated | `"Archive requests require a personal token"` (publicnode) | For logs beyond the node's retained history: **yes**, or era1 files |
| Base | **block range = 10,000** | `-32614` | Public RPC serves archive state, so a full scan ≈ 4,990 sequential calls at current head |
| OP Mainnet | block range (limit not disclosed in error) | `-32062 "Block range is too large"` | Archive state served |
| Arbitrum One | **result count = 10,000** | `-32000` | Head is 493M blocks; result-cap paging on a 493M-block chain is the worst scan profile of the set |
| Linea | **block range = 10,000** | `-32602 "range N exceeds limit of 10000"` | |
| Scroll | block range | `-32062` | |
| zkSync Era | result count 10,000 | `-32602` with a suggested range | |
| Degen | **block range = 10,000** | `-32600`, echoes a workable range | |
| Xai | result count 10,000 | 100k-block filtered query succeeded | |

`inferred`: every venue including L1 forces windowed pagination; none of the public endpoints will give you a contract's full log history in one call. Self-hosting removes the cap on all of them. Subgraph/indexer dependency is therefore optional-but-practical everywhere; I found **no venue where reading events requires a proprietary indexer** — `documented`/`observed` for L1, Base, OP, Arb, Linea, Scroll, zkSync, Degen, Xai.

---

## 6. Interoperability, determinism, and EAS

### Deterministic deployment — `observed` today by fetching runtime bytecode and comparing sha256

| Factory | Address | L1 | Base | Arb1 | OP | Linea | Scroll | zkSync | Degen | Xai |
|---|---|---|---|---|---|---|---|---|---|---|
| Arachnid/Foundry CREATE2 deployer | `0x4e59b448…4956C` | ✅69B | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Safe Singleton Factory | `0x914d7Fec…43d7` | ✅69B | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ERC-2470 SingletonFactory | `0xce0042B8…cf9f` | ✅308B | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **❌ absent** | ✅ |
| **CreateX (CREATE3)** | `0xba5Ed099…ba5Ed` | ✅11838B | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **❌ absent** | **❌ absent** |
| EntryPoint v0.6 | `0x5FF137D4…2789` | ✅23689B | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| EntryPoint v0.7 | `0x00000000717…a032` | ✅16035B | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| EntryPoint v0.8 | `0x4337084D…f108` | ✅21738B | ✅ | ✅ | ✅ | **⚠️ RPC internal error** | ✅ | ✅ | ✅ | ✅ |

sha256 of runtime code was **byte-identical across every chain where present** — `0x4e59b448…` = `e0af82ad2e518828` (69 B) everywhere; CreateX = `fa1034b5da300033` (11838 B); EntryPoint v0.7 = `674d73ee2acf6d72` (16035 B). This is strong `observed` evidence that CREATE2-derived addresses are consistent across L1, Base, Arb1, OP, Linea, Scroll, **and zkSync Era**.

**The zkSync exception has partly closed, and its own docs disagree with themselves:**
- Old/native rule (`documented`, docs.zksync.io/…/differences/contract-deployment + evm-instructions): EraVM derives CREATE2 from `keccak256(zksyncCreate2 ++ address ++ salt ++ keccak256(bytecode) ++ keccak256(constructorInput))` — **not** Ethereum's rule.
- New rule (`documented`, docs.zksync.io/zksync-protocol/era-vm/evm-interpreter/overview): "**Consistent address derivation. `create` and `create2` generate the same contract addresses as on Ethereum**" and "Deploy Solidity and Vyper contracts without recompilation."
- `observed`: canonical factories exist at Ethereum-identical addresses with identical bytecode on zkSync Era mainnet.
- **`inferred`:** determinism now holds for EVM-bytecode contracts via the interpreter, but **not** for `zksolc`-compiled EraVM contracts. Cost penalty documented at 1.5×–4×. **Flag: docs contradict each other; the contract-deployment differences page has not been reconciled with the interpreter page.**

**Real determinism exceptions found: Degen Chain (no ERC-2470, no CreateX) and Xai (no CreateX).** CREATE3-based address schemes will not reproduce on those two L3s without you deploying the factory yourself (`observed`).

### EVM opcode / semantics parity

| Venue | Notable divergences |
|---|---|
| Base, OP Mainnet | EVM-equivalent OP Stack; hardfork cadence tracks OP (Isthmus 2025-05-09, Jovian 2025-12-02, Karst 2026-07-08). `documented` |
| Arbitrum One | `blockhash(x)` = "cryptographically insecure, pseudo-random hash" only for `block.number-256 ≤ x < block.number`; `block.coinbase` = `0xA4b0…73657175656e636572` (sequencer) or the poster; `block.difficulty` = 1; `block.prevrandao` = **1**; **`block.number` is "an 'estimate' of the block number of the first non-Arbitrum ancestor chain"**; `msg.sender` is an alias for delayed-inbox messages. PUSH0 since ArbOS 11; TSTORE/TLOAD (EIP-1153) and MCOPY since **ArbOS 20 "Atlas"**; EIP-7702 since **ArbOS 40 "Callisto"**; ArbOS 51 "Dia" (voted 2025-12-18, activated **2026-01-08**) "align with EIP-7702 spec to treat precompile code as empty during delegation." `documented`/`reported` |
| zkSync Era | **Compile-time errors** on SELFDESTRUCT, CALLCODE, PC, EXTCODECOPY. CODESIZE/CODECOPY differ in deploy code. EXTCODEHASH returns a "versioned SHA3-based hash instead of keccak256" for EraVM contracts. BASEFEE not constant. DIFFICULTY/PREVRANDAO = `2500000000000000`. COINBASE = bootloader `0x8001`. Memory growth counted in bytes not words. `documented` |
| Linea, Scroll | zkEVMs; per-opcode divergence lists **not verified** → `unknown` |

### EAS deployments — `observed` on-chain today

| Venue | EAS address | code | SchemaRegistry | code |
|---|---|---|---|---|
| L1 | `0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587` | 19,971 B | `0xA7b39296258348C78294F95B872b282326A97BDF` | 1,976 B |
| Base | `0x4200…0021` (predeploy) | 2,055 B (proxy) | `0x4200…0020` | 2,055 B |
| OP Mainnet | `0x4200…0021` (predeploy) | 2,055 B (proxy) | `0x4200…0020` | 2,055 B |
| Arbitrum One | `0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458` | 19,971 B | `0xA310da9c5B885E7fb3fbA9D66E9Ba6Df512b78eB` | 1,976 B |
| Linea | `0xaEF4103A04090071165F78D45D83A0C0782c2B2a` | 18,832 B | `0x55D26f9ae0203EF95494AE4C170eD35f4Cf77797` | — |
| Scroll | `0xC47300428b6AD2c7D03BB76D05A176058b47E6B0` | 18,881 B | `0xD2CDF46556543316e7D34e8eDc4624e2bB95e3B6` | — |
| zkSync Era | `0x21d8d4eE83b80bc0Cc0f2B7df3117Cf212d02901` | **120,480 B** (EraVM-compiled) | `0xB8566376dFe68B76FA985D5448cc2FbD578412a2` | 7,904 B |
| **Degen Chain** | **none** — 0 bytes at OP predeploy, L1 addr, and Arb1 addr | ❌ | | ❌ |
| **Xai** | **none** — same three probed, all 0 bytes | ❌ | | ❌ |

Key structural fact (`observed` + `documented`, github.com/ethereum-attestation-service/eas-contracts): **EAS addresses are not canonical across chains.** Optimism/Base/Soneium/Ink/Unichain/Blast share the OP predeploy pair `0x4200…0021` / `0x4200…0020`; every other chain has a unique address. L1 and Arbitrum One share identical bytecode length (19,971 B) at *different* addresses. zkSync's is a different artifact entirely.

---

## 7. Contract lifetime hazards

| Venue | State rent / expiry | Regenesis / breaking migration history |
|---|---|---|
| Ethereum L1 | **None shipped, none scheduled.** State expiry = separation, not deletion; "still in the research phase and not yet ready to ship" (`documented`, ethereum.org). History expiry ≠ state expiry: balances/calls unaffected — "accessing a current balance, executing a trade, borrowing assets, etc. will not be interrupted" (`documented`, EF blog 2025-07-08) | DAO fork 2016 aside, no address/storage-breaking regenesis. `inferred` from absence of any documented event |
| OP Mainnet | none found | **Two.** (a) **2021-11-11 OVM 1.0 → OVM 2.0 regenesis**: pools moved "to their L1-equivalent addresses corresponding to CREATE2 with the new bytecode," ERC-20s "migrated to their new CREATE2'ed addresses," and **"contracts whose source code had not been verified on Etherscan would be wiped out along with their storage"** — `reported` (Rubicon mirror post; OpenZeppelin Optimism audit; SIP-182 checklist gist; no surviving first-party doc found — ethereum-optimism/regenesis is archived read-only since 2021-04-12). (b) **Bedrock 2023**, described by OP's own hardfork registry as a "**governance-approved re-genesis in 2023**" at L2 timestamp 1686068903 / block 105,235,063 (`documented`, docs.optimism.io/operators/node-operators/network-upgrades). **Observed corroboration:** OP block 1 header still carries clique-style `extraData` from `geth 1.15.13` — the legacy chain is preserved behind the Bedrock genesis. |
| Base | none found | No regenesis found. **But: stack migration in progress** — see below |
| Arbitrum One | none found | **Classic → Nitro migration**: state and addresses preserved, but pre-Nitro execution requires a **separate legacy client + foundation tarball** (`documented`). Effectively a history bifurcation, not an address break. |
| Degen Chain | none found | **2024-05-13, ~2 days down.** L2BEAT milestone: "Degen Chain halts for two days due to a chain misconfiguration." `reported`: Conduit pushed an untested config change; Degen and Proof of Play Apex stopped posting batches >24 h; "upon resuming, the first batches triggered **reorgs** on both chains"; **~500,000-block reorg**; nodes resynced from genesis; ~54 h downtime; ~$160k user funds lost; 75% drop in bridge volume the following month. Later reporting describes a migration blocked by a "Conduit standoff" over bridge keys. |
| Xai | none found | `unknown` |
| Linea / Scroll / zkSync | none found | `unknown` |

### Base's OP Stack exit — a live lifetime hazard

`documented`, blog.base.dev/next-chapter-for-base-chain-1, **published 2026-02-18**:
- Base consolidates into a single `base/base` repo; **one Base binary replaces op-node + op-geth**.
- "**Open Source Forever** … Base specifications and code will always be public, open for contribution."
- Cadence moves to **six hard forks per year** (from three). Roadmap: **Base V1** (client consolidation, proof upgrades, Fusaka support) → **Base V2** (block access lists, new tx types) → **Base V3** (Glamsterdam support, opcode repricing).
- `reported`: "After activation, op-node + op-geth will no longer sync with the canonical chain"; Sepolia activation 2026-04-20 18:00 UTC; OP token fell ~7% on the news.
- `observed`: `mainnet.base.org` already reports `reth/v2.3.0…/base/v1.1.1`, and `github.com/base/node` lists only `base-reth-node` + `base-consensus`.
- **Doc-vs-reality flag:** `docs.base.org/base-chain/node-operators/run-a-base-node` as fetched today contains **no migration notice, no client names, and no deadline** — an operator reading the official node tutorial would not learn that op-geth/op-node are being retired.

Parallel on OP Mainnet: **op-geth reached end-of-support 2026-05-31** and "can no longer follow the canonical chain after the Karst hardfork activation" (Karst = 2026-07-08 16:00:01 UTC) (`documented`). "Failing to upgrade your OP Stack software before the activation timestamp causes a chain divergence, and you will need to resync the chain." `inferred`: OP-Stack execution-client diversity is now effectively op-reth + Nethermind; **six hard forks/year on Base means roughly a 2-month maximum unattended-node lifetime.**

---

## 8. Self-host cost to run a full archive

I could not retrieve current hosting prices (Hetzner pages returned marketing copy without price tables), so **all monetary figures are `unknown`.** What is `documented` is the resource envelope, which is the thing that actually constrains cost:

| Venue | Archive disk | RAM | Second machine required? |
|---|---|---|---|
| L1 (Erigon 3) | 2.03 TB actual / **4 TB rec.** | 32 GB min / 64 GB rec. | + consensus client (~200 GB) |
| L1 (Reth) | ≥2.8 TB | 16 GB+ | + CL |
| L1 (Geth/Nethermind/Besu, hash-based) | **12–14 TB** | up to 128 GB (Nethermind) | + CL |
| Base | **3.9 TB** snapshot; sizing rule 2× chain + snapshot + 20% ⇒ ~**9.4 TB** provisioned | 32–64 GB | + full L1 node + L1 beacon + blob archiver |
| OP Mainnet | **≈14 TB**, growing **≈3.5 TB / 6 months** | 16 GB min (understated for archive) | + full L1 node + beacon + blob archiver |
| Arbitrum One | **3.7 TB** (`archive-path`) + separate **Classic archive** node | 64 GB min / 128 GB rec. | + full L1 node + beacon w/ historical blobs + Classic node |
| Scroll | ~2 TB snapshot, **≥4 TB** disk | `unknown` | + synced L1 |
| Linea / zkSync / Degen / Xai | `unknown` | `unknown` | |

`inferred`: a self-sufficient Base or Arbitrum archive setup is **not one machine** — it is L1 execution + L1 consensus (+ blob archiver / no-prune beacon) + the L2 archive (+ a Classic node for Arbitrum). OP Mainnet's 14 TB archive growing 7 TB/year is the steepest trajectory in the set and the one most likely to price out an individual over a 10–20 year horizon.

---

## Could not verify

1. **Whether Fusaka/PeerDAS changed the 4096-epoch (~18 day) blob retention window.** Every source still quotes 4096 epochs; none confirm it post-Fusaka.
2. **Whether rolling-window EIP-4444 history expiry is in Glamsterdam's locked EIP set.** Glamsterdam's ten EIPs are headlined by 7732/7928; a 2026 hardfork for rolling expiry is `reported` but unattached to a named fork.
3. **Linea node requirements** — every docs URL I tried 404'd (`docs.linea.build/get-started/how-to/run-a-node`, `/operate/run-a-node`). Disk, client, snapshot dependence, L1-derivation: all `unknown`.
4. **zkSync Era External Node disk sizes** and whether any L1-only derivation path exists.
5. **Degen Chain node operation** — no public node docs found; `docs.degen.tips` does not resolve (DNS ENOTFOUND). Whether a third party can run a Degen full node at all: `unknown`.
6. **Xai full-node (non-Sentry) requirements**, and Xai's L2BEAT stage (page truncated).
7. **Hosting/hardware prices** for any venue.
8. **A first-party Optimism record of the 2021-11-11 OVM 1.0→2.0 regenesis.** The `ethereum-optimism/regenesis` repo is archived read-only (since 2021-04-12) and served no content. All detail is third-party.
9. **Precise L1 execution-client diversity.** clientdiversity.org's own page disclaims its EL numbers as stale and 59.4%-self-reported.
10. **Whether `base-consensus` retains pure-L1 derivation** (the OP `--syncmode=consensus-layer` equivalent). Not documented anywhere I could reach — this is the most important open question for Base's independence claim.
11. **Linea/Scroll opcode divergence lists** (PUSH0, EIP-1153, precompiles, EIP-7702).
12. **EntryPoint v0.8 on Linea** — RPC returned `-32603 Internal error` rather than a clean absence.
13. **Whether Degen/Xai DAC members will serve historical data to an unaffiliated party on request.**
14. **Base's actual mainnet activation date for the `base/base` client cutover** — "will communicate more as this date approaches."

---

## Two divergences worth restating

- **Blobs are the asymmetry.** L1's pre-Merge history has a permissionless, checksummed, torrent-distributed archive (era1 + `checksums.txt`). L2 blob history older than ~18 days has no equivalent — Arbitrum's docs name six commercial providers, OP's name a Base-operated archiver plus QuickNode. A rollup's calldata-era history is on L1 forever; its blob-era history is only as durable as whoever chose to keep it.
- **Docs lag reality on Base and on zkSync.** Base's official node tutorial does not mention the client migration that its own public RPC is already running. zkSync's contract-deployment page still teaches a CREATE2 derivation that its EVM-interpreter page contradicts and that my on-chain probes disprove for EVM bytecode.

**Sources:** [clientdiversity.org](https://clientdiversity.org/) · [ethereum.org run-a-node](https://ethereum.org/en/developers/docs/nodes-and-clients/run-a-node/) · [ethereum.org statelessness](https://ethereum.org/en/roadmap/statelessness/) · [EF partial history expiry](https://blog.ethereum.org/2025/07/08/partial-history-exp) · [eth-clients history-endpoints](https://eth-clients.github.io/history-endpoints/) · [EIP-4444](https://eips.ethereum.org/EIPS/eip-4444) · [Erigon hardware](https://docs.erigon.tech/get-started/hardware-requirements) · [Reth system requirements](https://reth.rs/run/system-requirements) · [Nethermind system requirements](https://docs.nethermind.io/get-started/system-requirements/) · [OP mainnet node tutorial](https://docs.optimism.io/operators/node-operators/tutorials/mainnet) · [OP snap-sync](https://docs.optimism.io/operators/node-operators/management/snap-sync) · [OP snapshots](https://docs.optimism.io/operators/node-operators/management/snapshots) · [OP blobs](https://docs.optimism.io/operators/node-operators/management/blobs) · [OP network upgrades](https://docs.optimism.io/operators/node-operators/network-upgrades) · [OP base-config](https://docs.optimism.io/operators/node-operators/configuration/base-config) · [Superchain networks](https://docs.optimism.io/superchain/networks) · [Base run-a-base-node](https://docs.base.org/base-chain/node-operators/run-a-base-node) · [Base performance tuning](https://docs.base.org/base-chain/node-operators/performance-tuning) · [Base snapshots](https://chain.base.org/snapshots) · [github.com/base/node](https://github.com/base/node) · [Base engineering blog 2026-02-18](https://blog.base.dev/next-chapter-for-base-chain-1) · [Arbitrum run-full-node](https://docs.arbitrum.io/run-arbitrum-node/run-full-node) · [Arbitrum archive node](https://docs.arbitrum.io/run-arbitrum-node/more-types/run-archive-node) · [Arbitrum classic node](https://docs.arbitrum.io/run-arbitrum-node/more-types/run-classic-node) · [Arbitrum beacon RPC providers](https://docs.arbitrum.io/run-arbitrum-node/l1-ethereum-beacon-chain-rpc-providers) · [Arbitrum DA](https://docs.arbitrum.io/how-arbitrum-works/data-availability) · [Arbitrum node providers](https://docs.arbitrum.io/build-decentralized-apps/reference/node-providers) · [Arbitrum solidity support](https://docs.arbitrum.io/build-decentralized-apps/arbitrum-vs-ethereum/solidity-support) · [ZKsync EVM interpreter](https://docs.zksync.io/zksync-protocol/era-vm/evm-interpreter/overview) · [ZKsync contract deployment](https://docs.zksync.io/zksync-protocol/era-vm/differences/contract-deployment) · [ZKsync EVM instructions](https://docs.zksync.io/zksync-protocol/era-vm/differences/evm-instructions) · [ZKsync external node](https://docs.zksync.io/zksync-era/tooling/external-node) · [Scroll node guide](https://docs.scroll.io/en/developers/guides/running-a-scroll-node/) · [L2BEAT Degen](https://l2beat.com/scaling/projects/degen) · [L2BEAT Xai](https://l2beat.com/scaling/projects/xai) · [EAS contracts README](https://github.com/ethereum-attestation-service/eas-contracts) · [Fusaka mainnet announcement](https://blog.ethereum.org/2025/11/06/fusaka-mainnet-announcement) · [Xai sentry nodes](https://xai-foundation.gitbook.io/xai-network/xai-blockchain/sentry-nodes-explained) · [Blockworks Degen outage](https://blockworks.com/news/degen-layer-3-chain-outage) · [CoinDesk Base/OP Stack](https://www.coindesk.com/business/2026/02/18/coinbase-s-base-moves-away-from-optimism-s-op-stack-in-major-tech-shift)
