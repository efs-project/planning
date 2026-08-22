# EFS Data Explorer — product charter and roadmap

**Status:** draft — first-pass product proposal; feature order and implementation remain evidence-gated
**Target repos:** planning, client, sdk
**Depends on:** [[README]], [[architecture-and-state]], [[views-extensions-and-capabilities]], [[research-landscape]]
**Supersedes:** —
**Reviewers:** —
**Last touched:** 2026-08-22

#status/draft #kind/design #repo/planning #repo/client #repo/sdk #topic/read-path #topic/graph-queries #topic/app-model #topic/privacy #topic/content

## Problem

EFS needs one primary place where a person can browse ordinary files and also
understand the typed graph beneath and beyond them. A conventional file manager
is necessary but insufficient: EFS resources may be exact Records, stable
Objects, authored Occurrences, current Bindings, finite queries, provenance
claims, package closures, media representations, Git history or application
objects. Their identity, current selection, authority, query completeness and
byte availability are not one boolean.

Existing EFS clients are legacy debug evidence. The current Web Client/OS set
owns a fast direct guest path and optional promotion into writes and the OS; it
does not own a complete general-purpose data workbench. The Data Explorer must
make deep evidence legible without becoming an OS, SDK debugger or opaque
database console.

## Product promise

For any explicit EFS location, exact identifier or bounded query, the Explorer
lets a guest:

1. reach the resource without wallet, account, Commons or OS boot;
2. see useful data in an appropriate built-in view;
3. inspect the exact basis, provenance, authority, coverage and byte attempts;
4. switch to raw, history, table, graph or other bounded projections without
   changing truth; and
5. if authorized, propose changes through an exact plan and retain a durable
   receipt and canonical read-back.

## Primary users and jobs

| User | Primary job | Required trust posture |
|---|---|---|
| Curious guest | Follow a link, browse a folder or object, preview/download safely and understand a problem | Zero wallet/account assumptions; concise status with optional evidence |
| Data investigator | Inspect Types, references, provenance, competing claims, histories, exact bytes and query coverage | Lossless raw path, exact citation, comparison and export |
| Curator / organizer | Filter, sort, group, tag, compare, save personal views and prepare bounded batch changes | View state distinct from data authority; visible source and selection basis |
| Author / maintainer | Create, revise, move, copy or mask data and verify the canonical result | Explicit Principal/signer basis, effects, cost/disclosure, consent and receipts |
| Application developer | Test one exact Type/projection/query contract and diagnose unsupported data | Stable DTO/result law, raw evidence, no hidden catalog or SDK default |
| Accessibility / alternate-input user | Complete every core task by keyboard, screen reader, switch, touch or zoom | No drag-only, hover-only, color-only or visual-spatial-only action |
| Authorized agent | Perform the same bounded reads and planned actions as a human | Same semantics and receipts, attenuated capability, no ambient signer or hidden API |

The Explorer does not force one persona into another's surface. A guest sees a
clear resource and status; an investigator can open the full trace; an author
crosses an explicit authority boundary.

## Information architecture

