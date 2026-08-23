# EFS v2 `EXP-C0` semantic trace seal

**Date:** 2026-08-23
**Status:** independently reviewed symbolic semantic corpus; input to G2, not protocol conformance or a byte seal
**Candidate:** `EXP-C0`
**Planning source:** `4119c7ac30b64b490674accc07ce1f15206df2f6`
**Prior G1 carrier source:** `ae9d75bd52d247fe8699475ac1e770fe268efbdb`
**Machine-readable manifest:** [`trace-manifest.json`](./trace-manifest.json)
**Manifest SHA-256:** `ec81918f0e97e91d9e0c17babad704665a25889d92145ac4adedf6b91830fedd`

#status/done #kind/review #repo/planning #repo/contracts #repo/sdk #topic/efsv2 #topic/readiness

## Verdict

The first G2 artifact is sealed tightly enough to hand to independent
model and Solidity experiment authors at the **semantic** level.

The corpus seals one small integrated micro-Realm:

```text
Realm bootstrap and revision
  -> exact Type + two Records
  -> portable two-leaf PublicationSet
  -> destination AdmissionPlan
  -> EOA / ERC-1271 admission
  -> Binding CAS, tombstone, Withdrawal, and scope
  -> QueryProfile activation, partial backfill, and terminal completion
  -> finite point Lens
  -> state-only reconstruction
```

It contains 61 symbolic positive and hostile traces, 38 reusable lossless
result profiles, explicit state deltas, a declared finite state projection,
illegal facts combinations, and an explicit freeze-only remainder. It declares
four required future ABI-shaping comparators; it does not claim to contain their
byte-level traces yet.

This is deliberately **not** an executable or byte-level seal. Exact disposable
candidate codecs, preimages, domains, bounds, input bytes, state digests, and
projection digests must be supplied before the pure model or SUT can claim
agreement. Ceremony-final bytes remain a later `GO-FREEZE` decision.

## What this resolves

- The next experiment has one shared state machine rather than a separate Type,
  identity, Binding, query, Lens, and reconstruction interpretation per author.
- `EXP-C0` is the default control; a losing arm receives one minimum comparator,
  not a parallel full implementation.
- Portable Type-validity and Realm admission policy are separate.
- QueryProfile identity, Realm activation authority, cost allocation, backfill,
  and terminal completeness are separate.
- Principal identity, historical verifier behavior, Realm policy, and current
  account/code observations are separate.
- Point existence, scoped completeness, byte availability, authority,
  lifecycle, selection, finality, and effect outcome are separate.
- Every rejected mutation must prove zero state change before using
  `NOT_COMMITTED_PROVEN`.
- Every trace must preserve the same qualified facts through Core, Solidity ABI,
  SDK, and Explorer projections.

## What this does not resolve

- production hash, codec, ID, ABI, error numbers, rejection precedence, or cap;
- final Record/Publication carrier bytes;
- final signature suites, Realm formula, execution profile, or successor law;
- permanent QueryProfile activation policy or cost schedule;
- final Lens grammar or size;
- physical contract topology or storage layout;
- target Realm, Commons, operators, deployment, or product scope;
- chain canonicality/finality or permanent availability of offchain bytes; or
- an EFS hyperstructure claim.

## Authority and prior-evidence boundary

The sealed G1 carrier oracle at `ae9d75bd` remains useful input for portable
source-witness graphs and destination Plans. Its result grades are not copied
blindly. In this G2 corpus:

- pure portable artifacts use `effect=NOT_APPLICABLE`;
- a rejected effectful operation uses `NOT_COMMITTED_PROVEN` only when the
  implementation compares an exact pre-state and post-state basis and proves
  equality; and
- a dropped submission channel remains `effect=UNKNOWN` until canonical
  read-back proves the exact effect set committed or did not commit.

The project owner's travel-period direction authorizes this reversible design
and validation work. It does not ratify the symbolic nouns, trace outcomes as
protocol law, or any permanent implementation.

## State projection

The micro-Realm's authoritative candidate projection is finite and includes:

```text
RealmState {
  bootstrap, revisions, disclosed possible powers,
  types, canonical descriptors, records and required preimages,
  publicationSets, occurrences, sourceWitnesses, noncePlans,
  operations, admissions, verifierTranscripts, basePostings,
  bindings, bindingHistory, bindingScopes, withdrawals,
  queryProfileActivations, coverage commitments, indexPostings,
  resolutionPlans, required point inputs, costCommitments,
  all named counters, inventoryCount, projectionRoot
}
```

