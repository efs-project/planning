# EFS Data Explorer — preliminary findings checkpoint

**Status:** draft — point-in-time research synthesis; no product implementation, protocol bytes or production claim is adopted
**Target repos:** planning, client, sdk
**Depends on:** [[README]], [[research-landscape]], [[product-charter-and-roadmap]], [[architecture-and-state]], [[views-extensions-and-capabilities]], [[experiments-and-stop-conditions]]
**Reviewers:** —
**Last reconciled:** 2026-08-22

#status/draft #kind/research #repo/planning #repo/client #repo/sdk #topic/efsv2 #topic/read-path #topic/graph-queries #topic/app-model #topic/privacy

## Read this on a phone

**Verdict:** the current research supports a qualified typed Explorer workbench
as the leading product hypothesis. It is coherent enough for disposable
wireframes and fixtures, not for production implementation or interface freeze.

**Product shape:** familiar file-manager navigation over one qualified Reader
spine, with Explorer-owned tabs, panes, selections, views and local workspace
state. Files is the first vertical. Exact typed resources, queries, raw Records,
provenance and history must remain first-class rather than becoming panels
bolted onto a path-only browser.

**Proof still missing:** no real product journey has passed. Direct guest use
requires the integrated cold-browser E1b gate, not only the deterministic E1a
fake source. The broader “general-purpose typed graph Explorer” claim also
needs multiple non-Files families to survive the same qualified read, raw,
view and provenance laws.

**Highest-leverage next move:** seal the shared hostile/partial fixture, test
the E0 information hierarchy, then run E1a and E4 before connecting the same
artifact to the real disposable SDK adapter for E1b. Do not scaffold a
production application first.

## Constraints already adopted for this product lane

These are owner direction or EFS-wide constraints, not conclusions invented by
this research pass:

- Direct public reads must work without wallet, account, Commons, hosted
  indexer, package catalog, profile hydration or full OS boot.
- `UNKNOWN`, `PARTIAL`, basis, authority, currentness, coverage, byte
  availability and tampering remain visible and independently inspectable.
- EFS v2 is greenfield. Existing client, SDK and contract mechanisms are
  evidence, not an inherited product architecture or permanent byte format.
- Data Explorer owns the general-purpose data application experience. It does
  not own Core, Files or SDK semantics and does not become a second EFS OS.
- Third-party discovery never implies installation, authorization, activation,
  invocation, safety or endorsement.
- The design discipline is century-scale—a 100-year horizon: prefer explicit,
  versioned, replaceable seams and exercised exit over framework or vendor
  permanence.

## Preliminary findings

### 1. Modern file-manager competence is the usability floor

Finder, Windows File Explorer, GNOME Files, Total Commander and related tools
make tree/list/grid navigation, breadcrumbs, tabs, search/filter/sort, metadata,
selection, batch preview, favorites, recents, history, keyboard operation and
recovery ordinary expectations. EFS must meet that muscle memory while adding
distinctions conventional file managers usually hide: exact versus live,
semantic presence versus available bytes, and local convenience state versus
canonical placement.

### 2. Files is the right first vertical but the wrong outer product model

A File Browser plus extra panels would minimize the initial bundle, but path
and tree state would become accidental universal identity. The leading approach
is a generic qualified resource/page/evidence boundary with a first-class Files
adapter. The same workspace can then host exact objects, finite typed queries,
tables, cards, galleries, timelines, graphs and raw inspection without making
each domain invent navigation and failure behavior again.

### 3. One qualified Reader spine is safer than product-local truth

Realm and Files resolution, exact byte verification, pagination/completeness
and canonical evidence belong below the App. Explorer owns navigation,
selection, presentation, local history and action intent. It must not fork a
resolver, verifier, Lens reducer or negative-cache law. A Web Client/OS
experiment may call the shared guest slice `Reader Kernel`; Explorer stays
above it and does not require System Kernel, full-OS or Shell-service hydration
for a cold public read.

### 4. Qualification cannot be compressed into value/error or one badge

Presence, coverage, support, validation, authority, lifecycle, selection,
observation, bytes and effect are independent facts. The ordinary UI can show
a compact projection such as “Present · partial inventory · bytes unknown,”
but the Inspector and export must preserve the full evidence matrix. Only
proved absence or explicit masking may become not-found; unavailable bytes,
timeouts, partial pages, unsupported Types and integrity failure do not.

### 5. Views are scoped workspace state, not source truth

A saved view needs explicit source, read context, inventory/coverage,
projection version, transforms, layout, presentation policy, failure policy
and persistence scope. Local, exported and eventually published view
configurations are distinct. Sharing configuration never silently publishes
the underlying data, caches, history or grants. Disabling a projection must
leave raw data and evidence reachable.

### 6. The typed spreadsheet must be inventory-first and lossless

The useful Airtable/Notion/database-explorer precedent is plural configurable
views, not an assumption that EFS is one closed table. An Explorer table must
name its exact accepted Types or finite projection, retain unsupported and
unknown rows, distinguish absent/null/invalid/unavailable/derived cells, state
whether sort/filter/group covers the full inventory or only loaded rows, and
export enough exact context for lossless re-import.

### 7. Provenance and history are a core surface, not developer diagnostics

Author, Realm admission, current selector, carrier, byte attempt and local
observation are different actors/events. Exact citations must not silently
follow latest. Restore, fork, reverse, compensation and local UI undo are also
different operations. The friendly history view may simplify this model but
cannot erase forks, losing claims, missing evidence or unavailable bytes.

