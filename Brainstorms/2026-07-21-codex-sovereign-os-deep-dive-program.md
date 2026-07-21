---
agent: codex-gpt-5
date: 2026-07-21
status: reference
anchors:
  - area: client
  - area: apps
  - area: sdk
  - area: efsv2
  - area: research
source: Research program commissioned by James after the EFS OS competitive-landscape review
---

# Sovereign OS competitive deep-dive program

Durable queue and common method for investigating systems adjacent to EFS OS. The purpose is not to collect feature lists. It is to extract architecture, product, security, organizational, and economic evidence that can strengthen EFS v2 and Client v2.

The current landscape synthesis is [[2026-07-21-codex-efs-os-landscape-and-economic-constitution]]. This program owns the remaining research detail; the Kanban card owns whether the program is receiving active attention.

## Research questions every dossier must answer

### Product reality

1. What useful task causes a normal user to return weekly?
2. Is the project a protocol, runtime, OS, application, hosted service, or some combination?
3. What is shipped, testnet/beta, demonstrated, specified, and merely planned?
4. What adoption, retention, ecosystem, and operator evidence is public?

### Runtime and app authority

1. Where does third-party code execute?
2. What process, browser, language, VM, container, or hardware boundary contains it?
3. What network, filesystem, DOM/pixel, clipboard, key, wallet, device, and local-data powers are ambient?
4. Are permissions install-time declarations, live capabilities, prompts, allowlists, audits, or convention?
5. Can a zero-power app be installed safely without central review?
6. Who owns trustworthy prompts, identity display, compositing, and recovery UI?

### Data and identity

1. What establishes object, author, application, package, and user identity?
2. Which state is local, peer-replicated, server-hosted, onchain, encrypted, content-addressed, or expiring?
3. Can conflicting views coexist, and who derives the canonical view?
4. Can users export and restore data, keys, relationships, permissions, and application state independently?
5. Does switching provider preserve identifiers, links, social relationships, and authority?

### Distribution, updates, and discovery

1. What is the package format and verification chain?
2. Who controls release keys, default catalogs, app stores, search/indexes, malware response, and automatic updates?
3. Can users pin, fork, roll back, and select independent publishers or curators?
4. What happens when an update publisher, catalog, bootstrap node, gateway, or discovery service disappears or is compromised?

### Network and operational reality

1. Which bootstrap, relay, signaling, indexing, RPC, gateway, sequencer, validator, storage, and time services are required?
2. Can a user actually self-host them? What hardware, bandwidth, NAT, uptime, and maintenance burden exists?
3. Where does the deployed topology concentrate despite protocol-level decentralization?
4. What failure modes appear under offline use, network partitions, hostile peers, stale caches, and lost devices?

### Economics, governance, and steward mortality

1. Who pays developers and infrastructure operators today?
2. What company, foundation, token treasury, investors, grants, subscriptions, hardware, hosting, fees, or cross-subsidy fund the project?
3. What powers follow the money: accounts, default hosting, catalogs, review, governance, release signing, sequencers, or protocol upgrades?
4. What organizational pivots, layoffs, insolvencies, shutdowns, governance conflicts, or abandoned components have occurred?
5. If the current steward disappears, what continues automatically, what can a competent community recover, and what ordinary users lose immediately?

### Evidence quality

Every material claim is labeled:

- **observed:** reproduced in a running system or code path;
- **documented:** stated in current primary documentation or source code;
- **reported:** stated by a credible third party or participant;
- **inferred:** reasoned from architecture or incentives;
- **unknown:** not established with available evidence.

Marketing pages may establish project intent and current claims, but not operational decentralization, security, adoption, or durability.

## Standard deliverables

Each project deep dive produces:

1. a dated durable dossier with primary-source links;
2. a one-page architecture and trust map;
3. a shipped/testnet/planned table;
4. an ambient-authority and privileged-key inventory;
5. a provider and bootstrap dependency inventory;
6. an economic/control-pressure analysis;
7. a failure and organizational-history timeline;
8. a clean export/provider-switch/company-gone test plan;
9. explicit **borrow / reject / watch / test in EFS** conclusions;
10. candidate changes or validation gates for EFS v2, Client v2, or the economic constitution—without silently changing a design.

Top-tier systems should also receive a hands-on lab report and at least one independent adversarial review of the first dossier.

## Priority waves

### Wave 0 — direct strategic neighbor

