# R12 — Open Web App Store: README, architecture, inbox, and the 2026-08-22 Type/Data ABI pressure fixture

**Lane:** R12-open-web-app-store
**Reviewer date:** 2026-09-02
**Vault HEAD:** `234c3e6` (branch `claude/efsv2-coherence-mvp-review-eslcr8`; shallow clone, 50 commits, boundary `c48f252` 2026-08-13)
**Method:** every assigned document read in full; every wiki-link in the three store docs and the fixture README resolved against the filesystem; the fixture executed twice locally; the `4d3e736` citation investigated with `git` and the GitHub API; neighbour docs opened for each assumption cited below. All paths are repo-relative to the planning vault. Inference is marked "inference".

---

## 1. Documents read — summary, standing, defined terms

| Document | Standing (folder README + own status line) | Last touched |
|---|---|---|
| `Designs/open-web-app-store/README.md` | **current** draft spine. `Designs/README.md` §"In flight → Draft" lists the folder as "Proposed working comparison baseline… No package bytes, Core change, registry, runtime ABI, or implementation is adopted." Own status: "draft set — proposed working baseline for owner review" (line 3). | 2026-08-22 (line 8) |
| `Designs/open-web-app-store/architecture.md` | **current** draft. Status "draft — working architecture for review; no schema bytes, runtime, registry, or implementation adopted" (line 3). | 2026-08-22 (line 9) |
| `Designs/open-web-app-store/owner-decision-inbox.md` | **reference** (own status line 3: "reference — compact live queue"). Listed in `Open-Decisions.md` line 77 as `open-web-app-store | 0 | 2026-08-14 | ok`. | reconciled 2026-08-14 (line 5) |
| `Reviews/2026-08-22-open-web-app-store-type-data-abi-pressure/README.md` | **evidence-only** ("disposable, versioned application-layer evidence… proposal pressure only", lines 4-6). Folder contains only `README.md` and `fixture.mjs`. | 2026-08-22 |
| `Designs/web-client-os/system-profiles-and-generations.md` | **current** draft (neighbour). Status "draft — owner-directed product architecture and researched working model; object names… remain evidence-gated" (line 3). | 2026-08-22 |
| `Designs/efsv2/core-architecture-candidate.md` | **current** draft (neighbour; one of the seven current efsv2 docs named in the brief). Status "draft — buildable comparison target, not frozen protocol" (line 3). | 2026-08-12 |

### 1.1 `Designs/open-web-app-store/README.md`

The spine for a "permissionless software-evidence graph" plus an eventual consumer store (§"Product direction", lines 12-37). Recommends the "claim-graph + immutable `CatalogRelease` + exact `ResolvedPackageSet` family" as the working comparison baseline pending James's review (§"Proposed working baseline recorded here", lines 107-113). It has an authority map splitting owner-ratified boundaries, constitution/B0 obligations, proposal-only Stage A inputs, and historical July inputs (lines 58-105); an ownership table handing installation/activation/grants/state to Web Client/OS and Git-native identity to Git/Forge (lines 115-124); a twelve-item requirements spine (lines 146-167); "consumer pressure already incorporated" for Arcade, EAP, Nanda, Git/Forge, SDK v2, Media, Files (lines 187-218); a five-step work sequence (lines 220-232); explicit non-authorizations (lines 234-247); and a pre-promotion checklist (lines 249-269).

Terms defined or fixed here: `SoftwareProject`, `PackageRelease`, `ResolvedPackageSet`, `ResolutionReceipt`, `CatalogRelease`, `CatalogEdition`, `StateBranch` (as OS-owned), `PackageHandoff`, the retired umbrella `InstallGeneration` (line 140), and the list of OS-local objects the handoff must never contain: `RunnerRealization`, `PreparedPackageSet`, `InstallBindingGeneration`, `InstallStatusLedger`, `UpdateTrustState`, `GrantDecisionGeneration`, `GrantRevocationLedger`, `StateBranch`, `ProfileEvidenceSnapshot`, `SystemActivationGeneration`, `SystemActivationStatus`, `LocalSelectionState` (lines 134-138). ABI words reused from the constitution/B0 drafts: `COMPLETE/PARTIAL/UNSUPPORTED/UNKNOWN` (line 81, "remain proposal-only").

### 1.2 `Designs/open-web-app-store/architecture.md`

1,034 lines. §"Problem" (13-31) and §"Vocabulary corrections" (33-47: Store, App, Package, Lens, Presentation). §"Requirements ledger" OWS-R1…R18 (69-88). Actors and three required journeys (90-148). Three architecture families with Family A recommended (150-196). §"Recommended object model" (198-467): `SoftwareProject`, `PackageManifest`, `PackageRelease`, `ArtifactClosure`, `ResolvedPackageSet` (+ `ResolvedPackageSetId`), `ResolutionReceipt`, `CatalogProject`/`CatalogRelease`/`CatalogEdition`, evidence objects, `UpdateTrustPolicy`, local `UpdateTrustState`, and the OS-owned install binding/status restatement. Names/forks/succession (469-486). Nine package profiles incl. "Deployable EVM helper/module" (488-523). §"Runtime-neutral handoff" (525-582) with nine runtime guarantees. `PresentationOffer` (584-605). Catalog honesty, search, spam (607-658). Git/provenance (`ExactSourceRef`, `BuildAttestation`, `RebuildObservation`, `ReleaseSourceLink`, 660-680). Availability/export (682-707). Update/yank/compromise (709-754). A primary-source table "Checked 2026-08-14" (756-812). §"EFS v2 mapping and pressure" (814-857) — a table of "candidate/B0 hypotheses" and two conditional generic seams. §"Candidate product MVP" (859-903). Conformance program, falsifying fixture table, threat model (905-963). §"Open questions and evidence gates" (965-994). Checklist and implementation notes (996-1034).

### 1.3 `Designs/open-web-app-store/owner-decision-inbox.md`

Forty lines. "**Decide now: nothing.**" (line 10). Routes every gate to `architecture#Open questions and evidence gates` (line 17) and lists them: canonical Set encoding, portable authorship, catalog reconstruction, update trust, profile/capability vocabulary, state rollback, aggregate economics (lines 17-19). Boundary routing: Core questions → `Designs/efsv2/owner-decision-inbox`; execution/UX → Client/OS owner; Git → Git/Forge; product meaning → product owners (lines 25-33). Defines no objects.

### 1.4 `Reviews/2026-08-22-open-web-app-store-type-data-abi-pressure/README.md`

