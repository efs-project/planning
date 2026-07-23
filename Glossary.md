# Glossary

Single-file alphabetical glossary of EFS terms. Each term is an `## H2` anchor so wiki-links can target it precisely: `[[Glossary#TAG]]`.

**Growth rule.** A term whose definition exceeds ~300 words graduates to its own `Architecture/<term>.md` page; the Glossary entry becomes a 2-line stub linking to the page. Do NOT split this file into `Glossary-A-F.md` etc — section markers (`## A`, `## B`) are the splitting tool if scrolling becomes annoying.

**Source-of-truth note.** Where a term has a precise definition in the contracts repo's `specs/` or `docs/adr/`, the Glossary entry summarizes and links rather than re-stating. The contracts repo wins on contract-level precision; the Glossary's job is cross-cutting recognizability.

---

## Anchor

A path node in EFS. Stored as an `ANCHOR` EAS attestation; hierarchical via `refUID = parentAnchor`. Permanent and non-revocable — once a folder or path exists, it exists forever. See `contracts/specs/02-Data-Models-and-Schemas.md`.

## Attestation

The fundamental unit of state in EFS. EFS uses Ethereum Attestation Service (EAS) to represent files, folders, edges, and metadata as on-chain attestations rather than custom storage. See [[Glossary#EAS]] and `contracts/specs/01-System-Architecture.md`.

## DATA

EAS schema representing standalone file content identity: `contentHash` + `size`. Does not belong to a specific path; pure content identity. Multiple paths can reference the same DATA. Non-revocable. See `contracts/specs/02`.

## Design

A proposal for a feature or change to EFS that may span multiple repos. Lives in `Designs/` in this vault. Has a lifecycle: `draft → review → ready-for-promotion → accepted → landed | abandoned | rejected`. See [[design-system]] for the full state machine including the `rejected` (hard-veto, do not revive) vs `abandoned` (paused, may revive) distinction.

## Durable (permanence tier)

Expensive but recoverable surfaces. Includes devnet contracts, cross-package TypeScript APIs, the committed `deployedContracts.ts` shape. Karpathy-style simplicity applies; permanence wins ties. Contrast: [[Glossary#Etched]], [[Glossary#Ephemeral]]. See `contracts/docs/agent-workflow.md` → Permanence tiers.

## EAS

Ethereum Attestation Service. The on-chain attestation primitive EFS is built on. EFS Schemas are registered with EAS at deploy time; every file, folder, edge, and property in EFS is an EAS attestation.

## Edge (PIN, TAG)

EAS attestation that links one EFS entity to another. **PIN** has cardinality 1 (file placement, property value binding). **TAG** has cardinality N with `int256 weight` (folder visibility, descriptive labels). Cardinality is declared at the schema level, not per-attestation. See `contracts/docs/adr/0041-pin-tag-schema-split-for-cardinality.md`.

## EFS

Ethereum File System. On-chain filesystem built on EAS attestations. Pre-launch devnet target April 19, 2026.

## ENOENT

Unix/macOS error name for “No such file or directory.” In an EFS mount it is valid only when the requested name is **proven absent** from the complete mounted lens/view at its basis. An incomplete RPC, page, author, or snapshot is [[Glossary#UNKNOWN]], not ENOENT. Windows adapters translate the same proven-absence result to the appropriate native file/path-not-found error. See [[mountable-filesystem-semantics]].

## Ephemeral (permanence tier)

Surfaces that change next commit. Includes the Scaffold-ETH-based debug UI in `contracts/packages/nextjs/`, deploy scripts, dev tooling, tests, docs prose. Karpathy's principles apply cleanly here.

## Etched (permanence tier)

Mathematically irreversible state. Includes mainnet contracts, schema field definitions (field strings hash into UIDs — change orphans prior attestations), append-only index shapes, ABI-visible function/event signatures. Subject to the 50-year test. See `contracts/docs/agent-workflow.md`.

## Kernel

The append-only, lens-agnostic index in `EFSIndexer.sol`. Stores raw attestation relationships without filtering by attester. Contrast: the **overlay** (filesystem-specific views like sort overlays, folder visibility) that compose on top. See `contracts/specs/01-System-Architecture.md`.

## Lens

A reader-selected policy describing whose authenticated claims contribute to a view and how conflicts combine. The deployed/v1 form is an ordered trusted-attester list composed through `?lenses=`; EFS v2 is replacing that with typed, scoped, reproducibly compiled policies. Plan 9 process namespaces and ordered union lookup are useful precedent only for the simple priority-first-present subset; they do not supply EFS basis, completeness, provenance, WHITEOUT, or `UNKNOWN` semantics. See `contracts/docs/adr/0031-lenses-url-param-model.md`, `contracts/docs/adr/0043-rename-editions-to-lenses.md`, and [[mountable-filesystem-semantics]].

## MIRROR

EAS schema representing a retrieval URI for a DATA. Multiple mirrors allowed per DATA (ipfs://, ar://, web3://, https://, magnet:). The router picks the best transport. Revocable. See `contracts/specs/02`.

## PIN

See [[Glossary#Edge (PIN, TAG)]]. Cardinality-1 edge. Used for file placement and PROPERTY value binding. Re-attesting at the same `(attester, definition, targetSchema)` slot supersedes in O(1).

## Planning vault

This repository. Cross-repo coordination point for EFS: holds designs, kanban, glossary, architecture overviews, and onboarding. Filesystem-only contract; agents read/write `.md` directly. See vault [README](README.md).

## Promotion (of a design)

Human-gated, atomic ceremony that moves a design from `ready-for-promotion` to `accepted` and assigns it a permanent number. See [[design-system]] § Promotion ceremony.

## Resolved view

The deterministic tree/value projection produced by applying a lens, basis, evidence set, and explicit limits. A read-only EFS mount exposes a resolved view; it does not mount a blockchain as if the chain were literally a block device. See [[mountable-filesystem-semantics]].

## PROPERTY

EAS schema representing a free-floating string value, placed on a container via PIN under a PROPERTY-typed "key" anchor. Reserved key anchor names: `contentType`, `name`. Non-revocable. See `contracts/specs/02`.

## Sort overlay

`EFSSortOverlay`: per-parent sorted linked lists, lazy overlay on `EFSIndexer`. Stateful but composes on top of the kernel rather than being part of it. See `contracts/specs/07-Sort-Overlay-Architecture.md`.

## TAG

See [[Glossary#Edge (PIN, TAG)]]. Cardinality-N edge with `int256 weight`. Used for folder visibility, descriptive labels (`#nsfw`, etc.), and schema-alias discovery.

## Topic

Human-facing synonym for [[Glossary#Anchor]]. James prefers "Topic" in user-facing language ("we're all talking about the topic Music"); "Anchor" is the technical name that appears in URLs (the web `#anchor` concept — something solid to link to). Same on-chain primitive. If you're writing for a developer, use Anchor; for an end-user, use Topic. Captured 2026-05-26 per @james chat clarification.

## Tombstone

A short stub replacing a landed design's body. Points at the canonical ADRs/specs that resulted from the design. Keeps `DESIGN-NNNN` references resolvable forever. See [[design-system]] § Designs lifecycle.

## Tri-sync invariant

The rule that a design's status must agree across three locations: prose `**Status:** X`, tag `#status/X`, and (post-promotion) filename `NNNN-<slug>.md`. All three change in the same commit. **Canonical definition: [[design-system]] § Tri-sync invariant.** Mechanical check: `scripts/tri-sync-check.sh`.

## UNKNOWN

An EFS resolver result meaning the available evidence is insufficient to prove presence or absence at the requested lens and basis. It is not a POSIX errno. A strict mount maps it to an explicit retry/I/O failure and never to [[Glossary#ENOENT]], a missing xattr, or silent lower-priority lens fallthrough. See [[mountable-filesystem-semantics]].

## Worktree

A git worktree under a repo, used to isolate per-task work without affecting `main`. Convention: `/efs/<repo>/.worktrees/<slug>`. See [[design-system]] § /efs/ agent home and [[repo-map]].

## xattr / extended attribute

Host filesystem name/value metadata attached to a file or directory. Resolved public scalar EFS properties and fixed diagnostics can project read-only to Linux/macOS xattrs and Windows EAs under bounded `user.efs.*` names. Xattrs are not the canonical or lossless EFS property system: they cannot portably carry arbitrary keys, multi-valued claims, provenance, grades, losing candidates, or unbounded enumeration. See [[mountable-filesystem-semantics]].
