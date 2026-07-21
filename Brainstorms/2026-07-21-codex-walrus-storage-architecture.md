---
agent: codex-gpt-5
date: 2026-07-21
status: reference
anchors:
  - area: efsv2
  - area: storage
  - area: replication
  - area: client
source: Walrus official documentation and network reference, reviewed 2026-07-21
---

# Walrus — certified availability and fixed-duration storage

Durable prior-art note for future EFS storage, mirror, and read-grade design. This is not an adopted integration decision.

## Executive read

Walrus is a production decentralized blob network coordinated by Sui. Its most valuable contribution to EFS is conceptual clarity: it distinguishes **registered**, **certified available**, **deletable/non-deletable**, and **expired** states, and it provides on-chain evidence for those transitions.

It is not permanent in EFS's ordinary-language sense. Mainnet epochs last two weeks and storage can currently be purchased at most 53 epochs ahead—about 742 days. A Walrus "permanent blob" means the owner cannot delete it before its paid expiry, not that it lasts forever.

Walrus is therefore a strong durable-mirror candidate and an excellent model for availability receipts, but not a sole century store.

## Architecture

- A client erasure-encodes an immutable blob into slivers using RedStuff and derives a content-dependent blob ID.
- Sui objects reserve storage capacity and record blob metadata, ownership, duration, and certification state.
- Slivers are distributed across 1,000 shards assigned to storage nodes.
- Nodes sign receipts; signatures representing at least two thirds of shards form an availability certificate.
- A certified, unexpired, non-deletable blob has on-chain evidence of availability until its end epoch.
- Readers collect and verify slivers and can reconstruct after obtaining more than a one-third quorum.
- Aggregators, publishers, and caches are optional accelerators; clients can run equivalent functions and verify their results.

The system assumes more than two thirds of shards are honestly managed in each epoch and across epoch transitions. That assumption and Sui's continued operation are part of the guarantee.

## What EFS should borrow

### 1. Model availability as a state machine

An upload HTTP 200 is not durable storage. A successful read is not proof of future availability. Walrus's explicit sequence is excellent prior art:

`LOCAL/SIGNED -> REGISTERED -> CERTIFIED(until T) -> EXPIRING -> EXPIRED`

EFS's read and preservation UI should distinguish those states for every paid mirror. Certification should be evidence attached to a placement, not a generic green badge on the file.

### 2. Verify before acting

Applications are told to check on-chain certification, expiry, and deletability before depending on a blob. EFS should apply the same rule to package execution, archival claims, and promotion jobs: do not treat a publisher response or cache hit as completion.

### 3. Keep publishers and aggregators optional

Walrus cleanly defines HTTP-facing services as replaceable roles. EFS gateways should likewise be accelerators. A user or archivist must be able to resolve the canonical evidence, contact storage nodes/mirrors, and verify bytes independently.

### 4. Use explicit renewal horizons

Fixed-duration storage makes decay computable. EFS preservation tooling should track:

- paid-through time;
- renewal authority and funding source;
- warning thresholds;
- last successful independent retrieval;
- alternative placements;
- the consequence if renewal never occurs.

### 5. Batch small files without changing their EFS identity

Walrus Quilts amortize large fixed per-blob overhead and permit retrieval of individual patches. That is useful for an EFS mirror adapter, but the quilt/patch identifier depends on grouping. The canonical EFS file ID and content hash must remain independent of which quilt carries it.

## What EFS should not copy

### "Permanent" terminology for paid non-deletability

EFS should use plain labels such as `certified until 2028-...`, `owner-deletable`, and `renewal required`. "Permanent" should not be displayed without the duration and dependency assumptions.

### Group-dependent identifiers as canonical identity

A QuiltPatchId changes when content moves between quilts and individual patches cannot be independently extended or deleted. It is a placement locator, not a durable EFS identifier.

### All-or-group lifecycle for mutable collections

Quilts reduce overhead but updates and lifecycle operations affect the container. They fit immutable release bundles, website generations, and cold archives better than frequently edited personal folders.

### Sui ownership as EFS authorship

The owner of the Sui Blob/Site object controls lifecycle operations. EFS authorship remains the chain-free signed record identity; storage-object ownership is only placement administration.

## Integration shape

A Walrus placement adapter should record the blob or quilt locator, Sui object/event evidence, certification epoch, end epoch, deletability, encoding version, and retrieval hints. Readers verify the EFS `contentHash` after reconstruction even if Walrus's blob ID also verifies.

For a site or playable package, store an immutable release bundle/quilt and keep the mutable EFS path/channel pointer outside Walrus. Renewal can replace or extend the placement without changing the EFS release identity.

## Required benchmark before endorsement

1. Store 10,000 small files individually and as quilts; compare cost, upload time, retrieval latency, and update amplification.
2. Remove the selected publisher and aggregator; recover through a local client.
3. Verify certification and expiry from Sui state without trusting the HTTP service.
4. Renew near the maximum horizon and document every required key, token, transaction, and service.
5. Repack files into a new quilt and prove all EFS links remain stable.

## Sources

- Fundamentals and lifecycle: https://docs.wal.app/docs/system-overview/core-concepts
- Network parameters: https://docs.wal.app/docs/system-overview/available-networks
- Availability verification: https://docs.wal.app/docs/walrus-client/verifying-availability
- Quilt behavior: https://docs.wal.app/docs/walrus-client/quilts
- Walrus Sites components: https://docs.wal.app/docs/sites/introduction/components
