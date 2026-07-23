# Deterministic EFS IDs — the identity Codex (v2 core)

**Status:** draft
**Target repos:** contracts, sdk, planning
**Depends on:** —
**Supersedes:** — (on acceptance: supersedes the identity model of [ADR-0049](../../contracts/docs/adr/0049-file-content-identity-hash-as-data.md) in part — "identity ≠ content" is retained, "identity = EAS UID" is replaced; also supersedes the 2026-06-01 never-change-frozen-schemas commitment ([[Decisions]]) and the v1 UID set in `contracts/docs/SEPOLIA_FREEZE_TABLE.md`)
**Reviewers:** —
**Last touched:** 2026-07-01

#status/draft #kind/design #repo/contracts #repo/sdk #repo/planning

> **Coordinated re-cut required.** The chain-free/domain-separated ID goal survives, but this text still assumes EAS statements, address-shaped authors, and an older literal vocabulary. KEL requires full-width principals at every semantic boundary, and the native kernel now owns admission and revocation. Do not implement or freeze the formulas below until `codex-envelope`, `codex-kinds`, `codex-kernel`, and KEL are re-cut together with new cross-language vectors. See [[assumptions-and-requirements]]. [[solana]] adds the concrete rule that a PDA/program ID is a venue locator, never a logical EFS ID, and supplies the redeployment vector.

## Problem

EFS uses EAS attestation UIDs as object identity and `refUID` as its graph edge. EAS UIDs hash `block.timestamp` (plus a collision bump), so they are unknowable before mining. Three permanent consequences follow, in order of importance:

1. **The archive is unreplicable.** Replaying an EFS tree onto any other chain (or a re-genesis after a fork/migration) changes every UID and severs every internal reference. A LOCKSS-style lots-of-copies survival strategy — the only 100-year strategy that has ever worked — is structurally unavailable. Hyperlinks are chain-bound pointers, not names.
2. **Reads are not trustlessly verifiable without an indexer.** A light client cannot recompute where anything lives; it must be told.
3. **Writes are non-atomic for plain EOAs.** Dependent attestations cannot ride one signed transaction (refUIDs are baked into calldata), so a stock-wallet write spans multiple blocks with partial-failure states in between. Measured against the *shipped* baseline (Tier-0 layered `multiAttest`, [[write-ux-options-ranked]]): the common case is already 2–3 popups (burner: 0) — the win here is **atomicity and idempotency**, with popup count a corollary.

This design replaces *reference* identity with deterministic, client-computable EFS IDs while keeping EAS as the authenticated, revocable, timestamped statement layer. **The justification is (1) and (2) — permanent archival properties no overlay can retrofit.** The adversarial review record behind this framing: [[2026-07-01-v2-adversarial-review]] and [[efs-v2-holistic-redesign]].

### Statements vs. things

The conceptual core: EAS UIDs identify **statements** ("Alice attested X at time T" — self-verifying, revocable, timestamped). EFS needs to identify **things** (a path, a file identity, a value, a collection). Every EFS *object* is already non-revocable; every *claim* (MIRROR, PIN, TAG, LIST_ENTRY, REDIRECT) is revocable. This design gives objects deterministic IDs and leaves claims — and revocation — on EAS UIDs, untouched. This is Datomic's entity/fact split; the ID classes below map onto Datomic's identity taxonomy (upsert key / minted entity id / interned value).

## Proposal

### 1. Derivation rules (byte-exact, frozen)

All derivation uses `keccak256` over `abi.encode` of **fixed-width words only**. Dynamic-length content is always pre-hashed (labelhash pattern). `abi.encodePacked` is **banned** for identity derivation (spec rule + lint), because any variable-length field creates the `("ab","c") == ("a","bc")` collision class.