### 8. Offline is retained coverage, not a binary badge

The useful states include shell-only, retained exact, retained partial, stale
evidence, local-view-only, local draft and reconciliation required. Cached
bytes can be keyed by commitment; moving selections and query conclusions must
retain basis and policy. Eviction is loss of local retention, not loss of the
EFS object. Offline failure must never manufacture an empty directory, `404`
or negative cache entry.

### 9. Built-ins are sufficient for MVP; extensibility should ratchet slowly

The minimum forward-compatible sequence is trusted built-ins, then inert
validated declarative descriptors, then host-owned semantic surfaces over
bounded capability RPC, and only later opaque-origin Web surfaces for use
cases the safer lanes cannot meet. No extension may inject active HTML or
custom elements into the trusted Shell realm, author permission language,
claim authority/completeness, receive ambient network/wallet/signer/storage
access, or block built-in raw recovery.

### 10. Accessibility, privacy and action safety shape the architecture

Keyboard, screen reader, touch, 400% zoom, bidi-safe identifiers and non-drag
alternatives must exercise the same semantics as pointer paths. Favorites,
recents, searches, layouts, drafts and caches are private local state by
default. Writes remain narrow and conditional: Explorer may present intent and
effects, while the shared action boundary owns preconditions, conserved
consent/signing, submission, receipts and canonical read-back.

## Recommended product hypothesis

Use the **qualified typed Explorer workbench** described in
[[architecture-and-state]]:

```text
public Realm state and eligible carriers
  -> shared qualified Reader / Files / Artifact path
  -> Explorer workspace and inventory controller
  -> built-in view host + provenance/failure Inspector
  -> optional attenuated extension surfaces

explicit user intent
  -> shared action plan / conserved consent / submit / receipt / read-back
```

Retain the simple File Browser as the guest Files prototype, but reject it as
the durable outer architecture. Reject a mini-OS/event-sourced extension host
for MVP; it expands boot, privacy and authority before the read/result law is
proved.

This is a reversible design recommendation. Product DTOs, view syntax,
QueryProfiles, Type IDs, result codes, extension manifests, capability names,
repository layout and deployment remain candidate experiment vocabulary.

## Evidence gates before stronger claims

| Claim | Minimum evidence gate |
|---|---|
| The information hierarchy is usable and honest | E0 wireframe/usability round |
| The UI preserves the qualified result law | E1a deterministic fake-source Files vertical plus applicable E4 hostile cases |
| Direct guest reads work through the real product seam | E1b cold browser, real disposable SDK adapter, direct public Realm reads, full dependency/network trace, optional-index removal and semantic parity with E1a |
| Typed spreadsheet behavior is lossless and comprehensible | E2 mixed-Type table and export/re-import round |
| Provenance/history distinctions are usable | E3 author/admission/selection/bytes comprehension round |
| Failure, partial and corrupt data remain honest | E4 across every coded read prototype |
| An executable extension class is tolerable | E5 sandbox, spoofing, revocation, budget and raw-fallback lab |
| A write-capable MVP is honest | E6a create/import/publish plan, consent, receipt and read-back lab |
| Deferred copy/batch/reversal operations are honest | E6b per-operation evidence only |

No read-only production claim starts until E0, E1a, E1b, E2, E3 and E4 pass
their exact scopes. No fixture pass freezes protocol or SDK bytes. A fake-source
pass never proves direct public reachability.

Before calling the product **general-purpose**, add explicit evidence that
at least two non-Files resource families—for example Git plus EAP or Media—
retain the same qualified result, raw fallback, provenance and view-removal
laws. This is a product-claim evidence gap, not a proposed Core primitive or
byte freeze.

## Open mechanisms and required feedback

No owner decision is needed for the disposable experiment round. The adjacent
lanes need to answer bounded interface questions:

- **Core / Realm:** confirm the smallest reconstructible basis, admission,
  selection, authority and enumeration evidence; reject any second truth or
  privileged-index dependency introduced by Explorer.
- **Files:** supply or critique qualified pages, directory completeness,
  stable ordering/cursors, exact citations, verified byte attempts and the
  narrow certified write preconditions.
- **SDK:** provide a real disposable, provider-neutral adapter with exhaustive
  domain DTOs plus raw/evidence handles and a dependency/network trace surface;
  do not collapse results into value/error.
- **Web Client / OS:** verify the App/Reader/System Chrome/Shell split, cold
  guest boot and conserved write/extension ceremonies without making Explorer
  part of the Kernel or a second OS.

Still open within the product lane:

- whether a generic descriptor-rendered field tree belongs in MVP;
- which surfaces are shared Web Client components versus an independently
  versioned built-in App package;
- whether published Explorer view state ever deserves a durable EFS Type;
- whether browser isolation can safely support any hostile executable view;
- which write and batch operations can certify atomicity, compensation or
  reversal; and
- what exact non-Files corpus is sufficient for the general-purpose claim.

## Durable handoff

The detailed evidence and rationale remain in:

- [[research-landscape]] — local authority, product precedent and unresolved
  gaps;
- [[product-charter-and-roadmap]] — information architecture, feature horizons,
  accessibility and offline requirements;
- [[architecture-and-state]] — approaches, boundaries, state and failure laws;
- [[views-extensions-and-capabilities]] — view and extension model;
- [[experiments-and-stop-conditions]] — disposable prototypes and exact stops;
  and
- [[owner-decision-inbox]] — evidence-gated owner and adjacent-lane queue.

This checkpoint summarizes those documents; it does not supersede them.
