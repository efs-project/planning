# Product traces and acceptance boundaries

**Status:** grounding review for the proposed 1.5 semantic profile; no product,
schema, or implementation commitment is adopted here

The graph must be derived from real user verbs. This pass traces the minimum
roles through Arcade, Nanda, Git-backed Markdown, ordinary files, and the EAS
schema-sharing loop. A role survives only when collapsing it would lose
ownership, cardinality, immutable identity, validation, or bounded reads.

## Candidate semantic vocabulary

| Role | Meaning | Lifecycle/cardinality |
|---|---|---|
| **TAGDEF** | ownerless shared topic or graph predicate such as `/Arcade/` | immutable subject; byte-identical races converge |
| **DATA** | author-owned stable object/lineage; exact typed bodies beneath it use RecordVersionId | DataId is immutable; new bytes/meaning create a new RecordVersionId |
| **PIN** | one current target for `(principal, definition/role, subject or target class)` | revocable/superseding cardinality one; clearing does not resurrect old state |
| **TAG** | one current membership/annotation edge for `(principal, definition/role, target)` | revocable cardinality many; repeated edge updates have explicit fold rules |
| **LIST** | optional immutable collection charter or append-only collection identity | add only if product traces require policy ordinary TAG membership cannot express |

These are semantic roles, not necessarily one-to-one Solidity schemas. A
specialized physical schema is acceptable when it reduces gas or validation
risk, provided the registry declares one canonical source for each reserved
role. A projection from a typed record is a derived index/view linked to that
source, not a second independently authored fact. The SDK exposes that one
canonical spelling; arbitrary semantic equivalence is not resolver-enforceable.

Properties, mirrors, predecessors, replacements, placements, types, and
comments should first be modeled as reserved definitions/roles over this core.
If a role needs distinct payload bytes or state machinery, that is a physical
schema decision, not automatic permission to create another semantic kind.

## Cross-product invariants

Every trace must preserve:

- **stable object versus exact revision:** a moving name/slot resolves from a
  stable DataId to one body-bound RecordVersionId; exact citations never
  auto-follow;
- **identity versus integrity versus transport:** EFS ID names the semantic
  thing, a digest verifies exact bytes, and mirrors/URLs locate them;
- **author versus carrier:** PrincipalId is semantic; raw EasReceiptUid bytes
  require chain/deployment origin and provide realm-local admission evidence;
- **discovery versus endorsement:** finding a submission never makes it safe,
  official, installable, or admitted under a trusted policy;
- **validity grades:** bytes can be well-formed, shape-valid, accepted by a
  read-only validator, admitted by a realm's stateful policy, endorsed by a
  curator, and currently effective under a read policy—these are different
  statements;
- **read honesty:** absence is returned only when the named basis is complete;
  otherwise the result is unknown/partial with cursor or truncation state; and
- **public metadata:** guest reading can be anonymous, but 1.5 authorship and
  graph relationships are public unless a later privacy layer says otherwise.

## Trace A — EFS Arcade portable profile

Everything specific to games below is an Arcade application
profile/deployment—not an EFS 1.5 kernel kind or global curator policy. The
core is accepted only if another application can register different typed
records and bounded references without a contract upgrade.

### User verbs

1. A guest opens a direct game URL and sees useful metadata without a wallet.
2. The guest explicitly presses **Play**; the client verifies the selected
   immutable game generation and its byte closure before execution.
3. A developer or curator submits a game candidate.
4. The official curator approves, rejects, replaces, or removes the candidate.
5. A viewer chooses the official list or another trusted curator/lens.
6. Later, a signed-in user stars, comments, or reports through trusted OS
   chrome rather than through game code.

### Minimum mapping

Before durable Arcade seeding/deployment, its portable profile freezes three
distinct identities over the generic 1.5 seams:

| Identity | Meaning |
|---|---|
| **GameProject / GameWork** | publisher-qualified stable lineage/identity; several publishers or provenance lines may represent “the same” human game without one objectively global canonical GameId |
| **GameRelease** | one immutable publisher-qualified release record; its body commits the exact ArtifactManifest identity and never changes |
| **ArtifactManifest / Package** | chain-independent identity of canonical exact-artifact closure bytes; may be shared by several releases/publishers |

Curators choose among projects/releases. An official slug is a
curator-qualified moving PIN/view, not the GameProject ID and not an objective
global game identity.

| Fact | Role/profile |
|---|---|
| `/Arcade/`, `/Arcade/Games/`, type and rating definitions | TAGDEF |
| stable publisher-qualified GameProject/Work | DATA |
| exact immutable GameRelease whose typed body commits an ArtifactManifest ID | RecordVersionId under the GameProject DataId |
| canonical exact-artifact package identity and member closure | `ArtifactManifest/1` application/SDK profile, not a graph kind |
| curator-qualified stable game slug/channel → GameProject | subjectless PIN whose definition is the slug TagDef and target kind is DATA |
| GameProject → curator-selected current GameRelease | subject-qualified PIN using an explicit release-role TagDef, DATA subject, and RECORD target |
| submitted/approved/featured/genre/runtime membership under one curator | TAG |
| predecessor, exact mirror/locator, upstream provenance parent, license evidence | reserved typed roles over DATA/TAG and manifest profile |
| immutable official collection charter | LIST only if this promise is required |

The minimum `ArtifactManifest/1` seam for the first product contains a version,
entrypoint, sorted canonical relative member path(s), each member's canonical
`f1220` digest, size, media type, and runner/capability ceiling. A single-file
game is the one-member profile. Multi-file execution may fail closed until its
complete closure path is implemented; it must not silently validate only the
entry HTML.

### Critical acceptance tests

- `/Arcade/` has the same subject ID on every implementation of the frozen
  `EFS-ID/1` profile and is not owned by its first submitter.
- `/Arcade/` is the candidate canonical EFS subject spelling. Legacy `/games`
  and web `/arcade` are explicit mappings, not silent case/path aliases.
- The official collection is always qualified by curator principal, realm,
  policy, and basis; `/Arcade/` alone does not mean “official now.”
- There is no unqualified canonical GameId. Publisher/provenance-qualified
  projects coexist, and curator selection remains a view.
- A game URL or embedded manifest cannot provide the policy that authorizes its
  own **Play**, install, write, or wallet access.
- Guest metadata rendering and verified play do not require authentication,
  KEL, smart accounts, or full OS startup.
- The exact release link never changes bytes. Updating a stable game channel
  creates a new immutable release and re-PINs the channel.
- Once an official curator slug names a GameProject, it may move among Releases
  of that Project but never silently to another Project; retirement emits an
  explicit tombstone/redirect.
- The GameRelease typed body commits the exact `ArtifactManifest/1` identity.
  A v1 DATA UID renamed through a sidecar is not an exact release because its
  frozen DATA payload is empty and its content binding was separately movable.
- A multi-file build is playable only after the complete claimed closure is
  verified; one HTML digest does not validate referenced scripts/assets.
- Native comments are optional for the first product. If added, each comment
  is an immutable RecordVersion under a stable author-owned DataId, replies
  cite the exact parent RecordVersion, admission order is
  realm-local, and game code cannot sign it.
- Curator-set enumeration is bounded by `(definition, principal, targetKind)`
  and always returns cursor, basis, and completeness. Stars/favorites, only if
  shipped, additionally require reverse all-principal edges by
  `(definition,target)` or an explicitly partial off-chain view.
- The 20-lens cap counts principals, not games; an 18-game catalog does not
  itself approach it. Silent truncation remains a general no-go.
- A MIRROR claim binds a locator to an exact result digest/manifest. The intake
  workflow verifies before submission and the strict reader verifies again
  before execution; the on-chain resolver cannot fetch the URL. An upstream
  source that differs is a provenance parent, not a mirror. Multiple gateways
  for one CID are locator plurality, not proof of independent custody.

