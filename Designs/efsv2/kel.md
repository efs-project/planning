# EFS v2 — KEL identity and account foundation

**Status:** draft candidate profile; topology under owner validation
**Target repos:** contracts, sdk, client, planning
**Depends on:** [[codex-envelope]], [[codex-kernel]], [[read-lens-spec]], [[privacy]], [[onchain-completeness]]
**Supersedes for KEL design:** [[identity]] (retained as the pre-pass baseline and failure record)
**Research record:** [2026-07-11-kel-identity-foundation-review](../../Reviews/2026-07-11-kel-identity-foundation-review.md) and [supporting corpus](../../Reviews/2026-07-11-kel-research-corpus/README.md)
**Last touched:** 2026-07-12

#status/draft #kind/design #repo/contracts #repo/sdk #repo/client #repo/planning

> **Freeze warning.** The previous reserved KEL is not safe to freeze. Its root-level `ADD_KEY`/`REMOVE_KEY` events bypass pre-rotation; `nextKeysDigest` does not commit the next threshold or policy; the current envelope cannot represent principal-versus-actor authorship; read-time-only authorization permits removed keys to backdate; and the home chain is not globally selectable from an address-shaped word. This design replaces those mechanics. No identity, envelope, kernel, `act`, P-256/WebAuthn, or KEL vector may freeze until this design's Etched decisions converge and receive an independent cryptographic review.
>
> **Specialist re-audit applied.** Independent precedent, Ethereum-account, and crypto/state-machine reviewers then attacked the first synthesis. Their no-go findings caused the co-located authority-home model, non-circular genesis, closed event transcript, deletion of generic reconfiguration, next-over-recovery priority, mandatory auth-epoch rotation, role-independent key material, typed root/child grants, exact admission receipts/proofs, non-censoring disavowal, stricter WebAuthn, and competing-EIP caveats below. It remains a design to implement/model/vector/audit—not frozen bytes.
>
> **2026-07-12 topology correction.** [[assumptions-and-requirements]] separates the stable-principal/scoped-actor/admission requirements from this document's maximal topology. Chains do not natively query one another. A per-principal Ethereum-L1 locator, arbitrary authority homes, foreign proof adapters, and cross-chain home migration are architecture hypotheses, not constitutional consequences of KEL. The proposed first comparison prototype is one fixed, measured protocol profile whose authority domain holds the complete authoritative record/KEL/slot/index graph; foreign clients may verify it, while foreign contracts require explicit adapters or fully specified local commitments. That profile privileges one fee/censorship/throughput domain and is not adopted architecture. Read the home-registry and migration sections below as an optional sovereignty-profile design until James validates the topology.

## 0. Decision in one page

EFS identity is a stable principal, not a wallet and not a key. The stable design has two planes; their authority venue is selected separately:

```text
EFS principal: stable bytes32 identity word
├── slow control plane (KEL)
│   ├── threshold control policy
│   ├── full next-control-state commitment
│   ├── recovery policy and pending recovery
│   ├── algorithm/security floor
│   └── home and event history
├── fast actor plane
│   ├── record-signing key
│   ├── device/delegation key
│   ├── app/session grants
│   └── fixed expiry, scope, epoch, revocation
└── optional bindings
    ├── Ethereum execution accounts / Safes / 4337 / 7702
    ├── ENS and other names
    └── intentionally published persona or organization links
```

The control plane changes rarely and may require m-of-n approval. Every record still carries exactly one actor signature. The actor signs **as the stable principal** through a bounded root or child grant. The authority-home admission verifies that authorization while it is live and stores the authorization basis. Later key removal is prospective: already home-admitted records remain authentic, while a removed key cannot mint new authoritative records by backdating an author-controlled timestamp.

Operational device/app keys collapse under one public principal. An unlinkable persona is a **different principal with a different KEL and different keys**, grouped only in the user's local OS unless the user deliberately publishes a link. Ethereum accounts are execution, payment, custody, and compatibility endpoints. They are not the century identity.

This document originally proposed **one authority home per principal**, canonically selected by a sparse Ethereum-L1 `HomeRegistry`. That profile co-locates KEL control, grant state, and authoritative record admission so revocation and admission share one total order. It also requires L1-to-home proofs, home finality profiles, multi-home clients, foreign-contract adapters, and a cross-chain migration system.

The proposed first comparison prototype is now **one fixed EFS authority profile** whose domain contains all strongest-grade record bodies, KEL/grants, admissions, revocations, canonical slots, and required indexes. It preserves the shared-order security property while deleting the locator, heterogeneous homes, and migration from the smallest strong-authority state machine. Other venues store evidence or explicit snapshots; a client can query the authority domain, but a foreign contract needs an installed verifier/bridge/fully specified local commitment. This privileges one fee/censorship/throughput domain. James must validate the sovereignty choice in [[assumptions-and-requirements]] before either topology becomes normative.

## 1. Constitutional invariants

These are the requirements against which every byte layout and UX is judged.

1. **Stable principal.** Rotation, recovery, devices, apps, wallet changes, and cryptographic migrations never rewrite the identity word or its owned namespace.
2. **Key separation.** Control, record signing, sessions, Ethereum execution, encryption/KEM, and local-vault wrapping are different key roles. Reuse is forbidden across signing and encryption.
3. **Portable authorship.** `msg.sender`, ERC-1271, ERC-6492, one wallet vendor, and one verifier address never determine an EFS record's eternal author.
4. **Definite authority truth and order.** If strongest historical authority must defeat post-revocation backdating, one explicit authority domain orders both KEL changes and authoritative admissions. Foreign copies are explicit snapshots or evidence, never competing truth selected by an RPC. Whether that domain is fixed protocol-wide or selected per principal is a separate architecture choice.
5. **Prospective revocation.** A key or grant removed at home cannot authorize later admissions; earlier authorized admissions remain attributable. Recovery does not rewrite history.
6. **Flat record verification.** One actor signature per envelope. Threshold evaluation occurs only for control/recovery events. A threshold implementation may produce one ordinary actor signature, but the record protocol never walks a quorum.
7. **Pre-rotation is real.** Every normal root-policy change reveals a commitment to the **entire** next control state. No generic current-key fallback and no root `ADD_KEY` escape hatch.
8. **Bounded on-chain work.** Current identity, actor, grant, recovery, and historical-admission queries are O(1) or bounded by small protocol maxima. No trusted indexer or KEL replay is needed for a Tier-1 answer.
9. **Fail-closed extension.** Unknown suites, event types, roles, scopes, constraints, or verifier profiles authorize nothing.
10. **Recovery is not decryption.** Recovering KEL control, recovering a wallet/funds account, and recovering encrypted content are three independent outcomes and three separate user-facing checks.
11. **No hidden privacy promise.** A public KEL is a correlation log. Private personas do not share public keys, guardians, account bindings, grants, or public parent links.
12. **Evidence can age.** Historical signatures carry their algorithm and admission basis; before a primitive weakens, evidence can be renewed under a stronger hash/signature/anchor. Unanchored artifacts receive a weaker grade.

## 2. Terms that must not collapse

| Term | Meaning | Not this |
|---|---|---|
| **Principal / identity** | stable EFS `bytes32` author and namespace owner | wallet address, device, person legal name |
| **Authority domain** | canonical venue/profile co-locating KEL/grants and authoritative record admission | the RPC used by a client; a replica/storage venue; proof that chains communicate |
| **Authority home** | optional profile in which one principal selects its own authority domain | a requirement of stable identity or KEL |
| **Control key** | rare root key participating in planned rotation and policy change | hot app signer |
| **Recovery key / guardian** | independently committed authority for emergency recovery | automatic cloud login unless explicitly chosen |
| **Record signer** | single actor key authorized for ordinary EFS records | root controller |
| **Delegation authority** | bounded key allowed to mint narrower app/session grants | controller able to change KEL policy |
| **Actor** | actual key that signed an envelope | principal shown as the durable author |
| **Grant** | proof-of-possession capability binding an actor to scope and time | bearer token or display-only `act` claim |
| **Ethereum account binding** | chain-scoped execution/payment endpoint linked to a principal | identity root |
| **Persona** | a separate public principal chosen for reputation/privacy separation | merely another device key |
| **Name** | ENS or petname resolving to a principal | identity or authority |

## 3. Why the previous reservation fails

| Existing choice | Failure | Replacement |
|---|---|---|
| Root `ADD_KEY` / `REMOVE_KEY` | a stolen current key bypasses pre-rotation, adds attacker keys, removes victim keys | root changes only through committed `ROTATE` or independent `RECOVER`; actors use a separate grant ledger |
| `nextKeysDigest` | does not bind next threshold, roles, recovery version, delegation ceiling, or algorithm floor | `nextControlStateHash` over the complete canonical next state |
| rotate with current keys when no next commitment | compromise becomes arbitrary takeover | no-next is explicitly `UNPROTECTED`/non-transferable; only the committed recovery policy can repair it |
| `recovered == author` | session/P-256/WebAuthn keys become separate authors and cannot own the principal's slots | signed `author + authorityId + authEpoch`; actor key comes from the signature/grant |
| read-time KEL authorization | removed key signs later and backdates `order`/epoch | home admission validates live authority and persists an authorization receipt |
| KEL added later as a peer/read union | old kernels cannot persist actor/grant/basis or give contracts a Tier-1 answer | KEL-aware authoritative path is designed before the Etched freeze; old lane becomes legacy evidence only |
| arbitrary per-chain inception | victim and thief can each declare a different home | one L1-selected authority home coordinate; control and admission co-located |
| challenge delay alone | two holders of one stolen EOA are cryptographically symmetric | first-use independent upgrade commitment; delay is useful only with higher-priority preexisting authority |
| global WebAuthn profile with UV optional and RP/origin ignored | too weak and too inflexible for root events | per-key verifier profile; control/recovery requires UV and explicit RP/origin policy |
| address-target `act` row as delegation | cannot identify P-256/PQ actor, grant epoch, ancestry, or authoritative scope | KEL grant is authority; `act` is provenance and references a full-width grant/key ID |