### Global frame

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Back / Forward / Up | location or exact ID | Search | Context status │
├──────────────┬───────────────────────────────────────┬───────────────┤
│ Locations    │ Breadcrumbs / tabs / pane context    │ Inspector     │
│ Favorites    ├───────────────────────────────────────┤ Summary       │
│ Recents      │                                       │ Fields        │
│ Saved views  │  Tree · List · Grid · Table · Cards  │ Provenance    │
│ Retained     │  Gallery · Timeline · Graph · Raw     │ History       │
│ Activity     │                                       │ Bytes         │
│ Drafts       │                                       │ Raw / IDs     │
├──────────────┴───────────────────────────────────────┴───────────────┤
│ Tasks / query pages / byte attempts / failures / staged operations  │
└──────────────────────────────────────────────────────────────────────┘
```

On narrow screens, Locations becomes a drawer, the Inspector becomes a tabbed
sheet and the activity rail becomes a resumable task screen. The resource,
context status and primary action remain reachable without preserving desktop
geometry.

### Locations and entry points

The sidebar separates canonical or explicit navigation from convenience:

- **Locations:** explicit Realms, Routes, Mounts, direct IDs and locally
  configured sources;
- **Favorites:** local aliases to a location, object, exact citation or query;
- **Recents:** local interaction history, never durable EFS data by default;
- **Saved Explorer views:** local presentation/query configurations, with
  published ones separately labelled as attributable inert evidence;
- **Retained/offline:** exact resources and partial caches with coverage and
  last observed basis;
- **Activity and receipts:** reads, byte attempts, action plans and outcomes;
- **Drafts:** local intents and data not yet encoded, signed or published.

A favorite, recent item, saved view or search result never masquerades as a
canonical directory placement. Finder's aliases/Smart Folders and Windows
Quick Access are useful precedents precisely because the original location
remains separate.

### Main canvas

The canvas has one active `ExplorerViewSpec` and one or two panes. Every pane
shows:

- source identity and whether it is exact, pinned, live/following or local;
- Realm/read basis, Plan/Lens and coverage summary;
- view/projection identity and whether it is built-in, declarative or
  sandboxed;
- selection count and exact selection snapshot;
- loading/resume state without presenting partial data as complete; and
- raw fallback and Inspector access.

### Inspector

The Inspector has stable sections independent of the chosen view:

1. **Summary:** resource kind, exact IDs, friendly names and current outcome;
2. **Fields/relationships:** typed values, unknowns and references;
3. **Qualification:** Type validity, authorship, Realm admission,
   Binding/Lens selection, basis/finality/freshness and completeness;
4. **Provenance/history:** source Occurrences, revisions, predecessors,
   current-selection events, competing/losing claims and derived projections;
5. **Bytes:** commitment, ranges, Locator evidence, attempts, privacy observers
   and safe open/download status;
6. **Raw:** canonical bytes, descriptors, receipts and redacted export; and
7. **Actions:** available capabilities, why an action is disabled and the
   exact transition into plan review.

## Navigation and interaction principles

- Back/forward restore the full pane context—not merely a URL—including basis,
  selected view, query cursor boundary and selection where safe.
- Up follows the lexical/canonical navigation context. A graph Object can have
  multiple placements; the Explorer does not invent one portable parent.
- Breadcrumbs distinguish a Files path from a graph/reference trail and an
  exact citation from a friendly live route.
- Tabs preserve independent read contexts. Dual-pane compare must show both
  basis/authority summaries and never imply atomicity across Realms.
- Search is a query with named provider, profile, basis, coverage, filters and
  cursor—not a magical global textbox. Local/offline search names its retained
  corpus.
- Selection binds exact row/resource identifiers and the pane context at the
  moment it is captured. A later refresh does not silently retarget a pending
  batch action.
- Drag/drop is a convenience that produces the same previewable intent as a
  keyboard/menu command. It never executes on drop without the normal plan
  boundary.

## Core journeys

### Guest opens a folder

1. Parse and sanitize the explicit route.
2. Paint trusted resolving UI without wallet/profile/package work.
3. Establish the exact Realm, Route, Mount, Plans and read basis.
4. Render the first qualified page and visible coverage state.
5. Continue pages with stable cursors; an empty partial page remains partial.
6. Offer list/grid/tree/table choices and local sort/filter where semantically
   valid.
7. Keep full evidence and exact-link export available in the Inspector.

### Guest opens a file or exact object

1. Resolve semantic identity and selected immutable revision separately from
   bytes.
2. Show metadata and provenance before or independently of body acquisition.
3. Fetch eligible ranges/bytes through the shared verifier.
4. Retain every attempt; reject corrupt bytes and try an eligible fallback.
5. Render passive content safely or offer download/raw inspection. Active or
   unknown content stays inert until an explicitly separate runner action.

### Investigator opens unknown typed data

1. Show exact Record/Occurrence/Realm facts and canonical bytes.
2. If an exact descriptor is available and valid, offer a generic read-only
   field/reference tree with untrusted labels visibly isolated.
3. If no rich projection exists, remain useful through raw, references,
   backlinks/pages, provenance and export.
4. An unsupported Type never disappears from a supposedly complete result and
   never gains actions from its own metadata.

### User edits or moves data

1. Capture an intent against an exact selection snapshot.
2. Produce a deterministic plan with effects, CAS/preconditions, authority
   roles, privacy/network/cost disclosure, atomicity and conflict policy.
3. Lazy-load identity/wallet/action services only after the plan is requested.
4. Establish the actual signer and historical authorization basis.
5. Use conserved authorization UI, submit, monitor every effect, then perform
   canonical read-back.
6. Update the view from read-back; never from wallet submission optimism.

### User undoes or restores

The Explorer first names the operation:

- **Cancel** stops a not-yet-submitted plan.
- **Undo local view change** reverses only local presentation/workspace state.
- **Restore/fork revision** creates a new immutable revision or selection.
- **Reverse rename/move** is a new mutation with current preconditions.
- **Unmask/rebind** is a new Binding operation; old evidence remains.
- **Compensate partial batch** is an explicit new plan over completed effects.

Redo re-plans against current state; it never replays a stale signature. The UI
must not promise undo when only a destructive replacement or best-effort
compensation exists.

## Feature map

The horizon is a product claim, not an implementation schedule.

| Capability | MVP target | Next | Later / boundary |
|---|---|---|---|
| Locations and navigation | Explicit Realm/Route/Mount/direct ID, back/forward/up, breadcrumbs, tabs, tree | Dual-pane, compare, richer location profiles | Cross-Realm workspace sets; native mount coordination stays with Drive lane |
| Views | Tree, list, grid, read-only exact-Type table, raw, provenance/history | Cards, gallery, timeline, graph, saved/shared specs | Sandboxed app-defined views and complex derived notebooks |
| Search/filter/sort | Current folder/exact-Type finite query, stable cursor, local filters and canonical sort | Pluggable provider-neutral search, groups, saved queries | Ranked/full-text/global aggregates with explicit replaceable providers |
| Metadata | Core/Files fields, typed properties, IDs, basis, authority, coverage, byte state | Custom column packs and richer application adapters | High-cardinality analytical schemas and loss receipts |
| Preview | Verified passive image/text/media; PDF only through a named trusted safe-preview profile, otherwise download/raw | More range-aware media and comparison previews | Active execution through separate OS/App runner only |
| Files writes | Create directory/file, user-selected local-file import as create/publish input, and publish revision only after the certified shared boundary passes | Copy/move/rename/mask after their shared semantics pass; robust batch plans, overwrite policies, drag/drop and compensating restore | Cross-Realm transfer as separate copy/verify/unlink plans; no false atomicity |
| Table writes | Read-only table | Typed cell/form editing through exact action interfaces | Formula/derived-data systems with explicit lineage; never hidden Record mutation |
| History | Browser navigation history, exact provenance/revision/current-selection panel | Diff/compare, restore/fork plans, batch receipt timeline | Collaborative handoff and domain-specific causal visualizations |
| Favorites/recents | Local/private by default; exact vs live target visible | Sync/export or explicit publication as inert view evidence | Social discovery stays separate from personal state |
| Offline | Static shell, retained exact resources/ranges, local views and coverage ledger | Local drafts, unsigned queued plans, deliberate reconciliation | Private encrypted multi-device sync belongs to shared OS services |
| Extensions | Built-in projections; inert package inspection | Declarative read-only projection packs | Sandboxed executable analysis/view modules and bounded action extensions |
| Agents | Structured read/export parity if a shared interface exists | Bounded plan drafting and monitoring | Automation through OS mandates/capabilities; no Explorer ambient authority |

## MVP definition

The MVP target is not just a debug browser. It is complete only when a user can:

- open a clean-browser guest folder and file by friendly and exact routes;
- navigate with tree/list/grid, breadcrumbs, back/forward/up, tabs and a local
  favorite without any wallet or OS work;
- search/filter/sort one bounded inventory without confusing partial with
  empty;
- inspect metadata, exact IDs, Type/provenance/history and byte attempts;
- preview or download verified passive bytes and reject a corrupt primary;
- open an exact-Type query as a typed read-only table and retain unknown rows;
- retain selected exact resources for offline reading with visible coverage;
- complete every journey with keyboard, screen reader, touch and non-drag
  alternatives; and
- perform create folder, create file, bounded local-file import and publish
  revision with plan/receipt/read-back, or
  have the MVP claim explicitly narrowed if the shared write evidence fails.

No executable third-party extension is required for MVP. The extension seam is
tested in a disposable lab so later extensibility is not designed into a
corner.

## Accessibility requirements

1. **Keyboard complete:** predictable tab order, roving focus where suitable,
   arrow-key tree/grid/table navigation, multi-select, range select, commands,
   view switch, Inspector, plan review and recovery without pointer input.
2. **No drag-only behavior:** copy/move/reorder/import and split-pane operations
   have explicit commands with the same preview and result. Local-file import
   always has a keyboard/touch file-picker path.
3. **Screen-reader structure:** real headings/regions, announced row/column
   counts, sort/filter state, selection, page coverage, progress and final
   outcome. Virtualization preserves logical position and focus.
4. **Status is not color:** every integrity/authority/coverage/freshness state
   has text and machine-readable semantics; icons and color are redundant.
5. **Zoom and reflow:** usable at 400% browser zoom and narrow mobile widths;
   the Inspector and activity rail reflow rather than overlap content.
6. **Motion and timing:** reduced-motion respected; background progress does
   not steal focus; live-region updates are summarized and throttled.
7. **Global text safety:** canonical bytes remain visible; display uses bidi
   isolation and control visualization; locale formatting never changes IDs,
   sort identity or signed/action bytes.
8. **Trusted language:** untrusted Types, extensions and Records cannot supply
   permission wording, accessible authority claims, focus order or destructive
   action labels.
9. **Input diversity:** touch targets, pointer, keyboard, switch/voice command
   mapping and IME composition are included in component fixtures.
10. **Test matrix:** automated checks plus real keyboard; VoiceOver/Safari,
    NVDA/Firefox or Chromium, and mobile screen-reader/touch passes for the
    fixed journeys before a release claim.

## Offline and retained-data requirements

“Offline” is a family of explicit states:

```text
OFFLINE_SHELL_ONLY
RETAINED_EXACT
RETAINED_PARTIAL
STALE_EVIDENCE
LOCAL_VIEW_ONLY
LOCAL_DRAFT
QUEUED_UNSIGNED_PLAN
SIGNED_NOT_SUBMITTED
SUBMITTED_UNCONFIRMED
RECONCILIATION_REQUIRED
```

- Every retained inventory records source, exact basis, pages/ranges, closure
  dependencies, verification and missing coverage.
- Exact content bytes may be cached by commitment. Moving selections and query
  conclusions are keyed by basis/policy and re-evaluated when online.
- Offline search names the retained corpus and cannot claim wider
  completeness.
- A cached page never fills missing pages with absence. Network failure never
  becomes `404`, empty search or a negative cache entry.
- Favorites, recents, layout, local history and drafts are private local state
  unless the user explicitly exports or publishes a separately reviewed
  artifact.
- Offline changes begin as local drafts or unsigned plans. The Explorer never
  auto-signs or auto-broadcasts when connectivity returns.
- Reconciliation regenerates preconditions and shows conflicts; it does not
  silently merge semantic state or replay an expired signature.
- Storage eviction or browser site-data loss is reported as loss of local
  retention/state, not loss of the EFS object itself.

## Product success signals for experiments

The first usability round records rather than optimizes vanity metrics:

- time and error rate for open, navigate, find, inspect provenance, explain a
  failure, switch to table/raw and prepare a write;
- percentage of participants who correctly distinguish exact vs live,
  present vs byte-available, absent vs unknown, and history vs undo;
- number of times an advanced status blocks ordinary browsing;
- keyboard/screen-reader task completion without alternate hidden paths;
- wrong-action and wrong-target catches before authorization; and
- whether disabling projection/extension code leaves the resource inspectable.

Exact thresholds and stop conditions live in
[[experiments-and-stop-conditions]].

## Open questions

- [ ] Does one combined Location/search field remain understandable when it
      accepts Files paths, direct IDs and bounded queries, or should query
      construction have a distinct surface?
- [ ] Is dual-pane important enough for MVP once exact context badges and
      mobile reflow are included, or should it remain the first Next feature?
- [ ] Which provenance details belong in the default row/status versus the
      Inspector so ordinary guests stay unburdened without losing honesty?
- [ ] Can the typed table remain read-only in the first product while the same
      release still satisfies the owner-directed write-capable File Browser
      requirement through basic Files operations?

## Pre-promotion checklist

- [ ] Core journeys pass low-fidelity usability review before implementation
- [ ] MVP includes every must-match file-manager capability or names the exact later horizon
- [ ] Guest path has zero wallet/account/Commons/OS/package prerequisites
- [ ] Accessibility matrix is exercised, not only documented
- [ ] Offline coverage and local-state privacy are visible in every retained-data trace
- [ ] History, restore, undo and compensation are never conflated
- [ ] No open question is silently chosen by a mockup or implementation convenience
- [ ] At least one independent product/accessibility review is recorded
