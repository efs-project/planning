---
agent: codex-gpt-5
date: 2026-07-21
status: reference
anchors:
  - area: client
  - area: identity
  - area: storage
  - area: apps
  - area: economics
  - area: efsv2
source: Parallel primary-source review of Urbit, Fission/ODD/WNFS/UCAN, AT Protocol, Solid, Subconscious/Noosphere, and DXOS
---

# Sovereign computing — authority, recovery, and exit lessons for EFS

## Executive conclusion

No examined personal-computing system solves all three together:

1. durable user authority;
2. offline/local-first application execution; and
3. reconstruction after every original provider and device disappears.

The closest composite is AT Protocol’s adversarial provider migration, WNFS/UCAN’s private capability data, Urbit’s deterministic personal state, DXOS’s replicated spaces, and ordinary browser/Wasm distribution. EFS’s opportunity is to join these while making cold reconstruction and steward death first-class requirements.

## Comparison

### Urbit — coherent personal machine, fragile single-pier continuity

Urbit IDs are Ethereum-based Azimuth assets. Networking keys rotate and breach continuity can invalidate old network state. The identity may survive device loss, but personal state survives only if the pier/event log or a snapshot survives.

A ship is a deterministic personal state machine. Gall agents hold application state and Clay provides Git-like versioned desks; event replay can rebuild state. The cost is one canonical server/pier rather than multi-device local-first replication. Two live copies can diverge continuity and create severe networking problems. App authority appears largely enforced by individual agents rather than a declarative least-authority package manifest.

The identity hierarchy, sponsor/escape mechanics, custom language/runtime, kernel compatibility, terminal onboarding, resource needs, and key handling create practical hosting and governance centers.

