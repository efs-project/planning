---
agent: codex-gpt-5
date: 2026-07-21
status: reference
anchors:
  - area: storage
  - area: preservation
  - area: economics
  - area: efsv2
  - area: client
source: Parallel primary-source review of Arweave, Filecoin, IPFS, Storj, Sia, Ethereum history/blob retention, Portal Network, LOCKSS, and Software Heritage
---

# Permanence evidence, economics, and repair

## Bottom line

No surveyed system guarantees that named bytes exist forever. Systems guarantee narrower properties: stable identifiers, cryptographic commitments, storage for finite terms, storage incentives, present retrieval, or monitoring/repair while some funded actor remains healthy.

A useful model is:

> `recoverable = valid bytes/shards + locator/graph metadata + decoding software + required keys + live bootstrap/network + sufficient funding + timely repair`

If any term reaches zero, a valid CID, transaction hash, or proof may identify data nobody can reconstruct. EFS should make permanence an evidence vector, not a Boolean.

## Guarantee comparison

| System | Strong property | Missing guarantee | Hidden liveness dependency |
|---|---|---|---|
| **Arweave** | Upfront-funded protocol incentives for historical storage; integrity through chain/proofs | Named-object independent replica certificate, successful initial seeding, unconditional eternity, low-latency retrieval | AR purchasing power, storage-cost assumptions, miners, seeding, gateways, correlated filtering |
| **Filecoin** | Provider-specific sealed-copy/continued-storage proofs for an on-chain deal | Renewal, independent replicas, retrieval, repair after last-copy loss | Funded renewer/repair worker, source data, metadata, providers, retrieval/index services |
| **IPFS** | CID verifies bytes if retrieved | Persistence, provider, continued discovery | Pins, node uptime, reproviding, paid pin service |
| **Storj** | Erasure-coded durability, audits, managed repair | Reconstruction without Satellite/control-plane metadata | Satellite, billing, audit/repair workers, operator |
| **Sia** | Contract storage plus client erasure coding | Maintenance after renter stops | Funded unlocked renter, renewal/repair daemon |
| **Ethereum blobs** | Consensus availability for a finite protocol window plus lasting commitment | Long-term blob bytes, direct EVM access | External archive after expiry |
| **Ethereum history** | Current state/canonical commitments remain verifiable | Ordinary nodes serving all old bodies, receipts, logs, calldata | Archive operators, history networks/torrents/institutions |
| **LOCKSS** | Administratively independent copies, routine validation, conservative repair | Survival with one operator/control plane or blind majority repair | Institutions, staffing, funding, governance |
| **Software Heritage** | Intrinsic artifact IDs, Merkle DAG, copy/mirror/export tooling | Usable reconstruction from hashes alone or graph without blobs | Graph + blobs + journals/replayers + independent mirrors |

## Arweave — actuarial permanence, not physics

Arweave’s design prices uploads using long-horizon replication/storage-cost assumptions and an endowment intended to sustain storage if economic conditions remain favorable. That is a serious mechanism, but still a model exposed to token purchasing power, storage costs, mining participation, seeding, gateway behavior, and correlated filtering.

Initial seeding is a separate uploader/gateway responsibility. A chain record can reserve space/commit to an upload whose bytes were not fully seeded. Miners choose storage partitions and content policies; proofs do not create an object-specific receipt that a named file has N independently controlled copies. Gateways perform indexing, caching, seeding, and public distribution; miners are not automatically a CDN.

EFS wording should be: **Arweave-backed with protocol-incentivized indefinite retention under disclosed economic and operational assumptions**, plus independent retrieval evidence—not unconditional “permanent.”