Verdict: the store model "still fits **above** the candidate layered EFS Type and Data ABI… found no package-specific Core primitive requirement" (lines 13-19), while disclaiming that the 10,000-release graph arm "is **not** a semver, peer, hoist, optional-dependency, or authority-domain resolver" (lines 21-25). Reports three runs on Node v26.0.0/Darwin arm64: 71/71 checks, identical non-measurement fields, 10,000→625→40→3→1 closure (669 nodes, depth 4, 10,669 Records), a 10,000-Release/9,200-Project/12,779-edge/100-SCC/32-activation-unit graph with a 22,811-member nested closure (lines 35-49). Instantiated model table (57-66) naming fixture Types `SoftwareProjectGenesis/1`, `PackageManifest/1`, `PackageRelease/1`, `VersionLabelClaim/1`, `ResolvedPackageSet/1`, `ResolutionReceipt/1`, `CatalogEdition/1`, `CatalogRelease/1`, `PackageHandoff/1`, plus QueryProfiles/ViewQueryProfile. Nine pressure findings (68-193): no unqualified `ANY`; `SELF` is exact-revision; View-wide completeness is finite/snapshot-scoped; small nominal Views; sixteen direct roots + nested closure; inert catalog evidence; disappearance preserves retained state; unknown capability dimensions deny (`UNSUPPORTED`); the 10k graph is serialization evidence only. Lists work that can proceed (195-216) and remaining seams (218-234), including "repair the draft toward label-out before promotion" (226-229).

**Local reproduction (2026-09-02):** `node fixture.mjs` on Node v22.22.2 linux x64 → exit 0, `checks.passed = 71, failed = 0`; `nested10k = {memberCount 10000, closureNodeCount 669, totalRecordCount 10669, depth 4}`; `scaleGraph = {selectedReleases 10000, projects 9200, edges 12779, sccs 100, activationUnits 32, graphClosureMembers 22811, graphClosureNodes 1523, graphClosureDepth 4}`; `typePackageDirectRootBoundary = {acceptedCount 16, rejectedCount 17, rejection DIRECT_REFERENCE_LIMIT}`; unknown capability `wallet.sign.v2` → `UNSUPPORTED`, 0 grants, 0 side effects. Two local runs produced byte-identical non-measurement reports (28,386 bytes after stripping `elapsedMs`/`heapDelta*`/`environment`). Timings were ~3-4× slower than reported (505 ms vs 134-139 ms; 8.55 s vs 3.32-3.34 s) — the README correctly says timings "are not budgets" (line 45). The vault was not modified (`git status --porcelain` empty afterwards).

### 1.5 `Designs/web-client-os/system-profiles-and-generations.md` (neighbour)

Owner-directed (2026-08-14/15, lines 12-40) "Web-native functional system model". §"Object and identity model" (172-639) defines `SystemProfileRecipe`, `SystemResolutionReceipt`, `SystemProfileLock`/`SystemProfileLockId` (+`LockHeader`), `SystemProfileGeneration`, `ProfileEvidenceSnapshot`, `RunnerRealization`, `PackageHandoff`/`PreparedPackageSet` (357-391), `ProfileAdoption`, `StateBranch`/`GrantDecisionGeneration`/`GrantRevocationLedger` (412-433), **`InstallBindingGeneration`** (435-449, with `InstallStatusLedger` at 446-449), `SystemActivationGeneration`/`SystemActivationStatus` (451-481), `LocalSelectionState`/`SessionGeneration` (483+), `SystemChannel`, `FollowResolutionReceipt`. §"EFS v2 and App Store pressure" (1164-1181) states the division of ownership with the store. §"Delivery horizons → MVP reservation" (1185-1194). Checklist items [x] "Open Web App Store confirms the one-way `PackageHandoff` boundary" and [x] "…publishes its confirmed terminology repair from the obsolete umbrella `InstallGeneration`" (1455-1460).

### 1.6 `Designs/efsv2/core-architecture-candidate.md` (neighbour)

Candidate primitives: Realm, Type Schema (with the deliberately open Variant A/B identity question, lines 89-95), Record (`RecordId = H(domain, typeSchemaId, canonicalBody)`, line 115; `ObjectGenesis/1` for stable lineage, 125-129), Envelope/Occurrence (131-189), Admission receipt, Binding/Withdrawal (`PositionKey`/`BindingKey`, 213-232), Principal, Indexes, `ResolutionPlan` (Lens, 300-326), Content and Locators: `Locator/1`, `ByteDigest/1`, `ArtifactClosure/1`, `RepresentationBinding/1`, `ArtifactRelease/1` — "Core knows none of these names" (328-342). Worked Arcade example uses `GameProject`/`GameMetadata`/`ArtifactClosure`/`GameRelease`/`VerifiedLocator`/`CatalogMembership`/`SelectedRelease` (371-382). Falsifier 9: "an application needs a custom Core contract or private index for ordinary typed references, membership, comments, releases, or evidence" (428-430).

---

## 2. Lane Q1 — Store object model mapped onto Core concepts; which Type arm is assumed

### 2.1 Mapping table (store prose → Core concept)

| Store object | Store definition | Core concept(s) it maps to | Where the store says so |
|---|---|---|---|
| `SoftwareProject` | stable publisher-qualified subject for one lineage | `ObjectGenesis/1` Record (Type Schema → Record) + authored **Occurrence**; identity must include the publisher-qualified genesis reference | `architecture.md` §`SoftwareProject` lines 200-212; mapping row line 820 |
| `PackageManifest` | canonical inert data for one Release (Project ref, `ArtifactClosure` ref, entrypoint, runner/profile ranges, capability ceiling, dependency requirements…) | a **Record** of a new application Type; no Core analogue; note "Existing `ArtifactRelease/1` has no first-class Manifest field" | lines 214-234; mapping row line 821 |
| `PackageRelease` | immutable authored claim connecting Project, Manifest, payload closure "and human version label"; published through an Occurrence | new application Type "following `ArtifactRelease/1`'s subject/artifact/version separation" or explicit composition with `ArtifactRelease/1`; **Record** (semantic identity) + **Occurrence** (authored identity) | lines 236-258 |
| `ArtifactClosure` | exact payload member set | `ArtifactClosure/1` (+`ByteDigest/1`, `ChunkTree/1`, `RepresentationBinding/1`) with profile rules Core's closure does not carry | lines 260-282; row 822 |
| `ResolvedPackageSet` / `ResolvedPackageSetId` | canonical selected multigraph; ID hashes "only the canonical selected semantic graph" | "Application Record plus exact content closure" (row 828) — i.e. a **Record** whose RecordId is the Set ID | lines 284-320; row 828 |
| `ResolutionReceipt` | attributable evidence explaining one derivation | **Record + Occurrence** (evidence) | lines 322-337 |
| `CatalogProject`/`CatalogRelease`/`CatalogEdition` | curator-qualified subject; immutable authored claim over an exact finite edition (materialized root or delta chain) | Project = genesis Record; Release = Record + Occurrence; Edition = exact content closure; "current edition" = Principal-qualified **Binding** ("discovery/currentness claim, not… update authority") | lines 339-378, esp. 364-367; row 825 |
| `PackageHandoff` | inert capsule to the OS | not a Core object in the design ("Whether a handoff needs semantic Record identity remains open", fixture README line 65); modeled as an exact snapshot Record only in the fixture | `architecture.md` lines 525-554; fixture README 65 and `limits` |
| `RuntimeRequest` | one per executable activation unit, inert | `RuntimeRequest/1` from Stage A ("inert `RuntimeRequest/1`", row 830) | lines 297-298, 533-535; row 830 |
| `ArtifactRelease/1` | (Core-side) publisher-qualified semantic release `{subject, artifact, versionLabel, custodyFloor, runtime?, notes?}` | defined in `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-content-locators.md` §9 lines 779-800; named in `core-architecture-candidate.md` line 338 | store treats it as the template it must "follow" or "compose with" (line 239-243) |
| Locators/availability | separately authored claims | `Locator/1` + observations (row 829) | lines 684-687 |
| Update "channel" | Principal-qualified Binding at a release-head position resolved through a pinned `ResolutionPlan` at a basis | **Binding** + **Lens/ResolutionPlan** | lines 713-718 |

