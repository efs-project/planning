# Historical EFS 1.5 requirements and boundaries

**Status:** superseded — historical EAS-bridge design evidence; use [[../efsv2/system-constitution]]
**Target repos:** planning, contracts, sdk, client
**Depends on:** —
**Supersedes:** —
**Reviewers:** @codex-gpt-5 (2026-08-07, identity, adversarial-risk, and source-precedence lanes)
**Last touched:** 2026-08-12

#status/superseded #kind/design #repo/planning #repo/contracts #repo/sdk #repo/client #topic/efs15 #topic/requirements #topic/lenses

> **Superseded 2026-08-08:** James removed every v1 compatibility, migration,
> coexistence, legacy-read, EAS-carrier, and sibling-schema requirement. This
> file is preserved for requirements, feasibility, and failure-analysis
> evidence. It is not an implementation or freeze target.

## Problem

Nanda and Arcade need a usable EFS before the native v2 design is ready. Using
v1 unchanged would let real data accumulate behind unpredictable, chain-local
EAS UIDs and would preserve several assumptions that are expensive to unwind.
Waiting for every v2 portability, authority, and filesystem question would
make the product evidence depend on an open-ended redesign.

EFS 1.5 is the deliberate middle: keep the working EAS-backed system, but fix
the identity and graph seams that would otherwise make links unstable, writes
multi-stage, and later migration needlessly destructive.

## Status ledger

The labels in this table are normative for reading this draft. They prevent a
useful simplification from silently becoming permanent architecture.

| Class | Current statement |
|---|---|
| **Adopted owner direction** | v1 plus the existing SDK is the supported bridge for current Nanda and Arcade work. |
| **Adopted owner direction** | EFS 1.5 backports universal EFS object IDs and a limited/tag-oriented graph vocabulary from v2 into an EAS-backed design. |
| **Required consequence** | EAS attestation UIDs are carrier receipts only. They do not appear in stable links, semantic references, object/slot identity, or canonical semantic-state keys. Typed receipt/audit/revocation indexes necessarily retain origin-scoped EAS UIDs. |
| **V1.5 MVP assumption** | one visible identity address per author; one explicit visible identity address/principal per lens entry. This is not the claim that one human has one key forever. |
| **Candidate mechanism** | device/app/session keys may act through one stable smart-account address so EAS still records one attester. The authenticated path is not yet a shipped Arcade dependency. |
| **Candidate convention** | separate addresses may be linked bilaterally for display only. A link is not authority, key delegation, authorship, lens inheritance, or recovery. |
| **Draft-selected recommendation** | four semantic roles plus body-bound RecordVersion identity over additive sibling 1.5 EAS schemas and one shared realm registry-index, with frozen v1 receipts retained as legacy evidence. This is reviewed design direction, not owner adoption or implementation authorization. |
| **Narrow candidate exception** | `TypeAuthorizationV1` is one chain/router-independent EIP-191 ECDSA signature over immutable TypeDescriptor bytes so anyone can relay a shared type into another realm. It is EOA-only publication authorization, not a general portable record/envelope, actor system, current-state claim, or revocation proof. |
| **Open freeze work** | exact ID/type bytes and restricted name grammar; physical schema/registry-index layout; typed-reference bound; receipt/slot folds; EAS conformance and gas; descriptor bootstrap; live-record classification. Arcade's curator/package/runner choices are app-profile deployment work. |
| **Explicitly outside 1.5** | full KEL, chain-free portable application statements beyond that type-publication exception, portable current-state/revocation proofs, cross-chain global-current claims, and the complete v2 lens/authority model unless an MVP requirement forces one forward. |

## Requirements

### R1 — Universal IDs name EFS things

Every EFS object and logical slot intended for stable semantic linking has a
deterministic `bytes32` EFS ID that can be computed before submission and
reused across chains, deployments, RPCs, and offline packages that implement
the same frozen 1.5 ID profile. A comment,
review, or other item that needs a durable hyperlink must be modeled as an EFS
object or explicitly exposed as a realm-qualified EAS receipt.

At minimum, the derivation must:

- exclude chain ID, EAS deployment, schema UID, resolver address, block data,
  timestamp, transaction hash, and EAS attestation UID;
- use versioned domain separators, unambiguous canonical encoding, and frozen
  kind/role constants;
- define a contract-verifiable restricted-ASCII canonical ID-segment grammar,
  case, separators, root, URL-adapter, and trailing-slash behavior. Unicode
  names remain display metadata rather than client-normalized ID preimages;
- publish matching Solidity and TypeScript golden vectors, collision tests,
  and malformed-input vectors before durable writes;
- keep paths such as `/Arcade/` as shared Schelling-point subjects rather than
  claims owned by the first person to instantiate them; and
- make concurrent byte-identical instantiation of a shared subject idempotent,
  non-owning, and safe inside a dependent batch. More than one EAS receipt may
  be admitted, but duplicates remain inert for canonical semantic state. A
  same-ID/different-preimage case must fail deterministically.

“Universal ID” means the subject keeps one name. It does **not** mean every
chain, lens, or reader agrees on its current contents. Current/effective reads
remain qualified by realm, deployment, lens, and basis.

The deep dive must keep four namespaces mechanically distinct:

| Identifier | Meaning | Portability |
|---|---|---|
| **Object/SubjectId** | a topic, data object, list, or other stable thing | universal within the frozen 1.5 derivation profile |
| **RecordVersionId** | one exact typed body under a stable DataId lineage | universal only once EFS-ID/1 and the referenced Type/Shape codec freeze together |
| **SlotId** | the stable semantic coordinate over which claims compete, supersede, or coexist | universal within the frozen 1.5 derivation profile |
| **SemanticEdgeId** | chain-free assertion digest used to group duplicate EAS receipts and distinguish targets/weights | portable dedup key, but not a future authority/sequence-bound native-v2 ClaimId |
| **EasReceiptUid / EasReceiptRef** | raw EAS hash plus required origin tuple `(chain, EAS deployment, UID)` for one admitted statement | raw bytes exclude chain/deployment; semantic effect is realm-local |

One semantic edge may have several EAS receipts. EFS indexes deduplicate by the
edge/slot rules while retaining a realm-qualified receipt multimap.
Revoking one receipt affects that receipt in that realm; it does not silently
revoke copies elsewhere. The exact duplicate, supersession, and partial-
revocation fold is a freeze item, not an SDK guess.

