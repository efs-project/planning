# EFS Data Explorer — architecture, navigation and state

**Status:** draft — product architecture comparison and reversible interface target
**Target repos:** planning, client, sdk
**Depends on:** [[README]], [[product-charter-and-roadmap]], [[Designs/web-client-os/architecture-and-modules]], [[Designs/web-client-os/type-data-abi-boundary-pressure]]
**Supersedes:** —
**Reviewers:** —
**Last touched:** 2026-08-25

#status/draft #kind/design #repo/planning #repo/client #repo/sdk #topic/read-path #topic/graph-queries #topic/app-model #topic/privacy

## Problem

The Explorer needs desktop-grade navigation and manipulation, multiple typed
views, exact provenance and hostile-data diagnostics without creating a second
Reader Kernel, embedding candidate Core/Files bytes in UI state, or letting
extensions become truth. It must work in a clean browser and later integrate
with richer Web Client/OS services without making those services guest
prerequisites.

## Architecture approaches

### A — File Browser plus panels

Extend the shared minimal File Browser with a property table, graph panel and
raw Inspector.

**Advantages:** smallest initial bundle; immediate reuse of Files journeys;
fewest new interfaces.

**Failure mode:** path/tree state becomes the product model. Exact IDs, queries,
provenance streams, packages, Git/EAP/media objects and same Object under
several placements become awkward exceptions. Rich state leaks into the Web
Client/OS shell, and “any typed graph” remains a debug panel rather than a
first-class job.

**Disposition:** retain as the guest Files prototype, reject as the durable
outer architecture.

### B — Qualified typed Explorer workbench — recommended

Reuse the shared Protocol/Realm/Files/Artifact Reader contracts. Add an
Explorer-owned workspace, inventory/query controller, finite projection
registry, built-in views, provenance Inspector and local coverage/cache state.
Route every mutation to the shared Web Client/OS action boundary.

**Advantages:** Files and arbitrary typed resources share one truth contract;
view/layout changes remain local; web/CLI/native shells can reuse one exhaustive
outcome/evidence law through versioned domain façades; raw fallback is
structural; extension authority can be bounded. Product DTO shapes may differ;
they do not collapse into one lowest-common-denominator object.

**Costs:** more explicit state identities, adapter versions and result handling;
the SDK/Reader boundary must support lossless raw inspection and qualified
pages; view migration and accessibility need deliberate design.

**Disposition:** written comparison target and basis for disposable labs.

### C — Mini OS with event-sourced workspace and extension host

Boot a package/runtime/capability environment; model every navigation, edit,
extension and undo action in a durable workspace journal.

**Advantages:** powerful custom workflows, replay, offline collaboration,
automation and auditable batch operations.

**Failure mode:** public links pay OS/package cost; Explorer duplicates the OS
capability and activation system; journal retention becomes a privacy hazard;
extensions shape the core product before the read/result law is stable.

**Disposition:** reject for MVP. Borrow an optional local activity/operation
journal later, and consume the actual OS extension host rather than creating a
second one.

## Layer and ownership model

```text
Untrusted EFS state and carriers
  -> Protocol SDK / Realm Reader / Artifact verifier       [shared]
  -> Files resolver and domain reducers                    [shared/owned by domains]
  -> Explorer resource/page/trace boundary                 [joint contract]
  -> Workspace + navigation + query controller             [Explorer]
  -> Built-in projection host + Inspector                  [Explorer]
  -> UI / structured agent-read surface                    [Explorer]

Optional mutation:
  Explorer intent + exact selection snapshot
  -> shared action planner / capability broker / System Chrome
  -> signer / submitter / Realm
  -> shared receipt + canonical Reader read-back

Optional extension:
  verified inert package evidence
  -> OS/shared capability broker
  -> attenuated read-only page/byte/derived-output handles
  -> Explorer projection slot
```

The Explorer owns no signer, wallet connector, Principal controller history,
package resolver, installation state, Core query index, Files authority or
extension marketplace. It owns how users navigate, configure views, select
data, understand evidence and express bounded intents.

