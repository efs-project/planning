# EFS Data Explorer — views, extensions and capabilities

**Status:** draft — product-level experiment contract; no View, query, manifest, package, capability or extension ABI is adopted
**Target repos:** planning, client, sdk
**Depends on:** [[README]], [[architecture-and-state]], [[Designs/efsv2/layered-type-system-and-data-abi]], [[Designs/open-web-app-store/README]], [[Designs/web-client-os/architecture-and-modules]]
**Supersedes:** —
**Reviewers:** —
**Last touched:** 2026-08-22

#status/draft #kind/design #repo/planning #repo/client #repo/sdk #topic/graph-queries #topic/app-model #topic/privacy #topic/content

## Purpose

The Explorer needs reusable views without making a layout into EFS truth and
third-party extensibility without turning discovery into execution authority.
This document defines the product concepts and disposable contracts to test.
It intentionally does not select permanent bytes, identifiers, grammar,
package resolution, browser isolation technology or SDK surface.

## Keep the similarly named concepts separate

| Concept | Meaning | Authority |
|---|---|---|
| EFS Type | Exact nominal interpretation law proposed by the Type/Data ABI lane | EFS v2; not owned here |
| Contract Data View | Bounded onchain projection proposed by the Type/Data ABI lane | Contract/Realm evidence under its exact context |
| QueryProfile | Proposed named pagination/order/completeness contract | EFS v2; not owned here |
| FilesView / Lens / BindingScope | Proposed Files selection and namespace context | Files/Core; not owned here |
| `ExplorerViewSpecV0` | A disposable product configuration for presenting a qualified source | Explorer workspace evidence only |
| Projection implementation | Code or declaration that maps accepted qualified input to derived cells/cards/nodes | Derived output, never upstream truth |
| Saved view artifact | An attributable copy of an Explorer view configuration | Inert evidence; grants no capability |

The name `ExplorerViewSpecV0` is an experiment label, not a request for a
permanent EFS Type. It must be renamed or discarded if the tests show that the
product needs different state.

## Disposable view-configuration model

Every view prototype must be serializable into a product-local structure with
the following conceptual fields. Concrete syntax is deliberately omitted.

| Area | Required content |
|---|---|
| Version | Exact product schema version plus migration result or `UNSUPPORTED` |
| Source | One exact resource, Files location/inventory, finite query, retained corpus or explicit comparison set |
| Read context | Realm/route, basis policy, Plan/Lens/Binding context and pinned-versus-following behavior |
| Input acceptance | Exact Types, reducer/projection version, raw-preservation rule and unsupported-input behavior |
| Inventory contract | Query/profile identity, order, page/cursor contract and the conditions under which view-wide completeness can be claimed |
| Layout | Built-in layout kind and only layout-specific state |
| Fields | Qualified source paths, derived-field identity, labels, width/order/visibility and raw fallback |
| Transform | Filter, sort and group expressions with named execution location and coverage |
| Presentation | Renderer identity, formatting, density, preview/open policy and accessibility labels that the host may override |
| Failure policy | How `UNKNOWN`, `PARTIAL`, unsupported, unavailable and tampered items remain represented |
| Persistence | Ephemeral, private-local, exported or explicitly published scope; never inferred from the source |
| Provenance | Author of the saved spec, parent/fork, projection inputs and creation basis without claiming source authorship |
| Capability ceiling | Always none for a view spec; actions are separately requested from the host |

### View invariants

1. A view never changes resource identity, Type validity, authorship, Realm
   admission, current selection, basis, coverage, availability or integrity.
2. Layout, filter, sort and grouping are named derived operations. A filtered
   view says “0 visible of 37 loaded; inventory partial,” not “empty.”
3. Unsupported or failed rows remain countable and inspectable. They may use a
   raw/error row but cannot vanish from a complete-looking result.
4. Only a finite inventory with a proved profile and complete page transcript
   may support view-wide `COMPLETE`. Local transforms inherit that input
   boundary; they do not make an open-world query complete.
5. A live source and an exact citation are visibly different. Reopening a live
   view can produce a new basis; reopening an exact citation cannot silently
   follow current state.
6. Saving, sharing or publishing a spec does not save, share or publish its
   source data, cached bytes, grants, drafts, history or credentials.
7. All views expose exact IDs, raw evidence and the Inspector without requiring
   the projection that produced the friendly display.
8. Untrusted labels, formats and accessibility strings cannot state authority,
   permission, integrity or destructive-action meaning.

