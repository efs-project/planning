# EFS Data Explorer — disposable experiments and stop conditions

**Status:** draft — pre-implementation evidence plan; fixture success does not adopt protocol or product architecture
**Target repos:** planning, client, sdk
**Depends on:** [[README]], [[product-charter-and-roadmap]], [[architecture-and-state]], [[views-extensions-and-capabilities]], [[Reviews/2026-08-13-efs2-stage-a-corpus/chapters/bakeoff-spec]]
**Supersedes:** —
**Reviewers:** —
**Last touched:** 2026-08-22

#status/draft #kind/design #repo/planning #repo/client #repo/sdk #topic/read-path #topic/graph-queries #topic/app-model #topic/privacy

## Gate

Do not begin a read-only production Data Explorer implementation, freeze product
APIs, or request permanent Types/bytes until experiments E0–E4 have passed
their exact scope. E5 is a separate gate before any executable third-party
extension class; E6a is a separate gate before a write-capable MVP, and E6b
gates its deferred operations only. A pass proves only that one disposable
design survives the named corpus,
environment and participants; it does not prove EFS v2 conformance.

## Shared fixture and evidence packet

All technical experiments use one versioned, disposable corpus containing:

- a public Realm, direct Route/Mount and Files root that can reconstruct from
  canonical state without wallet, profile, package catalog, OS services,
  hosted index or warm cache;
- directories with empty, small, paged, duplicate-looking, unicode/bidi,
  cyclic-reference, alias/mount and high-cardinality cases;
- stable File/Directory Objects, multiple immutable revisions, competing
  current-selection candidates, masked names and unavailable revisions;
- exact Types `T1`, a deliberately incompatible `T2`, an unknown Type and one
  explicitly pinned projection accepting only a finite subset;
- table values covering present, absent-by-type, null, invalid, unsupported,
  unavailable, derived and unknown cells;
- complete and partial query transcripts, empty partial pages, cursor resume,
  stale/mismatched basis and provider disagreement;
- intact bytes, unavailable bytes, corrupt primary with intact fallback,
  all-corrupt candidates, range-only content and active/unknown content that
  must remain inert;
- provenance with distinct author, admission, current selector, carrier and
  local observer; history with forks, losing claims and missing evidence; and
- a benign extension, a crashing extension, resource-exhaustion attempts,
  confused-deputy requests, data exfiltration attempts, UI spoofing and output
  that falsely claims completeness/authority.

Every run retains exact fixture revision, build hash, browser/assistive-tech
matrix, cold/warm/offline condition, network log, decoded result transcript,
screenshots or recordings where consented, task notes and deviations. Test
secrets and private user data are forbidden.

## Common assertions

The following are checked in every experiment that can encounter them:

1. `UNKNOWN`, `PARTIAL`, unsupported, unavailable and tampered data remain
   visible and machine-distinguishable.
2. Only proved absence or explicit masking maps to not-found behavior. Timeout,
   partial inventory, missing bytes, unsupported Type and integrity failure do
   not create a `404`, empty-result conclusion or negative-cache entry.
3. Exact source, basis, authority/current-selection context, coverage,
   availability and integrity remain independently inspectable.
4. Repeating the read from a cold profile can reconstruct the same qualified
   outcome or explain a changed basis without trusting local cache/index state.
5. The user can export an exact or redacted evidence packet and can reach raw
   inspection when a rich view fails.
6. Wallet, account, profile, package/extension and full OS subsystems remain
   absent from guest boot logs until the user explicitly crosses their boundary.
7. Keyboard and screen-reader paths exercise the same read, plan and result
   semantics as pointer paths.

## E0 — status language and workspace wireframe

### Question

Can a modern Explorer surface remain immediately usable while keeping the
irreducible qualification and failure states honest?

### Prototype

A non-networked, non-code clickable wireframe for wide desktop, 400% zoom and
narrow mobile. It covers open, navigate, search, view switch, provenance,
failure explanation, offline state and staged action review. Test two status
density variants; neither may omit the Inspector or raw fallback.

### Participants and tasks

At least six participants: two ordinary file-manager users, two data/developer
users, one keyboard/screen-reader user and one mobile/touch user. Each must:

- locate a file, determine whether its bytes can be opened and explain why;
- distinguish an empty complete folder from a partial folder with zero loaded
  matches;
- distinguish a live path from an exact citation;
- find who authored, admitted and currently selected a revision; and
- identify whether a proposed move has executed.

### Pass