Do not call the 1.5 edge digest `ClaimId`. Native v2 claims still need sequence,
authority, and portable revocation semantics that EAS-backed 1.5 intentionally
lacks. A future claim may commit to the 1.5 `SemanticEdgeId` while receiving a
distinct native identity.

### R2 — EAS UIDs are receipts, never semantic references

EAS continues to identify a particular chain-local statement and supplies
attester authentication/provenance, chain-local admission/block time,
revocation, and a resolver hook. EFS separately identifies the thing, logical
semantic edge, or slot that statement concerns. EAS does not by itself authenticate an
internal smart-account actor or establish human identity.

Therefore:

- public semantic routes, SDK handles, graph edges, cache keys, canonical
  semantic-state keys, and new EFS resolver events key on EFS IDs;
- resolvers derive or validate every claimed EFS ID;
- SDK receipts may return both `efsId` and one or more `easUid` values, with
  distinct types and names;
- native EAS events, receipt/provenance views, carrier receipt maps, and EAS
  revocation calls retain typed `EasReceiptUid` values alongside the relevant
  EFS ID;
- any retained EAS `refUID` is explorer convenience only and cannot be index
  authority; and
- a mined EAS UID can never become a semantic parent, target, definition, slot,
  or the input needed solely to construct a dependent object in the next
  block.

This separation is what makes dependent writes precomputable and allows a
high-level action to be atomic and idempotent where EAS batching permits it.

### R3 — Preserve a full-width principal seam without building KEL

New ID and SDK semantics use a full-width `bytes32 PrincipalId`. EFS 1.5
accepts only the address-shaped profile:

```text
PrincipalId = bytes32(uint256(uint160(authoringAddress)))
```

Owned-object and slot formulas consume that full word. A v1.5 resolver may
derive it from the EAS attester, but no new semantic boundary should truncate
an arbitrary future principal to `address`.

APIs and receipts reserve three separately typed fields even when the v1.5
bare-EOA path makes some values coincide:

- **principal/author** — durable identity shown by EFS;
- **actor/signer** — optional key evidence that authorized an action; and
- **submitter/payer** — account that delivered or funded it.

No actor is asserted unless an account adapter supplies verifiable evidence;
`actor = principal` is not a filler value. Except for relayable immutable
TypeDescriptor publication under `TypeAuthorizationV1`, EFS 1.5 does not
implement EFS-native independent-actor authority or portable relaying. The full-width
seam avoids an unnecessary address-truncation migration. It does **not** make
KEL safely additive, retroactively prove actor authority, or prevent the
legitimate-owner-versus-thief race at first future KEL inception. The eventual
KEL compatibility matrix must prove that it preserves the same principal and
requires no object rekey before an in-place path is promised.

Universal owned IDs are stable across chains only for the exact same
`PrincipalId`. The same-looking smart-account address may be undeployed or
controlled by different code, owners, or session policy elsewhere. EFS 1.5
does not synchronize account deployment or controller state; authoring remains
single-realm unless deterministic deployment and equivalent control are
independently verified.

### R4 — Use a bounded graph vocabulary, not “everything is one blob”

The direction is tag-oriented, not literally one undifferentiated record.
At least these semantic distinctions must survive:

- a permanent shared definition/topic identity;
- a permanent owned `DataId` for a stable object/lineage plus a body-bound
  `RecordVersionId` for each exact typed record/revision beneath it. Changing
  exact typed bytes changes RecordVersionId without renaming the lineage;
- a revocable cardinality-one binding (`PIN`-like); and
- a revocable cardinality-many membership (`TAG`-like).

`LIST` or another constrained collection object remains only if an Arcade,
Git, or schema use case needs immutable list policy that ordinary tags cannot
enforce. Properties, mirrors, redirects, and entries should be tested as
reserved definition roles over the small core before receiving distinct
record types.

The exact five-kind v2 proposal is **not** adopted here. EFS 1.5 must select
the smallest set that satisfies concrete product traces while preserving
cardinality, ownership, revocation, bounded reads, and resolver checks.

Target/subject validation is kind-specific: TAGDEF, DATA, and RECORD require
membership in the shared realm registry; PRINCIPAL requires a nonzero
address-shaped word in the 1.5 carrier; reserved TYPE rejects until its profile
freezes. A raw EAS UID is not recognizable from bytes alone—it fails only
because it is not registered under the declared semantic kind. PIN definitions
are always registered TagDefIds; a stable DataId may be an explicit PIN subject,
but never impersonates a definition.

### R5 — Keep the good developer properties of EAS

Dropping EAS UIDs as object identity must not accidentally drop what makes EAS
useful. EFS 1.5 must demonstrate an end-to-end loop in which:

- developers publish, reuse, and cite shared schemas/types;
- users and indexers enumerate and search those types;
- contracts and apps query records by known type with bounded reads;
- deterministic shape checks and stateful resolver/application checks are
  distinguishable;
- invalid data is not presented as admitted merely because bytes exist; and
- real EAS tools/data can be projected or imported with explicit loss labels.

The deep dive must decide whether application schema identity also receives a
universal EFS ID in 1.5 or remains an explicitly chain-local EAS facility. It
must not let “TAGDEF exists” stand in for a complete shared-schema workflow.

### R6 — Keep identity simple at the EFS layer

The MVP rule is:

> One lens entry is one visible authoring address/principal, not necessarily
> one human and not necessarily one private key.

A raw EOA satisfies the rule with the least machinery. If a user later needs
multiple device or app keys, the preferred bridge is for those keys to execute
through one stable smart-account address. EAS then records the account as the
attester, so attribution, first-attester-wins resolution, revocation, and
cardinality still operate over one visible address.

That invariant holds only when the device/session key causes `EAS.attest` to
execute through the account context. A child key that attests directly or uses
a delegation path that records the child as attester violates it. Before this
mode ships, the account authorization must be reviewed and every write path
must assert post-submit that `attester == expectedPrincipalAddress`.

This reuses the useful core of [[efs-account-system]], but does not adopt that
historical design wholesale. In particular, the authenticated in-account SDK
routine is not currently a reviewed, shipped Arcade prerequisite. Anonymous
play and read-only browsing must not wait for any account path.

`JamesCarnley.eth` is a display name resolved for the underlying address; ENS
is not the protocol identity. Interfaces should make the address inspectable
and avoid treating a mutable name resolution as historical authorship.

