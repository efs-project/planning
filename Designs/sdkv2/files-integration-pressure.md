# Files integration pressure from K10, the Files-screen prototype and Fable handoff

**Status:** reference — point-in-time SDK reconciliation and handoff; no public API, Core representation, storage arm, tag model, package, or limit is adopted
**Target repos:** planning, sdk, contracts, client
**Depends on:** [[README]], [[architecture-candidate]], [[developer-journeys]], [[experiment-program]], [[exp-c0-mvp-packet]], [[web-client-os-boundary-pressure]]
**Inputs:** exact planning commit `aae282df72f214d791963aeac1cf3c38d162c56e` on `codex/mvp-c0-coherence`, including its prototype-branch `Designs/sdkv2/mvp-interface.md`; exact SDK-lab commit `57d04f85ae2687ee8ea63d945378df5a9a6492a5`; the Fable pin named by the planning source is historical pressure only
**Last touched:** 2026-09-10

#status/reference #kind/review #repo/planning #repo/sdk #repo/contracts #repo/client #topic/efsv2 #topic/read-path

## Phone disposition

The browser lane and SDK lab are separately Core-grounded but **not connected
to each other**.

- The pinned Files-screen prototype executes a real guest metadata-list path
  through the fixture-local reader in `Reviews/2026-09-09-files-reader/` and
  the local upgradeable contracts. That reader is deliberately labelled “not
  a public C0 SDK.”
- The SDK v2 lab at SDK commit
  `57d04f85ae2687ee8ea63d945378df5a9a6492a5` in
  `Reviews/2026-08-25-sdkv2-exp-c0-mvp/` consumes and preserves serialized Core
  artifacts. It does not execute the browser, provider, deployed contract,
  file-byte open, wallet, or write path. This lab does not exist in the
  separate exact planning snapshot above.
- The pinned Files-screen source has no SDK-lab import. Comparing the two exact
  sources, the browser lists selected File metadata, but File content remains
  `NOT_READ`; browser create, upload, write, canonical write read-back, and
  reload-after-write are absent.

The repair is not another implementation. The SDK should supply one small
declaration-and-conformance packet that the one end-to-end Files path assigned
to Fable can implement. That packet joins the common qualification semantics,
directory selection, verified bytes, action planning, ambiguous-submission
recovery, and independently qualified effect read-back. Product UI stays with
Fable; Core and Files semantics stay with their owners.

## Evidence and authority

The K10/storage/Files-screen reconciliation uses immutable Git objects from
`aae282df72f214d791963aeac1cf3c38d162c56e`:

- `Reviews/2026-09-10-k10-storage-plan.md`
- `Reviews/2026-09-05-c0-core/k10-scope-experiment.md`
- `Reviews/2026-09-05-c0-core/reference/state-reader.mjs`
- `Reviews/2026-09-10-storage-arms/README.md`
- `Reviews/2026-09-10-foundation-reply-after-economics.md`
- `Designs/sdkv2/mvp-interface.md` (prototype-branch input only; not restored or
  adopted into this design spine)
- the browser and reader under `Reviews/2026-09-09-files-screen/` and
  `Reviews/2026-09-09-files-reader/`

These are reviewed laboratory observations and design pressure. K10 remains a
fresh-initialization-only comparison mode; the byte-storage arms remain
isolated call-work evidence. Neither is a protocol choice, migration, public
SDK limit, carrier promise, or production default. Fable's changing worktree
was not inspected or imported.

## Disposition against the SDK spine