Named states in the manifest are ordering aids, not executable expectations.
Every trace carries the authoritative symbolic delta: paths that must be added,
changed, or advanced, paths that must not change, and whether the post-state is
exactly observed. A rejected mutation must leave the complete Realm projection
unchanged. The dropped-submission trace is the sole `UNOBSERVED` delta and lists
the two legal atomic alternatives without pretending to know which occurred.

The projection is non-circular. `projectionPayload` is the deterministic
serialization of every explicitly listed authoritative collection and ordinary
counter. `finiteInventoryCount` is derived from that payload. `projectionRoot`
commits a domain, the payload, and the count; the root is never part of its own
preimage.

Logs, transaction history, a writer database, hosted indexer, cache, wallet,
Commons, and manually supplied private module list are not authoritative inputs.
An authenticated chain/state proof source may still be required to establish
the exact observation basis; the corpus does not pretend Core bytecode can know
its eventual inclusion block hash or finality.

## Lossless result envelope

Every Core, Solidity, SDK, and Explorer result projects from one retained
qualified envelope:

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

| Axis | Values | Non-collapse rule |
|---|---|---|
| presence | `FOUND`, `ABSENT_PROVEN`, `UNKNOWN`, `CONFLICT`, `OPAQUE`, `MASKED`, `NOT_APPLICABLE` | `UNKNOWN`, hidden, or opaque never means absent. |
| coverage | `COMPLETE`, `PARTIAL`, `NOT_APPLICABLE` | Transport success, a short page, or a point proof never establishes a complete scope. |
| support | `SUPPORTED`, `UNSUPPORTED`, `LIMIT_EXCEEDED`, `NOT_APPLICABLE` | Unsupported or over-limit never means empty. |
| validation | `STRUCTURALLY_VALID`, `SEMANTICALLY_VALID`, `INVALID`, `UNPROVEN`, `NOT_APPLICABLE` | Realm admission cannot manufacture portable Type-validity. |
| authority | `AUTHORIZED`, `DENIED`, `UNPROVEN`, `NOT_APPLICABLE` | Signature shape, current account code, or self-declared interface is not authority. |
| lifecycle | `ADMITTED`, `WITHDRAWN`, `CARRIED_ONLY`, `UNPROVEN`, `NOT_APPLICABLE` | Carriage, admission, withdrawal, and deletion remain distinct. |
| selection | `CURRENT`, `NOT_CURRENT`, `CONFLICT`, `UNKNOWN`, `NOT_APPLICABLE` | Record existence does not prove a Binding or Lens selected it. |
| bytes | `VERIFIED_AVAILABLE`, `PARTIAL`, `UNAVAILABLE`, `INTEGRITY_FAILED`, `NOT_APPLICABLE` | Unavailable/corrupt bytes never erase a present Record. |
| effect | `COMMITTED`, `NOT_COMMITTED_PROVEN`, `UNKNOWN`, `NOT_APPLICABLE` | Wallet, bundler, RPC, relayer, or transaction acknowledgement is not canonical effect. |
| projection integrity | `MATCHED`, `MISSING_REQUIRED_ITEM`, `INTEGRITY_FAILED`, `NOT_APPLICABLE` | Missing reconstruction input and detected substitution are different outcomes. |

`NOT_APPLICABLE` is legal only where the result kind truly does not speak to an
axis. It cannot hide a failed or unavailable check. The manifest enumerates the
complete value vocabulary and each reusable result profile.

## Point, scope, Lens, and submission laws

| Request | When absence is proved | Required basis rule |
|---|---|---|
| exact point | the authoritative local mapping proves the exact key absent at the pinned Realm basis | one atomic local read may be `COMPLETE`; a failed RPC or import is `UNKNOWN` |
| scope/query | one declared finite domain is terminally exhausted under the exact Type, QueryProfile activation/generation, ordering, high-water, and basis | every cursor commits all of those coordinates; mixed pages never merge |
| Lens | every bounded point probe required by the risk-bearer-approved Plan completes under one basis | proved higher-priority absence may permit the pinned fallback; `UNKNOWN/PARTIAL` may not |
| submission | absence is not a submission fact | the operation binds Realm, actor/author, nonce, expiry, effects, preconditions, executor/dependencies, and maximum cost; canonical read-back determines effect |

