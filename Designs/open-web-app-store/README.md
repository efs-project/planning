# EFS Open Web App Store — current design spine

**Status:** draft set — proposed working baseline for owner review; no protocol, package profile, runtime ABI, catalog, or implementation is adopted
**Target repos:** planning, contracts, sdk, client
**Depends on:** [[Designs/efsv2/README]], [[Designs/web-client-os/README]]
**Inputs:** [[Designs/efsv2/hierarchical-files-and-folders]] (proposal-only `BindingScope` experiment)
**Reviewers:** @core-authority-audit (2026-08-14; boundary repair 2026-08-15), @adversarial-architecture (2026-08-14; boundary repair 2026-08-15), @external-landscape (2026-08-14), @web-client-os-pm boundary review (2026-08-15), @abi-identity-lane, @catalog-trust-lane, and @scale-evolution-lane disposable-fixture review (2026-08-22)
**Last touched:** 2026-09-04

#status/draft #kind/design #repo/planning #repo/contracts #repo/sdk #repo/client #topic/efsv2 #topic/app-model #topic/trust #topic/content

## Product direction

Build an open software ecosystem and, eventually, a polished EFS catalog/store
application on top of it. The protocol-facing layer is not one registry or one
operator's inventory. It is a **permissionless software-evidence graph**:
anyone may publish projects, immutable releases, exact dependency sets,
catalog editions, reviews, advisories, provenance, mirrors, forks, and other
claims. Users and clients choose which evidence and curators to trust.

The eventual store should feel like a real consumer app—browse, search,
compare, inspect, acquire, update, export, and recover—without making its
operator, rankings, database, or defaults protocol authority.

This set covers both:

1. generic publishing, versioning, discovery, trust, dependency, provenance,
   acquisition, update, and preservation infrastructure; and
2. a later user-facing EFS software catalog/store built over that
   infrastructure.

“Software” is intentionally broader than a full OS app. The common envelope
must support separate profiles for passive assets, locale/font/theme packs,
declarative presentation, executable Presentation modules and renderers,
confined components, full-web apps, libraries, developer tools, local tools,
agents, and remote-service connectors. One profile or runner is not presumed
to fit all of them.

## Current recommendation in one paragraph

Use a stable publisher-qualified `SoftwareProject`; immutable authored
`PackageRelease` claims over exact manifests and payload closures; a separate
canonical `ResolvedPackageSet` for the exact runnable dependency multigraph;
an evidence-only `ResolutionReceipt` explaining how that set was selected; and
immutable curator-authored `CatalogRelease` claims over exact reconstructed
`CatalogEdition` roots. Names,
rankings, channels, reviews, yanks, advisories, provenance, compatibility,
availability, and succession remain separate attributable claims. A
user-pinned update policy plus separate local anti-rollback state may borrow
TUF-style roles, thresholds, freshness, and rollback protection. OCI, IPFS,
Git, HTTP, and other systems are adapters
or evidence sources, never package identity or completeness authority. Local
installation, activation, grants, `StateBranch` contents, and state
attachments belong to the Web Client/OS.

Full model and falsifiers: [[architecture]].

## Authority map

### Owner-ratified EFS-wide boundaries

- EFS 2.0 is the active greenfield successor. V1, EFS 1.5, and the July
  Client-v2 mechanisms are historical evidence, not inherited architecture.
- Core is permissionless and generic. Commons, hosted indexes, the Web Client,
  and EFS OS are optional consumers; none may mint semantic identity or gate
  direct access.
- The direct guest Web path must work without an account, wallet prompt,
  Commons, or OS boot.
See [[Designs/efsv2/system-constitution]],
[[Designs/efsv2/owner-rulings]], and
[[Designs/efsv2/owner-decision-inbox]].

### Current constitution/B0 draft obligations

- Records, authorship, Realm admission, current selections, reader policy,
  discovery, byte verification, and execution grants remain distinct.
- Exact executable bytes verify before execution. Discovery and presentation
  do not grant execution authority.
- The current constitution/B0 drafts require enumerations to expose Realm,
  basis, coverage, cursor, and explicit completeness. Those exact ABI words,
  including `COMPLETE/PARTIAL/UNSUPPORTED/UNKNOWN`, remain proposal-only;
  incomplete evidence must still never become absence.

### Proposal-only EFS inputs

The Stage A B0 corpus proposes Type Schemas, author-neutral Records, authored
Occurrences, Realm Admissions, Principal-qualified Bindings, bounded
ResolutionPlans, automatic indexes, exact content closures, Locators,
`ArtifactRelease/1`, and inert `RuntimeRequest/1`. It has not frozen bytes,
contracts, Type IDs, index layouts, Principal/succession mechanics, Lens
grammar, or application Types. The 2026-08-13
[[Reviews/2026-08-13-efs2-stage-a-corpus/STATUS|Stage A STATUS]] records that
Stage B had not run at that checkpoint. Subsequent bounded application-layer
experiments are recorded in the 2026-08-22 Type/Data ABI pressure report linked
below; they do not establish completion of the full Stage B program, deployed
App Store functionality, or protocol conformance.

