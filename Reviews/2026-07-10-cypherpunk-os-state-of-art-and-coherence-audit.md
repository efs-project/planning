# 2026-07-10 — Cypherpunk OS state-of-the-art and EFS coherence audit

**Status:** point-in-time architecture review and vNext amendment plan; research current through 2026-07-10; not canon and not a freeze/promotion claim.

**Scope:** the current local [[efsv2/README|EFS v2]] and [[clientv2/README|client v2 / Web Runtime]] design sets, including the 2026-07-10 filesystem, graph-query, privacy, and OS handoff material. This is the technique-and-coherence companion to [[2026-07-10-efsv2-century-storage-and-cypherpunk-os-review]], whose preservation findings remain in force.

**Method:** direct document audit, current primary-source research, and independent specialist passes across reproducible systems/supply chain, filesystem/graph/local-first design, and Ethereum/privacy/wallet/UX standards. The planning worktree already contains substantial in-flight work; this review intentionally changes no design document.

#status/review #kind/review #repo/planning #topic/cypherpunk-os #topic/coherence

---

## Executive judgment

The designs have the right values and many of the right primitives. They do not need a new ideology. They need a stricter separation of layers and several pre-freeze corrections.

The good core is real:

- EFS has portable signed artifacts, deterministic identities, append-only evidence, state-backed enumeration, viewer-controlled lenses, explicit uncertainty, permissionless carriage, and a strong refusal to equate missing data with absence.
- The client set has local-first drafts, explicit capabilities, no ambient app network by default, typed system ceremonies, replaceable endpoints, honest pending states, exportability, negative security indicators, and no-telemetry intent.
- The newer Web Runtime / Guardian / hardened-appliance split is the right strategic correction to a browser-only “OS.”
- The filesystem pass correctly moves many ACL, collaboration, and policy concerns out of the immutable kernel.
- The new ruling that basic graph queries must remain available on-chain is compatible with a narrow kernel if “available” means bounded raw evidence, not a hidden indexer or an unbounded truth engine.

The present corpus is not yet coherent enough to freeze. The highest-risk problems are:

1. The envelope says same-author/same-sequence collisions are benign and non-unique; the read lens calls the same condition equivocation and blocks it; the kernel stores no such grade; the client calls normal multi-device collisions self-equivocation.
2. The proposed graph posting word truncates the author from bytes32 to 160 bits, which breaks the already-reserved digest/KEL identity future.
3. The target index is not typed/domain-separated, and the proposed bounded-AND helper does not implement the normative lens algorithm.
4. The closure manifest hashes wall-clock resolution time and personal authority into a supposedly reproducible, shareable generation.
5. App, release, artifact, build, realization, generation, and activation identities are conflated.
6. The lens-shaped update design is not TUF-equivalent, despite currently presenting itself that way.
7. Several filesystem labels promise semantics EFS does not provide: delete, hardlink, rename, full-batch atomicity, “gas as quota,” and “chain means no corruption.”
8. Current standards claims overstate production readiness or status: Helios, WebAuthn PRF recovery, ERC-7730, proposed ERC-8213, and several account-abstraction/delegation drafts.
9. “Confidentiality is sound/solved” is ahead of the actual normative file-crypto, key-lifecycle, metadata, and recovery specifications.
10. A canonical package tree, derivation format, platform realization, WIT ABI, authority ledger, privacy-context matrix, and graph-layer model are missing.

The corrective architecture is one coherent stack:

~~~mermaid
flowchart TB
  A["EFS semantic substrate<br/>portable claims, IDs, raw indexes, read semantics"]
  B["Century / representation layer<br/>bitstreams, manifests, evidence, custody, repair"]
  C["Guardian data plane<br/>local journal, content store, materialized graphs, keys"]
  D["Reproducible package plane<br/>source, derivations, artifacts, profiles, realizations"]
  E["Independent trust plane<br/>TUF roots, provenance, rebuilders, advisories, witnesses"]
  F["Portable app plane<br/>WIT/WASI capabilities, JS adapters, typed handles"]
  G["Web Runtime<br/>reachable, low/medium assurance"]
  H["Hardened host<br/>verified boot, A/B images, process sandboxes, owner roots"]

  A --> B
  A --> C
  B --> C
  D --> E
  E --> F
  C --> F
  F --> G
  F --> H
~~~

The Web Runtime and hardened host are two implementations of the same user-facing semantics and app contract. They are not two security descriptions of the same browser origin.

---

## The EFS constitution for vNext

Every design should be checkable against these invariants.

1. **User exit is the root property.** A user can recover data, meaning, identity history, and authority without an EFS-operated service, official origin, official gateway, DNS/ENS name, or vendor account.
2. **Immutable names identify immutable semantics.** Mutable channels and petnames point to immutable releases, artifacts, representations, and query bases; they are never themselves reproducible citations.
3. **Content-addressed, reproducibly built, authorized to update, and safe with current authority are four different claims.**
4. **Code rollback never rolls back authority.** Revocations, trust roots, compromise cutoffs, security-time floors, and user grants live outside rollbackable system generations.
5. **Install is inert storage; activation is execution; authority is a separate grant.** A zero-grant process can still exploit a runtime or exhaust resources, so it still needs isolation and quotas.
6. **Exact links pin exact reality.** They include object/representation or realization identity, algorithm/profile version, and where needed platform and evidence basis. Follow links disclose their mutable channel/lens/basis.
7. **Every derived answer names its graph layer.** Historical evidence, venue slot state, viewer-resolved truth, local overlays, and preservation status are not interchangeable.
8. **Enumeration never proves global absence.** A complete bounded scan at a pinned venue basis can prove only venue-relative exhaustion.
9. **Raw on-chain discovery is not lens-resolved truth.** The kernel returns evidence; readers apply revocation, supersession, freshness, lens ordering, denies, and evidence policy.
10. **All unbounded work has an explicit budget and continuation.** Bytes scanned, postings examined, graph depth, CPU, memory, messages, storage, and wall time are bounded independently of output count.
11. **Public permanence and private local work are separate modes.** Save is local and durable; publish is an explicit public act; replicate and preserve are later, separately visible states.
12. **Privacy claims use a context matrix.** No claim of “private” stands without naming what the author, payer, RPC, relay, gateway, browser, OS, storage provider, chain observer, and collaborator learn.
13. **Cryptographic validity is not timeless authenticity.** Historical equation validity, authorship evidence, evidence epoch, currency, and custody are separate axes.
14. **Every cache and index is rebuildable.** Canonical truth is portable signed records, representation manifests, and user authority state—not RocksDB, SQLite, browser caches, The Graph, or one client’s materialization.
15. **Transport is replaceable.** EFS, IPFS, HTTPS, web3 URLs, OCI, CAR, OSTree, and storage markets may carry objects; none is automatically the canonical identity or trust root.
16. **The owner controls the roots.** A hardened profile permits owner-enrolled boot/update roots, custom builds, independent rescue, and no mandatory remote attestation or vendor kill switch.
17. **Authority is least and visible.** Apps receive narrow typed handles, not ambient filesystem/network/wallet objects. Capability ceilings, user grants, and live ports have different lifecycles.
18. **Untrusted information stays tainted across agents.** Schema validation is not declassification; hostile content cannot indirectly steer a private-data-plus-egress parent.

---

## One identity and lifecycle model

The present package design uses “app identity,” “manifest,” “closure,” and “generation” inconsistently. Adopt this vocabulary across the client and OS set:

| Identifier | Stable meaning | May contain time/user state? |
|---|---|---|
| **AppId** | Stable app lineage: author identity plus app-root object | No |
| **ReleaseId** | Digest of the canonical package/release manifest | No |
| **ArtifactId** | Digest of the canonical filesystem tree actually shipped | No |
| **DerivationId** | Digest of source inputs, builder/toolchain, target, build arguments, and impurity policy | No |
| **ProfileId** | Platform-neutral selection of components and policy ceilings | No |
| **RealizationId** | Exact platform-specific closure: all bytes and interfaces for one target | No |
| **ResolutionReceiptId** | What channels/lenses/venues/checkpoints were observed to select a realization | Yes; evidence only |
| **ActivationId** | Local generation counter and health/activation record | Yes; local only |
| **AuthorityState** | User grants, revocations, trust roots, delegation, security floors | Yes; monotone/encrypted, never in the closure |
| **RuntimeState** | Live ports, process IDs, leases, quotas, meters | Yes; ephemeral |

The current claim that a package manifest hash is both part of stable app identity and the version identity is contradictory in [[clientv2/packages-and-updates]] §1–2. Use AppId for lineage and ReleaseId for immutable version identity.

The current “immutable PIN v<semver>” is still an LWW mutable slot. Semver is a label, not identity. Rebinding the same author/app/version label to a second ReleaseId must yield VERSION-COLLISION/CONTESTED and disable automatic use; the digest remains authoritative.

### Pure closure rule

A closure or realization is a pure function of locked inputs and policy. It must not hash:

- resolvedAt or other wall-clock observations;
- local activation number/time/health;
- a user’s lens choices except as an immutable, explicitly shareable policy input;
- personal capability grants or usage counters;
- live process/port state.

Move channel observations, lens version, venue checkpoint, and resolution time to ResolutionReceipt. Move the capability table into three graphs:

| Graph | Lifecycle | Contents |
|---|---|---|
| **Distribution graph** | Immutable, realization-addressed | Declared WIT worlds, dependency wiring, capability ceilings |
| **Authority graph** | Encrypted, monotone user state | Actual grants/revocations, trust roots, delegations, security floors |
| **Runtime graph** | Ephemeral | Live handles, processes, leases, meters |

This split fixes reproducibility, profile privacy, safe rollback, and live-resource accounting at once.

---

## Nix-style reproducibility and hyperlinkability

### What to copy from Nix and Guix

Copy the ideas, not the experimental surface:

- original versus locked references;
- pure derivations with explicit inputs;
- immutable store objects;
- complete runtime closures;
- GC roots and generations;
- build isolation and environment normalization;
- source/toolchain closure retention;
- user-controlled channels and rollback.

Nix flakes and floating content-addressed derivations remain experimental. Classic Nix store paths are primarily derivation/input identities; they do not by themselves prove that independent builders produced bit-identical output. EFS should require output content addressing and independent rebuild evidence.

Each release should publish:

1. **Canonical source tree** with algorithm-qualified identity.
2. **Derivation**: exact source, builder, toolchain, target platform/CPU floor, arguments, allowlisted environment, dependency graph, network/impurity policy, tests, and expected output.
3. **Canonical artifact tree**: bytewise deterministic directory encoding.
4. **Realization closure**: exact artifact trees and WIT/API versions for one platform.
5. **Provenance**: SLSA/in-toto statement bound to the exact subject.
6. **Independent rebuild attestations**: preferably at least two administratively diverse, bit-identical rebuilds for privileged components.
7. **SBOM**: SPDX 3.0.1 or a later pinned version.

### Canonical package tree

Define an EFS tree encoding before treating one bundle CID as package identity:

- bytewise ordered relative paths;
- explicit directory, regular-file, and symlink nodes;
- file bytes, length, executable bit, and no implicit platform metadata;
- exact path-byte/Unicode rules;
- reject traversal, duplicate paths, unsupported node types, and cross-platform case collisions;
- exclude uid, gid, mtime, xattrs, devices, and host paths unless a versioned platform profile explicitly includes them.

A NAR-like encoding is a better canonical identity than layered tar. OCI, CAR, ZIP, and OSTree can be exports/transports.

### Platform-neutral profile versus exact realization

The current closure does not state architecture, operating-system ABI, browser feature floor, WASI/WIT version, or CPU baseline. Separate:

- ProfileId: “these components and policies.”
- RealizationId(platform): “these exact bytes on aarch64-linux,” “x86_64-linux,” or “web-wasi.”

An exact-generation link must name one realization or a content-addressed realization index. It must never silently execute different bytes on two machines while claiming one exact identity. The OCI image-index/manifest split is useful precedent.

### Hyperlink taxonomy

EFS needs four visibly distinct link types:

| Link | Pins | Promise |
|---|---|---|
| **Exact object/representation** | typed content identity, algorithm/profile, exact bytes | Re-fetch/re-verify the same representation |
| **Exact realization** | RealizationId plus platform | Boot/run the same closure |
| **Follow/channel** | AppId/channel plus lens and basis disclosure | Resolve current policy-selected release; not reproducible |
| **Query/citation** | query semantic hash, graph layer, lens/deny snapshot, venue basis/checkpoint, clock/evidence policy | Reproduce one derived answer |
| **Capability link** | object plus attenuated secret in protected local/fragment state | Possession conveys bounded authority; handle as a secret |

web3:// per ERC-4804 is a useful EVM retrieval adapter, not the canonical century identity. It binds resolution to a chain/address/contract call. Define a chain-independent typed EFS identifier (an efs URI or registered URN form) and map it to web3, HTTPS, IPFS, local files, and future carriers.

Use algorithm-qualified content identities. CID/multihash and Software Heritage persistent-ID ideas are better models than bare 0x hashes. An ni URI or hash proves integrity only; it does not prove provenance, authority, availability, or currency.

Capability fragments are not magically secret: JavaScript, extensions, history sync, clipboard, screenshots, crash reports, and support logs can expose them. Redact by default, use no-referrer policy, scope/attenuate, make rotation easy, and never add analytics.

---

## Supply-chain and update architecture

The update system should use real TUF semantics, carried and witnessed by EFS, rather than treating a subjective lens as a TUF root.

The current TUF specification is 1.0.34 (2026-01-22), not the 1.0.17 link in the earlier review. A conforming implementation needs:

- separate root, targets, snapshot, and timestamp roles;
- sequential root versions;
- each root transition authorized by both old and new thresholds;
- delegated target scopes;
- exact snapshot binding of metadata versions, hashes, and lengths;
- trusted-time/freeze behavior;
- metadata size and endless-data limits;
- intermediate roots for clients returning after years offline;
- explicit compromised-role recovery.

A user lens expresses subjective curation. A TUF root expresses update-authority continuity. Compose them:

1. TUF verifies that a publisher/update authority validly issued an update snapshot.
2. The user’s lens/curator policy decides whether that authority and release are acceptable.
3. Deny/advisory facts and transparency witnesses add independent evidence.
4. The exact realization and authority diff are still verified locally.

Define one signed UpdateSnapshot that binds the root version, channel ledger/head, exact release/closure identities and lengths, curator-policy version, qualifying attestations, advisory/deny snapshot, venue/checkpoint evidence, and expiry/freshness data. Do not mix these inputs from different checkpoints.

Curator key count is not administrative independence. Separate publisher, offline root, channel selector, builder/provenance signer, independent rebuilder, advisory publisher, and transparency witness roles. For privileged OS code, require organizational diversity, not merely distinct key IDs.

The Guardian maintains a monotone security-time floor from previously trusted metadata, finalized checkpoints, and optionally sealed local state. Clock rollback suspends automatic update. A browser-only profile cannot strongly preserve that floor after origin loss and must degrade to manual recovery.

Preserve the right to inspect or recover old software, but run deny-marked or rollback-below-floor generations in quarantine by default:

- no current signing keys or authority graph;
- no network;
- read-only/snapshotted data;
- no automatic migrations;
- per-capability restoration only through a fresh ceremony.

Use SLSA 1.2, in-toto provenance, independent reproducible builds, SPDX, and transparency as evidence. Sigstore is useful evidence and monitoring infrastructure, not the root of authorization: an OIDC/issuer compromise can authorize hostile artifacts, and logs only help if someone monitors them.

---

## Portable runtime and hardened OS profile

WASI 0.3 became stable on 2026-06-11. The component model and WIT should move from “later” to the canonical cross-profile app ABI:

- generated TypeScript adapters for browser JS;
- browser components through a component-model adapter such as jco;
- native components through Wasmtime or another conforming runtime;
- the same typed EFS interfaces and capability semantics in both profiles;
- explicit since/unstable/deprecated gates for ABI evolution.

Do not expose raw WASI sockets, filesystem roots, or generic HTTP. Export narrow broker worlds such as verified-read, content-stream, endpoint-request, user-picker, signing-proposal, and receipt-store.

Wasm is defense in depth, not the only protection boundary. A hostile component in the Guardian profile runs in its own OS process with no ambient descriptors/network, runtime memory/table/instance ceilings, fuel or epoch deadlines, host-call byte/rate caps, and OS CPU/memory/PID/I/O limits plus Landlock/seccomp/no-new-privileges or platform equivalents.

Separate the control and data planes:

- Kernel/Guardian relays grants, revocation, leases, accounting, and audit receipts.
- High-volume bytes move through direct, bounded ContentHandle/ByteHandle streams with backpressure, digest verification, lease epochs, and byte ceilings.

The concrete hardened profile should be:

~~~text
owner-enrolled firmware/boot root
  -> signed unified kernel image
    -> dm-verity read-only A or B system image
      -> Guardian
        -> per-app process + WASI sandbox
          -> browser Shell as an unprivileged client

separate encrypted mutable state:
  journal, content store, authority graph, roots, recovery state

independent rescue:
  signed rescue image, offline media, recovery root
~~~

Use Nix/Guix to build and retain the source/derivation closure. Deploy a simpler signed A/B image. OSTree is strong precedent for atomic filesystem swaps; bootc/OCI is useful operationally but does not yet supply the whole hardware-to-app trust chain. Qubes, Genode/Sculpt, and seL4 remain higher-assurance precedents, with increasing driver/product cost.

Cypherpunk requirements for this profile:

- owner can enroll/replace boot and update roots;
- custom/unlocked builds remain possible with explicit local state;
- vendor cannot remotely remove boot/recovery ability;
- TPM measurement is local unsealing/diagnosis by default, not mandatory remote attestation;
- rescue works with vendor, DNS, normal disk, and official EFS services absent.

---

## Efficiency without recentralizing

The efficient architecture is not “put everything on chain” or “make every app ask a gateway.” It places each job at its cheapest independently verifiable layer:

| Work | Primary layer | Verification/recovery |
|---|---|---|
| Exact portable evidence and core indexes | EFS venue state | State proof, raw scan, portable records |
| Hot graph/full-text/range query | Guardian local materialization | Rebuild from pinned evidence + local overlays |
| Live collaboration | Encrypted peer/relay transport | Causal changes + periodic EFS checkpoints |
| Large byte streaming | Direct bounded content handles | End-to-end representation digests/range proofs |
| System distribution | Immutable realization packs/deltas | Canonical tree + TUF + provenance/rebuild evidence |
| Long-term copies | Diverse stores/custodians | Scheduled full retrieval, fixity, repair receipts |

Design rules:

- Hash/verify each immutable block once per trust epoch, then cache the verification receipt against exact bytes and verifier version.
- Coalesce Ethereum point reads and proofs, but never mix basis blocks/checkpoints inside one answer.
- Materialize covering local indexes for slot, author/order, definition/target, target/definition, admission, and full text. Treat them as disposable.
- Use immutable packs, range reads, async streams, and backpressure; avoid repeated serialization and copying.
- Lazy-load app artifacts from an already verified realization; never fetch executable code outside the closure after activation.
- Resolve update channels in bulk snapshots, not per-app polling. This is both faster and more private.
- Separate output limit from scan/work limit everywhere.
- Publish observed gas, state growth, CPU, memory, bandwidth, and cold-start distributions—not one average.
- Make privacy padding/cover traffic a named budget. Users can choose stronger traffic privacy without hidden battery/bandwidth cost.
- Keep raw on-chain primitives simple enough for independent implementations; optimize local derived plans freely.

The browser profile must still acknowledge its real boundary. A same-origin Worker plus SES and CSP is useful hardening/crash isolation, not a separate principal after an escape. Prototype opaque/distinct-origin app cradles and active-document renderers. Isolated Web Apps are a useful signed-bundle/strong-policy option where available, but remain browser/vendor/deployment-specific and cannot be the universal EFS baseline; signed packaging also fails if an app can download new executable code outside its reviewed closure.

---

## Graph database model: define the layers before the queries

The current design often says “the graph” when it means one of four different things. Make these first-class:

1. **EvidenceGraph(venue, basis):** every admitted claim and available record body at a pinned venue basis.
2. **SlotGraph(venue, basis):** deterministic current winner per slot plus venue revocation/supersession state.
3. **ResolvedGraph(venue, basis, lensSnapshot, denySnapshot, clock, evidencePolicy):** viewer-relative truth after the normative lens algorithm.
4. **PreservationGraph(inventory, custodians, audits, migrations, epoch):** representations, replica locations, fixity, evidence renewal, repair, and succession.

A fifth local overlay may hold private drafts, decrypted values, CRDT working state, and user-only metadata. It must never be confused with publicly evidenced state.

The native EFS fact is best understood as a reified incidence tuple:

~~~text
claimId
author identity
operation and role
definition/predicate identity
target kind
target or canonical value
weight/order/expiry
venue admission evidence
~~~

That is closer to immutable Datomic-style datoms with explicit basis and provenance than to a mutable property-graph row. The edge/claim is itself an addressable object; current truth is a derived view.

### P0: sequence collision semantics contradict

Current documents cannot all be implemented:

- [[efsv2/codex-envelope]] says seq is non-unique and same-author/same-seq/different-envelope digests admit together, are never duplicity, and never revert.
- [[efsv2/read-lens-spec]] calls the same condition EQUIVOCAL/CONTESTED and refuses LIVE.
- [[clientv2/persistence-and-sync]] calls ordinary multi-device collisions self-equivocation.
- [[efsv2/codex-kernel]] intentionally keeps no duplicity state.

Because the wire format explicitly defines seq as sparse and non-unique, the least disruptive correction is:

- SeqCollision is an evidence/ordering-collision flag, not proof of malicious equivocation.
- Claims in unrelated slots remain independently resolvable.
- Two claims competing for the same slot at the same seq use the existing digest tie-break and may carry a CONTESTED-SAME-SEQ label; machine gates may choose to fail closed on that narrower condition.
- If EFS wants true equivocation semantics, it must first redefine seq as a unique per-author log position and specify safe multi-device allocation. It cannot obtain that property from a 10-bit clock hint.

The 10-bit clock/device discriminator must never be treated as a durable actor identity. It has only 1,024 values; random allocation has material birthday-collision risk as device count grows. Use full scoped actor/device identities and membership/KEL epochs for attribution; keep the compact field only as an ordering hint.

### P0: datatype policy contradicts

[[efsv2/codex-kinds]] ratifies string-only values while [[efsv2/deterministic-ids]] still freezes typed literal constants and a propertyId derived from datatype plus canonical bytes.

Strings-only is not enough for a graph/filesystem/preservation substrate: it cannot canonically preserve numeric ordering, booleans, timestamps, durations, references, language/direction text, or clean RDF/GQL export.

Keep the kernel generic:

~~~text
valueId = H(domain, datatypeId, H(canonicalValueBytes))
~~~

- Freeze only the generic typed derivation and canonical byte framing.
- Standardize an initial Durable datatype profile for bytes, UTF-8 text, language+direction text, boolean, signed/unsigned integer, decimal, timestamp/duration, typed reference, and canonical CBOR/JSON.
- Extend by new datatype identifiers rather than a closed kernel enum.
- Never globally intern private cleartext values; represent those as encrypted DATA/object references.

This is a freeze-sensitive identity decision. Range indexes and higher-level validation can remain Durable/local.

### P0: the proposed posting layout truncates identity

The filesystem query corpus recommends one word containing author(160), spine index, and flags. The envelope author is bytes32 and digest-shaped KEL identities are already reserved. Truncation silently aliases principals and makes the future identity path impossible.

Benchmark only layouts that preserve full identity:

- packed spine indexes, resolving author after the prefilter;
- full claim IDs;
- two-word author plus claim/index;
- a separately proven, collision-free identity dictionary with explicit lifecycle.

Do not freeze the 160-bit optimization. A gas win cannot spend the identity model.

### P0: target keys need type domains

A raw bytes32 target can represent an object, address, claim, opaque value, interned literal, or future identity. The reverse index must key:

~~~text
targetIndexKey = H(domainTargetIndexV1, targetKind, targetWord)
~~~

The target kind remains in the ABI and evidence. Test deliberate cross-kind word collisions.

### Required on-chain graph algebra

The mission constraint is achievable if “core” means exact, bounded, positive graph primitives:

- point lookup by object/claim/slot ID;
- forward postings by definition/container;
- reverse postings by typed target;
- forward and reverse list/containment membership;
- exact predicate-and-target probes;
- bounded parent/redirect traversal with explicit depth;
- optional small positive conjunction implemented over those primitives;
- stable counts/high-watermarks and continuation.

Keep negation, global absence, ranking, aggregation, full text, arbitrary fan-out traversal, and open-ended joins off-chain/local. They cannot be made complete on an open, partially replicated graph.

Do not put SPARQL, GQL, Datalog, or a general query VM in the immutable contract. Do define a small versioned QueryPlan semantic AST above the kernel. Hash it so a query is hyperlinkable, compile it to:

- on-chain raw scans and point reads;
- Guardian local indexes;
- RDF/SPARQL export adapters;
- property-graph/GQL adapters.

A QueryPlan pins graph layer, predicates/directions, lens/deny snapshot where applicable, venue/basis, clock/evidence policy, scan/depth/result budgets, ordering, and completeness semantics. The hash pins semantics, not a database’s physical execution plan.

### Minimal corrected reverse-index ABI

The Etched ABI should return raw historical evidence, never silently “revoked-filtered current backlinks”:

~~~solidity
function postingCountByTarget(uint8 targetKind, bytes32 targetId)
  external view returns (uint64);

function scanByTarget(
  uint8 targetKind,
  bytes32 targetId,
  uint64 cursor,
  uint32 scanLimit,
  uint64 highWatermark
) external view returns (
  bytes32[] claimIds,
  uint64 nextCursor,
  bool done
);
~~~

The corresponding definition/container scan has the same cursor semantics.

Rules:

- append exactly once on first admission of an indexable ASSERT;
- replay never appends;
- return raw claim IDs or lossless spine references;
- scanLimit bounds entries examined, not matches returned;
- highWatermark is fixed from the count at traversal start;
- SDK eth_call reads pin a block and restart on reorg;
- contracts naturally execute against their transaction’s single block;
- empty means no raw posting in the exhausted venue range, not globally PROVEN-ABSENT.

Current/live backlinks require slot deduplication, winner resolution, revocation, freshness, and possibly lens/deny logic. Return evidence and let the caller select the layer. Append-only postings cannot honestly erase historical entries.

### Bounded AND is a candidate generator

The proposed selectAND checks for any LIVE author and therefore bypasses first-attester-wins, UNKNOWN-stop, STALE-stop, deny, and collision rules. Reclassify it:

- a redeployable helper, not Etched;
- emits candidates, witnesses, high-watermarks, entries scanned, continuation, and completeness flag;
- output is DISCOVERY, never resolved/GATE truth;
- final SlotGraph/ResolvedGraph evaluation runs through the normative lens implementation.

Ethereum mainnet now has EIP-7825’s 16,777,216 per-transaction gas cap. A 25–50 million gas eth_call estimate is not a contract-composable design. Publish two budgets: a conservative on-chain composability budget well below the transaction cap, and a separately measured RPC eth_call budget. Provider-specific high eth_call caps cannot define “works on-chain.”

### RDF and property-graph interoperability

Use standards at the adapter/export layer:

- RDF 1.2 is a 2026 Candidate Recommendation Snapshot and adds triple terms/named-dataset capabilities that fit statement-about-statement provenance.
- RDF Dataset Canonicalization 1.0 is a W3C Recommendation; use it for portable graph export/sign/diff, with pinned algorithm/version and dataset-size limits.
- SPARQL 1.2 and SHACL 1.2 are evolving; use versioned adapters/profiles, not kernel law.
- ISO/IEC 39075:2024 GQL is the property-graph query standard; an openCypher compatibility layer is reasonable.
- PROV-O can carry export provenance.

Prefer deterministic EFS IRIs and named graphs for venue, basis, lens, and evidence policy. Avoid persistent blank-node identity. A canonical export should preserve the claim resource and its provenance rather than flattening claims into unattributed triples.

The Guardian may use SQLite, an LSM engine, or a graph database for speed, but its physical files are disposable. Canonical facts and query bases remain portable and rebuildable.

---

## Filesystem and storage corrections

The filesystem design should describe EFS semantics precisely instead of borrowing POSIX labels that imply stronger behavior.

### Delete has three meanings

Revoking a placement clears that author’s slot and can reveal a lower lens author. It is not always “delete.”

Use distinct verbs:

- **Relinquish:** revoke this author’s placement and permit lens fallthrough.
- **Hide/whiteout:** viewer- or namespace-policy fact that blocks fallthrough without erasing evidence.
- **Destroy local/private access:** erase local plaintext/key material; crypto-shred only where all usable key copies can actually be destroyed.

Trash is a local/private overlay until explicitly published. “Delete” UI must say which operation occurs.

### Atomicity has three levels

- Envelope signature/recordsRoot gives **commitment atomicity**: one signature binds the whole proposed set.
- A transaction-fit full submit can give **admission/visibility atomicity** at one venue transaction.
- submitSubset/resumable carriage permits **partial visibility** until completion.

Do not call all signed batches stronger than POSIX. Add an operation/commit marker and make default readers hide incomplete operation groups when an application requires all-or-none visibility. Expose partial state to recovery/forensics.

### Alias, move, copy, and link

- Multiple immutable placements of one DATA object are aliases, not POSIX hardlinks; updating one logical version does not mutate every alias.
- movedTo is an HTTP-like redirect, not atomic rename. Repeated moves can exhaust the eight-hop follow limit; flatten redirects or introduce stable directory-entry identities if transparent repeated rename is required.
- Copy needs two explicit modes: another placement of the same logical object, or a new logical object/version with derivedFrom provenance while reusing immutable representation bytes.
- Symlink/redirect traversal must pin depth, cycle policy, and the minimum grade of every hop; UNKNOWN stops rather than skips.

### “Chain is the journal” is an overclaim

Consensus state can still contain contract/index bugs, malformed or unavailable bodies, divergent RPC views, reorg effects, abandoned venues, partial envelopes, and lost codecs. Off-chain replicas still suffer bit rot.

Ship an independent efs verify/fsck tool that can:

- recompute IDs, roots, canonical encodings, and signatures;
- replay the admission spine;
- rebuild and compare slot, forward, reverse, child, and event/index state;
- validate parent reachability and revocation targets;
- detect partial operation groups and chunk availability;
- compare providers/checkpoints;
- validate lens/query reproduction;
- produce a signed repair plan without rewriting history.

### Representation manifests

Do not ask one chunk layout to optimize EVM proofs, archival deduplication, private encryption, small files, and media ranges.

Define versioned representation profiles:

1. fixed-size chunks for simple contract-readable proofs and adversarial predictability;
2. content-defined chunks, such as a pinned FastCDC profile, for edit-stable archival/access deduplication;
3. sparse extent DAGs with explicit HOLE or BLOCK ranges;
4. small-file immutable packs with a canonical table of contents and range proofs;
5. deterministic compressed representations with strict expansion limits;
6. encrypted representations with randomized per-file/per-epoch keys.

Every manifest pins:

~~~text
manifest and profile version
logical and stored sizes
chunker algorithm and all parameters
hash/multihash and domain tags
Merkle arity/order/odd-node/final-chunk rules
codec and deterministic codec parameters
encryption suite, key epoch, nonce/AAD rules
meaning of plaintext, ciphertext, stored, and transport digests
sparse extent rules
maximum decode/expansion ratio
~~~

Keep separate:

- logical Work/Data identity;
- authored Version identity;
- Representation identity;
- plaintext fixity;
- ciphertext/storage root;
- mirror CID;
- transport/package hash.

For private data, randomized encryption and global deduplication conflict. Deduplicate only inside a declared privacy domain; never use public deterministic/convergent encryption by default.

### Local content-store efficiency

Avoid one OPFS/native file per tiny block. Use immutable packs with:

- pack generation and digest;
- canonical index/TOC;
- temp-write then commit;
- crash-safe compaction;
- mark/sweep from explicit GC roots;
- rebuildable local indexes.

GC roots include active/previous/pinned system realizations, rescue, user pins, outbox/signed bundles, journal checkpoints, recovery exports, and preservation obligations. Never sweep user data merely because an app closure stopped referencing it.

Use range/stream handles and backpressure. Do not structured-clone whole large objects through multiple Worker hops.

### Durability and erasure coding

Checksums detect; redundancy plus scrub/repair corrects. A Century profile needs replicas across administrative, geographic, legal, software, and economic failure domains. Erasure coding can reduce overhead within a storage family but does not replace independently controlled complete copies. Placement policy must name failure domains, not merely shard count.

State-resident Ethereum bytes remain dependent on chain rules, clients, governance, and future state handling. Fusaka/PeerDAS improves blob data availability, not archival duration; blobs are not the century tier. History expiry already means old logs cannot be the only reconstruction path.

### Quotas still exist

Gas prices admission. It does not meter local CPU, memory, storage, compile time, messages, bandwidth, outstanding work, or background scheduling. Nor does it guarantee that current-state externalities are funded forever.

The OS needs per-principal and per-capability quotas, reservations, and user-visible storage budgets. On-chain index growth also needs explicit gas/state budgets and adversarial hot-key tests.

---

## Local-first collaboration and CRDT boundary

Immutable signed claims are not automatically a Byzantine-fault-tolerant CRDT. A collaboration profile must specify:

~~~text
engine/wire version
document ID
full actor-ID scheme
membership and key epoch
authorization policy
causal dependency rules
snapshot/compaction policy
resource limits
materializer version
~~~

Keep live collaboration transport separate from archival EFS checkpoints:

- encrypted relay or peer sync carries high-frequency changes;
- every change retains its engine-native causal identity;
- periodic immutable heads/snapshots/checkpoints land in EFS;
- snapshots are accelerators verified by replay or independent attestations;
- preservation exports retain an interoperable snapshot plus enough history/metadata to explain it.

Automerge changes have hashes and dependency heads. Yjs updates are associative, commutative, and idempotent, but merged updates do not automatically garbage-collect deleted content. Do not collapse either engine’s semantic operation identities into one generic EFS “op.”

Missing causal dependencies can make a document materially different, not merely “older.” Mark incomplete closure UNKNOWN, hold dependent changes, and never use it for gated truth.

Open-world/offline replicas make safe tombstone/history GC hard. Compact only under an explicit known membership/key epoch or retain the covered change set. A private new epoch may intentionally cut off old peers; make that visible.

Authorization and convergence are separate. A CRDT can converge on unauthorized operations. Validate actor capability/epoch independently.

---

## Privacy architecture

The current privacy document is directionally strong but claims “sound,” “solved,” and “would survive a cryptographer’s review” before a normative format, vectors, implementation review, or full system threat model exists. Replace that with:

> Primitive choices are plausible; end-to-end confidentiality is unverified until the file format, key lifecycle, recovery, implementation, metadata policy, and conformance suite exist.

### Privacy-context matrix

RFC 9614’s partitioning principle is the right frame. For every action, document what each observer learns:

| Observer | Typical leakage to model |
|---|---|
| Author/signing device | plaintext, identity, intended recipients, timing |
| Wallet/paymaster/relayer | account, submission contents or digest, destination, timing, funding |
| RPC/full node | IP or relay, chain, method, keys/slots queried, timing/volume |
| OHTTP relay | client network identity and traffic size/timing, but not encapsulated request |
| OHTTP gateway | request/content identifiers, not direct client IP absent collusion |
| Storage gateway/custodian | object identifiers, sizes, access timing, replica inventory |
| Public chain observer | author/payer/contract, graph topology, ciphertext sizes, admission timing |
| Browser/extensions/OS | origin activity, local identifiers, keys while used, network metadata |
| Collaborator | shared plaintext, membership/epoch information, future copies they retain |
| Recovery steward | share existence, ceremony timing, possibly identity/family relationships |

No single “private” badge should span these rows.

### Three product privacy profiles

1. **Public linked archive:** plaintext/public graph and maximum composability.
2. **Opaque public archive:** encrypted payloads and blinded names, explicitly accepting public topology, co-occurrence, count, size buckets, author/payer, and timing leakage.
3. **Local/private personal graph:** encrypted padded bundles and local indexes by default; only deliberate commitments/checkpoints or public shares reach a chain.

The third should be the default for personal OS data. The first two are publishing modes. “Private by default” cannot mean “we permanently publish encrypted personal metadata by default.”

### Normative file crypto still required

Specify:

- random per-file or per-epoch data-encryption keys;
- per-chunk AEAD and exact nonce derivation;
- AAD binding representation/profile, object/version, chunk index/offset, lengths, and key epoch;
- header authentication and downgrade prevention;
- wrap format, recipient identifier privacy, rotation, recovery, and algorithm registry;
- ciphertext/plaintext/stored digest meanings;
- padding/size-bucket policy;
- maximum expansion and parser limits;
- test vectors, misuse tests, and multi-implementation interop.

HPKE RFC 9180 is a good wrapping framework; MLS RFC 9420 is useful for evolving group key state where its membership/timing properties fit. AES-GCM-SIV is a possible misuse-resistant profile. “PQ-hybrid MUST” is not a complete format: pin the exact classical and standardized ML-KEM algorithms, combiner, transcript/AAD, downgrade rules, algorithm IDs, and migration behavior. Keep multiple decryptable wraps during migration.

Never derive encryption keys from author signing keys. Never use deterministic public convergent encryption by default. A custodian should be able to scrub ciphertext integrity without decryption authority.

### Stealth addresses are narrower than the current hope

ERC-5564 and ERC-6538 are Final and useful for private asset recipients. They do not automatically make EFS authorship unlinkable.

To hide a record author, a system must also solve:

- who funds and submits the stealth author’s writes;
- how the stealth author obtains gas without linkage;
- how readers discover/authorize it without publishing the correlation;
- timing, container, target, and co-occurrence linkage;
- announcement scanning and spam cost;
- recovery/rotation without re-linking epochs.

Treat stealth authors as a full-system experiment, not a simple reserved row. Do not burn a freeze-sensitive derivation domain until an end-to-end threat model and prototype demonstrate a meaningful unlinkability gain.

### Network and query privacy

- OHTTP RFC 9458 separates client IP from request contents between non-colluding relay/gateway roles; it does not hide the requested object from the gateway and is not PIR.
- Privacy Pass RFC 9576 can decouple some subscription/abuse proofs from individual requests.
- Tor/multi-hop routing provides a stronger network-observer story than a single relay and should be a first-class Guardian endpoint mode.
- Remote full-text/searchable-encryption services leak query/access/update/volume patterns unless proven otherwise. Default to local decrypted graph and full-text indexes.
- Normalize request sizes, batch/prefetch hot public indexes, add cover timing only under an explicit bandwidth budget, and avoid per-app unique endpoint polling.
- Running a user-controlled full node remains the strongest available Ethereum privacy mode; a remote “verified” RPC can still observe every request.

“No EFS telemetry” covers only participating EFS code. Wallets, browsers, extensions, RPCs, gateways, DNS, host OS, and model APIs remain separate observers.

### Private-century and crypto-shreddable diverge

Private-century requires diversified recovery shares, successor custodians, periodic rewrap/recovery drills, and long-lived key availability. Private-shreddable prioritizes destroying every usable key copy. Do not promise both as one property.

---

## Ethereum and wallet standards: adopt, track, avoid dependence

Standards status below is current to 2026-07-10. Status matters: deployed experiments and Draft/Review ERCs are useful adapters, but not constitutional dependencies.

### Adopt as stable adapters or constraints

| Standard | Current status/role | EFS ruling |
|---|---|---|
| **EIP-712** | Final typed structured signatures | Keep the chain-free EFS domain only with explicit replay intent, domain separation, golden wallet vectors, and leaf/summary ceremony |
| **EIP-6963** | Final multi-provider discovery | Use through the Kernel broker; never expose provider objects to apps |
| **EIP-5792** | Final Wallet Call API | Preferred wallet batching/capability negotiation with fallback; request atomic execution explicitly where required |
| **EIP-7702** | Final and deployed | Submission/batching/sponsorship rail only; never EFS portable authorship or app-controlled delegation |
| **EIP-7951** | Final P-256 verification precompile | Removes much on-chain verification cost for P-256; still require portable software verification, canonical low-s policy, and WebAuthn vectors |
| **EIP-7825** | Final 16,777,216 transaction gas cap | Hard ceiling for write and contract-composable query design |
| **ERC-5564 / ERC-6538** | Final stealth-address standards | Optional privacy experiment with end-to-end linkage analysis |
| **ERC-4804** | Final web3 URL standard | Retrieval adapter, not canonical EFS identity/citation |
| **ERC-1271 / ERC-6492** | Contract/counterfactual signature adapters | Valid for wallet/submission ecosystems; not portable EFS author proof because validity depends on chain code/state |
| **ERC-7201** | Namespaced storage layout | Appropriate for upgrade-safe namespace documentation where contracts are upgradeable |

EIP-7702 itself warns that applications should not ask users to sign arbitrary code authorizations; the wallet must control that highly privileged surface. EFS is correct to keep it below the envelope.

### Track, prototype behind adapters, do not floor the architecture on them

| Proposal | Current status | EFS treatment |
|---|---|---|
| **ERC-4337** | Final and widely deployed account-abstraction ecosystem, external infrastructure | Optional carriage/paymaster rail; user ops/bundlers are not artifact identity |
| **ERC-7677** | Review paymaster web-service flow | Optional sponsorship adapter with privacy/availability disclosure |
| **ERC-7715** | Draft wallet execution permissions | Inspiration/adapter only; EFS capability semantics remain its own typed, revocable authority model |
| **ERC-7579 / ERC-6900 / ERC-7821** | Draft modular-account/execution proposals | Do not choose one as the OS authority substrate yet |
| **EIP-8141** | Draft Frame Transactions | Watch native-AA direction; no launch dependency |
| **ERC-7920** | Draft composite EIP-712 | Useful shape/UX comparison; current EFS Merkle profile is not byte-compatible |
| **ERC-7964** | Draft cross-chain EIP-712 | Useful replay/domain analysis; not the basis of EFS portability |
| **ERC-7730** | Draft clear-signing descriptor format | Publish descriptors, but pin/mirror descriptor and registry snapshot; registry inclusion is not endorsement |
| **Proposed ERC-8213** | Unmerged external draft in ethereum/ERCs PR 1639 | Say “proposed/experimental ERC-8213 shape,” never imply an official indexed ERC |
| **ERC-7930 / ERC-7828** | Review interoperable binary addresses/names | Track for chain-specific UI/address encoding; do not replace EFS object identities |

EIP-7701 is Withdrawn in favor of the newer native-AA direction around Draft EIP-8141. Remove it from any forward dependency.

The current EF stewardship of the open ERC-7730 registry at clearsigning.org is real. However, the ERC leaves registry/curation out of scope, remains Draft, and registry inclusion is not an endorsement. Ship a descriptor inside the EFS/TUF closure, mirror the exact registry snapshot used, and apply local trust policy.

### Correct the current signing claims

- ERC-8213 is not yet in the official ERC index. Keep “shape” language and link the proposal status.
- ERC-7920/7964 are Draft comparisons, not proof that the EFS envelope “is standardized.”
- ERC-7730 can render the envelope header. It cannot make hidden Merkle leaves human-readable. System Chrome must recompute and display every high-risk leaf, and a wallet/device can only cross-check what its supported protocol actually binds.
- Chain-free EIP-712 replay is intentional EFS portability. The UI and spec must say that the same signature can be carried to every conforming venue; dedup/revocation semantics, not a chain domain, limit effects.
- Hardware-wallet and browser-wallet behavior for a chain-free domain must be tested, not assumed.

### Identity and account abstraction

“No ERC-1271 in portable authorship” is sound. “Bare EOA is the century identity forever” is not.

Use a stable digest-shaped self-certifying identity/KEL with replaceable authenticators:

- secp256k1 for launch;
- raw P-256 and a strict WebAuthn profile;
- threshold/organizational keys;
- future standardized post-quantum signatures;
- preserved historical key epochs and compromise/succession events.

Smart accounts, 7702 code, 4337, paymasters, and wallets remain submission/funding surfaces. They do not define the signed artifact’s author.

### Ethereum availability and verification reality

The official Ethereum light-client documentation, updated in 2026, says no listed light client including Helios is considered production-ready. Change “integrity solved” to:

> Verified against chain/checkpoint X through basis Y using verifier implementation/version Z; residual verifier, checkpoint, availability, and weak-subjectivity risks apply.

Use Helios as an experimental verifier behind a versioned interface and differential tests. Guardian profiles should support local full nodes and multiple providers/checkpoints. The Web profile must not market a research-grade light client as a finished trust boundary.

Fusaka’s PeerDAS improves rollup blob availability and validator bandwidth. It does not turn expiring blob data into archival storage. Ethereum’s current history-expiry direction already makes historical-log-only indexes unacceptable for core recovery; state expiry remains research, but century exports must assume chain rules can change.

---

## User experience: make sovereignty understandable

The design’s negative indicators, typed system prompts, private drafts, pending ladder, no hidden network, and explicit venue grades are strong. The main UX change is to stop making one word carry several durability/security states.

### User-visible state ladder

Use independent, plain-language states:

1. **Saved locally** — durable in the local journal on this device.
2. **Recovery copy made** — export/backup exists outside this browser/device.
3. **Signed** — a portable artifact exists; it may still be unpublished.
4. **Published** — public venue accepted it; permanence/privacy consequence shown.
5. **Replicated** — complete verified copies exist in named failure domains.
6. **Preservation current** — audits, representation closure, evidence epoch, recovery, and funding satisfy a named profile through a stated date.

Never collapse these into “synced,” “safe,” or a green preserved check.

The default Save action is local and immediate. Publish is a separate irreversible ceremony. Replicate and Preserve are separate follow-up operations. A user should never need to understand gas or lenses to know whether their only copy is still in one browser.

### The front door should look like Files/Library, not a protocol console

The likely flagship is a Files/Library + citations/archive surface:

- familiar folders, search, recent, shared, trash/local recovery;
- provenance and version history one level down;
- public publishing and preservation as deliberate actions;
- raw graph, chain, lens, query, and evidence detail available but progressive.

The “OS” metaphor is useful for architecture, not mandatory product vocabulary. Call the browser product EFS Web Runtime or workspace in security claims.

### Permission and signing UX

- Keep prompts rare, contextual, and system-owned.
- Display the exact app lineage, release/realization, requested capability, scope, duration, destination, and data sensitivity.
- Any replan, destination change, capability expansion, or authority-diff invalidates prior approval.
- Show full identifiers with grouped/checksummed rendering and user petnames; never rely on truncated address matching.
- High-risk ceremonies need a surface the app cannot paint; in the Web profile, browser-level mimicry still remains.
- Never auto-restore grants when rolling back code.
- Make “pause all,” “revoke all,” and “run quarantined” clear.

### Recovery is a product loop

At onboarding:

- register at least two independent recovery/authentication paths where possible;
- create an encrypted walk-away package;
- perform a real restore drill before showing “recovery ready”;
- state whether a synced passkey depends on Apple/Google/platform escrow;
- schedule periodic restore/rewrap/succession drills.

WebAuthn Level 3 is a 2026 Candidate Recommendation Snapshot, not a magical backup protocol. Its PRF extension is optional and RP-scoped. The specification explicitly does not define credential-key backup and encourages multiple credentials/recovery. Do not claim that a PRF output will necessarily survive origin/RP loss because a passkey syncs. Passkey PRF is a convenient unlock factor, not the sole sovereignty root.

### Accessibility and locale

- Keep WCAG 2.2 AA as the conformance floor; WCAG 3.0 remains a draft to track.
- Security state must never rely on color, animation, pointer precision, or a timed interaction alone.
- All identifier grouping, diffs, graphs, and status chips need screen-reader text and keyboard navigation.
- Avoid countdown confirmation theatre; interaction gating may prevent accidental clicks without excluding motor/cognitive users.
- Locale/font packs should be closure-addressed and available offline; locale choice should not become a high-entropy network fingerprint.
- Test high zoom, reduced motion, contrast modes, switch access, screen readers, RTL/bidi identifiers, and IME flows in every security ceremony.

### Agent UX and information flow

The plan → dry-run → approve → execute → receipt pipeline is correct. Add transitive taint:

- untrusted graph/web/document/model output remains untrusted when summarized or placed into typed fields;
- remote inference is both egress and untrusted input;
- private data plus untrusted instructions plus egress must not be recomposed through child agents;
- declassification is a narrow deterministic transform or a fresh human checkpoint;
- receipts pin inputs, model/tool versions where available, exact authority, outputs, and side effects without pretending nondeterministic model runs are reproducible.

Long-running agents, couriers, audits, and repair belong in Guardian, not a browser-background reliability promise.

---

## Best-practice scorecard

| Domain | Current EFS status | Judgment |
|---|---|---|
| Portable signed artifacts | Strong | Preserve |
| Deterministic IDs and replayable carriage | Strong, pending identity/type reconciliation | Preserve after P0 fixes |
| Venue/lens uncertainty semantics | Strong concept, one fatal sequence/query conflict | Reconcile before freeze |
| On-chain graph basics | Newly required, ABI/semantics unsafe | Redesign raw bounded index now |
| Graph interoperability | Directional only | Add Durable QueryPlan + RDF/GQL adapters |
| Logical/version/representation/bitstream model | Partial | Add explicit object model |
| Large files | Strong resumable mechanism, one-profile limitation | Add versioned representations |
| Filesystem semantics | Broad but labels overclaim | Rename/re-specify |
| Local-first journal/outbox | Strong | Preserve |
| CRDT collaboration | Promising, overstated | Separate engine profile/checkpoints |
| Reproducible system closure | Partial and currently impure | Split derivation/realization/receipt/activation |
| Canonical package bytes | Missing | Define NAR-like tree |
| Supply-chain evidence | Partial | SLSA + rebuilders + SBOM + monitoring |
| Update security | Materially incomplete | Use actual TUF semantics |
| Capability model | Strong idea, lifecycle mixed | Split ceilings/grants/runtime and add hard resource quotas |
| Browser app isolation | Overstated | Web profile only; distinct origin/process experiments |
| Native/hardened boundary | Correct new direction, not yet specified | Guardian first, appliance second |
| App ABI | Fragmented JS/Web/Wasm direction | WIT/WASI 0.3 canonical ABI |
| Privacy primitives | Plausible, not system-verified | Normative crypto + context matrix + local/private default |
| Network privacy | Honest in parts | Add Tor/partitioning; downgrade “solved” language |
| Identity rotation/recovery/PQ | Reserved but too late for century/stewardship | Pull KEL/recovery forward |
| Wallet/AA integration | Good separation of author from carriage | Correct standards/status claims |
| Verified Ethereum reads | Important direction, production claim false | Experimental verifier + full-node path |
| UX/security ceremonies | Strong | Keep, simplify lifecycle language |
| Accessibility/locales | Strong floor | Keep WCAG 2.2, test security surfaces |
| Agent safety | Strong capability pipeline, incomplete information flow | Add transitive taint/declassification |
| Hundred-year preservation | Copyability exists; operations/economy missing | Implement Century Profile from companion review |

---

## Cross-document amendment ledger

| ID | Current conflict or gap | Documents to amend | Coherent ruling |
|---|---|---|---|
| **C-01** | Same seq is both non-unique/non-duplicity and EQUIVOCAL | [[efsv2/codex-envelope]], [[efsv2/read-lens-spec]], [[clientv2/persistence-and-sync]], [[efsv2/codex-kernel]] | Collision is not global duplicity under a non-unique seq; narrow same-slot conflict or redesign seq |
| **C-02** | String-only versus typed property IDs | [[efsv2/codex-kinds]], [[efsv2/deterministic-ids]], [[efsv2/freeze-gates]] | Generic datatypeId + canonical bytes derivation; Durable datatype registry |
| **C-03** | Graph posting truncates bytes32 author to address | FS query corpus, [[efsv2/codex-kernel]], [[efsv2/identity]] | Preserve full identity; benchmark spine/full-ID/dictionary layouts |
| **C-04** | Reverse target key is untyped | [[efsv2/onchain-graph-queries]], [[efsv2/codex-kernel]], [[efsv2/read-lens-spec]] | Domain-separated targetKind + targetWord key |
| **C-05** | AND helper violates lens ordering/UNKNOWN/deny | FS query corpus, [[efsv2/read-lens-spec]] | Candidate-only DISCOVERY helper with witnesses; normative lens resolves |
| **C-06** | “Revoked-filtered backlinks” over append-only postings is unbounded/ambiguous | [[efsv2/onchain-graph-queries]] | Raw historical scan with scanLimit/highWatermark; caller chooses graph layer |
| **C-07** | Reverse index required in README/FS docs but optional/demoted elsewhere | [[efsv2/codex-kernel]], [[efsv2/deterministic-ids]], [[efsv2/read-lens-spec]], [[efsv2/fs-pass-james-decisions]] | Required typed raw reverse index; re-audit LIST reverse and REDIRECT cited-by before freeze |
| **C-08** | Closure hashes resolvedAt | [[clientv2/packages-and-updates]] | Pure realization; ResolutionReceipt separate |
| **C-09** | Personal grants/counters roll with code generation | [[clientv2/packages-and-updates]], [[clientv2/kernel-capability-model]], [[clientv2/boot-and-profiles]] | Separate distribution, authority, runtime graphs |
| **C-10** | App identity includes and excludes manifest hash | [[clientv2/packages-and-updates]], [[clientv2/kernel-capability-model]], [[clientv2/web-os-thesis]] | AppId stable; ReleaseId/ArtifactId/DerivationId/RealizationId distinct |
| **C-11** | Semver PIN called immutable despite LWW slot | [[clientv2/packages-and-updates]] | Digest identity; version-label rebinding becomes contested/manual-only |
| **C-12** | Lenses presented as TUF roles | [[clientv2/packages-and-updates]], [[clientv2/threat-model]] | Actual TUF verifier/metadata; lens composes as subjective policy |
| **C-13** | Service worker/self-pin and browser rescue imply stronger root | [[clientv2/web-os-thesis]], [[clientv2/boot-and-profiles]], [[clientv2/shell-and-sessions]] | Web origin trusted each boot; Guardian/installed signed artifact owns independent root/rescue |
| **C-14** | Same-origin “rings” imply protection domains | Entire client set | Rename Web trust tiers/realms; reserve rings for real process/VM isolation |
| **C-15** | Delete=revoke/trash | [[efsv2/fs-pass-synthesis]], [[efsv2/read-lens-spec]] | Relinquish, whiteout/hide, and destroy are separate |
| **C-16** | Arbitrary batch called visibility-atomic | [[efsv2/fs-pass-synthesis]], [[efsv2/os-pass-handoff]], [[efsv2/large-file-uploads]] | Commitment versus transaction admission versus completed-operation visibility |
| **C-17** | Alias/redirect called hardlink/rename | [[efsv2/fs-pass-synthesis]], [[efsv2/efs-v2-holistic-redesign]] | Use EFS-native names and document semantics |
| **C-18** | “Chain is journal; no corruption” | [[efsv2/fs-pass-synthesis]], [[efsv2/freeze-gates]] | Add independent verify/fsck, index parity, availability, and repair |
| **C-19** | Gas called quota | [[efsv2/fs-pass-synthesis]], [[clientv2/kernel-capability-model]] | Gas is admission cost; OS resources and state externality remain metered |
| **C-20** | web3 URL is both retrieval and canonical citation | [[efsv2/efs-v2-holistic-redesign]], [[efsv2/read-lens-spec]], [[clientv2/boot-and-profiles]] | Chain-independent typed EFS ID; web3/HTTPS/IPFS adapters; exact citation basis |
| **C-21** | Helios means integrity solved | [[clientv2/web-os-thesis]], [[clientv2/network-privacy]], [[clientv2/research-digest]] | Experimental verifier status and explicit checkpoint/horizon/implementation |
| **C-22** | Passkey PRF assumed broadly dependable and origin-loss recovery | [[clientv2/web-os-thesis]], [[clientv2/persistence-and-sync]], [[clientv2/wallet-and-actions]] | Optional RP-bound unlock factor; multiple independent recovery paths |
| **C-23** | Draft/proposed wallet standards sound final | [[clientv2/web-os-thesis]], [[clientv2/wallet-and-actions]], [[clientv2/research-digest]] | Add dated status table; adapters only; ERC-8213 explicitly external proposal |
| **C-24** | Confidentiality called sound/solved before format/review | [[efsv2/privacy]], [[clientv2/network-privacy]] | Primitive-level plausible; system-level unverified; three privacy profiles |
| **C-25** | Stealth payments assumed to solve EFS author graph | [[efsv2/privacy]], [[efsv2/fs-pass-freeze-reservations]] | Prototype funding/submission/discovery/timing before any Etched reservation |
| **C-26** | CRDT/BFT and missing-data claims overstate | FS collaboration corpus, [[efsv2/fs-pass-synthesis]] | Engine-specific causal identity, epochs, UNKNOWN closure, verified snapshots |
| **C-27** | One closure has no platform realization | [[clientv2/packages-and-updates]], [[clientv2/boot-and-profiles]] | Profile index plus exact per-platform RealizationId |
| **C-28** | No canonical filesystem package tree | [[clientv2/packages-and-updates]], [[clientv2/sdk-boundaries]] | Versioned deterministic EFS package-tree format |
| **C-29** | WIT/WASI treated as future | [[clientv2/kernel-capability-model]], [[clientv2/sdk-boundaries]], [[clientv2/research-digest]] | Adopt WIT as cross-profile ABI; raw ambient WASI authority forbidden |
| **C-30** | Denied rollback can retain old grants | [[clientv2/packages-and-updates]], [[clientv2/shell-and-sessions]] | Quarantine old code; monotone authority/security floors stay current |

---

## Recommended vNext ruling documents

Avoid another wide parallel fan-out before these seven documents agree:

1. **Architecture constitution and assurance profiles** — Web Runtime, Guardian, hardened host; exact TCB, roots, recovery, and claims.
2. **Identity, artifact, and link taxonomy** — App/Release/Artifact/Derivation/Profile/Realization/Receipt/Activation; exact/follow/query/capability links.
3. **Graph layers and query contract** — sequence/type rulings, raw typed indexes, bounded ABI, QueryPlan, RDF/GQL mappings.
4. **Representations, filesystem semantics, and Century Profile** — Work/Version/Representation/Bitstream, chunk/pack/sparse/range, fsck, custody/repair.
5. **Authority, packages, and updates** — three authority lifecycles, actual TUF, trusted time, supply chain, rollback quarantine.
6. **Privacy, identity recovery, and networking** — context matrix, normative crypto, local/private default, KEL/PQ, Tor/OHTTP, recovery.
7. **WIT app platform and user experience** — broker interfaces, process budgets, state ladder, permission/signing/recovery/a11y.

Each should include:

- normative invariants;
- exact non-goals and residual risks;
- conformance vectors;
- “works in Web / Guardian / appliance” matrix;
- migration/supersession relation to the July drafts;
- primary sources dated at promotion.

---

## Priority order

### P0 — before the Etched freeze

1. Resolve sequence collision/equivocation and the 10-bit device-field role.
2. Resolve typed-value derivation versus strings-only.
3. Reconcile required reverse indexes across kernel, deterministic IDs, lens, and FS docs.
4. Replace the truncated posting layout and type/domain-separate target keys.
5. Freeze only bounded raw scan semantics with scanLimit, highWatermark, full evidence, and gas budgets under EIP-7825.
6. Decide LIST reverse membership, REDIRECT cited-by, address targets, and which exact target kinds index.
7. Regenerate vectors and differential tests for every changed identity/index rule.
8. Ensure the algorithm/KEL/P-256/WebAuthn/PQ reservations can express non-EOA century stewardship without relying on chain-state signatures.
9. Decide the minimum representation-manifest hook and state/export material needed for dead-venue recovery.
10. Do not freeze stealth/ZK/PIR reservations without an end-to-end prototype proving they need kernel state.

### P1 — before calling client v2 an OS

1. Publish the identity/lifecycle split and pure realization format.
2. Define the canonical package tree and platform realization index.
3. Implement real TUF 1.0.34 semantics with offline roots, snapshots, trusted time, and conformance tests.
4. Specify Guardian and independent rescue; rename browser rings/trust claims.
5. Adopt WIT/WASI 0.3 app interfaces and hard process/resource budgets.
6. Specify authority state outside rollbackable generations.
7. Replace Helios “solved” claims with a verifier profile and local-full-node path.
8. Publish a normative file-crypto format and privacy-context matrix.
9. Implement the user-visible Saved/Recovery/Signed/Published/Replicated/Preserved ladder.
10. Run recovery, browser-origin-loss, malicious app, clock rollback, and denied-generation quarantine drills.

### P2 — after the boundary works

- hardened owner-root A/B appliance;
- independent rebuild network and transparency witnesses;
- RDF 1.2/RDFC and GQL adapters;
- encrypted CRDT relay and preservation checkpoints;
- content-defined chunking, packfiles, sparse/range profiles;
- private membership/PIR/stealth-author experiments;
- post-quantum evidence renewal and author-key migration;
- recurring Century custodians, audits, repair, succession, and funding.

---

## Experiment and conformance gates

### Protocol/graph

1. Same author/seq with different envelope roots in different and identical slots; one normative result across kernel/lens/client.
2. Full bytes32/digest-shaped authors through every posting/read/export path.
3. Cross-kind identical target words cannot contaminate indexes.
4. More than 1,024 and then 100,000 poisoned hot-target postings with bounded scan and stable continuation.
5. Pagination while new claims arrive, plus pinned-block reorg restart.
6. Raw discovery retains revoked/superseded evidence while SlotGraph/ResolvedGraph changes.
7. Lens vectors for UNKNOWN, STALE, deny, collision, fallthrough, and candidate AND.
8. On-chain consumer contract completes core pages well below 16.7 million gas; RPC profile tested separately.
9. Two independent QueryPlan implementations produce the same witnesses/results at a pinned basis.
10. RDF export canonicalizes identically in two implementations and round-trips claim provenance.

### Reproducible system/update

11. Same locked inputs resolved at different wall times, paths, locales, hosts, platforms, and network ordering yield the same Profile/Realization identities.
12. Three independent builders produce the identical canonical package tree.
13. Multi-architecture links never silently choose different bytes under one exact identity.
14. TUF official conformance suite; one hundred sequential root rotations; client returns after years offline.
15. Freeze, rollback, mix-and-match, endless-data, clock rollback, and every compromised-role scenario.
16. Power cut at every A/B update state; previous slot remains bootable until the new slot is healthy.
17. Denied old realization boots quarantined with no current keys, grants, network, or migrations.
18. Archived source/toolchain rebuild of Guardian with remaining opaque bootstrap seeds measured.

### Runtime/privacy/UX

19. One WASI 0.3 component runs unchanged through browser and Guardian adapters.
20. Hostile app exhausts CPU, memory, compile time, messages, storage, host calls, and streams; hard limits hold in Guardian and best-effort labels hold in Web.
21. Intentional SES escape attempts IndexedDB, OPFS, Cache, BroadcastChannel, Web Locks, WebCrypto, and every same-origin API.
22. Total browser-origin deletion, DNS/origin loss, and normal-disk loss; independent recovery still succeeds.
23. Ethereum verifier differential tests against multiple full clients/providers, stale checkpoints, and weak-subjectivity failure.
24. Wallet matrix for chain-free EIP-712, EIP-5792 atomic batches, 7702 submission, P-256, proposed digest comparison, and ERC-7730 fallback.
25. File-crypto multi-implementation vectors, nonce misuse, truncation/reordering, downgrade, key rotation, recovery, and crypto-shred residue.
26. Privacy-context tests capture RPC/gateway/relay/payer/timing/size leakage; OHTTP is not credited as PIR.
27. Concurrent offline CRDT edits, malicious dependency DAGs, actor collision, epoch removal, late join, and snapshot/replay equivalence.
28. Keyboard, screen-reader, high-zoom, reduced-motion, RTL/bidi, cognitive and motor-access testing for every high-risk ceremony.
29. First-time users correctly distinguish Saved, Recovery, Published, Replicated, and Preserved without protocol vocabulary.
30. Full walk-away/dead-venue/century retrieval using only ordinary files, packaged specs/verifier, user roots, and independent copies.

---

## Current primary-source map

These are the state-of-the-art anchors used for this review. Draft/Review specifications are intentionally labeled as such above.

### Reproducibility, packages, updates, and host security

- [Nix 2.33 derivation outputs](https://releases.nixos.org/nix/nix-2.33.0/manual/store/derivation/outputs/index.html)
- [Nix flakes remain experimental](https://nix.dev/concepts/flakes.html)
- [Nix Archive format](https://nix.dev/manual/nix/2.25/protocols/nix-archive)
- [Guix manual and bootstrap model](https://guix.gnu.org/manual/devel/en/guix.pdf)
- [Bootstrappable Builds](https://www.bootstrappable.org/projects/mes.html)
- [Reproducible Builds definition](https://reproducible-builds.org/docs/definition/)
- [SLSA 1.2](https://slsa.dev/spec/v1.2/)
- [SPDX 3.0.1](https://spdx.github.io/spdx-spec/v3.0.1/front/introduction/)
- [TUF 1.0.34 current specification](https://theupdateframework.github.io/specification/latest/)
- [TUF conformance results](https://theupdateframework.github.io/tuf-conformance/)
- [Uptane Standard 2.1](https://uptane.org/docs/2.1.0/standard/uptane-standard)
- [Sigstore threat model](https://docs.sigstore.dev/about/threat-model/)
- [OCI image manifest/index](https://github.com/opencontainers/image-spec/blob/main/manifest.md)
- [OSTree atomic upgrades](https://ostreedev.github.io/ostree/atomic-upgrades/)
- [bootc limitations](https://containers.github.io/bootable/what-needs-work.html)
- [WASI 0.3 release](https://wasi.dev/releases/wasi-p3)
- [Wasmtime 2026 security advisories](https://bytecodealliance.org/articles/wasmtime-security-advisories)
- [Linux Landlock](https://docs.kernel.org/userspace-api/landlock.html)
- [systemd rootfs/UKI trust chain](https://systemd.io/ROOTFS_DISCOVERY/)
- [systemd automatic boot assessment](https://systemd.io/AUTOMATIC_BOOT_ASSESSMENT/)
- [Linux dm-verity](https://www.kernel.org/doc/html/latest/admin-guide/device-mapper/verity.html)
- [Linux fs-verity](https://www.kernel.org/doc/html/latest/filesystems/fsverity.html)
- [Chrome Isolated Web Apps](https://developer.chrome.com/docs/iwa/introduction)

### Graph, filesystem, local-first, and preservation

- [RDF 1.2 Concepts](https://www.w3.org/TR/rdf12-concepts/)
- [RDF Dataset Canonicalization 1.0](https://www.w3.org/TR/rdf-canon/)
- [SPARQL 1.2 Query](https://www.w3.org/TR/sparql12-query/)
- [SHACL 1.2 Core](https://www.w3.org/TR/shacl12-core/)
- [ISO/IEC 39075:2024 GQL](https://www.iso.org/standard/76120.html)
- [Datomic model](https://docs.datomic.com/datomic-overview.html)
- [Local-first software](https://www.inkandswitch.com/essay/local-first/)
- [Automerge changes, storage, and repositories](https://automerge.org/docs/reference/concepts/)
- [Yjs document updates](https://docs.yjs.dev/api/document-updates)
- [FastCDC paper](https://www.usenix.org/conference/atc16/technical-sessions/presentation/xia)
- [IPFS CID specification](https://specs.ipfs.tech/cid/)
- [Software Heritage persistent IDs](https://docs.softwareheritage.org/devel/swh-model/persistent-identifiers.html)
- [RFC 6920 named-information URIs](https://www.rfc-editor.org/rfc/rfc6920.html)
- [BagIt RFC 8493](https://www.rfc-editor.org/rfc/rfc8493.html)
- [Oxford Common File Layout](https://ocfl.io/)
- [IPLD CARv1](https://ipld.io/specs/transport/car/carv1/)
- [Ceph erasure coding and failure domains](https://docs.ceph.com/en/umbrella/rados/operations/erasure-code/)

The companion [[2026-07-10-efsv2-century-storage-and-cypherpunk-os-review]] contains the OAIS, PREMIS, NDSA, Library of Congress, LOCKSS, evidence-renewal, and preservation-economics source set.

### Privacy, identity, accessibility, and browser trust

- [RFC 9614: Partitioning as an Architecture for Privacy](https://www.rfc-editor.org/rfc/rfc9614.html)
- [RFC 9458: Oblivious HTTP](https://www.rfc-editor.org/rfc/rfc9458.html)
- [RFC 9576: Privacy Pass](https://www.rfc-editor.org/info/rfc9576/)
- [RFC 9180: HPKE](https://www.rfc-editor.org/rfc/rfc9180.html)
- [RFC 9420: Messaging Layer Security](https://www.rfc-editor.org/rfc/rfc9420.html)
- [RFC 8452: AES-GCM-SIV](https://www.rfc-editor.org/rfc/rfc8452.html)
- [WebAuthn Level 3 Candidate Recommendation Snapshot](https://www.w3.org/TR/webauthn-3/)
- [WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/)
- [WCAG 3.0 working draft](https://www.w3.org/TR/2026/WD-wcag-3.0-20260226/)

### Ethereum and wallets

- [EIP-712 typed structured data](https://eips.ethereum.org/EIPS/eip-712)
- [EIP-6963 multi-provider discovery](https://eips.ethereum.org/EIPS/eip-6963)
- [EIP-5792 Wallet Call API](https://eips.ethereum.org/EIPS/eip-5792)
- [EIP-7702 set code for EOAs](https://eips.ethereum.org/EIPS/eip-7702)
- [ERC-4337 account abstraction](https://eips.ethereum.org/EIPS/eip-4337)
- [ERC-6492 predeploy signature validation](https://eips.ethereum.org/EIPS/eip-6492)
- [EIP-7951 P-256 precompile](https://eips.ethereum.org/EIPS/eip-7951)
- [EIP-7825 transaction gas cap](https://eips.ethereum.org/EIPS/eip-7825)
- [ERC-5564 stealth addresses](https://eips.ethereum.org/EIPS/eip-5564)
- [ERC-6538 stealth meta-address registry](https://eips.ethereum.org/EIPS/eip-6538)
- [ERC-4804 web3 URLs](https://eips.ethereum.org/EIPS/eip-4804)
- [ERC-7715 wallet permissions, Draft](https://eips.ethereum.org/EIPS/eip-7715)
- [ERC-7677 paymaster web service, Review](https://eips.ethereum.org/EIPS/eip-7677)
- [EIP-8141 Frame Transactions, Draft](https://eips.ethereum.org/EIPS/eip-8141)
- [ERC-7920 composite EIP-712, Draft](https://eips.ethereum.org/EIPS/eip-7920)
- [ERC-7964 cross-chain EIP-712, Draft](https://eips.ethereum.org/EIPS/eip-7964)
- [ERC-7730 clear-signing format](https://eips.ethereum.org/EIPS/eip-7730)
- [Proposed ERC-8213 pull request](https://github.com/ethereum/ERCs/pull/1639)
- [ERC-7930 interoperable addresses, Review](https://eips.ethereum.org/EIPS/eip-7930)
- [ERC-7828 interoperable names, Review](https://eips.ethereum.org/EIPS/eip-7828)
- [Ethereum light-client status](https://ethereum.org/developers/docs/nodes-and-clients/light-clients)
- [Ethereum statelessness, state expiry, and history expiry](https://ethereum.org/roadmap/statelessness/)
- [Ethereum 2026 protocol priorities](https://blog.ethereum.org/2026/02/18/protocol-priorities-update-2026)

---

## What not to build

- Do not build a new general-purpose kernel and driver ecosystem.
- Do not put a general query language or physical database plan in the immutable contract.
- Do not make one browser origin the only boot root, key vault, journal, or rescue path.
- Do not invent cryptographic constructions where HPKE, MLS, TUF, SLSA, established AEADs, and standard KEMs fit.
- Do not equate a storage token/payment, proof-of-storage, or chain state with a preservation program.
- Do not make OCI, IPFS, web3 URLs, Nix store paths, or Sigstore the universal identity/trust root.
- Do not require remote attestation or vendor permission to boot a user-owned machine.
- Do not make private personal metadata public merely because the payload is encrypted.
- Do not promise anonymous public authorship from stealth payment addresses alone.
- Do not force users to understand blockchain internals for ordinary saving, backup, sharing, or recovery.

---

## Final architecture recommendation

Proceed with EFS v2, but hold the irreversible freeze until the P0 identity/type/query contradictions are reconciled and executable vectors prove the result.

Build the product in this order:

1. **EFS semantic substrate:** narrow portable evidence, typed deterministic identities, bounded raw on-chain graph primitives, honest lens semantics.
2. **Representation + Century layer:** exact bitstreams, versioned manifests, portable packages, independent custody/audit/repair/evidence renewal.
3. **Guardian:** durable local journal/content graph, user roots/keys/recovery, private indexes, network brokers, couriers, audits, and app processes.
4. **One WIT app contract:** the same apps and semantics in Web Runtime and Guardian.
5. **Web Runtime:** excellent reach and UX with a named browser/origin assurance ceiling.
6. **Hardened appliance:** reproducibly built, verified A/B images with owner roots and independent rescue for users who need the stronger boundary.

The coherent cypherpunk promise is:

> EFS gives users portable evidence, local control, replaceable infrastructure, explicit authority, private work before deliberate publication, and an exit path that survives the disappearance or betrayal of every current steward—including EFS.

That promise is stronger and more defensible than “blockchain disk,” “browser OS,” or “stored forever.” It also supplies a practical test for every new design: if a component cannot be replaced without losing the user’s data, meaning, identity, or authority, it is still a dependency to isolate—not part of the root.