| Learning | Disposition | SDK consequence |
|---|---|---|
| Values, scope, basis, coverage and actual verification can be separated accidentally | **Draft changed** | Keep one non-loss qualification/evidence contract across operation-specific result families and add one claim-specific assessment operation. Generated product projections retain their qualification/evidence handle; a bare value or `outcome` never carries assurance. |
| A local state reconstruction can say `VERIFIED` and `COMPLETE` while contribution is `UNKNOWN`, authority is synthetic, and consensus proof is explicitly absent | **Draft changed** | Prohibit a universal `verified` boolean. Ask a named question—selected File, exact bytes, complete enumeration, authenticated authority, canonical effect—and return its own qualified answer. |
| JSON, IndexedDB, cache, plugin and version boundaries erase TypeScript brands | **Experiment needed** | Deserialization is a new validation event. Only a checked import restores an evidence-bearing result; plain object spread/JSON/clone is data, not proof. Preserve future raw fields or refuse a lossless-edit claim. |
| Scope position, global Binding-key ordinal and admission ordinal differ; K10 cursor modes differ | **Already covered in principle; draft changed in implementation boundary** | Keep all physical ordinals and cursor modes behind a checked page port with runtime domain tags. Public Files projections expose semantic progress/evidence, not interchangeable numbers. |
| K10 saves 40,023 gas on the seven-key cold scope-to-key fixture but costs 4,471 more for cold lookup plus history | **Experiment needed** | Measure the joined Files journey. Do not select a layout from one getter benchmark or turn 512/one-file fixture bounds into product rules. |
| A tag follows its declared subject; Lens selection precedes filtering | **Draft changed; Core dependency remains** | Generated tag inputs name the subject class and identity. Files filtering consumes the selected Lens result. It cannot reveal a lower tagged candidate hidden by an untagged, masked, malformed, conflicting, or unknown winner. |
| Lost submission responses and reload make effect status ambiguous | **Partially covered by receipt/effect separation; persistence, restart and retry need a new experiment** | Persist the exact attempt before authority, count actual wallet prompts, reconcile before retry, and require fresh contract-checked preconditions. Jobs preserve per-effect results. If Core supplies one contract-enforced atomic move effect, keep it unsplit; otherwise refuse to claim atomic move. |
| Storage savings vary by payload and exclude the full Files transaction | **Already covered; experiment needed** | Separate upload, reference, authorization/indexing, read, deployment and full-journey costs. Same bytes never imply the same File, authority, reference, position, or tags. |

No new owner answer is needed to record or falsify these SDK requirements in
isolated fixtures. Executing the integrated S17 path against an active product
path owned by Fable, a real wallet, or unsettled Files semantics requires an
explicit integration-owner/owner handoff. Final result bytes, K10/profile
adoption, tag subject types, Files mutation semantics, carrier choice, limits
and Core query/write ABIs remain Core/owner dependencies.

## One qualification contract, operation-specific results

The September convergence review and the pinned prototype-branch
`mvp-interface.md` provide the stronger current direction: exact reads, scoped
pages, verified bytes, planned/prepared/submitted writes and canonical read-back
may use operation-specific result families. They share one non-loss
qualification/evidence contract, not necessarily one universal serialized
wrapper. The August `ResultV0` packet in [[exp-c0-mvp-packet]] remains a useful
preservation and cross-language comparison fixture; it is not the presumed
production result API.

Ordinary developers should not need to render or reason over every possible
axis for every operation. The proposed ergonomic seam has only three pieces:

1. **An operation-specific lossless result** retains the applicable value,
   raw evidence, exact subject/scope, observation basis, coverage,
   profile/implementation commitments, provenance, attempts and result facts.
2. **A generated requirement** names one finite claim that the operation may
   establish—for example selected File, complete directory enumeration,
   proved absence, verified exact bytes, authenticated authority, or canonical
   effect.
3. **One assessment operation** evaluates a result against that requirement
   and returns `SATISFIED`, `VIOLATED`, `UNKNOWN`, or `UNSUPPORTED`-shaped
   evidence with the relevant basis and missing/refuting facts. These words are
   illustrative, not frozen enums.

```text
assess(result, GeneratedRequirement) -> {
  status
  subject + observation
  relevantFacts
  missingOrRefutingFacts
  evidenceHandle
}
```

