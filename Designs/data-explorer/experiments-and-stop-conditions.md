# EFS Data Explorer — disposable experiments and stop conditions

**Status:** draft — pre-implementation evidence plan; fixture success does not adopt protocol or product architecture
**Target repos:** planning, client, sdk
**Depends on:** [[README]], [[product-charter-and-roadmap]], [[architecture-and-state]], [[views-extensions-and-capabilities]], [[Reviews/2026-08-13-efs2-stage-a-corpus/chapters/bakeoff-spec]]
**Supersedes:** —
**Reviewers:** —
**Last touched:** 2026-08-23

#status/draft #kind/design #repo/planning #repo/client #repo/sdk #topic/read-path #topic/graph-queries #topic/app-model #topic/privacy

## Gate

Do not begin a read-only production Data Explorer implementation, freeze product
APIs, or request permanent Types/bytes until E0, E1a, E1b, E2, E3 and E4 have
passed their exact scope. E1a proves deterministic UI/result isolation; it does
not prove the direct-guest boundary. E1b is the separate integrated cold-browser
gate required for that product claim. E5 is a separate gate before any
executable third-party extension class; E6a is a separate gate before a write-
capable MVP, and E6b gates its deferred operations only. A pass proves only that
one disposable design survives the named corpus, environment and participants;
it does not prove EFS v2 conformance.

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
  stale/mismatched basis, independently selected provider agreement/
  disagreement, valid/invalid/incomplete account or storage proof material,
  ordinary receipt/log observations with and without a separately verified
  receipt proof, and old state/body/receipt/log ranges unavailable from one or
  all selected sources;
- intact bytes, unavailable bytes, corrupt primary with intact fallback,
  all-corrupt candidates, range-only content, a retained blob commitment whose
  old blob bytes are unavailable, and active/unknown content that must remain
  inert;
- provenance with distinct author, admission, current selector, carrier and
  local observer; history with forks, losing claims and missing evidence; and
- a benign extension, a crashing extension, resource-exhaustion attempts,
  confused-deputy requests, data exfiltration attempts, UI spoofing and output
  that falsely claims completeness/authority.

Every run retains exact fixture revision, build hash, browser/assistive-tech
matrix, cold/warm/offline condition, network log, decoded result transcript,
screenshots or recordings where consented, task notes and deviations. Test
secrets and private user data are forbidden.

For every E1b read-evidence row, retain the chain and Realm, explicit block
hash and number, policy/code identities, requested and observed finality,
canonicality request/provider response plus separately qualified canonicality
assessment/evidence, explicitly selected source, evidence kind, exact query/
slot/receipt/log/page/range coverage, and causal archive/history/blob
availability. Candidate evidence kinds distinguish provider observation,
locally verified state proof, locally verified receipt proof and local
recomputation. A state proof covers only requested account/storage paths and
requires verification against the state root of a header qualified under the
run's declared header/finality policy. A receipt proof requires canonical
receipt bytes plus index/path verification against that header's receipts root
under the exact fork/encoding profile. Receipt evidence obtained through an ETH
wire format must be re-encoded into consensus receipt form—including the typed
envelope where applicable and a recomputed bloom—before receipts-root
verification; retain the wire bytes separately. Otherwise receipts and logs
remain source-qualified observations. Provider agreement is source-policy
evidence, not authentication or proof.

## Common assertions

The following are checked in every experiment that can encounter them:

1. `UNKNOWN`, `PARTIAL`, unsupported, unavailable and tampered data remain
   visible and machine-distinguishable.
2. Only proved absence or explicit masking maps to not-found behavior. Timeout,
   partial inventory, missing bytes, unsupported Type and integrity failure do
   not create a `404`, empty-result conclusion or negative-cache entry.
3. Exact source, block-hash basis, requested/observed finality, canonicality
   observation/assessment, evidence kind, authority/current-selection context,
   coverage, causal history availability and integrity remain independently
   inspectable.
4. Repeating the read from a cold profile can reconstruct the same qualified
   outcome or explain a changed basis without trusting local cache/index state.
5. The user can export an exact or redacted evidence packet and can reach raw
   inspection when a rich view fails.
6. Wallet, account, profile, package/extension and full OS subsystems remain
   absent from guest boot logs until the user explicitly crosses their boundary.
7. Keyboard and screen-reader paths exercise the same read, plan and result
   semantics as pointer paths.

## Qualified facts-matrix crosswalk

The shared fixture carries one versioned, disposable facts-matrix crosswalk for
every case. It aligns with the umbrella contract-readiness requirement while
leaving the owning Core/Solidity/SDK work free to change names and encodings.
Each row records expected logical facts, evidence pointers and allowed/illegal
combinations across these dimensions:

| Umbrella fact dimension | Explorer crosswalk | Collapse forbidden |
|---|---|---|
| Presence | Exhaustive `ExplorerReadResult` branch | Unknown, conflict, opaque or masked into absence/presence |
| Coverage | Page/range/closure plus exact queried-slot, receipt/log and history-frontier coverage with completeness evidence | One proved slot, receipt or page into whole-inventory or whole-history proof |
| Support | Adapter/projection/profile support and declared resource ceiling | Unsupported or limit exceeded into invalid/absent |
| Validation | Structural and semantic Type/value validation evidence | Structurally decodable into semantically accepted |
| Authority | Historical authority grade and evidence | Authorship/admission/existence into authorization |
| Lifecycle | Authored, admitted, withdrawn, carried-only or unproved provenance | Carrier observation into Realm admission/currentness |
| Selection | Current/not-current/conflict/unknown selection evidence | One observed candidate into canonical current selection |
| Observation | Exact chain/Realm, block hash/number, policy/code context, requested/observed finality, canonicality request/provider response/assessment evidence, source, evidence kind and causal history/blob availability | Provider/tag/quorum/canonicality response or unproved receipt/log observation into authenticated proof/finality/canonicality; pruned/expired evidence into absence |
| Bytes | Verified/partial/unavailable/integrity-failed state plus all attempts | Retrieval failure into semantic absence; fallback success hiding corruption |
| Effect | Explicitly out of scope for the E1a/E1b read arms; E6 plan/receipt/read-back state | Submission into committed effect or unknown into failure |

E1a and E1b consume the same sealed fixture row IDs and produce this crosswalk
before presentation. E1a records expected qualified facts, required evidence
grades and simulated evidence pointers; it cannot claim to observe a provider,
authenticate a header/root or verify proof material. E1b must reproduce the
same logical facts and result branches while earning the actual source-
qualified observation or locally verified proof grade. Semantic parity
therefore excludes transport attempts, timing, implementation objects,
serialized bytes and the deliberate simulated-to-earned evidence transition;
the earned evidence kind, grade and scope must satisfy each sealed requirement.
All non-pointer Observation facts—including requested basis/finality,
policy/code context, canonicality requirement, scope and causal availability—
remain equal. Only evidence-pointer provenance and an actual source satisfying
the sealed source policy may differ. Transport/provider choice cannot change
presence, coverage, support, validation, authority, lifecycle, selection, bytes
or effect meaning.
The dimension labels, candidate values, evidence kinds, fixture IDs, DTOs and
mapping syntax are experiment vocabulary only—not adopted protocol bytes, SDK
API or result-registry names. Illegal combinations are rejected rather than
normalized for display.

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

## E1a — deterministic fake-source Files vertical

### Question

Can the Explorer UI preserve every qualified fixture result, causal failure and
recovery path without network/SDK nondeterminism obscuring a product defect?

### Prototype

A disposable static web artifact with a replaceable in-memory fake source. It
injects the sealed qualified fixture rows and implements route parse, trusted
skeleton, tree/list/grid, breadcrumbs, paging, metadata, preview/download state,
raw fallback and evidence export. It has no real SDK adapter, Realm transport,
wallet, account, profile, package manager, extension host, service backend or
production persistence.

### Pass

- Every fixed Files case maps to the expected facts-matrix crosswalk and visible
  outcome; deterministic reruns have no row loss or semantic drift.
- Simulated page/cursor resume neither duplicates nor omits an item, and a
  simulated basis change cannot merge into the existing page set.
- Simulated corrupt-primary, verified-fallback, all-corrupt, unavailable and
  unknown-Type cases retain every expected attempt/status and raw fallback.
- Retained exact ranges open offline with explicit coverage; non-retained
  resources say unavailable/offline rather than missing.
- Keyboard and screen-reader users can navigate, select, inspect and download.
- The trusted shell and built-in fake-source UI use no wallet/account/profile/
  package/OS modules. The guest critical JavaScript target is at most 250 KiB
  compressed; over 400 KiB is an automatic failure for this arm. This is a
  disposable Web Client/OS pressure target, not a protocol limit.

### Evidence ceiling

E1a proves UI isolation, result-law coverage, accessibility behavior and a
replaceable adapter seam. It cannot prove public Realm reachability, the real
SDK adapter, dependency loading, network privacy, optional-indexer removal,
fixed-basis pagination, byte verification or cold reconstruction. E1a failure
blocks the affected UI design; E1a success never satisfies E1b or supports a
direct-guest production claim.

## E1b — integrated cold-browser direct-guest gate

### Question

Can the same qualified fixture survive the actual disposable product read path
from a cold browser through the real disposable SDK adapter and direct public Realm reads,
without ambient services or semantic drift?

### Prototype