## Explorer application modules

| Module | Responsibility | Must not own |
|---|---|---|
| Route and Location adapter | Accept explicit EFS URLs, direct IDs, saved locations, query intents and explicitly enabled external-reference inputs; sanitize product input and request a versioned shared Reader/Artifact adapter | Semantic resolution, external codec/gateway/callback execution, provider or implicit chain/ABI selection, network/SSRF/redirect/privacy policy, byte verification, wallet detection or hidden hosted index |
| Workspace controller | Tabs, panes, back/forward/up, history, selection, active view, compare and task references | Semantic truth, query completeness, package activation |
| Inventory/query controller | Page/cursor lifecycle, query AST, coverage ledger, local filter/sort/group and resumable budgets | Fabricated global completeness or a canonical search provider |
| Projection registry | Select built-in or explicitly activated finite projection by exact supported input/profile; preserve raw fallback | Type self-registration, action authority, silent future-Type acceptance |
| Built-in view host | Tree/list/grid/table/cards/gallery/timeline/graph/raw presentation and accessible interaction | Realm reads, signer calls, executable content |
| Provenance/history Inspector | Exact IDs, qualification axes, candidate/selection traces, revisions, byte attempts, transcripts and redacted export | Declaring one source “official,” rewriting history, trusted permission prose from data |
| Selection and batch controller | Exact selection snapshots, intent grouping, conflict/atomicity policy and per-target review | Submission, signatures, bypass of shared planner |
| Local workspace store | Favorites, recents, view specs, retained-resource manifests, drafts, task references and migrations | Canonical EFS state or implicit publication |
| Extension bridge | Attenuated ports/handles, budgets, derived-output validation, lifecycle and fallback | Package identity, installation truth, ambient capabilities or canonical result codes |
| Accessibility/command service | Stable commands, focus model, shortcuts, announcements, input-mode parity | Hidden action semantics different from UI/agent paths |

The hot-path module boundary is logical. A measured implementation may keep
Reader and built-in view reducers in one trusted process while preserving the
interface and dependency direction.

## Joint Reader / Explorer boundary

Names below are conceptual product contracts, not frozen TypeScript, WIT,
JSON, SDK or protocol bytes.

### `EXP-C0/v0` trace-bound result law

The current disposable Core control contributes one non-public input contract:
the Explorer must render the seal's **literal** qualified result envelope, not
reduce it to the earlier product-friendly status names. For the C0 pressure
slice, the Reader retains and the Inspector can disclose:

```text
ResultV0 {
  kind
  exact subject or declared finite domain
  RealmId + RealmRevision + execution coordinate + admission high-water
  optional observer block hash + state root/source + finality/freshness evidence
  result profile over all axes below
  value/page/receipt/bytes payload when applicable
  exact policy/profile/code/provenance commitments used
  projection-integrity result
}
```

The result profile retains distinct `presence`, `coverage`, `support`,
`validation`, `authority`, `lifecycle`, `selection`, `bytes`, `effect`, and
`projection integrity` axes. The App may choose concise labels and defer detail
to the Inspector, but it may not omit, merge, fabricate, or replace an axis.
Canonical Record/Occurrence/byte inputs and their exact encodings remain below
the façade and remain exportable through the raw/evidence path. This paragraph
does not freeze `ResultV0` as an SDK or Explorer export.

The [[Reviews/2026-08-25-data-explorer-exp-c0-consumption/README|C0 clean-room consumer packet]]
locks this boundary through five serialized inputs only. Its role-neutral source
receipt retains the exact Core handoff, while the Explorer report retains raw
Result bytes, raw known and opaque Type envelopes, the literal qualification
codes, and the derived projection separately. The checker owns no Core codec,
resolver, verifier, Lens reducer, or source module. This static contract pass is
not a Reader implementation, E1a UI execution, E1b cold-browser trace, or
conformance result.