## 4. Identity construction and home authority

### 4.1 Bare EOA: state zero, not the final account model

An address-shaped identity begins in state `BARE`:

- `identityWord = bytes32(uint160(eoa))`;
- `authorityId = 0`, `authEpoch = 0`;
- one canonical secp256k1 signature must recover to the address;
- the EOA is the degenerate KEL state zero;
- `msg.sender` remains irrelevant to records.

Bare mode is compatible with the owner ruling and keeps zero-setup day-one use. It is explicitly degraded: no rotation, no safe recovery, no passkey/PQ actor, no protocol scope, and no way to distinguish victim from thief after key compromise.

Its verifier pins pure, state-independent secp256k1 recovery and low-S semantics in the Codex plus a fallback implementation; it does not eternally delegate meaning to precompile address `0x01`. This matters because draft EIP-8151 proposes state-dependent `ecrecover`, which would otherwise make portable historical authorship depend on later account state.

### 4.2 First-use legacy upgrade commitment

The avoidable part of the future thief race should be removed at onboarding. The first EFS account ceremony SHOULD publish a salted commitment through the canonical L1 `HomeRegistry`:

```text
LegacyUpgradeCommitmentV1 = keccak256(
  DOMAIN_LEGACY_UPGRADE_V1,
  identityWord,
  proposedHome,
  initialControlStateHash,
  recoveryPolicyHash,
  securityFloor,
  salt
)
```

The preimage is exported in the user's recovery kit. It reveals no guardians or future public keys until use. V1 permits exactly one finalized, append-once commitment per bare principal; it cannot be replaced or erased by the EOA. Reveal requires proof of possession by the committed control/recovery factors, which is where authority becomes independent of the EOA. A committed inception has a short activation path; an uncommitted override has a substantially longer delay and may be vetoed by the committed recovery/control policy.

This does not solve a key stolen before the commitment. Nothing can. It also creates an honest availability tradeoff: if the commitment preimage and committed recovery factors are all lost, the bare principal cannot activate KEL through that commitment. An uncommitted legacy identity remains `LEGACY-UNPROTECTED`, and the first valid inception is an explicitly accepted race. Reorg/finality handling and the exact uncommitted-override delay are part of the `HomeRegistry` vectors.

### 4.3 In-place EOA upgrade

An in-place inception preserves the address-shaped identity word and names:

- the immutable initial authority-home basis and locator nonce;
- the exact initial `ControlState`;
- a full next-control-state commitment;
- recovery-policy commitment;
- initial `controlEpoch` and `authEpoch`;
- proof of possession by each installed key;
- the legacy EOA signature; and
- the legacy-upgrade commitment proof, when one exists.

After activation, `BARE` authorization is permanently disabled for new authoritative admissions. The old EOA key remains useful only as historical evidence or as an explicitly registered, scoped actor. Ethereum assets at that address remain exposed to the EOA unless the Ethereum protocol/account has separately removed that authority; EFS KEL recovery does not secure those funds.

### 4.4 Born-KEL identity

A new consumer, organization, or smart-wallet-only user may create a digest-shaped principal without a circular self-reference:

```text
GenesisBodyV1 = {
  protocolVersion,
  authorityHomeRef,
  registryId,
  initialControlStateHash,
  initialRecoveryPolicyHash,
  initialSecurityFloor,
  resaltingNonce
}

identityWord = keccak256(DOMAIN_IDENTITY_V2, canonical(GenesisBodyV1))
```

`GenesisBodyV1` excludes the principal and every witness. The final signed `INCEPT` event contains the derived principal and `genesisBodyHash`; signatures therefore cannot change the identity. ID-SHAPE-1 increments `resaltingNonce` if the digest lands in the address-shaped subspace. This is the same anti-circularity class as did:webvh's placeholder/recompute construction, expressed as a separate principal-free body. A born-KEL identity can begin with P-256/WebAuthn, heterogeneous control keys, or later reviewed PQ suites without an EOA ever being its identity.

This is an activation of the reserved digest-shaped author class, not just a client convention. Envelope admission, principal-keyed slots, REVOKE, reserved rows, encryption-key parents, lens entries, deterministic-ID vectors, and every bounded read ABI must accept the full `bytes32` principal. No path may silently cast the principal to `address` or infer the actor suite from its shape.

### 4.5 Home topology: canonical locator plus co-located authority

The v1 ruling is:

| Component | Location | Rule |
|---|---|---|
| `HomeRegistry` selector | Ethereum L1 | finality-aware mapping from principal to full home coordinate and migration status; an ordinary EFS claim cannot override it |
| KEL, grants, revocations | selected authority home | one materialized head and one home ordering domain |
| authoritative record admission | **same authority home** | actor validity and admission share a total order; receipts are minted only here |
| bytes and foreign records | any venue | portable storage/evidence; LIVE authority requires a finalized home receipt/proof |

This is preferable to making every record pay L1 gas, and it avoids claiming instant revocation across asynchronous bridges. `authorityHomeRef` includes chain ID, immutable registry/kernel identity, version, and genesis/code basis. A bare principal is looked up in the L1 locator; a born-KEL principal also self-commits its initial home.

`HomeRegistry` versions are immutable and adminless; a proxy or mutable verifier allowlist would become a global identity root. A registry-version successor requires a principal-authorized, proof-carrying transition and an archival resolver that can walk the version chain. The exact proof adapters and how an old immutable registry authenticates a future registry are freeze blockers, not implementation detail; this is part of the §22 external review and the §24 source manifest.

Home migration is a rare two-phase state machine, not an ordinary mutable claim: (1) the source home, under precommitted-next or recovery authority, freezes new grants/admissions at an exact ordinal and commits target plus a complete state-export root; (2) after source finality, L1 marks the locator `MIGRATING`; (3) the target verifies/imports the state, bumps `authEpoch`, accepts at the exact cutover, and proves acceptance; (4) L1 finalizes the new coordinate, after which only the target may admit. The source remains permanently sealed. No phase permits both homes to admit, no rollback occurs after target acceptance, and every proof binds principal, source, target, locator nonce, source head, cutover ordinal, and registry versions. V1 does not promise same-principal rescue from a home that dies before a finalized prepare; that needs a separately reviewed L1 emergency-recovery verifier or a successor-principal continuity claim.

## 5. Canonical control state

### 5.1 Key descriptor and identifier

```text
KeyDescriptorV1 = {
  suiteId,
  keyFamilyId,
  canonicalPublicKey,
  verifierProfileHash,
  role
}

keyMaterialId = keccak256(DOMAIN_KEY_MATERIAL_V1,
                          keyFamilyId,
                          canonicalPublicKey)

keyId = keccak256(DOMAIN_KEY_ID_V1,
                  keyMaterialId,
                  verifierProfileHash,
                  role)
```

No key is reduced to a 20-byte address. A suite fixes exact key/signature encodings, message preparation, canonicality/malleability checks, maximum byte lengths, and immutable verifier semantics. `keyFamilyId` normalizes equivalent physical material across profiles (for example raw P-256 and WebAuthn P-256 share a family/point encoding). `verifierProfileHash` carries WebAuthn RP/origin/UV policy or other restrictions. Both removed `keyId` and role-independent `keyMaterialId` are tombstoned for that principal. The same material cannot reappear under a new role/profile, count in two threshold clauses, or be shared across control, recovery, actor, raw-P-256/WebAuthn, signing, encryption, and vault-wrapping roles.

### 5.2 Threshold policy: small and deliberately non-general

```text
ControlPolicyV1 = {
  version,
  clauses: [
    { threshold, sortedUniqueKeyIds[] }
  ]
}
```

Every clause must pass. One clause is ordinary m-of-n. Two clauses express a traditional **AND** PQ policy during migration. Key IDs and key-material IDs are unique across the entire policy, and one witness can satisfy at most one leaf. There is no arbitrary Boolean language, weighted fractional threshold, Datalog VM, or recursive policy. Protocol maxima bound clauses, keys, signatures, event bytes, and verification gas. Exact maxima remain benchmark/review values, not casual constants.

### 5.3 Full pre-rotation commitment

```text
ControlStateV1 = {
  controlPolicy,
  recoveryPolicyHash,
  directAuthorityRoot,
  delegationCeilingRoot,
  securityFloor,
  homePolicyHash
}

nextControlStateHash = keccak256(
  DOMAIN_CONTROL_STATE_V1,
  canonical(ControlStateV1),
  salt
)
```

