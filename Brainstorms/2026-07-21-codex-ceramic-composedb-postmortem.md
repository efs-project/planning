---
agent: codex-gpt-5
date: 2026-07-21
status: reference
anchors:
  - area: efsv2
  - area: storage
  - area: replication
  - area: identity
source: Ceramic official deprecation material and the existing EFS Ceramic/IPLD autopsy, reviewed 2026-07-21
---

# Ceramic and ComposeDB — lifecycle postmortem for EFS

This is a concise future-design pointer, not a duplicate of the detailed autopsy at `Reviews/2026-07-02-substrate-corpus/research-ceramic-ipld.md` and not an adopted EFS decision.

## Executive read

Ceramic is the most relevant EFS cautionary case because it combined chain-free content identifiers, signed append-only events, decentralized synchronization, mutable streams, an Ethereum anchoring service, and a GraphQL application layer—then its steward pivoted away.

In April 2025 the team deprecated `js-ceramic` and ComposeDB, shifted focus to Recall, and prepared `ceramic-one` as a standalone open-source implementation with self-anchoring. The result demonstrates that open source and cryptographic verifiability do not by themselves produce operational independence.

## The transferable failure pattern

Ceramic split one logical database across several durability and authority domains:

- signed events and stream state in the Ceramic/IPLD network;
- availability through nodes, gateways, and IPFS;
- ordering/timestamps through an allowlisted Ceramic Anchor Service and Ethereum proofs;
- practical queries through ComposeDB/indexing infrastructure;
- identity agility through DID/session machinery.

Each layer could be described as decentralized in isolation. The joined system still depended on funded operators, available witnesses, live indexing, and complex client key/session behavior. When the steward withdrew, users possessed code and some signed data but not necessarily a turnkey service or migration path.

## What EFS should retain from the design

- Chain-free salted object identity and signature-authenticated authorship are proven patterns.
- Expiring delegations to session keys are useful above a durable root identity.
- Range-based set reconciliation is useful for partial, interest-scoped replication.
- Batched Merkle anchoring is useful as a not-after timestamp or inventory checkpoint.
- Content-addressed portable event/export formats reduce migration friction.

## What EFS must guard against

### An anchor without durable witnesses

A root on a chain proves little if the leaves and proof paths disappear. Any EFS checkpoint witness must be preserved at least as strongly as the content whose history it is meant to prove.

### A clock presented as consensus

Anchoring proves that revealed data existed before a time. It does not prove that all competing data was revealed. EFS must not use an off-chain anchor timestamp to manufacture globally final "current state" against a withholding author.

### Open source presented as walk-away readiness

The real test is not whether repositories are public. It is whether an unrelated operator can reconstruct records, identity, indexes, bytes, proofs, and application behavior from documented artifacts without the original service.

### A free service with no replacement economics

Subsidized anchors, gateways, pinning, or indexers last as long as the sponsor's strategy. EFS must either keep them optional and replaceable or give them a credible funding/operation path outside the kernel.

### Reader verification that requires running the whole stack

If the only alternatives are trusting a hosted indexer or operating a complex node, most users trust the indexer. EFS needs ordinary fast reads, inspectable evidence, and a separate clean-room reconstruction path.

## Required future-design gate

Every proposed external dependency should answer a Ceramic test:

1. If its steward shuts down in 30 days, what exact EFS functions stop?
2. Can a new operator replace it from public specs and exported state?
3. Does the replacement require privileged keys, allowlists, historical APIs, or unavailable witnesses?
4. Can users export before the shutdown if the original UI is already gone?
5. Is the dependency an accelerator, an availability provider, or an authority—and does the UI say which?

## Sources and deeper analysis

- Ceramic deprecation announcement: https://blog.ceramic.network/the-future-of-ceramic-focusing-on-recall/
- Ceramic/Textile/Recall transition: https://blog.ceramic.network/ceramic-is-joining-textile/
- Detailed EFS autopsy: `Reviews/2026-07-02-substrate-corpus/research-ceramic-ipld.md`