This is not another result wrapper or a second outcome algebra. It is a checked
projection of the qualification carried by the operation-specific result.
Generated domain adapters may expose concise shapes such as Files,
Needs-attention, checked-hidden-position count and coverage, but the top-level
return keeps its observation and evidence handle. Positive values survive
partial coverage. A consumer can show four qualified Files while saying the
enumeration is incomplete. Destructive behavior that depends on absence asks
for the proved-absence requirement and cannot proceed on an empty array,
`UNKNOWN`, `PARTIAL`, `UNSUPPORTED`, or a cache miss.

The generic word `VERIFIED` is insufficient as a public success switch. In the
pinned state reader it means complete local source-observed reconstruction
under trusted fixture expectations; the same object says contribution
`UNKNOWN`, synthetic unauthenticated authority, and “not Ethereum
consensus/state proof.” Public docs and generated types must name the verified
claim instead of inviting `if (result.outcome === "VERIFIED")`.

## Serialization, caching and version skew

An evidence-bearing in-memory object is not self-authenticating after a runtime
boundary. The experiment should distinguish:

```text
exportEvidence(checkedResult) -> bounded portable bytes
restoreEvidence(portableBytes, acceptedProfile) -> qualified result
plain JSON / object / structured clone -> untrusted transport value
```

Names remain illustrative. A generated MessagePort/plugin binding may call the
checked restore operation automatically, but it cannot rely on a TypeScript
brand that disappears in transit. Import rechecks result-family and evidence
bounds, exact raw commitments, profile/version, observation identity, coverage
consistency and the requirement implementation version. Stripped metadata,
mixed bases, forged/stale cursors, unsafe integer narrowing and malformed empty collections
become qualified invalid/unknown/unsupported results, never empty success.

Cache provenance and currentness remain different. A cached complete result is
complete only for its exact observation. A historical positive can remain
useful after freshness expires; it does not become a current positive. Only an
exact proved absence or retained selected mask may enter a protocol negative
cache. Cache keys include Realm/profile/execution, observation basis, Lens and
query/order/coverage commitments plus the result/assurance implementation.

Old clients preserve unknown raw extension fields byte-for-byte when forwarding
or attaching a new operation. If an edit would require canonical re-encoding
that the old client cannot perform without dropping unknown meaning, the SDK
offers read/relay or refuses the lossless edit; it never silently normalizes the
future record into an older shape.

## Files implementation boundary

### Physical index details stay private

K10 demonstrates why a public `ordinal` or generic cursor is unsafe. Its scope
position is zero-based, physical kind-10 items are one-based Binding-key
ordinals, hydrated semantic rows recover first admission ordinals through kind
8, and the requested page basis remains an admission ordinal. Legacy and K10
raw/hydrated cursor modes are disjoint.

The Files SDK therefore consumes an implementation port that uses distinct
runtime-checked domains and an explicitly accepted source/layout profile. It
rejects missing/mismatched layout even for an empty collection. It does not
infer layout from an ABI, snapshot label, equal integer, or successful call.
Public consumer DTOs normally expose covered/uncovered/terminal semantic
progress and an opaque continuation; raw ordinal inspection is an expert
evidence view. K10 does not solve lifetime-name enumeration, populated
migration, reverse lookup, or complete index coverage.

### Resolve before filter

The reusable Files operation is conceptually:

```text
qualified candidates -> exact Lens selection -> selected File/mask/issue
                     -> subject-qualified tag/filter evaluation
                     -> product projection
```

An accelerator may combine stages only if it returns evidence proving the same
selected universe, ordering, basis and coverage. A lower tagged File is not
revealed when a higher-priority winner is untagged, masked, malformed,
conflicting, or unknown. `HEAD_LIVE`, a storage reference and equal content
bytes are not substitutes for a selected File or a tag subject.