This is the KERI lesson in EFS form: keys alone are not a policy. Fields occur once in one canonical state, so recovery/security/delegation values cannot disagree across nested structs. A normal rotation must reveal the exact preimage, satisfy the newly revealed control policy, prove possession of every newly installed key with a purpose-bound event acceptance, and commit another full next state. Requiring all first-installed keys to accept once is an intentional setup-availability cost; later events use the threshold. If no next commitment exists, the identity is visibly `UNPROTECTED`; current keys do not receive an invisible fallback route.

### 5.4 Materialized identity state

```text
IdentityStateV1 = {
  identityWord,
  authorityHomeRef,
  registryVersion,
  status,
  headEventId,
  eventNumber,
  controlEpoch,
  authEpoch,
  currentControlStateHash,
  nextControlStateHash,
  recoveryPolicyHash,
  recoveryNonce,
  pendingRecoveryHash,
  pendingRecoveryEligibleAt,
  securityFloor
}
```

The full event bodies remain state-enumerable through the pruning-resistant spine. Current state is materialized for O(1) contract reads; historical verification never requires replaying the log in a transaction.

### 5.5 Canonical event and signature transcript

Every control/recovery event uses one closed unsigned header:

```text
EventHeaderV1 = {
  protocolVersion,
  eventType,
  principal,
  authorityHomeRef,
  registryId,
  previousHeadEventId,
  eventNumber,
  controlEpoch,
  authEpoch,
  recoveryNonce,
  canonicalBodyHash
}

eventId = keccak256(DOMAIN_KEL_EVENT_ID_V1, canonical(EventHeaderV1))
```

Witnesses never enter `eventId`. Every control signature, recovery signature, new-key acceptance, grant issue, and key PoP signs a distinct purpose-tagged semantic transcript binding the event/grant ID, principal, home, registry version, role, epochs/nonces, and relevant key-material ID. Each suite defines how it prepares those canonical semantic bytes: EIP-712/Keccak for classical EVM suites, challenge binding for WebAuthn, and explicit pure/prehash profiles for PQ. V1 permanent IDs use `keccak256` over fixed-width or length-delimited canonical encodings—never ambiguous packed dynamic values. The 32-byte identity/event roots cannot later change hash without changing identity; century survival uses evidence renewal around them.

## 6. Event state machine

The control event namespace is closed and separate from actors/grants.

| Event | Authority | Effect |
|---|---|---|
| `LEGACY_COMMIT` | bare EOA on L1 `HomeRegistry` | append the one finalized future-control/recovery commitment; does not activate KEL |
| `INCEPT` | born-KEL initial policy, or EOA + commitment/slow legacy path | create active KEL, bind home, install current/next/recovery state |
| `ROTATE` | exact previously committed next control policy; new-key acceptance | install revealed state, advance `controlEpoch`, **always bump `authEpoch` in v1**, cancel a lower-priority pending recovery, commit next state |
| `RECOVERY_PROPOSE` | exact committed recovery clause + proposed new-key acceptance | block new grants/current-control changes; record exact replacement and nonce; start home-block delay; never block a valid precommitted rotation |
| `RECOVERY_FINALIZE` | permissionless after delay | install exact proposal, bump control + auth epochs, revoke all sessions O(1), advance nonce |
| `RECOVERY_CANCEL` / `RECOVERY_REPLACE` | exact committed veto clause or exact recovery replacement clause | consume nonce; current/hot key alone cannot veto or starve recovery |
| `MIGRATE_PREPARE` | precommitted next or recovery policy | source-home phase of §4.5; freeze at exact ordinal and export root; remaining phases are locator/target transitions |
| `DEACTIVATE` | precommitted next or recovery policy | end future authorship; never erase history |
| `DISAVOW_INTERVAL` | current/recovered control | advisory risk overlay only; never changes `HOME-ADMITTED-AUTH` or protocol GATE status |

Root-level `ADD_KEY`, `REMOVE_KEY`, and generic `POLICY_RECONFIGURE` are deleted. Lost next state is repaired only by the committed recovery policy; loss of both is honestly unrecoverable. Planned organization changes must first enter a normal commitment. Device/app keys are actors (§7). Unknown control events reject.

The authority priority is frozen: **precommitted next control > committed veto clause > recovery clause > current control**. A valid next-policy `ROTATE` atomically clears any pending recovery. Proposal, replacement, cancellation, finalization, and migration each bind and consume exact nonces; replay and repeated reproposal cannot starve a higher-priority transition. A normal rotation carries no hidden grants because v1 always bumps `authEpoch`; actors are explicitly reissued after control changes.

Late sibling events from an old parent are stored as duplicity evidence but do not let a compromised former key manufacture an eternal denial of service. The finalized home admission order selects the authoritative head. `KEL-CONTESTED` is reserved for an unresolved legacy-home fork, finalized-home proof conflict, or pending recovery dispute—not for any arbitrary foreign copy.

## 7. Actor and session authorization

### 7.1 Three actor roles

- **Record signer:** may sign ordinary records within a principal-wide ceiling; does not issue grants or events.
- **Delegation authority:** usually one device key; may mint child grants only within its committed ceiling.
- **Session/app actor:** shortest-lived leaf key; no delegation by default.

No actor may rotate/recover the KEL, change recovery, lower security, bind a persona/account, export/decrypt keys, or grant beyond its own ceiling.

### 7.2 Grant certificate

```text
AudienceScopeV1 = {
  mode,                   // EXACT_ID | PACKAGE_HASH | SET_ROOT
  value
}

ResourceScopeV1 = {
  mode,                   // EXACT_ID | DERIVED_SUBTREE | PRINCIPAL_NAMESPACE
  rootId,
  maxDepth
}

GrantBodyV1 = {
  version,
  grantKind,              // ROOT | CHILD
  principal,
  authorityHomeRef,
  registryId,
  authEpoch,
  parentGrantId,          // zero only for ROOT
  issuerKeyId,            // zero only for ROOT installed by control event
  actorKeyDescriptorHash,
  audienceScope,
  actionSet,             // closed, explicit, unknown actions fail closed
  kindSet,
  definitionSet,
  resourceScopes,
  venueSet,
  privacyClassSet,
  maxEnvelopeRecords,
  maxEnvelopeBytes,
  maxUses,               // zero means explicitly unlimited
  maxTotalRecords,       // zero means explicitly unlimited
  maxTotalBytes,         // zero means explicitly unlimited
  validFromHomeBlock,    // inclusive
  validUntilHomeBlock,   // exclusive; UINT64_MAX for a non-expiring root grant
  remainingDepth,
  nonce
}

grantId = keccak256(DOMAIN_GRANT_V1, canonical(GrantBodyV1))

GrantCertificateV1 = {
  body,
  actorKeyDescriptor,
  parentProof,
  issuerSignatureWitness,   // absent only for ROOT committed by control event
  actorAcceptanceWitness
}
```

All KEL-mode actors, including direct record signers, use this one format. A ROOT grant and its actor acceptance are committed in `ControlStateV1.directAuthorityRoot`; only a control transition installs or replaces one. A CHILD certificate is purpose-signed by the actor key of its exact parent grant and accepted by the child actor key. Thus the envelope's nonzero `authorityId` is always one domain-separated `grantId`; readers do not guess between a raw key and a grant.

The grant is key-bound, not bearer. A child is the mechanically validated subset of every bounded ancestor: sorted sets only shrink; an exact audience stays exact or proves one leaf of an allowed set; time and numeric maxima only narrow; depth decreases; and every current admission rechecks the full ancestry's epoch, expiry, key-material tombstones, and revocations. Parent revocation kills descendants, including a certificate first disclosed later that claims an older signature. Browser origin is not an on-chain fact: `audienceScope` provides transcript separation and Guardian/OS policy unless a separately specified broker attestation exists.

Resource scope is never mutable graph membership. `EXACT_ID` names an exact object/container; `DERIVED_SUBTREE` uses immutable deterministic namespace ancestry with a bounded proof and depth; `PRINCIPAL_NAMESPACE` is an explicit broad root-grant choice. Empty sets mean **none**, never “all”; there are no implicit wildcards, negation, free-form strings, wildcard-future actions, unbounded graph walks, or general logic. Recommended depth is zero for apps and one for device→app; the protocol maximum is small. A zero cumulative cap means “unlimited until expiry,” is rendered loudly, and is not a default for app sessions.

The recommended storage model is hybrid:

- the signed grant certificate is self-contained and may stay private **only until first use**; materialization permanently exposes actor, ancestry, timing, scopes/resources, and potentially guessable audience, so clients use per-app keys and high-entropy audience IDs and preview that correlation;
- the authority-home registry stores `authEpoch`, key-material tombstones, cumulative counters, and a monotone selective `revokedGrant[grantId]` set;
- first authoritative use stores/materializes the bounded grant proof;
- recovery bumps `authEpoch`, invalidating the whole actor fleet in O(1).

This copies UCAN's public-key delegation/revocation shape and Biscuit's attenuation principle, but not unbounded proof DAGs, bearer authority, JSON caveats, or a Datalog VM.

### 7.3 Revocation rules

