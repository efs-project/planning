# GoE, EthStorage, and Git-on-Chain Prior Art (Public State)

**Lane:** EthStorage and GoE (Git on Ethereum / git3 / EthStorage's git offering) — researched 2026-08-07

Claim labels used throughout: **[shipped]** implemented/observable, **[intent]** documented plan, **[rec]** this lane's recommendation, **[spec]** speculation.

## 1. EthStorage — current state (Aug 2026)

### Deployment status
- **[shipped]** EthStorage **Mainnet Alpha went live on Ethereum L1 on 14 Oct 2025** ("petabyte-scale, verifiable storage as a dedicated layer 2") after ~3 years of R&D. Pre-launch testing: "170+ nodes stored over 550 GB of unique data." ([launch post](https://blog.ethstorage.io/ethstorage-mainnet-alpha-launch-petabyte-scale-decentralized-storage-on-ethereum/), [2025 annual report](https://blog.ethstorage.io/ethstorage-2025-annual-report/), published 2026-01-08)
- **[shipped]** Current network pins (docs "Information" page, checked 2026-08-07): Mainnet chain-id **333**, L1 storage contract `0xf0193d6E8fc186e77b6E63af4151db07524f6a7A`, blob archiver API `archive.mainnet.ethstorage.io:9645`; Sepolia testnet chain-id **3333**, contract `0xAb3d380A268d088BA21Eb313c1C23F3BEC5cfe93`; QuarkChain L2 beta testnet chain-id 3337. Versions: `storage-contracts-v1 v0.2.1`, `es-node v0.2.10`. ([docs.ethstorage.io/information](https://docs.ethstorage.io/information))
- **[shipped]** Mainnet Alpha mining is **whitelist-only** ("storage provider participation is limited to a whitelist"); non-whitelisted nodes may sync with `--miner.enabled=false`. **[intent]** "gradually expand … before transitioning to fully permissionless." ([launch post](https://blog.ethstorage.io/ethstorage-mainnet-alpha-launch-petabyte-scale-decentralized-storage-on-ethereum/), [storage-provider guide](https://docs.ethstorage.io/storage-provider-guide))
- **[shipped]** Active development: [es-node](https://github.com/ethstorage/es-node) (812 stars, 103 forks, last push 2026-06-11, GitHub API 2026-08-07).

### Storage model
- **[shipped]** Architecture = an **L1 KV-store contract** ("programmable key-value storage powered by DA") + an off-chain network of es-nodes; writes go through the contract with data carried in **EIP-4844 blob transactions**; es-nodes persist blobs after L1 prunes them (also exposed as a "long-term DA" blob archiver for rollups). ([docs](https://docs.ethstorage.io/), [how it works](https://docs.ethstorage.io/readme/how-ethstorage-works))
- **[shipped]** Payment: a **one-time permanent storage fee in ETH, proportional to data size**, escrowed by the contract and "gradually distributed to storage providers as compensation" — endowment-style perpetual storage; if a provider drops out, remaining locked funds still incentivize any other node to pick the data up. ([EthStorage comparison article, 2025-12-16](https://ethstorage.medium.com/lens-chains-grove-vs-ethstorage-a-7-dimensional-comparison-of-decentralized-storage-solutions-b0bb9bc5ced0))
- **[intent]** Cost pitch: storage at "~0.1%" of Ethereum L1 cost; no public $/GB schedule found in docs as of this check. ([launch post](https://blog.ethstorage.io/ethstorage-mainnet-alpha-launch-petabyte-scale-decentralized-storage-on-ethereum/))

### Guarantees actually given
- **[shipped]** Proof-of-storage: es-nodes continuously random-sample their shard — "the node attempts to perform **1,048,576 disk samplings every 12 seconds**" (per L1 slot), PoW-style; qualifying samples become on-chain proofs; zk-SNARK verification on-chain (V1 trusted-setup ceremony completed late Aug 2025). ([storage-provider tutorial](https://docs.ethstorage.io/storage-provider-guide/tutorials), [annual report](https://blog.ethstorage.io/ethstorage-2025-annual-report/))
- **[shipped]** Replica-uniqueness: "each data replica must be uniquely encoded using the storage provider's Ethereum address," preventing one copy masquerading as many. **[intent]** Redundancy target from the EF-granted research framing: verify blobs are held "with the desired redundancy (e.g., **30~50 physical replicas**)" — a design target, not an observed per-object guarantee. ([EF grant post](https://ethstorage.medium.com/ethstorage-received-a-2nd-grant-from-the-ethereum-foundation-for-proof-of-storage-on-l2-dynamic-79318f513f3b))
- **[shipped]** Node economics example from the FAQ: one successful proof tx `reward=0.01013 ETH, cost=0.00084 ETH` — rewards only accrue to provers; there is **no slashing story documented**, non-provers "simply stop receiving rewards." ([storage-provider FAQ](https://docs.ethstorage.io/storage-provider-guide/storage-provider-faq))
- **[shipped]** es-node hardware floor: 4 cores/8 threads, 8 GB RAM, **≥550 GB disk per data shard** (NVMe recommended), ≥8 MB/s download. ([tutorial](https://docs.ethstorage.io/storage-provider-guide/tutorials))
- **Retrieval [shipped]:** es-node RPC endpoints (`mainnet.ethstorage.io`), the blob-archiver API, and web3:// gateways. No retrieval SLA is documented; retrieval incentives are not part of the proof system (same gap Arweave has).

## 2. web3:// stack (the read path EthStorage assumes)

- **[shipped]** **ERC-4804** ("Web3 URL to EVM Call Message Translation") is **Final** — first HTTP-style web access standard for the EVM. ([EIP-4804](https://eips.ethereum.org/EIPS/eip-4804), [finalization post](https://ethstorage.medium.com/erc-4804-the-1st-web-protocol-standard-for-eth-is-now-finalized-db258d4d9912))
- **[shipped]** **ERC-6860** is the living **Draft** revision (created 2023-09-29): corrects 4804's auto-mode return decoding (ABI-encoded bytes, not bytes32), adds formal ABNF, expands types. ([EIP-6860](https://eips.ethereum.org/EIPS/eip-6860)) **ERC-6821** maps ENS names into web3:// URLs. ([EIP-6821](https://eips.ethereum.org/EIPS/eip-6821))
- **[shipped]** Three resolve modes: **auto** (any contract), **manual**, and **resource-request ("5219 mode"**, ERC-5219 interface). ([docs.web3url.io](https://docs.web3url.io/))
- **[shipped]** Access today is mostly via **trusted HTTP gateways** — `w3link.io` (multi-chain), `w3eth.io` (mainnet) — plus self-hostable [web3url-gateway](https://github.com/ethstorage/web3url-gateway) (last push 2026-06-18), the [web3protocol-js](https://github.com/web3-protocol/web3protocol-js) native client library, and third-party browser extensions ([chrome-web3](https://github.com/ComfyGummy/chrome-web3)). **[rec]** For EFS's "anonymous reading" goal: public gateways are a trust+logging bottleneck; the meaningful property is that anyone can run `web3url-gateway` against any RPC — same shape as EFS mirrors.

## 3. GoE — EthStorage's own git offering

### What it is and what shipped
- **[shipped]** **GoE ("Git on Ethereum")** is "a decentralized Git protocol built directly on top of EthStorage," developed through 2025; standard `clone/push/pull` "while repository data, commit references, and history records are stored in an immutable on-chain environment." ([2025 annual report](https://blog.ethstorage.io/ethstorage-2025-annual-report/))
- **[shipped]** Code: [ethstorage/goe-cli](https://github.com/ethstorage/goe-cli) (TypeScript, 108 commits, **1 star / 0 forks**, last push **2026-02-05**; GitHub API 2026-08-07). npm package `goe-cli`: first published **2025-11-14**, latest **v0.2.0** (2026-02-03) (npm registry, checked 2026-08-07). Examples target **Sepolia (11155111)** + EthStorage testnet — no evidence of a mainnet GoE hub yet.
- **[shipped]** Design doc lives in a **still-open PR** ([ethstorage/ethfs-git#1](https://github.com/ethstorage/ethfs-git/pull/1/files), opened 2025-10-16, unmerged as of 2026-08-07; repo 0 stars).

### Mechanism (from README + design doc)
- **[shipped]** Three layers: a **git remote helper** for `goe://`; **per-repo smart contracts** holding refs — literally `mapping(bytes => bytes20) public refs` (branch name → commit oid); **EthStorage blobs** holding git **packfiles** as "permanent, content-addressed blobs." Push = generate delta packfile → submit via blob-carrying tx → `updateRefs()` with new oid + packfileHash. Clone = read refs + packfileHashes from contract → download packfiles from EthStorage → reconstruct locally. ([goe-cli README](https://github.com/ethstorage/goe-cli), [design doc](https://github.com/ethstorage/ethfs-git/pull/1/files))
- **[shipped]** Addressing: `goe://<repo_address>:<chain_id>`, `goe://<repo_name>:<chain_id>` (current wallet), `goe://<owner>/<repo_name>:<chain_id>`. Registry: a **DeHub contract** ("acts as the global registry," `createRepo(name, owner)` deploying EIP-1167 minimal-proxy Repo contracts, ENS-resolvable, e.g. `ethfs://dehub.eth/vitalik-blog`).
- **[shipped]** Identity/permissions: **wallet-keyed**. Owner runs `grant-push` / `revoke-push`; contract enforces writer list at tx time. **[intent]** "Multi-sig / DAO-controlled writer sets, repo ownership transfer, and organization namespaces" are Phase-4 roadmap only.
- **History rewrite:** the contract "verifies fast-forward by checking oldOid consistency" — **force-push/rebase semantics are simply not addressed** in the design doc **[shipped gap]**. Old packfiles are permanent blobs regardless, so history is append-only at the storage layer even if refs later move **[spec: a force-push policy would be a contract-level choice]**.
- **Costs:** no gas/cost analysis anywhere in README or design doc; only a `GOE_GAS_INC_PCT` knob. Every push is an L1-anchored blob tx + a contract write **[shipped]**; per-push cost therefore tracks blob-fee market **[spec]**.
- **Adoption:** effectively zero external usage signal (1 star, no forks, no registry activity found) — GoE is a first-party proof-that-EthStorage-can, not a living forge **[shipped observation]**.

## 4. git3 — the 2023 predecessor (dead)

- **[shipped, dead]** [git3protocol/git3-cli](https://github.com/git3protocol/git3-cli): "Decentralized git hosting protocol for web3," git remote helper for `git3://[wallet]@[hub|NS]:[chain_id]/<repo>`; default hub `git3.w3q` on the old Web3Q/EthStorage testnet; example hubs on Ethereum mainnet, Polygon (137), BSC (56). **Last push 2023-03-13, 6 stars** (GitHub API 2026-08-07). Listed by EthStorage as a web3:// showcase in their [2023 report](https://ethstorage.medium.com/ethstorage-2023-yearly-report-cc4e403ccfeb).
- **[shipped, caution]** The domain **git3.io / git3.sh today advertises a different product**: repos "on Irys blockchain," GitHub OAuth + Thirdweb wallets, x402 payment rails ([git3.io/docs](https://www.git3.io/docs)). Treat as a separate/pivoted project reusing the name; not EthStorage-affiliated on current evidence.
- Lesson: two consecutive "git remote helper + hub contract" attempts from the same ecosystem; the first died with its testnet (Web3Q), the second (GoE) restarts the same shape on the real mainnet stack **[rec: design for storage-layer portability, not hub-contract permanence]**.

## 5. Registry ideas in this ecosystem

- **[shipped]** GoE's **DeHub** = minimal on-chain name→repo-contract registry with events (`RepoCreated`) + ENS glue (above).
- **[shipped]** **ethfs-cli / FlatDirectory** — EthStorage's general file-tree-in-a-contract primitive used for web3:// sites; updated post-Fusaka to build blob cell proofs locally. ([annual report](https://blog.ethstorage.io/ethstorage-2025-annual-report/))
- **[intent]** Nothing resembling a package registry (versioned artifacts, yanking, provenance attestations) exists in GoE/EthStorage docs — only name→contract resolution. EFS's records/lens model is strictly richer here **[rec: don't look to GoE for registry design]**.

## 6. Alternative git-on-chain prior art

| Project | Model | Shipped state (checked 2026-08-07) | What killed / limits it |
|---|---|---|---|
| **Mango** (axic, 2016) | Per-repo Ethereum contract = repo id + access control ("allows only the owner to publish"); objects on IPFS/Swarm; `git-remote-mango`; `mango://{addr}` | PoC only; [axic/mango](https://github.com/axic/mango) 645 stars, last push 2022 (readme), dead since 2016 | Self-declared PoC; "with subsequent changes your past repositories can became unaccessible"; no collaboration layer; predates cheap DA |
| **GitTorrent** (cjb, 2015) | BitTorrent DHT distribution of git packs + Bitcoin blockchain for username registration | [cjb/GitTorrent](https://github.com/cjb/GitTorrent) 4,761 stars, last push 2020, dead since ~2017 | Solved distribution only — no issues/PRs/identity UX; single-author project, funding/attention ran out; huge star count shows demand, no sustained supply |
| **Pando** (Aragon Black, 2018-19) | "Distributed remote protocol for git based on IPFS, ethereum and aragonOS"; DAO-governed repos | [pandonetwork/pando](https://github.com/pandonetwork/pando) 181 stars, last push **2019-10-28**, dead | Died with Aragon Black's dissolution; DAO-per-repo overhead; lesson: coupling a forge to a governance platform imports that platform's mortality |
| **Radicle Ethereum era** (2021-22) | Opt-in **Orgs + anchors**: Gnosis-Safe-controlled org contracts anchoring project state hashes on Ethereum; ENS ids; RAD token | [radicle-orgs](https://github.com/radicle-dev/radicle-orgs) **archived**, last push 2022-02-09; Orgs pulled from the Upstream client for "stability problems," Upstream itself sunset July 2022 ([community thread](https://radicle.community/t/feature-update-orgs/2132)) | Team rebuilt as **Heartwood**, explicitly blockchain-free: "Radicle itself is a true peer-to-peer protocol and does not use or depend on any blockchain or cryptocurrency" ([radicle.dev/faq](https://radicle.dev/faq)). Identity moved to local-verifiable repo IDs + signed maintainer-set delegation ("all you need to know is that you have the correct Repository ID"). Also: first-gen IPFS backend abandoned as "too slow and impractical." Radicle today: ~8,000 repos, 600+ nodes weekly (Apr 2026, FAQ) — the **largest live decentralized forge, achieved by deleting the chain** |
| **Gitopia** (Cosmos, 2022-) | App-specific dPoS chain: refs + repo/user/org metadata on-chain, packfiles on storage providers, Arweave as "redundant storage layer"; LORE token | Chain alive but slow-moving: [gitopia/gitopia](https://github.com/gitopia/gitopia) 15 stars, last push 2025-09-24; mcp-server pushed 2026-04-03; own architecture docs flagged "Pending update. The architecture has changed since this article was written" ([docs](https://docs.gitopia.com/gitopia-architecture/index.html)) | Running ≠ used: negligible OSS gravity; bespoke L1 means bespoke wallets/validators/token just to host code; migration tooling repos suggest churn |
| **Protocol.Land** (Community Labs, Arweave) | Repos as permanent Arweave data, "every commit is a permanent, on-chain snapshot. Powered by Warp contracts"; bounties, Arweave dApp deploys ([docs](https://docs.protocol.land/)) | Alive-but-niche: [labscommunity/protocol-land](https://github.com/labscommunity/protocol-land) 9 stars, last push 2025-11-27; X account active through 2025 | Warp/SmartWeave stack is fading in the Arweave ecosystem (AO era); tiny adoption; but validates "pay-once permanent packfile storage" UX on Arweave — the closest live analogue to EFS's Arweave leg |

## 7. Readings for EFS (recommendations)

1. **[rec]** The GoE decomposition — **refs in a tiny contract, packfiles as content-addressed permanent blobs, remote helper as the whole client story** — is the correct minimal shape and maps 1:1 onto EFS primitives (ref updates = signed records under a lens; packfiles = Arweave/EthStorage payloads; anchor = record hash). EFS does not need GoE itself; it needs GoE's mapping with EFS's identity and policy layers substituted for "wallet == pusher."
2. **[rec]** Every dead project in §6 died at the **collaboration/identity layer, never the storage layer**. Storage-only git hosting is repeatedly rebuilt and repeatedly abandoned; issues/reviews/maintainer-set evolution is where EFS's records+KEL+lenses are differentiated.
3. **[rec]** Radicle is the strongest counter-argument to chain-anchoring — they deleted Ethereum and grew. Their FAQ's core insight (verify the repo locally from a stable ID + signed delegation chain) is exactly EFS's KEL claim; EFS's rebuttal must be concrete: global ordering for disputes, public auditability of ref history, walk-away portability of the *social* record, and anonymous read via mirrors — things Heartwood's live-node gossip does not give.
4. **[rec]** Treat EthStorage as a **candidate payload store, not a dependency**: mainnet is real but alpha, whitelist-mined, ~10-month-old, with replication targets (30–50) that are research goals, no slashing, and no retrieval SLA. Arweave-primary with EthStorage as a second mirror class fits EFS's existing storage triad; revisit when mining is permissionless.
5. **[rec]** GoE's unhandled force-push question is EFS's opportunity: because storage is append-only, "history rewrite" is purely a ref-policy decision — a lens can define fast-forward-only, review-gated, or rewind-with-attested-reason semantics, giving Wikipedia-style revert-with-audit-trail for free.
6. **[rec]** web3:// gives EFS a zero-infra anonymous read path (aligns with ADR-0056's web3:// default), but only self-hosted gateways/native clients preserve anonymity; public w3link/w3eth are conventional trusted servers.

## Sources

- https://blog.ethstorage.io/ethstorage-mainnet-alpha-launch-petabyte-scale-decentralized-storage-on-ethereum/
- https://blog.ethstorage.io/ethstorage-2025-annual-report/
- https://docs.ethstorage.io/information
- https://docs.ethstorage.io/
- https://docs.ethstorage.io/readme/how-ethstorage-works
- https://docs.ethstorage.io/storage-provider-guide
- https://docs.ethstorage.io/storage-provider-guide/tutorials
- https://docs.ethstorage.io/storage-provider-guide/storage-provider-faq
- https://ethstorage.medium.com/lens-chains-grove-vs-ethstorage-a-7-dimensional-comparison-of-decentralized-storage-solutions-b0bb9bc5ced0
- https://ethstorage.medium.com/ethstorage-received-a-2nd-grant-from-the-ethereum-foundation-for-proof-of-storage-on-l2-dynamic-79318f513f3b
- https://ethstorage.medium.com/erc-4804-the-1st-web-protocol-standard-for-eth-is-now-finalized-db258d4d9912
- https://ethstorage.medium.com/ethstorage-2023-yearly-report-cc4e403ccfeb
- https://github.com/ethstorage/es-node
- https://github.com/ethstorage/web3url-gateway
- https://github.com/ethstorage/goe-cli
- https://github.com/ethstorage/ethfs-git/pull/1/files
- https://www.npmjs.com/package/goe-cli (via registry.npmjs.org)
- https://eips.ethereum.org/EIPS/eip-4804
- https://eips.ethereum.org/EIPS/eip-6860
- https://eips.ethereum.org/EIPS/eip-6821
- https://docs.web3url.io/
- https://github.com/web3-protocol/web3protocol-js
- https://github.com/ComfyGummy/chrome-web3
- https://github.com/git3protocol/git3-cli
- https://www.git3.io/docs
- https://github.com/axic/mango
- https://github.com/cjb/GitTorrent
- https://github.com/pandonetwork/pando
- https://github.com/radicle-dev/radicle-orgs
- https://radicle.community/t/feature-update-orgs/2132
- https://radicle.dev/faq
- https://gitopia.com/ and https://docs.gitopia.com/gitopia-architecture/index.html
- https://github.com/gitopia/gitopia
- https://docs.protocol.land/
- https://github.com/labscommunity/protocol-land
- GitHub REST API repo metadata queries, 2026-08-07 (pushed_at / stars / archived flags cited inline)