### R7 — Linked addresses, if ever shipped, are display-only

A one-sided `parentKey` property is unsafe: anyone could claim James as a
parent. A parent-authored list proves only that the parent made that claim; it
does not prove the child agreed or was controlled at the time of an old write.

The smallest tolerable convention is bilateral and one-hop:

1. the primary address asserts a cardinality-many link to the other address;
2. the other address asserts a cardinality-one acceptance back to the primary;
3. a client shows the link only when both claims are authenticated as authored
   by the exact endpoint addresses and are live under the same named realm and
   read basis; and
4. the UI says “currently linked to JamesCarnley.eth,” not “authored by
   JamesCarnley.eth.”

Even then the relationship is presentation metadata only. It grants no write,
revoke, namespace, curation, application, or lens authority. It does not merge
latest-wins state. Lenses must not auto-expand linked addresses for gates or
resolution. Current linkage must never silently relabel historical child
content as parent-authored.

Removing a link is prospective un-endorsement, not proof that a key was valid
before one block and stolen after it. Solving that requires temporal grants,
revocation ordering, and historical authority evidence—the KEL problem EFS
1.5 is intentionally deferring.

### R8 — Untrusted Arcade code never receives identity authority

Anonymous browsing and game execution are read-only by default. Comments,
curation, and other writes are initiated through trusted OS chrome. A game
does not receive a user's root EOA, account owner, unrestricted session key,
or the ability to turn a linked-address claim into authority.

“Anonymous Arcade” means a wallet-free read/play path. Durable 1.5 authorship,
comments, curation, and indexed graph metadata are public and correlated to the
visible principal unless a future privacy system explicitly says otherwise; it
does not provide anonymous writing or private activity.

If promptless writes later use an app/session key, the account layer must
scope it and make it act through the stable visible account address. The EFS
graph is not a substitute for account authorization. Untrusted code also gets
no ambient wallet, identity, unrestricted network, local filesystem, or
cross-app data capability merely because it can render EFS content.

### R9 — Deploy a sibling 1.5 EAS profile; do not reinterpret v1

Universal IDs cannot be an SDK alias. Frozen v1 DATA has no ID preimage, and
v1 anchors, edges, mirrors, properties, lists, and indexes use EAS receipt or
schema UIDs as structure. EAS also requires a nonzero native `refUID` to name
an already admitted EAS receipt, so a universal EFS ID cannot replace it.

The recommended 1.5 contract shape is therefore additive:

- register sibling 1.5 schemas whose payloads contain universal semantic IDs
  and references;
- set native EAS `refUID = 0` for new semantic graph relationships;
- point every 1.5 physical schema at one immutable shared router/registry-index
  that recomputes claimed IDs, validates legal role, target, shape,
  revocability, cardinality, and references, and rejects mismatches so DataId,
  RecordVersionId, slot, and ordinal rules cannot split by physical schema;
- use semantic indexes and views keyed by EFS IDs while retaining a typed
  receipt history and receipt-to-DataId/RecordVersionId/SemanticEdgeId map; and
- leave v1 schemas and receipts readable through an explicitly legacy adapter.

Using zero `recipient` intentionally gives up native EAS recipient-index
discovery; EFS semantic events and indexes provide the supported discovery
surface. Any later nonzero `refUID` must name an existing receipt on that exact
EAS deployment and remains non-authoritative for current liveness.

The SDK exposes a stamped sibling profile (`createEfs15Client` or equivalent
`efs/1.5` profile), not universal-ID aliases inside the v1 client. It may reuse
v1 transport, dry-run/plan, idempotence, and receipt ergonomics while rejecting
the multi-transaction UID-discovery graph and noncanonical hash writer.

Upgrading the existing resolver proxies in place is not the default because it
shares storage/blast radius and risks changing the meaning of frozen v1
receipts. A deployment handoff may overturn that recommendation only with a
complete storage, state, and compatibility proof.

### R10 — Separate receipt aggregation from slot resolution

The state machine has two distinct folds:

1. **Receipt aggregation:** retries, relays, or races may give one object or
   `SemanticEdgeId` several origin-scoped EAS receipts. They group for
   provenance/deduplication. Immutable TAGDEF/DataId/RecordVersion receipts are
   non-revocable; only PIN/TAG relationship receipts retain independent native
   revocation.
2. **Slot resolution:** distinct semantic edges compete at one `SlotId`. A
   durable, monotonically increasing realm-local `admissionOrdinal` stored by
   the 1.5 state layer—not an ID or author timestamp—selects the head.

Each slot also stores a monotonically increasing `slotRevision`, and every
PIN/TAG write carries `expectedSlotRevision` outside `SemanticEdgeId`. A
matching revision creates a new activation with one canonical receipt. A
byte-identical retry may attach an inert duplicate only when the current
activation has the same edge and was created from that expected revision; any
other stale retry fails. Revoking the canonical current receipt clears and
advances the slot, while duplicate/superseded receipt revocation affects
provenance only. Reasserting the same edge after clear creates a new activation
ordinal. This prevents duplicates from keeping a revoked edge alive and stops
a delayed retry from overwriting a newer head.

Each receipt maps in O(1) to its activation and canonical/inert status. Only
the canonical receipt is a current activation's liveness witness: revoking it
clears even if inert duplicates remain, while revoking a duplicate never
changes the head. Lineage instantiations group by DataId, exact typed records
group by RecordVersionId, and relationships group by SemanticEdgeId; different
versions under one DataId are never deduplicated together. TAGDEF, DataId, and
RecordVersion admissions are non-revocable in the 1.5 profile. PIN and TAG are
revocable. Withdrawal/deprecation of immutable material is a new relationship,
not physical erasure.

The state machine must specify all of these before implementation:

- byte-identical shared-subject retries converge semantically even if multiple
  receipts exist; same-ID/different-preimage fails;
- owned-lineage same-salt behavior plus exact RecordVersion duplicate and
  different-body behavior, including independent realms;
- PIN replacement and TAG update behavior;
- revocation of stale versus current receipts;
- whether clearing current state can ever resurrect older state (the leading
  1.5 rule is no resurrection);
- receipt history and cross-realm copies;
- canonical activation versus inert duplicate receipts, slot revision/CAS, and
  reassertion epochs;
- whether target, weight, and reserved expiry are inputs to
  `SemanticEdgeId`; and
