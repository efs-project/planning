---
agent: codex-gpt-5
date: 2026-07-21
status: reference
anchors:
  - area: efsv2
  - area: storage
  - area: replication
  - area: client
  - area: apps
source: Cross-system synthesis of IQLabs, ArFS, Radicle, EthStorage, Walrus, Internet Computer, Ceramic, and existing EFS prior-art research
---

# Decentralized data landscape — implications for EFS design

Durable synthesis for future EFS design iterations. This ranks evidence and experiments; it does not adopt integrations or change current v2 decisions.

## Executive read

No inspected system combines all of EFS's intended properties. The landscape decomposes into six distinct jobs:

1. **authoritative signed records and identity**;
2. **filesystem/database semantics**;
3. **large-byte availability**;
4. **replication and synchronization**;
5. **verified serving and application runtime**;
6. **preservation and walk-away recovery**.

Competitors look cheaper or simpler largely because they solve fewer of these jobs or merge them under one operator/network. EFS's opportunity is not to beat each specialist at its specialty. It is to compose specialists without letting any one of them become the identity, authority, or only exit.

## Landscape map

| System | Primary job | Authority root | Byte guarantee | Best lesson for EFS | Main trap |
|---|---|---|---|---|---|
| IQLabs | Ethereum data service + Git app | Mutable application contract and tx history | Calldata/history retrieval | Cheap history tier and excellent Git upload ergonomics | Archive-RPC dependence and tx-hash linked state |
| ArFS/ArDrive | Permanent filesystem model | Signed/tagged Arweave transaction history | Arweave permanence economics | Append-only filesystem, bottom-up hierarchy, snapshots | Client/indexer reconstruction and wallet-coupled recovery |
| Radicle | Local-first code collaboration | Self-certifying repo identity and signed refs | Available while peers seed | Namespaced views, signed inventories, social artifacts travel with code | No intrinsic permanence; seed/bootstrap liveness |
| EthStorage | Ethereum-aligned long-term blob DA | Ethereum L1 proof/economic contract | Provider replicas with storage proofs | Proof-bearing EVM-adjacent mirror | Alpha/whitelist maturity and external-provider dependence |
| Walrus | Certified decentralized blobs | Sui objects, events, committee certificates | Guaranteed only through paid expiry | Explicit availability lifecycle and replaceable HTTP roles | "Permanent" means non-deletable until expiry |
| Internet Computer | Replicated full-stack runtime | Canister state, controllers, subnet consensus | Durable while funded and not deleted | Certified HTTP and integrated deploy/runtime UX | Cycles/controller/subnet lock-in; state can disappear |
| Ceramic/ComposeDB | Signed mutable off-chain data | Stream events plus anchor/index services | Node/gateway dependent | Portable signed events and range reconciliation | Joined-system dependency and steward-exit failure |

## The design pattern that survives every comparison

EFS should preserve a three-layer separation:

### Layer A — portable authority

The signed EFS record/envelope establishes author, object, relationships, and byte commitments without depending on a storage provider, gateway, relayer, or destination chain.

### Layer B — plural placements and execution venues

EVM state, calldata/history, Arweave, EthStorage, Walrus, IPFS/Filecoin, peer replicas, and future networks are placements with different evidence, cost, readability, and expiry. A runtime such as an EVM L2, browser sandbox, or canister-like service is similarly replaceable.

### Layer C — explicit reader policy and preservation state

The client explains which evidence it used, whether bytes are currently retrievable, whether a placement expires, whether a contract can read them, and what alternate copies exist. It never upgrades availability into authorship or one successful read into permanence.

This separation is the main architectural defense against both vendor exit and changing storage economics.

## Highest-value lessons to carry into the next iterations

### 1. Add an availability-evidence vocabulary

The current byte tiers describe where bytes may live. Future read/preservation design should also describe lifecycle evidence:

- `LOCAL_ONLY` or `SIGNED_NOT_SUBMITTED`;
- `COMMITTED`;
- `REGISTERED/PENDING_PROVIDER`;
- `CERTIFIED_UNTIL(time)`;
- `RETRIEVED_AND_VERIFIED(at, source)`;
- `MULTI_DOMAIN_REPLICATED(n)`;
- `EXPIRING` / `EXPIRED` / `UNKNOWN`.

Names are provisional. The invariant is that a green "stored" state must say what was proven and until when.

### 2. Define snapshots as verifiable acceleration, not authority

ArFS snapshots, ICP canister snapshots, Radicle signed refs, Ceramic batch trees, and Walrus manifests all compress or package state. EFS needs one generic doctrine:

- snapshots identify an evidence frontier;
- omissions are detectable or replay can check them;
- the format is documented and implementation-independent;
- old snapshots remain interpretable;
- losing the snapshot affects speed, not truth.

### 3. Make the Git/forge workload a standing benchmark

IQLabs and Radicle show why Git is unusually valuable: many small immutable objects, deduplication, mutable heads, collaboration metadata, partial fetch, offline work, provenance, and export already exist in one recognizable workflow.

