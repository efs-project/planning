---
agent: codex-gpt-5
date: 2026-07-21
status: reference
anchors:
  - area: efsv2
  - area: filesystem
  - area: storage
  - area: client
source: ArFS 0.15 documentation, ArDrive developer documentation, and comparison against the current EFS v2 design set
---

# ArFS and ArDrive — competitive and architectural notes for EFS

Durable prior-art note for future filesystem, storage, SDK, and client design. This records evidence and design pressure; it is not an adopted EFS decision.

## Executive read

ArFS is the closest mature analogue to the *filesystem layer* of EFS. It turns Arweave's immutable transactions into drives, folders, files, versions, privacy conventions, pins, and snapshots. ArDrive is the application/tooling suite around it.

The strongest lesson is not "put files on Arweave." It is that a familiar mutable filesystem can be reconstructed from an append-only event history without mutating old bytes. ArFS also exposes the operational cost of that choice: clients must discover, order, fold, cache, and occasionally snapshot a potentially large history.

ArFS is therefore both competitor and evidence:

- competitor for permanent personal drives, file sharing, static sites, and developer uploads;
- evidence that append-only filesystem semantics are understandable to users;
- a warning that read reconstruction and key recovery become first-class product work.

## Architecture

ArFS stores a logical hierarchy as typed Arweave transactions:

- a drive has a UUID and points to its root-folder UUID;
- each folder points upward to its parent folder and drive;
- a file has a metadata transaction and a separate data transaction;
- later renames, moves, and versions append new metadata/data rather than changing old transactions;
- clients query tagged transactions and fold them into the current drive state;
- snapshot entities roll up drive metadata so a fresh client need not replay the entire history.

The hierarchy is deliberately **bottom-up**: children name parents; parents do not enumerate children. That avoids rewriting a parent every time a child changes and reduces update races, but directory listing becomes a query/index operation.

Private drives encrypt metadata and data on the client. Current documentation uses AES-256-GCM and derives drive/file keys from wallet-controlled material, the drive identity, and optional password inputs. Ciphertext and its surrounding transaction metadata remain permanent.

## What EFS should borrow

### 1. Treat reconstructed state and source history as separate products

The authoritative append-only records and the convenient current tree are different artifacts. EFS should keep that separation explicit:

- kernel records are the evidence;
- a lens/index builds the current view;
- a snapshot/checkpoint accelerates reads;
- a clean-room client can discard the snapshot and reconstruct from the evidence.

Snapshots should be cacheable and independently checkable, never a new authority root. This maps to [[efsv2/onchain-completeness]], [[efsv2/read-lens-spec]], and the state-walk doctrine.

### 2. Keep hierarchy edges child-owned

ArFS validates EFS's direction of storing parent/container references on child records instead of maintaining a mutable child array on every directory. It makes moves and renames local append operations and prevents large ancestor rewrites.

The product consequence must be owned: listing a directory requires an index, a bounded on-chain discovery surface, or a local fold. The client must label which one answered.

### 3. Separate file identity, metadata, and bytes

ArFS keeps file metadata apart from its byte transaction. EFS's DATA identity plus placement/mirror/chunk records is the stronger, more explicit version of this pattern. It lets metadata evolve without rewriting identical bytes and lets multiple storage tiers serve the same file identity.

### 4. Make snapshots an interoperability format

ArFS snapshots are primarily a synchronization optimization. EFS can go further: define an export/checkpoint format containing the relevant records, bodies, byte manifests, proofs, and reconstruction parameters. That artifact should support:

- fast initial sync;
- verification back to canonical records;
- resumption after interruption;
- migration between indexers or chains;
- recurring walk-away drills.

### 5. Ship familiar workflows over unfamiliar permanence

ArDrive succeeds by exposing drives, folders, sharing, CLI uploads, manifests, and static-site publishing. EFS should present comparable workflows while keeping its stronger evidence, identity, and read-grade model underneath. Users should not need to understand attestations or Merkle trees to move a file.

## What EFS should not copy

### Client timestamps as semantic ordering

An append-only filesystem needs deterministic rules for competing updates. Local `Unix-Time` metadata is useful testimony but must not decide canonical state against an adversary. EFS's signed ordering and venue evidence need a pinned conflict rule independent of gateway query order.

### Snapshot trust without replayability

A rolled-up view is attractive because full replay gets expensive. If a client cannot prove or reproduce the rollup, the snapshot operator silently becomes the filesystem authority. EFS exports and checkpoints must include enough evidence to validate omissions as well as included entries.

### Wallet-signature-derived archive secrets

Coupling encryption roots to wallet-signing behavior makes recovery depend on wallet compatibility and preserved signing prompts. EFS should keep identity/signing, encryption recovery, device/session keys, and funds recovery separate, as required by the privacy and walk-away work.

### Calling ciphertext deletion

Permanent encrypted bytes can become practically inaccessible when keys are destroyed, but the ciphertext, sizes, timing, hierarchy tags, and sharing events may remain public forever. Product language must distinguish cryptographic erasure from removal and warn before the first irreversible publish.

### Assuming the gateway query is the filesystem

ArFS discovery normally uses indexed GraphQL queries. EFS should use gateways and indexes for speed while preserving an independently reconstructable path from canonical chain state and signed records.

## Concrete EFS design questions

1. What is the smallest verifiable filesystem snapshot that lets a new client detect omitted records?
2. Can directory listings be reconstructed from bounded on-chain postings plus local state without trusting an indexer?
3. Which move/rename/version conflicts must remain visible rather than collapsed by the default lens?
4. Does the `.efs-bundle` format contain an optional current-tree checkpoint, and how is that checkpoint tied to its evidence frontier?
5. What recovery ceremony proves a private archive can be opened without the original wallet implementation or hosted client?

## Recommended benchmark

Build the same 10,000-file synthetic drive in ArFS and the EFS prototype. Measure cold reconstruction, warm listing, one-file rename, subtree move, new file version, snapshot size, export size, gateway-free recovery, and private-drive recovery after removing the original application.

The decisive metric is not upload price alone. It is **time and trusted dependencies from a bare machine plus recovery material to a verified current tree**.

## Sources

- ArFS protocol and version history: https://docs.ar.io/build/advanced/arfs
- ArFS data model: https://docs.ar.io/build/advanced/arfs/data-model/
- ArFS entity and snapshot formats: https://docs.ar.io/build/advanced/arfs/entity-types/
- ArFS creation and encryption flow: https://docs.ar.io/build/advanced/arfs/creating-drives
- ArFS read reconstruction: https://docs.ar.io/build/advanced/arfs/reading-data
- ArDrive developer tooling: https://ardrive.io/developers/