- a complete on-chain storage walk over full bodies, receipt aggregation,
  admission ordinals, and slot heads at one named basis. Events may accelerate
  it but cannot be the only reconstruction source.

IDs and author-supplied timestamps are not clocks. Author time/order is
testimony only. EAS block/time/log position remains realm-local admission
evidence, but slot resolution uses the stored semantic ordinal. Nothing in
1.5 creates a global order across carriers or chains.

For the MVP, 1.5 requires both native EAS `expirationTime = 0` and semantic
`expiresAt = 0`. It also requires the native per-request revocable flag to
match the fixed schema/role table above. Adding expiry later is possible only
with explicit stale-not-dead behavior in every resolver, index, read, fold,
and UI; expiry must never silently fall through to older state. Current-state
code folds EAS revocation and expiry fields explicitly and must not treat EAS
`isAttestationValid(uid)` as a liveness answer merely because the UID exists.

### R11 — Make revisions immutable and links explicit

EFS 1.5 keeps these identities separate:

- a shared stable `SubjectId`, where applicable;
- a permanent owned `DataId` for a publisher/author-qualified stable
  lineage/object;
- an exact application `RecordVersionId` that commits its DataId, TypeId,
  ShapeId, and canonical body commitment;
- a moving PIN slot from a stable path/channel to an exact record, or a
  subject-qualified PIN whose definition is an explicit TagDef role and whose
  subject is the lineage DataId;
- an integrity commitment over exact bytes or a closure manifest; and
- one or more transport/mirror locations.

DataId by itself does not assert one globally canonical type, descriptor, or
current version. Multiple exact RecordVersions may exist under the lineage;
the application TypeDescriptor/admission policy and explicit PINs define any
genesis or selected-current rule. This keeps stable identity portable without
manufacturing global current state.

Changing file, game, skill, or record bytes creates a new immutable
RecordVersionId.
A stable name/channel/path may move by superseding a PIN. Exact links and
citations never auto-follow that movement. Replies and reviews cite the exact
immutable object or claim they address.

Arcade packages, Nanda skills, Git bundles, and multi-file documents should
share one generic verifiable-closure profile above the graph. Closure is not a
new kernel kind. A one-file digest cannot claim to verify transitive assets it
does not enumerate.

The following is the **Arcade portable application profile**, not an EFS 1.5
kernel requirement. It may freeze and deploy after the generic ID/type/reference
seams, without adding Arcade-specific kinds or curator policy to the core.

For Arcade, freeze three identities: a publisher-qualified stable
GameProject/Work, an immutable GameRelease whose typed body commits an exact
ArtifactManifest identity, and a chain-independent `ArtifactManifest/1`
package identity. There is no objectively global canonical GameId; several
publisher/provenance-qualified projects may coexist and curators choose. An
official slug is a curator-qualified moving PIN/view.

The candidate canonical EFS subject spelling is `/Arcade/`. Legacy `/games`
and the web route `/arcade` require explicit mappings because case/path bytes
affect identity. Once an official curator slug names a GameProject, its selected
Release may move within that Project; changing the slug to another Project
requires an explicit tombstone/redirect rather than silent reuse.

The official curator principal, slug policy, mirror/provenance record shapes,
runner capabilities, and ArtifactManifest codec are Arcade deployment choices.
Core 1.5 only supplies typed IDs/references, graph folds, admission, and bounded
queries used by that profile.

The minimal `ArtifactManifest/1` seam contains version, entrypoint, sorted
canonical relative member paths, canonical `f1220` digest, size and media type
per member, plus a runner/capability ceiling. Single-file is the one-member
profile. Multi-file execution fails closed until complete closure is supported.
MIRROR means a locator claim bound to an exact digest/manifest. The publishing
workflow verifies the bytes before submission and every strict reader verifies
them again before use; an on-chain EAS resolver cannot fetch a URL and prove
the bytes. A differing upstream source is provenance, not a mirror, and gateway
plurality is not proof of independent custody.

### R12 — Reads expose basis, completeness, and trust source

A 1.5 read result must distinguish `FOUND`,
`ABSENT_PROVEN(bound,evidence)`, and `UNKNOWN` and carry, as applicable:

- chain/EAS deployment or named realm;
- block/log basis or equivalent snapshot;
- completeness/partial/truncated status;
- cursor or continuation information;
- whether the result is for interactive display or a security gate; and
- the source of the policy/lens used for that gate.

Only a complete point getter or complete bounded state walk at the named basis
may produce `ABSENT_PROVEN`, and it names the checked bound and evidence.
Endpoint-reported emptiness, pagination/work-budget exhaustion, partial scans,
off-chain caches, and the v1 20-lens cap remain `UNKNOWN`. Limits are explicit
typed outcomes everywhere, not only in the lens parser.

The viewer or protected resource chooses the policy that spends trust. A URL,
submitted object, or untrusted app may pin exact content or suggest a view, but
cannot supply the lens that authorizes itself for execution, installation,
signing, or protected data. Discovery and submission are not endorsement.

### R13 — Preserve portable type identity and realm-local admission

The shared-schema loop in R5 requires mechanically distinct layers:

- a publisher-qualified universal semantic `TypeId` for one immutable
  application type/version, reusable by every developer;
- a canonical `ShapeId` for the application-body fields under one named codec;
- an exact origin model:
  `EasDeploymentRef = (chainId, easAddress, schemaRegistryAddress)`,
  `PhysicalEasSchemaRef = (EasDeploymentRef, schemaUid)`, and
  `EasReceiptRef = (chainId, easAddress, receiptUid)`. Raw UID bytes exclude
  origin; SchemaUID commits only to exact field bytes, resolver address, and
  revocability;
- a read-only `ValidatorId` for the directly called structural/semantic
  validation code plus config; its outcome is basis-specific unless a stronger
  purity profile proves a closed dependency set;
- a stateful realm-local `AdmissionPolicyId` for authorization, cardinality,
  and venue policy;
- one exact immutable `RecordVersionId`, distinct from its stable DataId
  lineage and committing TypeId, ShapeId, and canonical application body; and
- an origin-scoped EAS receipt reference. The raw receipt hash excludes chain
  and EAS contract, so its UID bytes alone are not a complete locator.

The deep-dive recommendation is that universal type/shape identity excludes
chain, deployment, and resolver address; a realm binding says which physical
schema, read-only validator, and admission policy handled records of that
type. `TypeId` and `ShapeId`
remain distinct: two semantic types may intentionally share one field shape,
and one semantic type version must not change shape in place.

