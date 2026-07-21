---
agent: codex-gpt-5
date: 2026-07-21
status: reference
anchors:
  - area: efsv2
  - area: storage
  - area: replication
  - area: web3-url
source: EthStorage official documentation and Mainnet Alpha material, reviewed 2026-07-21
---

# EthStorage — architecture and integration boundary for EFS

Durable prior-art note for future EFS storage-tier and preservation design. This is not an adopted integration decision.

## Executive read

EthStorage is now more than a research project: Mainnet Alpha launched on Ethereum in October 2025. It is the most relevant EVM-adjacent candidate for a durable large-byte tier because it combines Ethereum blob ingestion, an L1 storage/proof contract, an external storage-provider network, client-verifiable commitments, and `web3://` serving.

It should still be treated as an **experimental external availability domain**, not equivalent to EVM state:

- byte storage and replication occur in `es-node` providers, not ordinary Ethereum execution-state replicas;
- the L1 contract verifies proofs and distributes fees;
- Mainnet Alpha mining remains whitelist-gated according to current operator documentation;
- its long-term/permanent claim depends on protocol economics and provider participation that EFS does not control.

The right EFS posture is "first-class mirror candidate, benchmark now, do not freeze a dependency."

## Architecture

1. An application contract writes data references through the EthStorage contract using Ethereum's data-availability path.
2. Storage providers observe new data and retrieve the blob bytes while Ethereum still serves them.
3. Providers retain replicas in the EthStorage network.
4. Providers continuously submit storage proofs to the L1 contract.
5. The contract verifies proofs and distributes storage rewards.

Current published network information identifies chain ID 333, Ethereum mainnet as L1, a mainnet storage contract, `es-node` RPCs, and a blob-archiver endpoint. The system divides the dataset into fixed-size shards so providers can store subsets rather than the whole corpus.

This is not "ordinary Ethereum nodes keep blobs forever." Ethereum supplies initial DA and the verification/economic coordination layer; EthStorage supplies the long-lived byte replicas.

## What EFS should borrow

### 1. A proof-bearing mirror class

EFS's current tiers distinguish byte location and contract readability. EthStorage suggests a further evidence dimension for mirrors:

- committed but no live provider evidence;
- provider network claims availability;
- recent storage proof accepted by the coordination contract;
- bytes retrieved and re-derived to the expected commitment;
- independently copied to another authority domain.

This belongs in the read/preservation layer, not in the file's identity.

### 2. Ingest during the blob availability window

The storage network observes bytes while Ethereum blob DA still carries them. EFS replicators should generalize this into an urgency rule: a temporary rail has a known rescue deadline. Signed manifests, local outboxes, and monitoring should surface time-at-risk until a durable placement is proven.

### 3. Client-side commitment re-derivation

A gateway or `es-node` can serve bytes without becoming trusted if the client recomputes the commitment and compares it to the EFS manifest/placement evidence. This is the correct default for every off-chain or external-network mirror.

### 4. Keep storage economics outside the kernel

EthStorage needs fees, rewards, providers, and mining parameters. EFS should integrate those through placement records, relayers, preservation policies, and clients. It should not freeze one provider market or token economy into the neutral record kernel.

## What EFS should not copy

### Marketing "permanence" as an intrinsic byte property

EthStorage's permanence is an economic/network claim. It is materially different from bytes present in current EVM state and replicated by every relevant execution node. EFS should report the actual evidence and renewal/provider assumptions rather than transfer the label.

### A single blob archiver as the recovery plan

The published archiver API is convenient, but a named endpoint is not an independent preservation strategy. EFS testing must include retrieval without the default gateway/archiver.

### Whitelist dependence in a frozen path

Mainnet Alpha storage-provider rewards remain whitelist-gated. EFS can experiment with it, but no Etched format or default promise should require permissioned providers or one team's continued operation.

### Conflating L1 proof verification with L1 byte readability

An Ethereum contract can verify EthStorage protocol evidence without arbitrary application contracts being able to synchronously read all stored bytes as EVM state. EFS's `contractReadable` capability must remain separate.

## Integration shape

Treat EthStorage as a placement/mirror adapter:

- the EFS file identity and `contentHash` remain unchanged;
- the signed chunk manifest remains carriage-independent;
- an additive placement record names network, contract/version, blob/versioned hashes, retrieval hints, and expiry/economic assumptions if any;
- the client verifies returned bytes against the EFS commitment;
- failure or migration of EthStorage does not invalidate the file or other placements.

No EthStorage-specific field belongs in the EFS kernel unless a future benchmark proves a generic commitment primitive is missing.

## Required benchmark before endorsement

For 1 MB, 100 MB, and repository-shaped workloads, measure total upload cost, Ethereum blob timing, time to provider pickup, time to accepted proof, retrieval latency through three independent paths, provider count, failure recovery, and re-verification from a bare client. Kill the official gateway and blob archiver during the exercise.

Also answer:

1. What exact storage duration does one payment purchase, and what must be renewed?
2. What happens to bytes when no provider chooses a shard?
3. Can a non-whitelisted operator retrieve, audit, and replicate all needed data even if it cannot earn rewards?
4. Which proof and contract versions must a century reader preserve?
5. Can the placement be migrated without changing EFS file identity or references?

## Sources

- Overview: https://docs.ethstorage.io/
- Architecture: https://docs.ethstorage.io/readme/how-ethstorage-works
- Network deployments and tools: https://docs.ethstorage.io/information
- Storage-provider participation: https://docs.ethstorage.io/storage-provider-guide
- Mainnet Alpha announcement: https://blog.ethstorage.io/ethstorage-mainnet-alpha-launch-petabyte-scale-decentralized-storage-on-ethereum/
- Existing EFS large-upload comparison: [[efsv2/large-file-uploads]] and `Reviews/2026-07-07-large-upload-corpus/prior-art-autopsy.md`
