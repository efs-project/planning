# Glossary

Single-file alphabetical glossary of EFS terms. Each term is an `## H2` anchor so wiki-links can target it precisely: `[[Glossary#TAG]]`.

**Growth rule.** A term whose definition exceeds ~300 words graduates to its own `Architecture/<term>.md` page; the Glossary entry becomes a 2-line stub linking to the page. Do NOT split this file into `Glossary-A-F.md` etc — section markers (`## A`, `## B`) are the splitting tool if scrolling becomes annoying.

**Source-of-truth note.** Where a term has a precise definition in the contracts repo's `specs/` or `docs/adr/`, the Glossary entry summarizes and links rather than re-stating. The contracts repo wins on contract-level precision; the Glossary's job is cross-cutting recognizability.

**Version rule (2026-08-12).** Deployed-v1 terms below are labeled explicitly.
The current EFS 2.0 vocabulary is governed by
[[Designs/efsv2/owner-rulings]] and synthesized in
[[Designs/efsv2/system-constitution]]. Candidate terms say candidate; a glossary
entry does not freeze protocol bytes.

---

## Anchor

**V1 term.** A path node stored as an `ANCHOR` EAS attestation, hierarchical via
`refUID = parentAnchor`. EFS 2.0 keeps stable linkable Topics/paths as a
requirement but has not frozen this carrier or formula.

## ANCHOR

**V1 frozen schema.** Stable path/name primitive registered on Sepolia. It is
evidence for EFS 2.0 Topics, not the active successor kind or ID formula.

## Attestation

**V1 term.** The deployed system uses EAS attestations for files, folders,
edges, and metadata. EFS 2.0 uses candidate Records, authored Occurrences, and
Realm admission; EAS may return only as an optional interoperability adapter.

## EFS Commons