### 2.2 Which Type arm

The design documents assume the **Stage A bundled B0** arm: "It maps onto the proposal-only B0 corpus as a pressure test. It does not adopt B0" (`architecture.md` lines 51-55); "All mappings are candidate/B0 hypotheses, not adopted protocol" (line 816); the mapping table cites B0 Type names with `/1` suffixes (818-830) and the "candidate B0 limit of 16 members per closure Record, separate client walk-depth-16 bound, 64-Principal Lens" (854-857). The README lists the Stage A corpus under "Proposal-only EFS inputs" (lines 84-93).

The **fixture** assumes the **layered Type/Data ABI** arm: its inputs are `Designs/efsv2/layered-type-system-and-data-abi` (fixture README line 7); its verdict is that the model fits "above the candidate layered EFS Type and Data ABI" (line 13); it exercises Views, QueryProfiles, ViewQueryProfile, exact Type revisions, `SELF`, and "sixteen direct roots plus nested closure" (findings 1-5, lines 70-141) — concepts that exist only in the layered doc (`layered-type-system-and-data-abi.md` §"4. Bounded Data View" line 305, §"7. Query profile" line 387, §"Type packages and publisher disappearance" 651-682).

Neither arm is adopted: `Designs/efsv2/README.md` lines 75-80 calls the layered doc "a review/experiment target, not an adopted Type system"; `core-architecture-candidate.md` lines 89-95 leaves Variant A/B open; owner direction 12 in `Designs/web-client-os/README.md` lines 81-84: "The Type/query-identity axis remains open. The latest owner response was not interpretable, so this set infers no choice." **Conclusion:** the store straddles both arms — its written mapping is B0-specific, its executed evidence is layered-specific, and it has no arm-neutral statement of which fields are identity-bearing (see Finding F3).

---

## 3. Lane Q2 — What the store requires from the OS, and whether the OS defines it

### 3.1 Objects the store names as OS-owned (README lines 121, 134-138; architecture 437-467, 546-554)

| Name used by the store | Defined on the OS side? | Where | Semantics match? |
|---|---|---|---|
| `InstallBindingGeneration` | **yes** | `system-profiles-and-generations.md` §`InstallBindingGeneration` lines 435-444: "Immutable local binding of exact package/set, `RunnerRealization`, public and private configuration digests, `GrantDecisionGeneration`, compatibility contract, migration IDs, activation-unit identity and a state attachment digest…" | **yes** — store `architecture.md` 447-452 lists the same components; both say status never changes identity (OS 448-449; store 453-455) and it is never folded into `PackageHandoff` (OS 443-444; store 460) |
| `InstallStatusLedger` | **yes** | lines 446-449 | **yes** — same six mutable categories (prepared/retained-byte completeness, health, instances, update candidates, failures, teardown) |
| `GrantDecisionGeneration` | **yes** | lines 418-426 | yes — immutable scoped decision; store says binding "merely references" it (462-464), OS says binding includes it (437-438); consistent |
| `GrantRevocationLedger` | **yes** | lines 428-433 | yes |
| `StateBranch` | **yes** | lines 414-416 | yes — store treats "state attachment digest" vs mutable content separately (452, 456); OS 440-442 same |
| `RunnerRealization` | **yes** | lines 316-355 | yes |
| `PreparedPackageSet` | **yes** | lines 372-383 | yes |
| `ProfileEvidenceSnapshot` | **yes** | lines 302-314 | yes |
| `SystemActivationGeneration` | **yes** | lines 451-477 | yes |
| `SystemActivationStatus` | **yes** | lines 479-481 | yes |
| `LocalSelectionState` | **yes** | lines 483-520+ | yes |
| `UpdateTrustState` | **no — name-checked only** | line 388 ("`UpdateTrustState`, state-branch heads, grant revocation and evidence snapshots keep separate identities/lifecycles") | the store defines it (`architecture.md` §Local `UpdateTrustState` 420-435) and says it is "Owned by the user agent/Web Client/OS"; the OS never defines it. `UpdateTrustPolicy` appears in no document outside the store (grep). See F4. |

### 3.2 The anchor `system-profiles-and-generations#InstallBindingGeneration`

Used at `README.md` line 143 and `architecture.md` line 444. The target file exists and contains the heading `### \`InstallBindingGeneration\`` at line 435. The vault consistently links backticked headings without backticks (e.g. `architecture-and-modules.md` line 367 links `[[system-profiles-and-generations#RunnerRealization]]` to the heading `### \`RunnerRealization\`` at line 316), so the anchor resolves under the vault's own convention. Whether Obsidian's renderer strips the inline-code marks when matching is not checkable from here (UNVERIFIABLE, cosmetic).

### 3.3 Mutual confirmation of the split

- Store: commit `928ac72` 2026-08-21 23:34 -0400 "design: separate install binding identity from runtime status" (touches only store README/architecture + agent-status).
- OS: `architecture-and-modules.md` lines 665-671: "The App Store PM confirmed this split on 2026-08-15 and retired its umbrella-term intent"; `system-profiles-and-generations.md` line 385-391 and checklist 1455-1460 marked [x].
- The store README header says "boundary repair 2026-08-15" (line 7). The commit landed on `main` six days later; `Daily Notes/agent-status.md` (2026-08-21 entry, "pushed the four finished Web Client/App Store commits… to private planning `main`") explains the gap. Not a defect.

---

## 4. Lane Q3 — Does Arcade use the same Project/Release/Artifact model?

**No — three vocabularies coexist and none of the Arcade docs references the store.**

