# EFS Data Explorer — research landscape

**Status:** reference — dated first-pass evidence; it does not adopt product architecture, protocol semantics or external product behavior
**Target repos:** planning, client, sdk
**Depends on:** [[README]], [[Designs/efsv2/README]], [[Designs/web-client-os/README]]
**Supersedes:** —
**Reviewers:** —
**Last touched:** 2026-08-22

#status/reference #kind/research #repo/planning #repo/client #repo/sdk #topic/read-path #topic/graph-queries #topic/app-model #topic/content #topic/privacy

## Scope and method

First-pass research completed 2026-08-22. Local owner rulings and current EFS
v2 design spines were read before legacy code or external products. Official
vendor/project documentation is used for current product claims below; EFS
conclusions are labelled as inferences. No external behavior is an adopted EFS
requirement merely because it is familiar or popular.

The scan covered:

- Finder, Windows File Explorer, GNOME Files and Total Commander as desktop
  file-manager baselines;
- Airtable and Notion as configurable-view workspaces;
- DBeaver as a database navigator/data editor;
- VS Code as a virtual-workspace and untrusted-extension precedent;
- GraphiQL/Apollo Explorer as typed query explorers;
- Chrome DevTools Network as a raw trace/debug explorer; and
- current EFS Core/Files, Type/Data ABI, Web Client/OS, App Store, Media, Git,
  EAP/Achievements and NANDA pressure evidence plus legacy `client/`.

## Local authority and evidence

### Adopted direction that constrains the product

| Source | Current constraint consumed here |
|---|---|
| [[Designs/efsv2/owner-rulings]] | EFS v2 Core remains standalone; Commons and OS are optional consumers. A useful direct guest File Browser does not wait for wallet, account, Commons, OS or profile hydration. |
| [[Designs/efsv2/README]] and [[Designs/efsv2/system-constitution]] | Greenfield typed graph/filesystem work; preserve exact evidence, authority and unknowns; do not inherit v1 bytes or implementation by default. |
| [[Designs/web-client-os/README]] | Web Client/OS owns the shared direct guest path and optional promotion into writes/OS, not a separate protocol or compulsory guest shell. |
| [[Designs/efsv2/owner-decision-inbox]] and the open evidence gates across [[Designs/web-client-os/README]] | Open mechanism questions are evidence gates, not permission for the Explorer to invent Core/SDK/OS contracts. |

### Current proposals used behind reversible adapters

| Source | Explorer pressure, not adoption |
|---|---|
| [[Designs/efsv2/hierarchical-files-and-folders]] | Separate semantic Object, immutable revision, content commitment and Locator; use explicit namespace/view context; preserve qualified listings, citations, byte attempts and certified write plans. |
| [[Designs/efsv2/layered-type-system-and-data-abi]] | Prefer exact nominal Types plus finite projections and raw preservation; distinguish contract Data Views, query profiles and consumer projections; prove completeness only under a bounded inventory contract. |
| [[Designs/web-client-os/type-data-abi-boundary-pressure]] | A finite exact-Type-first Files consumer adapter can preserve semantic, byte, authority and completeness axes, but `BindingScope` enumeration and routed operation-bound consent remain pressure points. |
| [[Designs/web-client-os/architecture-and-modules]] | Reuse Reader/Artifact, safe-renderer, capability and action seams; prevent package/module code from joining trusted guest boot or defining conserved authorization text. |

Names such as `BindingScope`, `QueryProfile`, `FilesRouter`,
`FilesConsumerAdapterV0`, result enum labels and product DTOs remain candidates
unless their owning design says otherwise.

### Adjacent product pressure

| Evidence | Reusable pressure on the general Explorer | Boundary retained |
|---|---|---|
| [[Designs/open-web-app-store/README]], [[Designs/open-web-app-store/architecture]] and [[Reviews/2026-08-22-open-web-app-store-type-data-abi-pressure/README]] | Inspect package identity, finite dependency closure, selected-set relations, provenance and unavailable artifacts; keep handoffs inert and reconstructible. | Explorer does not resolve/install/authorize/activate packages or turn catalog inclusion into endorsement. The fixture proves only its finite case. |
| [[Designs/media-library/media-infrastructure]] and [[Designs/media-library/query-and-indexing]] | Multiple representations, range verification, missing/corrupt media, replaceable queries and gallery/card/timeline pressure. | Media owns codecs, domain reducers, playback and specialized application semantics. |
| [[Reviews/2026-08-07-efs-git-corpus/requirements-ledger]] and [[Brainstorms/2026-07-29-pm-credibly-neutral-git-forge-and-agent-artifacts]] | Trees, immutable history, raw objects, blame/provenance, closure, large DAGs, diff/compare, provider disagreement and exit. | Git/Forge owns Git object semantics, collaboration and write workflows; Explorer supplies generic navigation, graph/history and evidence mechanics. |
| EAP/Achievement pressure recorded in [[Designs/efsv2/layered-type-system-and-data-abi]] and [[Designs/web-client-os/README]] | A friendly card/list must retain issuer/author, admission, selection, revocation/currentness, evidence basis and unknown carrier data. | Explorer does not define achievement validity, issuance or reputation. |
| [[Brainstorms/2026-07-29-pm-nanda-neutral-agent-infrastructure-pressure]] | Discovery, artifact submission, authorization and invocation are separate; agent/app data needs exact provenance, capability and failure inspection. | Explorer is not an agent runtime, registry or reputation oracle. |
| `../client/AGENTS.md` and legacy `../client/` | Historical route, query, rendering and interaction evidence. | The v1 Vite/Lit client is outdated evidence, not the v2 product architecture. |