### Current Arcade timing boundary

The unmerged Arcade plan assumes a v1/no-contract-change September demo. That
can safely proceed for guest browse/play UI behind an adapter. It conflicts
with durable seeding if the resulting objects are expected to keep permanent
links.

Until `EFS-ID/1` and the sibling schema proof pass, any new v1 seed must be
explicitly disposable/reseedable. “We will migrate it later” is not a safe
claim for v1 DATA.

The migration ledger maps legacy v1 UIDs explicitly to new GameProject and
GameRelease records; it never presents the new object as a rename. The Arcade
addendum reports six locally modified games—tetris, doodle-jump, frogger,
bomberman, pong, and infernal-throne—whose bytes differ from upstream URLs
currently labeled as mirrors. Those URLs must be reclassified as provenance
parents unless exact-byte verification proves otherwise.

The SDK surface is a stamped sibling profile such as `createEfs15Client` or
`profile: efs/1.5`, not aliases inside v1. Reuse v1's dry-run, deterministic
plan, idempotence, and receipt ergonomics; reject its multi-transaction
UID-discovery graph and raw-keccak content-hash writer.

Browser sandbox/CSP mechanics remain Arcade application work. The only 1.5
substrate rule is that game code receives no signing, identity, or EFS-write
authority.

In particular, `sandbox=allow-scripts` does not itself block fetch,
WebSocket/subresources, self-navigation, or every WebRTC path. The September
runner is a curated compatibility surface, not proven arbitrary-hostile
no-egress containment. If the app injects a deterministic CSP transform, it
records the original digest, runner version, and derived execution digest;
that still creates no new 1.5 kernel requirement.

The current 15-game corpus is evidence, not a durable launch foundation. The
Arcade audit rates Tiny Yurts, Infernal Sigil/Throne, Sokoban, Snake, and
possibly Helicopter as repair candidates; Pong is not offline-playable, six
“mirrors” are byte-mismatched, and rights/notices plus third-party asset
closure are incomplete. Branded tutorial clones also carry avoidable trademark
risk. These are Arcade curation/intake issues, not reasons to expand 1.5.

Any proposed August 14 product slice is an Arcade evidence gate, not a 1.5
deploy milestone: take one real candidate through rights/provenance, exact
manifest, two verified result locators, tamper/fallback, sandbox, and real
comments behind a provisional stamped adapter, while keeping durable seed
blocked on the ID/fork gates.

## Trace B — Nanda agent/service catalog

### User verbs

1. A provider publishes a stable service or skill identity.
2. The provider publishes immutable releases and evidence/manifests.
3. Catalogs discover providers and releases by shared type/schema.
4. A viewer or agent chooses a trusted catalog/lens, inspects validation and
   provenance, and fetches exact bytes.
5. The service moves endpoints or publishes a successor without rewriting old
   evidence.

### Minimum mapping

| Fact | Role |
|---|---|
| service/skill/evidence/release graph predicates | TAGDEF; application semantics use universal TypeId/ShapeId |
| stable provider/service lineage | DATA |
| exact release or capability/evidence body | RecordVersionId with typed references |
| stable provider channel or service name → current release/endpoint record | PIN |
| catalog membership, curator-defined classification, evidence relation, compatibility claim | TAG; application type is the record's TypeId/derived type index, not a duplicate TAG |
| official append-only release ledger | optional LIST or profile if TAG history is insufficient |

### Acceptance boundary

- Catalog discovery is not execution authority. A listed SkillMD or endpoint
  remains untrusted until the consumer's policy admits it.
- Provider authority, Scribe attester, storage witness, catalog endorsement,
  and submitter/payer are separate roles.
- Shared type/schema identity and records-by-type queries are mandatory before
  durable app-specific records; a topic label alone is not shape validation.
