# Ethereum-first EFS and a substrate-aware OS — research frame

**Status:** draft research frame — captures current owner intent; adopts no venue or product boundary
**Target repos:** planning, contracts, sdk, client
**Depends on:** [[human-overview]], [[assumptions-and-requirements]], [[solana]], [[mountable-filesystem-semantics]], [[onchain-completeness]], [[web-os-thesis]], [[sdk-boundaries]]
**Supersedes:** —
**Reviewers:** @efs-architecture-audit, @cross-platform-mounts, @metadata-mapping (2026-07-22 gap audit)
**Last touched:** 2026-07-22

#status/draft #kind/design #repo/planning #repo/contracts #repo/sdk #repo/client

> **Classification:** this is an exploration map, not an owner ruling or implementation mandate. It records why Ethereum, EFS, and the OS all matter; names several coherent shapes; and defines how to explore broadly without freezing a universal abstraction. Any adopted choice still routes through [[owner-decision-inbox]] and [[owner-rulings]].

## 0. Owner intent captured

The current direction, stated without prematurely resolving it, is:

- build a genuinely cypherpunk OS centered on user sovereignty, verifiable data, local capability control, exit, and durable public knowledge;
- continue leaning heavily into Ethereum because its shared state, standards, contracts, ecosystem, and credible neutrality are a major part of what makes EFS valuable;
- treat EFS itself as infrastructure that makes the EVM more useful, not merely as a chain-agnostic storage library;
- recognize that the OS grew out of EFS but may become useful beyond blockchain-native users and may use local or networked storage for some classes of state;
- avoid abstracting so aggressively that EFS reinvents every database, identity system, consensus protocol, and operating system primitive; and
- stay creative during research: expand the possibility space, build comparable slices, then contract toward the smallest elegant engineered system that preserves the mission.

These desires are not inherently contradictory. The tension becomes productive if the layers are kept explicit.

## 1. The reconciliation thesis

> **Ethereum-first does not require Ethereum-only. Substrate-aware does not require a lowest-common-denominator protocol.**

The likely coherent shape is:

1. a small portable evidence and lens constitution;
2. a rich, first-class Ethereum authority and composability profile;
3. an OS that can operate locally and consume several evidence/byte sources without lying about their guarantees; and
4. optional future realms or adapters that earn support through conformance and real use rather than through speculative generality.

Ethereum can remain the place where EFS becomes most powerful:

- canonical public admission and ordering;
- KEL/revocation/current-authority state;
- permanent state-resident records and required indexes;
- synchronous contract reads and gates;
- permissionless publication and relaying;
- economic resistance to unbounded shared-state use;
- a shared public graph on which other protocols can build; and
- standards that make EVM applications, accounts, packages, files, provenance, and agents more interoperable.

The OS can be broader without demoting Ethereum. Local drafts, private journals, caches, verified packages, content-addressed blobs, personal lens configuration, and offline work do not become more cypherpunk merely by forcing every intermediate byte through a chain. They become cypherpunk when the user controls them, can verify them, can export them, and is not trapped by an operator.

The design problem is therefore not “Ethereum or portable OS.” It is **which guarantees belong in the portable constitution, which Ethereum capabilities should remain proudly Ethereum-native, and which OS functions never needed public consensus in the first place.**

## 2. Two important artifacts, one lineage

EFS and the OS should not be collapsed into one product boundary.

| Layer | Primary purpose | Ethereum relationship | Portability posture |
|---|---|---|---|
| **EFS Codex / artifact standard** | Define records, IDs, principals, signatures, content commitments, lens inputs, grades, and exports | designed to be cheap and useful to verify on EVM | exact artifacts survive carriers |
| **Ethereum EFS profile** | Make files, claims, authority, provenance, and graph queries native public EVM state | first-class; may expose richer guarantees and ABIs than any other profile | other profiles need not match its implementation |
| **EFS OS world engine** | Turn evidence and policies into a user-controlled filesystem/world; run verified apps with least authority | treats Ethereum as the strongest public venue and composability surface | local-first and capable of graded non-chain sources |
| **Replica and byte profiles** | Preserve evidence and content across Solana, Arweave, IPFS, cloud, local, or future networks | extend reach, availability, and exit | advertise exact capabilities, never implied authority |
| **Future authority realms/adapters** | Explore another consensus domain or foreign-program consumption | explicit relation to Ethereum authority required | research track, not baseline interchangeability |