| Set | Vocabulary | Citation |
|---|---|---|
| Arcade (v1 MVP pass, 2026-08-07) | slug + chain-free "portable source manifest" `{slug,title,…,file,sha256}`; on-chain DATA UID / PIN / TAG / PROPERTY `contentHash`; `PlayablePackage` profile 1 = single `index.html`; "Update/fork via PIN supersession" | `Designs/arcade/mvp-architecture.md` §"Data shapes" lines 116-135; §"PlayablePackage seam" 163-169; capability table row 21 line 107 |
| Arcade (v2 pressure, banner 2026-08-12) | "GameProject, immutable GameRelease, ArtifactManifest, curator selection, locator, and runner policy remain application-profile pressure, but Arcade now targets EFS 2.0 Core behind a provisional adapter" | `Designs/arcade/v2-pressure-and-migration.md` lines 10-14; §2e "single-file `PlayablePackage`… deliberately the degenerate closure manifest" line 77 |
| Core candidate | `GameProject` (ObjectGenesis/1), `GameMetadata`, `ArtifactClosure`, `GameRelease`, `VerifiedLocator`, `CatalogMembership`, `SelectedRelease` (curator Binding) | `Designs/efsv2/core-architecture-candidate.md` lines 363-387 |
| Stage A B0 | `ArtifactRelease/1 {subject, artifact, versionLabel, custodyFloor, runtime?, notes?}` + `RuntimeRequest/1` | `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-content-locators.md` lines 779-800 |
| Store | `SoftwareProject`, `PackageManifest`, `PackageRelease`, `ArtifactClosure`, `ResolvedPackageSet`, `CatalogRelease`/`CatalogEdition`, `PackageHandoff` | `architecture.md` lines 198-378 |

`grep -rn 'SoftwareProject\|PackageRelease\|open-web-app-store\|App Store' Designs/arcade/*.md` returns zero hits. The store nonetheless says Arcade pressure is "already incorporated" ("the same exact Release/closure supports guest Play and local install", `README.md` lines 188-191) and lists an "Arcade one-member executable" consumer fixture (`architecture.md` 914-915). The OS says Arcade "Fits `Resolved<T>`, Artifact Reader, PackageHandoff…" (`Designs/web-client-os/mvp-and-acceptance.md` line 849). The Arcade set is held ("owner queue held", `Designs/arcade/README.md` line 3) and its docs predate the store (2026-08-07/12 vs 2026-08-14). Which object the one-game Andromeda slice would publish — an Arcade `GameRelease`, a Core `ArtifactRelease/1`, or a store `PackageRelease` — is undecided and unowned (F5).

---

## 5. Lane Q4 — The `Designs/sdkv2/ethereum-standards-census.md` @ `4d3e736` citation

**Facts established (2026-09-02):**

1. The path does not exist at HEAD of this clone and `git log --all -- Designs/sdkv2` is empty. The clone is shallow (`git rev-parse --is-shallow-repository` = true; `.git/shallow` = `c48f252`, 2026-08-13; 50 commits) and carries only `main` and the review branch. `git show 4d3e736` → "unknown revision".
2. GitHub API `commits/4d3e736…` → exists: `2026-08-23T03:09:47Z`, message "design: add Ethereum standards profiles to SDK v2", parent `76dda04`.
3. GitHub API `compare/main...codex/sdkv2-pm` → "diverged, ahead 7, behind 4"; the seven commits (2026-08-22 → 2026-08-25) include `4d3e736` and add `Designs/sdkv2/README.md`, `architecture-candidate.md`, `developer-journeys.md`, `ethereum-standards-census.md` (34,517 bytes), `exp-c0-mvp-packet.md`, `experiment-program.md`, `owner-decision-inbox.md`, `owner-rulings.md`, `research-precedents.md`, `sdk-pm-charter.md`, `web-client-os-boundary-pressure.md`, plus `Reviews/2026-08-25-sdkv2-exp-c0-mvp/*` (fixture, check scripts, core-source-lock). `git ls-remote --heads origin` confirms `refs/heads/codex/sdkv2-pm` = `57d04f8`.
4. GitHub API `contents/Designs/sdkv2?ref=main` → 404. `Designs/README.md` content map has no sdkv2 entry.
5. The blob permalink returns HTTP 200 and the raw file header reads: "# EFS v2 SDK Ethereum standards census — **Status:** reference — dated official-source census and proposed SDK integration posture… **Last touched:** 2026-08-22" (fetched to scratchpad `census-4d3e736.md`, 272 lines).
6. The store's citing commit `da0aec2` is 2026-08-22 23:26:33 -0400 = 2026-08-23T03:26Z, seventeen minutes after `4d3e736` — the permalink was valid when written.
7. Four vault files cite it: `Designs/open-web-app-store/README.md` line 205, `architecture.md` line 7, `Designs/media-library/media-infrastructure.md` line 182, `Reviews/2026-08-22-web-client-os-eip-erc-screen/README.md` line 142. `Daily Notes/agent-status.md` line 237 records the media PM folding "the remote SDK v2 Ethereum-standards census at `4d3e736`".

**What happened (inference from the above):** an SDK v2 PM lane worked on branch `codex/sdkv2-pm`, other PMs cited its census by commit permalink before it was merged, and the branch was never merged into `main` (last commit 2026-08-25). The citations are therefore to a **branch-only artifact**. Consequences: (a) three *current* design docs rest on evidence that the vault's own layering (`Designs/README.md`) does not know exists; (b) the review brief defines the `sdk` set as root `Designs/sdk-*.md` — all historical per `Designs/README.md` lines 72-86 — while an active SDK v2 spine (11 files + an executed EXP-C0 MVP packet) sits unreviewed on the branch; (c) `Designs/web-client-os/README.md` line 78-80 (owner direction 11) names an `sdk` repo to reclaim, so SDK v2 is on the roadmap. See F1.

---

## 6. Lane Q5 — Is the App Store on the write-capable File Browser MVP critical path?

**No.**

- Owner direction 2 (`Designs/web-client-os/README.md` lines 44-47): "The first MVP must be an official write-capable File Browser… Guest reading remains independent of that path."
- MVP critical path (`README.md` lines 466-478): "freeze only the symbolic inputs in [[type-data-abi-boundary-pressure]]… convert its guest read and official wallet-owned File Browser write journeys into one disposable exact-Type fixture… Full Try, whole-system activation/rollback, thousand-module and Component/WASI execution experiments gate their later product lanes, not the Files MVP."
- MVP exclusions (`Designs/web-client-os/mvp-and-acceptance.md` lines 95-100): "package installation, third-party executable Views, full Session Shell, Arcade Play, native mounts…; shared-profile Try, Adopt, Fork or Activate… Their object and authority seams are reserved now, but none is required to ship the File Browser MVP." Guest bundles "contain no wallet, package installer, full Shell, Arcade…" (line 514).
- The store is a "consumer of the skeleton, not [an] MVP feature" (`mvp-and-acceptance.md` §"Adjacent product pressure fixtures" lines 843-851).

**What the MVP borrows from the store: nothing.** The client's own release identity is a first-party OS object, `AppReleaseGeneration` — "one exact EFS Web Client delivery envelope… complete first-party static asset closure and release manifest" (`Designs/web-client-os/architecture-and-modules.md` lines 627-631) with an immutable `ReleaseClosure` body and a mutable `ChannelEnvelope` for discovery (lines 721-730); owner direction 19's opt-in-upgrade policy (`README.md` 107-116) is satisfied there. The OS explicitly says the binding "is never folded into the first-party `AppReleaseGeneration` or runtime-neutral `PackageHandoff`" (`system-profiles-and-generations.md` 443-444). No document says whether the Web Client itself is ever published as a store `SoftwareProject`/`PackageRelease` (F16).