- A release references one verifiable closure. A stable service channel may
  move; a pinned release link may not.
- 1.5 may provide public release/evidence infrastructure. Private agent memory,
  secrets, scoped execution, and portable agent authority remain outside it.

## Trace C — Git-backed Markdown and wiki editing

### User verbs

1. A reader opens a stable page path.
2. The system resolves it to an exact Git commit/blob and renders Markdown.
3. An editor proposes a new immutable revision with parent/predecessor evidence.
4. A trusted publisher accepts it and moves the stable page/ref binding.
5. Readers inspect history, diff, author/admission evidence, and exact old links.

### Minimum mapping

Git remains canonical for Git objects, object IDs, trees, commits, pack
transport, and ordinary clone/fetch interoperability. EFS supplies semantic
repository identity, publisher/lens authority, placement, availability,
schema/type annotations, and exact-versus-moving link behavior.

| Fact | Role |
|---|---|
| repository/page/schema namespace | TAGDEF and/or owned repository DATA descriptor |
| exact repository release, page revision sidecar, closure/checkpoint | RecordVersionId under a stable DATA lineage; Git OIDs remain native |
| stable page path or single-publisher ref → exact commit/revision | PIN |
| predecessor, proposal, accepted, hidden, moved-to, type, placement, mirror | TAG/reserved typed role |

### Acceptance boundary

- Editing a Markdown file creates an immutable new revision and re-PINs the
  stable path/head. Old links and citations remain exact.
- Git object IDs are not replaced by EFS IDs, and EFS IDs are not derived from
  transport URLs.
- A citation to a page revision does not silently follow the latest page.
- 1.5 may honestly support a single-publisher archive/wiki with visible
  history and proposals.
- 1.5 must **not** claim a neutral GitHub-class forge until multi-maintainer
  replay-safe atomic ref CAS, branch policy, historical authority, stock
  authenticated push, abuse controls, and recovery are proven.

## Trace D — ordinary public files

### User verbs

1. Publish immutable bytes/manifest.
2. Give the file a stable human name or folder placement.
3. Replace/move the visible version without destroying the old version.
4. Add mirrors and verify exact bytes.
5. Read anonymously from a direct link.

### Minimum mapping and boundary

- stable file identity is DATA and exact revision metadata is RecordVersionId;
- a stable path/name is a PIN to one exact revision;
- folder/type/placement/mirror/predecessor facts are TAGs or reserved roles;
- deletion is a new visible-state claim, not erasure of old immutable evidence;
- the direct link states whether it is exact or moving; and
- 1.5 is appropriate for public, low-stakes artifacts. A valuable personal
  drive needs a recoverable principal from the first write plus future sharing,
  privacy, quota, deletion, and recovery work.

## Trace E — shared schemas and validators

### Required loop

1. A developer publishes or reuses a universally identified type/shape.
2. The type has canonical shape bytes and a deterministic `TypeId`/`ShapeId`.
3. A realm binds that portable type to an origin-scoped physical EAS schema
   reference, identified read-only validator, and stateful admission policy.
4. A record names the universal type and is admitted under an explicit realm
   binding; the receipt records the actual EAS schema/resolver path.
5. Apps query records by known universal type with bounded, honest results.
6. Users/indexers browse the canonical registry's paginated on-chain type
   catalog; registration is not endorsement. Ranked/full-text and cross-realm
   search can be off-chain accelerators without becoming validity authority.
7. Import/export explains losses: portable shape validity is not the same as
   EAS admission, curator endorsement, or current effectiveness.

The narrow first implementation profile is:

- immutable `TypeDescriptorV1` with publisher-qualified numeric semantic
  version, ordered canonical application fields, `ShapeId`, and codec profile.
  The exact descriptor bytes are the on-chain execution input; first
  publication carries a chain-independent ECDSA-only TypeAuthorization so any
  registrar may relay it, exact replay is idempotent, and conflicting bytes
  reject;
