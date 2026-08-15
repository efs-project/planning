# Permissionless software evidence graph and store architecture

**Status:** draft — working architecture for review; no schema bytes, runtime, registry, or implementation adopted
**Target repos:** planning, contracts, sdk, client
**Depends on:** [[Designs/efsv2/README]], [[Designs/efsv2/system-constitution]], [[Designs/web-client-os/README]]
**Inputs:** [[Designs/efsv2/hierarchical-files-and-folders]] (proposal-only `BindingScope` experiment)
**Reviewers:** @core-authority-audit (2026-08-14; boundary repair 2026-08-15), @adversarial-architecture (2026-08-14; boundary repair 2026-08-15), @external-landscape (2026-08-14), @web-client-os-pm boundary review (2026-08-15)
**Last touched:** 2026-08-15

#status/draft #kind/design #repo/planning #repo/contracts #repo/sdk #repo/client #topic/efsv2 #topic/app-model #topic/trust #topic/content

## Problem

EFS needs open infrastructure for publishing, identifying, finding, curating,
acquiring, composing, trusting, updating, retaining, and forking
software-like artifacts. It also needs an eventual consumer-quality store.
Those goals are easy to collapse into a conventional registry: global names,
mutable version tags, one operator's index, one trust root, one deletion
policy, and one update channel. That would undermine permissionless
publication, exact identity, plural curation, exit, and long-term use.

The opposite failure is to call every social or discovery problem a “Lens” and
pretend the current Core candidate supplies search, ranking, completeness,
moderation, dependency solving, install authority, or runtime isolation. It
does not. B0 Lens is a bounded point-resolution candidate; Stage B has not run.

The architecture must therefore define the generic application profile above
Core, name where replaceable services are legitimate, preserve honest partial
knowledge, and hand exact inert evidence to the Web Client/OS without granting
execution authority.

## Vocabulary corrections

- **Store** names the eventual product UI, not the protocol or a canonical
  operator. The generic substrate is a software-evidence graph plus exact
  catalog editions.
- **App** is one runtime profile. Libraries, assets, Presentation modules,
  tools, agents, services, themes, fonts, and locale packs are peers rather
  than malformed apps.
- **Package** is the immutable release envelope and payload, not project
  identity, catalog identity, installation state, or a mutable name/version.
- **Lens** retains the current EFS meaning: an explicit bounded
  `ResolutionPlan` and result semantics. Search, ranking, moderation, and wide
  catalog enumeration are not renamed Lens operations.
- **Presentation** names a third-party folder/media/file UI extension. “View”
  alone is avoided where it could be confused with Lens/trust policy.

## Authority and status

This design carries owner-ratified outcomes from
[[Designs/efsv2/owner-rulings]] and requirements from
[[Designs/efsv2/system-constitution]]. It maps onto the proposal-only B0 corpus
as a pressure test. It does not adopt B0, application Type bytes, a Principal
model, a runtime, or a carrier.

The July package and OS corpus is historical evidence. Its retained outcomes
include exact closures, generation-based rollback, capability diffs,
non-ambient authority, offline export, provenance, and curator-compromise
recovery. Its exact identities, DATA/PIN/TAG/LIST mappings, registry/channel
mechanics, EOA assumptions, fixed ring map, and update constants are not live.

This draft recommends Family A as the working comparison baseline. James's
review of the written direction is pending. Promotion and implementation
remain separate gates.

## Requirements ledger

| ID | Requirement | Acceptance consequence |
|---|---|---|
| OWS-R1 | Publication is permissionless. | Any Principal may publish a Project, Release, Catalog, review, advisory, provenance claim, Locator, fork, or mirror without EFS-company approval. |
| OWS-R2 | Existence is not endorsement. | Direct links and raw evidence remain usable; catalog membership, ranking, defaults, and endorsement always name the curator/policy. |
| OWS-R3 | Project, authored Release, exact content, and installed dependency set have distinct identities. | Identical bytes may deduplicate without collapsing publisher provenance; a transitive change creates a new resolved-set identity without mutating the root Release. |
| OWS-R4 | Versions are immutable and exactly identifiable. | A manifest, requested capability ceiling, payload closure, or release-subject change creates a new Release. Labels such as `1.2.3` are testimony, never identity or global ordering. |
| OWS-R5 | Dependencies are locked before use. | Runtime never follows a bare name, range, tag, branch, URL, or ambient registry. The exact selected multigraph is independently enumerable and exportable. |
| OWS-R6 | Discovery, acquisition, verification, installation, authorization, execution, endorsement, and update authority are separate. | No transition implies the next; package declarations request ceilings and compatibility but grant nothing. |
| OWS-R7 | Catalogs and search are plural and honest. | Every result names catalog/index sources, Realm/basis, coverage, freshness, cursor, and completeness. Unknown ecosystem-wide absence is never claimed. |
| OWS-R8 | Names and namespaces cannot silently redirect dependencies. | Requirements name an exact Project plus accepted release-authority constraints; resolved Sets name exact Releases. Locators and registry URLs are acquisition evidence only. Forks, succession, or namespace transfers never retarget an existing lock. |
| OWS-R9 | Updates are optional and non-mutating. | Approving an update candidate may authorize preparation and creation of a successor OS-owned immutable install binding; activation/selection is a separate explicit decision and receipt. A combined “Update now” ceremony may commit both atomically without collapsing them. Pin, defer, reject, export, and rollback remain available; old Releases and Sets do not mutate. |
| OWS-R10 | Yanks, advisories, deprecation, succession, and compatibility are issuer-qualified evidence. | They do not erase Releases, delete retained bytes, mutate locks, globally revoke every catalog, or automatically block execution. |
| OWS-R11 | Publisher and curator compromise do not rewrite retained history. | Retained Releases, Sets, bytes, and immutable bindings referenced by the last-healthy selection survive any later compromise. Preventing a malicious new update additionally requires at least one uncompromised independently trusted policy authority plus visible authority changes, local anti-rollback state, and capability/dependency/provenance diffs. |
| OWS-R12 | Git and builds are evidence, not package identity. | A package may use zero, one, or many repos; source migration and non-Git publication do not change the stable Project. |
| OWS-R13 | Availability is distinct from integrity and identity. | Locators, custody, probes, latency, and durability observations remain plural claims; missing bytes are `UNKNOWN`/unavailable, not nonexistent. |
| OWS-R14 | Exit is a product requirement. | Users can inspect, pin, export, mirror, reseed, reconstruct, and run retained software after the original publisher, catalog, registry, forge, index, and service disappear. |
| OWS-R15 | Profiles remain distinct. | Passive assets, declarative Presentation, executable Presentation/renderers, apps, libraries, tools, agents, and remote connectors share an envelope but not one validation or runtime contract. |
| OWS-R16 | The direct guest path remains useful. | An unauthenticated user can follow an exact link, inspect and verify evidence/bytes, export or mirror, and explicitly Play where a reusable runner supports the profile—without OS boot or wallet. |
| OWS-R17 | Partial knowledge is visible. | `UNKNOWN`, `PARTIAL`, `UNSUPPORTED`, unavailable bytes, stale catalogs, and indexing errors never become empty results, “safe,” or “up to date.” |
| OWS-R18 | Hosted acceleration is replaceable. | An index, recommendation engine, catalog database, registry, gateway, or UI cache may accelerate a trace but cannot become its only reconstruction or completeness authority. |