The manifest explicitly declares illegal collapse families, including
`ABSENT_PROVEN + PARTIAL`, `COMPLETE` from a point proof or event/indexer scan,
`AUTHORIZED` from current ERC-1271 code, and `COMMITTED` from a transport
receipt.

## Transition contract

### Realm bootstrap

`R0` creates a self-authenticating Realm and revision zero from origin/genesis,
Core component, accepted execution profile, policy/verifier, and every possible
administration or upgrade commitment. `R1–R5` distinguish two Cores on one
chain, matching visible deployments over different genesis, separately complete
fork observations, a conflicting aggregate, hidden administration, and an
unannounced post-bootstrap dependency change.

A disclosed mutable prototype may be a valid experiment but cannot report
hyperstructure status. An omitted beacon, facet route, implementation pointer,
registry owner, pause key, policy owner, or mutable dependency fails bootstrap
authentication.

### Exact Type and Records

`T0` uses one bounded `T_NOTE` Type and two immutable Records, where Record B
contains exactly one closed reference to Record A. `T1` attacks canonical order,
absent-versus-zero, duplicate/reserved coordinates, malformed references,
unknown selectors, limits, and trailing bytes.

The closed portable interpreter alone decides `Type-valid`. A Realm admission
policy may reject a Type-valid Occurrence, but it cannot rename the Type or
Record or declare it portably invalid.

### Publication and admission

`P0` is the positive end-to-end control:

```text
PublicationSet PUB_ALICE_AB
  ordered leaves = [REC_A_ALPHA, REC_B_BETA_REF_A]
  semantic author = ALICE_EOA
  exact source witness, nonce, expiry

AdmissionPlan
  exact source Occurrences
  destination = RA revision 0
  effect = bind ALICE/POSITION_K -> REC_B at expected revision 0
  actor, executor/dependency basis, nonce, expiry, cost and effect commitment
```

The successful transition atomically stores every required Type/Record body,
Publication, Occurrence, receipt, posting, Binding head/history, and one scope
row. `P0B–P5D` then attack an invalid EOA signature, a malformed second leaf,
source/destination witness confusion, each replay coordinate, nonce collision,
the exclusive expiry boundary, idempotent retry, the EIP-7702 `hasCode` trap,
verifier-profile substitution, and ERC-1271 time travel.

Historical ERC-1271 admission retains the digest/domain, account, signature,
verifier profile, code/dependency basis, gas/return policy, execution coordinate,
and result. Current contract code is never recalled to reinterpret the receipt.

### Binding, tombstone, and Withdrawal

`B0–B3` update the Binding through revision 2, reject a stale revision with no
effect, append a revision-3 tombstone, and withdraw the earlier Occurrence.

The Binding scope keeps the position after tombstone or Withdrawal. Withdrawal
deletes no Record, rewinds no Binding, withdraws no other issuer's Occurrence,
and resurrects no old head.

### QueryProfile activation and completeness

`Q0–Q5` require Realm-qualified activation state containing the exact
Type/Profile, RealmRevision, generation, activation high-water, covered
historical interval, covered-through high-water, state, activation-policy basis,
bounded fanout, backfill payer, future-write cost rule, and maximum cost.

Profile identity grants no activation authority. Unauthorized activation,
fanout overflow, cost-cap overflow, and unconsented cost substitution are
independently falsifiable and change no state. Partial backfill remains
`PARTIAL`, with distinct empty and nonempty results. One authorized future write
proves the separately adopted writer-cost rule and dual-posting behavior without
claiming historical completeness. Only the state machine may advance to
`TERMINAL_COMPLETE` after the exact interval, count/root, and postings
commitment agree. A cursor from another generation, high-water, ordering, Realm
revision, or block basis cannot continue the page stream.

### Contract Lens

`L0–L3B` use one risk-bearer-approved finite Plan over Council then Alice. Proved
Council absence permits the pinned fallback. Missing/partial Council evidence
does not. A beneficiary-supplied Plan, wrong purpose/scope/Realm/position, or
unsupported profile cannot replace the approved policy or silently fall back.

The minimum Lens performs bounded local Binding probes. It runs no arbitrary
policy and calls no ERC-1271 account per entry.

### Bytes and effect observation

`X0A–X0C` preserve `FOUND` for a present Record while distinguishing failed
integrity, unavailable bytes, and verified partial bytes.
`X1` preserves `effect=UNKNOWN` after a dropped submission channel even if a
wallet or RPC acknowledged the request. Exact state read-back is the only way
to upgrade that outcome.

### Reconstruction