- byte-exact all-static `EAS-ABI/1`: seven `bytes32` prefix words plus at most
  16 top-level `bool`, `address`, `bytes1..bytes32`, or valid-width integer
  fields. The exact application-body bytes are the static suffix; dynamic
  values/arrays/tuples reject until a later codec independently freezes their
  extraction. ShapeId covers ordered names/types; TypeId separately commits
  reference declarations so FieldRoleId derivation is acyclic;
- native typed EAS schemas whose canonical EFS prefix carries the precomputed
  claimed DataId, RecordVersionId, RecordBodyCommitment, `TypeId`, `ShapeId`,
  explicit BindingVersionId, and owned-DATA salt, followed by cohesive typed
  application fields. The resolver derives PrincipalId from attester and
  recomputes the lineage and exact-body IDs;
- a standard typed-admission/binding interface on one immutable shared
  router/registry-index. Every physical schema uses that router. Versioned
  bounded validator/policy modules may decide their explicit binding but cannot
  mutate cross-schema identity, reference, slot, or ordinal state. Validators
  are static; a stateful policy gets only a fixed-gas narrow non-reentrant call
  but may have side effects under its own/downstream authority, so the binding
  must trust/audit that app behavior. An ECDSA-only chain-independent
  TypeAuthorization makes the immutable publisher-authored descriptor
  relayable; binding registration is permissionless, immutable, and idempotent. It
  recomputes descriptor/type/shape/binding/schema identities and verifies the
  pinned SchemaRegistry/EAS/router/module configuration; and
- immutable binding-version history over type, shape, read-only validator,
  stateful admission policy, code identity, origin-scoped physical schema,
  revocability, and realm configuration. There is no activation/deactivation
  owner or canonical latest binding; permanent means registered, while module
  drift/state may make later writes reject. First-pair
  `BindingRecordEvidence` contains the binding, record, evaluation block/pair
  ordinal, and module result; per-receipt `ReceiptEvidence` contains the
  origin-scoped receipt, receipt block/ordinal, and pointer to that pair.
  Transaction/log position is SDK receipt enrichment because the resolver
  cannot observe its eventual log index. Rejected resolver calls revert and
  leave no durable EAS receipt.

EAS-ABI/1 requires exact length and canonical scalar padding/range. TAGDEF,
stable DataId, and exact RecordVersion
admissions are non-revocable; PIN/TAG are revocable. Both native EAS expiry and
semantic expiry are zero in the MVP. Resolver value and callback `msg.value`
are zero, the payable EAS callback ABI pins `isPayable() == false`, and no
module receives ETH. Current reads fold native revocation and
expiry explicitly rather than trusting EAS `isAttestationValid` as a liveness
answer. An app may publish a separate revocable retraction relationship, but it
changes only reader/app effectiveness: immutable RecordVersion `realmActive`,
records-by-type, and backlinks remain monotone. Ordinary EAS tools will not
mistake that relationship for native receipt revocation.

The router commits and checks the directly called module's outer runtime code
on every admission, but a static module can still read mutable proxy/oracle
dependencies. Validator results are therefore basis-qualified; timeless
portable validation requires audited self-contained code or a future bounded
VM/approved-code profile.

Do not represent every application field as a graph edge. A cohesive game
manifest, AgentCard, proposal, or package manifest should remain one typed
record; TAG/PIN roles connect it to curation, relationships, placement, and
moving state.

The descriptor may declare at most eight top-level `bytes32` typed EFS-object
reference fields. Each has a stable unique FieldRoleId and EfsObjectKind.
Admission verifies the target and indexes the first RecordVersion admission,
never duplicate receipts, in both paginated views:
`(TypeId, FieldRoleId, targetKind, targetId) -> RecordVersionId` and
`(targetKind, targetId) -> (TypeId, FieldRoleId, RecordVersionId)`. All declared
references are indexed, enabling a complete target-first walk at a named basis.
This is neither a graph edge nor an endorsement/current-state claim. It earns
its place only if the fork proof bounds gas/storage and a structurally different
second app registers through the unchanged core router.