The minimum concrete profile is now spelled as a byte-level candidate in
[[efs-id-1-candidate]] and must preserve these boundaries:

- an immutable `TypeDescriptorV1` binding semantic type/version to canonical
  shape/codec and ordered application fields. Its exact bounded bytes are the
  on-chain router execution descriptor; a verified closure may add human
  documentation but cannot replace it. TypeId is publisher-qualified and
  commits numeric semantic version, ShapeId, and raw reference declarations;
  FieldRoleId is derived only afterward. A byte-exact ECDSA-only
  `TypeAuthorizationV1` lets any registrar relay the immutable descriptor
  across chains without adding generic portable claims. Same-ID/same-bytes
  registration is an idempotent no-op and same-ID/different-bytes rejects;
- an optional list of at most eight top-level `bytes32` typed EFS-object
  references among at most 16 application fields. Each descriptor-local
  FieldRoleId derives from TypeId, field index, and a unique restricted-ASCII
  field name, and declares one EfsObjectKind. All declared references pass the
  kind-specific target check and are indexed exactly once per first
  RecordVersion admission in both the known-type view and the target-first
  paginated backlink view. This is immutable body data, not a TAG, PIN,
  endorsement, or liveness claim. The current record's freshly derived DataId
  is a legal staged DATA reference after its preimage validates; all other
  targets must already be registry-visible at callback time;
- one byte-exact all-static `EAS-ABI/1` grammar: zero to 16 top-level `bool`,
  `address`, `bytes1..bytes32`, or valid-width `uintM`/`intM` fields. Dynamic
  bytes/strings, arrays, and tuples reject. ShapeId covers codec plus ordered
  field index/name/type, while TypeId separately commits reference semantics.
  The binding commits the complete physical schema including the byte-exact
  seven-field EFS prefix and canonical comma/space/type/name spelling;
- native typed EAS application schemas with a canonical EFS prefix carrying
  claimed `DataId`, `RecordVersionId`, `RecordBodyCommitment`, `TypeId`,
  `ShapeId`, explicit `BindingVersionId`, and owned-DATA salt, followed by
  cohesive typed app fields. The resolver derives PrincipalId from the EAS
  attester; recomputes DataId from principal/salt and RecordVersionId from
  DataId/type/shape/canonical body; verifies the selected binding belongs to
  that exact origin-scoped physical schema/type/shape; and atomically registers
  the lineage preimage, exact record, admission evidence, and indexes;
- exact payload canonicality rules: the seven-word prefix plus `32 *
  applicationFieldCount` suffix has exact length; canonical application body
  bytes are that suffix; and the router validates ABI word padding/ranges.
  Native recipient, refUID, expiry, resolver value, and callback `msg.value`
  are zero; the EAS-compatible callback ABI remains payable, the resolver pins
  `isPayable() == false`, and no module receives ETH. TAGDEF carries the raw
  restricted-ASCII segment so the router can derive its hash and the shared
  registry can validate and reconstruct the path. Dynamic fields require
  a later codec version with an independently frozen extraction algorithm;
- exact `EAS-CARRIER/1` TAGDEF/DATA/PIN/TAG schema strings and payload order as
  listed in [[efs-id-1-candidate]]. TAGDEF is the sole dynamic core payload and
  has a pre-decode 160-to-192-byte bound before it must round-trip byte-exactly;
  DATA is two words, PIN nine, and TAG eight.
  Claimed IDs/slots/edges and expected slot revision are recomputed, and every
  core/typed request rejects nonzero recipient, refUID, native expiry, or value;
- a standard typed-admission/binding interface on one immutable shared router
  that validates canonical encoding and atomically owns cross-schema
  DataId/RecordVersion/reference/slot/ordinal state. Read-only validators use
  bounded static calls; stateful admission-policy modules use a bounded
  narrow non-reentrant call. A policy may mutate state reachable under its own
  or downstream authority; the router cannot confine arbitrary EVM code, so the
  binding treats those effects as trusted/audited app behavior. It receives no
  user signing/value authority and guarded core writes reject. The ABI, exact
  return magic/length, fixed 32-byte return buffer, 100,000-gas upper cap,
  256-byte config cap, revert
  behavior, and every-admission
  outer-runtime-codehash check are fixed in the candidate. That check does not
  prove purity or close proxy/oracle dependencies, so validator results remain
  basis-qualified; a future deterministic VM/approved-code profile is required
  for timeless portable validity. Permissionless
  registration recomputes TypeId, ShapeId, BindingVersionId, exact schema
  string and SchemaUID; verifies the pinned SchemaRegistry record names this
  router and required revocability; binds the router to the pinned EAS
  deployment; and commits module code/config identity; and
- a stateful policy declares the bound router, rejects direct callers, and keys
  state by BindingVersionId. The router verifies the declared router at
  registration but treats the module's wider downstream effects as an audit/
  trust boundary. Router construction itself requires the pinned EAS contract's
  `getSchemaRegistry()` to equal the pinned registry; and
- an immutable `BindingVersionId` covering type, shape, validator, policy,
  adapter/module code identity, complete physical EAS schema reference,
  fixed role revocability requirement, and realm configuration. Bindings are
  permanently registered after idempotent registration: there is no owner,
  activation, or deactivation switch. Direct committed code/config changes get
  a new ID, while codehash drift or state-dependent policy may make a registered
  binding reject later writes. The first accepted `(BindingVersionId,
  RecordVersionId)` pair stores `BindingRecordEvidence` containing the binding,
  record, evaluation `block.number`, router-assigned pair-admission ordinal, and
  module result. Every accepted physical receipt separately stores
  `ReceiptEvidence` containing its origin-scoped EAS UID, receipt block/ordinal,
  and `BindingRecordKey`. A duplicate receipt therefore points to the original
  evaluation basis instead of pretending the reused result was evaluated at
  the duplicate's block. The resolver cannot know eventual transaction/log
  indexes; the SDK may enrich receipt evidence with them after mining. A
  rejected resolver call reverts and has no durable EAS receipt; failed attempts
  remain SDK transaction state.

Module effects run once per `(BindingVersionId, RecordVersionId)`, not once per
receipt. First-pair admission runs validator/policy and stores pair evidence;
same-pair retries recheck core inputs and direct module codehashes but skip both
module calls, while a new binding runs them again. Global record/type/reference
indexes remain once per RecordVersionId.