Tag construction names its declared subject and scope. Continuing File labels,
exact-version assertions and intentional location labels may have different
survival rules across edit, copy, move and replacement. The SDK preserves those
identities and does not choose the product's default tagging UX.

## Write, restart and retry contract

The existing plan/signature/account-submission/canonical-effect separation is
retained and should be made usable as a restartable flow:

1. Build an exact action/effect plan with execution/profile, roles, limits,
   identifiers, atomicity, replay/idempotency rule and contract-enforced
   preconditions.
2. Persist the plan commitment and attempt record before invoking authority.
   Record actual wallet prompts and each authorization/submission observation.
3. If a response is lost, return an ambiguous/unknown submission state. Do not
   rewrite it as failure and do not issue a fresh wallet prompt automatically.
4. After reload, restore the retained attempt through the checked import path
   and reconcile the exact expected effects using fresh, independently qualified
   state/effect evidence at a new explicit basis. The pinned `verifyState`
   reconstruction alone is insufficient; `COMMITTED` requires the named
   canonical-effect verifier to succeed.
5. Retry only after reconciliation and a fresh plan/precondition/authority
   check. A changed account, chain, execution/profile, calldata, cost, target,
   precondition, nonce, expiry or effect set requires a new plan and consent.

If Core supplies one contract-enforced atomic move plan/effect, the SDK must
preserve it unsplit and all-or-nothing; otherwise the experiment refuses to
claim or emulate atomic move. A multi-item product job may contain several
plans; its summary can be partial, but every item retains its own submission
and canonical effect state. “Three of five committed” must not mutate the
remaining two from `UNKNOWN` into failure or replay them blindly.

## Smallest SDK-owned handoff to Fable

Do not transplant the fixture reader into a second package while leaving the
pinned Files-screen's fixture-local copy as a competing semantic authority.
First hand Fable one declaration-only adapter contract and one parameterized
conformance suite. Names below are illustrative and deliberately narrower than
a public SDK:

```text
FilesReadPort
  listDirectory(exact request) -> operation-specific qualified directory result
  readFile(exact selected-file evidence, optional bounded range)
    -> operation-specific qualified byte result

FilesActionPort
  planMutation(exact intent + fresh preconditions) -> action plan result
  submit(exact plan + injected authority) -> submission-attempt result
  reconcile(retained plan/attempt) -> per-effect canonical result

ResultAssessment
  assess(result, generated requirement) -> claim-specific assurance
  export / restore -> checked portable evidence boundary
```

The Web Client/OS integration owner supplies adapter wiring inside one product
path; current coordination routes that handoff to Fable, without asserting the
state of his changing worktree. The SDK owns the interface semantics, generated
requirement tokens, portable fixture vectors and reusable conformance
assertions. Core supplies selection, observable state,
contract-enforced preconditions and effect evidence. At exact planning commit
`aae282df72f214d791963aeac1cf3c38d162c56e`, the first handoff points at, but
does not copy, these repository paths:

- browser consumption:
  `Reviews/2026-09-09-files-screen/web/app.mjs`;
- fixture reader surface and implementation:
  `Reviews/2026-09-09-files-reader/index.d.mts`,
  `reader-scope.mjs`, `files-reader.mjs`, and `files-profile.mjs`;
- current legacy-layout Files reader host:
  `Reviews/2026-09-09-files-reader/`;
- separate fresh-only K10 arm, not yet consumed by that browser/reader:
  `Reviews/2026-09-05-c0-core/k10-scope-experiment.md`;
- scoped reconstruction and contribution checks:
  `Reviews/2026-09-05-c0-core/reference/state-reader.mjs`;
- storage-arm limits and accounting:
  `Reviews/2026-09-10-storage-arms/README.md`; and
- current SDK ownership/result contract: [[architecture-candidate]],
  [[developer-journeys]], and [[web-client-os-boundary-pressure]]; plus the
  retained August comparison fixture [[exp-c0-mvp-packet]].

