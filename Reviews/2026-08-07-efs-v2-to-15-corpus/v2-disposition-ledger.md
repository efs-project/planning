# V2 to EFS 1.5 disposition ledger

**Status:** reconciled review ledger; proposed 1.5 dispositions, not owner
adoption and not permission to copy reopened v2 bytes

This ledger answers one question: after removing portable data as an EFS 1.5
requirement, which v2 ideas are still necessary to avoid permanent damage?

## Status key

| Mark | Meaning |
|---|---|
| **O15** | recorded EFS 1.5 owner direction in [[Decisions]] |
| **OV2** | adopted v2 owner ruling in [[owner-rulings]]; not automatically carried into 1.5 |
| **RR** | recommendation of this completed review; not owner adoption |
| **RD** | active/reopened draft input; exact mechanism is not adopted |
| **H** | useful historical failure analysis or precedent |

The v2 README explicitly reopens the old envelope, kind, kernel, and exact-ID
mechanisms. “Backport” therefore means preserve an invariant after re-deriving
it for the EAS-backed profile; it never means copy a historical byte layout.

## Must backport before durable 1.5 data

| Surface | Status | EFS 1.5 disposition | Why it is load-bearing |
|---|---|---|---|
| Universal object, subject, and slot IDs plus a chain-free semantic-edge digest | O15 + RR ([[Decisions]]; [[deterministic-ids]]) | Freeze a standalone `EFS-ID/1` profile. EAS UIDs remain typed realm-local receipts. Call the receipt-dedup key `SemanticEdgeId`, not native `ClaimId`. | Stable links, offline references, atomic dependent writes, and later coexistence depend on object/slot identity; native v2 still needs authority/sequence-bound claim identity. |
| Hash-domain succession | RR ([[deterministic-ids]]) | Version domains and define parallel resolution; never reinterpret or rewrite an old ID. | A corrected future grammar must not silently rename history. |
| Canonical name/path bytes | RR ([[deterministic-ids]]) | Freeze root, slash, case, restricted-ASCII segment grammar, URL-adapter behavior, length, and reserved-byte rejection. Unicode stays display metadata. Publish malformed vectors too. | `/Arcade/` is only a Schelling point if every implementation hashes the same bytes and the contract can verify them. |
| Full-width `bytes32 PrincipalId` input | O15 + RR ([[Decisions]]; [[requirements-and-boundaries]]) | Accept only zero-padded address-shaped principals in 1.5, but never truncate the semantic input type. | Avoids a needless second object-ID migration. It does **not** make KEL or historical authorization safely additive. |
| Shared subject, stable owned DATA lineage, exact RecordVersion, cardinality-one PIN, cardinality-many TAG | O15 + RR ([[Decisions]]; [[codex-kinds]]) | Keep four graph roles; RecordVersionId is the coordinated body-bound identity for exact typed bytes, not a fifth mutable graph role. Keep `LIST` conditional. | Stable lineage and exact citations must not collapse, and ownership/cardinality are not cosmetic. |
| One fact, one declared canonical source | RR ([[codex-kinds]]) | Close the legal definition/target/cardinality matrix. For reserved projections, declare the typed record or graph claim as canonical and make the other a derived view. | Specialized physical schemas are tolerable; two independently authored canonical spellings are not. |
| Receipt aggregation and slot resolution | RR ([[deterministic-ids]]) | Group lineage receipts by DataId, exact typed admissions by RecordVersionId, and relationship receipts by SemanticEdgeId; then choose activation heads with stored admission ordinal plus per-slot revision/CAS. One canonical receipt controls relationship liveness; immutable identities/records are non-revocable. | Raw “latest UID,” ID ordering, author time, or grouping every version under DataId is not a state model. |
| Exact record versus stable object identity | OV2 + RR ([[owner-rulings]]; [[2026-08-07-efs-git-deep-dive]]) | Separate stable DataId lineage, body-bound RecordVersionId, integrity commitment, transport, and moving PIN. | Git revisions, Markdown citations, and app releases must not change under an exact link. |
| Shared schema/type identity and resolver admission | O15 + RR ([[fable-handoff-portable-schemas-and-validators]]) | Keep immutable TypeId distinct from ShapeId; origin-scope physical EAS schema references; split ValidatorId, AdmissionPolicyId, BindingVersionId, first-pair BindingRecordEvidence, and per-receipt ReceiptEvidence; preserve cohesive typed records, bounded typed reference fields, and records/references-by-type reads. | TAGDEF alone does not replace EAS's shared schemas or validation loop, and mutable resolver proxies cannot serve as historical policy identity. |
| Core bounded semantic indexes/state walk | OV2 + RR ([[owner-rulings]]; [[onchain-completeness]]) | Index point/path, type, descriptor-declared reference backlinks, target/definition, current slot, receipt history, and claimed membership; reconstruct bodies from enumerable receipt references plus pinned EAS state. Global principal enumeration stays evidence-gated. | Core operation cannot depend on logs or one private indexer, and durability is not queryability. |
| Honest read result | RR ([[lens-spec]]) | Reads name realm/basis and return found, `ABSENT_PROVEN(bound,evidence)`, or unknown plus completeness, truncation, and cursor state. | Endpoint emptiness, caches, or incomplete scans cannot prove absence. |
| Trust-source boundary | RD + RR ([[lens-spec]]) | The viewer or resource owner chooses a gate/curation policy. A hostile link or app may suggest a view, never authorize itself. | Anonymous hyperlinking is a core EFS path and an untrusted input boundary. |
| Time/order/citation rules | RR ([[lens-read-gotchas]]) | IDs are not clocks; author time is testimony; store a semantic realm-local admission ordinal for slot resolution; replies cite immutable versions. | Comments, feeds, edit history, and receipt folds otherwise become ambiguous. |
| EAS conformance pin | RR ([`v1 feasibility`](./v1-feasibility-and-migration.md)) | Pin supported EAS deployment/version/bytecode and test `multiAttest` ordering, resolver callbacks, rollback, revocability, and expiry behavior. | 1.5's atomic-write claim depends on actual EAS behavior, not an assumption. |