An opaque page cursor is an uninterpreted continuation token to the App, **not**
an under-specified commitment. The disposable C0 cursor binds, at minimum,
`RealmId`, exact `QueryProfileId`, exact Type, activation generation, Realm
revision, declared ordering, admission high-water, and the exact observation
basis. The resume request must bind the same tuple. Any missing, changed, or
unavailable member returns the qualified `UNKNOWN`, `PARTIAL`, or `UNSUPPORTED`
outcome required by the Reader; it never resumes against a new basis, quietly
starts a new stream, or turns an empty page into absence. This commitment law
applies even where the first point-read slice has no page.

### First vertical slice — direct guest to raw evidence

The first C0 pressure journey is deliberately smaller than the Files MVP:

```text
explicit direct guest route
  -> exact Realm bootstrap + Realm revision + observation basis
  -> one exact Type + immutable Record + authored/admitted Occurrence
  -> verified eligible byte acquisition (including corrupt-primary/fallback)
  -> built-in raw/provenance Inspector carrying ResultV0
```

The route is a product selector, not a future URI grammar. It may request a
friendly Files location only when the shared Reader returns the exact selected
subject under the retained basis. The built-in raw Inspector is the only view
required to finish this slice; tree/list/grid/table views consume the same
qualified resource/page boundary later and cannot delay, reinterpret, or hide
the vertical result. Extensions are disabled.

```text
ExplorerOpenRequest {
  resourceSelector          # route/path, direct ID, explicit set or query
  readContext               # Realm/Core/basis/finality/freshness/purpose
  adapterProfile
  transportPolicy
  coverageRequirement
  deadline + cancellation
}

ExplorerReadResult<T> =
  ResourceOutcome<ExplorerResource<T>, ExplorerPartial<T>>
  # exhaustive discriminated union; never optional value plus loose status

ExplorerResource<T> {       # PRESENT branch only
  exactResourceRef
  friendlyRefs[]
  value: T
  typeAndValidation
  provenance
  authorityAndSelection
  sourceObservation
  basisContext
  canonicalityObservation
  canonicalityAssessment
  finalityAndFreshness
  evidenceGradeSummary
  coverageCompleteness
  historyAvailability
  byteSummary
  evidenceHandles[]
  rawHandle
}

ExplorerPartial<T> {        # PARTIAL branch only
  knownFragments?
  missingCoverage[]
  qualification
  readEvidenceSummary
  historyAvailability
  evidenceHandles[]
  resume?
}

ExplorerPage<T> {
  source + queryDefinition
  requestedBasis
  rows[]
  pageCursor + resume?
  physicalCoverage
  semanticCoverage
  completeness
  qualification
}
```

`T` is a versioned Explorer/domain façade DTO for the selected experiment, not
an arbitrary publisher-defined object or a universal cross-product DTO.
Unknown Types remain a qualified raw resource and may be shown through the
read-only universal Inspector. Evidence handles are opaque, scoped,
non-forgeable and disclosure-filtered. The UI never receives live provider,
wallet, gateway, verifier, contract or storage objects.

Concrete façades may name and serialize fields differently. Every façade must
preserve the exhaustive outer outcome plus requested and observed chain/Realm/
block basis, requested and observed finality, canonicality request/provider
response and separately qualified assessment/evidence, source and evidence kind,
authority/currentness, physical and semantic coverage, archive/history
capability and causal availability, byte state, and disclosure-filtered attempt
evidence. Product DTOs may add presentation fields; they may not merge, replace
or reinterpret these axes. This is an observable product requirement, not
adoption of an SDK profile, public API, result registry or bytes.

Explorer declares read, coverage and presentation requirements and renders the
returned evidence. Shared SDK/Reader/Files/Artifact adapters select sources,
execute calls/pages/logs against explicit bases, verify proofs and bytes, map
transport/history failures and—only for an explicitly enabled optional import
adapter—enforce explicit chain/basis/interpretation plus network/SSRF/redirect/
privacy/resource policy, execute the callback and retain its contract-returned,
basis-qualified result. Any stronger callback-validation label requires exact
profile evidence. Explorer neither recomputes those facts nor creates a second
resolver, verifier or Lens reducer.