## One integrated conformance journey

The next SDK evidence must attach to the one actual Files path Fable integrates,
using the pinned Files-screen checkpoint as starting evidence, rather than
become another independent demo. One adapter instance should run this complete
scenario against the same semantic fixture:

1. Cold guest boot lists qualified selected Files with no wallet touch and
   preserves partial positives plus enumeration coverage.
2. A selected File opens only after exact byte/range commitment verification;
   unavailable, tampered or unsupported bytes retain the selected metadata but
   produce no usable content.
3. Tag filtering is tested after Lens selection with an untagged winner, a
   whiteout, conflict and unknown winner; no lower tagged File leaks through.
4. One supported create/upload produces an exact plan. If Core supplies a
   single contract-enforced atomic move effect, test that it remains unsplit;
   otherwise assert that the adapter refuses atomic move. Fault injection drops
   the submission response after the wallet prompt.
5. Destroy browser/runtime/cache state, restore the retained attempt, and
   reconcile through fresh independently qualified state/effect evidence at an
   explicit basis before any retry. Count every real wallet prompt; report
   `COMMITTED` only if the named canonical-effect verifier succeeds.
6. A fresh independent consumer, without the original running app, lists and
   opens the retained result from declared state and byte carriers.
7. Send results through JSON, structured clone, IndexedDB-like storage and a
   plugin-shaped handoff. Strip qualifiers, forge a cursor, mix bases, inject an
   unknown future field and present an empty collection with missing layout.
8. Compare exact subject/value/raw evidence, basis, coverage and each requested
   assurance across boundaries; preserve useful partial positives.

Measure the whole journey at cold and warm starts: requests and bytes by source,
bundle/parse/execute, latency to first useful File and complete coverage,
retained evidence and peak memory, wallet prompts, transaction/call work,
qualified effect read-back and restart/reconciliation time. Report body upload,
reference establishment, authorization/indexing, full Files transaction,
deployment and read costs separately. The K10 seven-key getter and isolated
storage spans remain component evidence, not the journey result. The observed
K10 delta is specifically −40,023 gas for that seven-key cold scope-to-key
lookup and +4,471 gas when cold history hydration is included; it is not a
10,000-key, write-path, full-transaction or product-latency claim.

## Human usability versus clean-context proxies

Clean-context agents are useful first falsifiers for:

- building a notes or gallery consumer using only the proposed public docs and
  declarations;
- accidentally checking one top-level outcome instead of the required claim;
- JSON/clone/cache/version-skew and unknown-field survival;
- lost-response restart/reconcile behavior;
- importing no internal Type/Data-ABI, fixture or Core implementation module;
  and
- independent reconstruction from retained source locks and declared state.

A real human test is still required for whether an unfamiliar developer can
choose the right requirement, understand “files found but enumeration partial,”
distinguish submitted/unknown/committed, diagnose a blocked destructive action,
and complete the flow without studying the result algebra. Real-wallet consent,
prompt comprehension, retry confidence, accessible recovery and perceived API
complexity cannot be established by an agent proxy or headless browser.

## Stop and challenge conditions

Stop this integration lane and redesign before public implementation if:

- an app must inspect every result axis or branch on one generic `VERIFIED`;
- a generated projection can detach its value from observation/coverage/evidence;
- plain deserialization revives trusted status without revalidation;
- a generic number/cursor can cross ordinal layout, query, Lens or basis;
- filtering can reveal a losing File before qualified Lens selection;
- a lost response is converted to failure or triggers an automatic wallet retry;
- the SDK or product integration owner owns a second Core
  resolver/verifier/result law;
- the conformance suite requires copying the product runtime into the SDK lab; or
- passing isolated K10/storage numbers is reported as integrated Files cost.

If the adapter cannot preserve these semantics using the pinned Core fixture,
return the smallest failing multi-consumer case to Core. Convenience alone is
not a Core-change justification.