## Actors and journeys

### Actors

| Actor | Publishes or controls | Does not automatically control |
|---|---|---|
| Project publisher | Project genesis, Release Occurrences, optional channel claims, source/provenance evidence | Catalog endorsement, user grants, execution, every mirror, or every downstream fork |
| Dependency publisher | Its own Projects and Releases | The root Project, resolver policy, or the consumer's effective grants |
| Curator/catalog publisher | Catalog Releases, membership, ordering, categories, recommendations, advisories, review policy | Project identity, package bytes, installation, execution, or global truth |
| Evidence producer | Build/rebuild, audit, compatibility, rights, SBOM, availability, or vulnerability observations | Publisher authority, safety, endorsement, or user intent |
| Mirror/carrier | Exact bytes and retrieval claims | Identity, authorship, currentness, availability elsewhere, or retention guarantee |
| Resolver | A candidate exact `ResolvedPackageSet` plus `ResolutionReceipt` | Authority to install, execute, or widen dependency sources |
| User/admin | Trusted catalogs/evidence, update policy, local grants, activation, retention, and deletion | The meaning of other actors' authored evidence |
| Web Client/OS | Verification, local policy, immutable install bindings, mutable status ledgers, grants, sandboxing, activation, rollback UX | Protocol-wide package truth or mandatory catalog defaults |
| Store/index operator | Search, browsing, recommendation, caches, moderation, and availability acceleration | Canonical completeness, identity, installation, or execution authority |

### Required journey: direct discovery

1. Follow an exact Project, Release, Catalog Release, or resolved-set link.
2. Resolve the named Realm/basis and verify the exact authored claim.
3. Show Project, immutable Release, profile, payload closure, dependencies,
   requested capability ceiling, source/provenance, advisories, availability,
   and evidence status.
4. Preserve `UNKNOWN` and partial coverage. A missing catalog or index cannot
   hide the exact link.
5. Permit fetch/verify/export/mirror. Execute only after an explicit profile
   handoff, supported runner, complete executable closure, and local grants.

### Required journey: curated discovery

1. The user or client selects one or more exact `CatalogRelease` editions and
   a presentation/ranking policy.
2. Search operates over those finite editions or a replaceable index that
   names its inputs, basis, coverage, freshness, and errors.
3. The result carries the exact underlying Project/Release IDs and curator
   claims. Conflicting catalogs remain visible.
4. Browse ordering and recommendation do not enter the install authority
   path. Acquisition resolves the same Release as a direct link.

### Required journey: install, update, and rollback

1. Resolve dependency requirements into an exact `ResolvedPackageSet`.
2. Retain the `ResolutionReceipt`, exact required-member declarations, and
   source-qualified package evidence/basis in an inert `PackageHandoff`; this
   is not local preparation status.
3. The OS separately adopts the candidate, fetches and verifies every required
   executable/passive member into local preparation status, records an
   explicit grant decision, and may create a local immutable
   `InstallBindingGeneration`; each step may stop without implying activation.
4. A channel or catalog later proposes a different immutable Release/set.
5. Review manifest, dependency, capability, source/provenance, compatibility,
   migration, yank, and advisory differences.
6. Defer, reject, or authorize preparation, a grant decision, and a successor
   binding. Separately retain or change activation/selection; a combined
   “Update now” transaction may commit both atomically but preserves distinct
   decisions and receipts. Old retained Releases, Sets, bindings, and
   last-healthy selection tuples remain exact. Data rollback is claimed only
   when the OS can restore compatible state; otherwise it reports rollback of
   bytes versus data separately.

## Architecture families considered

### Family A — permissionless claim graph plus exact sets and catalogs

Projects, Releases, exact content, resolved dependency sets, catalogs, and
evidence are independent immutable or attributable objects. Mutable channel
heads are explicit scoped selections. Catalogs publish immutable editions;
search and ranking derive from named editions and evidence.

**Strengths:** best authority separation, carrier plurality, direct links,
forking, non-executable dependencies, multiple runtimes, and walk-away exit.

**Costs:** more object types, harder indexing, explicit preservation
accounting, and consumer-side reconciliation of disagreement.

### Family B — federated TUF repositories as the primary model

Each curator/catalog is a TUF repository with a bootstrapped root and
delegated target namespaces. Clients retain selected roots and closures.

**Strengths:** mature threshold roles, delegation, consistent snapshots,
rollback/freeze defense, expiry, and mirror-independent verification.

**Costs:** repository-first identity, root bootstrap/recovery burden, expiry
operations, pressure toward a few trusted roots, and weak support for raw
permissionless evidence outside selected repositories.

### Family C — OCI/IWA-like signed offline capsules as the primary model

Executable apps are self-contained signed capsules; related evidence uses OCI
subjects/referrers or similar registry surfaces.

**Strengths:** clear executable-code closure, offline launch, familiar digest
transport, and a simple app unit.

**Costs:** signing-key identity/recovery risk, duplicate dependencies, central
store or HTTPS-update pressure, mutable tags, registry deletion/GC, incomplete
referrer enumeration, and poor fit for libraries, schema packs, and remote
connectors.

### Recommendation

Use Family A as the semantic and preservation backbone. Use TUF-style
mechanisms as an optional user-selected update/trust profile. Use signed
offline capsules as one executable package profile. Use OCI, IPFS/CAR, HTTP,
Arweave, EthStorage, and other systems as transport/export adapters. None is
the universal identity, catalog, or execution authority.

## Recommended object model

### `SoftwareProject`

A stable subject for one software lineage. Candidate EFS mapping:
`ObjectGenesis/1` or an ordinary Project genesis Record plus an authored
Occurrence. Exact identity must include the publisher-qualified genesis
reference, not merely an author-neutral body or human slug.

The Project charter may declare its purpose and initial authority profile. It
does not embed artifact bytes, catalog position, URL, rating, or “current
version.” Key rotation, managed-Principal recovery, transfer, succession, and
forks remain explicit authority/evidence transitions. Until the Principal
model is proven, an unrecognized transition yields `UNKNOWN` or a new
publisher-qualified lineage rather than silent continuity.

### `PackageManifest`

Canonical inert data for one Release. It commits:

- exact Project reference and package-profile/schema IDs;
- exact payload `ArtifactClosure` reference;
- entrypoint/member role where the profile has one;
- requested runner/profile and compatible host-interface ranges;
- exact capability-request schema and requested capability ceiling;
- dependency requirements with exact Project IDs, accepted release-authority
  domains/epochs, version-predicate schemes, environment conditions, allowed
  catalog universes, roles, and optionality;
- declared external/mutable-service boundary;
- state compatibility/migration expectations;
- required options whose change must appear in install/update review; and
- license/notice members that must travel with the package.

The manifest never contains secrets, effective grants, runtime handles,
catalog trust, a self-declared “safe” label, or a self-hash. A manifest copy
may travel inside a transport bundle, but the normative payload closure and
manifest point in one direction to avoid identity cycles.

### `PackageRelease`

