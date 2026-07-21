---
agent: codex-gpt-5
date: 2026-07-21
status: reference
anchors:
  - area: client
  - area: apps
  - area: sdk
  - area: efsv2
  - area: economics
source: Current-system review plus the Client v2 fourteen-lane precedent corpus and decentralized-data competitive notes
---

# EFS OS landscape and economic constitution

Durable competitive and design notes for future EFS iterations. This document does not change a promoted design. It isolates the current OS thesis, identifies its closest relatives, and turns business-model and steward-failure lessons into testable constraints.

## Executive answer

There are many projects that can fairly be called a decentralized OS, personal cloud, sovereign runtime, local-first super-app, or peer-to-peer application platform. There is no evidence yet of a shipped system that combines the full EFS OS fingerprint:

1. static browser delivery with a content-addressed boot closure;
2. client verification of code, records, state proofs, and fetched bytes before rendering;
3. a capability kernel with no ambient network, DOM, pixels, files, wallet, or signer access for apps;
4. signed EFS records, lenses, venues, and read grades as kernel objects;
5. a local-first journal and portable signed outbox;
6. lens-curated packages and immutable generations with rollback;
7. a replaceable Session Shell plus conserved System Chrome and Rescue Shell;
8. explicit provider, gateway, preservation, and steward exit;
9. agents as a separate budgeted principal class.

The novelty is the combination and its honesty doctrine, not the words "decentralized OS." Several neighboring systems are ahead on individual components, maturity, distribution, funding, or usability.

The likely strategic framing is:

- **EFS is the substrate unlock:** portable authority, permanent signed evidence, plural byte placements, and reader-selected interpretation.
- **EFS OS is the product and safety unlock:** a daily surface where unrelated apps can safely share user-controlled state without each becoming the user's new data custodian.

Neither is sufficient alone. Without the OS, EFS risks remaining a protocol that users never feel. Without EFS, the OS risks becoming another attractive shell around vendor accounts, replaceable P2P feeds, or expiring hosted state.

## Research confidence and honest limits

The local Client v2 corpus is already a deep architecture review: fourteen research lanes, historical web-OS autopsies, capability systems, local-first systems, package trust, wallets, secure UI, and steward mortality. The storage/data landscape has separate current deep dives.

This pass adds current OS/runtime products and an economic-centralization lens. It is sufficient to guide architecture and experiments. It is **not** a claim of complete competitive diligence. Completion would require:

- installing and operating the closest systems for weeks, not reading their public material;
- measuring default-provider and node-operator concentration;
- tracing release keys, catalog defaults, governance powers, and upgrade paths from code;
- reproducing export, provider-switch, offline, recovery, and steward-exit procedures;
- reading security audits and incident history for each runtime;
- estimating real per-user hosting, indexing, relay, preservation, support, and review costs;
- obtaining retention and revenue evidence that private projects do not publish.

Until those tests exist, centralization assessments below distinguish documented mechanism from reasoned risk.

## The closest systems are a composite, not one competitor

