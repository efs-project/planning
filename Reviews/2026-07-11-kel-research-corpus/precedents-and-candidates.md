# KEL precedents and candidate architectures

**Research date:** 2026-07-11  
**Role:** independent identity precedents and architecture lane

## Current status, not folklore

| System | Current status used in this pass | What it actually proves |
|---|---|---|
| KERI | ToIP KERI specification v1.1; current generated specification in 2026; vLEI institutional use | serious key-event, pre-rotation, threshold, delegation and receipt design; not consumer recovery at mass scale |
| did:webvh | v1.0 released 2025; recommended by DIF/ToIP in 2026 | independent convergence on self-certifying history and pre-rotation; web location remains an authority/availability dependency |
| did:plc | specification content v0.3.0 (December 2025; legacy URL path says v0.1) and 2026 replica/recovery work | control/data-key separation and real recovery UX at ATProto scale; centralized directory remains the ordering oracle |
| Farcaster | on-chain identity/key registries; 2025 signer-lifespan work; 2026 Snapchain signer design | production actor keys, prospective removal, scopes, caps, self-revoke, and stable principal; weak root/recovery/PQ model |
| IETF Key Transparency | active 2026 architecture draft | current-key distribution needs append-only consistency, freshness, monitoring and proof; transparency detects, not prevents |
| WhatsApp AKD / Parakeet | deployed key transparency at very large scale | automatic client self-checking, epoch consistency proofs, batching, witnesses and freshness UX remain necessary even with an ordered log |
| CONIKS | research system for privacy-preserving key transparency | efficient per-user monitoring and privacy-preserving directory membership; contrast with EFS's deliberately public KEL |
| Keybase | deployed public sigchains/device model | reverse-signed device enrollment, prospective device revocation, paper-key recovery, and the permanent privacy cost of one public account chain |
| OpenPGP | RFC 9580 Standards Track (2024) | offline primary/subkeys and pre-generated revocation remain useful; web-of-trust discovery/fingerprint UX did not become consumer identity |
| Nostr | current official NIP index marks NIP-26 unrecommended; no adopted NIP-41 migration | identity indirection is extremely difficult to retrofit after key-as-identity ships |
| Secure Scuttlebutt | long-term feed key plus later fusion/multi-device work | the same key-as-device trap at a local-first layer |
| Urbit | stable point with Ethereum-anchored life/rift revision | even a sovereignty-maximal system used a chain for key continuity; transfer/scarcity is not appropriate for EFS persons |

## KERI: copy the cryptographic structure, not the full stack

Copy:

- stable self-certifying identifier;
- canonical chained establishment events;
- current and next thresholds as committed state;
- pre-rotation to hidden next public-key commitments;
- algorithm-qualified keys and signatures;
- explicit duplicity evidence;
- historical validity windows;
- external-data seals;
- replayable history plus materialized current state; and
- cooperative delegation for durable child/organization identities.

Simplify/reject:

- no CESR parser in an Etched Solidity hot path;
- no second witness-consensus network where the home chain already supplies order/finality;
- no fractional weighted threshold or unbounded policy expression in v1;
- no recovery that erases/supersedes archival history; preserve and grade disputed intervals;
- no assumption that hidden classical next keys stay safe once revealed to a CRQC-era mempool.

The current EFS `nextKeysDigest` misses KERI's key lesson: the commitment must cover the next threshold and whole policy. The correct object is roughly:

```text
H(version, ordered suite-qualified keys, threshold clauses, roles,
  delegation ceiling, recovery-policy version, security floor, home policy)
```

## did:webvh: copy strictness and conformance

Copy full verifiable history, self-certifying inception, mandatory pre-rotation once activated, strict version/algorithm allowlists, bounded parser/resource rules, and multiple independent implementations. Its literal `{SCID}` placeholder/recomputation procedure is the concrete lesson for avoiding circular born-identity derivation; EFS uses an equivalent principal-free canonical genesis body before signing the completed inception.

Reject DNS/HTTPS as authority, JSON/JCS in the on-chain verifier, wall-clock ordering, and optional witnesses as a substitute for consensus.

## did:plc: copy control/data split and recovery UX

Copy:

- cold rotation keys separate from routine signing key;
- stable identity across signer/host changes;
- complete-state operations linked to their predecessor;
- priority recovery authorities registered before compromise;
- new-key acceptance/proof of possession;
- a public export/audit history; and
- bidirectional human-name verification.

Reject server ordering, server timestamps, history clobbering, public device/guardian/name graphs by default, and a universal 72-hour window. PLC's recovery window works only because a previously registered higher-priority key can override. Delay with no prior authority cannot identify the real EOA owner.

## Farcaster: copy the actor plane

Copy stable principal separate from custody and app signers; principal plus actual signer provenance; prospective key removal; fail-closed action scopes; key caps; self-revocation; fixed bounded state; destination/new-key acceptance; and permissionless signed operations.

