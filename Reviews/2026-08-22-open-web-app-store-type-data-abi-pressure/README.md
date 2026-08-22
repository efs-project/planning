# Open Web App Store × layered Type/Data ABI pressure

**Date:** 2026-08-22<br>
**Status:** disposable, versioned application-layer evidence<br>
**Standing:** proposal pressure only; no protocol bytes, package profile, public
catalog, runtime, Realm, contract, or production implementation is adopted<br>
**Inputs:** [[Designs/efsv2/layered-type-system-and-data-abi]],
[[Designs/open-web-app-store/README]], and
[[Designs/open-web-app-store/architecture]]

## Verdict

The Open Web App Store model still fits **above** the candidate layered EFS Type
and Data ABI. This fixture found no package-specific Core primitive requirement.
It instantiated exact Project, Manifest, authored Release, selected package Set,
resolution receipt, catalog, advisory/yank/compatibility/provenance, and inert
handoff records; validated their closed references and bounded Views; and
reconstructed retained package/catalog/type-package bytes without the original
publisher, catalog service, registry, or forge.

That is not a claim that package management is solved. The 10,000-release graph
arm serializes and hashes an already-selected graph; it is **not** a semver,
peer, hoist, optional-dependency, or authority-domain resolver. One JavaScript
implementation cannot freeze canonical bytes, rejection precedence, limits, or
cross-language interoperability.

## Executed evidence

Run:

```bash
node Reviews/2026-08-22-open-web-app-store-type-data-abi-pressure/fixture.mjs
```

The repaired fixture ran three fresh times on Node `v26.0.0`, Darwin arm64:

- `71/71` assertions passed on every run;
- all non-measurement report fields and exact IDs were byte-identical across
  the three runs;
- the 10,000-member Type-package closure was `10,000 → 625 → 40 → 3 → 1`:
  669 closure nodes, depth 4, 10,669 total closure/member Records;
- the selected-graph arm contained 10,000 Release references, 9,200 Project
  references, 12,779 edges, 100 required-edge SCCs, and 32 inert activation
  units; its nested closure contained 22,811 members, 1,523 closure nodes, and
  depth 4; and
- the single-run timings varied as expected and are not budgets: the 10,000
  Type-package closure took 134–139 ms in these three runs; the four selected-
  graph materializations plus SCC analysis took 3.32–3.34 s. Heap deltas were
  GC-sensitive and are retained only in the generated report.

The fixture-local JSON codec, SHA-256 domains, Type/View names, field keys,
eight-slot View budget, and sixteen-direct-reference cap are deliberately not
candidate protocol bytes.

## Instantiated model

| Surface | Fixture expression | Exactness and authority result |
|---|---|---|
| Project | author-neutral `SoftwareProjectGenesis/1` Record plus publisher/Realm Occurrence and publisher-qualified subject | Identical genesis bodies deduplicate, while two publishers retain distinct Project subjects; Realm admissions remain separate. Portable authorship is not proven. |
| Release | exact `PackageManifest/1` and `PackageRelease/1` Record, published through an exact Occurrence | Manifest, payload closure, requested ceiling, and Project changes affect Release identity. Identical bytes do not collapse authored occurrences. |
| Versions | separate authored `VersionLabelClaim/1` arm | `1.0.0` and `stable` can both target one exact Release without identity churn. This intentionally pressures current prose that puts the human label inside `PackageRelease`. |
| Dependency set | exact `ResolvedPackageSet/1` over a canonical selected multigraph; separate `ResolutionReceipt/1` | Input order does not change the Set; a selected transitive Release does; resolver/catalog/policy evidence changes only the receipt. The small Set reconstructs from retained graph bytes, validates each selected Project/Release/Manifest/payload/request relation, refuses completion on five relation failures, and rejects a mismatched graph digest. |
| Catalog | publisher-qualified Catalog Project, exact finite `CatalogEdition/1`, authored `CatalogRelease/1`, typed memberships | Both editions reconstruct from the Release root through exact rows. Conflicting curators remain visibly qualified by curator, Realm, basis, and selection. |
| Evidence | issuer-authored advisory, yank, compatibility, and provenance Occurrences | Conflicting results can target one unchanged Release/Set. Packaging a claim proves neither its truth nor endorsement. |
| Handoff | exact fixture `PackageHandoff/1` snapshot | Contains exact package/evidence references and no OS-local grant, binding, status, activation, secret, or execution authority. Whether a handoff needs semantic Record identity remains open. |
| Queries | exact-Type QueryProfiles plus one disposable finite ViewQueryProfile | Adding an index changes the QueryProfile, not Type or Record IDs. Empty `PARTIAL` is not absence. View-wide `COMPLETE` is scoped to a pinned finite inventory high-water only. |