An immutable authored claim connecting one Project, exact Manifest, exact
payload closure, and human version label. Candidate EFS mapping: a new
application Type following `ArtifactRelease/1`'s subject/artifact/version
separation, or an explicit composition with `ArtifactRelease/1` only if
fixtures prove its existing fields carry the exact Manifest without semantic
overloading. Publication occurs through an Occurrence.

Two identity layers remain visible:

- semantic content identity permits deduplication of identical Records and
  byte closures; and
- authored Release identity preserves publisher/Occurrence provenance.

Changing the manifest, requested capability ceiling, profile/schema ID,
payload bytes, or Project creates a new Release. Changing a Locator,
availability observation, catalog membership, review, advisory, rebuild, or
other evidence does not.

The Release commits dependency **requirements**, not a universal transitive
lock. One Release may resolve differently for explicit supported environments;
cyclic package graphs must not create Release hash cycles.

### `ArtifactClosure`

The exact package payload: a canonical ordered member set or nested closure
with unambiguous normalized relative paths, roles/kinds, sizes, and
algorithm-tagged digests or content references. Profile rules add media type,
entrypoint, executable/passive class, permissions, and other semantics not
carried by the candidate B0 closure.

Validation must define:

- path grammar and normalization;
- duplicate, Unicode/case-collision, traversal, absolute-path, device-name,
  symlink, hardlink, and special-file behavior;
- aggregate bytes, entry count, nesting, compression ratio, decompression,
  chunking, and resource limits;
- digest agility and algorithm transitions;
- which members are executable, passive, notices, schemas, vectors, or docs;
  and
- exact completeness rules before execution.

An exact closure proves required byte membership and integrity when verified.
It does not prove retention, publisher intent, safety, compatibility, rights,
or benign behavior.

### `ResolvedPackageSet`

The exact semantic unit an installer or runner consumes. It is a canonical
multigraph rather than an assumed DAG. It records:

- root Release;
- every exact Project, Release, Manifest, and payload closure;
- typed dependency edges and roles;
- cycles/strongly connected components where the profile permits them;
- peer relationships, duplicate versions, environment/platform selections,
  optional-feature choices, overrides, and import/hoisting semantics;
- all executable install/build hooks as explicit profile nodes requiring
  separate authority, never implicit resolver behavior; and
- one versioned `RuntimeRequest` for each executable activation unit, an
  explicit component/delegation map, and a root-package maximum; and
- an aggregate requested-capability summary for display and change review
  only, never as a grant input.

`ResolvedPackageSetId` hashes only the canonical selected semantic graph.
Resolver name/version, catalog history, policy, basis, and diagnostics are not
part of this identity. Two independent resolvers selecting the same exact
graph produce the same Set ID. A transitive change produces a different Set ID
without changing the root Release.

Dependency requirements name an exact `ProjectId`, accepted release-authority
domain/epoch, version predicate scheme, environment conditions, and allowed
catalog universe. Once resolved, the Set names the exact authored Release,
Manifest, and closure. Locator or registry URLs are acquisition evidence only;
they never satisfy release-authority constraints. No ambient cross-registry
fallback, bare-name search, fork substitution, namespace transfer, or
“compatible latest” occurs while running a Set.

Libraries cannot independently request runtime authority. A hook, service, or
other executable component is a separate activation unit with its own scoped
request and explicit delegation edges. Unioning transitive requests cannot
widen root authority; intersecting unrelated component requests cannot erase
valid isolation boundaries.

### `ResolutionReceipt`

Attributable evidence explaining one derivation of a
`ResolvedPackageSet`:

- resolver implementation and version;
- target environment/profile;
- dependency requirements and selected branches;
- exact catalog editions, release-authority/catalog-selection policies,
  Realm/basis, and coverage;
- yanks, advisories, conflicts, overrides, and warnings considered;
- network/carrier observations used; and
- resulting Set ID.

Receipts make resolution auditable without turning one resolver or historical
catalog state into runnable identity.

### `CatalogProject`, `CatalogRelease`, and `CatalogEdition`

A Catalog is a stable curator-qualified subject. A `CatalogRelease` is an
immutable authored claim over one exact `CatalogEdition`. An edition is
either:

- a full materialized finite-set root; or
- a delta-chain descriptor naming an exact base, mandatory predecessor,
  deterministic ordered upsert/delete semantics, bounded chain/checkpoint
  rules, and the exact reconstructed finite-set root.

Completeness applies only after the materialized root, or the entire exact
delta chain and reconstructed root, has been fetched and verified. A missing
predecessor, divergent branch, excessive chain, ambiguous operation, or root
mismatch yields `PARTIAL` or `UNKNOWN`, never a silently complete catalog. The
Release names:

- the parent Catalog and exact Edition descriptor;
- schema/profile, basis, declared coverage, and finite row count;
- memberships targeting Projects or exact Releases;
- categories, presentation metadata, ordering, and recommendation claims;
- references to advisories, compatibility, rights, provenance, or review
  inputs the curator considered; and
- the exact materialized snapshot or delta-chain closures.

A Principal-qualified Binding may select the curator's current Catalog
edition. The Binding is a discovery/currentness claim, not the identity of any
member Release and not update authority.

Permissionless individual membership/review Occurrences may coexist with
Catalog snapshots. A catalog snapshot gives exact finite completeness for what
that curator published in that edition; it never proves “all EFS software” or
all claims about a package.

Large catalogs should use immutable snapshots plus bounded, checkpointed
deltas and independently rebuildable search indexes rather than one Binding
per mutable entry. Search inputs name the verified reconstructed Edition root,
never a bare delta or hosted materializer. A live per-position catalog requires
the Files proposal's unproven `BindingScope` experiment—not current B0/Core—or
another measured generic solution.

### Evidence objects

All evidence is separately authored and targets the narrowest exact subject:

- publisher/authority, fork, predecessor, transfer, and succession claims;
- source links, build recipes/toolchains, in-toto/SLSA provenance, Sigstore
  bundles, SBOMs, license/rights, audits, and rebuild observations;
- compatibility and conformance results naming exact runner/client/browser,
  environment, test vectors, basis/date, result, and limitations;
- reviews, moderation, abuse reports, recommendations, and rankings;
- advisories, yanks, deprecation, quarantine, affected exact Releases or named
  version-scheme ranges, status, evidence, and supersession;
- Locators, custody, placement, retrieval, latency, corruption, availability,
  and durability observations; and
- service endpoint, domain-control, API/runtime version, incidents, regions,
  authentication shape, and data-handling observations.

“Signed,” “has provenance,” “has an SBOM,” “reproducible once,” and
“recommended by catalog C” never collapse into “safe,” “true,” “available,” or
“authorized.” Missing or unverifiable evidence stays `UNKNOWN`.

### `UpdateTrustPolicy`

A user/admin-selected, versioned policy for deciding whether a discovered
candidate may be offered or automatically staged. It may borrow:

- offline root versus online release roles;
- threshold signatures and delegated scopes;
- authority epochs, rotation, and recovery;
- consistent snapshots and rollback/mix-and-match/freeze defenses;
- freshness/expiry and cooldown requirements;
- independent curator, provenance, rebuild, or advisory conditions; and
- explicit capability/dependency/publisher/source change gates.