`Z0` removes logs, transaction history, hosted indexers, writer state, caches,
wallet, Commons, and manually supplied module addresses. An independent reader
starts from one bootstrap and authenticated exact state basis, enumerates the
declared finite projection, and reproduces the disposable projection digest.

`Z1A` omits one required item and remains explicitly incomplete. `Z1B`
substitutes, reorders, or duplicates an item and deterministically rejects for
projection-integrity failure. Neither may manufacture a smaller “complete
Realm.”

## Corpus-wide invariants

1. Every multi-leaf admitted Plan commits all declared Core effects or none.
2. Every rejected effectful trace proves `postStateDigest == preStateDigest`.
3. Exact retry recovers one operation identity without duplicate effects.
4. A dropped response remains `UNKNOWN` until canonical effect read-back.
5. No Type, View, QueryProfile, indexer, wallet, relayer, source witness, or
   Lens self-authorizes an effect.
6. Old data is interpreted only under retained Type, Realm, policy, verifier,
   code/dependency, and execution bases.
7. Binding tombstones and Withdrawal never resurrect older state.
8. Query completeness is state-derived over a declared finite domain and basis.
9. `UNKNOWN`, `PARTIAL`, unavailable bytes, conflict, and unobserved effects
   survive every SDK and Explorer projection.
10. State-only reconstruction is authoritative; accelerators are optional.

## Minimum comparators

Before `RECOMMEND-GO-CODE`, add one exact disposable trace for each losing arm:

1. flat exact Type against one bundled and one layered/View encoding with
   identical accepted values and a caller-supplied hostile mapping;
2. full-width `PrincipalId` against one tagged-author input;
3. portable shared PublicationSet against one self-contained Record carrier and
   one Realm-bound publication domain; and
4. self-authenticating Realm bootstrap against bare-chain-ID and
   visible-root-only controls.

These are minimum semantic/identity comparators, not full parallel contracts.
A failure reopens the seam; it does not automatically prove which replacement
wins.

## Implementation handoff

The next experiment remains disposable and proceeds in order:

1. Replace symbolic constants with one exact, versioned candidate codec,
   preimage/domain set, bounds sheet, input corpus, and expected state/projection
   digests. Mark every artifact non-durable and non-conformant.
2. Implement an independent pure state model from this corpus. It must not
   import SUT code or share generated semantic logic.
3. Implement the simplest monolithic Solidity SUT from the same sealed inputs.
4. Differentially replay all traces. For every rejection compare exact complete
   pre/post state digests; for every success compare exact expected deltas and
   projection digest.
5. Expand a losing architecture arm only when its minimum comparator fires a
   written falsifier.

The honest exits are `CONTINUE-DISPOSABLE`, `REDESIGN`, or
`RECOMMEND-GO-CODE`. None self-authorizes real repository contract engineering.

## Freeze-only expansion

The manifest separately defers ceremony-final cross-language encoders, complete
signature/malleability/verifier attacks, every proxy/facet/module topology,
million-record query pressure, dead-posting/hot-value churn, final cost
allocation, full Lens gas/cap matrix, two independent reconstructors,
authenticated proof and reorg replay, clean-room toolchain regeneration, final
production manifest, target Realm, Commons, and any hyperstructure claim.

## Local verification

The semantic seal is locally checkable without interpreting protocol bytes:

```sh
jq empty trace-manifest.json
jq '[.traceGroups[].traces[].id] | length' trace-manifest.json
jq '[.traceGroups[].traces[].id] | unique | length' trace-manifest.json
shasum -a 256 trace-manifest.json
```

The two counts must both equal 61. The manifest declares 38 result profiles.
The digest above becomes authoritative only after the last review repair; any
subsequent manifest edit reopens review and requires a new digest.

## Independent review

The first independent passes found one P0 and several P1 ambiguities. Repairs
added explicit deltas and state anchors, split fork and replay outcomes, exact
expiry semantics, EIP-7702/ERC-1271 history cases, query cost authority,
result-kind coverage laws, byte-state separation, lossless per-trace
projections, and a non-circular reconstruction root. Final re-review reported
no remaining P0/P1 in all three lanes:

- state-machine/atomicity and completeness: **clean P0/P1**;
- Realm/authority/hyperstructure red team: **clean P0/P1**; and
- facts-matrix/SDK projection: **clean P0/P1**.

Review success means the symbolic corpus is coherent enough to implement. It
does not select bytes, prove an implementation, or close G2.
