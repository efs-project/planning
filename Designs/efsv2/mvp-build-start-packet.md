# EFS v2 — candidate MVP build-start packet

**Status:** draft recommendation held at the cross-lane handoff; current
disposition `CONTINUE-DISPOSABLE`; no production implementation, deployment, or
protocol freeze
**Target repos:** planning and disposable SDK/Explorer fixtures; real contracts,
SDK package, and client implementation only after an owner `GO-CODE` ruling
**Depends on:** [[v2-contract-readiness-program]], [[system-constitution]],
[[core-architecture-candidate]], [[exp-c0-v0-data-structure-profile]],
[[exp-c0-v0-result-api-profile]],
[[exp-c0-v0-codec-domain-bounds-vector-contract]], and
[[exp-c0-v0-hello-files-trace]]
**Last touched:** 2026-08-25

#status/draft #kind/design #repo/planning #topic/efsv2 #topic/mvp

## Recommendation

Prepare to start one top-to-bottom, explicitly nondeployable EFS v2 candidate,
but do not issue `RECOMMEND-GO-CODE` yet. The Core-side exact handoff exists;
the raw SDK and no-wallet Explorer must first consume that same source lock
without a P0/P1 truth mismatch.

Do not wait for `GO-FREEZE` evidence before learning from real contract and SDK
engineering. Do not let candidate engineering silently freeze the disposable
`EXP-C0/v0` bytes.

The first implementation should be a monolithic semantic control with direct
raw reads. That is a measurement and integration choice, not the permanent
contract topology. Split modules only after code size, gas, upgrade-power, and
stateless-helper evidence shows where a boundary belongs.

The first usable product outcome is:

```text
explicit Realm + authenticated read basis
    -> exact Type and Record bytes
    -> authored PublicationSet and per-leaf Occurrences
    -> atomic Realm admission and receipts
    -> Binding / complete Binding scope / Withdrawal
    -> bounded exact-Type query and public point Lens
    -> generic raw collection reader + complete reconstruction
    -> raw-preserving TypeScript SDK
    -> no-wallet direct-guest Data Explorer Inspector
    -> minimal Files profile with verified bytes
```

This is enough to prove the substrate from contract state to a human-visible
application while preserving the larger EFS goal. Git, packages, achievements,
agents, media, and future applications stay ordinary Types and relations; none
needs an application-specific Core kind.

## Current build-start checkpoint

- The Core disposable packet defines the candidate structures, result API,
  domains/preimages, bounds, 28-collection projection, and literal
  `HELLO_FILES` handoff, with narrowed JavaScript and Solidity controls.
- The evidence ledger still reports zero of 61 sealed semantic traces with a
  complete literal request/result/pre-state/post-state replay bundle. The
  vertical fixture is integration evidence, not a disguised replay claim.
- The SDK and Data Explorer have not yet consumed the exact Core source lock.
  Their handoff is the remaining pre-recommendation gate, not a reason to reopen
  every settled candidate default.
- V2-C1 is the one remaining owner build-start choice, but it stays out of the
  answerable queue until that cross-lane gate and final audit are green.

## Candidate semantic surface

The first engineering candidate uses these generic nouns and no others:

1. `RealmBootstrap` and append-only `RealmRevision`;
2. full-width `PrincipalId`, exact verifier profile, and historical verifier
   transcript;
3. exact nominal `TypeSchema`, immutable author-neutral `Record`, portable
   `PublicationSet`, and per-leaf `Occurrence`;
4. signed `AdmissionPlan`, ordered `EffectV0[]`, `Operation`, per-leaf
   `AdmissionReceipt`, and separate signature/submission/effect receipts;
5. Principal-qualified Binding head/history/scope and issuer-qualified
   Withdrawal;
6. separately identified `QueryProfile`, activation/coverage state, bounded
   postings/pages, and exact 11-coordinate cursor;
7. immutable `ResolutionPlan` for bounded point Lens reads;
8. literal qualified `ResultV0`, generic `COLLECTION_ENTRY` point reads, and
   exact 28-collection `ProjectionV0` reconstruction; and