This preserves both claims:

- **EFS makes Ethereum/EVM more useful.** Contracts gain a durable file/claim/provenance graph with standards and bounded reads.
- **The OS may be the larger human product.** It turns those primitives into an environment ordinary users and non-blockchain applications can inhabit.

The OS can be more important as a product while EFS remains the more important protocol foundation. “More important” need not mean “subsumes” or “replaces.”

Two independent research tracks sit beneath this broader frame:

- [[mountable-filesystem-semantics]] requires the same Ethereum/EVM EFS view—potentially sourced from Base or Arbitrum—to mount read-only on Linux, macOS, and Windows and work through ordinary shell tools and graphical file managers. Linux FUSE is one adapter, not the canonical interface; writable mounts are a possible later extension.
- [[solana]] tests substrate portability, non-EVM runtime fit, and the separation of artifacts, evidence, authority, queries/proofs, and byte storage. It is not part of the cross-platform host-mount milestone.

The tracks may inform the same eventual architecture, but neither is a phase, prerequisite, or acceptance test of the other.

## 3. A cypherpunk OS is defined by powers, not by putting everything on-chain

Candidate constitutional properties:

1. **User-held authority:** the system does not require an EFS operator to impersonate the user or hold the only key.
2. **Stable principals, replaceable actors:** people and organizations are not reducible to one permanent wallet key.
3. **Verify, do not merely fetch:** signatures, commitments, package closures, receipts, and proofs are checked at the consuming boundary.
4. **Exit:** records, keys/recovery material, packages, policies, proofs, and bytes have complete documented export paths.
5. **Local-first agency:** the user can read, organize, draft, and run already-held software through network loss.
6. **No ambient authority:** applications, agents, network endpoints, wallets, and renderers receive narrow capabilities.
7. **Viewer sovereignty:** lenses are explicit reader policy; publication does not force universal interpretation.
8. **Permissionless public lane:** the strongest shared venue does not require EFS-company approval to write, relay, reconstruct, or read.
9. **Honest guarantees:** local, provider-observed, replica, authority-admitted, and proof-verified results are never flattened into one “saved” or “live” state.
10. **Privacy by control and cryptography:** sensitive material can remain local or encrypted; “decentralized” never masquerades as anonymous.
11. **Fork and succession:** implementations, shells, packages, and eventually protocol profiles can outlive the founding team.
12. **Composability where it is real:** Ethereum contracts can consume the native Ethereum profile synchronously; foreign or local consumers use explicitly weaker or adapted paths.

Blockchains strongly help properties 3, 8, 9, 11, and 12 for a public shared world. They are not the only way to achieve local custody, encryption, capability security, reproducible packages, or export.

## 4. What Ethereum contributes that should not be abstracted away

Treating Ethereum as just another implementation of `StorageBackend` would erase much of the reason to build EFS. The Ethereum profile may deliberately own:

- the canonical authority-domain contract set for its profile;
- admission co-ordered with KEL state;
- immutable receipts and revocation/current-slot materialization;
- state-resident reconstruction and bounded keyed indexes from [[onchain-completeness]];
- `eth_getProof`/light-client-oriented verification paths;
- contract-callable file, identity, provenance, membership, and policy gates;
- EVM-specific byte-store mechanisms such as `EFSBytes` where they earn their cost;
- account-abstraction, sponsorship, relaying, and wallet integrations;
- EVM gas/state measurements and denial-of-service limits; and
- an ABI and standards program intended for other Ethereum protocols to adopt.

Those are features, not portability leaks, provided the logical artifact identity and interpretation do not accidentally depend on contract address, chain ID, relayer, or storage slot.

An elegant architecture should allow the Ethereum profile to be **strictly richer** than the portable floor.

## 5. What can remain portable without inventing a universal computer

The portable constitution should be deliberately small:

- exact canonical record and envelope bytes;
- logical IDs and full-width principal/actor semantics;
- signature-suite and authority-reference semantics;
- content commitments and byte verification;
- evidence versus authoritative-admission distinction;
- deterministic typed lens semantics given the same evidence, policy, limits, and basis;
- `UNKNOWN`, completeness, freshness, provenance, availability, and proof-grade rules;
- exact bundle/export/import behavior; and
- capability descriptors for venues, replicas, queries/proofs, and byte stores.

It should **not** attempt to standardize one universal:

- storage layout;
- transaction model;
- fee model;
- finality algorithm;
- RPC vocabulary;
- smart-contract ABI across VMs;
- global query engine;
- cross-chain clock;
- account system;
- bridge; or
- sync database implementation.

The rule of restraint:

> Create a portable abstraction only where at least two real implementations need the same semantics. Otherwise keep the mechanism in its native profile and export evidence through the small constitution.

Irreversible identity/signature/codec surfaces deserve anticipatory seams before the second implementation exists. Ordinary implementation details do not.

## 6. Does the OS work without blockchain?

Yes, but its guarantee profile changes. A blockchain-free personal or organizational instance could combine:

```text
signed append-only records
        +
content-addressed or hash-verified bytes
        +
stable principal and replaceable actor keys
        +
signed versioned heads/checkpoints
        +
local journal and deterministic merge policy
        +
one or more network replicas
        +
the same lens engine
```

It can still support files, directories, packages, apps, local-first work, sharing, replication, verification, and export. Signatures prevent a storage operator from forging artifacts. They do not prove that the operator returned the newest or complete set.

| Question | Signed artifacts alone | What adds a stronger answer |
|---|---|---|
| Are these the exact bytes a key signed? | yes | canonical codec + signature verifier |
| Was that key authorized for the principal? | only with authority/KEL evidence | current signed KEL or authority admission |
| Is this the newest head? | no | trusted sync authority, witness quorum, gossip, transparency log, or chain |
| Is the result complete? | no | complete manifest/index plus a trustworthy basis |
| Will bytes remain available? | no | retention contract, replication, monitoring, and repair |
| Did two devices conflict? | detectable with the right DAG/order fields | deterministic merge or authoritative order |
| Can a public contract consume it synchronously? | no | native chain state or installed adapter/local commitment |

The hardest non-chain problem is **freshness bootstrap**. A provider can replay a valid old signed checkpoint to a new device. The device needs a remembered basis, several independent replicas, gossip/witnesses, a transparency service, an occasional Ethereum anchor, or an honest `UNKNOWN-CURRENCY` state.

This suggests a useful possible product ladder rather than one fake guarantee:

- **local sovereign:** user/device custody; no public completeness claim;
- **network-replicated:** verified artifacts with provider/replica freshness labels;
- **witnessed:** checkpoints observed by an independent log/quorum or periodically anchored;
- **Ethereum-authoritative:** current authority and admissions rooted in the Ethereum profile;
- **foreign adapted:** another environment consumes an explicit Ethereum proof/commitment adapter.

Non-blockchain users could start in the first two modes without learning gas, wallets, or chain terminology. Ethereum becomes an upgrade in public durability, shared authority, composability, and censorship resistance—not a hidden dependency of opening a local document.

## 7. “We trust the user” is useful but needs one correction

Trusting the user’s intent removes the need for EFS to decide whether the user’s statement is socially true. It does not mean **user = one key**.

The durable model is:

```text
stable principal
    authorizes
replaceable and scoped actor keys
    sign
immutable evidence
```

Keys can be lost, copied, revoked, delegated, recovered, or used by several devices. A signature proves what a key did. KEL/authority evidence explains why that key represented the principal at a stated basis.

A personal non-chain realm may choose a simpler rule: the current trusted principal signs a new head, conflicts remain visible, and the user signs a merge/successor checkpoint. That works well for an OS but gives up definitive proof that an old record was authorized before a later key revocation. The Ethereum profile can offer the stronger co-ordered historical grade.

This is a feature of graded profiles: ordinary personal computing need not pay for the strongest public historical claim, while safety-critical and composable uses can demand it.

## 8. Coherent architecture shapes to keep alive

These are research candidates, not choices.

### Shape A — Ethereum-native EFS and Ethereum-dependent OS

All confirmed public state is Ethereum-profile state; local data is only pending/cache/private material.

**Gains:** smallest authority story, strongest composability, clearest EVM mission, fewest grades.

**Risks:** onboarding/cost/network dependence; OS usefulness tightly coupled to Ethereum availability and UX; non-chain adoption has no honest first-class mode.

### Shape B — Ethereum-authoritative hybrid OS

Ethereum is the canonical strongest public authority. The OS is local-first, works over signed local/network evidence, and promotes selected material to Ethereum for stronger guarantees. Solana and other stores are replicas/read sources unless explicitly adapted.

**Gains:** preserves Ethereum’s unique value while making the OS usable offline and by non-chain users; avoids multi-authority ambiguity.