Run the same disposable static artifact and sealed fixture through the actual
candidate product adapter, public Realm transport and verified artifact path.
Start each proof run in a fresh browser profile with empty memory/HTTP caches,
service-worker state, Cache API, IndexedDB and local/session storage. Instrument
the module dependency graph, browser storage/cache use, Worker/service-worker
lifecycle and every network request/redirect with initiator, purpose, bytes and
outcome. Do not substitute fixture DTO injection inside this arm.

Run two independently cold subruns against the same sealed fixture and declared
public sources: a direct Data Explorer App route using the shared guest Reader/
Files adapter, and an OS-hosted Data Explorer App route using that same adapter.
The hosted subrun may add its declared minimal App container/chrome modules; it
may not add a second resolver/verifier, profile hydration, privileged service
or different truth input. Retain separate dependency/network/storage traces and
compare their qualified outcomes.

The fixture is available through declared public Realm inputs and eligible
content carriers. If an optional indexer exists, capture a comparison run, then
remove or disable it and repeat from cold state. The index-free run is the
required proof.

Resolve any requested moving `safe`/`finalized` tag once. Retain the exact
chain/Realm, block hash and number, policy/code identities, requested and
observed finality, canonicality request/provider response and separately
qualified canonicality assessment/evidence. Pin every state call and page
contributing to one logical read to that explicit block hash. Pin each one-block
log request to its explicit block hash; a multi-block history traversal retains
the exact parent-linked ordered header-hash sequence, its anchor to separately
qualified head/canonicality evidence, and per-block coverage. Unsupported or
unavailable hash pinning yields a qualified `PARTIAL`, `UNKNOWN` or
`UNSUPPORTED` result. A provider-reported or independently assessed
noncanonical exact basis remains visible; when explicit policy permits, a
losing-fork read may be `PRESENT` but cannot satisfy a canonical/final
requirement. A basis change yields a new read or explicit comparison—never a
number/tag fallback or merged page.

Run a separately traced comparison through at least one independently operated,
explicitly selected public source when available. A provider-neutral claim
requires this comparison, but one comparison is only a necessary falsifier—not
sufficient evidence for broad provider neutrality. If it is unavailable, that
claim remains unproved. The comparison is not an ordinary guest-boot dependency
or a hidden provider selector. Disagreement remains `CONFLICT` or `UNKNOWN`,
and agreement never upgrades an observation into authenticated proof.

### Pass

- Every fixture case has semantic parity with E1a across the full facts-matrix
  crosswalk. Differences are limited to declared transport attempts, timing and
  implementation diagnostics plus the required simulated-to-earned evidence
  pointer transition and the actual selected source within sealed source policy.
  Earned kind/grade/scope meets every sealed requirement; no basis/finality/
  canonicality requirement, scope, causal availability, presence, coverage,
  support, validation, authority, lifecycle, selection, byte or effect meaning
  changes.
- Direct and OS-hosted cold subruns produce the same qualified facts and earned
  evidence grades from the same shared Reader inputs. Their trace delta contains
  only declared App-container/chrome presentation modules; hosting cannot change
  basis, source, coverage, authority/currentness, byte result or failure cause.
- The dependency and network trace shows only the static trusted App/shell, the
  shared guest Reader/Files consumer path through the real disposable SDK
  adapter, explicit public Realm reads and requested eligible carriers/content.
  A Web Client/OS experiment may label that shared path `Reader Kernel`; the
  Explorer remains above it and owns no resolver, verifier or Lens reducer. The
  trace shows zero wallet, account, Commons, hosted indexer, package catalog,
  System Kernel/full OS, Shell-service, profile-hydration or extension
  dependency.
- A fresh browser with no warm cache reaches the first qualified directory page,
  one file metadata view and the raw fallback from public reads. No retained
  local page, hidden fixture injection or privileged server response is needed.
- With every optional indexer removed, cold reconstruction produces the same
  semantic facts and independently derives all required pages/evidence from the
  declared public inputs plus earned canonicality assessment/qualification
  evidence.
  Missing optional indexes may change measured cost, never truth, reachability
  or completeness law.
- Fixed-basis pagination is stable and resumable. A snapshot inventory page/
  cursor chain has one exact block-hash basis and order. A multi-block history
  page/cursor chain has one immutable composite basis containing its parent-
  linked ordered header-hash sequence and per-block coverage. Neither duplicates
  nor omits fixture entries, accepts a cursor/basis mismatch or merges rows
  outside its declared singular/composite basis.
- The retained read-evidence packet earns every displayed evidence grade and
  reports its exact scope. State proof does not prove omitted slots, calls,
  logs, receipts, finality or historical completeness; receipt proof covers
  only its verified receipt/path unless complete receipt coverage is separately
  established. When required historical evidence was not retained, pruning or
  expired blob availability yields causal `UNKNOWN`/`PARTIAL` for the claim and
  unavailable for the affected source/bytes, never `ABSENT`. Previously retained
  valid evidence may remain meaningful under its declared basis while current
  source/byte availability is separately unavailable.