Reject one-address immediate recovery, unrestricted legacy grants, key re-registration after removal, sliding TTL, and any rule that retroactively destroys old message authorship. Farcaster's recent signer design is the best precedent for EFS app/device actors, not for root control.

## Transparency/log lessons

The selected authority home replaces CT/Trillian/Sigsum as the canonical per-principal ordering log, but EFS still needs:

- automatic self-monitoring for unexpected key/grant/recovery events;
- finalized head/state proof rather than “an RPC returned this”;
- proof bundles that travel with exported artifacts;
- independent observers and funded alerting; and
- explicit freshness bounds on cached/snapshot key state.

A Merkle root without monitoring, consistency, and recovery policy is not key security.

WhatsApp AKD adds the operational lesson that self-checks must be automatic, batched, and independently witnessable; users will not manually inspect key logs. CONIKS shows how a centralized directory can hide membership, which EFS deliberately does not: public KEL entries are correlation data, so unlinkability requires a separate principal rather than a privacy adjective. Keybase adds the clean device lesson: a new device should be accepted by existing authority, removed prospectively, and never share one cloned root; its public sigchain also demonstrates why device/guardian/name metadata should stay minimal.

## Four candidate architectures

### A. KERI-faithful on-chain microledger

Full establishment/interactions/delegation/witness semantics. Strongest theory and organization model, but too much parser/contract complexity, duplicates chain consensus, makes app sessions too heavy, and still needs materialized state for Tier-1 reads.

**Use as cryptographic reference, not implementation blueprint.**

### B. PLC-shaped priority recovery

Complete-state operations, cold prioritized recovery, routine signer separation, fixed recovery window. Good consumer mental model and proven operational shape, but it rewrites history, exposes recovery graph, and concentrates power in the top key.

**Copy UX and preexisting-priority recovery; reject clobber semantics.**

### C. Farcaster-shaped principal and key registry

Stable ID plus on-chain actors/scopes/expiry/self-revoke. Best hot path and closest shipped session model, but root recovery, pre-rotation and PQ are insufficient.

**Use for actor plane, not identity root.**

### D. Native EFS synthesis

Slow KEL control/recovery plus separate bounded actor certificates/registry; one stable principal; complete next-policy commitments; one signature per record; co-located authority-home admission receipts selected by an L1 locator; materialized O(1) reads; private personas as separate principals.

**Recommended.** It combines KERI root safety, PLC recovery usability, and Farcaster session ergonomics while using the chain only where a total order is necessary.

## Sources

- [KERI specification](https://trustoverip.github.io/kswg-keri-specification/) and [paper](https://arxiv.org/abs/1907.02143)
- [GLEIF vLEI KERI requirements](https://www.gleif.org/organizational-identity/become-a-vlei-issuer-qvi/vlei-ecosystem-governance-framework/2025-04-16_vlei-egf-v3.0-technical-requirements-part-1-keri-infrastructure-2024_v1.3_final.pdf)
- [did:webvh v1.0](https://identity.foundation/didwebvh/v1.0/)
- [did:plc specification v0.3.0 content](https://web.plc.directory/spec/v0.1/did-plc), [recovery](https://atproto.com/guides/account-recovery), and [replicas](https://atproto.com/blog/plc-replicas)
- [Farcaster overview at `aa6bdfb`](https://github.com/farcasterxyz/protocol/blob/aa6bdfb2c185e9a557097b8b40af923e2a278cf1/docs/OVERVIEW.md), [IdRegistry](https://github.com/farcasterxyz/contracts/blob/3f37e21db8e9c6319b4a3d5f62b1c514ef01c36b/src/IdRegistry.sol), [KeyRegistry](https://github.com/farcasterxyz/contracts/blob/3f37e21db8e9c6319b4a3d5f62b1c514ef01c36b/src/KeyRegistry.sol), and [Snapchain signers](https://github.com/farcasterxyz/protocol/discussions/266)
- [IETF Key Transparency architecture](https://datatracker.ietf.org/doc/draft-ietf-keytrans-architecture/), [CT v2](https://www.rfc-editor.org/rfc/rfc9162.html), [Sigsum](https://www.sigsum.org/docs/), [Trillian](https://github.com/google/trillian), [WhatsApp AKD](https://engineering.fb.com/2023/04/13/security/whatsapp-key-transparency/), [CONIKS](https://sns.cs.princeton.edu/assets/papers/2015-sec-melara.pdf), and [Keybase sigchains](https://book.keybase.io/docs/server)
- [OpenPGP RFC 9580](https://www.rfc-editor.org/rfc/rfc9580.html), [Nostr NIPs at `8f8444d`](https://github.com/nostr-protocol/nips/tree/8f8444d05a8842c40211ded5d10af3521541f865), [SSB guide](https://ssbc.github.io/scuttlebutt-protocol-guide/), and [Urbit life/rift](https://docs.urbit.org/urbit-id/life-and-rift)

Mutable sources were accessed 2026-07-11. Commit/version pinning is part of the evidence, not clerical polish; the promotion bundle must also archive content hashes for mutable specifications.
