# EFS Grant Packet

Reusable material for grant applications. Adapt this to each funder's language and constraints.

## One-line description

Ethereum File System (EFS) is Ethereum-native public infrastructure for durable paths, provenance, mirrors, and verifiable data references across Ethereum and EVM L2s.

## Short description

Ethereum File System (EFS) is a credibly neutral, open-source public good that organizes data on Ethereum and EVM L2s. It provides a shared onchain namespace and index that developers, agents, and communities can extend without relying on a single app, server, or admin.

EFS uses Ethereum attestations and simple resolver patterns to connect stable paths to data, mirrors, tags, lists, redirects, and lens-scoped views. Storage backends such as IPFS, Filecoin, Arweave, HTTP, and future transports can be represented as mirrors; EFS focuses on the neutral coordination layer above them.

## Why Ethereum needs this

- Links rot, apps disappear, APIs shut down, and communities lose shared knowledge when platforms fail.
- Ethereum has strong settlement and identity primitives, but lacks a widely shared file/path/data index that is neutral, composable, and durable across applications.
- Developers need a simple way to publish and resolve public data without each app inventing its own registry.
- Agents need verifiable sources, stable paths, and provenance records they can inspect without trusting a centralized API.
- Public-good datasets need more than storage: they need discoverability, curation, mirrors, update history, and accountable stewardship.

## Core claims

- **Credibly neutral:** no admin keys, no global delete button, no app-owned namespace as the only path to discovery.
- **Open source:** grant-funded outputs should remain public and reusable.
- **Composable:** paths, data, mirrors, tags, lists, redirects, and lenses can be reused by multiple apps.
- **Storage-agnostic:** EFS does not need to be the storage network; it can point to and verify many storage backends.
- **Builder-focused:** EFS is primarily infrastructure for developers, agents, curators, and public-good maintainers.

## Do not say

- Do not pitch EFS as "another storage network" or a replacement for IPFS, Filecoin, Arweave, or HTTP.
- Do not use consumer-cloud analogies such as "Dropbox on Ethereum" or "Google Drive onchain."
- Do not claim permanent storage unless the proposal names the backend and persistence guarantee.
- Do not say "canonical truth layer." Use "lens-scoped, attestable views" or "verifiable claims with explicit attesters."
- Do not lead with token, VC, or speculative-market language unless a funder explicitly asks about sustainability mechanics.
- Do not call EFS critical infrastructure for security funders until there is adoption/dependency evidence.

## External links

- [EFS KarmaHQ page](https://www.karmahq.xyz/project/ethereum-file-system/about)
- [EFS website](https://efs.eth.limo)
- Pitch deck: add exact URL from KarmaHQ quick link.
- Demo video: add exact URL from KarmaHQ quick link.

## Current public framing from KarmaHQ

> EFS is a credibly neutral, open source, public good that organizes data on Ethereum and its EVM L2 chains.

Use this as the canonical public-good framing, but sharpen per funder.

## Funder adaptation checklist

Before submitting, answer these in the proposal draft:

- What exact funder language does this proposal mirror?
- What would make this funder proud to have funded EFS?
- What evidence would let a reviewer verify the claim in under five minutes?
- Which EFS claim should be removed because it is not relevant to this funder?
- What is the smallest milestone that would make the funder proud to have funded it?
- How is the requested amount justified by concrete outputs?
- What reporting or public accountability surface will the funder get?
- What happens after the grant ends: maintenance, public updates, or next funding rail?

## Five-minute reviewer proof

Each serious draft should link a compact proof bundle:

- demo URL;
- public repository;
- KarmaHQ or GAP page;
- pitch deck or demo video, if relevant;
- one transaction, live EFS record, public dataset, or inspectable artifact;
- one sentence saying what the reviewer should verify.

## Funder-specific angles

### Ethereum Foundation ESP

Frame EFS as Ethereum-native public infrastructure:

- open-source builder tooling;
- durable public data/path primitive;
- standards-adjacent work around verifiable data references;
- agent-readable public-good infrastructure;
- ecosystem utility beyond a single app or company.

Ask Office Hours for routing and fit before submitting to a Wishlist/RFP.

### Filecoin Foundation

Frame EFS as complementary to IPFS/Filecoin:

- EFS records Ethereum-native paths, mirrors, provenance, and lens-scoped views.
- Filecoin/IPFS provide content addressing and persistence.
- EFS can make Filecoin-backed content easier for Ethereum developers and agents to discover, verify, and compose.
- Avoid any wording that makes EFS sound like a competing storage market.

### Gitcoin / Giveth / Octant

Frame EFS as a digital commons:

- public-good infrastructure;
- transparent milestones;
- visible demo and public repos;
- community support;
- credible path to ongoing public-good maintenance.

### Base / Optimism / Superchain

Use only when EFS has Superchain-specific deployment or evidence:

- Base/Superchain contracts or resolver;
- developer tooling;
- open-source libraries;
- usage, stars, forks, transactions, integrations, or demos on the target ecosystem.

## Reusable milestone menu

These are examples, not commitments.

| Milestone | Output | Evidence |
|---|---|---|
| Grant packet and public profile cleanup | Updated Karma/Giveth/Gitcoin-ready project profile and public pitch | Profile links, public updates |
| Resolver demo | Live demo resolving EFS paths to mirrored content | Demo URL, repo, transaction links |
| Filecoin/IPFS mirror integration | EFS record flow for IPFS/Filecoin-backed content | Docs, code, example dataset |
| SDK read path | Developer API for resolving paths, mirrors, and provenance | Package, docs, tests |
| Public-good dataset pilot | Curated dataset published through EFS with mirrors and provenance | Dataset page, EFS records, update log |
| Grant accountability updates | Karma GAP milestones and progress posts | Karma links |

## Budget bands

Use concrete milestone bundles instead of broad operating asks.

| Ask size | Good fit | Example bundle |
|---|---|---|
| USD 5k-10k | Lightweight ecosystem grants, microgrants, profile cleanup | Public profile cleanup, demo polish, one small integration note, Karma/GAP milestone setup |
| USD 25k | Narrow tooling/RFP work | Resolver demo, docs, example records, small public-good dataset pilot |
| USD 50k | Filecoin/IPFS-style integration or SDK slice | Mirror/provenance integration, SDK read path, tests, docs, example dataset |
| USD 100k+ | Larger infrastructure/security/public-interest work | Multi-milestone build, security review prep, public dataset partner, reporting cadence, maintenance runway |

## Budget snippets

Use milestone budgets rather than broad operating asks where possible.

| Budget item | Notes |
|---|---|
| Protocol and SDK engineering | Contracts, SDK, integration code, tests, docs |
| Demo and public dataset work | Publish example data and keep it inspectable |
| Documentation and onboarding | Builder docs, grant reports, tutorials |
| Audit/security review | Appropriate once contracts or grant-funded flows are stable |
| Community/public-good operations | Public updates, maintainer coordination, profile upkeep |

## Evidence checklist

- [ ] Public repository links.
- [ ] Demo URL.
- [ ] KarmaHQ page updated.
- [ ] Karma GAP or equivalent milestone/update link, if relevant.
- [ ] Pitch deck URL.
- [ ] Demo video URL.
- [ ] One inspectable transaction, record, dataset, or live artifact.
- [ ] One-sentence reviewer verification instruction.
- [ ] Current milestones.
- [ ] Clear budget table.
- [ ] License statement.
- [ ] Team/member list.
- [ ] Prior proposal history, including Octant rejection.
- [ ] Public update cadence.