- At least five of six complete ordinary open/navigation without moderator
  explanation and without first opening the advanced Inspector.
- All six correctly answer byte availability and action-executed state.
- At least five of six correctly distinguish empty/partial, exact/live and
  author/admitter/selector after using the product, with no false certainty.
- The keyboard/screen-reader and mobile participants complete every task with
  no drag-only, hover-only, color-only or inaccessible alternate path.

### Stop or redesign

Stop the chosen information hierarchy if any participant performs or believes
they performed an unintended write; if qualification is hidden to reach the
ordinary-task threshold; if the default status makes two or more ordinary
participants unable to navigate; or if an accessibility path uses weaker
semantics. Repair the vocabulary/wireframe and rerun E0 before code prototypes.

## E1 — cold guest Files vertical

### Question

Can the Explorer deliver a useful direct Files experience with honest outcomes
through the shared Reader/Files seam and no system hydration?

### Prototype

A disposable static web artifact with a replaceable in-memory adapter. It
implements only route parse, trusted skeleton, direct Files resolution,
tree/list/grid, breadcrumbs, paging, metadata, verified preview/download, raw
and evidence export. It has no wallet, account, profile, package manager,
extension host, service backend or production persistence.

### Pass

- In a clean browser, the first useful directory page and one file metadata
  view require zero wallet/account/profile/package/OS calls and zero
  unrequested package or content bytes.
- Every fixed Files case yields the expected qualified outcome in cold, warm
  and offline-retained runs; cursor resume neither duplicates nor omits an item.
- The same fixture can be reconstructed from canonical inputs with caches and
  optional indexes removed.
- Corrupt primary bytes are rejected, the intact eligible fallback is tried,
  and both attempts remain visible. All-corrupt and unavailable cases never
  render as valid or absent.
- Retained exact ranges open offline with explicit coverage; non-retained
  resources say unavailable/offline rather than missing.
- Keyboard and screen-reader users can navigate, select, inspect and download.
- Against the named cold-cache/network/device envelope, the prototype paints a
  trusted skeleton immediately and reaches a useful viewer within three
  seconds. The guest critical JavaScript target is at most 250 KiB compressed;
  over 400 KiB is an automatic failure for this arm. These are disposable Web
  Client/OS pressure targets, not protocol limits.

### Stop or redesign

Stop the architecture if guest reads require wallet/profile/OS/catalog
hydration; if one outcome must be collapsed into value/error or absent; if
correctness needs a privileged hosted index/cache; if corrupt bytes can reach a
renderer; if basis cannot be retained across pages; or if the shared boundary
cannot supply exact raw/evidence fallback. Route the smallest missing outcome
or evidence-handle requirement to the owning lane before continuing.

## E2 — typed spreadsheet view

### Question

Can one table feel spreadsheet-capable while preserving exact Type versions,
row inventory, field-state distinctions and lossless exit?

### Prototype

A read-only table over the shared fixed corpus. Compare:

- arm A: exact-Type-only columns with raw unsupported rows; and
- arm B: the same plus one finite, pinned, versioned projection across an
  explicitly accepted subset.

Both provide keyboard grid navigation, resize/reorder/hide, filter/sort/group,
copy, row-to-Inspector and export/re-import. No formula or mutation runs.

### Pass

- Every inventory item is represented exactly once or has an explicit page/
  frontier reason; unknown and unsupported rows never vanish.
- All cell states remain distinct in rendering, accessibility semantics and
  export. Mixed `T1`/`T2` data is not silently coerced.
- Filter/sort/group names whether it covers the complete finite inventory or
  only loaded/retained rows. Zero visible rows cannot imply source absence.
- Export followed by the experiment re-import preserves exact row identity,
  raw values, Type/projection version, state markers, basis and provenance
  pointers; formatted display loss is separately disclosed.
- A six-person task round achieves at least five correct explanations of why
  an unknown row is present and why a partial filtered result is not empty.
- The keyboard/screen-reader participant completes open, navigate, sort,
  filter, select, inspect and copy without losing logical position.

### Stop or redesign

Stop the projection approach if it requires a universal structural ABI,
guesses across unknown Types, loses raw values, hides rejected rows, cannot
attribute derived cells, or makes version migration silent. Prefer the arm
with less authority and loss if both meet usability; do not freeze either
grammar from this result.

## E3 — provenance and history comprehension

### Question

Can people answer “what is this, who said it, why is it current, what changed
and can I still acquire the bytes?” without a false single-author/file-history
story?

