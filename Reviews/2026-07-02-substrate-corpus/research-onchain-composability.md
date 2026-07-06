# On-chain composability: how much does EFS actually need?

**Research agent:** onchain-composability (EFS substrate investigation)
**Date:** 2026-07-02. Web evidence gathered July 2026; note per-source staleness flags inline.
**Question:** Is on-chain-native data (contracts able to read EFS state via SLOAD/CALL) a hard requirement, a nice-to-have, or app-specific — and could "portable signed records + one home registry" still serve on-chain readers via storage proofs / coprocessors / light clients?

---

## 0. Executive verdict (details argued below)

1. **On-chain composability is real but narrow.** Production contracts read *foreign* on-chain data constantly — but almost exclusively (a) financial state (prices, balances, volumes), (b) small structured facts (ownership, scores, attestation existence), (c) commitments (hashes). Contracts essentially never read *content bytes*; humans do, via `eth_call`/indexers. The permanence motive for on-chain bytes and the composability motive are different motives and should not be conflated.
2. **Of the ten EFS apps, only two have a credible contract-reader story**: NFT/token metadata (on-chain SVG composition, Loot-style derivative reads) and dapp structured records (escrow/royalty/gating logic over records). Both need **synchronous, same-chain, point-lookup** reads. The other eight need zero contract readers.
3. **Cross-chain trust-minimized reads exist and work but are asynchronous, per-query priced ($1–$25 + 250–420k verify gas), minutes-latency, per-chain-pair infrastructural, and vendor-mortal.** The flagship coprocessor (Axiom) shut down its product within ~18 months of mainnet. This confirms the deterministic-ids design's rejection of proof-based replication (model B) as a century-scale dependency-rot surface — and it equally disqualifies "one home registry + proofs" as the *composability* story.
4. **The inversion that matters for the substrate verdict:** composability does not *force* on-chain-native writes — but EFS's current design gets composability nearly free (`getObject` is a ~5k-gas synchronous read; EAS-attestation-gating is a proven production pattern on Base). A portable-records/off-chain-bucket substrate must buy composability back at coprocessor prices, or give it up. So part (d) of the five hard parts should be scored as: **not the deciding factor by itself, but a strong tiebreaker toward substrates where the home registry is natively contract-readable, and a hard veto only for app categories EFS may choose not to serve.**
5. **Replication is EFS's composability mechanism, not proofs.** Chain-free deterministic IDs mean the trust-minimized way for a contract on chain X to read EFS state is for the records to *be replayed onto chain X* (models A/C). Proofs serve only the unreplicated-chain case, which EFS can treat as out of scope.

---

## 1. Taxonomy: what "a contract reads data" actually means

Four reader classes, constantly conflated in discourse:

| Class | Reader | Mechanism | Latency | Example |
|---|---|---|---|---|
| **R1** | Another contract, same chain | `STATICCALL`/`SLOAD`, synchronous, atomic within the tx | 0 (same tx) | Aave reading a Chainlink feed |
| **R2** | Off-chain client/indexer | `eth_call` against a node | ~0, off-chain | OpenSea calling `tokenURI()` |
| **R3** | Contract on a *different* chain | proof-mediated: storage proof, ZK coprocessor, light client, or native accumulator | minutes–hours, async request/callback | Snapshot X verifying L1 STRK balances on Starknet |
| **R4** | Indexer via events/logs | log subscription | seconds | any subgraph |

Two load-bearing observations:

- **Most celebrated "on-chain data" patterns are R2, not R1.** `tokenURI`, ENS record resolution, governance document lookups — the consumer is a browser, wallet, or marketplace backend making an `eth_call`. The data is on-chain for *permanence, neutrality, and verifiability*, not because another contract composes on it. EFS's verify-don't-trust reads are R2; they need the data on *some* chain the client can verify against, not on the reader's chain.
- **R1 is synchronous or it is nothing.** The DeFi-legos property — flash loan → swap → repay atomically — exists only for same-chain state. Every R3 mechanism below is request/prove/callback-shaped. There is no such thing as cross-chain synchronous composability; a design that gives up native R1 gives it up entirely, not partially.

---