| System | What overlaps EFS OS | What it validates | Principal separation from EFS | Economic or centralization pressure |
|---|---|---|---|---|
| **Logos Basecamp / Core** | Fully local launcher; modular runtime; package manager; signed packages; messaging, content-addressed storage, blockchain, wallet | A coherent cypherpunk stack can be packaged as one install and dogfooded through first-party apps | Native desktop/node stack; early testnet; modules are native subprocesses with inter-module token policy, not zero-authority browser workers; no EFS-style signed evidence/lens/read-grade layer | Backed by a large coordinated research ecosystem and token/community funding; catalogs, signing defaults, protocol deployment, and development concentration remain likely centers even when the runtime is local |
| **Urbit** | Personal server OS, identity, P2P software distribution, app environment, persistent state | Whole-system coherence and user-owned compute are real product categories | Custom language/runtime, scarce hierarchical identity, sponsor topology, operational hosting burden; not a verified web capability OS | Hosting convenience, sponsor availability, software publishers, and organizational governance become centers; extreme novelty suppresses ecosystem growth |
| **Sandstorm** | Capability-secure web app platform; one process/sandbox per object; powerbox grants | Designation-as-authorization and contained web apps work | Self-hosted server appliance rather than permanent signed data substrate or browser-verifying OS | The startup failed and paid hosted Oasis closed; community continuation proved source availability but small self-hosting showed that source code is not adoption or operations |
| **DXOS / Composer** | Local-first shared data, identity, offline work, P2P sync, extensible super-app, local AI | A platform needs a serious first-party application; shared local data can support an app ecosystem | Availability still depends on peers or optional agents; not content-addressed verified boot, strict capability confinement, or permanent public evidence | The team explicitly concentrated support on Composer rather than a broad SDK: a useful example of platform economics forcing an anchor product |
| **Anytype** | Polished local-first encrypted object graph, P2P sync, local-only and self-host modes | User-owned data needs excellent daily UX, not protocol exposition | One application/product model, not an untrusted app OS; network identities and migration boundaries are operationally meaningful | Membership and hosted backup/sync fund the product; official network defaults and migration friction can make an optional service practically central |
| **Pear / Holepunch** | Installable P2P runtime, peer app distribution and updates, thin UI plus worker/core split | Serverless application delivery and Hypercore-style update feeds are practical | Availability needs seeders; stable links do not guarantee bytes; no shared EFS authority, lenses, read grades, or capability-secure UI | Bootstrap, seeding, update publishers, and runtime stewardship are the likely centers even with serverless transport |
| **Holochain** | Local agent source chains, DHT applications, Wasm logic, desktop launcher/app packaging | App-specific distributed state and local agency can be a runtime | Each application's integrity model and DHT are its own world; no global permanent evidence plane or verified static web OS | App stores/launchers, bootstrap/signaling, hosted conductors, and ecosystem funding are convenience centers; official app-store work has faced maturity constraints |
| **Solid** | Data separated from apps; user-selectable Pod, identity provider, and application | Provider portability and app/data separation are essential concepts | Does not supply EFS's package verification, runtime confinement, content-addressed generations, evidence provenance, or permanence | Pod hosting, identity, discovery, and compatibility naturally consolidate; there was no compelling daily product or clear broad-market reason to fund Pods |
| **MetaMask Snaps** | SES-confined third-party JS, manifest permissions, system-rendered UI, capability APIs | Hardened JS plus declared authority can secure plugins at wallet scale | MetaMask remains the root platform; protected powers and key management pass manual review/audit; no general user data/evidence OS | Security review and distribution become a vendor chokepoint; opening the platform increases review, malware-response, and consent-UX costs |
| **Puter** | Browser desktop, apps, permissions, storage, auth, user-pays resource model | Developers can build without owning a backend bill; users can pay for consumed cloud/AI | Central accounts and cloud services remain authoritative infrastructure; not a verified sovereign data plane | Its economic model is unusually legible, but the provider is still the center unless identity, data, and billing handles become portable |
| **Internet Computer** | Integrated app runtime, persistent state, certified web responses, explicit controllers and compute funding | Verified serving and sustainable per-app resource accounting can be first-class | Canister/subnet/cycles model; applications can be upgraded, stopped, deleted, or starved; not reader-sovereign portable authority | Cycles, gateways, controllers, governance, and subnet operation are centers; funding is explicit but runtime survival remains platform-dependent |
| **ethOS mobile** | Ethereum-native operating-system distribution, system wallet, light clients, app store | Ethereum integration can be an OS-level user experience | Android/GrapheneOS distribution with Ethereum features, not a new verified capability/data OS | Hardware, device support, store approval, and OS update signing are durable operational centers |
| **Spritely Goblins** | Distributed object capabilities, durable distributed objects, explicit authority | The security model EFS wants has a serious programming lineage | Research/runtime substrate, not a mature user-facing OS or permanent evidence system | Stewardship and developer adoption, rather than hosting revenue, are the immediate survival risks |

### Closest by dimension

- **Mission and scope:** Logos, then Urbit.
- **Capability security:** Sandstorm, MetaMask Snaps, Spritely, and the older E/KeyKOS/Genode lineage.
- **Local-first product quality:** Anytype and DXOS Composer.
- **P2P runtime and distribution:** Pear, Urbit, and Holochain.
- **App/data separation:** Solid.
- **Verified serving:** Internet Computer, Isolated Web Apps, verified-fetch, and EthStorage's client-verification direction.
- **Clean developer economics:** Puter's user-pays model.
- **Ethereum-native device surface:** ethOS.