The exact root and policy are exportable local inputs. No EFS-company root is
mandatory. A stale or unavailable policy blocks new update confidence and
produces `UNKNOWN`; it does not disable already retained software. Following a
publisher or curator channel discovers candidates but grants no update or
execution authority.

### Local `UpdateTrustState`

Owned by the user agent/Web Client/OS and mutable only as local policy state.
It records the last accepted channel/catalog revision, Realm/Plan/basis,
authority epoch, freshness/expiry checkpoint, trusted metadata hashes, and
other monotonic anti-rollback observations for one exact `UpdateTrustPolicy`.
Policy and state are exportable together but remain different objects.

Missing or lost state yields TOFU/`UNKNOWN` and forbids automatic staging; it
does not manufacture evidence that a candidate is old or malicious. Retained
Releases, Sets, bytes, and immutable local bindings referenced by the
last-healthy selection remain usable after any publisher or curator
compromise.
Preventing adoption of a malicious new candidate requires at least one
uncompromised independently trusted policy authority; no data model can save a
policy whose entire authorized trust base is compromised.

### OS-owned install binding and status

The package/store layer stops at the inert `PackageHandoff`. The earlier local
`InstallGeneration` wording is obsolete umbrella terminology: it combined an
immutable attachment identity with mutable completeness, health, instance,
update, migration, and failure observations.

