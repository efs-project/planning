---
agent: codex-gpt-5
date: 2026-07-21
status: reference
anchors:
  - area: efsv2
  - area: client
  - area: sdk
  - area: storage
  - area: identity
  - area: apps
  - area: preservation
source: Synthesis of the July 2026 EFS competitive corpus, EFS v2 and Client v2 drafts, and additional primary-source review of preservation, capability storage, signed logs, and software distribution
---

# EFS v2 + OS design intelligence synthesis

Durable input for future design agents. This document translates research into constraints, tests, and design boundaries. It does **not** adopt protocol bytes or override [[owner-rulings]], [[assumptions-and-requirements]], or the consolidated [[owner-decision-inbox]].

## Executive conclusion

The research does not show that EFS is redundant. It shows that the problem decomposes into mature specialties whose best mechanisms can be composed—and whose worst failure modes recur when one project tries to own every layer.

The strongest EFS thesis is:

> **Portable signed authority and evidence; durable, plural placement; reader-selected policy; verified software closures; least-authority execution; and credible exit from every operator, including EFS.**

No inspected system demonstrates that whole joined property set. Several systems are much better than EFS currently is at one part: Arweave/ArFS at an append-only permanent-file product, Software Heritage at software preservation, Nix/Guix at reproducible closures and generations, TUF at update-role separation and rollback defense, Tahoe-LAFS at attenuated repair authority, Flatpak at portal UX, local-first products at daily usability, and Logos at assembling a cypherpunk stack into a visible product. Future design should borrow these mechanisms without importing their authority centers or expanding the frozen kernel to reproduce every specialist.

The main design risk is no longer ignorance of competitors. It is **joining individually sensible EFS subsystems into one coherent authority, query, privacy, package, recovery, and economic model**.

## 1. What the landscape actually validates

### EFS is not “a decentralized filesystem” in the narrow market sense

That label creates misleading comparisons with byte stores and pinning services. EFS spans at least seven separable jobs:

1. stable authorship and delegated authority;
2. immutable records and mutable named views;
3. bounded on-chain filesystem/graph queries;
4. large-byte placement, retrieval, evidence, and repair;
5. reader-controlled trust and interpretation;
6. verified application packaging and least-authority execution;
7. long-horizon preservation and provider/steward exit.

Most competitors solve one to three. Systems appear cheaper when their omitted jobs are quietly delegated to a gateway, indexer, hosting account, organization, token network, update catalog, or the user.

### EFS’s differentiation is compositional

Individual ingredients are prior art. The defensible contribution is the set of boundaries between them:

- records remain valid independently of their carrier;
- byte availability never silently becomes authorship;
- an index or snapshot accelerates reads without becoming truth;
- a paid service improves latency, storage, or support without owning identity;
- packages are inert until explicitly granted powers;
- application UI never owns trusted consent pixels;
- update discovery never becomes the only recovery route;
- public evidence, confidential payloads, metadata privacy, and network anonymity are different claims;
- reconstruction is tested with the project’s infrastructure absent.

These seams should receive more design attention than adding record kinds or services.

## 2. Cross-system lessons that should become EFS invariants

| Research lesson | EFS invariant or design rule | Freeze pressure |
|---|---|---|
| Content addressing proves identity/integrity, not continued availability | Record `identity`, `retrieval`, `availability evidence`, `repair state`, and `paid horizon` separately | Identity and evidence vocabulary may freeze; provider adapters do not |
| Signed append-only feeds prove publisher history while peers exist; they do not create permanence | A signed log or KEL is an authority primitive, never a storage guarantee | KEL semantics freeze; replication mechanism does not |
| Provider-independent integrity is stronger than provider independence in availability | Clients verify every fetched object, but preservation still requires funded, measured redundancy and repair | Verification rules freeze; repair policy remains operational |
| Tahoe-LAFS can give a repairer enough power to verify/rebuild ciphertext without decrypting it | Define attenuated verify/repair capabilities distinct from read/decrypt/write capabilities | Capability semantics may be constitutional; concrete storage adapter is replaceable |
| Software Heritage separates intrinsic artifact identity from origin/visit/path context | Keep exact package/data identity separate from contextual names, channels, provenance, and discovery | Exact closure identity freezes; context remains additive signed records/policy |
| Durable archives maintain distinct graph and blob stores and multiple administrative copies | EFS exports must contain both graph/state and referenced bytes, with coverage proofs and independent operators | Export format and completeness assertions matter; operator list does not freeze |
| Nix/Guix separate immutable closures from mutable profiles/generations | Package activation points to an exact closure; updates create generations; rollback never mutates the old closure | Core package-generation semantics should be durable, not each package field |
| TUF separates root, targets, snapshot, and timestamp responsibilities and encodes rollback/freeze defenses | Update authority is purpose-specific, thresholdable, expiring, and independently recoverable; one publisher key must not be omnipotent | Update-policy semantics are constitutional; default curators are launch policy |
| Transparency proves publication/consistency only when somebody monitors it | Never claim split-view or update protection without funded independent monitors and gossip/consistency evidence | Monitoring obligation is constitutional; service implementation is operational |
| Sigstore-style identity provenance is not package authorization | “Who produced this?” and “may this update my installed app?” are separate policy questions | Read-grade/policy distinction should freeze conceptually |
| Flatpak portals replace broad ambient powers with user-mediated object grants | EFS OS capabilities should be picker/handle-shaped and revocable where semantics permit, not broad boolean permissions | Least-authority model constitutional; UI vocabulary prototyped before freeze |
| WASI and SES only confine powers the host did not endow; CPU/memory/side channels remain | A sandbox pass requires explicit host endowments, quotas, cancellation, covert-channel residuals, and cross-engine tests | Host contract durable; exact runtime replaceable |
| “Open source” without export, alternate implementations, keys, operational knowledge, and funding is not walk-away | EFS exit requires an executable clean-room drill, not a license claim | Export/reconstruction obligation constitutional |
| A convenient official provider becomes the practical center even when replaceable on paper | Provider switching must be a normal user action preserving IDs, data, config, and history | Portability semantics freeze; provider UX does not |
| Catalogs, update keys, defaults, rescue channels, and legal control are constitutional powers | Publish a control graph for code, contracts, domains, release keys, catalogs, infrastructure, treasury, and succession | Disclosure/governance obligation, not protocol bytes |

## 3. Architecture synthesis

### Layer 1 — portable semantic objects

Chain-free canonical bytes, domain-separated identifiers, signatures, exact content/package closures, and provenance. These answer “what is it?” and “who asserted it?” without requiring the current storage or indexing provider.

**Must not contain:** provider URLs as identity, mutable catalog state as identity, or an assumption that successful publication equals availability.

### Layer 2 — authoritative admission and current control

KEL state, actor grants, revocation, canonical slots, admission receipts, and bounded authority reads. This layer answers “was this actor authorized when the authority domain admitted the action?” and “what control is current at basis H?”

The research supports the minimal fixed-authority-profile prototype because it makes the strongest claim implementable without building a cross-chain operating system. Data remains portable; strongest current authority is explicitly homed.

### Layer 3 — durable placements and preservation evidence

On-chain bodies, Arweave placements, optional Filecoin/IPFS or other mirrors, local replicas, exports, checks, repair actions, paid horizons, and independent copies. This layer answers “where can verified bytes be recovered, under what evidence, until when, and who repairs them?”

Do not reduce this to a sorted list of URI schemes. A useful placement state includes:

- expected digest/size/encoding;
- last independently verified retrieval time;
- proof or sampling method;
- declared retention/expiry horizon;
- provider and administrative-domain diversity;
- repair threshold and assigned repair capability;
- last repair and unresolved degradation;
- whether the verifier retrieved plaintext, ciphertext, shares, or only trusted an API response.

### Layer 4 — keyed query and snapshot acceleration

The authoritative domain supplies bounded keyed queries for core behavior. Signed snapshots, indexes, gateways, and local databases accelerate larger reads. A snapshot states its basis and coverage and is reproducible from authoritative state.

**Rule:** missing acceleration may make a read slow or incomplete-with-an-explicit-grade; it must never make an unverified answer look authoritative.

### Layer 5 — reader policy

Typed lenses decide which claims, curators, placements, deny facts, update channels, and evidence grades satisfy a specific purpose. Flat author lists remain a UI projection, not the universal policy language.

Policy is selected by the risk bearer. A package cannot supply the lens that authorizes its own installation; a caller cannot supply the gate that legitimizes its own action.

### Layer 6 — EFS OS

The Kernel mediates verified reads, capability handles, network access, keys, packages, storage, and ceremonies. System Chrome owns trusted pixels and consequential consent. Apps receive ports/handles and render through constrained surfaces. Packages start at zero power.

The browser is a valuable distribution constraint, not a fact to defend against measurements. Static, served-header, and native/wrapper lanes may honestly support different confinement grades while sharing the same package and capability model.

### Layer 7 — products

The playable archive, personal workspace, publishing, code forge, agents, and future applications live here. Product pressure discovers missing primitives but should not etch application workflow into the lower layers.

The playable archive is especially useful because it crosses every layer while remaining understandable to a normal user: discover an artifact, verify its provenance and closure, retrieve its bytes, run it safely, save state, update/rollback, curate, republish, and survive provider loss.

## 4. The protocol/OS boundary

### Freeze only when later addition would break old meaning

Strong candidates for irreversible or tightly durable treatment:

- domain separation and canonical semantic encodings;
- principal, actor, grant, authority-epoch, and admission identities;
- the distinction between portable evidence and authority-admitted state;
- revocation and recovery ordering semantics;
- the minimal query/index state necessary for bounded core reads;
- no-body-elision/full-body reconstruction promises;
- exact closure identity and the fact that generations are atomic and rollback-capable;
- capability non-amplification and “unverified bytes never execute/render”;
- private-data root separation and bans on signature-derived encryption roots.

Keep additive or replaceable unless a prototype proves otherwise:

- app metadata schemas and archive presentation fields;
- discovery algorithms, ranking, recommendations, and catalogs;
- default lenses, curators, providers, relays, and storage adapters;
- surface-mode UI vocabulary until a real application validates it;
- quotas, prompt wording, policy defaults, and sensitivity classifiers;
- live collaboration transports;
- storage-market tokens and provider selection;
- exact snapshot transport, cache layout, and local database;
- optional future privacy transports, PIR, mixnets, and ZK features.

### A useful promotion question

For every proposed frozen field or mechanism, ask:

> If this were absent from v2, could a later signed convention, new record definition, new client, or redeployable adapter add it without changing the meaning or validity of existing objects?

If yes, it probably should not occupy the ceremony. “Useful,” “standard,” or “cheap” is not enough.

## 5. Joined-system acceptance suite

Future agents should treat these as design inputs, not a post-implementation QA list.

### Authority and identity

1. **Post-revocation backdate:** a removed actor signs later with an earlier claimed time; strongest authority must fail without rewriting history.
2. **Recovery under partial failure:** rotate/recover with one device lost, one stale, one malicious, and the primary RPC lying.
3. **Bare-to-KEL transition:** preserve the bare EOA’s portable evidence while making strongest current authority unambiguous.
4. **Suite succession:** activate a new signature suite without two simultaneously strongest kernels or invalidating old receipts.
5. **Persona isolation:** local management groups separate KELs without publishing their relationship or sharing a recovery secret.

### Query and reconstruction

6. **State-only rebuild:** reconstruct records, slots, revocations, indexes, and author-owned roots without historical logs or an EFS indexer.
7. **Mandatory-index coverage:** every admitted on-chain item is discoverable by the bounded queries its kind promises; no half-present data.
8. **Hot-target adversary:** predicate-filtered backlinks remain answer-scaled under a target with attacker-created irrelevant postings and revocations.
9. **Snapshot distrust:** corrupt, stale, partial, and equivocated snapshots are detected and never promoted to authoritative absence.

### Packages and execution

10. **Closure reproducibility:** two independent builders produce the same closure ID, or the build is explicitly classified non-reproducible.
11. **Hostile zero-power app:** a package with no grants cannot access network, wallet, identity, decrypted data, filesystem, DOM, device APIs, trusted pixels, or another app’s state.
12. **Capability diff:** an update requesting new power cannot inherit approval from the old generation.
13. **Compromised publisher:** stolen online release credentials cannot replace root/recovery authority, bypass threshold policy, or destroy the last known-good generation.
14. **Rollback/freeze attack:** an attacker serving an old but valid generation cannot silently move an auto-following client backward; the user may still deliberately boot an old closure.
15. **Resource denial:** CPU, memory, storage, message rate, recursion, rendering, and network budgets can stop a hostile app without corrupting OS state.

### Privacy and recovery

16. **Metadata inventory:** for each private workflow, record exactly what author, funding, time, size, recipient, graph, endpoint, and traffic facts remain visible.
17. **Total device loss:** recoverable files, inbound accepted shares, lens/trust configuration, and package generations restore from the documented kit.
18. **Shred honesty:** concurrent devices, prior shares, recipients, backups, and plaintext copies cannot make a UI claim more absolute than the cryptography.
19. **Malicious RPC/gateway:** content and state proof substitution fails before ordinary rendering or execution; endpoint observation remains disclosed separately.

### Preservation and economics

20. **Company-gone boot:** with EFS domains, RPCs, gateways, catalogs, relays, and package registry unavailable, a clean client can boot a pinned generation and reconstruct a chosen archive.
21. **Provider substitution:** replace every paid storage/read provider while IDs, links, authority, local settings, and audit history remain stable.
22. **Decay and repair:** delete or corrupt enough replicas to cross a warning threshold; an attenuated repair principal restores redundancy without learning plaintext or gaining author authority.
23. **Funding lapse:** expire a pin/deal/renewal and verify that UI, grade, monitoring, and repair change before bytes disappear.
24. **Independent copy:** an organization outside EFS imports an export and serves/verifies it with independently built software.

## 6. Evidence vocabulary for “permanence”

Avoid one permanence grade. Report orthogonal facts:

| Axis | Example states |
|---|---|
| **Semantic integrity** | hash only; author-signed; authority-admitted |
| **Current retrievability** | not checked; one successful source; k verified independent sources; erasure threshold met |
| **Retention basis** | volunteer cache; renewable lease/deal; prepaid horizon; chain state; institutional copy |
| **Proof strength** | provider assertion; metadata check; sampled proof; complete cryptographic retrieval |
| **Administrative diversity** | same operator/cloud; independent operators; independent jurisdictions/organizations |
| **Repair state** | unmonitored; healthy; degraded; repair queued; repaired; unrecoverable |
| **Time basis** | checked at T; paid through T; last repaired at T; cryptographic profile valid through policy horizon |
| **Reconstruction completeness** | bytes only; graph only; both; executable with dependencies; independently reproduced |

This vocabulary makes on-chain, Arweave, Filecoin/IPFS, volunteer mirrors, and institutional copies comparable without pretending they offer the same guarantee.

## 7. Economic and governance constitution

### Authority is not the paid product

EFS may charge for convenience and costly work:

- upload and transaction sponsorship;
- storage replication and repair;
- verified indexing and low-latency serving;
- privacy relay bandwidth;
- monitoring and alerts;
- hosted encrypted sync/backup;
- support, compliance tooling, and team administration.

Payment must not be required to retain identity, verify already-published records, export state, select another provider, or boot an already-owned package generation.

### Every convenience center needs an exit shape

For each official service publish:

- which facts it can observe;
- which keys or powers it holds;
- what fails when it disappears;
- the export or replacement procedure;
- the independent implementation/test path;
- the funding and shutdown/succession model.

### The project must publish its actual control graph

Open repositories are insufficient. Inventory contract upgrade/control, release and package keys, domains, catalogs, default lenses, RPCs, relays, storage accounts, trademarks, legal entities, treasury/funding, incident response, and succession. Repeat after each major release.

## 8. Research-derived warnings for future design agents

1. Do not equate a CID/hash with availability.
2. Do not equate a signature with current authorization or time.
3. Do not equate chain publication with contract readability.
4. Do not equate encryption with metadata privacy or anonymity.
5. Do not equate open source with operational replaceability.
6. Do not equate several replicas with independent failure domains.
7. Do not equate a transparency log with protection if nobody monitors it.
8. Do not equate sandbox branding with denial of host-endowed powers.
9. Do not let the package’s signer define the policy that authorizes its update.
10. Do not let a snapshot or index answer an absence question beyond its declared coverage.
11. Do not promise recovery and shredding from the same root.
12. Do not freeze an application convention merely because the anchor product needs it.
13. Do not build a token/network/runtime when a replaceable specialist can remain outside EFS authority.
14. Do not ask James to settle a measurable engineering fact by preference.

## 9. Highest-value next research and prototypes

The comparative-research phase should now be question-driven. Highest value, in order:

1. **Authority comparison harness:** implement the same inception, admission, delegation, revocation, recovery, and suite-succession stories under portable-only, fixed-domain, and per-principal-home profiles.
2. **Complete gas/state model:** include mandatory predicate-aware indexes, reverse membership, REDIRECT cited-by, live counts, content-hash lookup, self-enumeration options, full bodies, and decades of churn.
3. **Playable archive vertical slice:** independently reproducible closure, hostile runtime, explicit launch grant, saves, update, rollback, revoked/denied generation, and provider replacement.
4. **Cross-browser cage lab:** test actual global/API access, Worker CSP, Kernel egress, Permissions Policy, opaque origins, resource ceilings, and System Chrome isolation on Chrome, Firefox, Safari, and iOS.
5. **Preservation controller:** model placement health, paid horizons, independent sampling, repair capability, and administrative diversity across on-chain, Arweave, IPFS/Filecoin, and local/institutional copies.
6. **Clean-room implementation:** a second language verifies envelopes/IDs/receipts/KEL/lenses/packages and rebuilds state without using EFS-operated infrastructure.
7. **Human recovery study:** ordinary passkey-sync plus cold backup, device replacement, and private-archive restore—not only cryptographic state-machine tests.

Broad competitor dossiers should continue only when they answer one of these experiments, reveal a new mechanism, or document a real failure. A large catalog with no design consequence has diminishing value.

## 10. Source map and related EFS notes

EFS competitive notes:

- [[2026-07-21-codex-decentralized-data-landscape-synthesis]]
- [[2026-07-21-codex-efs-os-landscape-and-economic-constitution]]
- [[2026-07-21-codex-logos-deep-dive]]
- [[2026-07-20-codex-iqlabs-competitive-architecture]]
- [[2026-07-21-codex-arfs-ardrive-competitive-architecture]]
- [[2026-07-21-codex-radicle-signed-repositories]]
- [[2026-07-21-codex-ethstorage-architecture]]
- [[2026-07-21-codex-walrus-storage-architecture]]
- [[2026-07-21-codex-internet-computer-architecture]]
- [[2026-07-21-codex-ceramic-composedb-postmortem]]
- [[2026-07-21-codex-sovereign-computing-authority-and-exit]]
- [[2026-07-21-codex-safe-software-distribution-and-execution]]
- [[2026-07-21-codex-permanence-evidence-and-repair]]

Additional primary references used for the synthesis:

- [Tahoe-LAFS architecture](https://tahoe-lafs.readthedocs.io/en/latest/architecture.html) and [capability URI specification](https://tahoe-lafs.readthedocs.io/en/latest/specifications/uri.html) — attenuated read/write/verify/repair capabilities, erasure coding, health, and repair.
- [Software Heritage data model](https://docs.softwareheritage.org/devel/swh-model/data-model.html), [persistent identifiers](https://docs.softwareheritage.org/devel/swh-model/persistent-identifiers.html), and [archive copies](https://docs.softwareheritage.org/devel/swh-storage/archive-copies.html) — intrinsic identifiers, provenance/context, graph/blob separation, and independent preservation copies.
- [IPFS persistence documentation](https://docs.ipfs.tech/concepts/persistence/) — explicit distinction between discoverability, pinning, persistence, and sponsor-funded retention.
- [Hypercore reference](https://docs.pears.com/reference/building-blocks/hypercore/) — signed append-only Merkle logs, snapshots, fork/truncation state, quorum-signed length, and peer replication.

Software-distribution and sovereign-data research from the parallel July 21 pass is summarized in the companion dossiers listed below when present; primary-source links are retained there for future verification.