## 2. Catalog: real patterns where contracts read foreign data today

### 2.1 Oracles — the R1 paradigm case
DeFi reads Chainlink/Pyth/TWAP oracles synchronously in the money path; billions of dollars key on `latestRoundData()`. This is the strongest existence proof of R1 demand — and it is entirely about *financial state freshness*, the opposite pole from archival file content. **Would it read an on-chain filesystem? No.** Nothing feed-shaped lives in EFS.

### 2.2 NFT tokenURI and on-chain art — mixed R2/R1, and the best EFS case
- **Nouns** stores compressed SVG parts on-chain and composes `tokenURI` on demand in a descriptor contract; the art pipeline (palettes, RLE-encoded parts) lives in contract storage — the same SSTORE2-chunk pattern as EFS's chunk store ([nouns.center protocol docs](https://nouns.center/dev/nouns-protocol), [Etherscan descriptor](https://etherscan.io/address/0x0cfdb3ba1694c2bb2cfacb0339ad7b1ae5932b63)). Uniswap V3's NFTDescriptor renders position NFTs from live pool state. Art Blocks stores generative scripts on-chain.
- **Loot** is the canonical *contract-to-contract* (R1) case: derivative contracts call `getWeapon(tokenId)` etc. on the original Loot contract to mint dependent assets; an entire derivative ecosystem (Crypts and Caverns, Loot Characters, hierarchical holder-gated drops) composed on those on-chain getters ([naavik deep dive](https://naavik.co/deep-dives/loot-deconstruction-pro/), [dappradar guide](https://dappradar.com/blog/the-ultimate-guide-to-loot-nfts)).
- Nuance: `tokenURI` itself is consumed by *off-chain* marketplaces (R2). The R1 slice is derivative/composition contracts reading attributes and bytes. Both slices require the bytes **on the NFT's own chain** — an NFT contract cannot render from data on another chain.
- **Would it read an on-chain filesystem? Yes — this is the single most plausible EFS contract-reader**: a mint contract whose `tokenURI` assembles from EFS-stored chunks/properties, or derivative contracts reading EFS properties of a parent object. EFS's SSTORE2 chunk store + `getObject` point lookup serves exactly this shape.

### 2.3 ENS resolvers — R2 dominant, and a 2026 strategic reversal worth copying
- Resolution overwhelmingly happens in clients (R2). Contracts resolving names on-chain exist but are rare. With **ERC-3668 CCIP-Read** ([EIP](https://eips.ethereum.org/EIPS/eip-3668)), even client resolution is off-chain-served with on-chain-defined verification; Coinbase issues free offchain **cb.id** subnames at massive scale this way, and ENS "processes millions of name lookups per year through this pattern as of Q1 2026" ([ENS docs](https://docs.ens.domains/resolvers/ccip-read/), [ENS DAO basics](https://basics.ensdao.org/ccip-read)). Documented adoption pain: apps that hadn't implemented CCIP-Read/wildcard resolution silently failed to resolve these names ([showmehow.eth writeup](https://showmehow.eth.limo/dns-offchain-subname-issuance-coinbase-wallet-cbid/)) — a caution about how leaky "transparent off-chain indirection" is in practice.
- **Trustless L2 resolution exists in production**: Unruggable Gateways verify L2 storage proofs against L1-posted state roots inside CCIP-Read callbacks, so the gateway is untrusted ([ENS docs](https://docs.ens.domains/ccip), [unruggable demos](https://github.com/unruggable-labs/unruggable-gateways-ens-resolution-demos)); Unruggable is a funded ENS DAO service provider ([SPP2 application](https://discuss.ens.domains/t/spp2-unruggable-application/20485)).
- **The reversal (primary, Feb 6 2026):** ENS Labs **scrapped Namechain (its own L2) and deployed ENSv2 fully on Ethereum mainnet**. Nick Johnson: "a 99% reduction in ENS registration gas costs over the past year" after L1 gas limit went 30M→60M in 2025; "when we compare this to the complexity and operational overhead of running our own L2, the calculus has fundamentally shifted" ([The Block](https://www.theblock.co/post/388932/ens-labs-scraps-namechain-l2-shifts-ensv2-fully-ethereum-mainnet)). The most sophisticated cross-chain-read team in the ecosystem, with working storage-proof infrastructure, chose *native single-chain state* the moment it became affordable. Cross-chain machinery is a cost you pay reluctantly, not an architecture you prefer.
- **Would ENS-like resolvers read an on-chain filesystem?** Text records pointing at `web3://` EFS paths, yes — but the reader is R2 (wallets/browsers). No contract-reader requirement.

### 2.4 Governance documents / constitutions — the commitment pattern
Arbitrum's constitution lives on-chain **as a keccak256 hash only** (`ArbitrumDAOConstitution.setConstitutionHash`, updatable solely by governance; proposals must carry the full text whose hash must match) ([Arbitrum governance docs](https://github.com/ArbitrumFoundation/governance/blob/main/docs/overview.md), [contract](https://arbiscan.io/address/0x1D62fFeB72e4c360CcBbacf7c965153b00260417)). OpenZeppelin Governor stores only `descriptionHash`. **Lesson: when the enforcement point is human/social, contracts need a 32-byte commitment, never the bytes.** EFS is an excellent *home* for the full text (permanent, hash-verifiable, hyperlinkable) with zero contract-read requirement — the DAO's contract stores the hash; EFS serves the document to humans.

### 2.5 Registries and introspection — R1 at low frequency
`decimals()`/`symbol()` read at integration time; ERC-165 probes; ERC-6551 token-bound-account derivation from NFT ownership; EAS's own SchemaRegistry. Point lookups, low frequency, same chain. EFS's registry (`getObject`) is exactly this shape.

### 2.6 Attestation-gated access — production R1 *on EFS's own substrate*
- **Coinbase Verifications** (Base): Coinbase-signed EAS attestations (KYC, country) with an indexer contract and an abstract `AttestationAccessControl` for gating contract functions on attestations; production, with third-party consumers like Verified Pools gating LP participation ([github.com/coinbase/verifications](https://github.com/coinbase/verifications), [Verified Pools docs](https://docs.verifiedpools.com/developers/verifications)).
- **Human/Gitcoin Passport onchain**: EAS/Verax attestations of stamps + score, with a **Decoder** contract so integrators call `getScore(address)` on-chain and gate on a threshold ([Passport smart-contract docs](https://docs.passport.human.tech/building-with-passport/stamps/smart-contracts/contract-reference), [eas-proxy docs](https://github.com/passportxyz/eas-proxy/blob/main/docs/00-onchain-data.md)).
- **Significance for EFS:** contracts reading EAS attestations synchronously is a *proven, shipping pattern*. EFS-on-EAS inherits it: any contract can already gate on "does attestation X exist / what does the EFS registry say at id Y." This is the composability EFS forfeits if records move off-chain.

### 2.7 Tokengating — R1 for mints, R2 for everything else
On-chain gates (mint allowlists, holder-only functions) read `balanceOf`/Merkle roots synchronously; note that allowlists are usually **Merkle-root commitments to off-chain lists** — another instance of contracts preferring commitments over readable state when the full data isn't needed on-chain. Discord/social gating (Collab.Land etc.) is R2. An EFS edge case exists ("gate on membership in curated LIST L" / "user has PIN'd X"): nice-to-have, natively cheap under the v2 registry, impossible-or-expensive under off-chain records.

### 2.8 Hooks — R1 sync + R3 async in one system
Uniswap v4 / PancakeSwap Infinity hooks read pool state synchronously; PancakeSwap's zkVIP hooks consume **Brevis** proofs of 30-day trading volume to grant fee discounts — 20.6M proofs generated, sub-transaction proving for trader eligibility ([Brevis blog](https://blog.brevis.network/2025/05/12/hook-into-the-future-intelligent-ux-on-pancakeswap-infinity-powered-by-brevis/), [Brevis research report](https://medium.com/@0xjacobzhao/brevis-research-report-the-infinite-verifiable-computing-layer-of-zkvm-and-zk-data-coprocessor-3761f902ecd7)). Note what the proof is *of*: an aggregate over the chain's own history (too gas-expensive to recompute), not foreign content. Coprocessors in production are a **compression tool for a chain's own data**, more than a cross-chain read tool.

### 2.9 Story Protocol — on-chain graph composability demand, and its price
Story launched (mainnet Feb 2025) as a **dedicated L1** whose royalty module enforces revenue flows across an on-chain IP derivative graph. Crucially, EVM-level graph traversal was deemed infeasible: Story ships an **`ipgraph` precompile** so royalty/graph traversals run as native code "at marginal costs within seconds" ([Story precompile docs](https://docs.story.foundation/network/node-architecture/precompile), [OAK Research](https://oakresearch.io/en/reports/protocols/story-protocol-ip-comprehensive-presentation-blockchain-intellectual-property)). Two lessons: (1) real demand exists for contracts enforcing value flows over a *graph database* — the one EFS app category where R1 is existential; (2) plain-EVM graph *traversal* is expensive enough that the only team that needed it built a chain with a precompile. EFS's on-chain read surface should stay point-lookup-shaped (`getObject`, active-edge slots), never traversal-shaped.

### 2.10 Farcaster — the negative existence proof for social
Identity on-chain (OP mainnet Id/Key registries), all content (casts, follows, reactions) off-chain in Snapchain, explicitly "because it would be prohibitively expensive and slow" on-chain — and because **no contract ever needs to read a cast** ([Farcaster architecture docs](https://docs.farcaster.xyz/learn/architecture/overview)). On-chain actions are reserved for "security and consistency critical" state: account creation, storage rent, key grants. Social feeds/comments have zero R1 demand in the wild.

### 2.11 Pattern extraction

Contracts read foreign data when **all three** hold:
1. **Value enforcement depends on it** (price → liquidation, attestation → access, volume → fee tier, graph edge → royalty, ownership → derivative mint);
2. **The read is a point lookup or pre-aggregated small fact** (never a scan, never content bytes; Story needed a precompile the moment traversal entered the money path);
3. **It is synchronous and same-chain**, or the app redesigns around async proofs (Brevis-style, tolerating minutes and per-proof fees only where a fee discount is worth dollars).

Content bytes are read by humans (R2). Contracts read **commitments and coordinates** — which is why the commitment pattern (hash on-chain, bytes wherever) dominates every content-adjacent category (governance docs, allowlists, Governor descriptions).

---

## 3. Trust-minimized foreign-chain reads: 2026 landscape, costs, maturity

### 3.1 Mechanism taxonomy

| Mechanism | Trust base | Shape | Sync? |
|---|---|---|---|
| Storage proofs (MPT Merkle proofs vs a known state root) | the reader chain's access to the origin chain's block hash/state root (canonical bridge, accumulator, or light client) | prove one slot/account at one block | No — request/verify |
| ZK coprocessor (Axiom†, Brevis, Lagrange) | SNARK verifier + data-commitment chain | arbitrary computation over historical chain data, proof verified on-chain, result delivered via callback | No — minutes |
| ZK light client (SP1 Helios, Telepathy lineage) | origin chain's consensus (sync committee) proven in a zkVM | header/state-root relay; storage proofs ride on top | No — per-update relay |
| Native accumulators (EIP-4788 beacon root; EIP-2935 historical hashes; L1→L2 canonical bridges) | protocol itself | roots available in EVM; apps still verify Merkle proofs against them | Proof verification is sync once data is in calldata |
| Proposed precompiles: **L1SLOAD (RIP-7728)** — L2 contracts read L1 slots directly; **RIP-7755** cross-L2 calls | sequencer imports L1 state (delay ~minutes for finality) | direct read, near-sync from L2 to its L1 | Closest thing to sync R3; still proposal-stage, per-L2 adoption ([RIP-7728 thread](https://ethereum-magicians.org/t/rip-7728-l1sload-precompile/20388), [RIP-7755 thread](https://ethereum-magicians.org/t/rip-7755-contract-standard-for-cross-l2-calls-facilitation/20776)) |
| CCIP-Read (ERC-3668) | whatever verification the contract's callback implements (storage proofs → trustless; signatures → trust-the-signer) | off-chain fetch, on-chain-defined verification, for R2 readers | R2 only — contracts can't CCIP-Read mid-transaction |

### 3.2 Player status (July 2026)

- **Axiom — coprocessor DEAD.** Trail of Bits (May 2025, primary): "Axiom has shut down the ZK coprocessor product that the ZK circuits were originally intended for"; the circuits were repurposed into **OpenVM**, and axiom.xyz now sells OpenVM + a proving API ([Trail of Bits](https://blog.trailofbits.com/2025/05/30/a-deep-dive-into-axioms-halo2-circuits/), [axiom.xyz](https://www.axiom.xyz/)). When live, V2 mainnet pricing was **0.003 ETH fixed fee + `proofVerificationGas` = 420,000 gas + callback gas** per query ([Axiom V2 docs](https://docs.axiom.xyz/docs/developer-resources/gas-pricing-limits)) — order $15–$40/query at 2024–25 prices. Mainnet Jan 2024 → shut down within ~18 months. *This was the best-funded, best-credentialed team in the category.* (Staleness note: commentary like the [degen0x April 2026 guide](https://degen0x.com/learn/zk-coprocessors-verifiable-compute-guide-2026/) still lists Axiom as a production coprocessor at "$5–$50 per query" — secondary sources lag reality in this space by a year-plus; weight primary sources.)
- **Brevis — most production traction.** 20.6M proofs for PancakeSwap zkVIP; PancakeSwap Infinity hook integrations; Pico zkVM ("Pico Prism" proved 99.6% of a 45M-gas Ethereum block, avg proof time 6.9s on GPU clusters); ProverNet decentralized proving marketplace whitepaper; token launched ([coprocessor docs](https://coprocessor-docs.brevis.network/), [Brevis blog](https://blog.brevis.network/2025/05/12/hook-into-the-future-intelligent-ux-on-pancakeswap-infinity-powered-by-brevis/), [WuBlockchain interview](https://wublockchain.medium.com/is-zk-dead-or-will-it-save-ethereum-brevis-founder-michael-on-zks-future-d6f832440d3d)). Public per-query pricing: not published; commentary puts coprocessor queries at $1–$50 depending on complexity. Also offers an optimistic "coChain" mode (cheaper, fraud-window trust model).
- **Herodotus — most mature storage-proof service.** Historical block-hash accumulator (STARK-proven MMR) back to genesis; origin chains Ethereum/Starknet/OP/Base/ApeChain, destinations incl. Starknet, Arbitrum, Base, World Chain; managed REST API with "cost mutualization"; production use: **Snapshot X ran Starknet's first mainnet governance vote (Sep 2024) with L1 STRK voting power verified by storage proof** ([herodotus.cloud learn](https://www.herodotus.cloud/en/learn/ethereum-storage-proofs), [Snapshot X case](https://www.herodotus.cloud/en/learn/snapshot-x-storage-proofs), [StarkWare blog](https://starkware.co/blog/proving-ethereums-state-on-starknet-with-herodotus/)). Pricing not public (API-key/quote model — itself a signal: these are B2B services, not neutral infrastructure).
- **Lagrange — alive, focus drifted.** ZK coprocessor with a "Verifiable Database" + ZK Prover Network on EigenLayer (85+ operators), but 2025–26 energy visibly moved to **DeepProve (zkML)** and rollup proving; Feb 2026 Intel AI partnership ([lagrange.dev](https://lagrange.dev/), [docs](https://docs.lagrange.dev/introduction)). Coprocessor pricing not public.
- **Relic Protocol — alive, small.** Storage/log/transaction-inclusion proofs on mainnet + zkSync; no visible production anchor tenant ([docs.relicprotocol.com](https://docs.relicprotocol.com/overview/intro-to-relic-protocol/)).
- **Space and Time — verifiable SQL** ("Proof of SQL"), oracle/RWA-flavored; alive, marketing-heavy ([spaceandtime.io comparison post](https://www.spaceandtime.io/blog/best-zk-coprocessors-and-verifiable-compute-layers) — vendor commentary, treat accordingly).
- **SP1 Helios (Succinct) — ZK light client**, proves Ethereum sync-committee consensus inside SP1; verified on destination chains for ~300k gas per update; maintained fork by Across for production bridging ([succinctlabs/sp1-helios](https://github.com/succinctlabs/sp1-helios), [OpenZeppelin audit](https://www.openzeppelin.com/news/sp1-helios-audit)). Sync-committee trust caveat: 512-validator committee, not full consensus.
- **Unruggable Gateways — production ENS L2 resolution** via storage proofs inside CCIP-Read (§2.3). The one storage-proof deployment ordinary users touch daily without knowing it.
- **Native accumulators in production:** **EIP-4788** beacon root exposed in EVM; adoption is real but *extraordinarily concentrated*: an on-chain study found **7,800 of 7,802 addresses ever calling the beacon-roots contract were EigenLayer-related** (EigenPod withdrawal-credential proofs) ([EIP-4788](https://eips.ethereum.org/EIPS/eip-4788), [EigenPod docs](https://github.com/Layr-Labs/eigenlayer-contracts/blob/dev/docs/core/EigenPod.md), [HackMD ePBS analysis](https://hackmd.io/@bchain/r1X_MVu5bg)). Merkle-proof-grade on-chain reading is used where tens of billions of restaked dollars justify the engineering — and near-nowhere else. **EIP-2935** (historical block hashes, Pectra 2025) similar story. **L1SLOAD (RIP-7728)**: still proposal/devnet stage (Scroll champion, Devcon SEA talk); would make L2→its-own-L1 reads near-native, but is per-L2 opt-in and reads only *the settlement L1*, not arbitrary chains.

### 3.3 Cost/latency reality table (per read, order-of-magnitude)

| Path | $ cost | Gas on reader chain | Latency | Trust adds |
|---|---|---|---|---|
| Native same-chain `getObject` (EFS v2 registry) | ~$0.001–0.05 (L2/L1) | ~5–10k (cold CALL+SLOAD) | 0, synchronous | none |
| L1SLOAD from an adopting L2 (future) | ~L2 gas | precompile-priced (~2 CALLs) | ~minutes of L1-finality lag | sequencer honesty on imported state |
| Storage proof vs canonical-bridge root (L1↔L2 pairs) | gateway fee | ~100–400k (MPT verify; RLP+keccak heavy) | block-root availability + proving, minutes | none beyond bridge |
| ZK coprocessor query (Axiom V2 when live; Brevis today) | $1–$50 (Axiom: 0.003 ETH fixed + gas) | ~250–420k verify + callback | minutes (Brevis avg proof 6.9s *per block* on GPU cluster; end-to-end user queries: minutes) | prover liveness; circuit correctness |
| ZK light client update (SP1 Helios) | prover cost amortized | ~300k per header update | per-update relay cadence | sync-committee assumption; relayer liveness |

Against a native read, every R3 path is **4–6 orders of magnitude more expensive and infinitely worse in latency class** (async vs sync). No mechanism restores atomic composability.

### 3.4 Could "portable records + one home registry" serve on-chain readers everywhere?

Concretely: EFS records live as signed portable artifacts; one canonical registry chain H; a contract on chain X wants to read a record. Options: (i) storage-proof H's registry on X — requires H's state roots available on X: exists only for canonical L1↔L2 pairs; arbitrary pairs need a light client (SP1 Helios class) with a funded, live relayer *per chain pair, forever*; (ii) coprocessor query — per-read $1–50, minutes, vendor-alive assumption; (iii) optimistic relay — adds fraud-window latency and watcher assumptions.

Judgment, with evidence:

- **Technically feasible today for high-value, low-frequency, latency-tolerant reads.** Snapshot X (governance voting power) and EigenPods (withdrawal proofs) are exactly that profile, and they work.
- **Not feasible as a general composability substrate.** Costs and latency exclude every casual read; no sync composability; and each mechanism imports a mortal vendor or a per-chain-pair relayer obligation. Axiom's death is the controlling precedent — and the Base Keyspace team (building precisely a "one master chain + cross-chain reads" keystore) states the structural problem plainly: cross-chain Merkle proofs are "the most fragile method: each hard fork of an L1 or L2 can change the assumptions that the Merkle proof relies on, and would require a contract upgrade with new logic to verify cross-chain state" ([Base blog: Exploring the Keystore](https://blog.base.dev/exploring-the-keystore)). Proof formats are chain-version-bound; EFS's 100-year horizon spans dozens of hard forks.
- **This independently re-validates the deterministic-ids §9 decision**: replication model B (proof-based registration) was rejected as "a century-scale dependency-rot surface" — correct, and the same reasoning applies to proof-based *reading*. The EFS-native answer is the LOCKSS one: **replicate the records onto chain X (models A/C) and reads become native SLOADs**. Deterministic chain-free IDs are exactly what makes replication substitute for proofs; a system with chain-bound IDs (like raw EAS) would have needed proofs.
- Residual role for proofs: one-off migration/bootstrap verification (e.g., proving origin-chain provenance during a replica courtesy re-attestation), where the mechanism is used once, by tooling, off the critical path — not embedded in the permanent read path.

---

## 4. Per-app verdict: does it need on-chain-native writes for composability?

Scale: **Hard requirement** (app breaks without native R1) / **Nice-to-have** (enables an enhancement) / **None** (no contract reader exists).

| App | Contract reader? | Verdict | Evidence anchor |
|---|---|---|---|
| **File browser** | none — humans via R2 verify-don't-trust reads | **None.** On-chain bytes matter for permanence/neutrality, not composability | §1, §2.3 |
| **Blog** | none | **None** | Mirror/Farcaster precedents, §2.10 |
| **Comments** | none — indexer/lens reads | **None** | §2.10 |
| **Social feed** | none — Farcaster proves the null | **None** | [Farcaster docs](https://docs.farcaster.xyz/learn/architecture/overview) |
| **Curated collections / lenses** | edge: on-chain gating "is X in list L" | **Nice-to-have.** Cheap point lookup if native; unpurchasable if not | §2.6, §2.7 |
| **Dapp structured records** | escrow/marketplace/royalty/access logic over records | **App-specific hard requirement — THE deciding category.** If EFS wants dapps whose *contracts* enforce logic over EFS records, reads must be native + synchronous point lookups. Story Protocol proves the demand class exists (and that traversal-shaped reads need more than the EVM) | §2.9, §2.6 |
| **NFT/token metadata** | tokenURI composition from stored bytes; derivative contracts reading parent attributes | **App-specific hard requirement** — the strongest concrete case; requires bytes on the NFT's chain specifically. EFS chunk store + properties serve it natively today | §2.2 (Nouns, Loot) |
| **DAO docs** | hash commitment only | **None** — Arbitrum pattern: contracts store `keccak256`, EFS hosts the bytes | §2.4 |
| **Package registry** | build tools are R2 readers; upgrade governance pins a hash | **None** (commitment pattern covers the on-chain sliver) | §2.4 analogy |
| **Web archive** | none | **None** | — |

**Score: 8 of 10 need zero on-chain composability. 2 of 10 (NFT metadata, dapp structured records) need native synchronous reads — and both are point-lookup-shaped, both same-chain, and both are served by the v2 registry design as-is.**

---

## 5. Honest bottom line for the substrate verdict

1. **On-chain-native writes are NOT justified by composability alone.** The apps that carry EFS's mission (archive, browser, blog, docs, collections) have no contract readers. If parts (a)–(c) of the five hard parts (revocation, spam, consensus) were solved off-chain tomorrow, composability would not by itself drag EFS back on-chain.
2. **But the arrow also points the other way: EFS currently owns composability for free, and off-chain substrates cannot buy it back at tolerable prices.** Contracts reading EAS attestations is a shipped production pattern (Coinbase Verifications, Passport). The v2 registry read is ~5k gas, synchronous. The alternative market (coprocessors/storage proofs) is asynchronous, $1–50/query, per-chain-pair infrastructural, hard-fork-fragile, and its flagship vendor already died. There is no middle price point.
3. **Decision rule proposed for the architects:** let (a)(b)(c) choose the substrate; use (d) as a **tiebreaker and a surface-preservation constraint**, not a driver. Concretely: whatever substrate wins, preserve a natively-readable **home registry per chain where EFS data is replicated** — `getObject(id) → (exists, firstUID)`-class point lookups plus active-edge slot reads. That single surface serves both R1 app categories. Never promise traversal-shaped on-chain reads (Story's precompile is the counterexample budget).
4. **Replication is the cross-chain composability strategy; proofs are not.** Chain-free deterministic IDs make "the record is on your chain too" the trust-minimized read path — cheaper, synchronous, fork-robust, and aligned with LOCKSS. Score this as an additional argument *for* deterministic IDs and *against* both chain-bound identity and proof-dependent designs.
5. **A watch item, not a plan item:** if L1SLOAD/RIP-7755-class precompiles standardize across L2s (2027+?), L2 contracts reading an L1 home registry near-natively would soften the replication requirement for the L2 tier specifically. Do not architect for it; it is proposal-stage and reads only the settlement L1.

---

## 6. Copy / avoid lessons for EFS

- **COPY (Arbitrum/Governor):** for every content-shaped integration, ship the commitment pattern first — contracts store a 32-byte hash/id; EFS serves bytes to humans. It covers DAO docs, package pinning, and most "on-chain data" asks at zero read-surface cost.
- **COPY (Farcaster):** put only "security and consistency critical" state where contracts can read it (identity, registry, slots); never argue content bytes onto the hot path for composability reasons — no contract reads content.
- **COPY (Nouns/Loot):** keep the SSTORE2 chunk store and `getObject` point lookups contract-callable on the data's own chain — this is the entire integration surface NFT-metadata and derivative-composition apps need, and it is EFS's most credible near-term dapp category.
- **COPY (ENS Feb 2026):** when native-chain capacity gets cheap, prefer native state over cross-chain machinery — the best-equipped cross-chain team in the ecosystem reversed into L1. Don't build EFS's read story on infrastructure ENS just walked away from.
- **COPY (Coinbase Verifications/Passport):** ship a small "EFS access-control" reference contract (gate-on-lens-scoped-claim / gate-on-list-membership) as the composability on-ramp — the pattern is proven on EAS and demonstrates (d) concretely without new machinery.
- **AVOID (Axiom's corpse, Keyspace's warning):** never place a proof vendor, circuit, or chain-version-bound Merkle format in a permanent read or replication path. Proof mechanisms are hard-fork-fragile and vendor-mortal; the 100-year read path must be state + spec only. (Re-validates deterministic-ids §9's model-B rejection independently.)
- **AVOID (Story's precompile):** don't promise on-chain graph *traversal*. The one team whose money path needed it had to build an L1 with native-code precompiles. EFS's on-chain surface stays O(1) point-lookup-shaped; traversal belongs to indexers and R2 readers.
- **AVOID (degen0x-class commentary):** in the coprocessor market, secondary sources run a year stale and list dead products as live; any future re-evaluation of this landscape must re-verify against primary sources.

## 7. Source register (primary vs commentary, staleness)

**Primary/authoritative:** Trail of Bits on Axiom shutdown (2025-05-30); Axiom V2 official docs (pricing, archived product); ENS docs + The Block on Namechain cancellation (2026-02-06); Arbitrum Foundation governance repo; coinbase/verifications GitHub; Passport smart-contract docs; Farcaster docs; Nouns protocol docs + Etherscan; Story Foundation precompile docs; EIP-3668/4788, RIP-7728/7755 texts + Ethereum Magicians threads; succinctlabs/sp1-helios + OpenZeppelin audit; Herodotus docs/learn pages; Brevis official docs/blog; Base blog (Keyspace).
**Commentary (weight low / staleness noted):** degen0x 2026 guide (lists dead Axiom as live — demonstrably stale); Medium research posts on Brevis/Story; vendor comparison posts (Space and Time blog); price-prediction/exchange content (ignored except for launch dates).
**Known gaps:** no vendor publishes clean per-query public pricing in 2026 (Axiom's 0.003 ETH + 420k gas is the only hard number, now historical); Herodotus/Brevis/Lagrange are quote-based B2B — itself evidence against treating them as neutral century-scale infrastructure. EIP-4788 usage concentration figure comes from a HackMD analysis (methodology not independently re-verified, but consistent with EigenPod being the only large 4788 consumer).
