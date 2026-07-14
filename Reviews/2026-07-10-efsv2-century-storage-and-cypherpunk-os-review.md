# 2026-07-10 — EFS v2 century storage + cypherpunk OS deep review

**Status:** point-in-time architecture review; input to the next EFS v2 and client/OS revisions, not canon.

**Scope:** the current local [[efsv2/README|EFS v2]] and [[clientv2/README|client v2 / web OS]] design sets, including the 2026-07-10 filesystem/privacy pass and [[os-pass-handoff]]. The planning worktree already contained substantial in-flight work, so this review changed no design documents and makes no freeze or promotion claim.

#status/review #kind/review #repo/planning

## Executive verdict

Do not throw either design away. Change the promise and add the missing layers.

| Area | Verdict | What that means |
|---|---|---|
| EFS v2 as a portable fact/authenticity substrate | **Strong** | Chain-free signed envelopes, deterministic IDs, state-resident bodies, enumerable state, portable chunks, venue-qualified truth, and self-hosted interpretation are unusually good foundations. |
| EFS v2 as a 100-year storage system | **Not yet** | It makes authentic replication possible; it does not make custody, auditing, repair, interpretation, crypto renewal, succession, or funding happen. |
| Client v2 as an EFS Web Runtime | **Promising** | Local-first state, explicit capabilities, honest pending states, no app network by default, declarative UI, and exportability are worth building. |
| Client v2 as a high-assurance cypherpunk OS | **Not yet** | One browser origin cannot supply secure boot, independent recovery, hard protection rings, durable agents, or sovereign key custody. |

The recommended product shape is:

1. **EFS v2:** the narrow, portable authenticity and coordination substrate.
2. **EFS Century Profile:** a preservation control plane above EFS: packages, independent custodians, audits, repair, format survival, crypto-evidence renewal, succession, and funding.
3. **EFS Web Runtime:** the universal, low-friction browser face with an explicit browser-origin trust ceiling.
4. **EFS Guardian:** a small native sovereignty boundary for roots, keys, durable storage, network mediation, updates, recovery, couriers, and long-running agents.
5. **Optional hardened appliance:** a bootable, reproducible distribution built on an existing capability/compartment platform rather than a new kernel.

The durable product is not a chain, token, browser, storage market, or signature suite. It is the ability to replace every one of those without losing the data, meaning, identity, or proof history.

---

## The promise must be decomposed

“Stored for 100 years” is not one property. The next design should make six independent claims:

| Axis | Question at year 100 |
|---|---|
| **Bit survival** | Can complete bytes be recovered from independently controlled copies? |
| **Interpretability** | Can a future reader understand or render them without today’s hosted app? |
| **Authenticity evidence** | Is authorship/existence still defensible after hashes, signatures, witnesses, and chains change? |
| **Confidentiality and key recovery** | If private, are ciphertext and legitimate recovery keys both available—and have keys been migrated safely? |
| **Currency and intent** | What was current, revoked, or trusted as of which checkpoint? |
| **Discovery and succession** | Can a reader find the object and its stewards without ENS, DNS, one gateway, one repo, or one company? |

Chain finality answers only a subset of the first question: “this venue committed this state and has not rolled it back.” It does not answer whether a functioning machine, funded custodian, usable decoder, defensible algorithm, or authorized successor exists in 2126.

This is also the distinction made by the current [OAIS reference model](https://ccsds.org/Pubs/650x0m3.pdf): long-term preservation is an operated system of ingest, archival storage, data management, access, migration, representation information, and organizational responsibility—not retained bits alone. The [Library of Congress sustainability factors](https://www.loc.gov/preservation/digital/formats/sustain/sustain.shtml), [PREMIS](https://www.loc.gov/standards/premis/), and [NDSA Levels of Digital Preservation](https://www.ndsa.org/publications/levels-of-digital-preservation/) point in the same direction.

---

## What should survive intact

### EFS v2

- Chain-free envelopes and deterministic claim/object IDs are the right basis for dead-chain recovery and re-carriage.
- State-resident bodies plus an enumeration spine are much safer than log-only reconstruction.
- “UNKNOWN is not PROVEN-ABSENT,” venue-qualified currency, anti-fallthrough behavior, and refusal to fabricate cross-chain “latest” are essential preservation honesty.
- Signed chunk manifests, permissionless re-submission, and substrate-neutral verification are useful archive primitives.
- Codex self-hosting, golden vectors, reference derivations, and state-walk procedures are exactly the instincts a century system needs.
- Keeping a logical DATA identity distinct from changing bytes is sound, provided an immutable representation/version layer is added.
- The .efs-bundle decision is a good submission and hand-carry primitive.

### Client / OS

- “Verify, label, grant, keep” is a strong constitution.
- Draft-first writes, the pending-state ladder, resumable outbox, and “signed bundle = live grenade” model are unusually honest.
- Picker-minted handles, capability-oriented APIs, declarative rendering, and no ambient app HTTP are good least-authority directions.
- System-owned authority prompts, negative security indicators, explicit venue/read grades, and private-by-default onboarding should remain.
- No telemetry/phone-home by default, user-selectable endpoints, and an offline export/walk-away path are genuinely cypherpunk.
- The Browser runtime should remain replaceable and should never own the only copy of a key, trust root, journal, or recovery path.

---

## P0 findings for the next revisions

### C1. “Permanent state” is a venue property, not a century guarantee

[[large-file-uploads]] correctly admits that a tier-0 copy lasts as long as its chain and that automated replication, completion funding, and LOCKSS-like guarantees are open. Other passages still use “permanent state” too broadly.

Ethereum’s own current roadmap discusses [state expiry and statelessness](https://ethereum.org/roadmap/statelessness/); execution clients already support [partial history expiry](https://blog.ethereum.org/2025/07/08/partial-history-exp). An L2 or L3 adds its own governance, upgrade, data-availability, proving, and operator dependencies.

**Required change:** use “state-resident and contract-readable at venue V under V’s current rules.” A century-grade object additionally requires a substrate-neutral export containing raw chunks, roots, manifests, extraction rules, proof/recomputation material, and enough deployment/spec context to revive it without the original RPC, address, EVM, or chain.

### C2. The authenticity doctrine contradicts itself

[[read-lens-spec]] §5.1 says authenticity “never degrades” and is “unconditional”; its 100-year example says every record re-verifies from bytes alone. [[identity]] correctly says the opposite: after a cryptographically relevant quantum break, anchored material may retain existed-before-epoch evidence, while unanchored envelopes can become hearsay.

A historical signature can still pass its old verification equation after forgery becomes feasible. That is not the same as continuing to prove authorship.

**Required change:** add a separate crypto/evidence axis, for example:

- **SIGNATURE-VALID:** the historical algorithm verifies the bytes.
- **AUTHENTIC-AS-OF(E):** surviving evidence places the artifact before security epoch E.
- **ERA-UNANCHORED:** the old signature verifies but no trustworthy pre-break evidence survives.
- **EVIDENCE-RENEWED:** a later preservation epoch binds the old evidence into a current suite.

[RFC 4998 Evidence Record Syntax](https://www.rfc-editor.org/rfc/rfc4998.html) exists because signatures, timestamps, and hashes weaken. It renews timestamp/hash-tree evidence before compromise. Pair that with an explicit algorithm registry and crypto-agility process; [RFC 7696](https://www.rfc-editor.org/info/rfc7696/) and [NIST’s crypto-agility guidance](https://csrc.nist.gov/pubs/cswp/39/upd1/considerations-for-achieving-crypto-agility/final) are useful constraints.

### C3. DATA identity is not yet an archival citation

The current model usefully separates logical identity from content, but a mutable DATA object/path plus changeable content-hash or mirror claims is insufficient for a century citation.

The next model needs four levels:

1. **Work:** stable logical identity, such as “James’s charter.”
2. **Version:** an authored state in that work’s history.
3. **Representation:** a particular Markdown, PDF/A, image, encrypted, or software rendition.
4. **Bitstream:** exact bytes/chunks and algorithm-qualified fixity.

A century citation should bind at least:

    workId
    versionClaimId
    representationManifestClaimId
    fixitySet
    interpretationProfileHash
    evidenceEpoch

Keep the kernel narrow. First standardize the representation manifest as a convention built from existing kinds. Decide before freeze only whether universal O(1) lookup needs a reserved row.

### C4. Bare-EOA-first cannot be the century stewardship root

[[identity]] honestly records the failure: key loss can become identity death; theft before KEL inception can become permanent capture; bare EOAs have no PQ path by themselves; smart-wallet-only and threshold organizations are excluded.

That may be an acceptable launch limitation for ordinary author keys. It is not acceptable for “century preserved,” OS update roots, archive stewards, or inheritance.

**Required change:**

- Distinguish stable identity from current signing keys.
- Pull rotation, recovery, succession, and algorithm-agile key events forward for stewardship identities.
- Use threshold/offline governance for preservation policy and update roots without forcing threshold authorship on every ordinary record.
- Preserve historical key state so old records remain interpretable while compromised keys cannot authorize future stewardship actions.
- Treat passkeys, hardware keys, EOAs, and future PQ keys as replaceable authenticators.

Nothing should receive a century status until its stewardship authority has tested loss recovery, compromise recovery, and succession.

### C5. Copyability is present; preservation operations are not

The architecture makes copying permissionless. It does not ensure anyone runs a copier, notices corruption, has repair authority, pays storage renewal, preserves a decoder, or succeeds a dead steward.

The [LOCKSS preservation principles](https://www.lockss.org/about/preservation-principles) emphasize independent control, continuous validation, conservative repair, and survival of institutional failure. The [LOCKSS FAQ](https://www.lockss.org/about/frequently-asked-questions) recommends at least four copies so temporary unavailability does not destroy majority diagnosis.

**Required change:** define a Durable Century Profile with independent administrative, geographic, software, legal, and economic failure domains. “Five chains” is not five copies if they share an L1, operator, client, cloud, key, or funding source.

### C6. There is no durability economy

Admission gas funds admission. It does not fund a century of audits, retrieval tests, media refresh, storage deals, format migration, re-encryption, crypto renewal, incident response, or stewardship.

No existing substrate removes this obligation:

- [IPFS content is collectible unless it remains pinned](https://docs.ipfs.tech/concepts/persistence/).
- [Filecoin storage is expressed through time-bounded deals](https://docs.filecoin.io/basics/what-is-filecoin/storage-model) and long retention still needs renewal/repair.
- [Arweave’s endowment](https://docs.arweave.org/developers/development/protocol) is an economic model with assumptions, not a physical guarantee.
- Institutional/object/cold storage still needs operators and succession.

Use a plural funding and custody model: renewable treasury/endowment, public runway reporting, competing stewards, contestable replacement, user-held exports, and multiple storage families. EFS should coordinate identity, provenance, policy, receipts, and repair; it should not pretend to replace every archive or storage network.

### O1. The Worker cage does not have “only postMessage” as a channel

[[web-os-thesis]] and [[kernel-capability-model]] say a Ring-3 Worker with network-denying CSP has only postMessage to the Kernel. This is too strong.

A same-origin Worker can have origin-scoped platform access such as storage and coordination APIs. The [File System Standard](https://fs.spec.whatwg.org/) defines origin-private storage; the [HTML Worker model](https://html.spec.whatwg.org/multipage/workers.html) exposes a substantial WorkerGlobalScope. Depending on engine/API availability, this includes paths such as IndexedDB, OPFS, BroadcastChannel, Web Locks, and other same-origin facilities. CSP can block network egress; it does not turn a same-origin Worker into a storage-isolated principal.

SES can remove globals from honest code, but the design itself treats SES as hardening rather than the boundary. After an SES/runtime escape, a same-origin app may read/corrupt origin state or attack coordination channels even if it still cannot fetch.

**Required change:**

- Prototype an opaque-origin or distinct-origin cradle in all supported engines.
- Put third-party app execution outside the trusted Chrome/Kernel storage origin.
- Treat the Web profile as low/medium assurance if cross-engine isolation cannot be demonstrated.
- Prefer a native process/WASI sandbox for high-assurance third-party code.
- Add CPU, memory, storage, message, wall-clock, and rendering quotas.

The claim should become “zero-authority launch under stated sandbox assumptions,” not “always safe to execute.”

### O2. Same-origin rings are trust tiers, not protection rings

The design admits Bootstrapper, Kernel, System Chrome, and Session Shell share the browser’s real protection domain. A compromised same-origin privileged bundle can read local storage, use available keys, falsify ceremony UI, or replace policy.

**Required change:** rename the browser architecture to trust tiers/realms/software membranes. Reserve “protection ring” for process, VM, or capability-kernel isolation. System Chrome is conserved first-party UI, but it is not a secure desktop while it shares the origin and host browser.

### O3. A self-pinning service worker is not secure boot

The PWA lane says first load is TOFU and later loads are protected by a self-pinning service worker. Against origin compromise, that is not a root of trust.

The [Service Workers specification](https://w3c.github.io/ServiceWorker/) defines independent update checks and replacement of registrations. A compromised origin can supply a new worker/bootstrap path; the code asked to enforce the pin is still delivered and managed under browser/origin authority.

**Required change:**

- PWA copy: “the HTTPS origin, browser, extensions, and host remain trusted on every boot.”
- Put a durable update root in a native launcher/Guardian, signed install artifact, or browser-enforced signed package where available.
- Use actual threshold root metadata with offline custody and old-plus-new root rotation.
- Carry full [TUF 1.0.34 semantics](https://theupdateframework.github.io/specification/latest/) or run an existing TUF verifier with EFS as transport/transparency; a lens-shaped analogy is not enough.

The TUF design matters especially because it supports clients whose root metadata is years out of date by walking and verifying every intermediate root rotation.

### O4. Rescue Shell is not in an independent failure domain

[[persistence-and-sync]] correctly says origin eviction kills every local tier together. Keeping current and previous closures in Cache/OPFS can recover a bad generation; it cannot recover total origin deletion, domain loss, hostile origin code, browser loss, or steward disappearance.

**Required change:**

- Rename the browser Rescue Shell to generation-failure recovery.
- Add an independent rescue CLI/native launcher/offline image or file-based viewer.
- Export the last trusted roots, high-watermarks, revocation floor, generation, journal, keys/recovery shares, Codex, and verifier.
- Test recovery with no original origin, DNS name, official gateway, browser profile, or EFS-operated service.

Passkey PRF can be a convenient unlock, but WebAuthn credentials remain RP-domain scoped. It must not be the only sovereignty root.

### O5. Persona scope is local policy, not cryptographic attenuation

A persona key accepted as an EFS author can sign arbitrary records if stolen. Local Kernel budgets, kinds, and subtree rules do not constrain third-party verification. The newer FS pass correctly re-homes delegation to reader policy, but older client text still describes personas as though their blast radius were protocol-bounded.

The proposed persona-wide pre-signed revoke-all artifact is also not constructible for unknown future hostile claims: claim IDs commit to the exact author, sequence, and record digest. Exact bundle abort artifacts are possible; a future universal claim list is not.

**Required change:**

- Define delegator, actor, scope, validity, and revocation as reader-verifiable conventions.
- Out-of-scope actor claims remain the actor’s raw claims but never resolve as “on behalf of” the delegator.
- Label local mandate enforcement as local.
- Keep persona stakes small and rotating until a verifiable delegation/identity layer exists.

### O6. Agent safety must track information flow, not only capability sets

The “lethal trifecta” invariant is good, but a quarantined child that reads hostile content and returns schema-valid fields to a private-data-plus-network parent recomposes the same flow. JSON Schema validates shape, not meaning.

**Required change:**

- Propagate untrusted-content taint transitively across sessions, tools, model calls, plans, and returned fields.
- Count remote inference as both egress and untrusted input.
- Permit declassification only through narrow deterministic transforms or a human checkpoint.
- Re-plan dynamic research tasks in stages; each authority or sink expansion gets a visible diff.
- Make sinks reject tainted values in destinations, request bodies, queries, filenames, and authority-bearing fields unless explicitly declassified.

### O7. Several implementation claims need correction

- A sandboxed about:srcdoc egress iframe inherits the parent’s policy container. A second CSP can further restrict but cannot loosen parent connect-src none. Use a real separate egress origin/process or treat broker code as the sole boundary until a tested backstop exists. See the [HTML policy-container model](https://html.spec.whatwg.org/multipage/browsers.html#policy-containers) and [CSP Level 3](https://www.w3.org/TR/CSP3/).
- Active hostile HTML/SVG/PDF should not receive allow-scripts by default. Prefer sanitization, inert parsing/rasterization, or a disposable separate origin/process.
- “Integrity solved” needs a chain checkpoint and horizon: “verified against chain X, checkpoint Y, finalized through Z.”
- Browser-side “no ambient HTTP” applies only to participating EFS code. The browser, extensions, wallet, DNS, host OS, and other applications remain outside the broker.

---

## Recommended century architecture

### 1. Keep the Etched kernel narrow

EFS remains the authenticity and coordination layer:

- signed envelopes and deterministic IDs;
- five record kinds and their read semantics;
- state enumeration and chunks;
- venue-qualified evidence;
- portable claims and permissionless carriage.

Do not add a PREMIS-shaped kernel. Build preservation semantics as Durable conventions and computed policy. Add irreversible surface only after at least two independent implementations prove a missing primitive.

### 2. Add an EFS Century Profile

A versioned Century Profile should define deposit, maintenance, retrieval, and honest status.

**Deposit**

- Exact graph closure and all signed envelopes/bodies.
- Original bitstreams plus non-destructive preservation/access renditions.
- Representation manifests: format/version, media type, encoding, schema, canonicalization, fonts, dictionaries, codec/spec/source, viewer/emulator, fixtures, and significant properties.
- Multiple algorithm-qualified digests.
- Provenance, rights, custody, venue evidence, lens/basis inputs, and read-policy version.
- Encryption and succession policy where applicable.
- Required copy count and named failure-domain constraints.

**Maintenance**

- Scheduled fixity and full-retrieval audits.
- Conservative repair with quarantine and evidence retention.
- Format watch and migrations that retain the original.
- Re-encryption/rewrap and crypto-evidence renewal before algorithms weaken.
- Custody transfers and steward succession.
- Dead-chain state exports and re-carriage.
- Funding runway and next-renewal date.

**Retrieval**

- Reconstruction from one ordinary filesystem package without RPC, DNS, ENS, or an EFS service.
- Verification using a tiny reference verifier, packaged Codex, and golden vectors.
- Comparison of independent copies.
- Reproduction of the intended view from explicit lens/basis/evidence inputs.
- Human-readable fallback for the most important content.

### 3. Define a Century Bundle / AIP

The existing .efs-bundle should remain the signed submission/custody artifact. Wrap it in a preservation package, provisionally .efs-aip or “Century Bundle.”

Illustrative layout:

    century-root.cbor
    README.txt
    objects/<multihash>
    efs/envelopes/
    efs/records/
    efs/chunks/
    evidence/venues/
    evidence/crypto-epochs/
    representation/specs/
    representation/renderers/
    representation/fixtures/
    preservation/events/
    preservation/custody/
    recovery/
    codex/
    vectors/

Use established formats where useful rather than inventing every layer:

- [BagIt, RFC 8493](https://www.rfc-editor.org/rfc/rfc8493.html) for inventory/transfer ideas.
- [OCFL](https://ocfl.io/) for versioned object layout and validation ideas.
- [IPLD CAR](https://ipld.io/specs/transport/car/carv1/) for content-addressed block transport.
- OAIS/PREMIS for preservation objects, events, agents, provenance, fixity, and representation information.

The package must be self-describing enough that EFS’s original implementation repository is convenient, not required.

### 4. Encode preservation receipts using existing kinds

Candidate conventions:

- PreservationPolicy
- RepresentationManifest
- FixitySet
- CustodyReceipt
- AuditReceipt
- RepairEvent
- MigrationEvent
- EvidenceRenewal
- RecoveryManifest
- StewardSuccession

These are claims by archivists/witnesses, not magical protocol truth. A reader’s preservation lens decides which stewards and witnesses count.

### 5. Make preservation status multi-dimensional and time-bound

Never add one green “preserved” badge. Compute:

    preserved(profile, epoch) =
      package complete
      AND sufficient recoverable copies
      AND required failure-domain diversity
      AND recent audits
      AND representation closure usable
      AND crypto evidence current
      AND required recovery keys tested
      AND funded runway above policy floor

Render the dimensions and dates separately:

- recoverable copies;
- last full retrieval;
- venue/administrator diversity;
- format status;
- crypto status;
- confidentiality/recovery status;
- funded runway;
- currency/revocation grade.

The existing mirror sweep can answer availability. It should not be relabeled preservation.

### 6. Start with a plural replica policy

An initial profile to test—not protocol law:

- at least four complete, recently verified copies;
- at least three independent administrators;
- at least two geographic/legal disaster domains;
- at least two technology/economic substrate families;
- at least one offline or user-controlled cold copy;
- no principal able to modify every copy or command repair alone.

Store at least one copy outside chains and one outside decentralized storage markets. Periodic full retrieval matters more than provider proof alone.

### 7. Separate private-century from private-shreddable

These are different products:

- **Public-century:** no secret is needed to recover content.
- **Private-century:** threshold/diverse recovery, successor custodians, PQ-hybrid wraps, periodic recovery and rewrap drills. It cannot honestly promise easy crypto-shredding.
- **Private-shreddable:** key destruction is prioritized; century accessibility is not promised.

The UI must not claim one object is both guaranteed recoverable in 2126 and reliably erasable by destroying a sole key.

---

## Recommended OS architecture

### Profile A — EFS Web Runtime

Purpose: reach, onboarding, citations, viewers, ordinary file work, guest sessions, and low/medium-assurance apps.

- Explicitly trusts browser + extensions + host + HTTPS origin on each boot.
- Keeps no irreplaceable root/key/state solely in the origin.
- Uses opaque/distinct origins for third-party code and active documents where proven.
- Uses external signers for high-risk actions.
- Treats browser storage as workspace/cache until exported or replicated.
- Promises resumable, not continuously running, couriers and agents.
- Names its security ceiling in UI/docs.

### Profile B — EFS Guardian-backed personal OS

Purpose: the near-term sovereignty boundary.

A small native Guardian owns:

- user-held TUF root and verified generations;
- encrypted journal and content store;
- identity/KEL/recovery state;
- hardware/OS-keystore/passkey integration;
- checkpoint store and light-client verification;
- Tor/OHTTP/self-host/direct network brokers;
- couriers, audits, repairs, and long-running agent scheduler;
- WASI/Wasmtime or OS-sandboxed app processes with quotas;
- isolated hostile-document renderer;
- stable local capability IPC;
- independent export/recovery CLI.

The browser Shell becomes one replaceable client of the Guardian. It has no root keys or sole durable state. [Wasmtime’s security model](https://docs.wasmtime.dev/security.html) is useful for a native sandbox, but it remains one defense layer and needs host process controls and resource limits.

### Profile C — Hardened appliance / literal OS

Purpose: high-risk keys, private archives, dissidents, institutions, stewards, and offline signing.

Do not write a general-purpose kernel and hardware stack first. Build on a compartmentalized base:

- [Qubes OS](https://doc.qubes-os.org/en/latest/developer/system/architecture.html) for VM-separated security domains;
- [Genode/Sculpt](https://genode.org/documentation/articles/sculpt-25-10) for capability-oriented component composition;
- [seL4](https://docs.sel4.systems/Tutorials/capabilities.html) where formally strong capability isolation justifies the engineering cost;
- or an immutable NixOS/Guix/OSTree-style appliance with process/WASI isolation.

Expected properties:

- verified boot and independently held update root;
- reproducible A/B generations;
- full-disk encryption;
- per-app process/VM/WASI isolation;
- host firewall/network namespaces;
- hardware-backed signing option;
- read-only rescue partition plus offline image;
- export formats independent of the distribution.

The same EFS formats, capabilities, app contracts, read grades, and recovery packages should cross all profiles.

---

## Alternatives considered

| Alternative | Strength | Fatal limitation / role |
|---|---|---|
| Full on-chain archive | Strong small-object consensus visibility and contract reads | Cost, public metadata, chain/crypto/governance dependence; one venue, not a preservation program |
| Storage-market-only | Scalable bytes and economic proofs | Finite/assumption-dependent service, no semantic preservation or succession |
| User home vault/federation | Real custody and privacy | Operational burden and uneven availability; useful as one replica family |
| Arweave-first permanence | Simple user story and prepaid economic model | Still one protocol/economic assumption; use as a mirror, not the guarantee |
| Browser-only OS | Excellent reach | Origin trust, weak isolation, evictable storage, no secure boot or durable background |
| New OS/kernel from scratch | Maximum theoretical control | Driver/hardware/update burden swallows the mission; reuse Qubes/Genode/seL4/Linux mechanisms |
| **Hybrid preservation mesh + Web Runtime + Guardian** | Replaceable carriers, diversified custody, reachable UI, stronger roots | Requires sustained operations and funding—which is unavoidable and should be explicit |

---

## Concrete corrections to the current corpus

| Current claim/design | Correction |
|---|---|
| “Authenticity never degrades” / “unconditional” | Historical signature validity is not durable authorship evidence; add crypto/evidence epochs. |
| “Every offline record re-verifies from bytes alone” | It re-runs a historical equation; century authenticity also needs surviving pre-break/renewed evidence. |
| “Permanent state” | State-resident at venue V; century recovery requires independent package/custody. |
| “Worker’s only channel is postMessage” | Same-origin Worker platform/storage channels exist; isolate origins/processes. |
| “Zero-power execution is always safe” | Installing inert bytes grants no authority; executing hostile code still risks runtime exploit and DoS. |
| “Self-pinning SW” after TOFU | Origin remains trusted; secure root must be outside replaceable origin code. |
| Browser Rescue as eviction/steward hedge | It handles bad generations only; total-loss rescue must be independent. |
| Persona scope bounded by Kernel | Local policy only after key theft; make on-behalf-of scope reader-verifiable. |
| Persona-wide pre-signed revoke | Impossible for unknown future claim IDs; exact-bundle abort only. |
| Child agent + JSON schema breaks trifecta | Taint composes transitively; schema is not declassification. |
| TUF “mapped” onto lenses | Carry full TUF semantics or use a conforming TUF verifier. |
| One capability table snapshots with generation | Split immutable ceilings, monotone user authority/revocations, and ephemeral live ports/meters. |
| App identity includes and excludes manifestHash | Stable AppId = author + app root; manifest/package hash identifies a release. |
| “No ambient HTTP” | True inside the participating runtime only, not system-wide in a browser. |

---

## Next-version document set

Prefer a small number of ruling documents over another broad fan-out:

1. **EFS Century Profile** — object/representation model, Century Bundle, preservation events, computed grades, custody, funding, and marketing vocabulary.
2. **Crypto-evidence and migration** — algorithm registry, hash/signature weakening, evidence renewal, KEL/PQ/key epochs, successor verification.
3. **Protection domains and trust roots** — Web/Guardian/hardened profiles, exact TCBs, app/document isolation, secure boot/update root, rescue.
4. **Authority state and delegation** — immutable package ceilings vs user grants vs live ports; monotone revocation; persona/on-behalf-of semantics.
5. **Agent information-flow model** — taint propagation, deterministic declassification, remote inference, staged plans, sink rules.
6. **Reconciliation amendment** — bring the July 7 client set up to the July 10 FS/OS contract before further UI expansion.

Freeze-sensitive questions to answer now:

- Does universal representation-manifest lookup need a reserved row?
- Are all digest/signature algorithm identifiers and successor hooks encoded?
- Can a future verifier reconstruct legacy IDs without a live registry?
- What minimum identity/key-event reservation is needed for safe stewardship migration?
- What state/proof export is required to revive EFSBytes after venue death or state expiry?
- Which EFS facts constitute historical observation without pretending to establish global currency?

Everything else should stay Durable until interoperable implementations exist.

---

## Decision and experiment gates

### Before the Etched freeze

- Resolve the unconditional-authenticity contradiction.
- Finish migration/hash-agility reservations.
- Decide the representation manifest and archival citation tuple.
- Produce the standalone Codex-bytes/export specification.
- Write protection-domain/root-of-trust and authority-state splits.
- Pull identity recovery/succession far enough forward that early century data cannot be orphaned.
- Reconcile client v2 against [[os-pass-handoff]].

### Before any “100-year” claim

1. Run the already-required dead-chain fire drill in [[freeze-gates]].
2. Recover a complete object with original chain, RPC, ENS/DNS, gateway, repo, relayer, author, and EFS-operated services unavailable.
3. Build a second verifier from the packaged Codex/vectors alone.
4. Corrupt one copy; detect, quarantine, diagnose, and conservatively repair it from independent custodians.
5. Renew a historical hash/signature evidence set into a successor suite.
6. Export and revive an EFSBytes object without the original contract runtime.
7. Migrate one obsolete/proprietary-format fixture while preserving and verifying the original.
8. Recover a private-century archive after loss of every normal device and origin.
9. Dissolve one steward and transfer custody/funding to an unrelated organization.
10. Operate recurring audits long enough to measure recovery reliability and cost.

### Before claiming the Web cage is a security boundary

1. Test same-origin Worker access to IndexedDB, OPFS, Cache, BroadcastChannel, Web Locks, WebCrypto, and every engine-specific API after an intentional SES escape.
2. Prototype opaque/distinct-origin app cradles on Chromium, Firefox, and Safari.
3. Demonstrate that the proposed egress lane works under actual inherited CSP policy.
4. Serve a malicious service-worker update after a clean first pin and observe the trust failure.
5. Clear the entire origin and recover with no network.
6. Attempt vault-key use from a compromised same-origin Shell dependency.
7. Run hostile zero-grant CPU/memory/storage/message/compositor workloads.
8. Restore an archive after RP-domain loss without the original passkey path.
9. Steal a persona key and publish out-of-scope records.
10. Pass malicious, schema-valid child-agent output into a private+network parent and verify taint blocks the sink.
11. Return after the chain’s weak-subjectivity horizon and verify checkpoint-source plurality and labels.
12. Kill a 12-hour browser courier/agent at arbitrary points and verify exact resumability.

---

## Recommended product language

Use:

> EFS v2 makes records portable, self-describing, verifiable, and permissionlessly replicable. The EFS Century Profile—independent custodians, recurring audits and repair, representation preservation, crypto renewal, succession, and continuous funding—is what makes a 100-year preservation claim plausible.

And:

> EFS Web Runtime is a verified, local-first, capability-routed personal data environment inside a browser trust boundary. EFS Guardian and the hardened profile move keys, durable state, updates, recovery, networking, and long-running work into independently controlled protection domains.

Avoid:

- “the blockchain stores it forever”;
- “authenticity is unconditional”;
- “zero-grant apps are always safe”;
- “a service worker is secure boot”;
- “browser cache is durable custody”;
- “private-century and crypto-shreddable” as one promise;
- “cypherpunk OS” without naming who controls boot, keys, recovery, network, and updates.

---

## Final recommendation

The strongest version of EFS is not “Ethereum, but as a disk.” It is a user-sovereign preservation fabric:

- EFS records establish portable authored facts and coordination.
- Multiple replaceable stores keep the bytes.
- Preservation witnesses keep audit, custody, repair, migration, and evidence history.
- Users keep an offline, ordinary-filesystem package and recovery root.
- A replaceable Web Runtime makes the system reachable.
- A Guardian or hardened host supplies the protection boundary the browser cannot.

That is more ambitious than permanence-by-token, but also more credible. It makes “100 years” an engineered, inspectable process instead of a slogan, and it makes “cypherpunk OS” mean the user can replace every steward—including EFS—without losing their data or authority.