Typed RecordVersion receipts are permanently non-revocable in EAS-ABI/1;
an application may express retraction/deprecation as a separate revocable
relationship, but core 1.5 gives it no magic status. `realmAdmitted` and
`realmActive` for a RecordVersion remain permanently true after first admission
and mean neither current nor endorsed nor unretracted. App/reader policy may
treat a retraction as ineffective without removing the immutable record from
type/backlink indexes. External EAS tools will not interpret that separate
claim as native receipt revocation; this is an explicit interoperability
limitation.

Bindings are many-to-many: one TypeId may have several realm/physical
bindings, and one physical schema may serve several TypeIds that share a
shape. The explicit prefix selects a binding version; resolver lookup includes
the physical schema reference, payload TypeId, and selected binding and fails
closed on unknown or mismatched combinations.

Resolver address alone is not historical validator identity, because a proxy
can change implementation while an EAS SchemaUID stays constant. EAS-ABI/1
commits and rechecks the directly called module's outer runtime code plus config
and records the admission basis, but cannot prove that a static module avoids
mutable proxies/oracles. Readers needing stronger validity must require an
audited self-contained module or a future mechanically bounded validator
profile. EAS's schema string aids decoding but does not itself prove canonical
application bytes, so the admission path rejects malformed, noncanonical, and
trailing bytes.

SDK/read results expose distinct facets: decodable, shape-valid,
validator-valid, realm-admitted, immutable-record `realmActive` as narrowly
defined above, endorsements by named curators, and
`effective(policy,lens,basis)` for a reader. Endorsement/effectiveness are not
canonical stages of the venue's validity ladder. Known-type queries expose
append-only receipt history, deduplicated semantic records, and realm-active
status as distinct results; raw array length is never presented as a live
count. The
canonical 1.5 type registry supports exact TypeId lookup with enough data to
retrieve and verify the descriptor/ShapeId, plus a paginated on-chain catalog;
registration is discovery, not endorsement. Exhaustive discovery across
foreign EAS, arbitrary definitions, or every realm remains evidence-gated,
and ranked/full-text search may be an off-chain accelerator without becoming
validity authority.

Foreign non-EFS EAS records retain an origin-scoped identity over interop
profile, chain, EAS deployment, and original receipt UID. An explicit mapping
claim may associate their physical schema with an EFS type; deterministic
revalidation can then produce a new local admission whose mapper/relayer is
not mislabeled as the original EAS attester. Outbound projection of an EFS
record to another native EAS schema similarly creates a new receipt and often
a different attester/resolver path while retaining the source EFS
RecordVersionId and
original receipt linkage. Neither direction silently changes original author,
resolver, revocation, or provenance.

Self-declared predecessor metadata may be immutable, but compatibility is a
separately authored, versioned claim with issuer and basis. It is not part of
universal type identity merely because a publisher asserts it.

### R14 — Core semantic state is bounded and reconstructible

The 1.5 resolver/index/view handoff must publish a capability table covering:

- exact subject/path and object lookup;
- records by known type/definition, separated into receipt history,
  deduplicated records, and realm-active status. Reader-qualified
  `effective(policy,lens,basis)` is a separate view;
- target backlinks, including definition/role filters;
- paginated typed-record backlinks by
  `(TypeId, FieldRoleId, targetKind, targetId)` plus a target-first
  `(targetKind, targetId)` view returning TypeId/FieldRoleId/RecordVersionId for
  all descriptor-declared references;
- current PIN slot and current TAG edge;
- append-only receipt history and receipt-to-semantic-ID lookup;
- bounded child/membership enumeration where the product claims it; and
- reconstruction of current state and full record bodies from an enumerable
  on-chain storage spine even if historical logs are unavailable. The semantic
  index may store canonical body hashes plus paginated receipt references and
  recover bodies from the pinned EAS contract; it need not duplicate every
  application body in both stores.

Events and third-party indexers may accelerate reads, but a private operator
database cannot be the only source for core semantic state advertised as EFS.
Point and enumeration reads at the same basis must agree.

Every append-only array is paginated and attest/revoke callbacks are O(1) in
prior history length. The fork proof benchmarks adversarial duplicate receipts,
shared-topic child growth, and descriptor-reference fanout; paid history may
grow, but no write or point read may scan it or duplicate full bodies in the
semantic index.

Global objects/records-by-principal enumeration is not silently promoted into
the 1.5 core: the corresponding v2 owner choice remains evidence-gated. A
product that needs it must justify a bounded roots-forward/orphan-tail design
or label the off-chain result partial.

### R15 — Pin EAS behavior and persist deterministic write plans

Before contract or SDK implementation is called ready, the project must pin
the supported EAS deployment/version/bytecode and test actual `multiAttest`
group ordering, resolver callback ordering, atomic rollback, revocability,
revocation, and validity behavior.

The SDK persists a deterministic write plan containing canonical bytes, salts,
semantic IDs, dependency order, chain ID, EAS address, exact physical SchemaUID
and BindingVersionId, recipient, refUID, native expiry, revocable flag, value,
expected attester, complete calldata, and expected slot revision/CAS fields.
One deterministic write plan contains at most one state-changing PIN/TAG
activation per SlotId; the planner collapses intermediate same-slot values to
the intended final state or rejects the plan. This makes an ambiguous replay
an inert duplicate rather than a partly stale A→B sequence.
It distinguishes draft, signed, submitted, EAS-admitted, finalized,
superseded, and failed states. At-least-once retries remain observable and
semantically idempotent.

The 1.5 freeze must ship versioned domains, a synthetic successor-profile
coexistence fixture, and an adapter contract that forbids reinterpretation.
Native v2 is **not** a prerequisite for durable 1.5 writes. When v2 arrives it
must preserve every frozen coordinated 1.5 identity/digest—TagDefId, DataId,
RecordBodyCommitment/RecordVersionId with their TypeId/ShapeId codec,
FieldRoleId, SlotId, and SemanticEdgeId—natively or expose them as an explicit
immutable legacy namespace; it may not silently rename or reinterpret them.
`SemanticEdgeId` is a reusable digest, not a promise to equal native v2's
future ClaimId.