## Web Client/OS application-boundary pressure checkpoint

The current candidate split survives as a hypothesis:

| Layer | Candidate responsibility | Data Explorer pressure |
|---|---|---|
| Kernel / shared Reader | Realm/Files resolution, qualified reads, exact byte verification, directory/query coverage and canonical evidence | Explorer calls it; it does not fork a resolver, verifier, Lens reducer or negative-cache law |
| System Chrome | Conserved capability, install, recovery, signer and submission ceremony | Explorer supplies exact intent/selection and renders the returned plan/outcome; it cannot replace trusted copy or grants |
| Shell | Trusted app container, navigation chrome, safe surfaces and optional capability/extension broker | Explorer is one built-in app and must retain direct guest usefulness without hydrating unrelated OS services |
| Data Explorer App | Locations, tabs/panes/views, selection, bulk-operation UX, provenance/history inspection, local workspace policy and extension choice | Product state is derived/local and cannot set protocol truth or ambient authority |

This does not adopt those layer names or require separate processes/bundles.
The dependency and authority direction is the property under test.
An in-memory/fake adapter can validate that direction inside the App, but cannot
prove the product boundary. The direct-guest claim additionally requires E1b's
cold-browser trace through the real disposable SDK adapter and direct public
Realm reads, with optional services and warm state removed. The shared guest
adapter may be packaged as the Web Client/OS candidate `Reader Kernel`; the App
stays above that boundary, while System Kernel/full-OS/Shell services stay out
of the cold read path.

### Smallest journeys that can falsify the split

1. **Cold guest folder to corrupt file:** first replay the sealed facts through
   E1a's fake source, then open the same direct Files route in E1b through the
   real disposable adapter/public Realm path, page a partial directory and
   reject a corrupt primary while using a verified fallback. If the qualified
   facts differ, an optional index/warm cache is required, a dependency is
   untraced, or Explorer must resolve Files semantics/verify bytes itself, the
   shared Reader boundary is too weak.
2. **Unknown exact Record to raw evidence:** open an unsupported Type, inspect
   exact identifiers/bytes/provenance and export a redacted trace. If an app
   needs SemanticSpec/Shape/Representation internals merely to remain useful,
   stable domain DTO plus raw/evidence handles are insufficient or misplaced.
3. **Selection refresh and batch rename:** freeze three entries, refresh onto a
   new basis, request rename and inspect a stale/conflicting plan. If Explorer
   manufactures preconditions or signs/submits directly, or System Chrome
   cannot conserve the same plan across pointer/keyboard/agent paths, the
   action split fails.
4. **History with missing bytes:** explain author, admission and current
   selection for two revisions while one body is unavailable. If provenance
   requires a second app-owned Lens reducer or byte absence changes semantic
   history, the evidence DTO is lossy.
5. **Malicious third-party table:** activate a projection over an exact page;
   it falsely claims completeness, crashes and requests network/signer access.
   If it can inject active HTML/custom elements into the trusted Shell realm,
   change host truth/action copy or block raw fallback, the extension/Shell
   boundary fails.
6. **Guest-to-write promotion:** begin in the direct guest app, request a write
   and cross into identity/grant/signing only then. If the initial read needed
   those services, or promotion changes read semantics, the App/Shell split
   fails.

### Minimum extension lanes

The initial product needs only trusted built-ins. The minimum forward-compatible
sequence is:

1. inert, validated declarative descriptors whose labels/layout hints are
   host-interpreted and carry no capabilities;
2. host-owned semantic surfaces driven by bounded, revocable capability RPC
   when declarative projections prove insufficient; and
3. opaque-origin Web surfaces only for use cases that cannot fit a host-owned
   surface and only after the isolation lab passes.

Installation alone never registers custom elements, imports active HTML or
script into the trusted Shell realm, activates a module or grants data. The
Explorer requires no executable third-party lane for MVP.

### Smallest generic shared interfaces genuinely needed

The experiments need observable behavior, not these names or encodings:

- a provider-neutral open/resolve call returning one exhaustive qualified
  resource outcome under an explicit read context, with source observation,
  explicit block-hash basis, requested/observed finality, canonicality
  observation/assessment, evidence kind and causal history availability kept
  independent;
- a paged inventory/query call returning stable row DTOs plus source, basis,
  order, cursor/resume, coverage, completeness and history-frontier evidence;
- a verified artifact handle for metadata and bounded ranges that retains all
  acquisition attempts without exposing provider credentials;
- a raw/evidence handle for exact identifiers, canonical encodings and
  disclosure-filtered trace traversal/export;
- a deterministic action request/plan/receipt/read-back interface with exact
  selection, preconditions and per-effect outcomes; and
- when non-built-ins arrive, a shared capability/extension broker with
  lifecycle, attenuation, revocation, resource budgets and host-owned trusted
  UI slots.

If one generic resource envelope becomes too abstract, the acceptable
alternative is versioned domain DTOs behind one common outcome/context/evidence
law. If opaque evidence handles prevent deterministic exit, the alternative is
a versioned redacted transcript plus exact canonical references. The Explorer
does not need general SemanticSpec/Shape/Representation/View/QueryProfile
machinery in ordinary app code; those mechanisms stay under generated adapters
and become visible only in the explicit Inspector/debug surface.

## Five independent state dimensions

### 1. Resource identity

What is being inspected:

- exact Record, Object, Occurrence, Files view/path terminal, FileRevision,
  package Release/closure or query definition;
- friendly/moving aliases retained only as discovery evidence; and
- semantic identity distinct from representation/byte identity.

### 2. Read context

Why the result means what it says:

- chain/Core/Realm and implementation/admission revision;
- block/state/admission basis;
- Route, Mount and namespace/content/metadata Plans where applicable;
- finality/freshness policy and assessment;
- Type/QueryProfile/finite inventory or BindingScope coverage;
- provider/transport policy, budgets, cancellation and purpose; and
- consumer adapter/profile acceptance.

### 3. Workspace presentation

How the person is looking at the result:

- tabs, pane arrangement and navigation stack;
- active `ExplorerViewSpec`, visible fields, filters, sort/group and density;
- expanded graph/tree nodes, selection and focus;
- Inspector section and local compare state; and
- ephemeral, personal or explicitly shared persistence scope.

This state cannot raise authority, completeness or capability.

### 4. Local retention and derivation

What this device can reproduce without the network:

- exact retained resources and verified ranges;
- page/query coverage manifests and last assessed freshness;
- derived thumbnails, sort indexes and extension output with source lineage;
- local drafts, favorites, recents and history; and
- storage/profile generation and migration status.

### 5. Action/authority state

What may change and where the operation is:

```text
READ_ONLY_GUEST
  -> EXPLORATORY_DRAFT
  -> PLAN_READY
  -> SIGNABLE
  -> AUTHORIZED
  -> SUBMITTED
  -> ADMITTED / PARTIAL_EFFECT / FAILED / UNKNOWN
  -> READ_BACK_MATCH / READ_BACK_MISMATCH / READ_BACK_UNKNOWN
```

The transition to `SIGNABLE` requires the actual signer and historical
authorization basis. A connected wallet is not the state transition.

## Navigation snapshot

Each back/forward/tab entry retains:

```text
NavigationSnapshot {
  locationRequest
  resolvedExactContext?       # absent while initial resolution is pending
  explorerViewSpecRef
  paneLayout
  inventoryCursorBoundary
  selectionSnapshot?
  focusedItem?
  inspectorState
  localRetentionRef?
}
```

Restoring a live/following location re-evaluates current state and shows the
prior observation until replaced. Restoring an exact citation replays the exact
basis or returns typed history unavailability. It never silently substitutes
latest state.

## Read flows

### Location / Files flow

```text
sanitize input
 -> establish explicit read context
 -> resolve semantic path/object
 -> return qualified outcome and first page
 -> paint rows plus coverage status
 -> continue same-basis pages
 -> optionally acquire verified bytes/ranges
 -> select built-in projection
 -> expose transcript and exact citation
```