## Arcade profile/deployment gates — not 1.5 core

GameProject/GameRelease/ArtifactManifest identities, `/Arcade/` slug policy,
mirror/provenance record shapes, runner capabilities, and the official curator
principal are owned by the Arcade portable profile and deployment. They use the
generic core but do not add kernel kinds or global policy. Before Arcade's first
valuable durable write, choose the curator principal/realm/custody posture and
freeze that profile's exact package and selection semantics. A different app
must be able to register different TypeDescriptors and bounded typed references
without a 1.5 contract upgrade.

## Cheap seams to reserve now

| Surface | 1.5 seam | What it does **not** claim |
|---|---|---|
| Branded SDK identifier types | Distinct `EfsObjectId`, `SlotId`, `SemanticEdgeId`, `EasReceiptUid`, `PrincipalId`, `ActorId`, and `Submitter`; one shared ID library. | Type aliases alone do not make old records universal; SemanticEdgeId is not future native ClaimId. |
| Deterministic write plan | Persist canonical bytes and salts; expose draft, signed, submitted, EAS-admitted, finalized, superseded, and failed states. | A client timestamp is not trusted ordering. |
| Author/actor/submitter separation | Reserve separately typed fields and leave actor absent without evidence. | EAS proves its attester, not an internal smart-account session key. |
| Smart-account adapter | Permit a device/session key to cause the stable account itself to call EAS; assert emitted attester equals expected principal. | Account controllers and session policy are not EFS-native historical authority. |
| Minimal read context | `INTERACTIVE` versus `GATE`, realm, basis, completeness, and policy source. | This is not the full compiled v2 lens family. |
| Trusted write chrome | Games/apps request mediated writes; signing and authority remain outside untrusted code. | The EFS graph is not an account-permission system. |
| Generic closure/manifest profile | One verifiable closure mechanism for Arcade packages, Nanda skills, Git bundles, and multi-file artifacts. | It is an application profile, not a new kernel kind. |

## Additive later when a product trace earns it

- `LIST`, if an immutable append-only collection charter or subscribable
  curator ledger cannot be expressed with the four core roles.
- Display-only bilateral address associations. They grant no authority and are
  unnecessary for the Arcade MVP.
- Reviewed smart-account/session-key support.
- Expiry-aware claims. The safer 1.5 MVP is `expirationTime = 0`; otherwise
  every getter, index, event fold, and UI needs stale-not-dead semantics.
- Full typed/compiled lenses, channels, starter packs, and large curator sets.
- Blinded definitions, duplicate-member roles, richer datatypes, and advanced
  collection policies.
- `.efs-bundle`, native mounts, chain-free local mode, and complete OS
  capability machinery.

## Defer with explicit debt

