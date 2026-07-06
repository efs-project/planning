# Farcaster Autopsy: Hybrid On-Chain Identity / Off-Chain Data — and Why the Data Layer Became a Chain

Research agent: "farcaster" | EFS substrate investigation | Written 2026-07-02
Primary sources: Farcaster protocol spec + FIP discussions (GitHub), Snapchain whitepaper/docs, Farcaster docs, contract pages, caststorage.com. Commentary sources flagged inline. Staleness notes at the end of each section where relevant.

---

## 0. Executive verdict (why this is the closest production precedent to EFS)

Farcaster ran, at production scale (peak ~70–100k DAU, hundreds of millions of messages, thousands of nodes), the exact hybrid EFS is contemplating: **a small on-chain registry layer (identity, keys, storage rights) + a bulky off-chain layer of signature-authenticated data replicated across permissionless nodes with CRDT merge semantics**. The hybrid's identity half worked and survives unchanged. The data half — gossip + delta-state CRDTs ("deltagraph") — **failed at scale on exactly EFS hard part (c): consensus on "what exists / what's current."** After trying partial-ordering fixes (FIP-193) they gave up and built **Snapchain** (mainnet April 16, 2025): a purpose-built, account-sharded, Tendermint/Malachite-BFT, non-Turing-complete chain — i.e., they re-introduced a consensus substrate for data, paying for it with a heavily permissioned validator set (as of July 2026: **6 validators run by 2 companies**, validator set kept in a GitHub TOML file).

The single most verdict-relevant fact for EFS: **Farcaster tried "signatures + replication, no chain for data," and production forced them back to a chain.** EFS already has chains as data-availability substrates; Farcaster's journey is strong evidence that the ordering/consensus service a chain provides is not an incidental cost but the load-bearing piece, and that removing it must be compensated by something equally strong.

Second most relevant: **Farcaster proves the "gasless relaying prize" in production.** Because message validity is derived from an Ed25519 signature checked against on-chain registry state — never from `msg.sender` — users pay zero gas per message; anyone can submit anyone's signed message. The entire per-message write path is signature-authenticated. This is exactly the property EFS wants from a kernel that recovers author from signature.

Third: **Farcaster's data is *not* self-contained-verifiable and *not* archival.** Message validity depends on live registry state (was this signer valid? was storage paid?), old data is pruned by design, and the team explicitly embraces ephemerality. Farcaster solves consistency and spam; it deliberately does not solve permanence, portability-after-substrate-death, or verify-without-an-indexer. EFS's mission is close to the complement of Farcaster's trade-offs.

---

## 1. The architecture journey (timeline)