### Prototype

An Inspector plus comparison/timeline over the fixed File, generic Record and
forked-history cases. It exposes exact citations and a deterministic redacted
trace replay independent of the friendly projection.

### Pass

- The interface never collapses semantic Object, revision/content, authored
  Occurrence, Realm admission, current selection, byte attempt or local
  observation into one event or actor.
- An exact citation replay resolves the same pinned evidence or reports the
  precise unavailable/tampered dependency; it never silently follows latest.
- All six E0 participants can locate the current selection and available bytes;
  at least five correctly distinguish author, admitting Realm and selecting
  authority, and distinguish restore/fork from erasing history.
- A failed projection and a disabled extension leave the same provenance/raw
  trace reachable.

### Stop or redesign

Stop if the data boundary lacks enough evidence to answer the distinctions; if
the UI implies one universal “owner” or “modified by”; if losing or masked
evidence disappears; or if trace export leaks credentials/private inputs. Fix
the shared evidence contract or redaction model before a production Inspector.

## E4 — hostile, partial and unavailable data lab

### Question

Do all views, caches and transitions preserve causal failures under adversarial
and degraded inputs?

### Prototype

A deterministic fault injector runs the E0–E3 surfaces through unavailable
provider, timeout, reorg/basis change, partial pages, empty partial page,
cursor mismatch, unsupported Type, invalid encoding, corrupt primary/fallback,
oversize preview, renderer crash, storage eviction and offline transition.

### Pass

- The fixed result matrix has 100% expected outcome/state matches and no
  uncaught exception, infinite spinner, false success, false absence or silent
  row loss.
- Only proved absent/masked cases enter the not-found/negative-cache path.
- Switching view, retrying a provider, going offline/online and restoring a
  session retain or explicitly supersede the original failure evidence.
- A basis change aborts or restarts affected page/selection work visibly; no
  mixed-basis view claims one inventory.
- Oversize, malicious or crashing renderers terminate within the lab budget
  and leave raw/status/recovery controls responsive.
- Storage eviction changes local retention state, never the claimed existence
  of the EFS resource.

### Stop or redesign

Any false absence, false integrity, mixed-basis completion, executable active
content, secret-bearing log/export or unrecoverable host crash is a hard stop.
Do not waive it as an edge case; shrink the supported surface or change the
result/cache architecture and rerun the whole matrix.

## E5 — extension isolation and revocation

### Question

Can a useful third-party projection be removable, capability-limited and
unable to redefine truth, spoof authority or obtain ambient access?

### Prototype

Compare three isolated arms where feasible: declarative-only, Worker/Wasm and
opaque-origin frame. The host supplies only disposable capabilities from
[[views-extensions-and-capabilities]]. The malicious fixture probes network,
DOM, wallet, signer, storage, clipboard, cross-tab/resource data, handle reuse,
focus/permission spoofing, resource exhaustion and false authority output.

### Pass

- Discovery, fetch, verification, installation, authorization, activation and
  invocation are separately observable; no step implies the next.
- With no grant, observed extension access to network, wallet/signer, host DOM,
  Explorer storage/history, unrelated resource data and system permission UI
  is zero.
- Granted handles are exact, least-privilege, non-delegable in the lab and
  immediately fail after revocation, tab close or source-context replacement.
- False completeness/authority/integrity output remains labelled derived and
  cannot alter host status, action availability or evidence export.
- Crash, timeout and budget termination preserve the host, selection and built-
  in raw/provenance fallback.
- Uninstall removes code, grants and namespaced state or lists deliberate
  retained residue for explicit deletion; it does not damage source data.

### Stop or redesign

Any sandbox escape, ambient secret/signer/network access, permission spoof,
unrevoked handle, hidden activation, raw-fallback dependency on the extension
or extension-controlled trusted action copy stops executable extensions.
Retain declarative-only or no third-party extension support until a stronger
shared isolation boundary is proved.

## E6a — certified MVP create, import and publish lab

### Entry condition

Do not start E6a until Files and Web Client/OS supply an authorized disposable
action planner/executor with operation-bound consent, explicit Principal and
signer basis, receipts and canonical read-back. If that boundary remains open,
the first production scope is read-only; the Explorer must not invent it.

### Prototype

Create directory/file, import a user-selected local file and publish revision
over a disposable Realm. Local bytes enter only through an explicit file picker
or equivalent accessible chooser as a size/type/name-disclosed, cancellable
input to the shared action plan; the App receives no ambient filesystem access.
Include success, read/cancel/oversize failure, stale precondition, conflict,
rejected signature and reorg cases. File-picker, keyboard/menu and structured
authorized-agent intent must produce the same canonical plan digest for the
same exact input and options.