| Surface | Debt accepted by 1.5 |
|---|---|
| KEL, recovery, rotation, scoped actors, organizations, passkeys/PQ | A lost address loses future control; a stolen address is indistinguishable; later KEL inception has a legitimate-owner-versus-thief race unless a separate safe commitment is designed before first use. |
| Portable signed application envelope | Aside from the narrow ECDSA authorization that makes an immutable TypeDescriptor relayable, application-record authorship, revocation, resolver admission, and order remain EAS-realm-local even when the object ID travels. |
| Cross-realm global-current state | `/Arcade/` has one subject ID but plural realm/lens-qualified state. No unqualified “current” claim. |
| Private encrypted tier and unlinkable personas | 1.5 durable graph metadata and authorship are public. Anonymous reading is not anonymous writing. |
| Full neutral Git forge | 1.5 can support single-publisher archive/wiki history; multi-maintainer replay-safe CAS, branch policy, and strong historical authority stay v2/Git-profile work. |
| Consumer-drive recovery and sharing | Public, low-stakes artifacts only unless a stable recoverable account is chosen from write one. |

## Reject for EFS 1.5

- Copying literal v2 envelope, kernel, KEL, kind, or deterministic-ID bytes
  while those mechanisms are reopened.
- Calling EAS receipt UIDs “EFS IDs,” hiding them behind an SDK alias, or
  placing them in any universal preimage.
- Placing a universal EFS object ID in EAS `refUID`; EAS requires a live EAS
  receipt there. New 1.5 semantic relationships use payload fields and
  normally set native `refUID = 0`.
- Chain ID, EAS deployment, schema UID, resolver address, timestamp, block, or
  transaction data inside universal identity.
- A unilateral `parentKey` or permissionless “act as” edge as authority.
- Caller/URL-supplied lenses automatically becoming install, write, or
  security policy.
- Content hash as mutable file/object identity.
- `TypeId = ShapeId`, `TypeId = EasSchemaUid`, resolver address as historical
  validator identity, mutable type descriptors, or every application field
  decomposed into graph edges.
- Author-claimed time/order as trusted chronology.
- `UNKNOWN` as absence, page exhaustion as completeness, or silent truncation.
- Smart-account controller state or ERC-1271 validation presented as durable
  portable authorship.
- A lossless-author migration claim for old v1 DATA: its empty payload has no
  universal owned-object preimage. Re-authoring is a new statement.

## Successor compatibility contract

Native v2 is not a prerequisite for durable 1.5 writes. EFS 1.5 itself must
freeze and test a synthetic successor/coexistence adapter that establishes:

1. frozen 1.5 TagDef/DataId, coordinated
   ShapeId/TypeId/RecordBodyCommitment/RecordVersionId/FieldRoleId, and slot IDs are
   byte-stable immutable namespace entries and can coexist beside a synthetic
   `EFS-ID/2` without
   reinterpretation;
2. `SemanticEdgeId` is a reusable assertion digest, while a future native claim
   receives its own authority/sequence-bound ClaimId;
3. origin-scoped EAS receipt references remain provenance rather than identity;
4. address-shaped 1.5 principals retain their full `bytes32 PrincipalId` value;
5. exact immutable citations stay exact while moving bindings are re-evaluated
   under a named realm/lens/basis; and
6. an adapter carries legacy EAS admission evidence without manufacturing
   portable author, ordering, or revocation claims.

When native v2 arrives, it may preserve the IDs natively or expose the frozen
1.5 namespace as explicit legacy. It may not rename or reinterpret it.
The current reopened v2 TAGDEF-kind-word and five-word SLOT drafts reuse
`efs.id.tagdef.v1`/`efs.id.slot.v1` incompatibly; before either freeze they must
adopt 1.5's final layouts or move to new domain/profile strings.

## Primary design inputs

- [[requirements-and-boundaries]] — recorded owner direction and active 1.5
  boundary.
- [[deterministic-ids]] — useful ID/receipt failure analysis; exact formulas
  are reopened.
- [[codex-kinds]] — bounded graph roles; exact table is not automatically
  adopted.
- [[onchain-completeness]] — adopted/queryability pressure and capability
  inventory.
- [[lens-spec]] and [[lens-read-gotchas]] — unknown/completeness/trust-source
  safety.
- [[fable-handoff-portable-schemas-and-validators]] — schema/resolver feature
  regression trace.
- [[kel]] and [[owner-rulings]] — v2 authority target and adopted boundaries,
  not 1.5 mechanisms.