Use it to benchmark the EFS kernel/SDK, storage tiers, replication, read lenses, and walk-away behavior without adding Git-specific kernel primitives.

### 4. Productize proof-bearing renewal

Walrus and ICP make ongoing funding explicit; EthStorage embeds provider rewards; Arweave markets an endowment. EFS cannot leave preservation funding as an invisible backend detail. A preservation panel should show paid-through horizons, funders, last checks, renewal plans, and alternative copies.

### 5. Certify web responses, not just content hashes

ICP demonstrates that verified browser delivery can cover path, body, status, and security-relevant headers. EFS's serving layer should bind enough of the resolved response to prevent a gateway from turning correct bytes into unsafe browser behavior.

### 6. Turn walk-away into a recurring test suite

Ceramic proves that public code is insufficient. The EFS release process should periodically rebuild from a bare environment using only specs, exports, recovery material, ordinary chain access, and independently operated mirrors. Remove official gateways, indexers, relayers, and hosted UIs during the drill.

## Priority experiments

### P0 — one shared comparative harness

Create a reproducible workload with 1 KB, 100 KB, 1 MB, 100 MB, and 10,000-small-object cases. Run it through EFS state/history tiers, Arweave/ArFS, EthStorage, Walrus, and at least one ordinary IPFS/Filecoin path. Capture:

- all-in cost and renewal horizon;
- signatures, transactions, and prompts;
- time to committed versus certified versus independently retrieved;
- cold and warm read latency;
- gateway-free verification;
- interrupted-upload and different-account resume;
- export and clean-room recovery;
- contract readability;
- authority/provider concentration.

### P1 — verifiable EFS snapshot/export

Specify the evidence frontier, omission detection, byte-manifest inclusion, encryption/recovery material boundaries, and independent restore procedure. Exercise it against a large synthetic drive and the Git workload.

### P2 — mirror adapter proof of concept

Implement one generic placement interface and two adapters—preferably EthStorage and Walrus because their evidence models differ. Prove that adding, renewing, failing, or migrating a placement never changes the EFS file identity.

### P3 — certified serving receipt

Prototype a response proof that binds EFS resolution evidence, byte commitment, status, content type, and security headers. Verify it both in a gateway and directly in a client.

### P4 — steward-exit drill

Assume every EFS-operated service shuts down with 30 days' notice. Inventory what users must export, what third parties must run, which privileged keys exist, and which claims would become false. Repeat annually.

## Systems to keep on the watchlist

These are relevant but lower priority than the six deep dives:

- **AT Protocol:** portable identity, signed per-user repositories, CAR export, PDS migration, and explicit separation of hosting from reach. Its export boundary is instructive but incomplete by itself: blobs and private preferences travel separately, and hosting/account status is not self-certifying. Already well represented in the local corpus.
- **Storacha:** UCAN capability delegation and browser-direct uploads into user-owned storage spaces; useful for gasless/delegated storage UX.
- **Fileverse:** encrypted collaborative documents and a named walk-away path; useful as a product/recovery comparator.
- **Irys:** programmable datachain combining data and execution. Reassess after production/mainnet maturity is unambiguous.
- **Grove/Lens storage:** an emerging off-chain storage/index boundary with blockchain ownership evidence; compare once independent operational evidence exists.
- **Tahoe-LAFS, Hypercore, and BitTorrent v2:** mature lessons in capability security, append-only feeds, swarming, partial verification, and repair.
- **Automerge/local-first systems:** collaboration and offline state mechanics, but not authority or permanence by themselves.
- **Solid:** user-controlled data pods and application/data separation; useful for permissions and portability UX, weaker as a durable evidence substrate.

## Decision discipline for any future integration

Before adding a network or service, record:

1. Which job does it perform?
2. What exact evidence can EFS independently verify?
3. What expires, can be deleted, or requires renewal?
4. Who can upgrade, censor, or stop it?
5. What keys and hosted APIs are required?
6. Can two independent implementations replace it?
7. Does failure degrade availability only, or corrupt identity/authority?
8. Can the placement migrate without changing EFS IDs or links?

If the answer to item 7 is "identity or authority," the integration boundary is too deep.

## Related durable notes

- [[2026-07-20-codex-iqlabs-competitive-architecture]]
- [[2026-07-21-codex-arfs-ardrive-competitive-architecture]]
- [[2026-07-21-codex-radicle-signed-repositories]]
- [[2026-07-21-codex-ethstorage-architecture]]
- [[2026-07-21-codex-walrus-storage-architecture]]
- [[2026-07-21-codex-internet-computer-architecture]]
- [[2026-07-21-codex-ceramic-composedb-postmortem]]
- [[efsv2/large-file-uploads]]
- [[efsv2/read-lens-spec]]
- `Reviews/2026-07-02-substrate-corpus/research-ceramic-ipld.md`
- `Reviews/2026-07-07-large-upload-corpus/prior-art-autopsy.md`