### Identity layers that must not collapse

| Identity | Meaning |
|---|---|
| **TypeId** | publisher-qualified universal semantic application type such as GameRelease or SkillRelease; reusable by anyone and not automatically graph DefinitionId |
| **ShapeId** | canonical deterministic application-body field/type encoding under a named codec |
| **EasDeploymentRef** | `(chainId, easAddress, schemaRegistryAddress)` |
| **PhysicalEasSchemaRef** | `(EasDeploymentRef, SchemaUID)`; raw UID commits to field string, resolver, and revocability but not origin |
| **ValidatorId** | directly called read-only structural/semantic module plus config; result is admission-basis-specific unless a stronger purity profile applies |
| **AdmissionPolicyId** | stateful realm-local authorization/cardinality policy |
| **BindingVersionId** | reusable immutable type/shape/validator/policy/code/physical-schema configuration |
| **DataId** | stable publisher/author-qualified object or lineage |
| **RecordBodyCommitment** | TypeId/ShapeId/canonical-body commitment |
| **RecordVersionId** | exact immutable typed record committing DataId and RecordBodyCommitment |
| **EasReceiptRef** | `(chainId, easAddress, receiptUid)` |
| **BindingRecordEvidence** | first `(BindingVersionId, RecordVersionId)` evaluation basis and module result |
| **ReceiptEvidence** | origin-scoped receipt provenance plus pointer to BindingRecordEvidence |

`TypeId` and `ShapeId` remain distinct: two application types can share the
same fields while meaning different things. Neither is an EAS schema UID.
Raw SchemaUID and receipt UID values exclude chain/deployment, so usable
physical references always include origin.

### Validation grades

Readers and SDKs expose separate facets:

1. **decodable/well-formed** — bytes match the carrier's expected encoding;
2. **shape-valid** — canonical fields/types satisfy the named portable shape;
3. **validator-valid** — the named read-only validator accepted semantic
   constraints beyond the field shape at the recorded admission basis;
4. **realm-admitted** — the named stateful policy accepted this receipt;
5. **realm-active** — for immutable typed records, first admission is present;
   this remains true and does not mean current, endorsed, or unretracted;
6. **endorsed** — a named curator/lens vouches for it; and
7. **effective(policy,lens,basis)** — a reader-qualified result.

The first structural checks can form a validation ladder. Endorsement and
reader effectiveness are independent facets, not canonical venue stages.

A non-EFS EAS attestation remains an origin-scoped foreign reference over an
interop profile, chain, EAS deployment, and original receipt UID. A versioned
mapper claim may associate its physical schema with an EFS TypeId; deterministic
revalidation can produce a new local admission, but the mapper/relayer is not
the original EAS attester. Outbound projection into another native EAS schema
also creates a new receipt and usually a different attester/resolver path while
preserving the source RecordVersionId and original receipt link.


`recordsByType` has separate views for append-only receipt history,
deduplicated semantic RecordVersionIds, and realm-active status. Reader
`effective(policy,lens,basis)` is a separate query. Raw array length
is never presented as a live count. Compatibility between type versions is a
separately authored claim with issuer and basis, not part of TypeId merely
because one publisher asserted it.

## Product-wide no-go conditions

Stop or resize 1.5 if any implementation requires:

- both EAS UIDs and EFS IDs as canonical semantic references;
- a second transaction solely to learn a UID needed for the first action;
- native v2 to rename or reinterpret frozen 1.5 IDs;
- a private operator database to reconstruct claimed core current state;
- URL/app-supplied policy to authorize untrusted code;
- lossless old-DATA migration without re-authoring;
- a throwaway EOA as publisher for valuable long-lived collections; or
- importing KEL, the full portable envelope, consumer-drive privacy/recovery,
  native app comments/moderation, and a full Git forge into the Arcade MVP.