**Core asks and routing.** The store makes **no Core ask**: "No proven Core change" (`architecture.md` 832-838). It names two *conditional* generic seams (840-852): (1) portable authorship, (2) finite catalog reconstruction. Routing check:
- Portable authorship → efsv2 `V2-E3` (Record and shared-context bakeoff) covers "portable and intentionally Realm-bound publication profiles" (`core-architecture-candidate.md` 155-158, bakeoff row 416) but its consumer list is "Arcade, Git, EAP, Nanda, Markdown, Topic/literal, and privacy fixtures" (`Designs/efsv2/owner-decision-inbox.md` lines 35-38) — packages are not listed (F7).
- Finite catalog reconstruction / complete enumeration → the store points at Files' `BindingScope` (`architecture.md` 847-852, 974-977); the OS asks the same (`Designs/web-client-os/README.md` 524-526; `mvp-and-acceptance.md` 851); `hierarchical-files-and-folders.md` §5 (line 658) defines it and says it "must exist at Realm genesis" (699). The efsv2 inbox has no entry for it; LP-2 only says "wide sorted enumeration must earn separate mechanism and budget" (line 215-216) (F6).
- The store inbox's routing rule sends Core questions to `Designs/efsv2/owner-decision-inbox` (inbox lines 27-28), but neither seam has been entered there.

---

## 7. Lane Q6 — What to cut; what is over-designed relative to any product in the next year

Context: no EFS 2.0 code exists in any repository (brief); the OS MVP excludes package installation; the Arcade slice is "one game with no durable EFS write" (`Designs/arcade/owner-decision-inbox.md` line 12; `Designs/arcade/README.md` 19-20); the store's own "Build no production registry" (README line 230).