The guest path has exactly zero wallet, signer, account, package-install,
private-store, inference or full-OS requests. A cached current result is shown
with its old basis while revalidation runs; it is never relabelled current by
display time.

### Typed query/table flow

```text
explicit exact Type/query/profile or finite inventory
 -> validate query and budget
 -> request basis-qualified page
 -> retain raw row + exact Type + provenance
 -> project supported rows into typed columns
 -> show unsupported/unknown rows without dropping them
 -> local sort/filter only within declared loaded coverage
 -> continue or export with coverage/loss manifest
```

A local filter over three loaded pages cannot claim the result of filtering the
unloaded universe. A provider may perform wider queries, but its identity,
query, basis, coverage and Core verification remain visible.

### Provenance/history flow

```text
selected resource
 -> exact semantic identity
 -> authored Occurrences and Realm receipts
 -> Binding/current-selection history at the named basis
 -> revision/derivation/predecessor relationships
 -> byte/Locator attempts and projection receipts
 -> compare, exact cite or redacted export
```

History can be `COMPLETE`, `PARTIAL`, `UNKNOWN` or unsupported for the requested
scope. A current head is not the whole history; an authored claim is not
effective selection; a projected table row is not the source Record.

## Write, batch and undo flows

### Single mutation

```text
exact selection + pinned read context
 -> bounded intent
 -> deterministic ActionPlan
 -> precondition / authority / privacy / cost review
 -> lazy identity and signer resolution
 -> conserved authorization
 -> submit and monitor per effect
 -> canonical read-back through Reader
 -> ActionReceipt + updated pane from read-back
```

Unknown preconditions, authority or required coverage return a non-signable
`PLAN_UNKNOWN` or `PLAN_UNSUPPORTED`. A proposal-only direct-Core write is
visibly experimental and cannot claim Files-level `NOREPLACE`, overwrite,
rename or view certification.

### Batch mutation

Every batch declares:

- exact selection snapshot and basis;
- operation per target and predicted new identities/commitments;
- `ATOMIC` versus `BEST_EFFORT` behavior and whether the underlying route can
  actually provide it;
- overwrite/collision/conflict policy;
- cross-Principal and cross-Realm boundaries;
- disclosure, carrier and fee effects;
- ordering and concurrency limits;
- stop/continue policy after one failure; and
- compensation options for completed effects.

The preview lists every target or a deterministic page/closure commitment whose
membership can be inspected. “Apply to 10,000 items” cannot hide an unstable
live query behind one count.

### Copy and move

- Same-Realm Files rename/move may be certified only by the proven shared
  Files action boundary.
- Cross-Realm “move” is copy/publish, verify at the target, then a separately
  authorized unlink/mask at the source. It never claims atomicity.
- Copy creates the required new logical identity where Files semantics require
  it; reusing exact bytes does not imply shared ownership or history.

### Undo / redo / restore

The local workspace command stack may reverse presentation-only changes.
Durable actions require a new plan:

```text
original ActionReceipt
 -> derive allowed inverse/restore/compensation intent
 -> resolve current state and conflicts
 -> preview new effects and retained history
 -> authorize and execute normally
 -> link new receipt to original as local/durable evidence where defined
```

If no safe inverse exists, the UI says so. Redo regenerates a plan; it never
reuses an old authorization or assumes unchanged preconditions.

## Failure-state vocabulary

### Semantic resource outcomes

The Explorer adopts the shared exhaustive law and presents at least:

| Outcome | Meaning / UI law |
|---|---|
| `PRESENT` | The named semantic claim is established at the shown context; not a claim of byte availability, universal trust or timeless currentness |
| `PARTIAL` | Some value/rows are available but required coverage is missing; show missing coverage and resume |
| `UNKNOWN` | The requested claim cannot be proved or disproved; show causal reason and resume |
| `ABSENT` (UI: “absent proven”) | Complete-basis proof establishes absence; only this shared outcome or a selected `MASKED` may become not-found |
| `MASKED` | A selected whiteout/policy intentionally hides lower candidates; preserve scope and evidence |
| `CONFLICT` | Competing candidates prevent one result; show candidates and selection policy |
| `INVALID` (UI may say “malformed selected data”) | Authenticated/selected data fails the required profile; do not fall through silently |
| `UNSUPPORTED` | Adapter/profile/Type/interface is not understood; raw evidence remains inspectable |
| `ACCESS_REQUIRED` / `OPAQUE` | A private/capability boundary is present; reveal no child/negative information |
| `RESOURCE_LIMIT` | Declared CPU/memory/page/depth/time budget stopped work; offer bounded resume where safe |
| `LOOP` | Active traversal re-entered the same qualified context |
| `NOT_A_DIRECTORY` / `NO_CURRENT_VERSION` | Files-specific semantic failure, distinct from absence |

Provider observation, authenticated header evidence, finality evidence, locally
verified state proof, locally verified receipt/log proof, query coverage and history
availability are independent Inspector facts. History availability is an
independent causal qualification on every applicable semantic outcome, not a
new absence outcome. A pruned/expired source, archive-range exclusion, exact-
basis refusal, missing old body/receipt/state or invalid/incomplete proof never
proves the semantic claim absent or permits silently following latest. A
retained complete-basis absence proof may remain `ABSENT` while current history
serving is unavailable; retained historical presence evidence likewise remains
meaningful while referenced payload/blob bytes are separately unavailable.

### Byte outcomes

| Outcome | Meaning / UI law |
|---|---|
| `BYTES_VERIFIED` | Requested range/closure matched the exact commitment; retain all failed attempts |
| `BYTES_TAMPERED` | Complete eligible coverage contained tampering and no verified bytes; semantic object remains present |
| `BYTES_UNAVAILABLE` | Complete eligible coverage found no usable bytes and no tampering |
| `BYTE_STATUS_UNKNOWN` | Eligible Locator/coverage is incomplete or unresolved |
| `BYTE_POLICY_DENIED` | Local transport/privacy/capability policy blocked acquisition |
| `BYTE_CANCELLED` | Request stopped deliberately; attempts and resume remain |
| `RANGE_NOT_SATISFIABLE` | Requested range is outside a verified known size |

A corrupt primary plus verified fallback is `BYTES_VERIFIED` with a retained
tampered attempt. Tampering never changes the FileRevision or commitment.

### Qualification axes

The experiment facts matrix is the complete evidence crosswalk: presence,
coverage, support, validation, authority, lifecycle, selection, observation,
bytes and effect. The compact product axes below are a presentation projection
over that crosswalk, not a replacement or an adopted Core/SDK vocabulary. The
Inspector retains the underlying evidence and any dimension that the compact
projection cannot honestly express.

These are grades, not one status badge:

```text
typeValidation
historicalAuthority
RealmAdmission
BindingOrLensSelection
sourceObservation + evidenceKind
basis
canonicalityObservation + canonicalityAssessment
finality + freshness
coverage + completeness
historyCoverage + historyAvailability
byteIntegrity + availability
consumerAcceptance
```

The compact status can say, for example, “Present · partial inventory · bytes
unknown · provisional basis.” The Inspector carries exact evidence.

### Plan and action outcomes

Planning preserves:

```text
PLAN_READY
PLAN_INVALID_INTENT
PLAN_DENIED
PLAN_CONFLICT
PLAN_UNKNOWN
PLAN_UNSUPPORTED
PLAN_CANCELLED
```

Execution/receipt presentation preserves per effect:

```text
NOT_STARTED | AUTHORIZED | SUBMITTED | ADMITTED | FINAL
FAILED | REJECTED | CANCELLED | UNKNOWN
READ_BACK_MATCH | READ_BACK_MISMATCH | READ_BACK_UNKNOWN
```

Exact registry names/bytes remain with the shared action owner. Explorer copy
never substitutes for the machine state.

### Extension outcomes