| Date | Event | Source |
|---|---|---|
| Jan 2022 | Varun Srinivasan publishes "Sufficient Decentralization for Social Networks": on-chain registry + off-chain hosts; "The registry is the only part of the network that needs to be synchronized on a blockchain." | varunsrinivasan.com (primary) |
| 2022 (v2) | v1 host model replaced by **Hubs**: p2p nodes syncing a "delta graph" of anonymous Δ-state CRDTs; "two Hubs that receive a set of messages in any order will always end up in the same state." Registry contracts on **Goerli testnet** during invite-only beta. | protocol spec repo (primary) |
| Mar–Sep 2023 | FIP "Permissionless Onboarding" (#91): move registries **Goerli → OP Mainnet**; "L2 fees are consistently 10-20x cheaper than L1"; integer fids kept "because of the ease of porting them between chains." Closed Sept 2023: "we are now officially on OP Mainnet." | github.com/farcasterxyz/protocol/discussions/91 (primary) |
| Jun–Oct 2023 | FIP-6 "Flexible Storage" (#98) + FIP-12 "Pricing schedule" (#126): storage rent launches Oct 2023 ("Elephant" release) at **$7/year/unit**. | discussions/98, /126 (primary) |
| Jan 2024 | FIP-14 "Residual Storage" (#139) finalized — retrofit after first expiries showed deleting everything on rent lapse is a product disaster. | discussions/139 (primary) |
| 2024 | Airdrop-farming spam wave; Warpcast ships centralized ML spam labels (published weekly at github.com/merkle-team/labels, >400k accounts labeled). People run hubs purely for hoped-for airdrops, destabilizing gossip; Supercast founder publicly warns node operators get no airdrop. | merkle-team/labels; news coverage (mixed primary/secondary) |
| Mid 2024 | FIP "Introducing Ordering" (#193): diagnosis that sync is failing at >500M messages; explores per-account sequence numbers vs a global sequencer. No resolution — evolves into Snapchain. | discussions/193 (primary) |
| Sep 2024 | FIP "Snapchain" (#207): replace hubs/deltagraph with a purpose-built chain. Finalized (Stage 4). | discussions/207 (primary) |
| Apr 16, 2025 | Snapchain mainnet; Hubble becomes deprecated ("Snapchain is designed to be a drop-in replacement for Hubble"). | snapchain docs; BlockEden (commentary) for the date |
| May–Jun 2025 | Farcaster Pro (FIP #236): $-subscription tier via TierRegistry on **Base**; storage tracked independently. | discussions/236 (primary) |
| Jul 16, 2025 | Storage units restructured: new units are **100 casts / 200 follows / 200 reactions, 1-year**; price floats ~**$0.30/unit** (July 2026 reading). | caststorage.com (live tracker; semi-primary) |

Note the isomorphism with the EFS journey described in the mission brief — except run in the **opposite direction**. EFS: chain-native mechanisms → portable signatures (moving identity/authenticity off the substrate). Farcaster: portable signatures + gossip → consensus substrate (moving ordering back on). The two journeys meet in the middle: signature-authenticated data + *some* ordering service.

---

## 2. The identity layer (on-chain, OP Mainnet) — the part that worked

### 2.1 Contracts

All on OP Mainnet (an L2 — chosen for cost: registration went from ~$5 on L1 to <$1):

- **IdRegistry** `0x00000000fc6c5f01fc30151999387bb99a9f489b` — issues sequential integer **fids** to a **custody address**; supports transfer and a designated **recovery address** that can move the fid. Identity = integer, not address.
- **KeyRegistry** `0x00000000fc1237824fb747abde0ff18990e59b7e` — custody address registers **Ed25519 "app keys" (signers)**; apps sign messages on the user's behalf. Adding a key requires the public key + a signed request from the requesting app's fid ("requestor signature").
- **StorageRegistry** `0x00000000fcce7f938e7ae6d3c335bd6a1a7c593d` — "lets accounts rent storage by making a payment in ETH"; Chainlink oracle converts USD price to ETH; `rent(fid, units)` payable by **anyone for any fid** (apps can sponsor users); excess ETH refunded; "Rented units are valid for 1 year."
- Gateways (IdGateway/KeyGateway) + Bundler front the registries for registration flows.
- **TierRegistry** (2025, on **Base**, a different L2!) — Farcaster Pro subscriptions; "emit events that Snapchain reads and stores." Demonstrates the registry layer is multi-chain-extensible: the data layer just ingests events from more than one chain.

### 2.2 Design decisions relevant to EFS

- **Integer fids, chosen explicitly for chain portability.** From FIP #91: "Integer-based fids seem significantly better because of the ease of porting them between chains and the greater flexibility." And they exercised this: the whole registry **migrated Goerli → OP Mainnet in Aug 2023** without invalidating the concept of identity (the fid survives; the substrate moved). One real cross-chain identity migration is more evidence than any design doc.
- **Custody key ≠ signing key.** Messages are signed by delegated Ed25519 app keys, not the custody wallet. Consequences: (a) custody rotation/transfer does **not** invalidate past messages; (b) key revocation is granular per app; (c) UX: apps hold hot Ed25519 keys, wallet only touched for registry ops. This is Farcaster's answer to EFS hard part (e) — durable rotatable identity WITHOUT smart-account signatures: the *identity* is the fid (an on-chain record with rotation/recovery), while *signatures* are plain Ed25519 that verify anywhere forever. ERC-1271 never enters the picture for data authentication.
- **The catch (revocation-by-registry):** from the spec: **"When a Signer is removed for an fid from the Key registry, all messages signed by the signer in other CRDTs should be revoked."** So message validity is a function of registry state, and the registry is the mechanism for both rotation AND retroactive invalidation. A signed Farcaster message is NOT a self-contained portable artifact: to verify it you need (1) the fid→custody history, (2) the signer's validity window, (3) storage state. If OP Mainnet died with no archive, Farcaster messages would become unverifiable in exactly the way EFS's "portable chain-free authorship signatures" step is trying to prevent.
- **Recovery**: fids have a recovery address that can transfer the fid — social/custodial recovery without smart accounts. Cheap, effective, and portable (it's registry state, not wallet machinery).
- **Usernames are centralized.** Fnames live on a **centralized Fname Registry server** run by the Farcaster team ("free and controlled by farcaster"); one fname per account, one change per 28 days; the team reclaims names by "human judgment." Escape hatch: use an on-chain ENS name instead. Docs are candid: "Users who want a name that is fully under their control should use an onchain ENS name." The hybrid was never all-decentralized; naming was consciously left as a trusted service with an on-chain alternative alongside.

---

## 3. The message layer (off-chain, signed) — mechanics

From the protocol spec (primary):

- **Format**: protobuf `MessageData`; hash = **BLAKE3, 160-bit digest**; signature schemes: **Ed25519** (app keys — the normal path) or **EIP-712** (custody address — used for verifications, fname proofs).
- **Chain-agnostic domains**: timestamps are "seconds since the Farcaster epoch" (Jan 1, 2021 UTC; max 600s clock skew ahead); messages carry a `network` enum (MAINNET/TESTNET), **not a chainId**. Even the EIP-712 domain for address verification uses `name: "Farcaster Verify Ethereum Address", version: "2.0.0"` + a **salt** — a deliberately chain-unbound domain separator. Contrast with EAS offchain attestations binding chainId: Farcaster shows you can use EIP-712 without chain-binding by using a salt/name-scoped domain. (Verification *claims* internally reference a network + blockhash where relevant, i.e. chain context is data, not signature-domain.)
- **Message types**: Casts (posts), Reactions, Links (follows — the social graph), UserData (profile), Verifications (address-ownership proofs), UsernameProofs.
- **CRDT merge rules** (pre-Snapchain, largely retained as state-transition rules): last-write-wins by (timestamp, lexicographic hash); **remove-wins** on ties (CastRemove beats CastAdd; ReactionRemove beats ReactionAdd on equal timestamps). Two-phase-set flavor: an Add and its Remove conflict via matching hash.
- **Validity is registry-coupled**: "the fid must be registered in the Id registry, and signed with a valid signer present in the Key registry, and the fid must have enough storage allocated." Nodes ingest on-chain events from OP Mainnet and merge them as `OnChainEvent`s; off-chain messages that arrive before their on-chain prerequisites can't be accepted (this ordering dependency was itself listed as a sync pain point in FIP-193: "Hubs unable to accept deltas without onchain events").

**Deletion semantics worth copying exactly**: a Remove message replaces the Add but the network keeps (and continues charging storage for) the *tombstone*: "A deleted message will still count towards the account's storage limit until it expires by being pushed out by a newer message" (dTech, consistent with spec remove-wins). Deletion is real (content dropped by honest nodes) but not free — it's a state transition you pay for, not an advisory request (contrast Nostr). This is Farcaster's answer to EFS hard part (a), and it only works **because nodes share authoritative state rules + (post-2025) ordering**; you cannot "un-sign" the CastAdd, but the network's state machine makes the Remove win everywhere.

---

## 4. Storage rent — the spam/state-growth mechanism (units, pricing, prune semantics)

### 4.1 Design (FIP-6, FIP-12 — primary)

- Framing: message storage is a **common-pool resource**; free storage "incentivizes low quality, high volume content like spam and airdrop farming," creates DoS vectors, and — key insight — **unbounded state growth centralizes the node network** (only big operators can afford to keep up). Rent bounds all three at once.
- **Unit** (original): 1 unit/year = **5,000 casts + 2,500 reactions + 2,500 links + 50 UserData + 50 verifications** (+5 username proofs). ~40KB nominal, up to ~100KB–2MB adversarial. Registration requires ≥1 unit, so minimum cost-to-exist = one unit price.
- **Pricing history**: FIP-6 proposed $5/yr; launched Oct 2023 at **$7/yr**; stepped down **$7 → $5 → $3** as spam/quality stabilized ("A protocol release must specify the new storage limit and corresponding disk space requirements for hubs" — price and hub burden managed together). Post-Snapchain (July 16, 2025 restructure): units shrank to **100 casts / 200 follows / 200 reactions, 1-year validity** at ~**$0.30/unit** (caststorage.com, read July 2026); pre-restructure units were grandfathered at 2,000 casts/1,000 follows/1,000 reactions with 2-year validity. Price setting is governance-by-FIP, oracle-converted to ETH on-chain. Fees go to the protocol company, not node operators ("~$10-20k" expected initially; "prioritizing spam prevention over revenue").
- **Snapchain adds a rate limit per unit**: each unit buys both storage (~"10,000 txns" of state in whitepaper accounting) **and a write rate limit ("500 tx/hour")**. Global rate limiting was *impossible* under CRDTs (per-node limits diverged); consensus made it possible. Rent = state bound + flow bound.

### 4.2 Prune semantics (what actually happens to your data)

- **Over-limit prune**: exceed your per-type limit → "the message in the CRDT with the lowest timestamp-hash order is pruned" (oldest-first, per type). Pruning runs hourly. Under Snapchain: "a user's oldest transaction is discarded instead of preventing the newer transaction" — writes never hard-fail; old data pays the price. Deterministic prune order was essential: divergent pruning across hubs was one of the sync killers.
- **Rent lapse**: all units expired → **30-day grace period** → then nodes prune the account's messages.
- **Production lesson — FIP-14 "Residual Storage" (finalized Jan 2024)**: full deletion on lapse was a disaster in practice — "Hubs revoke all messages when an account's storage expires and passes the 30-day grace period," so returning users found empty profiles and dead social graphs, and *other* users browsing saw broken threads. Fix: expired accounts retain a residue — **50 casts, 250 links, 50 reactions, 50 UserData, 25 verifications, 5 username proofs (~60–100KB)**. Note the asymmetry: links (social graph) get the biggest residue because "An account renewing storage will find its feed empty if it has no links." Identity-ish and graph-ish data is more precious than content. Community flagged that residual accounts should arguably be read-only to avoid users unknowingly writing into a tiny quota.

### 4.3 Did rent stop spam? (production verdict)

Partially — it bounded *state growth* and priced *existence*, but did **not** produce content quality:

- FIP-12 (primary): "over 250k submissions [to the invite form] and we estimate that over 95% of these are airdrop farmers." The fee is friction, not a filter.
- 2024 airdrop-farming wave: spam flourished among paying accounts (a $7/yr cost is nothing next to expected airdrop value). Warpcast responded with **centralized ML spam labeling** — weekly-published labels for >400k fids (github.com/merkle-team/labels), based on "historical activity, social graph, message content and the moderation actions that other users have taken." So the production stack is: **rent bounds resources; reputation/labeling handles content spam; the labeling is centralized.** BlockEden (commentary, Oct 2025) claims bot activity persisted "despite $5-7 signup fees."
- Corollary Farcaster explicitly leaned on (from the 2022 "sufficient decentralization" essay): spam *filtering* is an app-layer concern, like email spam filters — the protocol only guarantees resource bounds and identity continuity.

---

## 5. Why hubs (deltagraph) died — stated reasons, primary sources

From FIP-193 ("Introducing Ordering"), FIP-207 ("Snapchain"), and the Snapchain whitepaper — this is the section EFS should read twice, because it is a production post-mortem of "replicated signed data without a consensus substrate":

1. **No sync anchor / no source of truth.** "There is no source of truth to sync from" — with eventual consistency, any node may gain or lose messages at any time, so two nodes can only reconcile by comparing full state. "With over 500M messages, traversing the bag to find missing messages within a sync window is becoming difficult" (FIP-193). With ~4,000 nodes and 150M+ messages, detecting whether nodes were even in sync became "impossible" (FIP-207).
2. **Bidirectional, pairwise sync.** A node can be simultaneously *ahead* for some accounts and *behind* for others, so sync must run both directions with merkle-trie diffing — expensive and fragile.
3. **Pruning churns old state.** "Older state is constantly being modified by newer messages so it's hard to be efficient about comparing message ids" — prune/expiry/revocation means historical prefixes never stabilize, defeating snapshot/append-only sync optimizations. (Direct EFS relevance: revocation + rent semantics are precisely what makes replicated state non-append-only.)
4. **Rate limits can't be global under CRDTs.** Per-node limits diverge: a message passes on hub A, fails on hub B → permanent inconsistency. Spam control and eventual consistency were structurally at odds.
5. **On-chain event coupling.** Hubs couldn't accept deltas until they'd seen the prerequisite OP Mainnet events; nodes at different chain heads rejected each other's valid messages.
6. **Gossip was unreliable at scale.** "Messages could take hours or days to propagate between hubs" (FIP-193); "As the network grew to thousands of nodes, some of them get out of sync due to gossip failures" (whitepaper). Worse, the node population was distorted: **airdrop farmers ran hubs at scale** (guides on "nodes for airdrop farmers" circulated; Supercast's founder publicly stated operators would get no airdrop and called farming hubs harmful). Unincentivized-but-speculated-upon node networks grow adversarially: more nodes made the network *less* healthy.
7. **Whitepaper summary**: "Without strict ordering, it's hard to guarantee both real-time delivery and strong consistency."

**The intermediate options were seriously explored and rejected** (FIP-193 → FIP-207): per-signer/per-account sequence-number chains (partial ordering) would give O(N+M) sync and shardability but "retained sync problems without ordering guarantees," pushed nonce management onto clients, and forced an irreversible data-format change that still didn't fix global rate limiting; a single global sequencer fixed everything but is a single point of failure. Snapchain is the "global ordering, but BFT-replicated sequencer" endpoint of that spectrum.

---

## 6. Snapchain — what they built instead (primary: FIP-207 + whitepaper + repo/docs)

- **It's a chain, but a weird one**: non-Turing-complete (transaction types = the old message types), no per-transaction gas (costs paid via rent on the external chain), and **account-independent state**: "Transactions made by one account cannot affect the state of another account," which makes account-sharding "trivial to implement."
- **Consensus**: Tendermint-style BFT (implemented with Malachite, Rust); "at least two-thirds of other validators must sign off"; tolerates <1/3 malicious; single-slot finality (~sub-second; BlockEden cites 780ms at 100 validators from benchmarks — commentary). Leader rotation is deterministic and published in epoch blocks.
- **Sharding**: N shard chains (accounts assigned by deterministic function on fid) + 1 aggregator chain committing shard roots into a global state root. Launched with **2 message shards + 1 block shard**. "A shard chain must have at least four validators." Erasure coding spreads account state across validators of other shards. Known weakness acknowledged in the FIP thread: a fully-halted shard halts the chain.
- **The CRDT rules didn't disappear — the *sync mechanism* did.** Add/remove/prune conflict rules survive as ordered state-transition rules ("a new transaction... may be added to the state or it may replace a previous transaction or it may delete a previous transaction entirely"). What consensus bought: total order → global rate limits, deterministic pruning, and **sync = fetch missing blocks** instead of merkle-diffing a churning bag.
- **Pruning is aggressive and explicit**: "After a week, non-epoch blocks can be pruned by nodes to free up disk space." Daily snapshots (tamper-evident via block signatures) bootstrap new nodes. History is NOT the point: "older posts are rarely revisited and most users are comfortable with the ephemeral behavior"; permanence is the user's problem ("pay for additional storage units or archive data elsewhere"). **Snapchain is a data-freshness machine, not an archive.**
- **Decentralization model — the price paid**: FIP-207 proposed 11 validators selected by ~15 community voters via "rough consensus," validators vetted for competence; governance can replace bad validators. Explicitly: "If all the validators and voters collude, it may be possible to censor," defended as impractical ("censorship will be challenging with as few as ten globally distributed validators") and as the pragmatic trade ("most of these designs come with great cost to system complexity or user experience"). Community pushback in the FIP thread targeted the **validator set living in a GitHub repo** rather than on-chain.
- **Production reality (snapchain.farcaster.xyz/validators, read July 2026)**: **6 validators total — Neynar runs 5, Uno runs 1.** Validator set history is a `validators.toml` in the GitHub repo. Whatever the whitepaper aspiration, today this is a two-organization permissioned database with BFT replication and open read access.
- **Node economics**: target "operable for under $1,000/month"; requirements 16GB RAM / 4+ cores / 1.5TB / public IP; ≥10,000 TPS design target ("greater than 9000 TPS" for 2M DAU in the whitepaper). Read nodes are permissionless; validation is not.
- **Migration**: Snapchain was a "drop-in replacement for Hubble" (same APIs, hub-nodejs ≥0.13.0, new ports, 2 shards 1-indexed, HubEvent ids lost their timestamp semantics). Hubble deprecated after April 16, 2025 mainnet.

Data staleness note: validator count/composition and storage price are live values read 2026-07-02; docs.farcaster.xyz pages lag (some still describe hubs and $7 pricing).

---

## 7. The hybrid split in production: observed costs and benefits

**Benefits observed:**
1. **Per-message writes cost users nothing and touch no wallet.** Ed25519 app-key signing → users never sign per-cast, never pay per-cast gas. On-chain interaction is limited to a handful of lifecycle events (register, add key, rent storage — and apps/gateways can sponsor all of them). This validated the "author-from-signature ⇒ free relaying" design at scale.
2. **Identity outlived two data-layer architectures and one chain migration.** Fids issued on Goerli survived the move to OP Mainnet (2023) and the hubs→Snapchain replacement (2025) untouched. Small, slowly-changing, on-chain identity state is durable and portable in a way data state is not. TierRegistry on Base shows the registry layer can even span multiple chains feeding one data layer.
3. **Rent bounded state and node cost.** Hub/node requirements stayed in the "enthusiast-server" class (~1.5TB) rather than growing unboundedly; the FIP process explicitly co-managed unit price ↔ disk burden.
4. **Granular key revocation without message re-signing**: rotate apps freely; custody transfer doesn't invalidate history (only explicit signer removal does).
5. **Total revenue is real but small**: cumulative storage/registration revenue ~$2.34M through Sep 2025 (BlockEden, commentary — treat as order-of-magnitude). Rent can fund infrastructure-scale costs, not a business.

**Costs observed:**
1. **Consistency debt came due.** The off-chain half required ~3 years and a full re-architecture to reach "a node can know it has the current state." Every mechanism EFS also wants — revocation, expiry-pruning, rate limits, on-chain-coupled validity — was a *cause* of the deltagraph's failure, because each one makes replicated state non-monotonic.
2. **Verifiability is indexer-shaped, not artifact-shaped.** A message alone proves nothing; you need registry state (fid, signer window, storage) and, post-Snapchain, you trust 6 validators' signed blocks or run a node. There is no "verify path→file→bytes from the artifact" property. Reads are trust-the-node (typically Neynar's hosted APIs — the same company running 5 of 6 validators).
3. **Two trust domains to operate**: nodes must run a synchronized OP Mainnet (+Base) event indexer forever; on-chain event ordering/availability bugs were a recurring hub pain point.
4. **The permissionless node network was a mirage.** ~1,050+ hubs existed on paper; the team "runs the majority" (BlockEden, commentary), many others were airdrop farmers actively harming gossip, and node count collapsed to relevance-zero post-Snapchain (validators: 2 orgs). Nobody had an incentive to run honest infrastructure, and hoped-for token incentives attracted the wrong operators.
5. **Naming centralized in practice** (fname server, team reclamation policy) — the only fully user-controlled names are ENS, i.e. outsourced to another on-chain registry.
6. **Ephemerality is load-bearing.** Rent + prune + one-week block retention means the system cannot serve as a record of anything. Fine for social; disqualifying for an archive.

---

## 8. Mapping onto the five EFS hard parts

**(a) Revocation/mutability without a consensus substrate** — Farcaster's answer: *you need a consensus substrate.* Under CRDTs, deletes/prunes/revocations were precisely what broke sync; ordered consensus made them clean. Deletes are honored because the shared state machine says remove-wins and honest nodes apply it; the tombstone still occupies paid storage until displaced. Registry-driven revocation (remove signer → revoke its messages) gives strong retroactive invalidation at the price of non-portable validity.

**(b) Spam/sybil without gas-as-write-cost** — rent (state bound) + per-unit rate limits (flow bound, only possible post-ordering) + centralized ML labels (content quality). Rent alone demonstrably insufficient against airdrop-incentivized spam; it succeeded as a *resource* bound and failed as a *quality* filter. Also: minimum-cost-to-exist (1 unit to register) is the actual sybil throttle, and it's ~$0.30 now.

**(c) Consensus on what exists / what's current** — the central lesson. Gossip+CRDT gave neither real-time delivery nor strong consistency at thousands of nodes / 10⁸–10⁹ messages with non-monotonic state. They tried partial ordering (rejected), then built a BFT chain. EFS's plan (chains as DA/ordering substrates) already has what Farcaster had to construct; the EFS-specific question is only how to keep that dependency *replaceable*.

**(d) On-chain composability** — Farcaster chose to have **none** (contracts cannot read casts/follows; the flow is strictly chain→data-layer) and the product survived fine — evidence that a social/graph product needs little contract-readable state. But note their on-chain surface (fid ownership, keys, storage balance, Pro tier) is exactly the part *other* contracts do compose with (e.g., contracts gating on fid ownership). Pattern: keep the composable kernel on-chain, keep the bulk off.

**(e) Signature portability vs identity durability** — Farcaster's synthesis is the most instructive artifact for EFS: **identity = registry-anchored integer (rotatable, recoverable, chain-portable-by-migration); signatures = plain Ed25519 (verify anywhere forever); the two are joined by time-windowed key-validity records.** No ERC-1271, no smart accounts, and custody rotation doesn't touch data. The unresolved residue: verifying a signature's *authorization* requires the registry's history, so authenticity is only as portable as (archived) registry state. If EFS wants authorship to survive origin-chain death, it must make the key-validity window itself a portable, replicable artifact — Farcaster did not.

---

## 9. COPY / AVOID for EFS

**COPY:**
1. **Author-from-signature everywhere; msg.sender nowhere in the data path.** Production-proven gasless UX; relayers/apps submit freely; sponsorship (anyone can rent storage for any fid) falls out for free.
2. **Delegated device/app keys distinct from the identity's root key**, with on-chain grant/revoke records. Users get rotation and app granularity; data survives custody changes.
3. **Chain-portable identity primitive**: minimal registry state keyed by an abstract ID (integer fid), explicitly designed to migrate chains — and actually migrated once. Keep the on-chain identity record tiny and boring.
4. **Chain-agnostic signature domains**: salt/name-scoped EIP-712 domain, network-as-data not network-in-domain; Farcaster shows the pattern EAS offchain attestations get wrong.
5. **Rent with deterministic prune order and explicit lapse semantics** — and FIP-14's retrofit lesson: **never fully delete on lapse; keep a residue, weighted toward graph/identity data over content.** Also copy: writes displace oldest rather than failing; tombstones cost storage.
6. **Account/object-independent state design** ("no cross-account effects") — it's what made sharding and per-account reasoning trivial; EFS objects/edges have similar structure and should preserve that independence.
7. **Snapshot + block-height sync anchors.** Whatever the substrate, replicas need a signed, monotonic "you are here" — the deltagraph's lack of one was fatal.
8. **Candid decentralization accounting** (what's centralized and why, with an exit like ENS-vs-fname). EFS's credible-neutrality claim is stronger if the trusted components are named rather than implied absent.

**AVOID:**
1. **Don't build permissionless replication of non-monotonic signed state without an ordering anchor.** Revocation, rent-expiry, rate limits, and cross-substrate validity coupling each individually broke CRDT sync at scale. If EFS state were ever replicated LOCKSS-style *without* chain ordering, it inherits the deltagraph's exact failure modes.
2. **Don't rely on rent to produce content quality** — it bounds resources only. Budget for reputation/curation (EFS lenses are well-placed here — Farcaster had to bolt on centralized labels because it lacked a per-viewer trust primitive).
3. **Don't count on volunteer node networks; expect adversarial (airdrop-speculating) operators.** Node count is not health. If replication matters, design the incentive or accept few professional replicas.
4. **Don't let data validity depend on live registry state without archiving the registry into the portable layer** — otherwise authenticity dies with the origin chain (Farcaster's messages would).
5. **Don't accept "blockchain-like" governance shortcuts if permanence/neutrality is the product.** Snapchain's 6-validators/2-companies/GitHub-TOML endpoint is fine for a social feed; it would void EFS's core promise. If EFS ever needs its own substrate, this is the cautionary tale — better to lean on existing credibly-neutral chains.
6. **Don't treat pruning/ephemerality as a neutral efficiency choice.** In Farcaster it silently became a product philosophy ("users are comfortable with ephemeral behavior"). EFS's 100-year archive is the opposite commitment; rent-like mechanisms need a permanence-preserving default (e.g., anyone-can-pay preservation, residues, or archival tiers), not delete-on-lapse.
7. **Don't ignore the ops cost of chain-event coupling**: every data-layer node runs an L2 indexer forever; multi-chain registries (OP + Base) multiply that. Keep the required-to-verify on-chain surface minimal and snapshot-able.

---

## 10. Sources

Primary:
- FIP: Snapchain — https://github.com/farcasterxyz/protocol/discussions/207
- Snapchain whitepaper — https://snapchain.farcaster.xyz/whitepaper
- Snapchain repo/README — https://github.com/farcasterxyz/snapchain
- Snapchain validators page (read 2026-07-02; 6 validators: Neynar 5, Uno 1) — https://snapchain.farcaster.xyz/validators
- Snapchain migration guide — https://snapchain.farcaster.xyz/guides/migrating-to-snapchain
- Protocol specification (message format, CRDTs, revocation, pruning) — https://github.com/farcasterxyz/protocol/blob/main/docs/SPECIFICATION.md
- FIP: Introducing Ordering — https://github.com/farcasterxyz/protocol/discussions/193
- FIP-6: Flexible Storage — https://github.com/farcasterxyz/protocol/discussions/98
- FIP-12: Pricing schedule — https://github.com/farcasterxyz/protocol/discussions/126
- FIP-14: Residual Storage — https://github.com/farcasterxyz/protocol/discussions/139
- FIP: Permissionless Onboarding (Goerli→OP) — https://github.com/farcasterxyz/protocol/discussions/91
- FIP: Farcaster Pro — https://github.com/farcasterxyz/protocol/discussions/236
- Sufficient Decentralization for Social Networks (Varun Srinivasan, 2022) — https://www.varunsrinivasan.com/2022/01/11/sufficient-decentralization-for-social-networks
- Farcaster docs: contracts, messages, ENS/fnames, storage registry — https://docs.farcaster.xyz/ (NOTE: some pages lag reality — still describe hubs and $7 pricing)
- Warpcast spam labels dataset — https://github.com/merkle-team/labels

Live trackers / semi-primary:
- caststorage.com (unit price ~$0.30, July-2025 unit restructure; read 2026-07-02) — https://caststorage.com/

Commentary (numbers not independently verified):
- BlockEden "Farcaster in 2025: The Protocol Paradox" (DAU 40–60k vs ~73–100k peak; registrations 15k/day→650; revenue $2.34M cumulative; Malachite 780ms finality benchmark; team runs majority of hubs) — https://blockeden.xyz/blog/2025/10/28/farcaster-in-2025-the-protocol-paradox/
- The Block on Snapchain launch — https://www.theblock.co/post/347606/decentralized-social-media-protocol-farcaster-launches-blockchain-like-data-layer-snapchain
- dTech storage explainer (Dec 2024) — https://dtech.vision/farcaster/hubs/howdoesfarcasterstoragework/
- Node/airdrop-farming coverage — https://www.chaincatcher.com/en/article/2130917 and related