The current [[Designs/web-client-os/system-profiles-and-generations#InstallBindingGeneration|Web Client/OS refinement]]
keeps those lifecycles separate:

- `InstallBindingGeneration` is an immutable **local** binding of an exact
  Release/Set to the OS-selected `RunnerRealization`, immutable grant decision,
  configuration and compatibility contracts, migration identities,
  activation-unit identity, and state-attachment digest. It is neither public
  package identity nor evidence that anything is healthy or running.
- `InstallStatusLedger` carries mutable prepared/retained-byte completeness,
  current health observations, runtime instances, update candidates, failures,
  and teardown progress. A status change never changes install-binding
  identity.
- `UpdateTrustState`, state-branch contents/heads, grant revocation, evidence
  snapshots, and coherent system activation/selection keep their own
  identities and lifecycles rather than being folded into either object.

Neither local object appears in `PackageHandoff`. `PackageHandoff` and
`InstallStatusLedger` grant no authority; `InstallBindingGeneration` merely
references a separately authorized OS-local `GrantDecisionGeneration` and
never self-activates or alone creates effective authority. Creating a
successor binding or changing activation/selection never mutates the Release
or Set. Binary rollback and application-data rollback remain distinct: the OS
snapshots or branches mutable state, supplies a tested reverse migration, or
reports that data rollback is unsupported.

## Names, namespaces, forks, and succession

- Human names and slugs are scoped aliases published by a publisher, catalog,
  user petname set, ENS-like service, or other named source.
- Direct links use exact IDs. UI always exposes the qualifying publisher or
  curator where ambiguity matters.
- A dependency requirement names an exact Project plus accepted
  release-authority domain/epoch and catalog-selection policy. A display name,
  Locator, registry URL, or transport never chooses dependency authority.
- A namespace transfer or maintainer succession is evidence under an explicit
  authority epoch. Existing Releases, resolved Sets, grants, and catalogs do
  not retarget.
- A fork gets a new Project identity with explicit predecessor/source/license
  evidence. It cannot inherit publisher identity, grants, endorsements,
  channel followers, or update authority automatically.
- Abandonment is a condition evidenced by time/policy/failed contact or an
  explicit claim, not a global protocol fact. Curators may recommend maintained
  forks without rewriting the abandoned Project.

## Package profiles

One envelope carries exact identity and evidence. Each profile defines its own
validation, compatibility, entrypoint, requested-capability vocabulary,
closure-completeness rule, and runtime interpretation.

| Profile family | Default interpretation |
|---|---|
| Passive exact asset | No executable authority. Exact bytes, size, media type/role, optional chunks/ranges, and presentation safety policy. Fonts, themes, CSS, and complex parsers are not assumed harmless merely because they are “passive.” |
| Declarative Presentation | Versioned declarations/options over named input profiles. No code, external fetch, private-library access, trust-policy authority, or ability to hide provenance/safety/UNKNOWN chrome. |
| Executable Presentation or renderer | Complete exact executable closure, runtime profile, capability ceiling, compatible input profiles, resource budgets, and test evidence. Receives verified handles, not raw Locators. |
| Confined component/app | Complete closure; versioned host-interface profile; no ambient DOM, network, wallet, secrets, storage, signing, or EFS data. |
| Full-web app | Complete committed local code where the profile promises preserved execution; opaque-origin/sandbox behavior and message capabilities are runtime concerns. Mutable remote executable imports invalidate strict preserved-closure claims. |
| Library/dependency | No automatic execution. Build/install hooks are separately declared executable nodes and require a runner/grant. |
| Tool or local service/agent | Exact executable set plus explicit compute, storage, network, secret, signing, and inter-process requests. Installation starts disabled. |
| Remote-service connector | Exact local schema/connector/skill closure; provider endpoint, API/model/runtime version, uptime, incidents, scopes, and data handling remain mutable observations. “Installed” means the connector is present, not the provider is running. |
| Schema/profile/vector pack | First-class exact non-executable dependency used for reproducibility and conformance. Packaging it does not ratify its application semantics. |

Passive media may be decoded from independently verified ranges under a
profile that authenticates each released interval. Executable packages require
their full locked executable closure before launch. Live transform output is
session-derived data until deliberately retained, hashed, and published as a
new exact representation.

## Runtime-neutral handoff

The package/store layer supplies an inert `PackageHandoff` containing:

- publisher-qualified Project and authored immutable Release references;
- canonical Manifest and package-profile/capability-schema IDs;
- exact payload closure, required-member declarations, and source-qualified
  closure/completeness evidence—not the OS-local fetched/verified bitset;
- exact `ResolvedPackageSet`, per-activation-unit `RuntimeRequest`s, component
  and delegation map, root-package maximum, and aggregate display/diff
  summary;
- relevant `ResolutionReceipt`;
- publisher Occurrence and Realm admission/basis evidence;
- selected Catalog edition/membership/curator policy and alternate/direct-link
  evidence;
- provenance, SBOM/rights, rebuild, compatibility, yank, advisory, succession,
  and update-candidate evidence with verification status;
- plural Locators and source-qualified availability/durability observations;
  and
- explicit discovery/evidence `COMPLETE/PARTIAL/UNKNOWN/UNSUPPORTED` status and
  coverage, distinct from local preparation or retained-byte status.

It excludes effective grants, local secrets, wallet/persona, filesystem
handles, execution authority, and every OS-local preparation, install,
trust-state, grant/revocation, state, evidence-snapshot, activation, selection,
health, or instance object—including `RunnerRealization`,
`PreparedPackageSet`, `InstallBindingGeneration`, `InstallStatusLedger`,
`UpdateTrustState`, `GrantDecisionGeneration`, `GrantRevocationLedger`,
`StateBranch`, `ProfileEvidenceSnapshot`, `SystemActivationGeneration`,
`SystemActivationStatus`, and `LocalSelectionState`.

The runtime must guarantee:

1. no code or install/build hook executes during discovery, fetching, or inert
   installation;
2. execution requires supported versioned profile semantics, verified required
   closure, explicit Play/Launch, and local grants;
3. the package layer defines only request and delegation ceilings; the OS owns
   effective authority and evaluates every capability call against the exact
   scoped request, runner/profile ceiling, root maximum and delegation map,
   client policy, immutable `GrantDecisionGeneration`, current
   `GrantRevocationLedger`, activation/session epoch, budgets, and platform
   support; the aggregate summary is never a grant input, and an
   `InstallBindingGeneration` only names the applicable decision rather than
   becoming an effective grant;
4. grants scope to the exact Release/Set/profile and do not silently follow an
   update, fork, identical bytes, or authority succession;
5. unknown capability dimensions deny rather than acquire new meaning;
6. no ambient network, wallet, signing, secrets, EFS write, storage, folder,
   DOM, or Shell authority;
7. old exact Releases/Sets and retained bytes remain exact; eligible OS-local
   bindings remain available for later activation, and activation selections
   remain exact and selectable;
8. resource isolation, quotas, revocation, spoof-resistant chrome, and browser
   exploit residuals remain explicit runtime work—zero EFS grants is not a
   universal safety proof; and
9. the direct guest client can inspect, verify, fetch/export/mirror, and where
   supported explicitly Play without OS boot.

## Folder Presentation and content handlers

A `PresentationOffer` is an authored discovery/compatibility claim. It names:

- stable Presentation Project and exact tested Release;
- target Folder/File/media/input profiles and versions;
- declarative versus executable class;
- runner, capability, and resource requests;
- options/schema; and
- exact compatibility/conformance evidence.

The offer cannot self-install, select itself as default, grant capabilities,
or become Lens authority. A user or trusted curator may recommend it; the
client resolves that recommendation under explicit policy and still performs
normal package verification and local authorization.

A declarative Presentation receives only OS-owned scoped data and rendering
facilities. CSS or theme data is sanitized and confined from external URLs,
Shell chrome, hidden security states, and unrelated documents. An executable
Presentation receives a scoped read snapshot or handle for the selected folder
or object. Network, wallet, secrets, signing, and writes remain separately
granted and default denied.

## Catalog discovery, ranking, moderation, and spam

### Honest completeness

- A direct exact link is complete for the named object only after its exact
  evidence and bytes meet the requested grade.
- A `CatalogRelease` is complete only for the finite rows committed by its
  verified reconstructed `CatalogEdition` root.
- An index is complete only for its declared input editions/Realms/bases and
  successfully indexed ranges.
- No result may claim all EFS packages, publishers, Realms, reviews, or
  advisories unless the universe is explicitly finite and proven.
- `PARTIAL(cursor)` and `UNKNOWN` cannot become empty search, 404, no advisory,
  safe, or current.

### Search and ranking

Full text, prefix search, facets, global sorting, recommendations, similarity,
trending, review aggregation, and spam scoring are derived operations. A
search result contract includes:

- index/provider and operator identity;
- exact Catalog editions, Realms, bases, schemas, and policy inputs;
- query/ranker version and parameters;
- indexed range, freshness, errors, and coverage;
- exact underlying Project/Release IDs and evidence references;
- deterministic stable cursor/tie-break state; and
- a no-index path to direct links and exact catalog snapshots.

Curators can publish competing rankings, blocklists, allowlists, categories,
and moderation policies. Users may compose them locally. No moderation Lens
deletes raw evidence or governs every independent gateway.

### Spam and economics

Permissionless publication permits squatting, typosquatting, dependency
confusion attempts, forged backlinks, duplicated manifests, review spam,
Locator spray, and advisory spam. Defense belongs to layered economics and
curation:

- exact Project, release-authority, and allowed-catalog constraints in
  dependency requirements;
- curator/catalog admission and rate/cost policies;
- separately priced publication versus indexing/serving;
- bounded pages, physical scan caps, resumable cursors, and anti-amplification
  limits;
- client-local block/mute and actor/evidence-source policies;
- independently publishable abuse evidence; and
- replaceable indexes built from exact catalog inputs.

Core must remain usable under hostile claims without pretending to make them
desirable or globally searchable.

## Provenance, Git/Forge, and reproducible builds

`ExactSourceRef` identifies an exact source closure and optional foreign
revision. A Git specialization names repo identity, algorithm-tagged object
format/OID, object kind, and optional raw subpath. A tag object and peeled
target remain separate.

`BuildAttestation` binds exact source, build recipe, locked toolchain and
dependency inputs, and exact output closure. `RebuildObservation` reports
independent exact-match, mismatch, resource abort, or unknown with retained
logs/evidence. `ReleaseSourceLink` connects these claims to the exact Package
Release.

Package identity never derives from a repository URL, repo ID, branch, commit,
tree, tag, checkpoint, bundle digest, CI job, or forge release page. This
preserves monorepo packages, multi-repo builds, generated/non-Git inputs,
repository migration, and multiple outputs from one commit.

Portable export includes source/build/rebuild evidence and exact bytes or
honest missing-byte state. A “source preserved” claim additionally requires a
self-contained recovery set; a live forge is not enough.

## Availability, retention, export, and reconstruction

Locators are separately authored claims that exact content may be fetched at
a URI/carrier position. Different URLs are mirrors only if they yield the same
exact content. Locator priority, health, latency, custody, and probe results are
policy/evidence, not identity.

An installation or preservation export includes:

- Project, Release, Manifest, Set, Catalog, evidence, and Type/schema records;
- original authored Occurrences and exact Realm/basis/recognition evidence;
- selected trust/update roots and last-known metadata;
- every retained exact payload/dependency/source/evidence closure;
- plural Locators and explicit missing-byte/coverage state;
- resolver/profile identifiers and conformance vectors; and
- enough information for an independent implementation to verify and reseed
  without logs, the original registry, or an EFS-operated database.

Install-time retention creates a preservation root for the complete exact Set.
Browser cache eviction must remain visible and cannot turn bytes into semantic
absence. Users may export to ordinary files/CAR/OCI/bundle transports without
making that transport canonical.

Publisher, catalog, index, registry, or steward death makes future updates
stale/`UNKNOWN`; it does not mutate retained Releases, Sets, bytes, or local
bindings.

## Update, yank, advisory, and compromise behavior

### Update discovery

A publisher or curator may maintain a Principal-qualified Binding at an
application-defined release-head position. A reader resolves one or more such
heads through its own pinned Plan at an explicit Realm/basis. “Channel” is
application-profile vocabulary, not a Core or Lens primitive. “Latest” is
never global or timestamp-derived. The client compares the candidate against
the currently selected exact Release/Set and OS-local binding.

### Update review

Review includes:

- publisher/release-authority epoch, catalog-selection policy, and acquisition
  Locator changes;
- Manifest, payload, and exact dependency-set changes;
- requested capability and external-endpoint changes;
- profile/runner/schema and compatibility changes;
- source/build/provenance/rebuild/SBOM/rights changes;
- advisories, yanks, deprecation, and curator disagreement; and
- application-state migration and rollback support.

Capability broadening, unknown capability schemas, executable build/install
hooks, new dependency sources, publisher succession, and mutable remote-code
boundaries are blocking diffs by default.

### Compromise

- **Publisher compromised:** the attacker can publish new authored claims but
  cannot mutate old IDs, retained Sets/bytes, or OS-local bindings. Thresholds,
  cooldown/freshness, independent evidence, local `UpdateTrustState`, and
  explicit authority-change diffs can bound adoption only while at least one
  independently trusted policy authority remains uncompromised.
- **Curator compromised:** recommendations and channel heads may change, but
  package identity, retained Sets/bytes, local bindings/grants, and other
  catalogs do not.
- **Registry/index compromised:** corrupt/missing bytes fail exact verification;
  search becomes suspect/partial; direct IDs, retained data, and alternate
  carriers remain usable.
- **Advisory issuer compromised:** conflicting issuer-qualified evidence is
  visible; local policy decides execution. No advisory silently erases bytes.
- **Central certificate or log unavailable:** retained install-time evidence
  remains verifiable where its scheme supports it. Present-time service expiry
  does not automatically terminate execution.

## Current primary-source landscape and failure lessons

Checked 2026-08-14 against the versioned or dated primary sources linked
below. “Documented mechanism” summarizes source facts. “EFS transfer” and “EFS
trap” are design inferences; none is a source claim or an adopted EFS rule.

| Primary source | Documented mechanism | EFS transfer (inference) | EFS trap (inference) |
|---|---|---|---|
| [TUF 1.0.36](https://theupdateframework.github.io/specification/v1.0.36/index.html) / [Uptane 2.1.0](https://uptane.org/docs/2.1.0/deployment/best-practices) | Threshold roots, delegated roles, consistent snapshots, rollback/freeze defenses, mirror-independent verification, and distinct release/device policy roles | User-selected threshold/delegation profiles plus separate local anti-rollback state | A repository root becoming universal authority; expiry disabling installed software; a centralized director/inventory becoming mandatory |
| [SLSA artifact verification 1.2](https://slsa.dev/spec/v1.2/verifying-artifacts), [in-toto Attestation 1.2.0](https://github.com/in-toto/attestation/blob/v1.2.0/spec/v1/statement.md), [Sigstore bundles](https://docs.sigstore.dev/about/bundle/) | Digest-subject, predicate-typed attestations; bundles containing later/offline verification inputs; verification of expected source, builder, and external parameters | Plural typed evidence targeting exact Releases and build outputs | Treating a signature, SBOM, or provenance statement as safety or endorsement |
| [SPDX 3.0.1](https://spdx.github.io/spdx-spec/v3.0.1/) / [CycloneDX 1.7](https://cyclonedx.org/specification/overview/) | Standardized component, relationship, dependency, build/provenance, and security metadata; CycloneDX additionally models services | Import/export evidence profiles rather than a new EFS identity layer | Making either format package identity or assuming supplied evidence is complete or true |
| [OCI Distribution 1.1.1](https://specs.opencontainers.org/distribution-spec/?v=v1.1.1) | Content-type-agnostic manifests/blobs, digest/size/media descriptors, and subject/referrer discovery | OCI as a payload/evidence transport adapter | Mutable tags, optional deletion/non-retention, fallback-tag update races, registry-scoped rather than ecosystem-complete referrer discovery, and URL-based identity |
| [Nix store objects](https://nix.dev/manual/nix/2.35/store/store-object.html), [GC roots](https://nix.dev/manual/nix/2.35/package-management/garbage-collector-roots.html), [Guix channel authentication 1.5.0](https://guix.gnu.org/manual/1.5.0/en/html_node/Channel-Authentication.html) | Immutable store-local reference closures and GC roots; generation/rollback patterns; authenticated channel lineage | Exact locked sets, explicit preservation roots, retained generations, and authenticated update-policy options | Treating store paths as globally portable content IDs, importing experimental tooling as identity, or blocking installed execution on update-history availability |
| [Isolated Web Apps](https://developer.chrome.com/docs/iwa/introduction) | Signed offline packaging of required web resources, bundle-only JavaScript, a key-derived isolated origin, and permission declarations that permit requests without granting them | Packaged-code, isolation, and capability-ceiling patterns for one executable profile | Single-key identity without recovery, dependence on an HTTPS-hosted update manifest, initial production installation limited to managed ChromeOS/select partners, and documented remotely sourced Wasm |
| [IPFS content addressing](https://docs.ipfs.tech/concepts/content-addressing/), [persistence](https://docs.ipfs.tech/concepts/persistence/), and [CAR v1](https://ipld.io/specs/transport/car/carv1/) | Content-addressed identifiers, explicit persistence/pinning obligations, and portable archive framing | Carrier-independent byte references, export, and reseeding adapters | Treating a CID as availability, publisher authenticity, endorsement, or permanence |

The following primary-source facts motivate EFS acceptance-test inferences;
they do not prove those architectural rules:

- npm's [left-pad incident](https://blog.npmjs.org/post/141577284765/kik-left-pad-and-npm)
  documents author-initiated unpublishing that made an exact transitive
  dependency unavailable until npm restored it from backup. **EFS acceptance
  test:** publisher or catalog removal must not make an already materialized
  dependency closure unavailable or non-exportable.
- npm's [event-stream incident](https://blog.npmjs.org/post/180565383195/details-about-the-event-stream-incident)
  documents a socially engineered maintainer takeover that introduced a
  malicious direct dependency targeting Copay builds. **EFS acceptance test:**
  current publisher authorization alone is not evidence of benignity;
  dependency and capability changes require separately visible policy review.
- Mozilla's [expired add-on certificate report](https://wiki.mozilla.org/index.php?title=Add-ons/Expired-Certificate-Technical-Report&oldid=1214987)
  documents intermediate-certificate expiry plus runtime date checking
  disabling almost all deployed add-ons for millions of users. **EFS
  acceptance test:** certificate expiry alone must not retroactively disable
  validly installed software; any later execution block is an explicit policy
  decision.
- PyTorch's [torchtriton advisory](https://pytorch.org/blog/compromised-nightly-dependency/)
  documents pip selecting a malicious PyPI package that shared the name of a
  package on PyTorch's nightly index because PyPI took precedence. **EFS
  acceptance test:** dependency identity binds release authority and immutable
  content, and multi-source resolution never silently substitutes a bare name.
- crates.io's [malware postmortem](https://blog.rust-lang.org/inside-rust/2023/09/01/crates-io-malware-postmortem/)
  documents nine typosquat crates containing malicious `build.rs` files that
  attempted metadata exfiltration. **EFS acceptance test:** discovery and
  download remain non-executing; any build or install hook requires separate
  explicit execution authority.
- Debian's [xz advisory](https://lists.debian.org/debian-security-announce/2024/msg00057.html)
  documents compromised upstream source tarballs injecting malicious code
  into `liblzma5` at build time. **EFS acceptance test:** distribution through
  an expected upstream channel is not evidence of benignity; build provenance
  and independent review remain evidence layers, and runtime confinement is a
  separate policy layer.
- PyPI's [2026 LiteLLM/Telnyx report](https://blog.pypi.org/posts/2026-04-02-incident-report-litellm-telnyx-supply-chain-attack/)
  documents malicious releases reaching unpinned consumers before quarantine,
  including more than 119,000 LiteLLM downloads during a 2-hour-32-minute
  exposure window. **EFS acceptance test:** mutable-latest selection requires
  explicit policy, locking, or a cooldown; rapid central quarantine is not
  preventive authorization.

## EFS v2 mapping and pressure

All mappings are candidate/B0 hypotheses, not adopted protocol:

| Need | Candidate EFS expression | Residual work |
|---|---|---|
| Stable Project | `ObjectGenesis/1` or ordinary genesis Record + authored Occurrence | Exact publisher-qualified identity and managed-Principal/succession behavior |
| Release/Manifest | New application Type following `ArtifactRelease/1`'s separation, or fixture-proven explicit composition with it, plus Occurrence | Existing `ArtifactRelease/1` has no first-class Manifest field; canonical package fields, composition, version/profile schemas, and identity vectors remain open |
| Exact bytes | `ByteDigest/1`, `ChunkTree/1`, `ArtifactClosure/1`, `RepresentationBinding/1` | Realistic closure bounds, media/permission fields, path/resource profile |
| Authorship | Publication envelope/Occurrence | Portable versus Realm-bound envelope decision and mirror/replay vectors |
| Realm recognition | `AdmissionReceipt` | Exact bytes, source-unavailable `UNKNOWN`, destination-recognition profile |
| Catalog head/channel | Principal-qualified Binding at explicit basis | No global latest; curator withdrawal/tombstone and succession profile |
| Bounded trust selection | `ResolutionPlan/1` and Lens result | Point operations only; no search/rank/moderation/install magic |
| Catalog/evidence discovery | Type, Record, Principal, backlink, digest, and Binding indexes | Aggregate cost, spam degradation, finite page completion, author+target intersections |
| Catalog snapshot/set | Application Record plus exact content closure | Canonical snapshot/delta and multigraph encodings; independent implementations |
| Locators/availability | `Locator/1` plus observations | Locator scoring/rotation and availability semantics above Core |
| Runtime request | inert `RuntimeRequest/1` | Profile-specific vocabulary; unknown dimensions deny; OS enforcement |

### No proven Core change

Current evidence supports application Types over the candidate mandatory Core
index bundle, plus replaceable derived search/ranking indexes, before any
package-specific Core addition. Current Lens cannot and should not perform
global search, ranking, moderation, dependency solving, availability judgment,
install, grants, or execution.

Two conditional generic seams require Stage B fixtures:

1. **Portable authorship:** mirroring and steward-death recovery need the
   original authored claim to remain verifiable independently of destination
   Realm admission. If Core selects a Realm-bound envelope that cannot provide
   this, packages, Git, EAP, and media provenance need either a generic signed
   claim envelope or a genuine Core finding.
2. **Finite catalog reconstruction:** pages over known Catalog editions,
   Type/backlink indexes, and one catalog-head Binding must expose pinned
   basis, physical scan bounds, cursor, and honest completion under spam. If a
   required live position-key set cannot be known/rebuilt, compare snapshot
   closures and the Files proposal's unproven `BindingScope` experiment—not
   current B0/Core—before escalating.

The candidate B0 limit of 16 members per closure Record, separate client
walk-depth-16 bound, 64-Principal Lens, index bundle cost, locator scoring, and
Realm profiles remain unmeasured. The structural closure DAG itself may be
arbitrarily deep; the client walk bound is the proposed safety limit.

## Candidate product MVP

The MVP is a reversible product and conformance skeleton, not a public
registry or production implementation authorization. It deliberately proves
only the identity/catalog spine before the broader profile program.

### Smallest required slice

- One Project and one immutable R1 whose executable code is self-contained,
  plus one exact locked non-executable data/profile dependency in its
  `ResolvedPackageSet`.
- One full materialized `CatalogEdition`, one curator-authored
  `CatalogRelease`, and one direct exact R1 link that resolves without the
  catalog/index.
- Exact closure fetching through two Locators with corruption/mismatch
  rejection and verified fallback.
- One exact advisory and one R2 update transition, showing immutable R1,
  dependency/capability/provenance diff, defer/accept, and retained rollback.
- One inspect/fetch/verify/export flow and an optional inert Web Client/OS
  handoff; no execution is necessary to prove the generic package layer.
- Export/import of the exact catalog, package, dependency, evidence, and bytes,
  followed by clean reconstruction with the original service and index gone.

### MVP product surface

- a polished finite catalog page and release dossier with exact IDs,
  publisher/curator distinctions, manifest,
  requested capabilities, dependency set, provenance, compatibility,
  advisories, availability, and honest completeness;
- a direct-link/raw-evidence view of the same byte-identical R1;
- explicit fetch/verify/export/mirror; and
- the R2 update diff and optional Play/Install handoff to the Web Client/OS.

### Product MVP exclusions

- auto-update enabled by default;
- arbitrary build/install scripts;
- global package-name allocation;
- universal search/completeness claims;
- canonical catalog, curator, ranker, index, signing root, registry, carrier,
  or Realm;
- public production packages or a durable seed corpus;
- mutable remote executable imports under a preserved-execution profile;
- full social/review/reputation economics; and
- a frozen runtime ABI or one-profile-for-everything package format.

## Conformance research program

The following multi-consumer work is not the product MVP. It begins only after
the common identity mutation matrix and full-edition catalog reconstruction
fixtures pass. Each profile can falsify the shared envelope without forcing
its runtime semantics into that envelope.

### Consumer fixtures, not necessarily shipped catalog items

- **Arcade one-member executable:** zero-dependency active closure, two
  Locators, corrupt primary, verified fallback, guest Play and exact install.
- **EAP Inspector graph:** executable tool, verifier library, schema/profile
  pack, conformance vectors, optional carrier adapter, generic libraries, and
  static assets. Proves typed non-executable dependencies and transitive
  advisory receipts.
- **Nanda Signed Echo connector:** frozen schema/contract package and mutable
  provider endpoint. Proves listed/fetched/verified/installed/authorized/
  running/observed/endorsed separation.
- **Folder Presentation:** declarative and executable alternatives over one
  selected folder snapshot; attempts network, wallet, write, secrets, and
  Shell spoofing with no implicit grant.

## Falsifying fixture program

| Fixture | Pass condition | Redesign trigger |
|---|---|---|
| Identity mutation matrix | Manifest/capability/payload/Project change creates new Release; Locator/provenance/review change does not; transitive change creates new Set only | Mutable version, self-hash cycle, or authored provenance collapse |
| Catalog plurality | Direct link and two conflicting catalogs resolve the same exact Releases; each edition has finite scoped completeness | Global official/latest bit, catalog removal breaks direct access, or hosted DB becomes only source |
| Catalog scale/spam | Rebuild 100k-entry catalog after curator/index disappearance amid one million forged backlinks with bounded pages and honest coverage | Global history scan, hidden completeness service, or unaffordable mandatory writer fan-out |
| Dependency scale | TS and Rust resolve a 10k-node multigraph with cycles, peers, platforms, duplicate versions, typosquats, dependency confusion, yank, fork, corrupt primary, and good mirror to the same Set ID | Name/range execution, silent source fallback, non-deterministic Set identity, or unbounded traversal |
| Publisher/curator compromise | Conflicting/stale heads across two Realms do not silently update; the recoverable last-healthy selection can still activate its retained exact Set and immutable bindings; authority and capability diffs are visible; a still-independent policy authority blocks the malicious candidate | Compromise mutates installed software/grants, or the design claims to prevent malicious updates after its whole authorized trust base is lost |
| Update/state rollback | Update may stop after preparation, grant decision, or a successor immutable `InstallBindingGeneration`; a separate activation/selection decision has its own receipt, byte rollback works, and mutable-state restore works or is honestly unsupported | Existing Release/binding mutates, status changes binding identity, an earlier stage implies activation, the old binding disappears, or data loss is labeled rollback success |
| Steward death | Publisher, curator, registry, forge, and original Locators disappear; exported exact Set remains inspectable, verifiable, runnable, and reseedable; updates become stale/UNKNOWN | Mandatory operator, live forge, or registry required for use/reconstruction |
| Provenance rebuild | Exact Git/non-Git source, recipe, toolchain, and inputs reproduce or explicitly mismatch output without becoming publisher authority | “Signed/reproducible” becomes safe/official or Git identity becomes package identity |
| Path/resource attack | Independent validators reject traversal, Unicode/case collisions, symlinks, special files, decompression bombs, oversized graphs, and malformed closures identically | Runner-dependent meaning or resource exhaustion before rejection |
| Folder Presentation authority | Selection changes presentation only; no wallet/network/write/secret/Shell authority; update capability diff blocks widening | Discovery, compatibility, or curator recommendation becomes a grant |
| Direct guest | Clean browser opens exact link, verifies/exports, and explicitly Plays supported exact closure without account/wallet/Commons/OS | Guest path boots OS, requires canonical index, hides basis, or executes before verification |

A package profile requiring a custom package-specific Core contract or private
index to pass these fixtures triggers redesign. Any Core proposal must name the
generic missing capability, multiple consumers, cheaper alternatives, exact
measurement, and the result that would falsify the proposed primitive.

## Threat model summary

| Threat | Required response |
|---|---|
| Name squatting/typosquatting/dependency confusion | Exact Project/release-authority/catalog policy, curator warnings, no ambient resolver fallback, explicit namespace evidence |
| Malicious or compromised publisher | Immutable old releases, threshold/recovery/update policy, local anti-rollback state, cooldown/freshness, dependency/capability/provenance diffs, local grants; malicious-update prevention is conditional on an uncompromised policy authority |
| Malicious or compromised curator | Plural catalogs, exact direct links, user-pinned policy, no catalog-to-install authority, exportable catalog editions |
| Malicious registry/index/gateway | Exact verification, alternate carriers, honest coverage/errors, reconstructible snapshots, no URL identity |
| Malicious dependency/build hook | Non-executing install, explicit hook nodes/profiles, separate grant, closure/resource inspection |
| Advisory/yank abuse | Issuer-qualified conflicting evidence, no byte deletion, local execution policy, exact-target preference |
| Stale/frozen update metadata | Monotonic last-seen state, freshness UNKNOWN, no silent rollback, retained execution unaffected |
| Browser/runtime exploit or DoS | OS isolation, quotas, revocation, versioned profiles, no zero-grant safety overclaim |
| Presentation spoofing/data exfiltration | OS-owned security chrome, scoped handles, CSS sanitization, no external URLs/ambient network, deny unknown capabilities |
| Storage/operator death | Local preservation root, export/mirror/reseed, plural Locators, clean-room reconstruction |
| Privacy leakage | Do not publish private install state, grants, progress, paths, secrets, personal catalogs, or provider credentials by default |

## Open questions and evidence gates

- [ ] **Canonical Set encoding:** two independent TS/Rust implementations must
      agree on multigraph, cycle, peer, optional/platform, duplicate-version,
      and import/hoisting vectors before any Set bytes are proposed for freeze.
- [ ] **Portable authorship:** Stage B must compare portable and Realm-bound
      envelopes by mirroring one Release and provenance claim into a second
      Realm while preserving source authorship and distinct destination
      recognition.
- [ ] **Catalog reconstruction:** the 100k + one-million-spam fixture must
      compare immutable snapshot/delta closures, current Type/backlink pages,
      and the Files proposal's unproven `BindingScope` experiment—not current
      B0/Core—before a Core request.
- [ ] **Update trust profile:** threshold roles, authority epochs, recovery,
      freshness, cooldown, last-seen state, and evidence requirements need
      exact threat-driven vectors; no universal launch constants are assumed.
- [ ] **Profile vocabulary:** capability-schema and runtime-profile IDs,
      unknown-field denial, passive versus active closure, remote-service
      boundary, and Presentation confinement need executable conformance tests.
- [ ] **State rollback:** cross-design fixtures must prove how an immutable
      `InstallBindingGeneration` state attachment, separate mutable
      `StateBranch`, and coherent activation/selection report byte-only versus
      full data rollback without status rewriting identity.
- [ ] **Economics:** measure the aggregate package Type/index/Binding/Lens,
      catalog snapshot, spam, resolver, evidence, byte, and reconstruction
      bundle—not one cheap operation—before choosing Core or hosted placement.

These are engineering/research gates, not current James decisions. Escalate
only when evidence leaves materially different viable products or a
permanence commitment that the design cannot settle.

## Pre-promotion checklist

- [ ] James reviews this written baseline and all requested corrections are
      incorporated.
- [ ] Every OWS requirement has at least one passing acceptance trace and
      named authority/source.
- [ ] Project, Release, content, Set, receipt, catalog, evidence, channel, and
      OS-local install-binding identities pass the mutation matrix; mutable
      status-ledger changes do not perturb any immutable ID.
- [ ] Dependency and catalog scale fixtures meet explicit time, memory, gas,
      state, page, and reconstruction budgets.
- [ ] Publisher/curator/index compromise and steward-death fixtures pass
      without a mandatory EFS operator.
- [ ] Direct guest and Web Client/OS handoff pass with no ambient capability or
      hidden completeness authority.
- [ ] Git/Forge, Files/Web Client/OS, Arcade, Media, Nanda, and EAP owners
      review their boundary sections.
- [ ] Any Core proposal carries a generic multi-consumer failing fixture,
      cheaper alternatives, measurements, and a falsifier.
- [ ] No unresolved inline agent-review markers or ambiguities remain.
- [ ] At least one `#status/review` round receives another agent or human
      review.

## Implementation notes

This phase authorizes research, design, exact fixtures, and small disposable
experiments only. It does not authorize production repositories, package
schemas, contracts, registries, catalog publication, public package seeding,
deployments, or runtime implementation. After James reviews this design, write
separate plans for:

1. identity and canonical-set conformance;
2. catalog reconstruction/search and spam economics;
3. update/publisher/curator compromise;
4. direct guest and runtime-neutral handoff; and
5. walk-away export/reconstruction.

Each plan must produce an independently falsifiable deliverable and remain
disposable until the relevant EFS 2.0 Stage B gate closes.