Every derivation input is a **spec-owned constant with a printable, versioned preimage** — never a schema UID, resolver address, anchorId, or any other deployment- or resolution-dependent value. (This rule exists because the draft's own first version violated it with `forSchema`, and four of twelve review perspectives copied the mistake unchallenged — derivation rules propagate by imitation; see [[2026-07-01-v2-adversarial-review]].) The `v1` suffix is the escape hatch: a derivation bug or hash migration mints structurally non-colliding v2 IDs under new constants rather than requiring a new hash function.

```solidity
// ID domains (first word of every preimage)
bytes32 constant DOMAIN_ANCHOR        = keccak256("efs.id.anchor.v1");
bytes32 constant DOMAIN_ANCHOR_SALTED = keccak256("efs.id.anchor.salted.v1");
bytes32 constant DOMAIN_DATA          = keccak256("efs.id.data.v1");
bytes32 constant DOMAIN_PROPERTY      = keccak256("efs.id.property.v1");
bytes32 constant DOMAIN_LIST          = keccak256("efs.id.list.v1");
bytes32 constant DOMAIN_SLOT          = keccak256("efs.id.slot.v1");

// Anchor kinds (abstract role constants — NOT EAS schema UIDs; see §2)
bytes32 constant KIND_GENERIC  = bytes32(0);                        // plain folder
bytes32 constant KIND_DATA     = keccak256("efs.kind.data.v1");     // file anchor
bytes32 constant KIND_PROPERTY = keccak256("efs.kind.property.v1"); // property key anchor
bytes32 constant KIND_LIST     = keccak256("efs.kind.list.v1");

// Claim roles (slot derivation)
bytes32 constant CLAIMROLE_PIN        = keccak256("efs.claimrole.pin.v1");
bytes32 constant CLAIMROLE_TAG        = keccak256("efs.claimrole.tag.v1");
bytes32 constant CLAIMROLE_LIST_ENTRY = keccak256("efs.claimrole.listentry.v1");

// Target namespaces (declared in PIN/TAG payloads; closed set, bytes32(0) illegal)
bytes32 constant TARGETKIND_ANCHOR  = keccak256("efs.targetkind.anchor.v1"); // anchors of any kindTag
bytes32 constant TARGETKIND_ADDRESS = keccak256("efs.targetkind.address.v1");
bytes32 constant TARGETKIND_SCHEMA  = keccak256("efs.targetkind.schema.v1");
bytes32 constant TARGETKIND_OPAQUE  = keccak256("efs.targetkind.opaque.v1");
// object targets declare the object's kind directly: KIND_DATA, KIND_PROPERTY, KIND_LIST

// Datatypes (PROPERTY interning; /vocab/datatypes anchors are the DISCOVERY layer only —
// no anchorId resolution ever occurs inside a derivation)
bytes32 constant DATATYPE_STRING  = keccak256("efs.datatype.string.v1");   // default; never bytes32(0)
bytes32 constant DATATYPE_INT256  = keccak256("efs.datatype.int256.v1");   // 32-byte big-endian two's complement
bytes32 constant DATATYPE_UINT256 = keccak256("efs.datatype.uint256.v1");
bytes32 constant DATATYPE_BOOL    = keccak256("efs.datatype.bool.v1");
bytes32 constant DATATYPE_REF     = keccak256("efs.datatype.bytes32ref.v1");
```

The IDs:

```solidity
anchorId       = keccak256(abi.encode(DOMAIN_ANCHOR, parentId, keccak256(canonicalNameBytes), kindTag));
saltedAnchorId = keccak256(abi.encode(DOMAIN_ANCHOR_SALTED, parentId, keccak256(abi.encode(salt, keccak256(canonicalNameBytes))), kindTag));
dataId         = keccak256(abi.encode(DOMAIN_DATA, bytes32(uint256(uint160(attester))), salt));
listId         = keccak256(abi.encode(DOMAIN_LIST, bytes32(uint256(uint160(attester))), salt));
propertyId     = keccak256(abi.encode(DOMAIN_PROPERTY, datatypeTag, keccak256(valueBytes)));
slotId         = keccak256(abi.encode(DOMAIN_SLOT, claimRoleTag, bytes32(uint256(uint160(attester))), slotKeyWord1, slotKeyWord2));
```

**Frozen per-role slot table** (arity per role is frozen; new roles get new `v1`-suffixed tags; `attester` appears exactly once, as the fixed third word):

| claimRoleTag | slotKeyWord1 | slotKeyWord2 |
|---|---|---|
| CLAIMROLE_PIN | `definitionId` | `targetKind` |
| CLAIMROLE_TAG | `definitionId` | `targetId` |
| CLAIMROLE_LIST_ENTRY | `listId` | `identityKey` |

MIRROR and REDIRECT have **no slot** (multi-valued per ADR-0015 doctrine; slot-bound metadata is unsupported for them). `slotId` is a pure function of payload bytes — never of registry state at attest time.

Rules:

- **Root** parent = `bytes32(0)`. Address containers keep `bytes32(uint160(addr))` as parent (unchanged; the `address(0)`/root conflation is pre-existing and remains poisoned per ADR-0033). Address-shaped words occupy the 96-leading-zero-bit subspace, which a keccak-derived id hits only with 2^96 grinding work.
- **`canonicalNameBytes`** = the exact canonical on-chain name bytes (NFC + percent-encode) that pass `_isValidAnchorName` and the round-trip re-encode check — never the raw human string. The canonical-name profile additionally **pins a Unicode version and rejects unassigned codepoints** (IDNA2008-style; NFC stability holds only for assigned codepoints). Byte-exact case sensitivity is permanent doctrine. Normalization is an SDK-owned invariant (on-chain NFC validation stays impossible per ADR-0048).
- **Salt**: `bytes32`, `salt == 0` rejected at the resolver (uninitialized-memory footgun). Normative entropy rule (in this spec, not SDK folklore): every salt MUST contain ≥128 bits of CSPRNG entropy **or** be derived via keyed HMAC-style derivation from a user-held secret. **Pure public-input-derived salts (content hash, path, counter) are forbidden** — a content-derived salt makes `dataId` a confirmation oracle ("does Alice have this file?"). Retry convergence comes from persisting the salt with the WritePlan before broadcast, not from deterministic salts.
- **Typed literals**: PROPERTY becomes `(bytes32 datatype, bytes value)`; `datatypeTag` enters the interning hash. `datatype == bytes32(0)` is rejected — `string`'s tag is `DATATYPE_STRING`, so exactly one interned literal space exists per logical type. The seeded set above ships with canonical byte-encodings in the Codex; extension is permissionless via new `/vocab/datatypes/<name>` anchors documenting new `keccak256("efs.datatype.<name>.v1")` constants (the anchor documents; the constant derives). Reserved keys (`contentType`, `name`, `contentHash`, `size`) keep working unchanged as `string`. Rationale: content-addressed interning freezes the literal model permanently — shipping untyped means strings-only forever, perpetuating three incompatible value regimes (string PROPERTYs, `int256` TAG weights, decimal-string ranks). This is the truest now-or-never item after the IDs themselves.
- **Slot IDs** give *claims* a deterministic metadata handle without giving them object identity. Claim metadata (ADR-0046's order/label PROPERTYs, future claim annotations) binds to the **slotId**, never the claim's EAS UID — the entry-UID-anchored pattern silently resurrects the one-block-per-layer write ladder this design eliminates, and the slot survives revoke+re-add, which an entry UID does not. **LIST_ENTRY scope rule**: slotId-bound metadata applies only to `!allowsDuplicates` lists — in an `allowsDuplicates` list, duplicate entries share `(listId, identityKey)` and their metadata would merge (a regression from ADR-0046). Resolution for duplicate lists is an open question (occurrence-discriminator word vs entry-UID binding with the extra-block cost accepted).
- **IDs never appear in payloads as self-description.** Resolvers derive every object's ID exclusively from round-trip-validated payload fields; an attestation never carries its *own* id. (Payload fields that *reference other* objects — `dataId` in MIRROR, `definitionId` in PIN — are of course ids; the rule bans a second source of truth for the object being created, not references.)

### 2. Kind tags, not schema UIDs (cross-chain portability is unconditional)

An EAS schema UID hashes the resolver **proxy address**. Baking `forSchema` (a schema UID) into `anchorId` would make "same path = same ID on every chain" contingent on CREATE3 deployment discipline reproducing byte-identical resolver addresses on every chain, forever — one divergent deployment silently halves link portability (file and key anchors fork; generic folders don't — a half-portable tree worse than either extreme). It also welds predicate-namespace identity to concrete frozen schemas: a PROPERTY-v2 schema succession would fork every key-anchor namespace.

Therefore the derivation uses abstract `kindTag` constants owned by this spec. Each chain's resolver stores the frozen **schemaUID → kindTag membership map** (many-to-one: schema variants — e.g. the future blinded-ANCHOR schema — map to the same kind) in ERC-7201 config at `initialize()`. REDIRECT's precedent governs (ADR-0050: kind taxonomy deliberately outside the UID).

**Kind-attachment matrix** (resolver-enforced write-time guards; invariant-tested):

| Anchor kindTag | Legal child anchors | Legal PIN targets at this anchor | Notes |
|---|---|---|---|
| KIND_GENERIC | any kind | KIND_DATA (interpreted as **dirnode**, [[efs-v2-holistic-redesign]] §2.1) | visibility TAGs legal |
| KIND_DATA (file anchor) | KIND_PROPERTY only | KIND_DATA (file placement) | |
| KIND_PROPERTY (key anchor) | none | KIND_PROPERTY (value binding; incl. §5 virtual carve-out) | |
| KIND_LIST | KIND_PROPERTY only | KIND_LIST | |

### 3. Schema field strings (v2 freeze set)

`refUID`-borne references move into payload fields as EFS IDs. `recipient` is retired as a targeting mechanism; address targets encode as `bytes32(uint160(addr))` in `targetId`.

| Schema | v2 fields | Revocable | Notes |
|---|---|---|---|
| ANCHOR | `bytes32 parentId, string name, bytes32 kindTag` | no | resolver derives + validates anchorId; parent rule in §5 |
| DATA | `bytes32 salt` | no | was empty; salt makes dataId on-chain verifiable (ADR-0049's "pure identity" retained — identity commits to attester+salt, never content) |
| PROPERTY | `bytes32 datatype, bytes value` | no | interned typed literal |
| LIST | `bytes32 salt, bool allowsDuplicates, bool appendOnly, uint8 targetType, bytes32 targetKind, uint256 maxEntries` | no | `targetKind` replaces v1 `targetSchema` for EFS-object lists; foreign-EAS-attestation lists are an open question (distinct mode or dropped) |
| MIRROR | `bytes32 dataId, bytes32 transportId, string uri` | yes | `transportId` = the transport anchor's anchorId (client-computable). **v1 guards carry over**: transportId must be an instantiated anchor that is a `/transports` descendant (ancestry walk via the kept path tree, depth cap unchanged — a named exception to §5's registry-read-only existence rule); non-empty URI; `MAX_URI_LENGTH = 8192`; no scheme allowlist (ADR-0056). refUID, if nonzero, must re-derive to `dataId` |
| PIN | `bytes32 definitionId, bytes32 targetId, bytes32 targetKind, bytes32 defParentId, bytes32 defKeyHash` | yes | slot `(attester, definitionId, targetKind)`; `targetKind` is a **declared payload field** over the closed §1 namespace set — validated, never inferred, so the slot key is stable by construction. Validation: object kinds ⇒ `registry.instantiated(targetId)` with registered kind == declared; TARGETKIND_ANCHOR ⇒ registry entry is an anchor (any kindTag); TARGETKIND_ADDRESS ⇒ top 96 bits of targetId zero; TARGETKIND_SCHEMA ⇒ `schemaRegistry.getSchema(targetId)` exists; TARGETKIND_OPAQUE ⇒ no dependency. `defParentId`/`defKeyHash` are zero except for the §5 virtual carve-out. refUID, if nonzero, must re-derive to `targetId` and is permitted only for object-kind targets |
| TAG | `bytes32 definitionId, bytes32 targetId, bytes32 targetKind, int256 weight` | yes | same targetKind rules as PIN; refUID as PIN |
| LIST_ENTRY | `bytes32 listId, bytes32 target` | yes | refUID must be 0 (v1 rule retained). **identityKey = `target` in all modes** (v1's recipient-derived key retired): ANY/SCHEMA-successor: nonzero opaque/object id; ADDR: `bytes32(uint160(addr))`, `address(0)` rejected in v2 (v1 allowed it; surfaced for Phase-0 sign-off). Order/label PROPERTYs bind to the entry's **slotId** (§1 scope rule) |
| REDIRECT | `bytes32 sourceId, bytes32 targetId, uint16 kind` | yes | kind taxonomy stays out of the UID; add **kind=4 `movedTo`** — kind=3 stays `relatedVersion` per ADR-0050 (never auto-followed; ADR-0055 §3 records 3 as taken). refUID, if nonzero, must re-derive to `sourceId` |

**Claim references, adjudicated:** `derivedId` is defined only over attestations under canonical EFS object schemas; a nonzero refUID referencing anything else — including EFS *claim* attestations — REVERTs. Claims are referenced only by slotId (metadata) and EAS UID (revocation); claim UIDs are **not** legal edge/mirror/redirect targets, including via TARGETKIND_OPAQUE (resolvers reject a target that is a registered claim UID under canonical EFS schemas).

### 4. Object registry

`EFSIndexer` gains the canonical object registry and **retires `_nameToAnchor` into it** (same information, pre-hashed key):

- `mapping(bytes32 id => bytes32 firstUID)` — **write-once** (id and firstUID immutable after instantiation), **resolver-gated** (writes accepted only from the canonical resolver set via msg.sender gate — a set that must be extensible only by the pre-freeze reservation of variant-schema resolvers, e.g. blinded ANCHOR; unreachable from the permissionless `index()`/`indexBatch()` path).
- Public read `getObject(id) → (exists, firstUID)`. **Kind invariant: the object's kind is derivable from the registry entry** — via firstUID's schema mapped through the §2 schemaUID→kindTag membership map, plus the payload `kindTag` word for ANCHOR objects (all anchor kinds share one schema); a packed kind slot recorded at registration satisfies the invariant trivially if gas measurement prefers it.
- `resolvePath` becomes a single O(1) registry read on a client-computed anchorId. The router and views join on EFS IDs everywhere above the EAS layer.
- Registry state is **first-writer-wins, state-based, and reconstructible from a documented state-walk** — never dependent on event logs (EIP-4444 history expiry).

### 5. Existence rule and batch ordering

**One existence rule (claim-side):** every claim-side dependency check reads `registry.instantiated` **at onAttest hook time** — never raw `eas.getAttestation` existence (EAS populates `_db` before hooks run; the two diverge mid-batch). Named exceptions, closed: the MIRROR transport-ancestry walk (§3) and the virtual carve-out below.

**Object-side clause:** the ANCHOR resolver requires `parentId` to be (a) registry-instantiated, or (b) `bytes32(0)` (root), or (c) address-shaped — `uint256(parentId) <= type(uint160).max` and nonzero (the virtual address-container exemption). Any other uninstantiated parentId REVERTs; this is what makes the batch-shuffle invariant hold for ANCHOR ordering. (Open question: whether v1's raw schema-UID/attestation-UID root containers (ADR-0033) remain legal anchor parents — they are shape-indistinguishable from uninstantiated anchorIds.)

Strict **parents-first ordering** is protocol, not SDK folklore:

```
[DATA] [LIST] [ANCHOR: ancestors before descendants] [PROPERTY] [MIRROR] [PIN] [TAG] [LIST_ENTRY] [REDIRECT]
```

General rule: any group containing a claim or child follows every group that can mint its dependencies; claims that may target any object kind order last. REDIRECT existence-checks `targetId` per kind (movedTo/symlink: yes; cross-chain provenance is *not* expressed as REDIRECT — see §9). Ancestors that already exist need no intra-batch ordering (registry reads see prior state); topo-sort applies only among batch-minted anchors.

EAS's verified behavior (v1.3–1.7 source): `multiAttest` processes schema groups in order, stores each group's attestations before invoking that group's resolver, hooks run per-item in order, and any failure reverts the entire transaction. A parents-first batch therefore validates fully in one atomic transaction. This behavioral dependency (sequential processing, in-order hooks, batch atomicity, the UID formula) is **pinned in this spec with the EAS bytecode hash**, and a conformance test gates deployment to any new chain.

**The atomicity guarantee, stated precisely:** it covers the dependency DAG — every claim referencing a batch-minted ID lands atomically with it. Ancestor **visibility TAGs are excluded from the atomic batch**: they only ever reference pre-existing anchors (anchor creation itself sets the creator's contains/childrenByAttester state), and the worst case (32 ancestors ≈ ~29M gas) physically cannot ride a ~36M-gas-limit L1 block alongside the base write. They go in a non-blocking follow-up tx when the SDK's gas estimator requires it. Large files are "2 signatures, same block": CREATE2 chunk deploys (predictable store addresses) submitted in parallel with the attestation batch.

**One closed carve-out — virtual reserved-key anchors:** a PIN may bind a reserved metadata key *without the key anchor being instantiated*, verified from the PIN's own payload (keccak one-wayness makes a bare `definitionId` uncheckable): when `defParentId`/`defKeyHash` are nonzero the resolver requires `targetKind == KIND_PROPERTY`, `defKeyHash ∈ {keccak256 of the reserved names: contentType, contentHash, size, name, contentEncryption}`, `defParentId` registry-instantiated with kind DATA, and `definitionId == keccak256(abi.encode(DOMAIN_ANCHOR, defParentId, defKeyHash, KIND_PROPERTY))` — recompute-and-compare, consistent with §1. (`keyWrap` is deliberately excluded: multi-recipient key wraps don't fit a cardinality-1 PIN slot; they use TAG or a future additive schema.) These objects are read by derived point lookup, never reached by directory walk, so no orphan-subtree hazard exists. **Late real instantiation of a virtual anchor is permitted** and is ordinary shared-kind first instantiation (§6): the registry's firstUID becomes that ANCHOR attestation's UID; derived point-lookup reads are identical before and after; instantiation additionally makes the key walk-enumerable. This collapses the property-binding triple (3 attestations → 1 PIN + at-most-1 PROPERTY mint), cutting the whole write ~35% and the DAG to ~7–8 attestations. Everything walkable (placement chain, folders, non-reserved keys) requires instantiation, absolutely — no orphan subtree may ever be registrable-but-unwalkable.

### 6. Duplicate-instantiation policy (per-kind, the highest-frequency consensus behavior)

- **Shared kinds (ANCHOR, PROPERTY)** — unowned Schelling objects; concurrent instantiation is expected. Duplicate instantiation whose payload re-derives to the same id is an **idempotent no-op success**. "No-op" is precise: the registry keeps first-wins; **no append-only array is re-pushed and no instantiation event re-fires** (exactly-once); the duplicate EAS record is inert; but **attester-side visibility effects still run** (`_containsAttestations`/`_childrenByAttester` for the duplicate's attester), so a "lost race" folder still appears in the creator's lens. This closes both honest same-block races and mempool front-run griefing of atomic batches.
- **Owned kinds (DATA, LIST)** — attester-bound; no third party can trigger a collision (the resolver derives from `attestation.attester`). A duplicate `(attester, salt)` is a client bug, and a silent no-op would **merge two files' mirrors and properties under one identity** — permanent corruption. The resolver **REVERTs**. The SDK handles retries by one registry read before resubmit (batches are atomic, so a failed batch never half-lands; the salt persists with the WritePlan, so resubmission is deterministic). **This REVERT is coherent only under replication model A** (§9): under model C, `(attester, salt)` becomes permissionlessly instantiable and REVERT turns into a front-run griefing primitive — the two decisions are coupled and adjudicated together at Phase 0.

### 7. refUID policy (verified display pointer, zero index authority)

`refUID` on EFS schemas is permitted for EAS-explorer legibility but every claim resolver enforces:

```
refUID == 0  ||  derivedId(getAttestation(refUID)) == the per-schema payload id (§3 table)
```

(the check costs one `eas.getAttestation` only when refUID is nonzero) and **no semantic index keys on refUID for EFS schemas** — lens propagation, referencing sets, and visibility are re-keyed exclusively on decoded EFS IDs. Without this, the dual representation (every object has both an EAS UID and an EFS id) split-brains every refUID-keyed index and enables slot-equivocation: two "active" placements at one logical slot via the two reference forms. Additionally, resolvers **reject** edge/mirror/redirect targets and definitions that are raw EAS UIDs of attestations under canonical EFS schemas — the EFS-id form is the only legal reference to an EFS object (§3 claim-references rule).

### 8. Blinded and salted anchors (privacy forks, decided now, shippable later)

Because the derivation hashes `keccak(name)` rather than the name, a future schema variant publishing only the 32-byte nameHash derives the **same anchorId** as the plaintext form. Decided pre-freeze (WHITEOUT/ADR-0055 pattern — additive schema later, reservation now):

- **Blinded anchors are the same object.** Publish-now-reveal-later: every link, PIN, and child created against the blinded anchor keeps working on disclosure. **Disclosure mechanics (recommended, Phase-0 confirm):** disclosure is a dedicated additive claim schema, never a plaintext ANCHOR — a plaintext ANCHOR whose payload re-derives to a blinded-registered id takes §6's idempotent no-op branch and is *not* indexed as disclosure; the disclosure resolver verifies `keccak256(canonicalNameBytes) == the registered inner hash` plus canonical-name validity, and indexes the name-disclosure record. (Alternative, mutually exclusive: the plaintext duplicate *is* the disclosure event, as a second explicit carve-out in §6.) All four form-orderings (plain→plain, blind→plain, plain→blind, blind→blind) are required rows in the §13.4 duplicate-policy matrix. The blinded-variant resolver must be admissible to the registry's resolver-gate set — reserved at freeze, since unlike WHITEOUT it writes shared frozen state.
- **Salted-capability variant** for real secrecy, under its own domain (constructive equivocation otherwise — one anchorId must never verify against two different names): `saltedAnchorId` per §1, with `salt` subject to the §1 entropy rule and never published; shared only as a capability in the web3:// URL **fragment** (Tahoe-LAFS style — fragments never touch servers or chain). Cost stated honestly: a salted path abandons the Schelling-point property. Only the blinded↔plaintext pair is ever id-equal; salted ≠ plaintext for the same `(parentId, name, kindTag)`, by construction.
- **Unsalted nameHash is not privacy.** ENS namehash's history is the proof (most names reversed by GPU dictionary attack; human path segments carry a few dozen bits of entropy). Docs and SDK must present hash-only-unsalted as *disclosure-delayed*, never *private*. Note: for published anchors this is a zero regression — ANCHOR payloads carry names in cleartext calldata today.

### 9. Cross-chain semantics

- Derivations are **chainId-free** — this is the point (portable hyperlinks, LOCKSS replication). Per-chain registries isolate instantiation state.
- **Replication models** (pre-freeze decision, coupled to §6): **(A) original-attester replay** — same attester+salt reproduces dataId on any chain; third parties do **replica-with-provenance**: own dataId + contentHash claim + a lens-scoped provenance claim carrying `(originChain, originalDataId)` as claim *data* — **not** an existence-checked REDIRECT target; on-chain-checked `REDIRECT(sameAs)` remains same-chain-only. **(B — considered, rejected)** proof-based registration via cross-chain proofs: a century-scale dependency-rot surface. **(C) derivation-only registration** — the registry instantiates any id whose derivation verifies against a claimed-attester **field**, making anyone a valid copy host (LOCKSS-shaped) at the cost of moving "identity owner" from msg.sender into the payload — a derivation-input change impossible to retrofit. Honest limit of A: **a dead attester's dataId/listId can never be instantiated on any new chain** — anchorIds and propertyIds replicate fully, but citation-form links to dead publishers' owned objects do not; A meets Problem #1 only at the anchor/property layer; C is the only model that meets it for owned kinds.
- **Same-address squat exception, documented:** contract accounts deployed via legacy CREATE are not address-stable across chains (the 2022 Optimism/Wintermute incident: a Gnosis Safe address re-claimed by a different party on another chain). Cross-chain resolution of salt-bound ids (DATA/LIST) is trust-downgraded unless the attester is an EOA or provably CREATE2/CREATE3-deterministic; content verification falls back to contentHash claims. Anchor and PROPERTY ids are immune (they commit to content, not a controller).
- A verified replica is defined: IDs recompute + contentHash claims match bytes. Temporal provenance of replicas (origin time, cross-chain supersession) is a distinct convention — see [[efs-v2-holistic-redesign]] §3.3.

### 10. Events (v2, ID-keyed, log-only-sync capable)

Every state mutation emits an event with the EFS id as first indexed topic, the EAS UID in data, and the **full payload** (including PROPERTY value bytes and DATA salt): `AnchorCreated(anchorId, parentId, attester | kindTag, name, uid)`, `DataCreated(dataId, attester | salt, uid)`, `PropertyInterned(propertyId, datatype, valueHash | value, uid, attester)`, `ObjectRegistered(id, kindTag, uid, attester)`, plus re-keyed `PinSet/PinCleared/TagSet/TagCleared/MirrorSet/MirrorCleared` (retaining the supersededUID pattern) and revocation events for every revocable schema. Acceptance test in the spec: **a subgraph reconstructs full placement/supersession/mirror/property/visibility state from logs alone, zero eth_calls during sync.** Deterministic-ID topics also turn namespace subscriptions into bare `eth_subscribe` log filters from a static site. Events remain conveniences; the archival reconstruction path is the state-walk (§4).

### 11. What this deliberately does NOT change

Attester = the user's own account on every claim (lenses, supersession, visibility all key on it; no relayers/forwarders). First-attester-wins lens resolution (ADR-0031). Identity ≠ content (ADR-0049's philosophy; content-addressed dataId rejected again — the chain cannot verify content it never sees). No mirror scheme allowlist (ADR-0056). Revocation, entirely (claims by EAS UID). EAS as substrate (ADR-0032) — the ~25% EAS record-storage overhead is rent for authentication, revocation, hooks, delegation rails, and neutrality, and the alternative (kernel entrypoint) collapses the attester for plain EOAs.

### 12. Gas honesty

Deterministic IDs are a **portability/verifiability/atomicity win, not a gas win**: a small-file write is ~9–10M gas either way (4-tx today vs 1-tx v2). The real reductions ride along: virtual reserved-key anchors (−35%), `_indexGlobal` keep/demote line (−13–15%, decided per-mapping by an on-chain-reader audit — kept: path tree, active edges, `_referencingByAttester`, `_containsAttestations`; demoted to event-derived: `_sentAttestations`, `_receivedAttestations`, global `_schemaAttestations`, `_allReferencing`), and deterministic PROPERTY interning. A CI gas-snapshot baseline of canonical write flows lands **before** the re-freeze so the ADR cites measured numbers. L1 is root-of-trust; an OP-Stack L2 is the default write plane.

### 13. Verification gates (freeze-blocking)

1. **Golden vectors** published in the ADR (target ~50): root/address parents and the four ANCHOR-parent branches; every kindTag; NFC pairs; escaped names; salt edge cases; empty values; per-role slotId vectors covering all target namespaces (incl. address-shaped opaque key rejected under TARGETKIND_ADDRESS validation, uninstantiated-object revert, pre/post-virtual-instantiation slotId equality); propertyId vectors for every seeded datatype incl. `string`; blinded/plaintext id-equality pair and salted≠plaintext pair; one full file-write DAG with every intermediate ID; a mixed move batch (ANCHOR+PIN+REDIRECT); a LIST+LIST_ENTRY(+slot-bound PROPERTY/PIN) batch.
2. **`@efs/ids`**: zero-dependency TS micro-package + pure Solidity library — the single implementation everything imports; no inline re-derivation anywhere, ever.
3. **Cross-language differential fuzz** (Solidity ↔ TS) in CI.
4. **Stateful invariant suite**: registry write-once/gating; batch-shuffle (any mis-ordered batch reverts, no state diff); empty-state-diff on batch failure; slot-key stability across target re-classification; duplicate-policy matrix per kind **including the four blinded/plaintext orderings**; kind-attachment matrix (§2); virtual-anchor recompute rule (uninstantiated definitionId PINs revert unless the defParentId/defKeyHash recomputation passes).
5. **The Codex self-hosted at genesis.** The frozen spec is the first file SystemAccount writes — `data:`-inline mirror, contentHash claim, pinned at `/.well-known/spec`. An archive must carry the information needed to interpret its own bits (OAIS ISO 14721); the spec is the artifact that must survive, not the repo. **Closed table of contents** (identical to the Phase-1 enumeration in [[efs-v2-transition-plan]]):
   1. All constant tables with printable preimages (domains, kind tags, claim-role tags, target-kind tags, datatype tags) and the per-role slot-key word layouts.
   2. The ID derivation formulas with byte layouts, and the golden-vector suite.
   3. The canonical-name profile (NFC, pinned Unicode version, percent-encoding, rejected codepoints) and the per-datatype canonical byte-encodings.
   4. The nine v2 schema field strings, their UIDs, and per-schema resolver semantics (duplicate policy, existence rules, refUID rules, kind-attachment matrix).
   5. The EAS behavioral pin: UID formula, multiAttest ordering/atomicity semantics, EAS bytecode hash.
   6. The documented **state-walk procedure**: per-chain contract addresses, registry and EAS storage-layout pointers, and the from-state-alone reconstruction algorithm.
   7. Read-path semantics: lens precedence and the default-lens chain, slot reads and supersession, the REDIRECT resolution spec (by inclusion), transport interpretation (`data:`, `web3://`/chunk-store reassembly), and reserved-key meanings.
   8. The contentHash multibase-multihash convention and chunk/compression formats.
   9. The hash-migration playbook (below).
   **Executable acceptance test (wired into Phase 5):** from the Codex + a chain-state snapshot alone, a fresh implementation recomputes all golden-vector IDs, rebuilds the registry via the state-walk, resolves an `/address/path` to content bytes, and verifies them.
6. **Hash-migration playbook** written before the first ID is minted: successor hash ⇒ new domain constants, parallel registry namespace, coexistence-not-rewrite (old IDs valid as opaque names forever; v2 resolvers accept both; `REDIRECT(sameAs)` bridges) — the git SHA-1→SHA-256 lesson (8+ years, still unfinished, because the transition was retrofitted). Required contents: the successor-domain naming rule, the coexistence read semantics, and who may publish the successor Codex revision (per the trust-root stewardship doc, [[efs-v2-holistic-redesign]] §3.2 — this is a *documented succession path*, not a contradiction of the last-freeze pledge: new domains are additive deployments, not schema-string changes).

> **Substrate ruling (2026-07-02):** [[efs-substrate-decision]] amends this design — v2 ships EAS-carried with single-chain guarantees; the Portable Authorship Envelope + KEL formats join the Codex as reserved sections (with the bytes32 identity word, TID device bits, and read-grade vocabulary); the coupled duplicate-policy × replication-model question below is resolved there (§3.4: signature-verified permissionless carriage; owned-kind duplicates = no-op iff byte-identical, equivocation-evidence otherwise).

## Open questions

- [ ] **DATA/LIST duplicate policy × replication model** (coupled — §6/§9): ~~confirm REVERT-for-owned-kinds and model A, or adopt model C~~ **resolved by [[efs-substrate-decision]] §3.4** — signature-verified permissionless carriage; James confirms at Phase 0.
- [ ] **PIN/TAG target-classification** — declared `targetKind` payload field (as specced) confirmed? Alternatives considered: hook-time inference (rejected: slot keys become time-dependent — re-classification creates two active PINs at one logical placement) and dropping TARGETKIND_OPAQUE.
- [ ] **Typed-literal seeded set** — confirm the `/vocab/datatypes` vocabulary, canonical encodings, and the bare-constant tag rule (anchors as discovery only).
- [ ] **Virtual-anchor reserved-key set** — confirm the closed enumeration (`contentType`, `contentHash`, `size`, `name`, `contentEncryption`; `keyWrap` excluded — cardinality-N).
- [ ] **LIST target modes** — EFS-object lists via kindTag confirmed; foreign-EAS-attestation lists: retain as a distinct mode (UID + concrete schema semantics) or drop the capability? Also: `address(0)` rejected in ADDR mode (v1 allowed it), and the duplicate-list metadata discriminator (occurrence word vs entry-UID binding).
- [ ] **ADR-0033 raw UID root containers** — do raw schema-UID/attestation-UID anchor parents remain legal under v2 (shape-indistinguishable from uninstantiated anchorIds), or do alias anchors become the only form?
- [ ] **Blinded-anchor disclosure vehicle** — dedicated disclosure schema (recommended) vs plaintext-duplicate-as-disclosure (§8).
- [ ] **Visibility-TAG mechanism** — keep ADR-0038 TAGs (out-of-batch) vs derive folder visibility from the kernel's existing `propagateContains` walk (~10–15× cheaper, but loses per-folder revocable visibility claims; reopens ADR-0038). Deliberate schema-freeze-adjacent decision.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment
- [ ] External review of the derivation spec **as a standalone artifact**, by a lineage independent of this design's authors ([[2026-07-01-v2-adversarial-review]] documents why: derivation rules propagate by imitation)

## Implementation notes

Sequencing, guardrails, and the freeze ceremony live in [[efs-v2-transition-plan]]. The full v2 bundle (what else rides this freeze) is [[efs-v2-holistic-redesign]]. Implementation order is Codex → `@efs/ids` + vectors → resolvers → SDK; the verification infrastructure, not the contract diff, is the schedule driver.