**Risks:** a richer grade/UX model; promotion/sync ceremonies; the local-to-public boundary must be extremely clear.

**Current research prior:** strongest candidate to prototype first, not an adopted ruling.

### Shape C — Ethereum-first with permissionless independent realms

Ethereum is the reference profile and standard leader, while Solana or non-chain authorities can define explicitly realm-qualified `CURRENT` state.

**Gains:** sovereignty and experimentation; EFS artifacts and lenses travel farther.

**Risks:** discovery, namespace, split authority, grade complexity, and weaker universal composability. Realms must not silently merge.

### Shape D — Chain-optional OS with Ethereum as one service

The OS constitution is primary; Ethereum is a powerful authority/preservation/composability provider selected per action.

**Gains:** widest product reach and clean personal-computing story.

**Risks:** highest chance of abstracting away EFS’s Ethereum advantage, rebuilding generic sync/identity infrastructure, and losing a crisp first product.

### Shape E — Ethereum EFS and broader OS share formats, not authority

EFS remains explicitly an Ethereum filesystem protocol. The OS adopts its records, packages, lenses, and verification ideas but allows separate local/network data domains that are not branded as authoritative EFS state.

**Gains:** sharp EFS mission, broad OS freedom, no false parity.

**Risks:** two adjacent data models or product vocabularies may drift; moving material between OS-private and Ethereum-EFS worlds needs explicit publication semantics.

Shapes B and E may converge: one portable artifact family, with “EFS-authoritative” reserved for Ethereum-profile admission and other OS material clearly labeled by its basis.

## 9. Standards strategy

Ethereum-first standards work can be divided into three rings:

### Ring 1 — portable constitutional standards

Records, principals/actors, signatures, IDs, content commitments, lens semantics, grades, and bundles. Freeze only after cross-language vectors and at least one non-EVM/local conformance implementation pressure-test the bytes.

### Ring 2 — Ethereum EFS standards

Contract interfaces, KEL/admission receipts, state/index layout commitments, proof/read profile, file-byte mechanisms, account integrations, and web/EVM resolution. Optimize unapologetically for EVM usefulness, auditability, and composability.

### Ring 3 — OS and adapter standards

OS SDK capabilities, local journal/export, venue observations, sync states, package/runtime contracts, and optional adapter profiles. These should evolve faster and should not be Etched merely because the Ethereum protocol freezes.

This prevents two opposite failures:

- Ethereum mechanics accidentally become the identity of the data forever; or
- a generic portability layer weakens the Ethereum ABI and contract-readable guarantees that justify EFS.

## 10. Expand, test, contract

The research process should intentionally alternate divergence and convergence.

### Expansion phase

- keep Shapes A–E available;
- study Solana, local-first, network storage, transparency witnesses, Ethereum L1/L2/L3, and user-hosted services;
- record attractive capabilities and uncomfortable failure modes;
- avoid promising that every researched profile will ship; and
- distinguish owner values from adopted mechanisms.

### Comparable vertical slices

Build the same small joined system several ways:

1. create a stable principal and actor;
2. create/edit a folder and file on two devices;
3. install and run a verified package through a lens;
4. revoke/rotate a device;
5. recover on a fresh device;
6. reconstruct without EFS-operated infrastructure; and
7. expose one bounded gate to a native program/contract where the substrate supports it.

Candidate slices:

- local SQLite/OPFS + signed bundle;
- network object store + signed heads and two replicas;
- Ethereum authority profile;
- Solana evidence/reader profile; and
- one foreign-consumption adapter only after the preceding profiles are understood.

### Contraction phase

For every proposed abstraction or profile, ask:

- Does a real joined-system use require it?
- Does it preserve a guarantee users understand?
- Does it simplify two implementations rather than merely rename their differences?
- Can it be tested with deterministic vectors or failure drills?
- Does it make Ethereum less useful or less composable?
- Does it add another authority source, bridge, operator, or permanent code surface?
- Can it remain an optional profile instead of entering the constitution?

Kill abstractions that lack two real consumers. Keep Ethereum-native features when generalization would erase their value. Promote only the smallest mechanisms that survive the comparative slices.

## 11. Research-to-MVP sequence

The constitution and MVP pass should follow—not precede—the next joined foundation pass. The existing owner-decision packet remains a valuable inventory, but recent Solana, native-mount, independent-realm, and non-chain use cases may change the shape of its unanswered choices.