9. Record byte digest/locator reads with supplementary ordered acquisition
   evidence outside Core state.

The Type language in the first candidate is deliberately bounded and
non-executable. Exact Type identities include meaning, accepted-value shape,
representation, intrinsic constraints, and closed reference roles. Recursive
graphs and hyperstructures arise through immutable `RecordId` references,
stable Bindings, authored Occurrences, and ordinary relation Types—not Type
callbacks or application-specific contract code. Query/index policy remains a
separate exact profile so adding an index never reinterprets an old Record.

## First implementation slices

### M0 — exact candidate handoff

- Commit the disposable Type/plan/result/cursor/projection structures and
  vectors under a clearly experimental namespace.
- Make JavaScript and Solidity independently reproduce the essential IDs,
  Plan/Effect/Operation IDs, literal Results, cursor, and projection root.
- Give all 61 sealed traces an honest evidence disposition. The literal
  `HELLO_FILES` integration control must compose the selected fields across the
  write, query, Lens, byte-acquisition, SDK, and Explorer seams without being
  mislabeled as one of those exact trace replays. Complete vector
  bundles are not required to begin candidate engineering; any trace claimed
  implemented does require its literal request/result/pre/post bundle.
- Exit M0 only when Core, SDK, and Explorer pin the same exact handoff and the
  two consumer adapters preserve every qualified field. The Core side is
  present; cross-lane consumption is pending.

### M1 — candidate Core skeleton

- Implement bounded encode/decode/canonicality and one generic Type interpreter.
- Retain canonical state bytes and expose `getPoint(collectionKind,key,basis)`.
- Implement bootstrap, portable artifact validation, exact ID derivation, and
  state-only projection enumeration.
- Compile as one nondeployable contract under named execution profiles; use no
  upgrade or administrator mechanism that is absent from the Realm descriptor.

### M2 — authoritative write spine

- Implement EOA and exact ERC-1271 profile verification with retained
  transcripts.
- Execute two-leaf admission and ordered effects atomically.
- Implement nonce collision, exclusive expiry, exact retry, Binding CAS,
  tombstone, complete scope, Withdrawal, and canonical read-back receipts.
- Prove every rejected path either has independently equal complete roots or
  reports effect `UNKNOWN`; never infer no-effect from a transport error.

### M3 — bounded read spine

- Implement exact-Type QueryProfile activation, partial backfill, future dual
  posting, terminal count/root, page limits, and cursor rejection.
- Implement immutable 1/8/32/64-Principal point ResolutionPlans. Only proved
  absence permits fallback; `UNKNOWN`, conflict, unsupported, or mixed basis
  stops.
- Reconstruct all state from the declared 28 collections without logs, wallet,
  hosted indexer, Commons, or current mutable policy.

### M4 — SDK conformance slice

- Ship raw codecs, IDs, requests, literal `ResultV0`, receipts, cursor, and
  projection verification before ergonomic DTOs.
- Generate one `TNoteC0` façade from the exact Type closure in TypeScript and
  Solidity; prove clean regeneration and byte-preserving round trips.
- Keep plan signature, account/user-operation authorization, submission, and
  canonical effect as separate APIs and receipts.
- Provide direct/stateless calls first; any helper contract is optional,
  reproducibly deployed, and has a local fallback.

### M5 — Data Explorer guest slice

- Boot a static app at an explicit Realm/basis with no wallet, account,
  Commons, OS, catalog, or backend requirement.
- Show bootstrap, revision, Type, Record, PublicationSet, admitted Occurrence,
  and admission evidence through the generic raw Reader.
- Preserve literal Result, raw bytes, projection/value commitments, basis,
  completeness, availability, and ordered acquisition attempts in Inspector.
- Begin with a replaceable fake Reader over pinned disposable vectors; replace it with the
  direct SDK reader without changing view semantics.

### M6 — minimum Files profile

- Define ordinary exact creator+salt+charter ObjectGenesis Types for stable File
  and Directory identities, plus `DirectoryFileEntryC0` and immutable
  `FileRevisionC0`; mutable names never enter stable object bodies.