**Keep (the identity spine that any consumer will need):** `SoftwareProject`, `PackageRelease` + `PackageManifest`, `ArtifactClosure` (via Core's closure Types), `Locator`s, one *materialized* `CatalogEdition`/`CatalogRelease`, the inert `PackageHandoff`, `RuntimeRequest`, OWS-R1…R6, R13, R14, R16, R17 as product law.

**Cut or defer (no consumer in the next year):**
1. Delta-chain `CatalogEdition`s with predecessor/checkpoint rules (`architecture.md` 345-353, 373-378).
2. `UpdateTrustPolicy`/`UpdateTrustState` TUF-style roles, thresholds, epochs, cooldowns (401-435) — the first update the project will face is the client's own, already handled by `ChannelEnvelope`.
3. The "Deployable EVM helper/module" profile (502, 513-523; README 204-212) — added 2026-08-22 from the branch-only SDK census; no consumer.
4. "Remote-service connector" and "Tool or local service/agent" profiles (503-504) — Nanda is a brainstorm, not a product.
5. SLSA/in-toto/Sigstore/SPDX/CycloneDX evidence profiles and `BuildAttestation`/`RebuildObservation` (380-399, 662-671, 765-766).
6. Multigraph peer/duplicate-version/hoisting/import semantics and the TS+Rust 10k-node resolver fixture (287-300, 934); the fixture README itself says the 10k arm is not resolver evidence (180-193).
7. The 100k-catalog + one-million-spam reconstruction fixture (933, 974-977).
8. `PresentationOffer` and executable/declarative Presentation confinement (584-605) — Files/OS concerns with no store consumer yet.
9. The store's "Candidate product MVP" (859-903) as a *product*: it has no user; keep only its identity-mutation fixture (931) and direct-link fixture (942).

**Over-designed:** 18 requirements, 9 profiles, 12 falsifying fixtures, 7 evidence-gate checkboxes and a 1,034-line architecture for a layer whose only concrete consumer within a year is one single-file game and a first-party client release that the OS explicitly keeps outside the store. The design is coherent and careful, but it was written in isolation from any delivery timeline (F8, F18).

---

## 8. What this set assumes about its neighbours — and whether the neighbour agrees

| About | Assumes | Where (store) | Neighbour says | Agrees? |
|---|---|---|---|---|
| efsv2 Core | Records/Occurrences/Bindings/Locators/ArtifactClosure/1/ArtifactRelease/1/RuntimeRequest/1 exist as generic application Types; Core needs no package noun | `architecture.md` 814-838 | `core-architecture-candidate.md` 328-342 lists exactly those profiles and says "Core knows none of these names"; falsifier 9 (428-430) agrees | **yes** |
| efsv2 Core | `ArtifactRelease/1` separates subject/artifact/version; lacks a Manifest field | `architecture.md` 239-243, 821 | Stage A §9 shape has `versionLabel` *inside* the Record body (b0-content-locators 788-796); `RecordId = H(domain, typeSchemaId, canonicalBody)` (core-architecture-candidate 115) → the label is identity-bearing there | **partly** — contradicts OWS-R4 (F2) |
| efsv2 Type system | the store fits above the layered Type/Data ABI without new primitives | fixture README 13-19 | `layered-type-system-and-data-abi.md` §"App/module catalogs and typed APIs" 891-899 and `TypePackageRelease/1` 653-665 agree in shape; but `TypePackageRelease/1` also carries `releaseVersion` in-body (label-in) | **partly** (F2, F3) |
| efsv2 Type arm | B0 hypotheses in the architecture; layered arm in the fixture | `architecture.md` 816; fixture 7, 13 | efsv2 README 75-80 and owner direction 12: arm open | **agrees it is open** (F3) |
| Files | `BindingScope` is an unproven experiment usable for live per-position catalogs | `architecture.md` 376-378, 851, 976 | `hierarchical-files-and-folders.md` §5 658-722, status "review — … exact bytes and measured limits remain evidence-gated" (line 3) | **yes** |
| Web Client/OS | one-way `PackageHandoff`; OS owns install/activation/grants/state; split into `InstallBindingGeneration` + `InstallStatusLedger` | README 115-144; architecture 437-467, 525-582 | `system-profiles-and-generations.md` 357-391, 435-449; `architecture-and-modules.md` 665-671; `web-client-os/README.md` 412-420 | **yes** |
| Web Client/OS | `UpdateTrustState` is OS-owned | `architecture.md` 420-422 | OS mentions the name once (line 388), never defines it | **no** (F4) |
| Web Client/OS | store objects are reserved seams, not MVP | README 220-232 | `mvp-and-acceptance.md` 95-100, 843-851 | **yes** |
| Arcade | "same exact Release/closure supports guest Play and local install"; Arcade is an incorporated consumer | README 188-191; architecture 914-915 | Arcade docs use `GameProject`/`GameRelease`/`ArtifactManifest`/`PlayablePackage`; zero references to the store | **no** (F5) |
| Media | passive media may consume verified ranges; Presentation offers are evidence | README 213-216 | `media-infrastructure.md` cites the same census (182); range contract routed to `mountable-filesystem-semantics` (176-178) | **unknown** — media spine not read in this lane |
| Git/forge | Git identity never becomes package identity; releases link to source evidence | README 200-203; architecture 660-680 | no Git/forge design folder exists; owner direction 2026-08-07 says forge objects incl. "release" must stay expressible (`owner-rulings.md` 158-165) | **unknown** — possible overlap between forge "release" and store `PackageRelease` |
| SDK | the SDK v2 census is dated evidence | README 204-212; architecture 7 | census exists only on branch `codex/sdkv2-pm` | **exists, but unmerged** (F1) |
| EAP / Nanda | separate PMs own application semantics and will review boundary slices | README 124, 265; architecture 1011 | no EAP or Nanda design set exists (`ls Designs`); Nanda is `Brainstorms/2026-07-29-…`; EAP is a fixture row in `system-constitution.md` 312 | **no owner exists** (F9) |
| Realm/venue | no chain, Realm, or Commons is selected | README 238-241 | `owner-rulings.md`/efsv2 README: Sepolia first dev Commons, no canonical venue | **yes** |

---

## 9. Decided / undecided / disagreements

### 9.1 Decided (ruling or direct direction) that this set honours

| Item | Ruling location | Store compliance |
|---|---|---|
| EFS 2.0 greenfield; no v1 compat/coexistence/migration/legacy-read | `Decisions.md` line 23 (2026-08-08); `owner-rulings.md` 2026-08-12 | README 62-64; July inputs labelled historical (97-105) |
| Core permissionless; Commons/Web Client/OS optional consumers; none mints identity | `owner-rulings.md` ~188-198; `system-constitution.md` | README 65-68 |
| Direct guest path without account/wallet/Commons/OS | `owner-rulings.md` 211-213; `web-client-os/README.md` 315-317 | OWS-R16 (architecture 86), runtime guarantee 9 (581-582) |
| First MVP = write-capable File Browser; package installation excluded | owner direction 2 (`web-client-os/README.md` 44-47); `mvp-and-acceptance.md` 95-100 | store not on path; README 230 "Build no production registry" |
| Type/query-identity axis open | owner direction 12 (`web-client-os/README.md` 81-84) | store adopts neither arm (but see F3) |
| Nix/Guix functional-system requirements without mechanisms | owner direction 20-22 (`web-client-os/README.md` 117-131) | store's OWS-R9/R14 align |
| Cross-PM (not owner): `InstallGeneration` retired → `InstallBindingGeneration` + `InstallStatusLedger` | store commit `928ac72`; OS `architecture-and-modules.md` 665-671; `system-profiles-and-generations.md` 1455-1460 | consistent on both sides |
| Cross-PM: `PackageHandoff` one-way, no grants | store README 126-138; OS README 416-420 | consistent |
| Store owner queue: "Decide now: nothing" | inbox line 10; `Open-Decisions.md` 77 | — |

No DRIFT against an owner ruling or direct direction was found in this set.

### 9.2 Undecided (assumed, nobody owns)

See findings F2, F3, F4, F5, F6, F7, F11, F16.

### 9.3 Docs disagreeing with each other (no ruling involved)

- `architecture.md` §`PackageRelease` (236-239, label-in) vs OWS-R4 (74, label-is-testimony) vs fixture (label-out, 61, 226-229) — F2.
- `architecture.md` mapping (B0) vs fixture (layered) — F3.
- Store "Arcade incorporated" vs Arcade docs — F5.

---

## 10. Concrete defects and stale facts

| # | Defect | Citation | Class |
|---|---|---|---|
| D1 | Citations to `Designs/sdkv2/ethereum-standards-census.md@4d3e736` point at a branch-only file (`codex/sdkv2-pm`), invisible to `main`, `Designs/README.md`, and this clone | `open-web-app-store/README.md` 205; `architecture.md` 7; `media-library/media-infrastructure.md` 182; `Reviews/2026-08-22-web-client-os-eip-erc-screen/README.md` 142 | DEFECT (F1) |
| D2 | Inbox "Last reconciled: 2026-08-14" predates the 2026-08-21/22 edits and the fixture's explicit pre-promotion repair recommendation; neither the inbox nor `architecture.md` §Open questions (965-990) tracks the label-out repair or the handoff-identity question | inbox line 5; fixture README 226-229, 65 | DEFECT (F2, F11) |
| D3 | Pre-promotion checklists require "Nanda, and EAP owners review their boundary slices" — no such owners/sets exist | README 265; architecture 1011 | DEFECT (F9) |
| D4 | Mutual `Depends on` cycle: store README ↔ web-client-os README (both line 5); `system-profiles-and-generations.md` line 5 depends on store architecture; design-system requires the dependency chain "accepted or landed" before promotion (`0001-design-system.md` 133) | — | DEFECT (F10) |
| D5 | Reviewer lists differ: README line 7 adds the 2026-08-22 fixture lanes; `architecture.md` line 8 does not | — | minor stale header |
| D6 | "Resolution" is overloaded: Core `ResolutionPlan` (Lens), store `ResolutionReceipt`, OS `SystemResolutionReceipt`/`FollowResolutionReceipt`/`AppFollowResolutionReceipt`; the store's vocabulary section (43-45) reserves "Lens = ResolutionPlan" while naming its own artefact `ResolutionReceipt` | `architecture.md` 43-45, 322; `system-profiles-and-generations.md` 233, 607; `app-runtime-and-direct-launch.md` 133 | minor naming hazard (F13) |
| D7 | Target repos say `client` (README 4; tags `#repo/client`) while owner direction 11 names the v2 repo `webclient` (`web-client-os/README.md` 78-80) | — | trivial; no rename authorised |
| D8 | Fixture README reports Node v26.0.0 timings; the generated JSON report is not retained in the review folder (only `fixture.mjs` + `README.md`), so "byte-identical across the three runs" can only be re-established by re-running | fixture README 35-49; `ls` of the folder | minor; reproduced here (two runs identical) |

**Wiki-link check.** All 14 distinct `[[…]]` targets in the three store docs and all 3 in the fixture README resolve to existing files (`Designs/efsv2/README`, `system-constitution`, `owner-rulings`, `owner-decision-inbox`, `hierarchical-files-and-folders`, `layered-type-system-and-data-abi`, `Designs/web-client-os/README`, `system-profiles-and-generations`, `Designs/clientv2/packages-and-updates`, `fable-third-party-app-model-handoff`, `Reviews/2026-08-13-efs2-stage-a-corpus/STATUS`, `Reviews/2026-08-22-…/README`, local `README`/`architecture`/`owner-decision-inbox`). The only dead link found in this lane's *neighbour* reading is in Arcade: `Designs/arcade/mvp-architecture.md` line 5 and `v2-pressure-and-migration.md` line 5 depend on `[[playable-archive-requirements]]`, which lives at `Designs/efsv2/playable-archive-requirements.md`, not in `Designs/arcade/` (Obsidian shortest-path resolution may still find it; `deterministic-ids`, `apps-cookbook`, `efs-v2-transition-plan` similarly resolve only by basename) — outside this lane's owning set, noted for the Arcade lane.

---

## 11. Candidate findings

**F1 — Current docs cite an SDK v2 census that exists only on an unmerged branch.** `DEFECT` · important · owner `vault-process` · neighbours `sdk`, `media-library`, `web-client-os`, `open-web-app-store`. Evidence in §5 above. The permalink was valid when written (`da0aec2` = 2026-08-23T03:26Z vs `4d3e736` = 2026-08-23T03:09:47Z) and returns HTTP 200 today, but the file has never been on `main` (API 404; `Designs/README.md` has no sdkv2 row; `git log --all -- Designs/sdkv2` empty in this shallow clone). An active SDK v2 spine (11 files, EXP-C0 fixture, last commit 2026-08-25) is therefore outside the vault's layering and outside this review's `sdk` set definition.

**F2 — `PackageRelease` is label-in in prose, label-is-testimony in requirements, label-out in the fixture, and label-in-the-hash in both Core arms.** `WRONG` (internal contradiction) · important · owner `open-web-app-store` · neighbour `efsv2`. `architecture.md` 236-239: "immutable authored claim connecting one Project, exact Manifest, exact payload closure, and human version label"; OWS-R4 line 74: "Labels such as `1.2.3` are testimony, never identity or global ordering"; the identity-changing list (250-254) omits the label, leaving its role undefined. Stage A `ArtifactRelease/1` carries `versionLabel` in the Record body (b0-content-locators 788-796) and `RecordId = H(domain, typeSchemaId, canonicalBody)` (core-architecture-candidate 115), so under the B0 mapping (821) a label change is a new Release. The layered arm's `TypePackageRelease/1` also carries `releaseVersion` in-body (layered doc 658-664). The fixture ran a `VersionLabelClaim/1` label-out arm and says it "intentionally pressures current prose" (README 61) and "repair the draft toward label-out before promotion" (226-229). Not tracked anywhere (inbox reconciled 2026-08-14; architecture open questions 965-990 silent). MVP-relevant if any consumer publishes a Release.

**F3 — The store has a B0-specific written mapping and a layered-ABI-specific executed fixture, with no arm-neutral identity statement.** `UNDECIDED` · important · owner `efsv2` (arm) with `open-web-app-store` (neutral statement) · neighbour `owner`. `architecture.md` 816 "All mappings are candidate/B0 hypotheses"; 854-857 B0's 16-member closure limit; fixture README 7, 13, 70-141 (Views, QueryProfiles, `SELF`, 16 direct roots). Owner direction 12 (`web-client-os/README.md` 81-84) keeps the axis open; efsv2 README 75-80 calls the layered doc an experiment target. Until the arm is chosen, the store cannot say which of Manifest/closure/ceiling/profile-ID/label/index declarations perturb `PackageRelease` identity. Blocks any package bytes; does not block the File Browser MVP.

**F4 — `UpdateTrustState`/`UpdateTrustPolicy` are defined by the store and assigned to the OS, but the OS never defines them.** `UNDECIDED` · minor · owner `web-client-os` (per the store's own routing, inbox 29-30) · neighbour `open-web-app-store`. `architecture.md` 401-435 defines both and says the state is "Owned by the user agent/Web Client/OS"; `system-profiles-and-generations.md` mentions `UpdateTrustState` once (388) with no definition; `UpdateTrustPolicy` appears in no other file. The OS's own update posture for the first-party client uses `ChannelEnvelope` + opt-in acceptance (`architecture-and-modules.md` 727-730; owner direction 19) without either object. Not MVP-relevant.

**F5 — Three vocabularies for Project/Release/Artifact (Arcade, Core candidate/Stage A, store) and Arcade never references the store.** `UNDECIDED` · important · owner `efsv2` (canonical application-profile names) · neighbours `arcade`, `open-web-app-store`, `web-client-os`. Evidence in §4. The store claims Arcade pressure is "already incorporated" (README 188-191); the OS says Arcade "Fits … PackageHandoff" (`mvp-and-acceptance.md` 849); the Arcade docs (held, 2026-08-07/12) use `GameProject`/`GameRelease`/`ArtifactManifest`/`PlayablePackage`. Which object the one-game Andromeda slice publishes is unowned. MVP-relevant for the Arcade slice, not for the File Browser.

**F6 — "Finite catalog reconstruction / complete Realm-local enumeration" is a shared generic seam that three sets depend on and no set owns.** `UNDECIDED` · important · owner `efsv2` · neighbours `open-web-app-store`, `web-client-os`, Files. Store: `architecture.md` 847-852, 974-977 (points at Files' unproven `BindingScope`); OS: `web-client-os/README.md` 524-526 open question, `mvp-and-acceptance.md` 851 "Realm-local finite catalog enumeration still needs a pinned complete-page fixture"; Files: `hierarchical-files-and-folders.md` §5 658-722 ("must exist at Realm genesis", 699); efsv2 inbox: no entry, only LP-2's "wide sorted enumeration must earn separate mechanism and budget" (215-216). Because complete directory listing in the File Browser also rides on `BindingScope` (efsv2 README 86-89), this blocks the MVP for Files even though the store itself does not.

**F7 — The store's exit requirement (OWS-R14, mirroring after steward death) depends on the *portable* Envelope arm, but the efsv2 bakeoff that decides it does not list packages as a consumer.** `UNDECIDED` · minor · owner `efsv2` · neighbour `open-web-app-store`. `architecture.md` 842-846 and 970-973; fixture README 220-223 ("Fixture Occurrences are unsigned and include a Realm; mirroring reuses the retained source Occurrence rather than proving a portable envelope design"); `core-architecture-candidate.md` 155-158 and bakeoff row 416; `Designs/efsv2/owner-decision-inbox.md` V2-E3 consumer list (35-38) = "Arcade, Git, EAP, Nanda, Markdown, Topic/literal, and privacy" — no packages. Not MVP-relevant.

**F8 — Over-design relative to any product in the next year; a concrete cut list exists.** `CUT` · important · owner `open-web-app-store` (scope) and `owner` (ratify the cut). See §7: delta-chain editions (345-353), TUF-style trust policy/state (401-435), EVM helper profile (502, 513-523), connector/agent profiles (503-504), SLSA/in-toto/Sigstore/SPDX/CycloneDX evidence (380-399, 765-766), multigraph peer/hoist semantics + TS/Rust 10k resolver (287-300, 934), 100k+1M-spam catalog fixture (933), `PresentationOffer` (584-605). The store's own "Smallest required slice" (865-880) still demands a dependency Set, a catalog edition, an advisory, an R2 update and export/reconstruction — more than any consumer will exercise within a year (OS MVP excludes installation, `mvp-and-acceptance.md` 95-100; Arcade slice has no durable write, `arcade/README.md` 19-20). MVP-relevant only as scope discipline.

**F9 — Checklists require reviews from EAP and Nanda "owners" who do not exist.** `DEFECT` · minor · owner `open-web-app-store` · neighbour `vault-process`. README 124 ("Arcade, Media, Nanda, EAP, and other PMs own their application semantics"), 265; `architecture.md` 1011. `ls Designs` shows no EAP or Nanda folder; Nanda is `Brainstorms/2026-07-29-pm-nanda-neutral-agent-infrastructure-pressure.md`; EAP appears only as a fixture row in `system-constitution.md` 312 and in the OS consumer table. The checklist cannot be satisfied as written.

**F10 — Mutual `Depends on` cycle between the store and Web Client/OS spines blocks promotion of either under the vault's own rule.** `DEFECT` · minor · owner `vault-process`. `open-web-app-store/README.md` 5 → `web-client-os/README`; `web-client-os/README.md` 5 → `open-web-app-store/README`; `system-profiles-and-generations.md` 5 → `open-web-app-store/architecture`; `0001-design-system.md` 133 requires "all dependencies accepted or landed". Either relax the rule for peer product spines or replace one direction with `Inputs:`.

**F11 — Whether `PackageHandoff` has semantic Record identity is open on both sides and matters for the OS receipt.** `UNDECIDED` · minor · owner `open-web-app-store` · neighbour `web-client-os`. Fixture README 65 and its `limits` ("The handoff is modeled as an exact snapshot Record only for this arm; the product design has not decided that PackageHandoff needs stable semantic identity"); `system-profiles-and-generations.md` 243-244 ("A `PackageHandoff` may transport those facts but is not itself assumed to have semantic identity") and 236-239 (`SystemResolutionReceipt` may reference package receipts "or digest only after the package owner defines canonical receipt bytes"). Not tracked in `architecture.md` open questions. Not MVP-relevant.

**F12 — The store calls its conformance slice an "MVP" while the owner-defined MVP is the File Browser; the term now names two different things.** `DIRECTION` · minor · owner `open-web-app-store`. `architecture.md` §"Candidate product MVP" 859-903 ("reversible product and conformance skeleton… no execution is necessary") vs owner direction 2 (`web-client-os/README.md` 44-47) and `mvp-and-acceptance.md`. Rename to "conformance slice" to avoid a reader inferring a second product commitment.

**F13 — "Resolution" naming collision across Core, store and OS.** `DEFECT` · minor · owner `open-web-app-store` · neighbour `web-client-os`, `efsv2`. Evidence D6 above. Harmless today; will bite in generated codecs and DTO names (`type-data-abi-boundary-pressure` lane).

**F14 — Primary-source pins in the architecture could not be verified from this environment.** `UNVERIFIABLE` · minor · owner `open-web-app-store`. `architecture.md` 756-812 ("Checked 2026-08-14"): TUF 1.0.36, Uptane 2.1.0, SLSA 1.2, in-toto 1.2.0, SPDX 3.0.1, CycloneDX 1.7, OCI 1.1.1, Nix 2.35, IWA docs, PyPI 2026-04-02 incident (119,000 downloads / 2 h 32 min). The egress proxy rejected every non-GitHub host (`connect_rejected`; PyPI blog returned 403). Nothing suggests error; simply unchecked.

**F15 — (Positive, verified) The fixture's 71/71 claim and structural numbers reproduce on a different Node/OS.** Not a defect; recorded so Phase 3 does not re-verify. Evidence §1.4. Only the wall-clock numbers differ, as the README anticipates.

**F16 — Nobody says whether the EFS Web Client itself is ever a store `SoftwareProject`/`PackageRelease`.** `MISSING` · minor · owner `web-client-os` · neighbour `open-web-app-store`. The OS keeps the client's release first-party (`AppReleaseGeneration`/`ReleaseClosure`/`ChannelEnvelope`, `architecture-and-modules.md` 627-631, 721-730; `system-profiles-and-generations.md` 443-444); the store's product direction wants a store that lists software, and owner direction 11 (`web-client-os/README.md` 78-80) plans an `sdk` and `webclient` repo. Whether the client's own updates flow through the store later, or never, is unstated. Not MVP-relevant.

**F17 — The EVM-helper package profile was imported from the branch-only census with no consumer.** `CUT` · minor · owner `open-web-app-store`. Commit `da0aec2` (2026-08-22) added `architecture.md` 502, 513-523, fixture row 939 and README 204-212 (CREATE2, proxies/diamonds, `delegatecall`, code indexes). No product, Arcade slice, or OS lane consumes it; it broadens the profile vocabulary before any profile has a byte. Fold into F8's cut list if the report prefers fewer items.

**F18 — The store lane has no consumer with a delivery date; it is a vocabulary and a pressure instrument, not a product track.** `DIRECTION` · important · owner `owner` · neighbours `open-web-app-store`, `arcade`, `web-client-os`. Within a year: File Browser MVP (excludes packages), one-game Arcade slice (adapter, no durable write, held queue), first-party client release (outside the store). The store's own work sequence step 3-4 (README 225-232) proposes a "next disposable resolver arm" and later "one finite catalog edition… one exact executable package"; neither has a requesting consumer. Recommendation for the report: keep the spine as the shared vocabulary for Project/Release/closure/handoff (after F2/F3/F5 are settled), freeze nothing, and start no resolver until Arcade's slice needs a second package.

---

## 12. Solid enough to build on now / settle first / cut

**Solid now (build on it, reversibly):**
- The one-way `PackageHandoff` boundary and the `InstallBindingGeneration` + `InstallStatusLedger` split — named identically and confirmed on both sides (§3).
- The requirement themes OWS-R1…R6, R13, R14, R16, R17 as product law; they restate constitution/owner outcomes and no neighbour contradicts them.
- The fixture's verified behaviours: closed reference roles instead of `ANY`, inert hostile catalog records, unknown capability dimensions → `UNSUPPORTED` with zero grants, retained-state reconstruction after publisher/catalog/forge loss (fixture README 70-193; reproduced §1.4).
- The "no Core change" posture (`architecture.md` 832-838) — consistent with `core-architecture-candidate.md` falsifier 9.

**Settle first (before any package Type, bytes, or Arcade release object):**
1. F3 — which Type arm (owner/efsv2), or at least an arm-neutral identity statement.
2. F2 — label in or out of `PackageRelease` identity; align `ArtifactRelease/1`/`TypePackageRelease/1`.
3. F5 — one Project/Release/Artifact vocabulary shared by Core worked examples, Arcade, and the store.
4. F6 — who owns the complete-enumeration fixture (`BindingScope` or smaller).

**Cut for an MVP:** the list in §7 / F8, F17.

---

## 13. Unverifiable from here

- Obsidian rendering of `#InstallBindingGeneration` against a backticked heading (§3.2).
- Every non-GitHub primary-source pin in `architecture.md` 756-812 (F14).
- The fixture README's Node v26/Darwin timing figures (only structural results and determinism were reproduced).
- Whether the media-library spine agrees with the store's Media bullet (README 213-216) — that spine belongs to another lane.
- Whether `codex/sdkv2-pm` will be merged; its content was read only via the raw permalink header (272-line census, status "reference", last touched 2026-08-22).