- A session can self-revoke.
- A parent may revoke a child grant.
- Control may revoke any actor/grant or bump `authEpoch`.
- Expiry is fixed, not sliding; use cannot keep a stolen key alive.
- Removed actor key material cannot be re-enrolled under another role/profile.
- Actor removal is prospective. Home-admitted records retain historical attribution.
- App sessions receive no claim-revocation power by default. Explicit `revokeOwnClaims` applies only to the canonical admission basis created under that exact grant and resource ceiling. `revokePrincipalClaims` is root/exceptional-delegation authority with a high-risk ceremony; principal equality alone is insufficient.

### 7.4 `act` is provenance, not authority

The reserved `act` row must be re-cut. Its target is a full-width `grantId` or `keyId`, with optional public actor-principal provenance. It lets humans render “Bob acted for Team T.” The home KEL registry—not a graph claim—is the authorization source. Private/team actors use opaque keys and local labels; publishing Bob's principal is an explicit correlation decision.

## 8. Envelope and admission amendment

### 8.1 Required signed seam

The current `author` slot was the right reservation but is not sufficient alone. Before the envelope freezes, amend it to bind authority:

```solidity
Envelope(
  bytes32 author,          // stable principal
  bytes32 authorityId,     // grantId; zero only for bare EOA
  uint64  authEpoch,
  uint64  order,
  bytes32 prev,
  bytes32 recordsRoot,
  uint32  count
)
```

This is the canonical semantic field order. `envelopeDigest = keccak256(DOMAIN_ENVELOPE_ID_V2, canonical(Envelope))` identifies the unsigned envelope, but not every suite blindly signs that 32-byte value: secp256k1/raw P-256 use the byte-pinned EIP-712 preparation, WebAuthn binds the specified challenge preparation, and a future PQ suite chooses its reviewed pure/prehash preparation over the same purpose-separated semantic bytes. The suite profile—not an ad hoc caller—owns that mapping.

The signature witness identifies/verifies the actor key under its exact suite and must match the actor descriptor in `authorityId`'s root/child grant. `prev` is an actor-lane evidence/replication hint only; multiple actors do not share a consensus head. `claimId` remains logical-record based (`author`, `order`, `recordDigest`) and excludes actor/grant carriage so reauthorization does not change the record's identity.

That logical-ID choice requires an explicit first-authoritative-admission rule. Evidence import MUST NOT occupy the authoritative-admission bit. The first valid authority-home admission atomically binds `claimId` to one immutable primary `admissionId`; later authorized carriages may create supplemental receipts on the receipt spine but cannot overwrite provenance, revive a revoked primary basis, or change slot state. A formerly evidence-only claim may be promoted exactly once after a valid home admission. To restore a revoked record under a new actor, reassert it at a new `order`. These cases need collision, front-run, multiple-authorization, evidence-promotion, and basis-specific revocation vectors before the `claimId` formula freezes.

Legacy bare mode is exactly `authorityId = 0`, `authEpoch = 0`, address-shaped author, secp256k1 recovered actor = author. Once KEL activates, that branch is permanently disabled for future authoritative admission.

### 8.2 Admission-time ruling

**Authoritative authorship is validated at the principal's authority-home admission, not reconstructed from an author-controlled time later.** KEL/grant state and admission share this one chain order. A signature has no trusted creation time. Read-time-only resolution lets a removed key sign today while naming yesterday's `order` or authority event; a foreign snapshot cannot cure that and never mints the strongest receipt.

Authoritative admission performs:

1. structural envelope/record validation;
2. suite-exact actor signature verification;
3. home/principal and `authEpoch` check;
4. bounded grant/ancestry and actor-descriptor lookup;
5. a complete `ActionContextV1` check over audience, action, kind, definition, immutable resource proof, authority-home venue, privacy class, envelope/total counters, home-block window, recovery status, and revocation for every record;
6. persist the immutable authorization receipt; then
7. apply slots/claims under the **principal**, preserving actor provenance.

`ActionContextV1` is a closed canonical struct, not an opaque caller-supplied label; its hash commits every checked field. Because one signature covers a batch, common authorization data is stored once per envelope and each claim gets a small admission leaf:

```text
EnvelopeAuthReceiptV1 = {
  receiptId,
  envelopeDigest,
  principal,
  actorKeyId,
  authorityId,
  authEpoch,
  grantProofRoot,
  authorityHomeRef,
  identityHeadEventId,
  homeAdmissionBlockNumber,
  homeAdmissionTimestamp,
  admissionOrdinal,
  registryVersionAndCodeHash,
  authorizationResult
}

ClaimAdmissionV1 = {
  admissionId,
  receiptId,
  claimId,
  leafIndex,
  actionContextHash
}
```

`receiptId = keccak256(DOMAIN_AUTH_RECEIPT_V1, envelopeDigest, authorityId, actorKeyId, admissionOrdinal)` and `admissionId = keccak256(DOMAIN_CLAIM_ADMISSION_V1, receiptId, claimId, leafIndex, actionContextHash)`. The kernel stores `primaryAdmission[claimId]` plus append-only receipt/admission spines; point reads remain O(1), common batch data is not duplicated per record, and supplemental bases are paginated audit evidence. `admittedAt` remains fenced out of LWW/comparator math. A contract cannot know its current block hash, so the stored receipt does **not** pretend to contain one. A portable `AuthProof` later wraps both exact structs and their account/storage inclusion proofs in an independently obtained finalized basis `(chainId, blockNumber, blockHash, stateRoot, consensus/finality checkpoint)` or a finalized checkpoint.

### 8.3 Confluence boundary

State-dependent authorization is incompatible with the generic kernel's “every venue accepts the same set in every order” invariant. Pretending otherwise is worse than naming the boundary:

- the **authoritative home lane** is intentionally home-ordered and KEL-aware;
- the **evidence/import lane** may store any structurally valid artifact without granting slot authority;
- a foreign chain applies a record as a graded snapshot only with a recognized authority-home receipt/checkpoint/light-client proof;
- an unproven foreign or late removed-key artifact is `PORTABLE-SIGNATURE-ONLY`, never LIVE slot authority.

Because no users exist and the Etched surface is not frozen, the preferred implementation is to design this split into v2 now. “Old Etched kernel now, KEL-aware peer years later” is rejected as a first-class solution: old kernels cannot persist actor, authority, scope, or home basis, and contracts cannot run a client-side union rule.

## 9. Current versus historical verification

These are different questions and different APIs.

### Current authority

1. Resolve the principal's canonical authority home from the finalized L1 locator.
2. Read a finalized `IdentityState` at the home.
3. Check status is ACTIVE, not pending/disputed/deactivated.
4. Resolve current actor/grant and `authEpoch`.
5. Verify the requested action's scope and signature.

### Historical authorship

1. Verify exact envelope/record bytes and suite-specific actor signature.
2. Verify `authorityId`/grant chain and key descriptors.
3. Verify the home admission receipt proves the actor was authorized at that admission ordinal.
4. Verify the receipt's registry/version/codehash and an external finalized home basis/state proof; do not expect a same-transaction block hash in storage.
5. Apply later evidence-renewal/algorithm-epoch grading.

A record signed while a key was authorized but never home-admitted before removal has only `PORTABLE-SIGNATURE-ONLY`. This is unavoidable: without a trusted ordering witness, no verifier can know whether the signature was created before or after removal. Periodic home checkpoints/ANCHORSET-style roots may batch historical evidence for export and replication.

## 10. Recovery

### 10.1 Default model

Consumer default: passkey/hardware-backed daily key plus heterogeneous 2-of-3 recovery, for example:

- an offline hardware/cold key;
- a second independently controlled device or trusted human guardian key;
- an optional assisted/vendor guardian, never the only non-device factor.

Guardian leaves are committed under a Merkle root and revealed with membership proofs only during recovery where practical. Every leaf binds `(principal, policyVersion, uniqueIndex, factorKeyMaterialId, suite/profile, role, independentHighEntropyLeafSalt)`; duplicate indices/material and duplicate signature counting reject. A single root salt is insufficient against dictionary attacks on known public keys. Avoid three factors backed by one Apple/Google/email/phone ecosystem. Recovery-policy changes are more dangerous than ordinary key changes and enter only through the complete next-control-state commitment.

```text
RecoveryPolicyV1 = {
  version,
  guardianRoot,
  guardianCount,
  threshold,
  vetoClauseHash,
  minDelayHomeBlocks,
  maxPendingHomeBlocks
}

RecoveryProposalV1 = {
  principal,
  authorityHomeRef,
  registryId,
  currentHeadEventId,
  recoveryPolicyHash,
  recoveryNonce,
  replacementControlStateHash,
  eligibleAtHomeBlock,
  expiresAtHomeBlock
}

proposalId = keccak256(DOMAIN_RECOVERY_PROPOSAL_V1,
                       canonical(RecoveryProposalV1))
```

The replacement cannot lower `securityFloor`, change home outside the migration state machine, or smuggle a different recovery policy than the exact replacement state. Guardian and veto signatures bind `proposalId`, purpose, principal, home, registry version, current head, and nonce.

### 10.2 Procedure