## Built-in view family

### Files tree, list and grid

- Tree represents one explicit Files namespace/navigation context; it is not a
  universal graph parent tree.
- List is the high-density default with configurable qualified columns.
- Grid emphasizes verified previews while retaining filename, kind, status and
  selection parity.
- Folder counts remain “loaded/known” unless complete enumeration is proved.
- Duplicate names, aliases, cross-Realm mounts, cycles and conflicting
  Bindings have explicit representations rather than being normalized away.

### Typed table / spreadsheet

The first table is read-only and exact-Type-first. It provides frozen headers,
column resize/reorder/hide, keyboard cell navigation, row selection, finite
filter/sort/group, copy and lossless export. Every cell can reveal:

- the source Record/resource and exact field path;
- value state: present, absent-by-type, null-by-value, unknown, invalid,
  unsupported, unavailable or derived;
- projection version and basis;
- raw representation and any lossy formatting warning; and
- field- or row-level provenance where available.

Mixed exact versions do not coerce silently. A projection may explicitly map
several accepted versions into a common column set, but unmapped fields and
rows remain visible. Formulae, editable cells and fill operations are deferred
until they can create an exact action plan or an explicitly derived dataset
with lineage; they never mutate arbitrary Records by spreadsheet convention.

### Cards and gallery

Cards are named field mappings, not a Type-supplied trusted UI. Gallery uses
verified passive thumbnails/previews with bounded resource budgets. Missing or
tampered media leaves the card and its state visible. Neither MIME nor a Type
descriptor can auto-run active content.

### Timeline

Timeline requires an explicit qualified time field and timezone/ordering rule.
Authored time, admission time, observation time and local display time are
separate choices. Unknown time remains in an “undated” group; it is not dropped.

### Graph

Graph uses a finite node/edge inventory, named edge meanings and visible
frontier. Expansion is an explicit paged read. Cycles, repeated nodes, missing
targets and unaccepted edge Types stay visible. Layout position is local view
state and cannot imply direction, strength or authority.

### Raw Record and evidence

Raw is a mandatory built-in recovery surface. It can show exact identifiers,
canonical bytes or safe encodings, descriptors, references, read context,
receipts and a redacted transcript. Canonical bytes are never rewritten by
locale or presentation. Secret-bearing request material is excluded from
exports by an explicit redaction manifest.

### Provenance and history

The shared Inspector, rather than a projection, owns the distinction among
semantic Object, immutable revision/content, authored Occurrence, Realm
admission, current Lens/Binding selection, byte acquisition attempt and local
observation. A timeline view can present those facts but cannot collapse them
into a single “modified by” field.

## Extension classes and trust levels

| Class | MVP/phase | Input | Execution | Maximum output |
|---|---|---|---|---|
| Built-in projection | MVP | Shared qualified DTOs | Product bundle | Host-owned view |
| Declarative projection pack | Next experiment | Finite accepted Types/fields | Host interpreter with strict grammar | Derived fields/layout hints |
| Sandboxed read-only module | Later experiment | Revocable handles to bounded pages/ranges | Isolated Worker/Wasm/opaque frame candidate | Derived data and isolated panel |
| Bounded action extension | Later only | Exact selection plus separately granted action kind | Shared OS capability/action boundary | Proposed action plan, never signature/submission |

The host must remain useful with every non-built-in class disabled. A package
claiming to be a projection is not proof that its declarations are safe,
correct, endorsed or compatible.

## Extension lifecycle

The UI and implementation must model each transition separately:

```text
discover -> inspect evidence -> fetch -> verify -> install locally
         -> request capabilities -> authorize -> activate -> invoke
         -> suspend/revoke -> uninstall

endorsement/reputation ------------------------------------^ orthogonal
```

- **Discovery** exposes inert identity, release, catalog and provenance
  evidence. It never downloads code in guest boot.
- **Fetch/verify** obtains exact package bytes and checks the selected evidence;
  this still grants no execution.
- **Install** records local availability and dependencies. It is not activation.
- **Authorization** is explicit, scoped, revocable and conserved across human,
  agent and alternate UI paths.
- **Activation** creates an isolated instance under the approved ceiling.
- **Invocation** receives a new attenuated handle and resource budget; previous
  grants do not imply access to a newly opened resource.
- **Endorsement** is a separate attributable opinion, never a runtime grant.

## Candidate capability vocabulary for the lab

These are disposable test labels, not an ABI:

| Candidate capability | Bound |
|---|---|
| `read.resourceMetadata` | Exact current resource snapshot only |
| `read.inventoryPage` | Named finite page handle; no ambient query access |
| `read.verifiedRange` | Named commitment/range and byte budget |
| `derive.local` | Pure computation over supplied input under CPU/memory/output limits |
| `storage.extensionLocal` | Namespaced, quota-bound, clearable local state; no Explorer history |
| `network.connect` | Deny by default; exact origin/method/privacy disclosure if later tested |
| `ui.isolatedPanel` | Sandboxed panel inside host-controlled frame and navigation/focus rules |
| `action.propose` | Named action kind and exact selection; returns an inert plan request |

No extension receives ambient wallet, signer, account, clipboard, filesystem,
microphone, camera, geolocation, cross-origin credentials, unrestricted
network, browser storage, package registry or other extension handles. Handle
delegation is denied unless the shared capability model explicitly proves a
narrower derived handle.

## Truth and action boundary

An extension may return values, suggested labels, columns, renderer fragments,
diagnostics or a requested action intent. The host wraps every result with:

- extension identity and exact version;
- accepted input handles and basis;
- invocation time and resource budget;
- derived/failed/truncated status; and
- any declared external observation.

Extension output cannot set or override `PRESENT`, complete-basis `ABSENT`,
`COMPLETE`, Type validity, authorship, Realm admission, current selection,
authority, finality, availability, integrity or signer state. It cannot create
a privileged confirmation surface. An action request re-enters the same host
planner, conserved consent, signer, submission, receipt and read-back path as
a built-in command.

## Sandbox and privacy requirements

1. Treat every package, declaration, Type label, renderer and data field as
   hostile until accepted for its exact role.
2. Isolate code origin and execution realm; prohibit host DOM access and direct
   imports into the trusted product bundle.
3. Mediate all input as structured copies or revocable handles. Closing a tab,
   revoking a grant or changing source context invalidates the handle.
4. Apply CPU, wall-time, memory, output-size, recursion, page/range, storage and
   invocation-rate budgets. Termination leaves the host responsive.
5. Keep secrets, credentials, private mounts, unredacted traces and unrelated
   workspace state outside extension input.
6. Label network disclosure before any optional grant and preserve a visible
   access log. Guest boot performs no extension network activity.
7. Sanitize output in a host-owned renderer or use an opaque isolated panel;
   extension HTML, SVG, Markdown or URLs never bypass safe-open policy.
8. Constrain focus, shortcuts, dialogs, clipboard and accessibility semantics;
   an extension cannot imitate System Chrome or trap recovery commands.
9. On crash, timeout, unsupported input or revocation, preserve selection and
   offer built-in raw/provenance fallback. Do not negative-cache the resource.
10. Make installed, enabled, authorized, active and recently invoked state
    independently inspectable and clearable.

Browser sandboxing alone is not assumed sufficient for hostile code with
high-value secrets. The experiment compares declarative-only, Worker/Wasm and
opaque-frame candidates; a failed isolation property narrows the extension
class rather than weakening the property.

## Open questions

- [ ] Can a deliberately small declarative language cover the first useful
      third-party table/card/gallery projections without executable code?
- [ ] Which shared Web Client/OS broker owns extension installation,
      capability prompts, revocation and audit, and what read-only profile can
      Explorer consume without booting the full OS?
- [ ] Can a stable structured output tree provide accessibility and safe
      rendering, or are isolated panels needed for advanced visualization?
- [ ] Which projection migrations can remain Explorer-local, and when does a
      published saved view require an explicit fork rather than silent upgrade?
- [ ] Is any extension-initiated network access worth the privacy and
      reproducibility cost in the first executable-extension phase?

## Pre-promotion checklist

- [ ] Run the extension sandbox and corrupted-data experiments in
      [[experiments-and-stop-conditions]].
- [ ] Demonstrate raw and provenance access with all optional code disabled.
- [ ] Demonstrate lossless mixed-version table behavior and explicit coverage.
- [ ] Obtain Core/Files confirmation that no product state is presented as
      protocol truth.
- [ ] Obtain SDK confirmation that raw, qualified pages and verified byte
      handles can cross the shared boundary without loss.
- [ ] Obtain Web Client/OS confirmation that the Explorer reuses one capability
      and conserved-consent system.
- [ ] Replace every candidate name with either an adopted shared contract or a
      clearly versioned local adapter before implementation.