Optional shared EFS Realm and/or replaceable services for public discovery,
catalogs, comments, profiles, relaying, endpoints, and other network effects.
It is not required by [[Glossary#EFS Core]], cannot mint semantic identity or
become the only index, and has no selected chain or operator.

## EFS Core

The standalone EVM protocol/contracts at the center of EFS 2.0: deterministic
semantic identities, reusable typed data, authored occurrences, Realm
admission, bounded on-chain graph indexes and Lenses, exact-byte commitments,
honest completeness, and independent reconstruction. Core never requires
Commons or EFS OS.

## EFS OS

Optional sovereign client environment above EFS Core: local/encrypted state,
accounts and recovery, rich personal Lenses, offline work, capability grants,
app installation/sandboxing, agents, and secure signing. The direct Web Client
and shared File Browser do not require the OS to boot.

## EFS Web Client

Candidate self-hostable first-party direct client for EFS Core. Its baseline is
a guest File Browser/verified-content path that can open an explicit Realm or
exact EFS link without Commons, an account, a wallet prompt, or EFS OS. “Guest”
does not mean network-anonymous.

## DATA

**V1 frozen schema.** EAS attestation representing standalone file content
identity as `contentHash + size`; it is non-revocable and path-independent. EFS
2.0 does not inherit this schema or assume size is known when a Locator is first
published. See `contracts/specs/02` for v1.

## Design

A proposal for a feature or change to EFS that may span multiple repos. Lives in `Designs/` in this vault. Has a lifecycle: `draft → review → ready-for-promotion → accepted → landed | abandoned | rejected`. See [[design-system]] for the full state machine including the `rejected` (hard-veto, do not revive) vs `abandoned` (paused, may revive) distinction.

## Durable (permanence tier)

Expensive but recoverable surfaces. Includes devnet contracts, cross-package TypeScript APIs, the committed `deployedContracts.ts` shape. Karpathy-style simplicity applies; permanence wins ties. Contrast: [[Glossary#Etched (permanence tier)|Etched]], [[Glossary#Ephemeral (permanence tier)|Ephemeral]]. See `contracts/docs/agent-workflow.md` → Permanence tiers.

## EAS

Ethereum Attestation Service. It is the carrier for deployed EFS v1. EFS 2.0
does not assume EAS Core; a loss-aware import/export/projection adapter may be
added if a concrete interoperability benefit earns it.

## Edge (PIN, TAG)

**V1 term.** EAS attestation linking entities. PIN has cardinality one; TAG has
cardinality many. EFS 2.0 preserves the semantic distinction through generic
Binding/current slots versus many authored membership Occurrences; exact names
and physical representation remain candidate.

## EFS

Ethereum File System. EFS v1 is the deployed EAS-based evidence system. EFS 2.0
is the active greenfield EVM-native typed graph/filesystem design; see
[[Designs/efsv2/README]].

## Envelope

**EFS 2.0 candidate.** An immutable signed context that amortizes Principal,
actor/account authority witness, replay domain, and an ordered set of Record
leaves. It creates authored [[Glossary#Occurrence|Occurrences]] but does not
change a Record's semantic ID or automatically promise an application-level
transaction.

## ENOENT

Unix/macOS error name for “No such file or directory.” In an EFS mount it is valid only when the requested name is **proven absent** from the complete mounted lens/view at its basis. An incomplete RPC, page, author, or snapshot is [[Glossary#UNKNOWN]], not ENOENT. Windows adapters translate the same proven-absence result to the appropriate native file/path-not-found error. See [[mountable-filesystem-semantics]].

## Ephemeral (permanence tier)

Surfaces that change next commit. Includes the Scaffold-ETH-based debug UI in `contracts/packages/nextjs/`, deploy scripts, dev tooling, tests, docs prose. Karpathy's principles apply cleanly here.

## Etched (permanence tier)

Mathematically irreversible state. Includes mainnet contracts, schema field definitions (field strings hash into UIDs — change orphans prior attestations), append-only index shapes, ABI-visible function/event signatures. Subject to the 50-year test. See `contracts/docs/agent-workflow.md`.

## Kernel

In v1, the append-only lens-agnostic `EFSIndexer.sol`. In EFS 2.0, “Core” is
preferred for the whole protocol; exact contract decomposition is not frozen.

## Lens

A reader-selected trust policy describing whose authenticated claims contribute
to one purpose and how conflicts combine. EFS 2.0 requires a bounded public
contract profile (candidate name: Resolution Plan) and allows richer
Commons/OS policy above it. Lenses always expose basis/completeness and never
grant execution capability. The deployed v1 ordered-address list is evidence,
not the successor grammar.

## LIST

**V1 frozen schema.** A named ordered collection added by EFS Lists, paired with
[[Glossary#LIST_ENTRY]]. EFS 2.0 collection/query semantics must re-earn their
generic representation. See ADR-0044/0046/0047 for v1.

## LIST_ENTRY

**V1 frozen schema.** A single membership record in a [[Glossary#LIST]]—pure
identity; per-entry metadata was deliberately removed (ADR-0046).

## MIRROR

**V1 schema.** A retrieval URI for DATA. EFS 2.0 uses generic Locator claims:
locations, exact content, provenance, availability, and independent custody are
separate facts, and bytes verify against already-selected exact identity.

## Occurrence

**EFS 2.0 candidate.** One authored publication of one semantic Record, named
by its signed Envelope plus the Record leaf's zero-based index. Several authors
may publish the same RecordId while preserving distinct Occurrences,
withdrawals, replies, admission receipts, and provenance.

## Principal

A stable semantic author/trust-list identifier, distinct from submitter,
relayer, and payer. EFS 2.0 is testing a uniform `PrincipalId` API where a local
EOA or ERC-1271 account is an intrinsic zero-setup Realm-qualified account
Principal and later managed Principals add rotation/recovery/delegation. That
specific representation is candidate, not frozen.

## Owner (project role)

The person holding decision authority over some part of this vault — currently James (sole holder). Encodes a **role**, not an identity; the roster lives in [[authority]]. Used bare as a noun-adjunct: `owner-decision-inbox`, "the owner ruled." In documents that also discuss EFS resource ownership, write "project owner" on first mention. Not to be confused with [[Glossary#Owner (EFS resource)]].

## Owner (EFS resource)

The Principal or authority controlling a container, gate, namespace, or device.
EFS 2.0 has not frozen which stable objects are Principal-qualified or their ID
formula. Always possessive-qualified in prose ("the container's owner", "gate
owner"). Not to be confused with [[Glossary#Owner (project role)]].

## PIN

**V1 term.** See [[Glossary#Edge (PIN, TAG)]]. EFS 2.0's candidate generic
Binding/current slot carries the surviving cardinality-one semantics.

## Planning vault

This repository. Cross-repo coordination point for EFS: holds designs, kanban, glossary, architecture overviews, and onboarding. Filesystem-only contract; agents read/write `.md` directly. See vault [README](README.md).

## Promotion (of a design)

Human-gated, atomic ceremony that moves a design from `ready-for-promotion` to `accepted` and assigns it a permanent number. See [[design-system]] § Promotion ceremony.

## REDIRECT

**V1 frozen schema.** The 9th schema (ADR-0050), `bytes32 target, uint16
kind`, expresses canonical/sameAs/supersededBy/symlink relations. EFS 2.0 keeps
explicit successor/redirect evidence as a requirement but has not inherited
this schema or resolver taxonomy.

## Resolved view

The deterministic tree/value projection produced by applying a lens, basis, evidence set, and explicit limits. A read-only EFS mount exposes a resolved view; it does not mount a blockchain as if the chain were literally a block device. See [[mountable-filesystem-semantics]].

## PROPERTY

**V1 schema.** A free-floating string value placed by PIN. EFS 2.0 is testing
generic typed Records and optional ownerless typed literal/value identity
instead of inheriting PROPERTY.

## Realm

One independently ordered EFS Core deployment and policy domain. Its descriptor
binds enough chain, deployment/genesis/config, profile, and basis information
to prevent confusion. Semantic Records may be copied between Realms;
admission, order, revocation, current bindings, authority, finality, and
completeness remain Realm-qualified.

## Record

**EFS 2.0 candidate.** Immutable author-neutral typed semantic content—roughly
`TypeSchemaId + canonical body`—whose RecordId does not depend on Envelope,
Realm admission, carrier, author, or transaction. Authorship lives in an
[[Glossary#Occurrence]].

## Sort overlay

**V1 mechanism.** `EFSSortOverlay` uses per-parent sorted linked lists as a lazy
overlay on `EFSIndexer`. It is evidence, not the EFS 2.0 index design. See
`contracts/specs/07-Sort-Overlay-Architecture.md`.

## SORT_INFO

**Deferred, never frozen.** Proposed during the schema freeze and explicitly left out (all deferrals are additive, so nothing is orphaned by adding it later). Docs that list it among the frozen schemas are stale — the frozen set is the 9 registered 2026-06-11 plus WHITEOUT.

## TAG

**V1 term.** See [[Glossary#Edge (PIN, TAG)]]. EFS 2.0 preserves
cardinality-many membership/tag semantics as generic typed authored
Occurrences plus bounded enumeration rather than inheriting this schema.

## Type Schema

**EFS 2.0 candidate developer term.** Immutable portable definition of one
Record's semantic meaning, canonical body shape, constraints, typed reference
roles, structural validation commitment, and bounded canonical index
declarations. Changing a meaning-affecting field creates a new TypeSchemaId;
successor/equivalence is explicit evidence, never mutation. Older drafts call a
similar object `TypeRevision`.

## Topic

Human-facing concept for a stable, linkable subject such as `/Arcade/` or
`Music`. In v1, James chose “Topic” as the user term for [[Glossary#Anchor]];
that same-primitive implementation is historical. EFS 2.0 must preserve
universal linkable Topics but has not frozen their Type, path grammar, or ID.

## Tombstone

A short stub replacing a landed design's body. Points at the canonical ADRs/specs that resulted from the design. Keeps `DESIGN-NNNN` references resolvable forever. See [[design-system]] § Designs lifecycle.

## Tri-sync invariant

The rule that a design's status must agree across three locations: prose `**Status:** X`, tag `#status/X`, and (post-promotion) filename `NNNN-<slug>.md`. All three change in the same commit. **Canonical definition: [[design-system]] § Tri-sync invariant.** Mechanical check: `scripts/tri-sync-check.sh`.

## UNKNOWN

An EFS resolver result meaning the available evidence is insufficient to prove presence or absence at the requested lens and basis. It is not a POSIX errno. A strict mount maps it to an explicit retry/I/O failure and never to [[Glossary#ENOENT]], a missing xattr, or silent lower-priority lens fallthrough. See [[mountable-filesystem-semantics]].

## WHITEOUT

**V1 frozen schema.** Additive 10th schema (ADR-0055), a cross-lens per-name
negative mask that hides without mutating what it shadows. Negative masks remain
Lens/filesystem evidence; EFS 2.0 has not frozen this schema or fold.

## Worktree

A git worktree under a repo, used to isolate per-task work without affecting `main`. Convention: `/efs/<repo>/.worktrees/<slug>`. See [[design-system]] § /efs/ agent home and [[repo-map]].

## xattr / extended attribute

Host filesystem name/value metadata attached to a file or directory. Resolved public scalar EFS properties and fixed diagnostics can project read-only to Linux/macOS xattrs and Windows EAs under bounded `user.efs.*` names. Xattrs are not the canonical or lossless EFS property system: they cannot portably carry arbitrary keys, multi-valued claims, provenance, grades, losing candidates, or unbounded enumeration. See [[mountable-filesystem-semantics]].