1. Guardian quorum signs the exact `RecoveryProposalV1` and compromise intent; unique leaf indices/material are counted once.
2. Every proposed new key supplies proof of possession.
3. `RECOVERY_PROPOSE` enters `RECOVERY_PENDING`: new grants/current-control changes freeze; new records are stored only as disputed evidence. A valid precommitted-next rotation remains available and wins atomically.
4. Current **control** may submit objection evidence; hot record/session actors have no recovery standing and no current key can cancel alone.
5. The exact committed veto clause may cancel, or the exact recovery clause may replace, each with a fresh consumed nonce. “Supermajority” has no implicit meaning.
6. After `eligibleAtHomeBlock`, anyone may call `RECOVERY_FINALIZE`; no lost wallet or gas key is required. Reproposal cannot reset the clock indefinitely, and proposals expire at the committed bound.
7. Finalization installs exactly the proposal, advances recovery nonce, bumps control and auth epochs, and kills every session.
8. Pre-proposal records retain immutable `HOME-ADMITTED-AUTH`. Records objectively arriving while state was `RECOVERY_PENDING` remain `DISPUTED-INTERVAL`. A later `DISAVOW_INTERVAL` is a separate advisory-risk overlay and never changes base protocol validity or mechanically censors GATE reads.

### 10.3 Recovery honesty

- Identity recovery does not recover Ethereum funds in a bound account.
- Identity recovery does not decrypt files or restore destroyed content keys.
- A synced passkey inherits its platform account's recovery trust.
- An MPC/TEE/OAuth provider is a replaceable guardian/convenience factor, not the constitutional root.
- A current-key-cancelable recovery profile may exist only as an explicitly weaker user choice.
- Recovery drills and stale-guardian health checks are product requirements, not documentation extras.

## 11. User and organization model

### 11.1 One OS profile, several principals

The human is not forced into one public master KEL. The local profile can manage:

- a primary public principal;
- a work principal;
- one or more durable pseudonymous principals;
- one-shot/stealth bare actors;
- organization principals;
- device and app actors under each public principal.

Only device/app actors collapse under a principal. Separate personas use separate KELs, control keys, recovery commitments, encryption keys, execution accounts, and preferably submission/funding routes. Publicly delegating a “private persona” from the primary permanently defeats the privacy goal.

### 11.2 Multi-device

- Each device gets a unique non-exported key and actor/grant; never clone one author seed to every device.
- An active delegation-authority device enrolls a new device within its ceiling; root ceremony is required only for a new delegation authority or broader scope.
- Lost phone: revoke its key/grants and optionally bump `authEpoch`; other devices continue.
- Total device loss: recovery procedure.
- The 10 `order` device bits remain collision-reduction metadata, not identity or authorization. The KEL actor/grant is the real device distinction.

### 11.3 Organizations and DAOs

An organization is a principal with m-of-n control/recovery and one or more single-signature operational actors. Governance approves actor installation/rotation; routine records remain cheap. Explicit N-signature control events are the v1 baseline because they are auditable, algorithm-heterogeneous, and do not depend on MPC nonce protocols.

An organization that constitutionally requires quorum approval for every item may use an externally reviewed threshold scheme that emits one ordinary actor signature, or publish a separate approval record. FROST and threshold ECDSA are optional adapters, not the KEL's constitutional threshold primitive: FROST P-256/secp suites emit Schnorr, not Ethereum ECDSA/`ecrecover`, while threshold ECDSA needs separate DKG/resharing, nonce-reuse, complaint/abort, and backup review. A Safe may coordinate owner approvals or directly call the home registry at inception, but Safe/contract state is not replayed as eternal record authorization.

### 11.4 Names

ENS, DNS, and petnames resolve to principals; they are not principals. Public names use a bidirectional binding: the naming system points to the EFS identity and the KEL principal signs the name claim. Local petnames remain private. Identity recovery/rotation leaves names stable; name transfer does not transfer the KEL unless a distinct explicit identity-transfer design is adopted.

Personal identities are non-transferable by default. Organization control succession is not identity sale.

## 12. Ethereum account compatibility

The dependency direction is **KEL → smart account**, never **smart account → KEL record validity**.

| Standard/system | EFS use | Boundary |
|---|---|---|
| ERC-4337 (Final; reference release v0.9.0 as checked) | bundling, sponsorship, account execution, optional mirrored policy | EntryPoint/account version discovered and checked; not identity |
| EIP-7702 | batching and execution continuity for an EOA | original EOA can overwrite delegation; audited wallet-controlled delegate shortlist, atomic initialization, and namespaced/storage-layout checks required; dapps never choose delegate code; not recovery or PQ migration |
| EIP-5792 | final wallet call/capability API | capability negotiation only; minimize fingerprinting |
| ERC-7913 | model for `(suite/verifier, arbitrary key bytes)` and immutable stateless verifiers | copy the abstraction, not chain-specific verifier addresses or ERC-1271 fallback |
| EIP-7951 | raw P-256 semantics, active on Ethereum mainnet since Fusaka/Osaka and on conforming venues | Final status is not per-chain activation; verify fork config + conformance vectors, enforce low-S in EFS; no WebAuthn/identity binding |
| ERC-1271 / ERC-6492 | provisional endpoint UX evidence only | forbidden for envelope/KEL authority; 6492 never authorizes canonical inception because verification may deploy/call arbitrary preparation code |
| ERC-7579 / ERC-6900 / ERC-7710 / ERC-7715 / ERC-7739 / ERC-7821 / ERC-7902 | capability-detected adapters, policy mirror, batch/defensive UX | Draft semantics never Etched into KEL; 7902's 7702 authorization capability is exceptionally sensitive |
| ERC-7677 / ERC-8152 | paymaster UX and content-addressed module precedent | Review status; adapter inspiration only |
| EIP-7851 / EIP-8151 / EIP-8130 / EIP-8141 / EIP-8164 / EIP-8202 | native rotation/authenticator/agility/PQ experiments | competing Draft Core proposals, not a stack: prefix/tx-type conflicts exist; 8151's state-dependent `ecrecover` is explicitly excluded from portable bare verification |

> **External update — Base native AA, reviewed 2026-07-19.** Base has committed to testing EIP-8130 on Vibenet and targets its Cobalt upgrade for September 2026. This materially raises EIP-8130's implementation relevance but does not change the dependency direction above: its account configuration, canonical authenticators, transaction actor context, batching, and payer separation are candidates for a versioned smart-account/authority-home adapter; its chain-bound transaction authentication is not a portable EFS record witness. Run the compatibility matrix in [[Reviews/2026-07-19-base-native-aa-impact]] before the KEL/envelope freeze, and do not Etch Draft transaction types, scope bits, addresses, or companion-ERC assumptions.

Smart-wallet-only user path: create a digest-shaped born-KEL identity and appoint portable EFS keys. A **deployed account itself** must execute the inception call directly against the authority-home registry, so that registry observes `msg.sender == bootstrapAccount`; an EntryPoint or Safe transaction may cause the account to make that call, but an intermediary setup adapter cannot stand in as the caller. The transcript binds chain, account, registry, proof block/basis, genesis body, and appointed EFS keys. This is one deliberately chain-local `msg.sender` fact, not portable record authority. Counterfactual ERC-6492 never authorizes canonical inception.

Account bindings contain `{chain,address}`, bilateral acceptance by KEL control and a direct account call, proof basis, and validity interval. Proxy bytecode or a 7702 designator is not called a security commitment. An optional versioned adapter profile may prove the implementation/delegate, owners/validators, hooks/modules, factory, storage/configuration, and basis block; absent that closure the record is merely a verified endpoint binding. Same-address multichain accounts maximize linkability and are opt-in. KEL may unbind an endpoint; endpoint recovery never silently rewrites KEL control.

An EFS grant constrains only EFS authority-home actions. It does not constrain arbitrary EVM calls, token approvals, signed orders, funds, or vendor wallet sessions unless a separately conformance-tested smart-account module enforces a mirrored policy. KEL revocation does not revoke those external powers. Permission Center renders EFS authority, wallet/funds authority, and encryption access as separate planes.

## 13. Passkeys and WebAuthn

Raw P-256 is natively verifiable on Ethereum mainnet after Fusaka/Osaka via EIP-7951 and on independently confirmed conforming venues; Final EIP status alone does not prove a given chain implements the safe `0x100` semantics. P-256 verification is not WebAuthn and neither solves identity binding. Raw P-256 and WebAuthn remain separate suites. WebAuthn Level 3 is a 2026 Candidate Recommendation Snapshot, not yet a final W3C Recommendation.

A WebAuthn key descriptor commits:

- exact P-256 public key, COSE algorithm, point validation, and size caps;
- exact `type == "webauthn.get"` and challenge bytes/base64url grammar;
- `rpIdHash`, RP-ID/origin relationship, and exact allowed-origin serialization/policy;
- `crossOrigin == false` with `topOrigin` absent for root control/recovery (a different reviewed profile is required to allow cross-origin use);
- required UP and UV policy (**UV required for control/recovery**);
- BE/BS interpretation, including rejection of impossible `BE=0, BS=1`;
- strict `clientDataJSON` parsing with duplicate-key rejection and an explicit unknown-member/extension policy;
- strict DER parsing with no trailing bytes, followed by normalization to canonical low-S witness form rather than randomly rejecting otherwise compliant high-S authenticator output;
- signature-counter treatment (risk evidence, not deterministic rejection because synced authenticators may return zero or non-monotone values); and
- maximum assertion sizes.

Passkeys are RP/domain-bound and WebAuthn defines no portable backup/sync protocol. Therefore:

- one passkey is never the sole century root;
- enroll at least two credentials from independent failure domains/RPs plus a non-synced, non-RP-dependent cold/recovery factor;
- use `attestation: none` by default and do not publish AAGUID/device labels, while making no claim that such a credential is hardware-backed;
- test domain loss as a recovery scenario;
- treat synced credentials and BE/BS as cloud-recovery signals, not proof of provider independence or one physical device;
- WebAuthn PRF may unlock a local encrypted vault, but is not the archive identity or encryption master key.

The previous plan to unreserve P-256/WebAuthn independently of KEL is incoherent while digest authors are rejected and `recovered == author` is the rule. Unreserve them only with the KEL principal/actor seam and real-hardware vectors from at least two authenticator families.

## 14. Post-quantum and century evidence

NIST finalized ML-DSA (FIPS 204) and SLH-DSA (FIPS 205) in 2024. The unsatisfied work is exact EFS suites, reviewed implementations, EVM verification, gas/calldata, hardware, and migration—not waiting for NIST to choose an algorithm.

- **ML-DSA:** leading frequent-signing candidate after benchmarking exact parameter sets and modes.
- **SLH-DSA:** valuable independent hash-based cold-control/recovery hedge; large signatures make it unsuitable for routine records.
- **LMS/XMSS:** state reuse is catastrophic; HSM/single-writer specialty only, never consumer/multi-device default.
- **Merkle-committed one-time classical keys:** useful bridge idea (also explored by draft EIP-8202), but state/nonce/mempool exposure and witness size require a separate review.
- **Hybrid control:** traditional clause AND PQ clause over the same canonical semantic event during migration. Each suite performs its own purpose-separated message preparation; “either verifies” is a downgrade.
- **Routine records:** remain one signature; move record signers to a reviewed PQ suite rather than adding an unbounded quorum hot path.

Do not mint a generic “ML-DSA” tag. A suite pins parameter set, FIPS edition/errata, pure vs prehash mode, context, canonical encodings, message preparation, limits, and verifier codehash/spec hash. PQ suites should sign canonical semantic bytes directly where feasible; blindly signing a 32-byte external prehash restores the hash-collision bottleneck highlighted by RFC 9958.

Suite capability is graded, not binary: `PORTABLE-READABLE` (independent verifier exists), `HOME-ADMISSIBLE(homeRef)` (that immutable home implementation can verify within bounds), and `CONTROL-ELIGIBLE(policyVersion)` (reviewed for root use). Off-chain verification never creates an authoritative EVM receipt. `securityFloor` is a monotone value defined by an immutable/versioned Codex suite-class table; rotate, recover, and migrate cannot lower it, and no mutable administrator may reclassify suites. Algorithm retirement is a new reviewed spec/epoch, not an admin toggle.

Pre-rotation hides future keys but does not make a classical key safe once revealed. Actual PQ control keys must be committed and activated comfortably before a CRQC, not in its mempool shadow.

Every portable evidence bundle carries exact bytes, suite/key/profile, grant chain, relevant KEL events, home admission receipt, contract address/chain ID, exact immutable code or proxy/upgrade history, block headers, account/storage proofs, consensus/finality checkpoint basis, registry/spec version, and later evidence-renewal records. Codehash plus a claimed block hash is not a century proof. Before a hash/signature retires, renew the evidence under a stronger algorithm/anchor per the RFC 4998 ERS model. Never-anchored artifacts and artifacts first presented after retirement receive weaker grades.

## 15. Tier-1 ABI and grades

Minimum bounded L1 locator and authority-home ABI:

```solidity
// Canonical L1 HomeRegistry
resolveHome(bytes32 principal) -> (HomeCoordinate, MigrationStatus, uint64 locatorNonce)

// Selected authority home
getIdentity(bytes32 principal) -> IdentityState
getKey(bytes32 principal, bytes32 keyId) -> KeyState
getKeyMaterial(bytes32 principal, bytes32 keyMaterialId) -> KeyMaterialState
getGrant(bytes32 principal, bytes32 grantId) -> GrantState
verifyAction(ActionRequestV1 request,
             AuthorityProofV1 authority,
             SignatureWitness signature)
  -> (AuthStatus, bytes32 basis)
getPrimaryAdmission(bytes32 claimId) -> bytes32 admissionId
getClaimAdmission(bytes32 admissionId) -> ClaimAdmission
getAuthReceipt(bytes32 receiptId) -> EnvelopeAuthReceipt
authReceiptCount() / authReceiptAt(uint64 n) -> bytes32 receiptId
claimAdmissionCount() / claimAdmissionAt(uint64 n) -> bytes32 admissionId
wasAuthorizedAt(bytes32 admissionId) -> (AuthStatus, ClaimAdmission, EnvelopeAuthReceipt)
getRecovery(bytes32 principal) -> RecoveryState
resolveMany(bytes32[] principals) -> IdentitySummary[]
eventCount(bytes32 principal) / eventAt(bytes32 principal, uint64 n)
```

`ActionRequestV1` commits the exact principal/home, envelope/record context, actor/grant, action, audience, kinds/definitions, immutable resource proofs, venue, privacy class, counts/bytes, and home-block basis. The actual submit path recomputes it from signed bytes and proofs; a caller cannot gain authority by inventing an `actionClass` label. Current reads are mappings, not KEL scans. Events, keys, grants, and receipts remain state-enumerable/paginated for recovery and audit. `resolveMany` supports 50+ lens principals without serial RPC latency; a lens no longer contains 12 device/app keys for one person.

Read vocabulary amendment:

| Grade/status | Meaning |
|---|---|
| `HOME-ADMITTED-AUTH` | actor was authorized at the canonical authority-home admission; immutable historical fact |
| `SNAPSHOT-AUTH@H` | foreign answer proven against home basis H; freshness displayed |
| `PORTABLE-SIGNATURE-ONLY` | actor signature verifies but timely authorization was never anchored |
| `CURRENT-CONTROLLER` | current home control answer; not a statement about old records |
| `RECOVERY-PENDING` | new grants/control blocked; gate reads fail closed |
| `DISPUTED-INTERVAL` | record objectively arrived while authority-home state was `RECOVERY_PENDING` |
| advisory `DISAVOW` flag | later controller warns of suspected compromise; separate risk overlay, never mutates base auth grade |
| `LEGACY-HOME-CONTESTED` | competing unresolved legacy inceptions/home bases |
| `DUPLICITY-EVIDENCE` | non-authoritative sibling event retained as evidence |
| `KEL-UNKNOWN` | required home/grant/evidence material unavailable |
| `EXISTED-BEFORE-EPOCH` | renewed evidence proves existence before a retired algorithm's epoch |

These must be reconciled with [[read-lens-spec]]'s closed vocabulary before either freezes. A GATE read consumes no `RECOVERY-PENDING`, disputed, contested, signature-only, stale-snapshot, or unknown authority.

## 16. Cross-system impact

| System | Required change |
|---|---|
| Envelope | add `authorityId` + `authEpoch`; version all purpose transcripts; retain bare EOA zero path |
| HomeRegistry + kernel | L1 canonical home selector/migration plus KEL-aware authority-home admission and stored AuthReceipt; principal-keyed slots; separate evidence/import lane |
| Deterministic IDs | continue deriving ownership from stable principal, never actor; no device/app namespace rewrite |
| REVOKE | scope by actor/grant; principal-wide revoke needs explicit authority; historical actor retained |
| Lenses | entries are principals; device/app keys collapse; batch current-state reads; fail closed on recovery/dispute |
| Privacy | separate persona KELs; high-entropy grants that become public at first use; committed guardians; distinct KEM/encryption keys; account links opt-in |
| Time | key/grant validity uses explicit authority-home block intervals, never author `order`/`claimedAt`; receipt never enters LWW |
| Currency | authority-home order governs both control and canonical record admission; foreign currency is explicitly receipt/checkpoint-as-of |
| Replication | bundle carries home receipt/KEL/grants; foreign application is snapshot-graded; late removed-key record is evidence only |
| Storage | full event/grant/receipt bodies state-enumerable; no log-only key history |
| Packages/updates | stable publisher principal survives actor rotation; actor change is provenance, principal/control recovery remains a security event |
| Large uploads | one scoped actor signs manifest; anyone submits chunks; AA remains payment/execution |
| Client OS | Guardian/broker holds actor keys; Permission Center shows scopes/expiry; recovery health/drill; roots never exposed to apps |
| Encrypted data | KEM/key-wrap recovery remains independent; UI shows identity, funds, and decryption recovery separately |
| On-chain completeness | current + historical authorization are bounded state reads; no Graph/indexer dependency |

## 17. User procedures

### Add a phone

Existing delegation-authority device verifies a new device key, grants a bounded device ceiling and clock lane, user confirms in System Chrome, grant is home-anchored or first-use materialized. The root stays cold.

### Remove a lost phone

Revoke actor key and descendants; bump `authEpoch` if compromise scope is uncertain. Previously admitted records remain; post-removal attempts become evidence only.

### Create an app session

Device issues one short, fixed-expiry, app/audience/resource-scoped grant with depth zero. The app never receives root, recovery, other-app revoke, persona-link, account-bind, or decrypt authority.

### Planned control rotation