1. **Freeze the pressure-test stories, not the architecture.** Use a small common corpus: publish and enumerate a large folder, overlay several principals, distinguish proven absence from missing evidence, rotate/recover a key, copy historical evidence into another realm, reconstruct from an export, and mount the same resolved view read-only.
2. **Re-run KEL as an authority-and-realm pass.** Revisit principal/actor identity, admission-time authorization, rotation/revocation/recovery, realm qualification, replay domains, code succession, and the exact difference between historical evidence and current authority. Compare one EVM realm, permissionless independent realms, and a declared private signed-head realm without assuming they share one `CURRENT`.
3. **Replace the lens specification.** Preserve the simple ordered-principal overlay as the filesystem profile, then decide how it relates to typed package/moderation/gate policies. Specify collisions, WHITEOUTs, file-versus-directory conflicts, complete folder/property enumeration, basis pinning, cycles/budgets, provenance, and `UNKNOWN` before storage layouts harden.
4. **Run the joined KEL × lens × index × mount review.** Prove that every lookup and directory page can obtain the authority and completeness evidence its result claims, and that a Linux/macOS/Windows adapter can project that result without inventing false absence or authority.
5. **Complete the Ethereum bill.** Build and measure the full native kernel/KEL/index/bytes/read profile demanded by [[onchain-completeness]]. Ethereum should be evaluated at its intended strength, not as a toy point-store.
6. **Build the local/network control.** Design the blockchain-free signed-head, multi-device conflict, rollback, completeness-manifest, export, recovery, backup, and provider-observation behavior deeply enough to show what consensus was actually buying.
7. **Run the bounded Solana comparison.** Start with L1 evidence replication and L2 conforming reads. Measure signature verification, staged commits, account layout, page indexes, hot-account contention, program-gate account/compute budgets, proof/finality assumptions, code upgrades, wallet ceremonies, and state-only reconstruction before considering L3 authority.
8. **Build the required native-mount validation.** First mount a complete bundle, then one live EVM realm, through one shared resolver on Linux, macOS, and Windows. Keep Solana mounting as an adapter consequence to test later, not part of the first host milestone.
9. **Run one joined OS journey.** The playable archive is a strong pressure test: discover, verify, install, run, save, update, curate, revoke, restore, export, and open the public dataset through an ordinary file explorer.
10. **Compare user ceremonies and failure drills.** Count sign, publish, recover, sync, endpoint, trust, and repair decisions across local, networked, EVM-authoritative, and Solana evidence modes.
11. **Reconcile decisions, then contract.** Mark every existing owner choice still valid, changed, superseded, evidence-gated, or newly exposed. Only then write the small constitution and a support matrix with `required`, `extension-ready`, `experimental`, and `unsupported` categories, select the MVP, and regenerate freeze gates.

### Joined blind spots to keep visible

These deserve explicit answers during the sequence but are not all MVP requirements:

- **Realm and view identity:** a mount, citation, cache entry, and receipt must name the realm, program/contract code basis, lens/policy version, evidence basis, and completeness policy. A friendly path must never hide which world it represents.
- **Snapshot versus following semantics:** define when a view advances, what open file and directory handles retain, how revocation invalidates caches, and what an offline export proves. “Live” and “reproducible” are different products.
- **Complete discovery:** portable records without a complete child/property/authority index are preservable evidence but not a mountable or contract-queryable filesystem. Point lookup and page enumeration must agree at one basis.
- **File-versus-directory projection:** the graph can express DATA with children or different kinds at one name, while a native path needs one stable entry type. The replacement lens/filesystem profile must choose a deterministic projection or reversible synthetic split.
- **Coherent bytes:** size, codec, logical content commitment, chunking, mirror selection, and byte basis must resolve as one file generation. Whole-file hashes do not authenticate arbitrary ranges until the complete object is fetched unless a chunk/range proof exists.
- **Resource and denial-of-service budgets:** bound lens principals, imports, graph depth, redirects, directory size, property volume, proof size, RPC fan-out, byte ranges, timeouts, and cache growth. Malicious public data is an input to a kernel-facing daemon.
- **Portable identity and signature suites:** full-width principals, suite-tagged actor keys, exact transcripts, and realm replay domains must replace EVM-address-shaped assumptions without making a Solana transaction payer the author.
- **Profile and code succession:** an authority realm is partly the contract/program semantics that interpret it. Upgrade authority, immutable deployment, successor activation, old-receipt verification, and emergency repair need one explicit story on EVM and SVM.
- **Decision granularity:** the current N1 option bundles authority semantics, deployment topology, legacy-EOA commitment, smart-account inception, personal transfer, and signature-suite succession. The next pass should split these dimensions or prove they must move together before presenting a new owner packet.
- **Non-chain rollback and conflict:** signatures alone do not choose a newest head, detect a provider hiding a newer head, merge two offline devices, or guarantee availability. A private signed-head realm can be useful, but its operator/witness, backup, and recovery assumptions must be visible.
- **Host privacy and security:** mounted paths, previews, thumbnailers, search indexers, antivirus, recent-files lists, and daemon access patterns can leak public or decrypted metadata beyond EFS. Default mount flags, cache encryption, indexing controls, symlink handling, and execution policy need threat tests.
- **Adapter lifecycle:** Linux FUSE, macOS FSKit/macFUSE, Windows WinFsp, Solana runtime/RPC, and wallet APIs evolve independently. Pin tested support floors and conformance behavior rather than letting one dependency's ABI enter the portable protocol.
- **Operational independence:** clean-room export/import, endpoint replacement, state-only reconstruction, byte repair, reproducible builds, key/recovery export, and monitoring are part of the cypherpunk claim, not deployment polish.