```text
NOT_INSTALLED
UNVERIFIED
INCOMPATIBLE
PERMISSION_REQUIRED
PERMISSION_DENIED
SANDBOX_UNAVAILABLE
RESOURCE_LIMIT
TIMEOUT
CRASHED
OUTPUT_INVALID
REVOKED
```

Every extension failure falls back to built-in/raw inspection and cannot
rewrite the underlying resource outcome.

## Cache and local-state namespaces

Keep independent stores and keys for:

1. **semantic reads:** exact resource + Realm/basis/policy/coverage;
2. **verified chunks/closures:** exact byte commitment and range geometry;
3. **derived output:** source commitments + projection/implementation version;
4. **workspace state:** local profile generation + resource/view references;
5. **extension state:** extension identity + capability scope + generation;
6. **private data/secrets:** shared OS encrypted service, never ordinary cache;
7. **drafts/plans/receipts:** exact interface/profile and authority state; and
8. **negative results:** only shared `ABSENT` carrying complete-basis proof or protocol
   `MASKED`, keyed by exact context and expiry/revalidation law.

Evicting any cache changes performance/retention only. It does not change
identity, authority or the meaning of prior evidence. Derived thumbnails or
tables never become source bytes.

## Concurrency and task model

- Each read/query/byte/action task has an ID, parent resource/context,
  cancellation token, budget, progress law, result and resumable continuation.
- A new navigation may leave an explicitly pinned background task running or
  cancel it; stale task output cannot overwrite a newer pane context.
- Page merges require identical source/query/basis/profile and cursor chain.
  Cross-basis rows open a comparison, not one list.
- An action plan pins its selection/context; a later read refresh may mark it
  stale but cannot mutate it in place.
- Worker/extension crashes release handles and surface a result; they do not
  strand the underlying Reader task or trusted UI.

## Architecture falsifiers

Reject or substantially redesign this architecture if:

- the direct-guest claim is supported only by an in-memory/fake source rather
  than a cold real-adapter/public-Realm trace with optional services removed;
- guest navigation loads wallet, profile, package, agent, private-store or OS
  code/requests before useful data;
- Files and generic typed resources require different basis/outcome laws;
- a view/layout/filter can alter semantic identity, authority or completeness;
- an unsupported Type or crashed projection becomes an absent/empty row;
- raw inspection depends on a publisher, catalog, generator or extension;
- Web Client/OS and Explorer action paths produce different plan digests or
  result semantics for identical inputs;
- disabling third-party code makes a resource unreachable;
- cache eviction or network failure changes identity or creates negative
  results;
- extension capability checks require trusting extension output or display;
- dual-pane/cross-Realm UI implies atomicity that the underlying operations do
  not provide; or
- interface serialization creates guest critical-path waterfalls that cannot
  be removed while retaining logical isolation.

## Open questions

- [ ] Can `ExplorerResource` and `ExplorerPage` be thin views over the current
      shared Files/Reader DTOs, or is one generic resource envelope needed for
      non-Files Types? Prove with Files plus EAP or Git, not naming preference.
- [ ] Which local task/activity history is worth retaining across sessions, and
      what privacy/expiry/export defaults prevent it becoming surveillance?
- [ ] Does a read-only generic descriptor tree belong in the trusted process,
      a Worker, or the raw Inspector's sandbox? It must remain non-authoritative
      in every arm.
- [ ] Which batch operations can honestly promise atomicity at MVP scope?
      Everything else needs explicit best-effort and compensation semantics.

## Pre-promotion checklist

- [ ] Two non-Files resource families use the same exact context/outcome boundary
- [ ] Guest and OS-hosted boot profiles produce semantically identical fixed-corpus results
- [ ] Every state field belongs to exactly one of the five dimensions
- [ ] Cache namespaces and negative-cache law pass hostile fault injection
- [ ] Single, batch, undo and cross-Realm traces never overstate atomicity or reversal
- [ ] Failure vocabulary is lossless across UI, structured agent and export surfaces
- [ ] Architecture falsifiers pass in disposable implementations
- [ ] At least one independent architecture/security review is recorded