This means EFS should not claim "the first decentralized OS." A narrower provisional claim is more defensible: **a reader-sovereign, verified web OS whose apps receive capabilities over portable signed evidence rather than accounts in a platform database.** Any public "first" claim still needs a dated claim audit.

## Logos is the nearest current mission-level comparison

Logos Basecamp deserves continuous monitoring. It packages a local runtime, self-contained modules, a package manager, private communication, CID-addressed file sharing, a wallet, and a blockchain node into one native launcher. Logos Core describes itself as the modular runtime/SDK. The current release is explicitly experimental and focused on backend integration rather than production UX.

Important technical differences found in the public repositories:

- LGX packages contain manifests, per-file Merkle hashes, optional Ed25519 signatures, and local trusted-key rings.
- Signature policy is configurable; the package manager's documented default is warning, not mandatory rejection.
- Package manifests contain native shared-library variants and dependencies. Dependencies may omit a signer, meaning any signer is eligible unless constrained.
- Core modules run one operating-system subprocess per module. Inter-module calls use issued tokens and allowlists, which is useful confinement between modules but is not the same as preventing native code from ambient OS/filesystem/network access.
- Basecamp's package catalog, release pipeline, default trusted keys, and update behavior therefore deserve a focused threat-model audit.
- Storage currently requires direct peer reachability/NAT traversal for the demonstrated file-sharing path, and the public product material distinguishes that from future decentralized storage.

EFS should borrow the unified install, module lifecycle, Nix/reproducible-build discipline, first-party wallet/chat/file/node applications, and active public roadmap. It should retain its stronger default: installed third-party app code begins with no network, DOM, pixels, signer, or data capability at all.

## What the failed and constrained systems teach

### 1. A platform without a retention product becomes a research project

Firefox OS, Chrome Apps, Solid, Urbit, Ceramic/ComposeDB, and numerous "web desktop" projects reached different forms of this problem. Infrastructure quality did not create a weekly reason to return. DXOS's move from general SDK emphasis to Composer is a current, explicit correction.

**EFS implication:** name the anchor application before freezing the platform surface. Candidate wedge: a permanent, verifiable personal and collaborative workspace where files, publishing, citations, app packages, and agents share one user-controlled namespace. The OS must make that workflow markedly safer or more durable than a normal web app.

### 2. The easiest revenue product becomes the default center

The usual sequence is:

1. the protocol is open and self-hostable;
2. reliable hosting, relaying, indexing, backup, discovery, or review costs real money;
3. the steward offers the easiest default;
4. almost everyone uses it;
5. its account system, moderation policy, uptime, and pricing become the practical constitution.

The architecture can remain decentralized on paper while user power recentralizes at the expensive or confusing layer.

**EFS implication:** a paid default is acceptable only when the client can prove it is a replaceable performance/availability provider, not an authority provider.

### 3. Open source is not an exit plan

Sandstorm users could export and self-host after Oasis closed, and Ceramic's signed data and code remained available after its steward pivoted. Neither fact supplies a maintained binary, independent operator, compatible index, preserved data, documented restore, or user migration.

**EFS implication:** "walk-away" must be a recurring executable drill with official infrastructure disabled, not a license claim.

### 4. Identity and token economics can consume the product

Scarce hierarchical identity, sponsorship, governance tokens, staking, cycles, and storage credits may solve Sybil resistance or funding. They also create speculation, governance conflict, migration friction, and dependence on economic machinery that users did not seek.

**EFS implication:** keep author identity, app identity, content identity, storage payment, service payment, and governance separable. A user must be able to read and export without acquiring the project's economic asset.

### 5. Novel runtimes spend the ecosystem's entire novelty budget

Urbit demonstrates the cost of a coherent but unfamiliar language, identity, network, hosting model, and culture arriving together. Holochain and native module platforms similarly ask developers to adopt specialized execution and data models.

**EFS implication:** Ring-3 apps should remain ordinary TypeScript/JavaScript/Wasm with familiar tooling. EFS-specific novelty belongs in the kernel objects and capability API, not a new programming language.

### 6. Security review becomes a distribution chokepoint

MetaMask Snaps shows that strong confinement works, but privileged APIs, key access, audits, and malware response create manual review pressure. Logos's native modules raise an even stronger supply-chain problem because signatures authenticate a publisher but do not make native code safe.