- [x] **Logos runtime/app/package/security workstream launched** — 2026-07-21.
- [x] **Logos blockchain/messaging/storage workstream launched** — 2026-07-21.
- [x] **Logos organization/funding/governance workstream launched** — 2026-07-21.
- [x] Integrate all three into one Logos dossier and EFS comparison — [[2026-07-21-codex-logos-deep-dive]].
- [ ] Install Basecamp and run the hands-on authority/network/export lab.
- [ ] Commission an adversarial review of the resulting Logos dossier.

### Wave 1 — closest architecture and product relatives

- [ ] **Urbit:** whole-system coherence, identity scarcity/sponsorship, OTA desks, hosting recapture, governance and steward history.
- [ ] **Sandstorm:** grain sandbox, powerbox, app packaging, Oasis shutdown, community continuity, and real self-host economics.
- [ ] **DXOS / Composer:** ECHO/HALO, peer/agent availability, SDK-to-super-app strategy, local AI, app extension boundaries, and funding.
- [ ] **Anytype:** encrypted object graph, local/P2P/self-host modes, network identity, migration/export, memberships, backup defaults, and extension model.
- [ ] **Pear / Holepunch:** Hypercore/Hyperdrive/Hyperswarm, app/runtime update chain, seed availability, bootstrapping, mobile, funding, and Tether relationship.

### Wave 2 — runtime, data, distribution, and economics specialists

- [ ] **Holochain:** source chains/DHTs, conductor/launcher, Wasm authority, app store, bootstrap/signaling, hosting, and ecosystem durability.
- [ ] **Solid:** Pods, WebID/OIDC, access control, app/data portability, hosted defaults, interoperability, and organizational handoff.
- [ ] **MetaMask Snaps:** SES confinement, permission catalog, secure UI, review/audit tiers, malware response, update roots, and ecosystem retention.
- [ ] **Puter:** web-OS architecture, user-pays resource handles, central accounts/services, self-hosted edition, portability, and developer economics.
- [ ] **Internet Computer:** certified serving, controllers, cycles, subnets, gateways, app persistence, DAO control, and walk-away boundaries.
- [ ] **ethOS mobile:** Android trust boundary, wallet/light clients, app store approval, OS signing, hardware economics, and independent rebuild/install.
- [ ] **Fileverse:** collaborative application wedge, encryption, account/key model, storage dependencies, walk-away path, and Logos integration plans.

### Wave 3 — security lineage and browser/platform primitives

- [ ] **Spritely Goblins:** distributed object capabilities, persistence, revocation, network references, and usable application maturity.
- [ ] **Genode/Sculpt and seL4/capDL:** capability graph as boot state, system composition, update/recovery, and limits of translation to browsers.
- [ ] **Nix/Guix/OSTree:** closures, generations, provenance, reproducibility, channel trust, garbage collection, and rollback UX.
- [ ] **Isolated Web Apps:** signed web bundles, permissions policy, identity/rotation, update manifests, deployment restrictions, and browser roadmap.
- [ ] **Firefox OS / Chrome Apps / webOS:** distribution ownership, packaging mistakes, partner incentives, shutdown/export, and surviving standards.
- [ ] **AT Protocol:** signed repositories, PDS migration, relay/app-view concentration, moderation, schema resolution, and account portability gaps.

## Fan-out method

Use available agents in waves, keeping one synthesis slot free whenever possible.

For a top-tier system:

1. **Runtime agent:** code execution, apps, packages, permissions, updates, local state.
2. **Network agent:** protocols, nodes, storage, identity, bootstrap, topology, maturity.
3. **Organization agent:** funding, legal entities, governance, licensing, pivots, adoption, business model.
4. **Synthesis agent/main thread:** reconcile contradictions, mark evidence strength, map to EFS, and define hands-on tests.

For a narrower system, one evidence-gathering agent plus one independent review is sufficient. Agents should not edit the same dossier concurrently; they return evidence to a single synthesizer.

## Cross-system synthesis artifacts

After Wave 1, update or create:

- one comparable feature/trust/economics matrix;
- one failure-pattern taxonomy;
- one list of architecture patterns already proven in production;
- one list of recurring centralization attractors;
- one EFS v2 pressure report: current designs that survive, need stronger tests, or may need revision;
- one prioritized hands-on lab backlog based on uncertainty and strategic threat, not project fame.

After Wave 2, run a formal claim audit before any public uniqueness positioning.

## Stop conditions

A dossier is not complete merely because public documentation is exhausted. It may be marked **research-complete / lab-pending** when remaining uncertainty requires running software, private financial data, unavailable telemetry, or direct maintainer interviews. Unknowns remain explicit rather than being converted into favorable assumptions.
