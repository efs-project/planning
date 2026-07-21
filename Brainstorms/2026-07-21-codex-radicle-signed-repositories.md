---
agent: codex-gpt-5
date: 2026-07-21
status: reference
anchors:
  - area: efsv2
  - area: replication
  - area: identity
  - area: apps
source: Radicle Heartwood protocol and user documentation, reviewed 2026-07-21
---

# Radicle — signed repositories, replication, and canonical views

Durable prior-art note for future EFS replication, identity, collaboration, and Git-application design. This is not an adopted decision.

## Executive read

Radicle is the strongest nearby example of a **local-first, self-certifying collaboration system**. It extends Git rather than a blockchain: every participant keeps local repository data, peers gossip discovery metadata, Git transfers objects, and cryptographic signatures establish authorship and repository state.

It is not permanent storage. A repository remains available only while at least one reachable peer seeds it. Its value to EFS is architectural: signed views, user-held replicas, deterministic collaboration objects, and authority derived from repository contents rather than a hosting URL.

## Architecture

- Nodes have Ed25519 identities and act as both clients and servers.
- A repository ID derives from its initial identity document, making the repository self-certifying.
- The identity document names delegates and a signature threshold.
- Each peer's Git references live in its own namespace while all forks share the Git object database, allowing deduplication without collapsing authors' views.
- Nodes sign their full reference set under `rad/sigrefs` whenever it changes.
- A canonical default branch emerges when the identity document's delegate threshold points at the same commit.
- Gossip announces nodes, repository inventories, and signed-reference changes; Git's fetch protocol transfers the actual objects.
- Collaborative Objects encode issues, patches, reviews, and identity changes as signed Git commit DAGs folded in deterministic causal order.

Private repositories use selective replication and encrypted peer transport. The stored repository is not encrypted at rest, so an authorized peer or seed can read it.

## What EFS should borrow

### 1. Preserve individual views before deriving a canonical view

Radicle does not let one maintainer's branch overwrite everybody else's. Each peer keeps a namespaced view; policy derives a canonical branch afterward.

That maps closely to EFS's reader-sovereign lens:

- store claims/evidence without destructive merge;
- retain the author/source namespace;
- derive current/canonical state under explicit policy;
- make the policy result reproducible from the retained inputs.

### 2. Make repositories self-certifying, not location-certified

`https://host/user/repo` derives trust from a host. A Radicle RID plus identity history derives trust from the repository itself. EFS paths and application packages should similarly remain verifiable when fetched from any gateway, mirror, or copied venue.

### 3. Replicate social artifacts with the primary content

Issues and patches are not trapped in a separate SaaS database. This is a strong lesson for an EFS Git/forge benchmark: repository data, discussion, review, release metadata, and provenance must be exportable and independently useful together.

The kernel need not know Git or issue semantics. An application schema can encode those objects over generic records.

### 4. Separate discovery from transfer

Radicle's gossip plane says who appears to have what; Git performs negotiated content transfer; signatures verify the result. EFS replication tooling should preserve the same separation:

- inventory/discovery is cheap and untrusted;
- transfer is resumable and source-agnostic;
- acceptance verifies signed records and byte commitments;
- availability claims do not become authenticity claims.

### 5. Reuse proven content-transfer machinery where possible

Radicle gains packfiles, delta transfer, object negotiation, deduplication, and decades of Git tooling by composing with Git. EFS's Git benchmark should avoid rebuilding Git object transport merely to prove EFS can store bytes. EFS can anchor identity, policy, provenance, and optional durable placements while Git remains a transport/export format.

## What EFS should not copy

### Availability by hope

Interchangeable seed nodes reduce vendor lock-in, but no seed means no network retrieval. For EFS, peer seeding is a replication lane and health signal, not a century-preservation guarantee.

### Bootstrap defaults mistaken for decentralization completion

Known bootstrap nodes are pragmatic. They remain operational dependencies for discovery until clients learn other peers. EFS clients need configurable bootstraps, portable address books, direct peer import, and an explicit degraded/offline mode.

### Reader-side folding as the only fast path

Deterministically replaying COB histories is verifiable, but every reader pays storage/sync/compute or trusts an HTTP seed's rendered view. EFS should keep clean-room replay while also providing bounded canonical state reads and verifiable checkpoints.

### Selective replication described as encryption

Private Radicle repositories are protected by admission and encrypted transport, not encrypted storage. EFS must label selective disclosure, encrypted-at-rest content, and public commitments as different guarantees.

## Concrete EFS design questions

1. Should an EFS repository/application bundle preserve one namespace per signer or device before a lens derives a shared head?
2. Can an EFS lens policy be packaged like Radicle's identity document: self-contained, versioned, signed, and independently executable?
3. What is the EFS equivalent of signed refs: a compact signed inventory frontier that summarizes all named heads without becoming an authority shortcut?
4. Can Git packfiles or bundles be a standard EFS import/export carriage while EFS records supply chain-free authorship and storage placements?
5. What availability UI corresponds to "verified locally, currently seeded by N independent peers, durable mirror present/absent"?

## Recommended benchmark application

Implement a small EFS-backed forge prototype with repository import, branch heads, issues, patch review, clone/export, and two independent peers. Then remove every EFS-hosted service and prove that a fresh user can recover the repository and social history from an export plus any surviving mirror.

## Sources

- Radicle protocol guide: https://radicle.xyz/guides/protocol/
- Radicle user guide, including private repositories: https://radicle.xyz/guides/user/
- Radicle seeder guide: https://radicle.xyz/guides/seeder/
- Radicle FAQ: https://radicle.xyz/faq
