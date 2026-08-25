# EFS v2 SDK — `EXP-C0` disposable MVP packet

**Status:** draft — disposable SDK/Core handoff; no package, bytes, ABI, deployment, or support promise is adopted
**Target repos:** planning, sdk, contracts, client
**Depends on:** [[README]], [[architecture-candidate]], [[developer-journeys]], [[experiment-program]], [[../efsv2/layered-type-system-and-data-abi]]
**Inputs:** sealed semantic source `a68b00a` / `Reviews/2026-08-23-efs2-exp-c0-semantic-seal`; exact disposable serialized Core source commit `b9088d6a24f4d40bcca6ba300523b25cc7c608d2`, handoff SHA-256 `2e8d191e4dd7c2130378e09f3cbc5b71441906cbaa6c448c30139aafe9ec203d`; neither source is merged protocol authority
**Supersedes:** —
**Reviewers:** —
**Last touched:** 2026-08-25

#status/draft #kind/design #repo/planning #repo/sdk #repo/contracts #repo/client #topic/efsv2 #topic/read-path #topic/onchain

## Read this on a phone

**Purpose:** turn the sealed `EXP-C0` semantic result law into the smallest buildable, disposable SDK slice. It gives one raw-preserving TypeScript runtime, one generated exact-Type facade lane, and one Solidity-consumer lane the same outer `ResultV0` contract. It does **not** choose final names, encodings, selectors, package publication, deployment, or a production API.

**The first serialized Core-consumer packet is now source-locked and consumed.** Five exact committed artifacts carry the consumer contract, handoff, HELLO trace, Result vectors, and Type-envelope vectors. An independent SDK checker imports none of Core's implementation or test code and passes exact hash, decode/re-encode/recommit, pointer, raw-retention, `uint64`, codec-1, and mutation checks. This clears the input blocker for the next disposable SDK implementation; it does not claim Core conformance or make any candidate byte durable.

## C0 source lock and authority boundary

The source packet seals the following semantic constraints for the next experiment:

- all Core, Solidity, SDK, and Explorer projections begin with one retained `ResultV0` envelope;
- result axes are independent; `UNKNOWN`, partial coverage, unavailable or corrupted bytes, and an unobserved effect are never coerced to a negative or success;
- a query cursor binds exact Type/Profile, activation generation, Realm revision, ordering, high-water, and read basis;
- plan-signature verification, account authorization/submission, and canonical semantic effect are distinct receipts; and
- reconstruction starts from bootstrap plus authenticated state projection, not logs, a writer database, an indexer, wallet, Commons, cache, or a private module list.

The source explicitly leaves production codec, ID, ABI, error number, rejection precedence, cap, Realm, and final signature suite open. The structures below are therefore named only as disposable field groups. A candidate implementation must pin an exact versioned encoding/vector packet before signing, hashing, serializing, or invoking Solidity.

## Shared outer contract

Every SDK-facing operation has this conceptual outer shape before a generated or product-specific projection:

```text
ResultV0 {
  kind
  subjectOrFiniteDomain
  realmId + realmRevision + executionCoordinate + admissionHighWater
  observer? { blockHash, blockNumber, stateRoot?, source, requestedFinality,
              observedFinality, freshness, canonicalityObservation,
              canonicalityAssessment, evidenceKind }
  profile { presence, coverage, support, validation, authority, lifecycle,
            selection, bytes, effect, projectionIntegrity }
  payload? { rawEnvelope, value, page, byteRange, receipt, projection }
  commitments { protocolResultAbi, type?, queryProfile?, policy?, code?,
                provenance?, limits? }
  diagnostics? { stableDetailCode, rawProviderEvidence?, attempts? }
}
```

`payload.rawEnvelope` is exact retained source bytes when obtained. It survives decode, cache, structured clone, export, relay, generated facade projection and reconstruction. A friendly DTO is never hashed or signed in place of those bytes. `diagnostics` remains outside the semantic profile and cannot turn a provider `null`, revert, timeout, short page, or wallet acknowledgement into a negative or a committed effect.

The C0 effect axis is exactly `COMMITTED`, `NOT_COMMITTED_PROVEN`, `UNKNOWN`, or `NOT_APPLICABLE`. A locally rejected plan/submission is a diagnostic and planning/submission result, not a new canonical-effect value. It becomes `NOT_COMMITTED_PROVEN` only after an exact pre/post state basis proves equality; a dropped channel remains `UNKNOWN` until canonical read-back.

## First offchain TypeScript slice

The initial source layout is deliberately an **unpublished fixture workspace**, not an npm package commitment:

```text
packages/exp-c0-runtime/          # future disposable implementation location
  model/                          # opaque IDs, ResultV0, axes, commitments
  raw/                            # canonical bytes, bounds, strict decode
  read/                           # injected ExactReadPort and PagePort
  bytes/                          # bounded verified-range attempts
  actions/                        # Plan, receipt linkage, recovery
  reconstruct/                    # closure import and projection replay
  generated/                      # fixture-only exact-Type facade imports
```

The runtime has no ambient RPC provider, wallet, indexer, cache, `latest`, catalog, package registry, or mutable Type resolver. All sources are injected; read capability is wallet-free. A product can add cancellation, batching, streaming and qualified cache policy around the runtime only if every returned item keeps the same `ResultV0` field groups.