## Exact pressure findings

### 1. Unqualified `ANY` is unnecessary and unsafe for this workload

The repaired fixture uses no `ANY` role. Package/catalog fields use closed
targets such as an existing Object, Record of one exact Type, Occurrence carrying
one exact Type, Record projectable through one exact View, or existing exact
Type/View revision. Five wrong-target vectors reject a Manifest→Advisory,
Release→non-Manifest, closure branch→non-closure child, Receipt→non-Set, and
Handoff→non-Catalog-Release Occurrence.

An existence-only Record/Object reference preserves structural extraction,
backlink discovery, and archive traversal eligibility. It still returns
`authority = NOT_PROVEN` and `currentness = UNKNOWN`. Raw bytes prove digest
integrity; an exact Type proves interpretation; a pinned View proves only its
bounded projection. None grants authority or currentness.

**Disposition:** avoid `ANY`; no new Core seam is needed. Exact wire vocabulary
for “Record/Occurrence carrying exact Type X” remains a generic descriptor task,
not a package-specific primitive.

### 2. `SELF` is exact-revision, not lineage

A `/1` self-reference validates. A `/2` Record pointing at a `/1` Record through
`SELF` rejects. Three explicit alternatives validate:

1. a finite exact-Type set containing `/1` and `/2`;
2. a pinned View implemented by both revisions; or
3. `RECORD + EXISTS`, followed by separate application validation.

**Disposition:** package identity itself does not need cross-revision self-links.
Versioned readers and migration/evolution tools can use finite accepted Type
sets or pinned Views; generic lineage/succession stays separate evidence.

### 3. View-wide completeness is optional, finite, and snapshot-scoped

The fixture pins two implementing Types and their exact QueryProfiles at
inventory high-water `2`. With terminal coverage, that snapshot is `COMPLETE`.
After two later implementing Types appear, the old snapshot remains scoped
`COMPLETE` while the current/open query is `PARTIAL` and names the excluded
later Types.

**Disposition:** the App Store MVP does not need View-wide `COMPLETE`. It can use
exact-Type QueryProfiles and reconstruct finite `CatalogEdition` closures. A
cross-Type “all evidence” explorer may use the finite inventory seam later, but
an open permissionless query must remain `PARTIAL`.

### 4. Bounded Views should normalize only genuinely shared semantics

The first run correctly failed because one generic Evidence View tried to unify
incompatible result vocabularies (`AFFECTED` versus `PASS/FAIL`). The repair made
the shared View expose only the exact Release target; each evidence Type retains
and queries its own result semantics. Dereference, a ninth slot, duplicate slot
mappings, and bound mismatches reject.

**Disposition:** use small nominal Views for shared structural seams, not as an
inheritance hierarchy or semantic eraser.

### 5. Sixteen direct roots plus nested closure works in this arm

Twelve exact Type revisions plus four exact View revisions validate as sixteen
direct roots. Adding the fifth View rejects with `DIRECT_REFERENCE_LIMIT` before
target traversal. The accepted Type package points to and reconstructs a
10,000-member closure containing exact Type/View descriptors and synthetic
conformance vectors. Reconstruction with empty exported Type/View indexes parses
those retained descriptor bytes, recomputes their revision IDs, and binds every
direct root to its matching member. Separate valid closures with a missing root
descriptor or a substituted descriptor reject as
`MISSING_DIRECT_TYPE_DESCRIPTOR` and `TYPE_DESCRIPTOR_ID_MISMATCH`. A
seventeen-member generic closure independently nests at depth 2.

**Disposition:** the architecture can proceed with bounded direct roots plus a
nested closure. The number sixteen remains a fixture parameter until Core budget
work and independent implementations justify it.

### 6. Catalog evidence remains inert