## 12. Stop rules against the Pandora’s box

Research can remain broad while delivery remains bounded:

- studying a substrate does not commit EFS to supporting it;
- preserving its artifacts does not make a substrate an authority realm;
- a convenient `Venue` façade does not erase capability differences;
- no simultaneous unqualified `CURRENT` across authority realms;
- treat cross-chain bridge, hub, and locator machinery as out of scope by default; whether any belongs in the v2 baseline remains an undecided N1 axis and requires both a demonstrated application and an owner ruling;
- no non-chain provider receives strongest public authority merely because data is signed;
- no portable abstraction weakens Ethereum’s state, ABI, proof, or contract-read guarantees;
- no OS-local cache, journal, or view becomes protocol truth;
- no irreversible byte surface freezes without independent vectors and a second implementation pressure test; and
- no research branch becomes a launch requirement without an owner decision and an end-to-end prototype.

These are scope controls, not conclusions about what EFS may eventually become.

## 13. What success would look like

A successful contraction could produce an architecture where:

- Ethereum hosts the best and most composable EFS authority profile;
- EFS gives EVM applications durable files, provenance, identity, packages, and graph queries they did not have before;
- exact records and lens semantics survive outside one chain;
- the OS works locally, offline, and over replaceable providers;
- non-blockchain users can use the OS without being told a local draft is globally final;
- users can deliberately promote material into stronger Ethereum-backed guarantees;
- Solana and future systems can preserve or interpret evidence without forcing cross-chain authority;
- every view exposes enough basis for the user or application to know what it actually knows; and
- the implementation remains small enough to audit, explain, fork, and preserve.

That is not a compromise between Ethereum and a cypherpunk OS. It is a division of labor: Ethereum supplies a uniquely strong public common world; the OS supplies the sovereign human environment that can use it without being imprisoned by any single interface or operator.

## Open questions

- [ ] Is “EFS” the portable artifact family, the Ethereum-authoritative profile, or both with explicit qualifiers?
- [ ] Which parts of the OS must remain useful before a user chooses any public authority venue?
- [ ] Which user actions should promote local/network evidence into Ethereum-authoritative state?
- [ ] Does the first product expose several modes, or ship one Ethereum-authoritative mode while retaining internal seams?
- [ ] Which Ethereum-native capabilities are important enough to exceed the portable profile deliberately?
- [ ] Can a non-chain signed-head profile give adequate multi-device freshness and recovery without inventing a new consensus service?
- [ ] Should independent authority realms ever share stable principal IDs, or always qualify identity/current authority by realm?
- [ ] What concrete application proves that Solana L3 authority or foreign-program verification is worth its complexity?
- [ ] Where should the product draw the naming boundary between local OS material, portable EFS evidence, and Ethereum-authoritative EFS state?
- [ ] What is the smallest constitution that two independent implementations can reproduce exactly?

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed (no surprise repos at implementation time)
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one Ethereum, one local/network, and one non-EVM pressure slice reviewed
- [ ] Owner distinguishes values/preferences here from adopted architecture in [[owner-rulings]]
- [ ] At least one round of `#status/review` with another agent or human comment