### Historical inputs retained as evidence

- [[Designs/clientv2/packages-and-updates]] contributes immutable releases,
  complete closures, local generations, rollback, capability diffs, export,
  provenance, and update-compromise requirements. Its DATA/PIN/TAG/LIST,
  registry, channel, identity, and quorum mechanics are not current.
- [[Designs/clientv2/fable-third-party-app-model-handoff]] contributes the
  multi-profile runtime research and effective-authority law. No Wasm, WIT,
  iframe, UI, runner-count, or ABI choice is adopted.
- The July claims that “lenses are channels” and zero-grant execution is
  “always safe” do not survive as current architecture.

### Proposed working baseline recorded here

This draft recommends the claim-graph + immutable `CatalogRelease` + exact
`ResolvedPackageSet` family as the working comparison baseline. James's review
of the written baseline is pending. Drafting it does not authorize promotion,
protocol freeze, Core change, production implementation, registry launch, or
runtime choice.

## Ownership boundaries

| Concern | This design set owns | Neighbor owns |
|---|---|---|
| Package semantics | Project/release identity, manifests, profiles, exact payloads, dependency requirements and resolved-set identity | Runtime implementation and host-interface behavior stay with Web Client/OS |
| Catalogs and trust | Permissionless catalog editions, curation/evidence claims, discovery completeness, update-policy inputs | Store/Shell presentation defaults and local policy UX stay with Web Client/OS |
| Installation lifecycle | Generic handoff, update candidate semantics, export/reconstruction obligations | OS-owned immutable `InstallBindingGeneration`, mutable status ledgers, activation/rollback UI, state branches, grants, sandboxing, quotas, and execution stay with [[Designs/web-client-os/README|Web Client/OS]] |
| Source and builds | Release-to-source links, provenance, rebuild/SBOM/audit evidence | Git-native identity, clone/fetch/push, source collaboration, forge workflows, and Git transport stay with Git/Forge |
| Files and presentation | Package profiles and attributable Presentation/renderer offers | File/Directory semantics stay with Files; verified handles and renderer enforcement stay with Web Client/OS |
| Product-specific meaning | Generic package/catalog/evidence shapes | Arcade, Media, Nanda, EAP, and other PMs own their application semantics |

The runtime-neutral handoff to the Web Client/OS contains exact Project,
Release, manifest, payload closure, resolved dependency set, per-activation
runtime requests and delegation map, root maximum, publisher/curator/
provenance evidence, source-qualified availability/completeness, and
update-candidate/yank/advisory evidence. Aggregate capability summaries are
display/diff evidence only. The handoff never contains effective grants or
execution authority. It also contains no OS-local preparation, install,
trust-state, grant/revocation, state, evidence-snapshot, activation, selection,
health, or instance object—including `RunnerRealization`,
`PreparedPackageSet`, `InstallBindingGeneration`, `InstallStatusLedger`,
`UpdateTrustState`, `GrantDecisionGeneration`, `GrantRevocationLedger`,
`StateBranch`, `ProfileEvidenceSnapshot`, `SystemActivationGeneration`,
`SystemActivationStatus`, or `LocalSelectionState`.