The reopened native-v2 drafts currently reuse `efs.id.tagdef.v1` and
`efs.id.slot.v1` for incompatible kind-word and five-word formulas. That is a
known draft collision, not coexistence. Before either profile freezes, v2 must
adopt the frozen 1.5 TAGDEF/SLOT layouts or move its incompatible layouts to new
domain/profile strings.

## What must be fixed before durable Arcade data

| Gate | Why it cannot be deferred |
|---|---|
| Exact EFS ID grammar, domains, canonicalization, and cross-language vectors | Changing them later renames every durable link and object. |
| EAS-UID separation in contracts, SDK types, semantic indexes/routes, and new EFS events | Allowing both spellings creates split graphs and multi-block dependencies; native EAS receipt/audit surfaces remain explicitly typed. |
| Additive sibling 1.5 schema/resolver/index/view profile | V1 DATA and graph fields cannot be made universal by an SDK alias or safely reinterpreted in place. |
| Full-width principal input to new ID formulas | Cheap now; otherwise address truncation becomes a second identity migration. |
| Minimum graph roles and slot/cardinality rules | A wrong cardinality or dual encoding corrupts latest-wins and indexing. |
| Shared-subject duplicate/race behavior | The first caller or an honest concurrent batch must not own, poison, or brick `/Arcade/`. |
| Separate receipt aggregation and slot resolution with stored realm-local ordinal | Retries, supersession, stale/current revocation, and no-resurrection must produce one deterministic state. IDs, raw EAS UID bytes, and author time are not chronology. |
| Stable DataId versus body-bound RecordVersionId, moving-link, digest, mirror, and closure semantics | Arcade builds and Markdown citations must not change under an exact link or claim unverified transitive bytes. |
| Arcade portable profile: GameProject/GameRelease/ArtifactManifest split and `ArtifactManifest/1` | This is a gate for durable Arcade data, not a new 1.5 kernel kind or general deployment gate. A curator slug is a moving view, not a global GameId. |
| Stable authoring principal for the official Arcade curator, plus initial realm, custody/recovery policy, and explicit single-chain or verified deterministic cross-chain account plan | Moving later to a different principal fragments curation, objects, reputation, and lenses forever; the same address alone does not prove the same controller elsewhere. |
| Shared-schema/resolver regression trace and type/shape/EAS binding | Universal IDs are not a win if developers lose type sharing, records-by-type discovery, validation grades, or EAS interoperability. |
| Bounded semantic index/state-reconstruction table | Core point, type, target, slot, receipt-history, and membership claims cannot depend on one private indexer. |
| Honest read/trust result | `UNKNOWN`, partial, basis, truncation, and policy source must be explicit; hostile URLs/apps cannot choose the policy that authorizes themselves. |
| Inventory of live v1 data and consumers | “No meaningful data yet” is an assumption to verify before redeployment or incompatibility. |
| Canonical small-write and retry tests | A small Arcade write must fit one atomic EAS batch. Larger/gas-constrained exceptions may stage explicitly and retry idempotently, but no follow-up transaction may exist solely to discover a mined UID. |
| Pinned EAS conformance and fork proof | Atomicity, callback ordering, revocation, state reconstruction, gas bounds, and source/live drift must be demonstrated against the actual supported deployment. |
| Versioned successor/coexistence fixture | 1.5 must prove that a synthetic future profile can resolve frozen IDs as an explicit immutable namespace without reinterpretation. Native v2 itself is not a launch dependency. |
| No-silent-limit behavior | Current v1 caps lenses at 20 and silently truncates the rest. Every lens/page/work limit must be a typed, visible outcome. |

## Acceptable, explicit MVP debt

- EAS remains the carrier and the chain-local attester-provenance, block-time,
  resolver, and revocation ledger.
- Statements, revocations, and resolver outcomes remain chain/deployment-local.
- Lenses remain ordered explicit address/principal lists.
- Ordinary low-stakes users may author through bare EOAs.
- No address-linking feature needs to ship.
- No portable current-state or cross-chain revocation promise is made.
- No KEL recovery, scoped portable actors, P-256/PQ principal, or threshold
  organization support is promised.
- Old EAS statements may later be imported as provenance-qualified evidence;
  they are not promised retroactive chain-free authorship.

## Known downsides we are choosing

| Debt | Consequence in 1.5 |
|---|---|
| Bare address identity | Lost key means lost future control; stolen key is indistinguishable from the owner; there is no native recovery or safe rotation. |
| One visible address | Public activity is correlated; separate private personas must stay separate rather than be publicly linked. |
| Explicit address lenses | Changing the visible principal requires manual lens updates and can fragment reputation. Independent public device/app addresses cannot inherit the parent; account-internal signers may remain hidden behind the same address. |
| V1 lens ceiling | `MAX_LENSES = 20`; excess URL entries are silently truncated today. One identity per address reduces device fan-out but does not solve large community/curator sets. |
| No historical authorization ledger | A removed or compromised key cannot be cleanly classified “valid before T, invalid after T,” and strong backdating resistance is absent. |
| Smart-account escape hatch not yet shipped | Multi-device promptless authorship cannot be an Arcade launch assumption until the authenticated path is implemented and reviewed. |
| Address choice before write one | Moving from an EOA to a different deployed account later creates a second identity; only a same-address upgrade avoids the split. |
| Cross-chain account state | The same address on another chain does not prove the same deployment or controller. 1.5 authoring is single-realm until that equivalence is verified. |
| Future KEL activation race | Without an earlier upgrade commitment, a later EOA-to-KEL inception cannot distinguish the legitimate owner from a thief holding the EOA; first valid inception is an explicit residual risk. |
| EAS-local statements | The object ID can travel while its original attestation, revocation, and current-effective result remain realm-specific. |
| Universal subject, plural state | `/Arcade/` has one subject ID, but “official games now” still depends on a curator/lens and a named state basis. |
| Display links | Bilateral links still expose correlation, can be changed later, and prove association rather than delegation or historical control. |

## Pull KEL or stronger identity authority forward when

- an independent device/app key must author **as** the same principal and be
  separately revocable;
- identity must survive controller/signing-key replacement without relying on
  same-address account machinery;
- authorization at write time must remain provable after later revocation;
- a removed key must be unable to submit a backdated strongest-grade record;
- protocol-enforced scopes are needed rather than account/vendor policy;
- lens membership must survive key rotation without editing every lens;
- passkeys, P-256/PQ, threshold organizations, or non-address principals are
  MVP requirements;
