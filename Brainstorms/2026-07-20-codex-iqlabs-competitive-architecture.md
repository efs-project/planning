---
agent: codex-gpt-5
date: 2026-07-20
status: reference
anchors:
  - area: efsv2
  - area: storage
  - area: sdk
  - area: client
source: IQLabs public documentation, SDK source, deployed Sepolia activity, and comparison against the current EFS v2 design set
---

# IQLabs — competitive and architectural notes for EFS

Durable external-reference note for future EFS protocol, SDK, client, storage-tier, and demo-application design passes. This is **not** an adopted decision or an implementation task.

## Executive read

IQLabs is a competitor at the product and developer-attention layer: it offers on-chain files/data, JSON tables, encrypted/social application primitives, and an on-chain Git product. It is not a full protocol-equivalent to EFS.

The useful shorthand is:

- **IQLabs:** an on-chain storage/database service plus a Git application.
- **EFS:** a permanent filesystem/evidence substrate combining storage with durable identity, provenance, reader-controlled policy, portable signed records, and an OS/client security model.

IQLabs has found a cheaper and simpler route to a narrower product. EFS should take the product pressure seriously without importing the weaker parts of its architecture.

No formal IQLabs/EFS relationship or integration was found in either project's current public material.

## What was inspected

- [IQLabs documentation](https://iqlabs.mintlify.app/), especially its Ethereum SDK and On-Chain Git pages.
- The public `IQCoreTeam/iq-ethereum-sdk` source, including `writer/code_in.ts`, `reader/txchain.ts`, `writer/iqdb.ts`, its ABI, and constants.
- The deployed Sepolia contract's public transactions for representative gas and transaction-flow checks.
- The current EFS direction in [[efsv2/README]], [[efsv2/human-overview]], and [[efsv2/large-file-uploads]].

The IQLabs material was still explicitly draft/0.x and its Ethereum deployment did not include Ethereum mainnet when reviewed. Treat it as live prior art and product evidence, not a security- or century-architecture authority.

## Architecture in one page

### Ethereum data path

IQLabs places file/row payloads in transaction calldata. A contract stores current tail pointers and database/user metadata. Readers call `eth_getTransaction`, parse the calldata, and walk backward through linked transaction hashes.

For a file upload:

1. Small data is placed inline in a `userInventoryCodeIn` call.
2. Larger data is split into 850-byte string chunks and packed into `sendCode` transactions of up to roughly 96 KB payload each.
3. An inventory transaction records the file metadata and data-chain tail.
4. A second transaction advances the user's current tail because the first transaction cannot know its own transaction hash while executing.

Tables and connection histories use the same shape: write calldata, then update a current tail pointer. The contract adds table definitions, creator/writer permissions, ERC-20/ERC-721 write gates, social-connection state, fees, and indexes for selected discovery operations.

### On-chain Git path

The Git product stores blobs, a per-commit path tree, and commit rows. Its strongest product ideas are local commit versus remote push, content deduplication, resumable/checkpointed upload, wallet-free public clone, and a gateway cache with RPC fallback.

## Is it cheaper?

**Yes for one narrow guarantee: putting bytes into transaction history is cheaper than putting bytes into persistent, contract-readable state. No for the unqualified product claim.**

On Ethereum after [EIP-7623](https://eips.ethereum.org/EIPS/eip-7623), a data-heavy transaction has a floor of 10 gas per zero calldata byte and 40 gas per nonzero byte. Persistent contract code costs roughly 200 gas per deposited byte before creation and application overhead. For arbitrary raw bytes, calldata therefore has a rough same-chain byte-cost advantage on the order of 4–5x over SSTORE2/code storage, not 2,000x. Base64 encoding and ABI/string overhead narrow the advantage; execution and extra transactions complicate it further.

Observed small IQLabs writes were not one cheap action: the content call plus tail-pointer update was roughly 100k gas before its configurable protocol fee. Large files add multiple calldata transactions. Its Ethereum mainnet price is unknown because it was not deployed there when reviewed.

The fair comparison is by guarantee:

| Storage class | Relative cost | Guarantee |
|---|---:|---|
| Calldata/history | Low | Chain-committed historical publication; not later EVM-readable; retrieval depends on preserved transaction bodies |
| Contract code / SSTORE2 | Higher | Persistent state and later contract-readable bytes |
| Ordinary storage slots | Highest for bulk bytes | Mutable, directly contract-readable state |
| IPFS/Arweave mirror | Minimal EVM pointer cost | External availability with content verification according to transport |

EFS already proposes both calldata history and SSTORE2/state tiers in [[efsv2/large-file-uploads]]. IQLabs's cost advantage is therefore not a unique primitive; it is evidence that EFS must implement and clearly expose its cheaper history tier rather than making state-resident storage the only visible "on-chain" choice.

### The durability trade

Calldata is consensus history, not current state. The EVM cannot read arbitrary old transaction calldata. Ordinary readers rely on RPC providers or archives retaining and serving block bodies. [EIP-4444](https://eips.ethereum.org/EIPS/eip-4444) is stagnant rather than an imminent change, but it documents the long-term pressure toward pruning old bodies and serving history out of band.

Therefore "stored on-chain" must not collapse these distinct claims:

- included in authenticated history;
- still readily retrievable from ordinary RPCs;
- reconstructable from current state;
- readable by a smart contract;
- independently mirrored and monitored.

## What EFS should learn and borrow

### 1. Make storage guarantees legible

Expose user-facing choices by capability, not implementation jargon:

- **cheap historical publication**;
- **contract-readable permanent state**;
- **externally mirrored durable content**;
- **replicated across authority/storage domains**.

Price and grade them separately. Never let one generic "on-chain" badge imply all four.

### 2. Match the Git/outbox ergonomics

Good ideas to carry into the EFS SDK and OS outbox:

- draft/commit locally, push later;
- checkpoint after each successfully uploaded object/chunk;
- resume without repeating paid work;
- content deduplication before upload;
- read/clone without requiring a wallet;
- gateway/cache acceleration with direct-source fallback;
- explicit upload-speed and concurrency controls.

### 3. Preserve EFS's stronger one-signature design

IQLabs hides chunking but still requires a signer for multiple transactions. EFS's proposed signed manifest is stronger: one user signature commits every chunk, while arbitrary relayers submit proof-bearing chunks in parallel and resume through a presence bitmap.

That is a real differentiator. Keep the honest claim narrow: one authorization, not one transaction, free completion, or guaranteed funding.

### 4. Use on-chain Git as a benchmark application

Git is a good joined-system pressure test because it requires:

- immutable content-addressed objects and deduplication;
- mutable branch/tag heads;
- trees, filenames, and directory traversal;
- provenance and commit authorship;
- incremental fetch and clone;
- large histories and occasional large blobs;
- hosted-site derivation from a repository snapshot.

EFS should be capable of an equivalent application without freezing Git-specific concepts into the kernel. It is a better demo and benchmark than a toy file upload.

### 5. Use gateways as accelerators, never correctness roots

A multi-gateway cache with raw RPC and mirror fallback is pragmatic. EFS should race/cache state snapshots, RPC, Arweave, IPFS, and other mirrors while verifying the returned bytes and evidence against previously authorized commitments.

### 6. Benchmark complete user journeys

Marketing comparisons should include total gas, protocol fees, transaction count, wallet prompts, failed/retried work, upload time, retrieval dependencies, verification, and contract readability. Per-byte gas alone is insufficient.

## What EFS should not copy

### Transaction-hash linked lists

The transaction hash is encoded as a string and histories are traversed sequentially through `eth_getTransaction`. This is string-heavy, O(history), latency-sensitive, and dependent on archive/history service. EFS should continue to prefer precomputable typed IDs, bytes32 commitments, bounded state indexes, and independently verifiable exports.

### Two-transaction tail updates

The write-then-pointer-bump pattern exists because a transaction cannot know its own hash. It doubles the base-transaction cost for small writes and introduces a serial tail/race point. EFS envelopes and object IDs should remain known before submission so admission and indexing can be atomic or intentionally batched.

### History-only permanence claims

History publication is useful and cheap, but it needs independent preservation, proofs/verification, health checks, and honest degradation when old RPC bodies disappear. EFS's state tier and preservation layer should remain distinct.

### Monolithic application semantics in the permanent core

The IQLabs contract combines storage, databases, social connections, token gates, mutable fees, and owner administration. That is convenient for an application backend but a poor century-kernel boundary. EFS should keep app-specific tables, social models, gates, and marketplace economics outside the neutral kernel.

### Wallet-signature-derived archive encryption roots

Deriving a deterministic encryption key from a wallet signature couples confidential archives to wallet behavior, wallet loss, rotation, and recovery. EFS should preserve its separation between principal/KEL recovery, transaction execution, encryption recovery, personal-policy recovery, and funds recovery.

### Mutable protocol-owner economics

Relayer, storage, and preservation markets may be useful, but configurable owner fees should not become part of the neutral EFS kernel.

## Recommended future benchmark

Before the next storage-tier decision, run the same payloads through:

1. IQLabs-style calldata/history;
2. EFS tier-2 calldata with its actual manifest and commitment overhead;
3. EFS tier-0 SSTORE2/state with proof verification and bitmap overhead;
4. Arweave and IPFS/Filecoin mirror flows.

Test at least 1 KB, 100 KB, 1 MB, and a repository-shaped workload of many deduplicated small objects. Measure:

- total gas and native-token cost;
- platform/protocol fees;
- number of transactions and user signatures;
- elapsed time and throughput;
- failure/retry and cross-account resume behavior;
- read latency from a normal RPC, gateway, and local verifier;
- ability to verify without trusting the gateway;
- current-state reconstruction;
- smart-contract readability;
- fresh-client recovery after the original service disappears.

The decision question is not "which is cheapest?" It is **the cheapest implementation for each explicitly promised guarantee**, and whether the product communicates the downgrade when a user chooses a weaker tier.