### Local synthesis

The adjacent domains all need a thin, qualified resource/page/trace boundary,
generic raw/provenance inspection and reusable navigation/view mechanics. They
do not justify a universal schema-driven app runtime. Domain reducers stay
finite and owned; the Explorer composes their bounded outputs and always keeps
the shared evidence path reachable.

## External product findings

All external sources linked below were accessed 2026-08-22.

### Desktop file managers: durable baseline, several cautionary tales

- Apple documents Finder aliases, tags and Smart Folders as navigation and
  organization mechanisms distinct from original items. The useful pattern is
  to keep canonical location separate from saved aliases/queries; EFS must add
  exact-versus-live and basis visibility that ordinary filesystems do not
  require. [Finder organization](https://support.apple.com/en-gb/guide/mac-help/mh11493/mac)
- Microsoft documents File Explorer Home, Quick access/pinning, view options
  and OneDrive integration. The useful pattern is a high-value home/navigation layer;
  the EFS adaptation keeps every convenience pointer visibly separate from
  canonical placement and private by default. [File Explorer in Windows](https://support.microsoft.com/en-us/windows/experience/fileexplorer/file-explorer-in-windows)
- GNOME Files documents selectable list columns and user-installed scripts in
  its context menu. Configurable metadata density is baseline; arbitrary local
  scripts are evidence for demand, not a safe EFS
  extension model. [List columns](https://help.gnome.org/gnome-help/nautilus-list.html),
  [Files behavior and scripts](https://help.gnome.org/gnome-help/nautilus-behavior.html)
- Total Commander documents a dual-pane interface, tabs, archive/FTP access,
  plug-ins and a multi-rename tool with preview and undo. The Explorer should
  test dual-pane compare and bulk preview, but must give “undo” exact EFS
  semantics instead of assuming reversible filesystem mutation.
  [Total Commander](https://www.ghisler.com/),
  [advanced features](https://www.ghisler.com/advanced.htm)
- Windows File History documents versioned restoration from a backup source.
  This reinforces naming restore separately from local UI undo and from
  rebinding a current immutable EFS revision.
  [File History](https://support.microsoft.com/en-au/windows/backup-and-restore-with-file-history-7bf065bf-f1ea-0a78-c1cf-7dcf51cc8bfc)
- GNU Emacs Dired explicitly warns that buffer undo does not reverse file
  operations. That is a useful counterexample: local view/history state and
  canonical mutations need different verbs and receipts.
  [Dired marks and undo](https://www.gnu.org/software/emacs/manual/html_node/emacs/Marks-vs-Flags)

**Inference for EFS:** match navigation, layout, metadata, selection, batch,
keyboard and recovery expectations, while refusing the conventional shortcut
that equates path, current file, bytes and authority.

### Configurable data workspaces: views are state, not truth

- Airtable distinguishes collaborative, personal and locked views, each with
  filters, groups, sorts and field configuration. This supports explicit view
  persistence/scope; EFS must go further by recording source basis, coverage
  and projection version. [Airtable views](https://support.airtable.com/articles/5189551686-getting-started-with-airtable-views)
- Airtable's record-level revision history documentation also names retention
  limits and changes it does not show. The relevant lesson is to state history
  coverage and exclusions rather than presenting a universal audit trail.
  [Airtable revision history](https://support.airtable.com/articles/3516802427-record-level-revision-history-in-airtable)
- Notion documents multiple layouts—table, board, timeline, calendar, list,
  gallery and chart—with per-view filters, sorts, groups and properties. This
  is strong precedent for one source/plural views; EFS view changes must not
  change source truth or silently drop unsupported objects.
  [Notion views, filters and sorts](https://www.notion.com/help/views-filters-and-sorts)
- Notion's offline documentation makes availability deliberate and exposes
  limitations. The EFS product should name shell-only, retained exact,
  retained partial, draft and reconciliation states instead of one offline
  badge. [Notion offline](https://www.notion.com/en-gb/help/use-pages-offline)

**Inference for EFS:** a saved Explorer view needs explicit ephemeral,
private-local, exported or published scope. Sharing its configuration never
implicitly shares data, grants, caches or search history.

### Database and typed query explorers: coverage and execution location matter

- DBeaver's Data Editor combines grid, record, text/structured and chart views,
  stages edits before Save, and supports filters, ordering and saved filter
  state. This is useful pressure for staged table edits and explicit transform
  state. EFS cannot inherit SQL's closed table/result assumptions.
  [DBeaver Data Editor](https://dbeaver.com/docs/dbeaver/Data-Editor/),
  [data filters](https://dbeaver.com/docs/dbeaver/Data-Filters/)
- Apollo Explorer documents schema-aware query building, operation history,
  collections and response inspection; GraphiQL likewise combines an editor,
  documentation explorer and results. These support an explicit typed query
  workbench, but an EFS query must additionally name provider/profile, basis,
  cursor and completeness. [Apollo Explorer](https://www.apollographql.com/docs/deploy-preview/7e5a48c46d3088f1d1b3ace7/graphos/platform/explorer),
  [Apollo Explorer features](https://www.apollographql.com/docs/deploy-preview/345ed333abb9994b7e00a85d/graphos/platform/explorer/additional-features),
  [GraphiQL README](https://github.com/graphql/graphiql/blob/main/packages/graphiql/README.md)

**Inference for EFS:** expose typed assistance only under an exact accepted
Type/projection. Preserve raw rows and explicit unsupported results; never let
friendly query construction imply global or current completeness.

### Debug explorers: preserve the trace beneath the friendly view

- Chrome DevTools records network requests while open and exposes filters,
  headers, timing, initiators and request/response details. Its core lesson is
  inspectable attempts and causality beneath a high-level application failure,
  though EFS must offer deterministic redacted export rather than leaking
  credentials. [Network panel overview](https://developer.chrome.com/docs/devtools/network/overview),
  [Network panel reference](https://developer.chrome.com/docs/devtools/network/reference/)
- GitHub's file UI retains a raw view and line-level blame/history alongside
  the friendly rendered file. The useful pattern is permanent raw/history
  escape, not adoption of Git's author or current-branch semantics.
  [Viewing and understanding files](https://docs.github.com/en/repositories/working-with-files/using-files/viewing-and-understanding-files)

**Inference for EFS:** provenance, basis, byte attempts, cursor/pages and
projection receipts are stable Inspector concepts independent of the active
tree/table/card/graph renderer.

### Extension isolation: compatibility and trust are explicit states

- VS Code asks extensions to declare whether they support virtual workspaces
  and documents limited operation when they depend on a local filesystem.
  This is precedent for capability/compatibility declarations and graceful
  degradation across EFS providers, not permission to trust declarations.
  [VS Code virtual workspaces](https://code.visualstudio.com/api/extension-guides/virtual-workspaces)
- VS Code Workspace Trust documents Restricted Mode and extension support for
  untrusted workspaces. EFS needs a stronger split: untrusted data is normal,
  discovery is inert, execution is separately installed/authorized/activated,
  and the host—not the extension—owns permission language and truth status.
  [VS Code Workspace Trust](https://code.visualstudio.com/api/extension-guides/workspace-trust)

**Inference for EFS:** start with built-ins, then a declarative read-only
projection grammar if it proves sufficient. Executable modules require
revocable attenuated handles, resource budgets and raw fallback; an isolation
failure narrows the feature rather than broadening ambient authority.

## Product requirements distilled from the scan

1. Preserve a desktop-grade navigation/selection baseline and treat
   keyboard/accessibility as a core interaction contract.
2. Separate canonical locations/exact citations from local recents, favorites,
   aliases and saved queries.
3. Make views explicit, serializable, scoped projections whose transforms and
   input coverage are visible.
4. Preserve raw evidence, trace/history and lossless export below every rich
   renderer.
5. Stage batch and table changes, preview exact targets/effects and distinguish
   local undo, restore, reversal and compensation.
6. Model offline as retained coverage and reconciliation states, not a binary
   promise.
7. Declare compatibility and capability ceilings; distinguish discovery,
   installation, authorization, activation, invocation and endorsement.
8. Let extensions fail removable and never let them author truth, trusted
   permission text or ambient authority.

## Gaps not resolved by precedent

External products do not answer the hardest EFS questions:

- how exact nominal Types, raw Records and finite projections cross the shared
  Reader/SDK boundary;
- what constitutes a complete Files inventory or query transcript;
- how Realm admission, authorship, Lens/Binding selection and currentness are
  explained together without collapsing authority;
- how immutable revisions and certified mutations yield honest undo/restore;
- whether browser isolation is sufficient for hostile executable views; or
- which product/API/byte forms should survive a century-scale, 100-year
  horizon.

Those remain EFS evidence questions tested in
[[experiments-and-stop-conditions]], not gaps to fill by copying a competitor.