Sources: [Urbit ID](https://docs.urbit.org/urbit-id/what-is-urbit-id), [life and rift](https://docs.urbit.org/urbit-id/life-and-rift), [sponsor escape](https://docs.urbit.org/user-manual/id/using-bridge), [Vere/replay](https://docs.urbit.org/user-manual/running/vere), [app distribution](https://docs.urbit.org/build-on-urbit/userspace/dist), [pier migration warning](https://docs.urbit.org/user-manual/running/cloud-hosting).

**EFS lesson:** identity survival, data survival, and safely concurrent devices are separate properties. Preserve all accepted histories under partition; do not allow two silent authoritative copies.

### Fission / ODD / WNFS / UCAN — excellent primitives, steward-coupled product death

Browser-generated keys established accounts; live devices could authorize new devices. Recovery kits focused on filesystem reconstruction and did not clearly preserve the original public identity.

WNFS remains a strong reusable primitive: blockstore-independent IPLD trees, immutable history, encrypted metadata-obscuring private branches, collaboration/merge designs, and Wasm portability. UCAN demonstrates attenuated delegations that can verify offline without sharing a root key. Revocation remains distribution-dependent: an executor cannot honor a revocation it has not learned.

Fission ended company operations in 2024. The integrated hosted account/auth/storage experience largely disappeared while some open primitives remained with limited maintenance. This is clean evidence that useful formats/code can survive a steward while provider-coupled onboarding and control planes do not.

Sources: [ODD SDK](https://github.com/oddsdk/ts-odd), [WNFS](https://github.com/wnfs-wg/rs-wnfs), [UCAN delegation](https://ucan.xyz/delegation/), [UCAN revocation](https://ucan.xyz/revocation/), [Fission farewell](https://www.linkedin.com/posts/fissioncodes_farewell-from-fission-fission-activity-7181755566103416833-wHxv).

**EFS lesson:** give apps/agents path/object/action/time-bounded powers. But do not claim instantaneous revocation in a partition-tolerant system, and do not make the hosted login/username/provider the normal authority root.

### AT Protocol — strongest specified adversarial provider migration

The durable identity is a DID. The PDS normally controls repository signing. A separately held PLC rotation key can let a user migrate when the old PDS is hostile or offline; without user custody, host cooperation is often still required. PLC remains a central write directory, though read replicas reduce read dependence.

Each account has a signed Merkle Search Tree repository. Repositories export as CAR files, but large blobs are separate and need their own preservation. OAuth permission sets attenuate operations. Relays and AppViews remain distribution centers even when account hosting is portable.

Sources: [identity](https://atproto.com/guides/identity), [account migration](https://atproto.com/guides/account-migration), [repository](https://atproto.com/specs/repository), [account semantics](https://atproto.com/specs/account), [permissions](https://atproto.com/specs/permission), [PLC replicas](https://atproto.com/blog/plc-replicas).

**EFS lesson:** user-controlled rotation/recovery credentials should be normal, not an advanced escape hatch. Specify migration ordering precisely: copy, verify completeness, rotate/authorize, activate the new provider, invalidate the old path. Export must cover graph plus blobs and private/local state, not only the signed repository.

### Solid — app/data separation without a credible universal exit

Solid separates apps from HTTP-accessible Pods and uses WebID/OIDC plus WAC or ACP authorization. WAC’s Read/Append/Write/Control distinctions are valuable, especially append-only contribution without mutation.

Identity, key rotation, recovery, and enforcement remain strongly dependent on identity/Pod providers. Official material has acknowledged the absence of a general offline/local-first synchronization implementation and that portability can depend on whether the Pod provider permits it. There is no protocol-level guarantee of a complete, link-preserving Pod export and reconstruction.

Sources: [Solid protocol](https://solidproject.org/TR/protocol), [Solid-OIDC](https://solidproject.org/TR/oidc), [WAC](https://solidproject.org/TR/wac), [ACP](https://solidproject.org/TR/acp), [Application Interoperability draft](https://solidproject.org/TR/sai), [FAQ](https://solidproject.org/faq), [Inrupt migration notice](https://forum.solidproject.org/t/inrupt-net-service-migration-announcement/8970).

**EFS lesson:** provider choice is not ownership if the provider may refuse a complete export or controls the WebID recovery path. Define append separately from write/control, but verify permissions and exit at the protocol/object level rather than trusting server policy alone.

### Subconscious / Noosphere — elegant content-addressed spheres, terminal root loss

A sphere is an IPLD knowledge graph identified by an Ed25519 `did:key`. The root delegates publication authority to a gateway with UCAN, so the gateway does not need the root key. Petname links preserve user-local human meaning over immutable global identifiers.

`did:key` has no native succession. Root-key loss appears terminal without an application recovery layer. Reconstruction requires a known sphere root/revision plus continued availability of every referenced block. Both protocol and app repositories were archived after 2024-era development, leaving gateway succession, recovery, and mature multi-writer semantics unresolved.

Sources: [Noosphere explainer](https://github.com/subconsciousnetwork/noosphere/blob/main/design/explainer.md), [name system](https://github.com/subconsciousnetwork/noosphere/blob/main/design/name-system.md), [Noosphere repository](https://github.com/subconsciousnetwork/noosphere), [Subconscious app](https://github.com/subconsciousnetwork/subconscious).

**EFS lesson:** petnames belong in viewer-controlled address books; global meaning should use immutable/self-certifying identity. But content addressing is not preservation, and a stable principal needs reviewed succession/recovery.

### DXOS — closest additional OS-shaped neighbor

HALO creates local identities and device invitations. ECHO provides CRDT-backed replicated spaces, offline mutation, typed objects, WebRTC sync, and optional always-on Agents. Composer is a coherent extensible knowledge-work product.

The cold recovery/export boundary is not yet clear enough for EFS to copy. Documentation has included total-device-loss warnings while newer APIs expose recovery-code methods without fully documented persistence/security semantics. A provider-independent bundle that reconstructs identity, memberships, space keys, CRDT state, app grants, and current roots was not demonstrated. No cryptographic least-authority plugin boundary was found. DXOS’s FSL-1.1 source-available period also weakens immediate competitive-fork exit.

Sources: [DXOS guide](https://docs.dxos.org/guide/), [HALO](https://docs.dxos.org/guide/halo/), [spaces](https://docs.dxos.org/echo/typescript/api/), [Composer](https://docs.dxos.org/composer/), [recovery API](https://docs.dxos.org/typedoc/client/interfaces/halo.Halo), [repository/license](https://github.com/dxos/dxos).

**EFS lesson:** use independently replicable spaces/security domains rather than one monolithic personal database, but require cold, independently specified reconstruction and a real untrusted-app boundary.

## Mechanisms worth borrowing

- ATProto’s separation among durable identity, active signing key, and provider location.
- ATProto’s adversarial migration ordering and hostile-old-provider model.
- WNFS’s encrypted, metadata-obscuring content-addressed trees.
- UCAN-style attenuated, chain-verifiable delegations with honest revocation latency.
- Noosphere’s petnames over immutable identifiers.
- Urbit’s deterministic event replay and explicit runtime/package versioning.
- DXOS’s independently replicated spaces.
- Solid’s Read/Append/Write/Control distinction.

## Failure patterns to avoid

1. Identity survives while data, decryption keys, app grants, or current roots do not.
2. Two restored devices silently claim the same canonical continuation.
3. Provider migration requires the old provider to issue the escape credential.
4. “User-owned data” excludes blobs, private settings, permissions, social graph, or history.
5. A CID is presented as a preservation guarantee.
6. Revocation is described as instant although offline verifiers have stale state.
7. A hosted auth lobby or username database becomes the normal boot authority.
8. Locally running plugins receive ambient powers.
9. A source-available delay prevents an immediate hostile continuation after steward failure.
10. A new language/runtime consumes the ecosystem’s novelty budget without producing an otherwise unavailable safety or longevity property.

## Acceptance tests

1. **Host death:** reconstruct a complete namespace with EFS company, domain, RPC, gateway, index, and catalog absent.
2. **Adversarial host:** move providers without a token, email, response, or signature from the old provider.
3. **Total device loss:** restore identity, encryption, delegations, app grants, trust/lenses, history, current roots, and accepted inbound shares—not merely login.
4. **Blob completeness:** export every referenced byte object, capability proof, schema, package, and revision needed for replay.
5. **Fork safety:** two partitioned restored devices preserve both attributable histories and expose the merge/fork rather than selecting silently.
6. **Plugin confinement:** an app acts only through explicitly granted paths/objects/actions and mediated network/wallet/decryption powers.
7. **Revocation latency:** document what a revoked offline actor can still produce, what becomes evidence-only, and when each verifier learns the change.
8. **Implementation substitution:** two independent implementations import the same export and compute the same semantic roots and grades.
9. **Link durability:** exact historical links survive provider, app, handle, and key rotation without silently following a mutable version.
10. **Steward death:** specs, fixtures, vectors, release roots, bootstrap information, contract controls, and packages are enough for an unfriendly fork to continue.

## Unresolved items worth hands-on verification

- Urbit’s current app-wide authority/isolation boundary beyond individual agent checks.
- Whether ODD recovery reconstructs all private-history keys and provider-independent roots.
- Whether ordinary ATProto users receive a usable self-custodied PLC rotation key by default.
- A conformant Solid full-Pod migration preserving identity, ACLs, references, and offline state.
- Whether Noosphere completed multi-writer merge and safe key/gateway succession.
- Whether DXOS recovery codes are self-contained cold backups and whether Composer extensions have a real sandbox.