The earlier umbrella term `InstallGeneration` is obsolete because it mixed
immutable attachment identity with mutable health, completeness, instance,
update, and failure status. The current runtime split is defined by
[[Designs/web-client-os/system-profiles-and-generations#InstallBindingGeneration]];
the package/store layer does not recreate either local object.

## Requirements spine

The detailed ledger is in [[architecture#Requirements ledger]]. Its
non-negotiable themes are:

1. permissionless publication and direct addressability;
2. exact immutable release and dependency-set identities;
3. names and currentness scoped to publishers, catalogs, policies, Realms, and
   bases;
4. plural curation without a global “official” bit;
5. explicit separation among discovery, acquisition, verification,
   installation, authorization, execution, endorsement, and update authority;
6. no ambient registry/source fallback during dependency resolution;
7. optional updates that may create successor OS-local bindings and separately
   change activation/selection rather than mutate old Releases or resolved
   sets;
8. yanks/advisories as additive issuer-qualified evidence;
9. Git/build/provenance evidence without Git-derived package identity;
10. offline retention, export, mirroring, rollback, and clean-room
    reconstruction after every original service disappears;
11. honest `UNKNOWN` and finite coverage rather than hidden completeness; and
12. a common envelope with distinct runtime/data profiles.

## Documents in this set

| Document | Owns |
|---|---|
| [[architecture]] | Requirements ledger, actors/journeys, object and identity model, dependency resolution, catalogs, trust/provenance, updates, runtime handoff, profiles, architecture-family comparison, MVP, threats, Core pressure, and falsifying fixtures |
| [[owner-decision-inbox]] | Phone-readable owner queue; currently empty while research gates remain agent work |
| `README.md` | Current authority, ownership, design status, document routing, consumer inputs, and near-term sequence |

Future research, schemas, fixtures, threat analysis, and product work should
become focused documents linked here rather than expanding one permanent
mega-report.

Latest disposable evidence:
[[Reviews/2026-08-22-open-web-app-store-type-data-abi-pressure/README|Open Web App Store × layered Type/Data ABI pressure]].
Its 71-check, independently reviewed fixture found no package-specific Core gap
for this arm, but adopts no Type/View/query bytes, limits, runtime, resolver,
catalog, or production mechanism.

## Consumer pressure already incorporated

- **Arcade:** the same exact Release/closure supports guest Play and local
  install; catalog taste, effective grants, compatibility observations, and
  local install state stay outside identity. Tampered-primary rejection and
  verified fallback are mandatory.
- **EAP:** non-executable schema/profile/vector packs are first-class locked
  dependencies. Verification receipts name the exact tool, reducer, profile,
  and adapter releases, so later software cannot silently reinterpret an old
  result.
- **Nanda:** a listed connector, fetched package, verified package, installed
  connector, authorized invocation, running service, observation, and
  endorsement are different records. Hosted endpoint state stays mutable and
  outside package identity.
- **Git/Forge:** package identity never derives from repo URL, repo ID, branch,
  commit/tree/tag OID, checkpoint, or bundle digest. Exact source and rebuild
  evidence link to a Release without authorizing it.
- **SDK v2/Ethereum standards:** the dated
  [standards census at `4d3e736`](https://github.com/efs-project/planning/blob/4d3e736524ca04cdadfb26fdd628fcd206fc8084/Designs/sdkv2/ethereum-standards-census.md)
  contributes content-addressed capability/impact/dependency-manifest precedent
  and EVM deployment/proxy/content-resolution pressure. Code indexes, factory
  addresses, proxy/facet state, resolver URLs, and registry membership remain
  discovery or provenance evidence. A future EVM helper profile's preservation
  or deployment claim requires exact source/build/initcode/runtime/dependency/
  authority evidence and a local reconstruction path; no listing authorizes
  deployment, upgrade, `delegatecall`, or use.
- **Media:** passive exact media may consume independently verified ranges;
  executable content requires the full locked closure. A Presentation or
  renderer offer is evidence, not authority over the media or folder.
- **Files/Web Client/OS:** third-party Folder Presentation defaults to a scoped
  read snapshot. Selection does not grant wallet, network, write, secrets, or
  Shell authority.

## Current work sequence

1. Review and repair this current spine and [[architecture]].
2. Use the completed disposable layered-Type/Data-ABI pressure fixture as
   comparison evidence only; keep its exact bytes and limits experimental.
3. Build the next disposable resolver arm from real dependency requirements,
   while portable authorship across Realms, independent encoding, closure
   budgets, and bounded point reads remain separate gates before profile freeze.
4. Build no production registry. A later authorized product slice may use one
   finite catalog edition, direct links, one exact executable package, one
   dependency fixture, one update/advisory transition, and export/recovery.
5. Return only measured generic gaps or genuine product/permanence choices to
   James.

## Explicit non-authorizations

This draft does not authorize:

- production repositories, contracts, schemas, registries, catalogs, indexes,
  public datasets, deployments, or durable package publication;
- a canonical store operator, curator, Realm, chain, package namespace,
  signing root, search service, or update service;
- automatic updates, install/build hooks, remote executable imports, or a
  “safe” badge;
- a Wasm/WASI/WIT, iframe, JavaScript, IWA, OCI, npm, Nix, or other runtime or
  package ABI selection; or
- edits to the current Web Client/OS, efsv2, Arcade, Media, Git/Forge, Nanda, EAP,
  or Files spines without coordination with their owners.

## Pre-promotion checklist

- [ ] James reviews the written baseline and requested corrections are folded
      in.
- [ ] Every requirement traces to an owner outcome, current Core obligation,
      consumer trace, current primary source, or explicit design inference.
- [ ] `PackageRelease`, `ResolvedPackageSet`, `ResolutionReceipt`, and
      `PackageHandoff` remain non-cyclic and semantically distinct in two
      independent package implementations; OS status changes demonstrably do
      not change `InstallBindingGeneration` identity.
- [ ] Finite catalog reconstruction and search results expose basis, coverage,
      cursor, and honest completeness without a mandatory hosted index.
- [ ] Publisher and curator compromise, stale update metadata, dependency
      confusion, yanks, forks, abandonment, and steward death pass the fixed
      fixtures.
- [ ] Direct guest, Web Client/OS, Git/Forge, Files/Presentation, Arcade,
      Media, Nanda, and EAP owners review their boundary slices.
- [ ] Any proposed Core change has a generic multi-consumer failing fixture,
      measured cheaper alternatives, and an explicit falsifier.
- [ ] At least one `#status/review` pass receives another agent or human
      review.
