# EthStorage and GoE review corpus

**Date:** 2026-08-05
**Status:** supporting evidence for [`../2026-08-05-ethstorage-deep-dive.md`](../2026-08-05-ethstorage-deep-dive.md) and [`../2026-08-05-goe-deep-dive.md`](../2026-08-05-goe-deep-dive.md)
**Scope:** EthStorage Mainnet Alpha, `web3://`, W3Drive/dBlog, verified frontend delivery, GoE Git storage and transport, and the EFS integration/differentiation pressure test

#kind/review #status/done #repo/planning #topic/efsv2 #topic/storage #topic/git #topic/web3-url

## Contents

- [`network-architecture-and-economics.md`](./network-architecture-and-economics.md) — EthStorage's write, read, proof, payment, identity, upgrade, permissioning, licensing, audit, and live-alpha boundaries, with pinned primary sources.
- [`web3-flatdirectory-and-demos.md`](./web3-flatdirectory-and-demos.md) — what the 2022 talk, W3Drive, dBlog, `web3://`, FlatDirectory, and client-side frontend verification do and do not demonstrate.
- [`efs-comparison-and-gap-ledger.md`](./efs-comparison-and-gap-ledger.md) — the proposed EFS reason to exist, layer crosswalk, design pressure, OS boundary, kill criteria, and corrections future owning docs need.
- [`validation-program.md`](./validation-program.md) — storage-adapter benchmark, independent retrieval, proof observation, carrier migration, verified application closure, and full walk-away drill.
- [`../2026-08-05-goe-deep-dive.md`](../2026-08-05-goe-deep-dive.md) — the separate Git-on-Ethereum review requested by James: real workflow, gaps, security gate, reuse recommendation, and candidate portable Git-library boundary.

## Method

The pass used four evidence classes:

1. **Pinned source inspection:** official EthStorage docs, storage contracts, node, SDK, W3Drive, `web3://` samples, GoE contracts, GoE CLI, and the earlier `ethfs-git` design at the revisions linked throughout these reports.
2. **Published interfaces:** ERC-4804, EthStorage's current network/operator documentation, npm package metadata, the Mainnet Alpha announcement, the client-verification write-up, and the available Solidity audit.
3. **Dated live observation:** Ethereum contract calls, deployed-contract metadata, public monitoring, npm download counts, and bounded Sepolia GoE event reads on 2026-08-05.
4. **EFS crosswalk:** current v2 drafts and owner rulings were read as current planning state, while proposals, unbuilt mechanisms, and review recommendations remained explicitly non-canonical.

Three independent lanes separately checked protocol claims, application/GoE behavior, and EFS-history/routing. Their conclusions were then reconciled against source rather than accepted by majority vote.

## Evidence boundaries

- “Ethereum-aligned” or “onchain storage” does not mean ordinary Ethereum execution nodes retain or can synchronously read the payload.
- A provider proof is evidence that an authorized provider answered a selected challenge. It is not by itself a replica-count, operator-independence, complete-retrieval, latency, repair, or eternal-preservation proof.
- A contract or source review is not a full audit. No production system was stress-tested, and the EthStorage economics were not modeled over decades.
- Current Mainnet Alpha counts describe one deployed contract at one block. They do not measure physical encoded bytes, unregistered caches, total historic uploads, independent operators, users, or future capacity.
- A public demo proves an interaction path, not Dropbox/Twitter/GitHub product parity.
- GoE's observed Sepolia activity is evidence that the remote helper is exercised, not production adoption.
- GoE is a young cross-contract prototype; production use requires a source-linked release, exhaustive authorization/integration testing against the real storage ABI, migration procedures, and independent review.
- EFS v2 is an active draft corpus. This review may pressure-test or falsify it; it does not promote a design, select EthStorage, create a storage network, define the OS boundary, or authorize external outreach.

## Status semantics

This corpus is a point-in-time review record. Future designers should refresh mutable facts before depending on them, especially:

- provider permissioning and observed operator diversity;
- proxy/admin control and contract versions;
- node licensing and independent implementations;
- Mainnet Alpha usage, pricing, retrieval behavior, and audits;
- GoE releases, deployments, source fixes, and compatibility.

The durable part is the comparison method: keep identity and authority above storage placement; ask what a proof actually proves; preserve ordinary Git compatibility; require plural exit; and make every “permanent,” “onchain,” or “credibly neutral” claim pass a failure drill.