- Pin every Record reference to its exact target Type, derive exact name-index
  keys from Type/field/canonical bytes, and keep C0/v0 file digests explicitly
  Keccak-256.
- Use Binding positions and complete Binding scope for directory names; use an
  explicit mount/namespace Plan rather than ambient path authority.
- Resolve verified bytes with corrupt-primary rejection and eligible fallback.
- Add list/tree/raw views only after the Inspector path stays lossless. Rich
  tables, third-party views, writes, search, and OS integration are later
  modules over the same Reader/Files seam.

## What is not an MVP blocker

The following remain important but do not prevent nondeployable candidate
engineering:

- ceremony-final hash, codec, enum numbers, ID namespace, selectors, or caps;
- permanent contract split, proxy/facet topology, helper addresses, or
  production upgrade policy;
- final target Realm/Commons venue or public deployment;
- KEL recovery, delegation, cross-Realm authority bridges, or a canonical home
  chain;
- private/encrypted folders, rich EFS OS policy, ranked/full-text/global search,
  or high-frequency telemetry;
- exhaustive 61-trace replay, all application profiles, Rust conformance, two
  independent reconstructors, or century-scale gas/availability evidence; and
- polished Explorer filesystem UX, extensions, writes, app store, Git forge,
  or collaboration suite.

These are freeze, deployment, or later product gates. Candidate code must leave
their extension seams honest and must not claim they already work.

## Questions engineering should answer with code

These should not be sent to the owner as abstract design questions:

- safe Type/interpreter/reference bounds and aggregate automatic-index cost;
- actual write, return-data, code-size, state-growth, and Lens gas under named
  execution profiles;
- whether the monolith needs a physical split and where atomicity can survive;
- final practical query page/Lens/result byte caps;
- direct versus generated versus optional-helper SDK ergonomics;
- exact Files directory-page and verified-byte adapter behavior; and
- which of the 61 traces expose a missing semantic field rather than merely a
  missing implementation.

## Decisions that genuinely belong to the owner

Before real candidate code begins, the owner must authorize `GO-CODE` for a
**nondeployable, replaceable candidate** while retaining the explicit
`GO-FREEZE` and `GO-DEPLOY` gates. The owner should not answer yet: V2-C1 becomes
answerable only after the exact Core/SDK/Explorer handoff and final cross-lane
audit are green.

The first product target is already selected as a delegated candidate default:
direct-guest raw Explorer plus the minimum Files slice, with Core/SDK-only as a
fallback only if the integrated vertical exposes a named blocker. That follows
the owner's explicit instruction to work top-to-bottom; it is not a product
freeze.

Before any protocol freeze or public deployment, the owner must separately choose
or ratify final bytes/IDs, visible Realm powers and succession, production
contract topology, supported execution/read profiles and bounds, the first
venue, administration/upgrade posture, and release scope. Candidate test
results may recommend those choices but cannot make them permanent.

The Principal comparator is not an additional build-start choice absent its
named falsifier. Use one full-width `PrincipalId` API with zero-setup account
Principals because every downstream author, index, Binding, Plan, Lens, and SDK
surface stays uniform. Old Occurrence identity is never rewritten when a later
managed Principal is associated. Return a value fork to the owner only if candidate
verification cost or developer pressure falsifies that default.

## Build-start stop conditions

Do not recommend `GO-CODE` if any of these remains true:

- JavaScript, independent vector emitters, and Solidity disagree on a
  state-bearing preimage used by the first slice;
- the literal result vocabulary cannot represent every sealed outcome without
  collapsing unknown, partial, basis, availability, authority, or effect;
- a rejected mutation claims proved no-effect without equal complete roots;
- terminal query absence can be manufactured from a Boolean or partial scan;
- generic raw reads discard canonical values or need an application-specific
  subject kind;
- the first SDK/Explorer adapters require a wallet, Commons, hosted indexer, or
  friendlier lossy result as truth; or
- the declared projection cannot enumerate every state collection needed to
  reproduce the candidate state.

Everything else should be classified as an owner decision, a named engineering
task, or a later freeze/deployment gate—not left as an undifferentiated unknown.