**EFS implication:** preserve **zero-power install**. Let any verified package run with no grants; curate and review authority requests, not inert code. Make emergency deny facts fast, visible, plural, and reversible by reader policy.

### 7. Self-hostable is not the same as replaceable

If switching requires a server, command line, identity reset, full export/import, NAT configuration, or a new social graph, most users are locked in despite an open protocol.

**EFS implication:** provider substitution must be a normal picker operation. The same signed objects, identifiers, links, and local state survive the change.

### 8. Update and discovery control are constitutional powers

Package catalogs, default trusted-key rings, app stores, sponsored software feeds, lens defaults, and OS release keys decide what most users can see and safely run.

**EFS implication:** make those choices explicit content-addressed state. Lenses may supply defaults, but the user can inspect, pin, fork, and replace them. Rescue Shell recovery cannot depend on the ordinary update channel.

## The economic constitution EFS should adopt

Cypherpunk intent becomes durable only when the organization cannot profit by silently weakening it. The following principles should be treated as future design and business-model gates.

### Authority is never the paid product

EFS may charge for availability, latency, convenience, curation, computation, support, or risk assumption. Payment must not determine:

- who the user is;
- whether a valid signature is valid;
- what an EFS identifier means;
- whether the user may export;
- which software generation the user may boot;
- which provider the user may select;
- whether independently available evidence is visible.

### Plausible paid products

- fast gateways and proof-bearing RPC;
- encrypted backup and multi-domain preservation;
- relaying, batching, sponsorship, and publication convenience;
- indexing, search, previews, and notifications;
- malware/safety/quality curation lenses;
- agent inference and private compute;
- team administration, recovery, support, and compliance tools;
- a preconfigured home appliance or managed personal node;
- preservation funding, renewal automation, and independently verifiable audits.

These should be purchased as revocable provider capabilities. The Kernel exposes receipts, scope, cost, expiry, and alternatives.

### Revenue patterns to avoid

- protocol rent on every read or local operation;
- a required EFS account or identity subscription;
- official gateway or index results presented as protocol truth;
- an app store whose approval is necessary to install zero-power code;
- a token whose ownership is necessary for basic reading, export, or identity;
- hosted sync that is the only complete copy;
- proprietary export, recovery, or package formats;
- "free forever" infrastructure without a replacement cost model.

### Graceful-degradation rule

When a paid or official service disappears, the permitted losses are speed, convenience, redundant availability, human support, and optional computation. The forbidden losses are identity, authorship, verification, existing links, local access, export, rollback, and the ability to select a replacement provider.

## The OS is probably the adoption unlock, not a replacement for EFS

The strongest EFS-specific product is not a desktop metaphor. It is a safe shared computer over user-controlled evidence:

- an app can use the user's chosen objects without acquiring the user's whole account;
- the user grants a live, attenuated handle by selecting an object or service;
- apps cannot silently phone home or paint fake system prompts;
- every answer says where it came from, how fresh it is, and how strongly it was verified;
- code and state can outlive their original publisher, gateway, and company;
- private local state and public permanent evidence can coexist without pretending they have identical guarantees;
- agents operate through the same capability and receipt system instead of becoming omnipotent automation.

That is meaningfully different from most "decentralized OS" projects. It is also much harder than a filesystem alone, so the product scope must remain disciplined.

## Provisional positioning

Avoid:

> The first decentralized operating system.

Prefer something like:

> A verified, reader-sovereign web OS: apps use capabilities over your signed data instead of taking ownership of your account.

Or:

> The web computer that can verify its own code and data—and survive its provider.

The cypherpunk edge is **credible exit plus least authority**, not rhetoric, tokenomics, or the number of peer-to-peer protocols in the stack.

## Design and release gates

### P0 — retention application gate

Before freezing the general OS SDK, ship one first-party workflow that a non-protocol user wants weekly. Instrument only privacy-preserving product outcomes: repeat use, successful recovery, provider switches, offline completion, and export—not behavioral surveillance.

### P0 — hostile app gate

Install an unknown signed app and prove it cannot access network, DOM, pixels, clipboard, wallet, keys, unrelated EFS objects, or local files before an explicit grant. Exercise confused-deputy and prompt-spoof attempts.

### P0 — company-gone boot