### Pass

- Every plan freezes exact selection, source/destination context, basis,
  preconditions, authority roles, disclosure, costs, atomicity and conflict
  policy before consent.
- Human and authorized-agent paths display/consume the same plan and receive
  the same receipt/result semantics; no alternate direct Core/SDK write path
  exists.
- The signer is verified as the actual signer under the relevant historical
  authorization, not inferred from UI account state.
- Submission success is not product success. Canonical read-back establishes
  the displayed outcome, and partial/unknown results remain so.
- Cancel of an unsubmitted plan and undo of local view state are named
  separately. The MVP makes no restore/reverse/undo promise for durable writes.

### Stop or redesign

Any target drift, hidden effect, ambient signer, consent bypass, optimistic
canonical update, destructive “undo” promise or missing receipt blocks the
corresponding write feature and any write-capable MVP claim. A passing read-only
product must not be held hostage to an unproved write mechanism.

## E6b — deferred copy, batch, reversal and cross-Realm lab

### Entry condition

E6a has passed, and Files plus Web Client/OS have accepted disposable semantics
for the specific Next operation. E6b does not gate the MVP.

### Prototype

Add copy, move, rename, mask/unmask, multi-selection batch, restore/fork,
reverse/compensating plans and cross-Realm copy/verify/unlink. Include stale
selection, per-target conflict, partial batch, compensation failure and source
unlink failure. Pointer drag/drop, keyboard/menu and structured authorized-agent
intent produce the same plan digest for the same exact selection and options.

### Pass

- Every plan freezes the exact multi-selection, source/destination contexts,
  basis, per-effect preconditions, authority roles, disclosure, costs,
  atomicity and conflict/continuation policy.
- Restore/fork, reverse rename/move, unmask/rebind and partial-batch compensation
  are named separately. Every durable reversal is a new plan against current
  preconditions; no stale signature is replayed and history is preserved.
- Partial batches retain per-effect receipts and never claim rollback or
  completion where only compensation is possible.
- Cross-Realm copy/verify/unlink exposes non-atomicity and never presents itself
  as an atomic move.

### Stop or redesign

Target drift, hidden effects, false atomicity, destructive “undo,” missing
per-effect receipts or unreconciled/undisclosed partial state blocks only the
affected Next operation. It does not retroactively block the passing read-only
or E6a-scoped product.

## Recommended sequence and decision rule

```text
E0 status/IA
  -> E1 guest Files + E4 failure matrix
  -> E2 typed table + E3 provenance
  -> repair shared read/evidence seams
  -> read-only architecture checkpoint; still no automatic production start
  -> E5 only before executable extensions
  -> E6a only before MVP writes and after the shared boundary exists
  -> E6b only before its deferred operations
```

Run E4 alongside every coded read prototype rather than after the happy path.
Choose the architecture arm that passes with the smallest trusted computing
base, least semantic loss and cleanest removal/exit—not the arm with the most
features. Contradictory results are recorded; they are not averaged into a
pass.

## Global production stop conditions

The proposed production slice remains stopped if any applicable condition is
true:

- guest useful reads require wallet, account, Commons, profile, OS, catalog,
  extension or privileged hosted infrastructure;
- the shared boundary cannot preserve raw bytes/evidence and independently
  qualified identity, Type, authority/currentness, coverage, availability and
  integrity;
- unknown, partial, unsupported, unavailable or tampered data can become
  absent, empty, valid, complete or negatively cached;
- a shipped renderer can execute active data or block raw recovery; if an
  executable extension is proposed, it can access ambient capabilities, spoof
  trusted permission/action UI or survive revocation;
- exact navigation, saved-view migration, offline coverage or trace export
  cannot be explained and losslessly exited;
- the core journeys are not keyboard, screen-reader, touch and 400%-zoom
  complete;
- a proposed write can bypass exact plan, conserved consent, actual signer,
  receipt or canonical read-back; or
- implementation would freeze unsettled Core, Files, Type/Data ABI, SDK,
  QueryProfile, view, capability, package or extension bytes by accident.

Passing the experiments required for a proposed slice authorizes an
architecture decision review, not codebase creation, deployment or protocol
adoption. The owner or delegated
implementation authority must still select a repository, permanence tier and
bounded production slice.