Two reconstructed catalogs select different exact Releases and yield
`CONFLICT`, not a global winner. A separate exact direct-link handoff contains no
catalog reference and remains reconstructible after both catalogs disappear.
The fixture discovery adapter receives a hostile record containing
`autoInstall`, launch URL, requested capabilities, a “trusted” flag, and a build
hook. It treats it as unrecognized evidence and records zero prepare, grant,
bind, activate, effective-capability, or byte-retention effects.

This proves the intended adapter boundary, not that every future OS integration
is incapable of violating it. The Web Client/OS must keep these effects behind
its separate state machines and policy checks.

### 7. Disappearance preserves exact retained state, not future knowledge

With publisher, registry, catalog service, and forge modeled unavailable, an
installed network trap receives zero calls while the retained fixture rebuilds:

- the exact Release, Manifest, three payload members, and dependency requirement;
- the exact two-node selected dependency Set, including exact Project, authored
  Release Occurrence, Manifest, payload closure, and RuntimeRequest relations;
- both one-row finite Catalog Releases;
- the two-member source/build closure; and
- the 10,000-member Type package.

Deleting a catalog root or membership returns `UNKNOWN`, never an empty catalog.
The retained source closure remains `COMPLETE` while forge availability and
future update knowledge are `UNKNOWN`.

### 8. Unknown capability dimensions deny without granting

An unknown required `wallet.sign.v2` dimension returns `UNSUPPORTED`, zero
grants, and zero side effects. A malformed request that names it as required but
omits its value also returns `UNSUPPORTED`; it cannot bypass deny-by-default.
Installation/discovery still does not compile an effective grant.

### 9. The 10,000-release graph is not dependency resolution evidence

The 10,000-node graph arm proves deterministic canonical materialization for
valid selected inputs, environment-sensitive identity, transitive-selection hash
sensitivity, duplicate/dangling rejection, required-edge SCC accounting, and
inert hook metadata. A separate two-node arm validates exact retained package
relations: a missing Release remains `UNKNOWN`, while Project, Manifest, payload,
and activation-request mismatches are `INVALID`. The scale arm does not consume
package requirements or decide versions, authority domains, peer placement,
optional features, hoisting, forks, yanks, or environment failures.

**Disposition:** call this selected-graph serialization evidence. A separate
disposable resolver must consume real requirements before EFS can claim
npm-scale resolution behavior.

## App Store work that can proceed now

The following remain reversible and can proceed without a Core change:

- refine provisional application Type descriptions for Project, Manifest,
  Release, finite Catalog Edition/Release, membership, evidence, selected Set,
  receipt, and inert handoff using closed reference roles;
- build a second independent encoder/validator and compare exact bytes, IDs, and
  rejection precedence before freezing any profile;
- implement a disposable resolver that consumes real requirements and emits the
  already-modeled exact Set plus separate receipt;
- define exact-Type QueryProfiles for the MVP and use finite catalog closures for
  honest scoped completeness;
- prototype direct-link and curated discovery into the same exact Release, with
  the OS consuming only the inert handoff; and
- continue product work on update review, pin/defer/rollback, advisories, mirrors,
  export, and reconstruction without choosing a mandatory registry.

Do **not** yet freeze Type/View/query bytes or limits; claim cross-language
conformance; select a runtime ABI; publish a public catalog; treat the 10,000
graph as a resolver; make View-wide search complete by default; or promote this
fixture's Handoff Record identity into protocol semantics.

## Remaining generic seams and holds

- Portable versus Realm-bound authorship remains unresolved. Fixture
  Occurrences are unsigned and include a Realm; mirroring reuses the retained
  source Occurrence rather than proving a portable envelope design.
- The small selected-graph validator checks the initial publisher-qualified
  Project arm only. It is not a publisher succession, delegation, or authority-
  epoch policy.
- The architecture currently says `PackageRelease` connects a human version
  label, while this fixture's cleaner arm uses separate authored label testimony.
  Recommendation: repair the draft toward label-out before promotion unless a
  consumer fixture proves the label is semantic Release content.
- A real resolver, independent implementation, hostile malformed corpus,
  realistic byte/work budgets, and cross-language clean-room reconstruction are
  still required before package-profile permanence.
- Full advisory-range evaluation, delta Catalog editions, publisher succession,
  update threshold/freshness policy, and state migration remain later fixtures.

## Files

- [`fixture.mjs`](./fixture.mjs) — executable, standard-library-only disposable
  model; prints the full exact-ID/result report as JSON.