From a clean machine, boot a previously pinned generation, recover/export user state, verify records and packages, and read through independent providers with all EFS-operated domains and keys unavailable.

### P0 — paid-provider substitution

Replace gateway, RPC, index, relay, preservation, and inference providers independently. Existing object IDs, links, signatures, local journal state, and app grants must remain valid or fail with an honest, narrow label.

### P1 — economic pressure review

For every proposed revenue line, identify the power it creates. Reject or re-cut any product whose failure or cancellation changes authority rather than convenience.

### P1 — catalog and update capture drill

Assume the default lens, curator, publisher key, update channel, and EFS company are compromised separately. Verify capability diffs, cooldown/quorum policy, explicit pins, rollback, Rescue Shell, and alternate curator discovery.

### P1 — closest-system hands-on lab

Install and operate Logos Basecamp, Urbit, Sandstorm, DXOS Composer, Anytype, Pear, Holochain Launcher, and Puter/self-hosted Puter. Record:

- first useful task time;
- powers granted to an installed app/module;
- all default network contacts;
- update and discovery roots;
- offline behavior and peer/bootstrap requirements;
- clean export and different-provider restore;
- company-gone behavior;
- realistic operator and support costs.

## Watchlist triggers

- **Logos:** audit every stable Basecamp release, package-signature policy, catalog/trusted-key defaults, module sandboxing, storage durability, and Status integration.
- **DXOS:** watch whether Composer becomes a durable product and whether the SDK remains genuinely third-party viable.
- **MetaMask Snaps:** watch permissionless distribution, malware response, secure-prompt evolution, and third-party retention.
- **Pear:** watch seeding economics, independent runtimes, update-key portability, and mobile distribution.
- **Anytype:** watch network switching, independent backup providers, identities across networks, and extension/app capabilities.
- **Holochain:** watch app-store restart, launcher trust, hosted-conductor adoption, and production-scale applications.
- **Isolated Web Apps:** watch consumer availability beyond managed ChromeOS; its packaging and permissions may become an upstream browser primitive for EFS.
- **EthStorage and verified-fetch:** watch client-side verification maturity and whether verified gateway responses become commodity infrastructure.

## Sources and related notes

Current project material:

- Logos Basecamp and stack: https://logos.co/basecamp and https://logos.co/get-started
- Logos experimental status: https://logos.co/testnet-v01-faqs
- Logos package/runtime repositories: https://github.com/logos-co/logos-package, https://github.com/logos-co/logos-package-manager, https://github.com/logos-co/logos-liblogos
- Logos principles: https://research.logos.co/principles
- Urbit documentation: https://docs.urbit.org/
- Sandstorm documentation and closure history: https://docs.sandstorm.org/, https://sandstorm.org/news/2017-02-06-sandstorm-returning-to-community-roots, https://sandstorm.org/news/2019-09-15-shutting-down-oasis
- DXOS: https://docs.dxos.org/guide/ and https://blog.dxos.org/why-were-building-a-super-app/
- Anytype: https://anytype.io/ and https://doc.anytype.io/anytype-docs/advanced/data-and-security/self-hosting
- Pear: https://docs.pears.com/
- Solid: https://solidproject.org/about
- MetaMask Snaps: https://docs.metamask.io/snaps/learn/about-snaps/execution-environment/ and https://docs.metamask.io/snaps/reference/permissions/
- Puter user-pays model: https://docs.puter.com/user-pays-model/
- Holochain packaging: https://developer.holochain.org/get-started/4-packaging-and-distribution/
- Spritely Goblins: https://spritely.institute/goblins/
- ethOS: https://www.ethosmobile.org/

Local EFS evidence:

- [[clientv2/web-os-thesis]]
- [[clientv2/kernel-capability-model]]
- [[clientv2/packages-and-updates]]
- [[clientv2/local-first]]
- [[clientv2/agent-native]]
- `Reviews/2026-07-07-clientv2-corpus/research/webos-precedents.md`
- `Reviews/2026-07-07-clientv2-corpus/research/capability-os.md`
- `Reviews/2026-07-07-clientv2-corpus/research/local-first.md`
- [[2026-07-21-codex-decentralized-data-landscape-synthesis]]
- [[2026-07-21-codex-ceramic-composedb-postmortem]]
- [[2026-07-21-codex-internet-computer-architecture]]