- a linked address must mean “authorized to act for” rather than “displayed
  together.”

## Pull the portable envelope or native-v2 boundary forward when

- author and submitter must be independently verifiable rather than merely
  represented as separate API fields;
- portable relaying beyond immutable type publication is required; or
- cross-carrier authorship must survive independently of EAS attester state.

## Deep-dive resolutions and remaining freeze work

- [x] Derive the smallest graph set from Arcade, Nanda, Git-backed Markdown,
  shared schemas, and ordinary files. — Four semantic roles: TAGDEF, DATA,
  PIN, and TAG; LIST remains conditional. Physical schemas may specialize but
  only behind registry-declared canonical-source rules and one SDK spelling.
  See
  [[2026-08-07-efs-v2-to-15-deep-dive]].
- [x] Choose the deployment strategy. — Add sibling 1.5 schemas that all point
  to one immutable shared router/registry-index/view authority over EAS; do
  not reinterpret frozen v1 receipts.
- [x] Decide the identity MVP. — Address-shaped full-width PrincipalId, one
  visible principal per lens entry. Smart-account/session keys are a later
  adapter and are not required for guest Arcade.
- [x] Decide the read/trust minimum. — Realm/basis, found,
  `ABSENT_PROVEN(bound,evidence)`, unknown, completeness/truncation, and policy
  source are required; the full compiled v2 lens system is deferred.
- [x] Define the old-v1 honesty boundary. — Keep legacy receipts, project with
  loss labels, re-author only with a new author action, reseed from verified
  manifests, and never claim lossless conversion of empty-payload v1 DATA.
- [x] Produce the v2 compatibility disposition. — See
  [[2026-08-07-efs-v2-to-15-deep-dive]] and its corpus. Freeze a versioned
  successor/coexistence adapter now; future native v2 may preserve IDs natively
  or expose the immutable 1.5 namespace, but may not reinterpret it.
- [ ] Freeze the standalone `EFS-ID/1` canonical bytes, domains, name grammar,
  principal profile, salt rules, role/object-kind constants, TagDef/DataId,
  coordinated ShapeId/TypeId/RecordBodyCommitment/RecordVersionId/FieldRoleId,
  slot/semantic-edge formulas, succession rules, and Solidity/TypeScript
  vectors. The 1.5 assertion digest is `SemanticEdgeId`, not native-v2
  `ClaimId`.
- [ ] Freeze `TypeDescriptorV1`, `EAS-ABI/1`, the physical EFS record prefix,
  on-chain execution-descriptor availability, ECDSA-only relayable
  `TypeAuthorizationV1`, separate ValidatorId and
  AdmissionPolicyId, permanent binding lifecycle, module code/config/call
  identity, `BindingVersionId` versus first-pair `BindingRecordEvidence` and
  per-receipt `ReceiptEvidence`, the
  typed-admission interface, mandatory TypeId/RecordVersionId indexes, and a
  hard-bounded descriptor-declared typed-reference backlink seam with a full
  publish/reuse/admit/query/project trace.
- [ ] Freeze receipt aggregation separately from slot resolution, including
  duplicate/retry/supersession/revocation/no-resurrection behavior, stored
  realm-local semantic admission ordinal, point/enumeration consistency, and
  exact versus moving revision/link semantics.
- [ ] In the Arcade portable profile—not the 1.5 kernel—freeze the
  publisher-qualified GameProject, immutable GameRelease,
  chain-independent ArtifactManifest identities and the minimal
  `ArtifactManifest/1` one-member/multi-file-fail-closed profile.
- [ ] Pin supported EAS deployment/version/bytecode and pass the core fork proof:
  atomic representative graph write, rollback, races, full-body/current-state walk from
  enumerable storage without logs, gas bounds, v1/1.5 type separation, and
  cross-language vectors.
- [ ] Inventory and classify all live v1 records and dependent apps/URLs; the
  point-in-time count is 1,654, not zero.
- [ ] Choose the stable official Arcade curator principal, initial realm, and
  custody/recovery expectation before its first valuable durable write.
- [ ] Decide whether 1.5 explicitly accepts the first-future-KEL-inception race
  or earns a separately reviewed first-use commitment before valuable bare-EOA
  identities accumulate. Do not import the old KEL topology casually.
- [ ] Produce separate contract and SDK handoffs only after the ID,
  graph/schema, receipt/read, and fork gates pass. Arcade's package/runner and
  client handoff remains a separately stamped application-profile track.

## Evidence and cautions

- [[2026-08-07-efs-v2-to-15-deep-dive]] and its supporting corpus are the
  completed 2026-08-07 feasibility, disposition, product-trace, and adversarial
  review. They recommend this revision but do not promote it or authorize code.
- A point-in-time Sepolia read at block `11,441,982` found 1,654 indexed v1
  records, including 107 DATA from seven attesters. Deployed anchor depth is
  `32` while current source says `256`; live bytecode wins for migration work.
- [[deterministic-ids]] gives the failure analysis and an older EAS-carried
  direction, but its header forbids implementing the formulas without a
  coordinated re-cut.
- [[codex-kinds]] is the strongest current tag-core proposal, but remains a
  draft and must be grounded again for 1.5.
- [[efs-account-system]] explains why many independent attester addresses
  break latest-wins and why one account/many internal signers is cleaner. It
  is historical input, not current authority.
- [[wallet-and-actions]] contains the bilateral display-link fallback; its
  pre-KEL authority model is explicitly superseded.
- [[kel]] proposes an address-shaped in-place upgrade path and names the
  recovery, actor, scope, and temporal-authority machinery omitted here; that
  path remains an unanswered v2 recommendation, not a 1.5 guarantee.
- [[fable-handoff-portable-schemas-and-validators]] defines the EAS feature
  regression test that 1.5 should run even though portable signed application
  records beyond the narrow TypeAuthorization exception are out of scope.
- [ADR-0026](../../../contracts/docs/adr/0026-max-lenses.md),
  [ADR-0031](../../../contracts/docs/adr/0031-lenses-url-param-model.md), and
  [ADR-0039](../../../contracts/docs/adr/0039-default-lenses-priority-chain.md)
  are current v1 lens evidence; they do not establish the future principal
  model.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed (no surprise repos at implementation time)
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment

## Implementation notes

No implementation is authorized by this draft. The next pass should produce
separate contract, SDK, and client handoffs only after the irreversible ID and
graph gates above are resolved.