| Operation family | Runtime obligation |
|---|---|
| `readExact` | Return a qualified point `ResultV0`; only an authoritative exact local mapping at the pinned basis can report `ABSENT_PROVEN`. |
| `readPage` | Return a page payload and opaque cursor whose decoded commitment includes query identity, Type/Profile, activation generation, Realm revision, order, high-water, basis, limits and coverage state. Resume rejects any mismatch; pages from different bases never merge. |
| `readBytes` | Preserve locator/range/commitment and every acquisition attempt; return byte state independently of Record presence. |
| `plan` | Produce an inspectable canonical operation/effect commitment before any wallet/account action. A changed role, Realm, precondition, executor/dependency basis, nonce, expiry, effect set, or cost restarts planning. |
| `verifyPlanSignature` | Return a signature-verification receipt over the unchanged plan/message digest under an explicit verifier and basis; no persistent counterfactual preparation. |
| `authorizeAndSubmit` | Return an account-authorization/submission receipt over its own transaction/call/user-op/delegation commitment, linked to—not substituted for—the EFS plan. |
| `recoverEffect` | Read exact expected effects at the recovery basis and return per-effect C0 outcome; transport acknowledgement alone is never recovery. |
| `reconstruct` | Import retained raw closure and state projection; report missing, substituted, duplicate, or reordered input through the projection axis without mutable network reads. |

## Generated exact-Type facade boundary

For the first two C0 fixture Types, the generator may emit a local TypeScript facade containing DTOs, builders, canonical codec wrappers, validators, reference extractors, query builders, vectors, and compatibility/bound reports. It sits inside `generated/` and accepts/returns `ResultV0`; it may add a selected `value` projection only when exact Type/profile/limits match.

- The facade receives retained raw bytes and a selected exact Type closure. It never fetches descriptors, resolves a catalog, chooses a provider, or upgrades an unknown Type to understood.
- An unknown or unaccepted Type remains raw relayable evidence with `support=UNSUPPORTED`; a partial/invalid decode retains raw bytes when available.
- Generated output binds source closure, generator/compiler/settings, output hashes, and vectors. Runtime/API semver is a separate clock from protocol, Type, query-coverage, Realm, and generator identities.
- The facade does not construct its own outer result law. Data Explorer and Web Client facades may use different domain DTOs but must retain the same `ResultV0` outer fields and raw/evidence exit.

## Contract-developer and helper boundary

The first Solidity consumer lane is generated exact-Type source, not a deployed SDK helper:

```text
generated/TNoteC0.sol
  - exact candidate Type/profile/limits commitments
  - bounded `internal pure` encode/decode/validate/reference extraction
  - narrow `ICoreC0` reads/writes using explicit result structs/enums
  - no dynamic schema VM, callback, registry-selected code, or delegatecall
```

The application contract supplies its own authority and calls the narrow Core interface under declared bounds. It receives Core's execution coordinate, Realm revision/high-water, and structural result fields; its offchain observer adds block hash, proof/source, finality and canonicality evidence. A bounded generic probe may expose only commitments/status/bounded detail and cannot validate arbitrary payload semantics.

A direct stateless `STATICCALL` helper is optional only after the generated leaf has a measured size/gas failure. It must be code-hash-pinned, reproducible, finite-dependency/basis-qualified, and accompanied by identical local generated fallback. It cannot define validity, authority, completeness, absence, admission, signing, or effect success.

## Disposable Core packet received for this lane

The exact Core handoff names a broader disposable packet around the following
integration groups. This SDK check directly consumes only the Result, Bytes,
Type-envelope, HELLO, and source-lock projections needed for the S0C boundary;
later SDK experiments may ingest additional pinned vectors without importing
Core implementation code.

1. Realm bootstrap/revision and execution-coordinate/high-water values.
2. Exact Type, Record body, PublicationSet, Occurrence, AdmissionPlan, Binding CAS/tombstone/Withdrawal, QueryProfile activation, and finite projection manifest inputs.
3. `ResultV0` axis values, legal/illegal combinations, stable bounded detail codes, and which field groups Core can supply versus an observer.
4. Page/cursor preimage and resume rules, including Profile activation generation, ordering, high-water, Realm revision, basis and coverage.
5. Operation/effect-set preimage, replay domain, signature domain, and three linked receipt shapes: plan-signature verification, account/submission, and canonical per-effect read-back.
6. State projection member ordering, count/root/digest, availability and missing/substitution/reordering behavior.

The five-file SDK intake does not reproduce Core's model, generator, Solidity,
or test implementation. It is enough to start the SDK's disposable runtime and
generated-facade work while keeping package names, class shapes, product DTOs,
cache implementation, transport adapters, cancellation and UI in SDK/product
scope. The candidate packet remains disposable and unadopted.

## Disposable fixture

`Reviews/2026-08-25-sdkv2-exp-c0-mvp/` contains two distinct evidence layers.
The source-only JSON cases exercise an empty partial page, a stale cursor,
unavailable bytes, a dropped submission channel, a proved-no-effect recovery,
and missing reconstruction input. The clean-room layer retains five exact Core
serialized inputs plus a role-neutral source-lock receipt and SDK report. Its
checker validates five raw artifact locks, 21 required pointers, four Result
encodings, six Type envelopes, exact Bytes semantics, and 13 adversarial
mutations. It uses no Core source, scripts, generators, or tests. Neither layer
tests a provider, wallet, transaction, deployed contract, or production SDK.

## Open questions

- [x] For the `EXP-C0/v0` S0C consumer boundary only, exact disposable Result, Bytes, and Type-envelope encoding and bounds are pinned by Core commit `b9088d6a24f4d40bcca6ba300523b25cc7c608d2` and the role-neutral receipt. This is not a freeze.
- [ ] Which bounded Core detail-code set is sufficient for the fixture without encoding provider faults as semantic truth?
- [ ] Do generated exact leaves meet the selected execution-profile budget before a helper is considered?
- [ ] Can a second independent offchain implementation preserve this packet without sharing runtime semantic code?

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed (no surprise repos at implementation time)
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment
