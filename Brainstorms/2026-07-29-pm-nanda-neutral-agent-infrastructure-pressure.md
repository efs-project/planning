---
agent: pm
date: 2026-07-29
status: reference
anchors:
  - area: efsv2
  - area: agents
  - area: preservation
  - area: apps
  - area: sdk
  - area: identity
source: James product-goal steering, the local NANDA corpus, prior Codex research, and current primary sources
---

# NANDA-compatible neutral agent infrastructure — product-pressure brief

Strategic compatibility and product-pressure brief, not an adopted EFS
architecture, an MIT/NANDA commitment, or a new delivery milestone.

## Executive read

James may want the future EFS AI platform to help Project NANDA build an open
"internet of agents" by supplying credibly neutral infrastructure beneath
replaceable directories, skill hosts, evidence services, and agent runtimes.

This is a strong **downstream goal and architecture benchmark** for EFS. It is
not a reason to put all NANDA activity on Ethereum, make NANDA an EFS kernel
dependency, or create EFS-only versions of Agent Skills, A2A, MCP, AI Catalog,
or NANDA records.

The useful neutrality claim is:

> A provider can publish an agent, service, skill, or data record; users can
> find and verify it; and another operator can reproduce the directory,
> artifacts, history, and evidence without trusting one NANDA- or EFS-operated
> database.

The middlemen do not disappear. Fast indexes, search engines, gateways, test
runners, curators, OAuth brokers, and hosted runtimes remain useful. EFS should
make their authority limited, their claims auditable, and their replacement
possible.

## The fundamentals in one flow

```text
Publication: provider source → immutable release → provider/community catalog
                                      ↓
                         NANDA Index exact lookup
                          or plural catalog search

Evidence: Town / NEST / independent testers
                                      ↓
                 signed claims about an exact release or endpoint

Use: agent-side resolver verifies mapping + artifact + evidence
                                      ↓
                   asks permission, then connects or installs
                                      ↓
           remote agent / API / MCP / sandboxed local skill runs
```

EFS can cross-cut the flow with stable authority, immutable artifacts, signed
history, portable evidence, plural mirrors, and reconstructible indexes.
Ethereum is most useful where shared authority and public ordering matter.
Ordinary infrastructure should still handle generation, search, caching,
serving, secrets, and execution.

## Keep the NANDA pieces distinct

NANDA is an evolving research initiative and ecosystem, not one settled
protocol or one registry. Its papers, current repositories, public sites, and
live deployments describe different generations. Recheck implementation facts
before making an external claim.

| Piece | Current useful model | Important boundary |
|---|---|---|
| **NANDA initiative** | Research and prototypes for identity, discovery, communication, authorization, provenance, privacy, coordination, markets, and governance across independent agents | Not one production stack and not an EFS partnership |
| **NANDA Index v2** | A first-hop switchboard: organization/domain/email/URN → AI Catalog, DNS-AID path, or Agent Card host | It does not host agents or releases; its current native path still reads one PostgreSQL-backed public service |
| **AI Catalog** | A typed, nestable JSON catalog for agents, MCP servers, skills, datasets, and other AI artifacts, with optional version, publisher, and trust metadata | The format does not itself prove provider control, enforce immutable releases, revoke compromised releases, install code, or choose trust policy |
| **Nanda Town core** | A local, single-process protocol simulator and conformance-test rig with 12 replaceable layers | Its default registry, auth, trust, and DataFacts plugins are testing scaffolds, not durable distributed infrastructure |
| **Town SkillMD site** | A hosted submission and browsing gallery for skill Markdown, URLs, and GitHub sources | Listing is not provider ownership, immutable publication, approval, safe installation, or permission to execute |
| **NEST** | Publicly presented as a live exchange, sandbox, testnet, registry, and deployment path | Its long-term boundary with a future hosted Town mode is not yet clear |
| **DataFacts** | Metadata about available data, its location, freshness, authenticity, provenance, and access | It describes bytes; it is not durable byte storage |
| **Agent-side resolver/runtime** | The consumer that discovers, verifies, selects, asks permission, obtains credentials, connects or installs, sandboxes, updates, and audits | This is the least complete and most security-critical part of the current story |

Do not use "the NANDA registry" without naming which function is meant. The
Index, a provider catalog, Town's in-memory agent registry, the SkillMD
database, and DataFacts are different systems.

## What EFS could contribute

### 1. Neutral agent and release authority

EFS should be able to represent stable provider, agent, service, repository,
and release identities independently of:

- the current host URL or NANDA-operated service;
- an ENS name or expiring web domain;
- one control key, wallet, contract address, or chain deployment; and
- one artifact carrier such as Git, OCI, IPFS, HTTPS, or EFS.

Control needs delegation, threshold authority, key rotation, recovery,
transfer, expiry, and revocation. A provider's signed publication, control of a
domain, and a curator's claim that the publisher represents a company remain
separate evidence.

This pressures KEL/actor work and generic mutable-reference semantics. It does
not justify minting NANDA-specific kernel identities.

### 2. Immutable, portable agent artifacts

The credibly neutral Git workload should support repositories and immutable
releases containing open Agent Skills, `AGENTS.md`, tests, adapters, schemas,
permissions, source locks, and documentation.

A release should:

- pin a complete multi-file closure, not a mutable branch or URL;
- retain the native Git/Agent Skill/OCI representation where applicable;
- bind mirrors on different carriers to one canonical artifact root;
- preserve dependency, license, provenance, and requested-capability metadata;
- support mutable channels such as `stable` or `latest` without making the
  underlying release mutable; and
- remain exportable and installable without an EFS-only package format.

The outer EFS record can add publisher authority, release history, mirrors,
evidence, advisories, supersession, and retention commitments. It should not
rewrite the underlying interoperability formats.

### 3. Shared schemas and resolver validation

The portable-schema/validator work should be able to carry and validate common
formats such as AI Catalog entries, Agent Cards or AgentFacts, Agent Skill
manifests, DataFacts, releases, permission declarations, test reports, and
security advisories.

Designers should preserve:

- globally findable schema identities and versions;
- exact validator/resolver identity and version;
- portable validity evidence;
- deterministic validation where possible;
- explicit compatibility and migration relationships; and
- the distinction between structurally valid, provider-authorized, tested,
  currently reachable, recommended, and safe for one user's policy.

This is a direct place to keep the best EAS behavior—shared schemas and
resolver-checked claims—without making an EAS UID or one chain deployment the
portable record identity.

### 4. An evidence graph, not a universal reputation score

Independent parties should be able to publish signed statements about the exact
artifact or endpoint they evaluated:

- provider publication and domain/control claims;
- build and generation provenance;
- Town deterministic-test results;
- live endpoint and interoperability tests;
- dependency, license, vulnerability, and prompt-injection scans;
- uptime and availability observations;
- curation or inclusion under a named policy;
- provider yanks and security advisories; and
- authority revocations or transfers.

Claims need issuer, subject, schema, time, optional expiry, environment, result,
evidence location, signature, and supersession/revocation semantics.

EFS should preserve common evidence. Different NANDA, enterprise, community,
and personal lenses can decide what it means. One permanent global reputation
number would mix unlike claims, invite Sybil gaming, and turn policy disputes
into protocol state.

### 5. Canonical evidence, plural indexes

Fast exact resolution, text/vector search, ranking, spam filtering, and
availability checks should stay off-chain. A NANDA-operated index can be the
excellent default without being the only possible index.

Neutrality requires enough public state or authenticated snapshots for another
operator to:

- enumerate current and historical records;
- verify provider authority and every accepted transition;
- detect stale, replayed, reordered, omitted, or equivocated records;
- rebuild the same factual corpus after reorg and checkpoint rules;
- publish a different search/ranking/moderation policy over it; and
- serve resolution without an EFS-operated API, domain, database, or signer.

The goal is not "put NANDA Index queries on-chain." A better shape is signed
portable mappings and histories, periodic authenticated checkpoints where
useful, and many fast caches/resolvers.

### 6. Agent-side resolver and EFS OS safety

Artifact portability does not make an agent integration safe. A consumer-side
resolver or EFS OS agent runtime still needs to:

1. discover an exact service or search plural catalogs;
2. choose a compatible version and execution profile;
3. verify digest, publisher authority, current status, and required evidence;
4. show capability, permission, network, data, and OAuth scope changes;
5. obtain user or organization approval;
6. connect to a remote endpoint or install into a sandbox;
7. broker secrets without exposing them to the artifact or public graph;
8. enforce network, filesystem, process, CPU, memory, and time limits;
9. log use and support emergency disable and rollback; and
10. apply an explicit update policy.

This aligns with the EFS OS third-party-app model: untrusted code receives
capabilities, not ambient authority. An executable Agent Skill, Wasm app, MCP
server, and remote A2A agent require different confinement and consent, even if
one catalog can describe all of them.

User → agent → subagent delegation also has to attenuate rather than amplify
authority. A delegated task should carry explicit scopes, recipients, resource
and spending budgets, time/expiry, onward-delegation rules, revocation, and an
auditable parent chain. An agent must not be able to delegate a capability it
does not hold, copy a secret instead of delegating a scoped handle, or turn a
one-task grant into durable ambient access. This is a generic KEL/actor,
capability, and OS-runtime pressure—not a NANDA-specific primitive.

### 7. DataFacts and agent data

DataFacts is a particularly direct integration seam. EFS can supply:

- durable content or manifest roots behind a DataFacts record;
- mirror and retention evidence;
- provenance-parent graphs;
- signed freshness and supersession;
- access-policy references; and
- portable verification receipts.

Private datasets, credentials, personal memory, chats, embeddings, and agent
context must not become public merely because public skills and catalogs are
useful. They require encryption, selective disclosure, scoped capabilities,
retention controls, and honest limits on revocation and metadata leakage.

### 8. Availability, guest access, and walk-away recovery

Public catalogs, agent cards, skills, evidence, and code should use the fast
guest/unauthenticated deep-link path. Reading a public skill or verifying an
agent should not require a wallet, account, full OS boot, or chain RPC round
trip. This does not promise network anonymity.

Content addressing alone is not availability. The platform needs plural
mirrors, explicit retention evidence, failure behavior, and a clean-room
reconstruction test after every official EFS/NANDA-facing service is removed.

## What EFS should not try to become

- the mandatory transport for A2A, MCP, HTTPS, or NLWeb;
- the only AI Catalog, NANDA Index, search engine, or curator;
- the package CDN for every byte or the execution host for every agent;
- a public secret vault, OAuth broker, or store for private memory by default;
- a claim that valid or popular code is safe to run;
- a universal on-chain reputation or agent-quality score;
- an Ethereum transaction for every lookup, message, test, or skill update;
- a duplicate of Town, NEST, or NANDA's research program; or
- an implied MIT/NANDA partnership before one exists.

## Requirements for the coordinated v2 recut

This possible goal should be used as a pressure test, not a source of new
NANDA-specific kernel types:

1. Can one stable identity survive a host move, domain change, controller
   rotation, carrier change, and future EFS deployment?
2. Can a controller delegate publication narrowly and revoke or recover it
   without rewriting history?
3. Can a release pin a complete multi-file/dependency closure and round-trip
   through ordinary Git or OCI tooling?
4. Can signed mutable pointers reject replay, rollback, equivocation, and stale
   authority-policy epochs?
5. Can portable schemas and named validators distinguish shape validity from
   authorization, evidence, and reader policy?
6. Can claims from provider, tester, scanner, curator, and availability
   operator coexist without one issuer becoming authoritative for all facts?
7. Can independent indexers enumerate and reconstruct the corpus, including
   yanks, revocations, expiries, and supersession?
8. Can serving and moderation policy hide material locally without rewriting
   shared validity or pretending durable public history was erased?
9. Can an unauthenticated guest inspect public artifacts and evidence quickly
   while authenticated writes and private data remain capability-gated?
10. Can EFS OS show meaningful permission and update diffs before an agent
    connects to a service or runs code?
11. Can agent-to-agent delegation attenuate scope, budget, lifetime, and onward
    delegation; remain revocable and auditable; and prevent secret copying or
    authority amplification?
12. Can a provider publish through NANDA-compatible formats without adopting
    EFS, while optionally adding EFS/Ethereum-backed proof?
13. Can the complete path be restored by an independent operator after all
    official services disappear?

Relevant existing pressure briefs:

- [[2026-07-29-pm-credibly-neutral-git-forge-and-agent-artifacts]]
- [[fable-handoff-portable-schemas-and-validators]]
- [[fable-client-v2-handoff]]
- [[system-surfaces]]
- [[threat-model]]

## A bounded future proof

When the underlying v2 primitives are ready, one end-to-end proof would be more
valuable than building a general registry:

1. ingest one real OpenAPI, MCP, A2A, or Agent Skill source;
2. produce and publish one immutable Git/OCI-compatible release;
3. bind it to a provider-controlled stable identity and mutable channel;
4. run a Town scenario against that exact digest and publish the test evidence;
5. expose interoperable AI Catalog metadata;
6. make a NANDA Index-compatible record point to the provider catalog;
7. resolve it through two independently operated indexes/caches;
8. inspect permissions and connect or install through a confined agent runtime;
9. yank one release, rotate one authority, and prove stale/replayed state fails;
10. remove the official service and reconstruct the working path from exports.

Success would demonstrate that EFS can help neutralize agent infrastructure
without requiring NANDA or every provider to become Ethereum-native.

## Threats a later deep dive must break

- namespace squatting, domain expiry, and false company affiliation;
- compromised, rotated, or malicious publisher keys;
- stale signed cards, replayed releases, rollback, omission, and equivocation;
- malicious skills, adapters, prompt injection, dependency substitution, and
  permission expansion;
- archive bombs, SSRF, build-time escape, and hostile generated code during
  onboarding;
- fabricated test evidence and overclaiming what a Town test proves;
- Sybil spam, ranking manipulation, censorship, and inconsistent moderation;
- retention griefing and endpoints or mirrors silently disappearing;
- secret, private-memory, or personal-data leakage into public artifacts;
- confused-deputy failures across agent delegation and OAuth scopes; and
- chain, contract, indexer, gateway, and funding failures.

## Current-source notes

- [MIT Media Lab NANDA overview](https://www.media.mit.edu/groups/nanda/overview/)
  — current research frame for identity, discovery, communication,
  authorization, provenance, privacy, coordination, markets, and governance.
- [Project NANDA](https://projectnanda.org/) — public roadmap and current
  ecosystem framing.
- [NANDA Index v2](https://github.com/projnanda/nanda-index-v2) — current
  first-hop switchboard and PostgreSQL-backed implementation.
- [AI Catalog](https://ai-catalog.io/) — current typed, nestable discovery
  format and optional trust layer.
- [Nanda Town](https://nandatown.projectnanda.org/) and its
  [DataFacts layer](https://github.com/projnanda/nandatown/blob/main/docs/layers/datafacts.md)
  — current protocol-testing surface.
- [James's current-state synthesis](https://github.com/JamesCarnley/nanda/blob/main/research/current-state.md),
  [service-onboarding design](https://github.com/JamesCarnley/nanda/blob/main/design/service-onboarding.md),
  and
  [Ethereum/EFS design](https://github.com/JamesCarnley/nanda/blob/main/design/ethereum-efs.md)
  — local July 28 research and proposed architecture; these are James's
  working proposals, not MIT/NANDA decisions.

## PM routing

- Treat this as a **reference and downstream interoperability target**, not a
  second top-level project or milestone.
- Add it to the existing Git/agent-artifact deep dive because neutral skill
  releases are the shared substrate.
- Feed its generic pressures into identity/KEL, portable schemas and
  validators, evidence/lenses, package closure and availability, guest
  reads, and EFS OS capability work.
- Later, commission a dedicated NANDA/EFS architecture pass or the bounded
  proof above. It should return concrete integration choices and gaps, not a
  mandate to rebuild NANDA.
- No James decision is needed merely to preserve this possible goal.