- Unknown/unsupported Types and failed rich projections retain canonical raw
  bytes or exact safe encodings, identifiers, qualification and evidence through
  the raw fallback without package/catalog discovery.
- The actual product path handles verified bytes: it rejects the corrupt
  primary, verifies the eligible fallback against the exact commitment and
  retains both attempts.
  All-corrupt, partial-coverage and unavailable cases remain distinct from
  semantic absence and never reach a trusted renderer as valid bytes.
- The trace contains zero unrequested package/content bytes and no negative
  cache from timeout, unavailable carrier, integrity failure or partial query.
- Against the named cold-browser/network/device envelope, the trusted skeleton
  paints immediately and the first useful viewer arrives within three seconds.
  The envelope and trace are retained; this is a product pressure target, not a
  protocol limit.

### Stop or redesign

No read-only production claim may proceed if E1b cannot run without fake-source
injection, a wallet/account/Commons/hosted indexer/package catalog/System
Kernel/full-OS/Shell-service/profile/warm-cache dependency, an Explorer-owned
resolver/verifier/Lens reducer, or an untraced network/module edge. Stop also
for any E1a/E1b semantic parity mismatch, optional-indexer truth dependency,
direct/OS-hosted semantic or evidence-grade divergence,
re-resolved moving tag, number-only fallback, mixed-basis page/hash sequence,
unearned proof/finality/canonicality label, missing raw fallback, unverified
rendered bytes, false absence, a dependency hidden behind a positive/complete/
canonical claim or hidden provider credential.
Preserve the failing fixture and return the smallest missing SDK/Files/Core/
product semantic plus alternatives and exact falsifier; do not weaken the
crosswalk or adopt fixture/API/protocol bytes to force a pass.

A pruned old-history source or unavailable expired blob is not by itself an
E1b failure when the product preserves exact basis, requested coverage and its
causal `UNKNOWN`/`PARTIAL`/unavailable result. It blocks only the stronger
history, completeness or byte-availability claim that requires the missing
evidence.

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
provider, timeout, null/empty/error/rate-limit responses, provider disagreement,
exact-basis refusal, reorg/basis change, partial pages, empty partial page,
cursor mismatch,
invalid/incomplete proof, missing old state/body/receipt/log history, expired
blob bytes, unsupported Type, invalid encoding, corrupt primary/fallback,
oversize preview, renderer crash, storage eviction and offline transition. Any
optional external-reference adapter also receives unknown-version, redirect,
gateway, callback, omitted-chain/default-resolution, ABI-inference and privacy-
policy failures.

### Pass

- The fixed result matrix has 100% expected outcome/state matches and no
  uncaught exception, infinite spinner, false success, false absence or silent
  row loss.
- Only proved absent/masked cases enter the not-found/negative-cache path.
- Switching view, retrying a provider, going offline/online and restoring a
  session retain or explicitly supersede the original failure evidence.
- A basis change aborts or restarts affected page/selection work visibly; no
  mixed-basis view claims one inventory.
- Provider response shape, quorum, archive label or advertised range never
  upgrades an observation to proof or turns unavailable history into absence.
- External-reference inputs remain inert until their optional adapter is
  explicitly enabled. Parsing, resolution, a contract-returned callback result,
  content-type hints or byte retrieval remain qualified transport/application
  evidence and never establish EFS authority, permanence or safe rendering.
- Every enabled external-reference attempt uses an explicit chain/basis and
  resolution/interpretation mode or visibly rejects/surfaces the standard's
  default. Its trace contains only policy-allowed schemes, hosts and redirects;
  bounded recursion, redirect count, bytes and time; and zero ambient wallet,
  account, profile, cookie, authorization, referrer or private-network/metadata
  access. Callback failure or a stronger validation claim without exact
  profile evidence remains qualified failure/unknown, never missing content.
- Oversize, malicious or crashing renderers terminate within the lab budget
  and leave raw/status/recovery controls responsive.
- Storage eviction changes local retention state, never the claimed existence
  of the EFS resource.

### Stop or redesign

Any false absence, false integrity, mixed-basis completion, executable active
content, secret-bearing log/export or unrecoverable host crash is a hard stop.
For an enabled external-reference arm, disallowed egress, ambient credential or
interest leakage, implicit chain/ABI/resolution change, unbounded redirect/
recursion/size/time, private-network/metadata access or callback-policy bypass
stops that arm. Do not waive it as an edge case; shrink the supported surface or
change the result/cache architecture and rerun the whole matrix.

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
  -> E1a fake-source Files + E1b cold public-read gate + E4 failure matrix
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
  qualified identity, Type, authority/currentness, source observation,
  block-hash basis, requested/observed finality, canonicality observation/
  assessment, evidence kind, coverage, causal history availability and
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