Reveal the exact precommitted next state, collect new-policy signatures/acceptances, commit the following next state, and advance `controlEpoch`. V1 always advances `authEpoch`; intentionally retained actors receive fresh grants after rotation so no hidden post-commit grant survives.

### Suspected theft

Trigger recovery/emergency lock from any payer, freeze new authority, notify every registered monitor, wait the configured delay, finalize with new keys, bump all epochs, then optionally publish a non-censoring advisory compromise interval. Only the objectively pending interval is protocol-disputed; do not promise retroactive certainty before the chain-observed lock.

### Total loss

Guardians/cold factors reconstruct authorization—not necessarily a private key—propose the exact new state, and permissionlessly finalize. Separately restore encrypted data keys from their own recovery kit if configured.

### Organization signer change

Governance uses control threshold to rotate/install a new single record signer. No lens, object, path, package, or organization identifier changes.

### Export / walk away

Export KEL events, key descriptors, grant certificates/revocations, AuthReceipts/AuthProofs, L1 locator/migration proofs, authority-home coordinate, exact chain proofs/code, encrypted actor vault, and encryption recovery material as separately labeled components. A public gateway plus these artifacts must reproduce historical grades.

## 18. Strategic-fork rulings

| # | Fork | Ruling |
|---|---|---|
| 1 | admission-time vs read-time | **Admission-time for authoritative history**, stored receipt; read-time for current state and foreign grade |
| 2 | personas / many keys | devices/apps are actors under one principal; unlinkable personas are separate principals/KELs; links optional |
| 3 | recovery | precommitted next control + heterogeneous threshold recovery; MPC/vendor only as replaceable factor |
| 4 | session delegation | signed key-bound certificate + on-chain auth epoch/selective revoke; closed scopes, fixed expiry, bounded depth |
| 5 | thief-race window | freeze first-use independent upgrade commitment; delay without prior higher authority is detection only |
| 6 | PQ | exact suite agility; traditional-AND-PQ control transition; ML-DSA likely routine, SLH-DSA cold hedge; no premature tag |
| 7 | EOA→KEL | in-place word, two-phase committed inception, bare path permanently disabled after activation |
| 8 | authority location/order | **per-principal co-located control + admission home**, selected by sparse L1 locator; split control/admission and arbitrary homes rejected |
| 9 | kernel change | yes: KEL-aware authoritative seam before freeze; pure read-layer retrofit rejected |

## 19. Loose ends resolved

| Loose end | Resolution |
|---|---|
| Thief inception | pre-compromise commitment or irreducible ambiguity; no challenge-window theater |
| Rotation locality | home decides definite truth; foreign state is as-of snapshot; old bare admissions after inception are evidence only |
| KEL fork | finalized home head wins; siblings are evidence; contested reserved for home/recovery ambiguity |
| Lost EOA | committed recovery upgrades it; uncommitted/lost EOA remains honestly unrecoverable |
| Theft escalation at launch | offer KEL/commitment from first onboarding and monitor activation; no 2030 flag-day surprise |
| Encryption coupling | signing/KEM/vault keys and recovery remain separate, enforced in descriptors/UX |
| DAO threshold lockout | threshold control + one operational signer; optional threshold-signature adapter for per-item quorum |
| PQ five-conjunct stack | NIST choice complete; implementation/EVM/benchmark/review/adoption remain; do not block off-chain capability on one precompile |
| Successor | cross-principal continuity claim only; never auth or automatic follow; same-principal rotation stays in KEL |
| Threshold vs single-sig | threshold key events; one actor signature per record |
| P-256 schedule | only coherent through KEL actor binding; EIP-7951 removes gas blocker, not identity/WebAuthn work |
| Persona fleet | security keys collapse; privacy principals do not; no public master roster by default |

## 20. Freeze-sensitive reservation ledger

### ADOPT before ceremony

| Item | Frozen surface | Vectors/tests owed |
|---|---|---|
| principal/authority/epoch envelope seam | EIP-712 type, digest, claim admission metadata | bare, root grant, child grant, wrong epoch, cross-purpose replay |
| digest-shaped principal activation | admission, slots, REVOKE, rows, lens/ID/ABI encodings | no address truncation; born-KEL P-256 and threshold principal |
| full `ControlState` / next commitment | KEL event bytes + hash domains | threshold weakening, key reorder/duplicate, role/policy substitution |
| canonical event/purpose transcripts | event header/ID + suite preparation | principal/home/registry/epoch replay, witness malleability, wrong-purpose PoP |
| separate control and actor/grant namespaces | event tags, storage | actor cannot issue event; root `ADD_KEY` rejected |
| canonical authority home + migration | L1 locator, home coordinate, source/target cutover | competing-home replay, split admission, wrong-chain genesis, reorg/migration pending/dead-home |
| first-use legacy upgrade commitment | registry row/event + priority rules | committed vs uncommitted thief, lost preimage, veto/cancel |
| KeyDescriptor/suite/profile | key IDs, encodings, verifier limits | algo confusion, malformed points, low-S, oversize witnesses |
| recovery policy/proposal/finalize/cancel | canonical structs + priorities/nonces/home-block delays | next-policy escape, current-thief veto, duplicate guardian, replay/starvation, wrong new key, floor downgrade, pending writes |
| grant certificate/attenuation format | root/child bodies, issuer + acceptance witnesses, typed scope, counters | hidden child, subset proof, expiry/counter widening, audience/resource escalation, depth overflow |
| AuthReceipt + AuthProof | kernel state/read ABI + finalized proof wrapper | removed-key backdate, evidence-to-authoritative promotion, duplicate logical claim, home basis mismatch, impossible-current-blockhash guard, historical preservation |
| `act` provenance recut | reserved row | grant/key targets; never authorizes alone |
| P-256/WebAuthn profiles | suite + key policy | two authenticator families, RP/origin, UP/UV, BE/BS, counter, JSON edge cases |
| PQ/hybrid grammar | policy clauses + suite namespace pattern | downgrade, pure/prehash mismatch, size/gas caps |
| evidence-renewal artifact | epoch/anchor record | timestamp/hash renewal and retired-suite grading |
| KEL/read grades | read vocabulary | home/snapshot/signature-only/pending/disputed/contested matrix |

### CONVENTION / Durable, not Etched

Default 2-of-3 recovery composition; exact session durations; Permission Center strings; local device/app labels; persona grouping; ENS/petname UX; monitor cadence; account-adapter selection; recovery-drill cadence; gas sponsor preferences; privacy transports; threshold/MPC vendor adapters.

### REJECT

Root `ADD_KEY`/`REMOVE_KEY`; current-key fallback when no next commitment; read-time-only authority; arbitrary-home ordinary claim; ERC-1271/6492 envelope authority; mutable admin-controlled verifier registry; one public human master KEL; public raw guardian/device labels; sliding session TTL; unrestricted JSON caveats or logic VM; one passkey/cloud/MPC vendor as sole root; signature/encryption key reuse; LMS/XMSS consumer default; “either classical or PQ” downgrade policy.

## 21. Failure register

| Failure | Mitigation | Residual |
|---|---|---|
| EOA stolen before first commitment | KEL/commit at onboarding | pre-commit theft remains symmetric |
| current control compromise | full-state pre-rotation; no root add/remove | attacker may use already-authorized ceiling until lock |
| next-state compromise | cold/threshold/PQ custody + independent recovery | next-policy compromise is severe by design |
| guardian collusion | heterogeneous quorum, delay, monitoring, veto policy | recovery is intentionally powerful |
| thief blocks recovery | current key cannot cancel alone | user needs next/veto/recovery quorum |
| session escalation | mechanical attenuation and fail-closed actions | issuer can grant within its ceiling |
| post-revoke backdating | home admission authorization receipt | unadmitted artifacts never gain full grade |
| truncated/foreign KEL | finalized home basis + snapshot grade | foreign liveness depends on proof transport |
| authority home dies before migration prepare | monitor/migrate early; complete exports; successor continuity | same-principal future writes unavailable in v1 |
| malicious RPC | block/state proof or independently confirmed finalized head | light-client/bridge assumptions remain |
| key-event history pruning | full bodies/state spine | storage cost |
| WebAuthn RP loss | multiple RP/factor keys + recovery | one credential may become unusable |
| synced-passkey provider compromise | classify as cloud factor; independent root/recovery | provider sees metadata and may enable signing |
| threshold nonce/protocol bug | explicit signatures baseline; audited optional adapter | larger rare events |
| PQ implementation bug | AND hybrid, independent implementations, exact suites | dual-stack complexity |
| algorithm retires unattended | monitor + ERS-style renewal | neglected evidence degrades |
| public KEL/grant correlation | separate principals; high-entropy commitments; preview first-use disclosure | materialized actors/scopes/timing remain public |
| identity recovered but data/funds lost | separate recovery planes and checks | user can still choose no backup |

## 22. Verification and external-review gates

Before any Etched freeze or mainnet claim:

1. Two independent implementations of canonical event/policy/grant parsing and hashing (at least Solidity plus Rust/TypeScript), differential on every vector.
2. A small formal state-machine model checking: one authoritative head, no actor escalation, committed-rotation safety, recovery liveness under stolen current keys, prospective revocation, epoch invalidation, and home uniqueness.
3. Property/fuzz suites for canonicalization, threshold duplicate/index attacks, key/algo substitution, malformed dynamic lengths, grant attenuation, event sibling handling, and all cross-purpose signature replays.
4. Real WebAuthn vectors from at least Apple/platform and independent hardware/FIDO authenticator families, including RP/origin/UV/backup/counter variants.
5. PQ benchmark and implementation review over exact candidate suites; calldata, verification gas, proof aggregation, signing latency, hardware availability, and failure modes.
6. Gas snapshots for current reads, actor admission, recovery, worst-case threshold, and 50–256-principal `resolveMany`.
7. Recovery abuse tabletop: stolen current key, compromised guardian minority/quorum, lost next keys, malicious assisted provider, lost RP domain, and no payer.
8. Export/walk-away test from only public chain state + bundle; verify historical AuthReceipt and current KEL state without project infrastructure.
9. Independent cryptographic/security review by reviewers outside this design lineage. The KEL/envelope/grant/WebAuthn/PQ chapters are first-class review objects, not appendices to a kernel audit.
10. Funded identity monitor before recovery delays are sold as protection. Transparency without monitoring is detection theater.

The formal/property suite specifically proves:

1. precommitted next control can atomically escape any pending recovery, while current keys cannot reach an uncommitted root;
2. proposal/cancel/replace/finalize/migration replay fails and reproposal cannot starve higher-priority rotation;
3. security floor never decreases and one key/material/signature cannot count twice or cross roles;
4. hidden child grants first disclosed after ancestor revocation fail, and control rotation carries no old uncommitted grant;
5. a stale foreign snapshot cannot yield global-current authority or a home receipt;
6. a receipt cannot transplant across claim, envelope, principal, actor/grant, action context, home, registry, or ordinal;
7. multiple authorizations of one logical claim have deterministic primary provenance and basis-specific revocation behavior;
8. an advisory disavow cannot mutate historical admission truth;
9. born-KEL derivation is non-circular and independent of witness malleability;
10. reorgs around legacy commitment, recovery eligibility, migration cutover, and receipt checkpoints converge;
11. WebAuthn differential vectors cover duplicate JSON keys, alternate encodings, high-S normalization, malformed DER, wrong type/challenge/origin/RP, cross-origin, UP/UV, BE/BS, extensions, and size caps;
12. oversized PQ/WebAuthn/grant/event witnesses fail before unbounded allocation/verification; and
13. graph/container mutation cannot widen a previously issued resource scope.

## 23. Decisions for James

1. **Authority-home topology.** Recommend ratifying §4.5: one co-located KEL/admission home per principal, selected by a sparse Ethereum-L1 locator. This avoids L1 cost per write and avoids dishonest cross-chain instant revocation; it requires funding the locator/proof/migration work and accepting the stated dead-home limit.
2. **Ship KEL-aware machinery with v2 or only reserve it.** Recommend build and review it before the one-final freeze while keeping bare EOA as the zero-setup user path. A future peer retrofit is no longer credible for first-class delegated authorship.
3. **Legacy upgrade commitment.** Recommend default-on at first EFS onboarding; permit an explicitly degraded skip rather than silently accepting the thief race.
4. **Smart-account bootstrap.** Recommend allowing a deployed Safe/4337 account to call the authority-home registry directly once (`msg.sender` is the account) to appoint portable EFS keys, while forbidding ERC-1271/6492 in canonical inception and envelope/KEL verification.
5. **Personal identity transferability.** Recommend non-transferable personal principals; organizations use control succession. Any sale/transfer feature must be a separate explicit design.

## 24. Primary sources and current standards

- [KERI specification v1.1](https://trustoverip.github.io/kswg-keri-specification/) and [KERI paper](https://arxiv.org/abs/1907.02143)
- [did:webvh v1.0](https://identity.foundation/didwebvh/v1.0/)
- [did:plc specification v0.3.0, December 2025](https://web.plc.directory/spec/v0.1/did-plc), [PLC recovery](https://atproto.com/guides/account-recovery), and [PLC replicas](https://atproto.com/blog/plc-replicas) (the legacy URL path still says `v0.1`; content/version checked 2026-07-11)
- [Farcaster overview at `aa6bdfb`](https://github.com/farcasterxyz/protocol/blob/aa6bdfb2c185e9a557097b8b40af923e2a278cf1/docs/OVERVIEW.md), [KeyRegistry at `3f37e21`](https://github.com/farcasterxyz/contracts/blob/3f37e21db8e9c6319b4a3d5f62b1c514ef01c36b/src/KeyRegistry.sol), and [Snapchain signers](https://github.com/farcasterxyz/protocol/discussions/266)
- [IETF Key Transparency architecture](https://datatracker.ietf.org/doc/draft-ietf-keytrans-architecture/), [Certificate Transparency v2](https://www.rfc-editor.org/rfc/rfc9162.html), [Sigsum](https://www.sigsum.org/docs/), [WhatsApp AKD deployment](https://engineering.fb.com/2023/04/13/security/whatsapp-key-transparency/), [CONIKS](https://sns.cs.princeton.edu/assets/papers/2015-sec-melara.pdf), and [Keybase sigchains](https://book.keybase.io/docs/server)
- [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337), [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702), [EIP-5792](https://eips.ethereum.org/EIPS/eip-5792), [ERC-7913](https://eips.ethereum.org/EIPS/eip-7913), and [EIP-7951](https://eips.ethereum.org/EIPS/eip-7951)
- [ERC-7579](https://eips.ethereum.org/EIPS/eip-7579), [ERC-6900](https://eips.ethereum.org/EIPS/eip-6900), [ERC-7710](https://eips.ethereum.org/EIPS/eip-7710), [ERC-7715](https://eips.ethereum.org/EIPS/eip-7715), [ERC-7739](https://eips.ethereum.org/EIPS/eip-7739), [ERC-7821](https://eips.ethereum.org/EIPS/eip-7821), [ERC-7902](https://eips.ethereum.org/EIPS/eip-7902), [ERC-8152](https://eips.ethereum.org/EIPS/eip-8152), [EIP-8130](https://eips.ethereum.org/EIPS/eip-8130), [EIP-8141](https://eips.ethereum.org/EIPS/eip-8141), [EIP-8151](https://eips.ethereum.org/EIPS/eip-8151), and [EIP-8164](https://eips.ethereum.org/EIPS/eip-8164) (Draft/Review as characterized in §12; track, do not freeze)
- [WebAuthn Level 3 Candidate Recommendation Snapshot, 26 May 2026](https://www.w3.org/TR/webauthn-3/)
- [FROST RFC 9591](https://www.rfc-editor.org/rfc/rfc9591.html)
- [FIPS 204 ML-DSA](https://csrc.nist.gov/pubs/fips/204/final), [FIPS 205 SLH-DSA](https://csrc.nist.gov/pubs/fips/205/final), [NIST SP 800-208](https://csrc.nist.gov/pubs/sp/800/208/final), [RFC 9958](https://www.rfc-editor.org/rfc/rfc9958.html), and [RFC 9794](https://www.rfc-editor.org/rfc/rfc9794.html)
- [RFC 4998 Evidence Record Syntax](https://www.rfc-editor.org/rfc/rfc4998.html)
- [UCAN](https://ucan.xyz/specification/) and [Biscuit](https://doc.biscuitsec.org/reference/specifications)
- [OpenPGP RFC 9580](https://www.rfc-editor.org/rfc/rfc9580.html), [Nostr NIPs at `8f8444d`](https://github.com/nostr-protocol/nips/tree/8f8444d05a8842c40211ded5d10af3521541f865), [SSB protocol guide](https://ssbc.github.io/scuttlebutt-protocol-guide/), and [Urbit life/rift](https://docs.urbit.org/urbit-id/life-and-rift)

Mutable sources above were accessed 2026-07-11; load-bearing GitHub sources are commit-pinned where practical. Promotion must archive a source manifest with version/commit, publication/access date, and content hash for every mutable specification used to cut bytes.

## Open questions

- [ ] James decisions §23.
- [ ] Exact control-policy key/signature/event-size maxima after gas/PQ benchmarks.
- [ ] Exact L1 `HomeRegistry` proof/finality profile, supported authority-home chain classes, migration proofs, and whether a later L1 emergency dead-home recovery verifier is acceptable.
- [ ] Exact WebAuthn origin grammar and whether self-hosted clients use multiple RP credentials or a native Guardian broker.
- [ ] Exact recovery minimum/maximum delays and veto-policy profiles after abuse testing.
- [x] Planned control rotation always bumps `authEpoch` in v1; no hidden carry-forward.
- [ ] Exact historical checkpoint/ANCHORSET encoding for bulk foreign import and evidence renewal.

## Pre-promotion checklist

- [ ] Every §20 Etched item has byte layouts and golden vectors.
- [ ] All §23 James decisions resolved or explicitly deferred with the degraded behavior named.
- [ ] Formal model and differential implementations pass.
- [ ] Real WebAuthn and PQ benchmark gates pass.
- [ ] Independent external cryptographic review passes.
- [ ] [[codex-envelope]], [[codex-kernel]], [[read-lens-spec]], [[identity]], [[privacy]], [[wallet-and-actions]], [[freeze-gates]], and the reservation sheet are reconciled in one reviewable change.