Sources: [protocol/endowment](https://docs.arweave.org/developers/development/protocol), [uploader/gateway responsibilities](https://docs.arweave.org/developers/development/motivation), [missing/unseeded data](https://docs.arweave.org/developers/mining/overview/syncing-and-packing), [lightpaper](https://arweave.org/files/arweave-lightpaper.pdf).

## Filecoin — proofs need renewal, repair, and retrieval

Proof-of-Replication and Proof-of-Spacetime provide provider-specific evidence during finite contracts. Deals expire. Replication, renewal, and repair are active workflows that need source copies, deal metadata, funded automation, and providers. When the last reconstructable copy disappears, no repair system can recover it.

Retrieval is separate. IPNI/provider discovery and provider Graphsync/Bitswap/HTTP support determine whether a user can obtain bytes. Storage proofs do not measure retrieval latency, bandwidth, indexing, decoding convenience, or independent replica count.

Filecoin Plus/DataCap changes economic prioritization and adds allocator/governance dependencies. It does not itself create a particular replica count, retrieval quality, or repair independence.

Sources: [storage proving/deal terms](https://docs.filecoin.io/storage-providers/filecoin-economics/storage-proving), [proof definitions](https://docs.filecoin.io/basics/the-blockchain/proofs), [renewal/repair service](https://docs.filecoin.io/smart-contracts/programmatic-storage/raas), [retrieval](https://docs.filecoin.io/basics/how-retrieval-works/serving-retrievals), [verified deals](https://docs.filecoin.io/storage-providers/filecoin-deals/verified-deals), [Filecoin Plus](https://docs.filecoin.io/store/filecoin-plus).

## IPFS — identity and transport, not retention

Unpinned cached blocks may be garbage-collected. A local pin protects one node; a remote pin moves responsibility to a provider and payer. Provider advertisements need continued reproviding.

EFS should say: **content-addressed and last independently retrieved from these currently pinned sources**, not “stored on IPFS forever.”

Sources: [persistence/pinning](https://docs.ipfs.tech/concepts/persistence/), [data lifecycle](https://docs.ipfs.tech/concepts/lifecycle/), [remote pinning](https://docs.ipfs.tech/how-to/work-with-pinning-services/).

## Storj and Sia — the control plane is the preservation system

Storj’s erasure coding, audits, piece health, and managed repair demonstrate a good operational pattern. But a Satellite holds object metadata, authorization, billing, node knowledge/reputation, audits, and repair initiation. Distributed storage nodes do not eliminate the reconstruction control plane.

Sia makes recurring obligations explicit: storage remains healthy only while a funded, unlocked renter/daemon performs allowance management, renewal, health checks, and repair. “Automatic” means automatic while the automator remains alive, funded, unlocked, informed, and watching.

Sources: [Storj definitions](https://storj.dev/learn/concepts/definitions), [Satellite](https://storj.dev/learn/concepts/satellite), [auditing/repair](https://storj.dev/learn/concepts/immutability), [Sia file maintenance](https://docs.sia.tech/store-your-data/renting-storage/managing-your-files), [Sia renting/contracts](https://docs.sia.tech/store-your-data/about-renting), [Sia shard construction](https://docs.sia.tech/store-your-data/renting-storage).

## Ethereum — durable current state, finite ordinary history service

Blob sidecars have a finite consensus availability window and cannot be read directly by EVM execution. They must never carry EFS’s only persistent payload.

Execution clients increasingly prune old history while retaining current state and canonical commitments. Old bodies, receipts, event logs, and calldata depend more on archive/history services and out-of-protocol preservation. Portal Network may improve decentralized discovery/verification, but its specifications remain non-core and evolving; bridge/ingestion paths still matter.

EFS consequences:

- keep recovery-critical roots and essential query state in current contract state where feasible;
- keep the full record-body spine/no-body-elision promise already ruled for admitted records;
- never make blobs the only byte placement;
- independently archive bodies/receipts/proofs needed for reconstruction;
- treat Portal/history networks as additional venues, not the only archive.

Sources: [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844), [blob roadmap](https://ethereum.org/roadmap/danksharding), [partial history expiry](https://blog.ethereum.org/2025/07/08/partial-history-exp), [Portal overview](https://ethereum.org/developers/docs/networking-layer/portal-network/), [Portal specifications](https://github.com/ethereum/portal-network-specs), [EIP-4444](https://eips.ethereum.org/EIPS/eip-4444).

## Institutional preservation — independent custody and conservative repair

LOCKSS highlights that replica count is weak when one organization, administrator, cloud, jurisdiction, or software implementation controls every copy. Copies must be routinely read and compared. Repair should be conservative because blindly propagating an apparent majority can accelerate compromise. Long-term preservation is an institutional funding/staffing/governance problem as much as a storage algorithm.

Software Heritage distinguishes intrinsic IDs from origins/visits/context and separates the Merkle graph from blobs. A usable independent mirror needs both, plus navigation, search, and reconstruction tooling. Secondary copies operated by one organization across clouds are useful but weaker exit evidence than independently administered mirrors.

Sources: [LOCKSS principles](https://www.lockss.org/about/preservation-principles), [lifecycle](https://www.lockss.org/use-lockss/how-lockss-works), [polling/repair FAQ](https://www.lockss.org/about/frequently-asked-questions), [Software Heritage mirrors](https://docs.softwareheritage.org/sysadm/mirror-operations/index.html), [copy topology](https://docs.softwareheritage.org/devel/swh-storage/archive-copies.html), [SWHIDs](https://docs.softwareheritage.org/devel/swh-model/persistent-identifiers.html), [data model](https://docs.softwareheritage.org/devel/swh-model/data-model.html), [vault bundles](https://docs.softwareheritage.org/devel/swh-vault/api.html).

## EFS preservation receipt

Do not compute one permanence score. Report six dimensions:

1. **Integrity:** canonical encoding, byte length, digests/CIDs, complete dependency/DAG closure, authority/evidence basis.
2. **Observed availability:** last complete retrieval per venue; rolling success; cold-retrieval latency. A metadata query, `HEAD`, pin flag, deal, contract existence, or proof alone is not successful byte retrieval.
3. **Independent recoverability:** reconstruction threshold, present shards/replicas, margin above threshold, and distinct operator/cloud/ASN/region/jurisdiction/implementation fault domains.
4. **Monitoring/repair:** audit cadence, last complete audit, detect/repair latency, trigger, repair source, authority, and latest forced-loss repair drill.
5. **Economic horizon:** expiries, renewal lead time, stressed funding runway, endowment assumptions, and the party/mechanism responsible for renewal.
6. **Credible exit:** reconstruction with EFS domains/APIs/gateways/GitHub/employees/signing services absent; raw exports, locators, manifests, formats, software, independent implementations, and key-recovery policy.

A truthful status line:

> Content-addressed and independently verifiable. Storage evidence records where complete bytes were last retrieved, the fault domains holding them, active contract/incentive horizons, and the latest successful reconstruction test. “Preserved” describes current evidence and repair capacity, not an unconditional promise of eternity.

## Acceptance gates for critical public artifacts

- Complete retrieval from at least three independently administered fault domains.
- At least two storage mechanisms, not multiple gateways backed by one system/company.
- One independently controlled cold/institutional copy.
- Gateway-free IPFS/CAR reconstruction.
- Direct retrieval from every claimed Filecoin provider, not only valid PoSt.
- Arweave accepted as preserved only after independent post-seeding full retrieval.
- Ethereum recovery without a commercial RPC and without relying on expired blobs.
- Offline reconstruction from published manifests and raw exports.
- Regular complete retrieval plus smaller frequent randomized audits and an annual EFS-company-death drill.
- Repair begins before the remaining copies fall to the reconstruction threshold.
- Renewal alerts far enough ahead to replace failed deals/providers.
- Observable funding runway for anything called long-lived.
- Clean-machine rebuild of tools and formats from pinned source.
- Failure drills for expired contracts, lost gateway/index, disabled DNS, primary cloud loss, operator loss, and poisoned replica.
- Correlated legal/filtering drill across providers in one jurisdiction.

Stress Arweave assumptions with token purchasing power down sharply, storage costs flat/rising, miner count reduced, gateways unavailable, and correlated blacklist adoption. The important result is whether the EFS receipt degrades and repair begins before loss—not whether every venue survives.

## Catastrophic failures to design around

- identifier survives every byte;
- paid upload never fully seeded;
- nominal replicas share one fault domain;
- final copy disappears between audit and repair;
- renewal automation loses funds, keys, metadata, or executor;
- repair propagates corrupted/malicious data;
- graph/locator metadata disappears while shards remain;
- encryption keys disappear while ciphertext remains;
- closure traversal omits hidden dependencies;
- decoding formats/software become unrebuildable;
- token/economic assumptions fail;
- protocol governance changes retention economics;
- steward bankruptcy, capture, sanctions, or coordinated filtering.

## Owner policy choices

These are consolidated into [[owner-decision-inbox]] rather than left as hidden storage-engineering choices:

1. public wording: “permanent,” “indefinitely incentivized,” “durable,” “preserved,” or “reconstructable”;
2. preservation classes/horizons for roots, public package contents, private data, caches, and user content;
3. minimum administrative/technical/legal diversity per class;
4. who repairs after EFS disappears;
5. reserve/subscription/permissionless-renewal funding mix;
6. exact Ethereum state vs independently archived history boundary;
7. publication completion only after seeding plus independent full retrieval;
8. repair authority and poisoned-replica pause/quorum policy;
9. encryption/deletion claims and key succession;
10. contents of the EFS steward-exit/succession package.

The strongest differentiator is not another “forever” claim. It is a system that exposes every preservation assumption, tests it continuously, degrades claims when evidence expires, repairs before the threshold is crossed, and remains reconstructable after its own organization is gone.
