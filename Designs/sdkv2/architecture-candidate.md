# EFS v2 SDK architecture candidate

**Status:** draft — three-arm comparison and recommended disposable path; no package/API/ABI is adopted
**Target repos:** planning, sdk, contracts, client
**Depends on:** [[README]], [[research-precedents]], [[developer-journeys]], [[../efsv2/layered-type-system-and-data-abi]], [[../web-client-os/type-data-abi-boundary-pressure]]
**Reviewers:** @offchain-precedents (2026-08-22), @onchain-precedents (2026-08-22), @local-authority (2026-08-22)
**Last touched:** 2026-08-22

#status/draft #kind/design #repo/planning #repo/sdk #repo/contracts #repo/client #topic/efsv2 #topic/onchain #topic/read-path

## Problem

EFS v2 needs one coherent developer experience across TypeScript applications,
browsers, servers, agents, indexers, archives, and Solidity consumers. It must
remain usable as Types evolve and today's toolchains disappear, while avoiding
two opposite failures:

- a dynamic schema runtime that becomes a second complex protocol and is
  unsafe or uneconomic onchain; or
- generated convenience wrappers that erase unknown evidence, require a live
  publisher/generator, or freeze experimental bytes into application APIs.

## Architecture arms

| Arm | Shape | Strengths | Primary failure modes | Experimental disposition |
|---|---|---|---|---|
| **A — descriptor runtime** | One generic runtime loads Type descriptors and interprets values, validation, references, Views, and queries dynamically. Contracts use a generic interpreter/helper. | Fast iteration; small number of published packages; unknown Types can be inspected; fewer generated artifacts. | Descriptor fetch becomes a dependency; weak TypeScript domain inference; runtime complexity and supply-chain surface; unbounded/adversarial work; a generic onchain schema VM; silent reinterpretation after runtime upgrades. | Keep only the closed raw/envelope/bootstrap subset as a control. Stop any open onchain interpreter lane. |
| **B — exact generation** | Every exact Type produces standalone TypeScript and Solidity DTOs/codecs/validators/readers/docs/vectors. Runtime is minimal or absent. | Excellent ergonomics; compile-time selection; small auditable Solidity leaves; deterministic per-Type behavior. | Artifact explosion; unknown evidence is easily lost; generated code may become historic decode dependency; coordinated updates across languages; package identity may be mistaken for Type identity. | Use as the generation control and the default Solidity semantic path. It is insufficient alone for archival/raw handling. |
| **C — raw runtime plus exact façades** | A small offchain evidence runtime preserves raw bytes, result axes, capabilities, source injection, and reconstruction. A deterministic compiler emits exact standalone façades. Solidity uses generated leaves over narrow Core interfaces; generic onchain behavior is structural only. | Strong known-Type DX and safe unknown forwarding; replaceable transports/tooling; offline reconstruction; compile-time Solidity semantics; generated code can be removed without losing evidence. | More seams to specify; runtime/generated-version skew; bootstrap profile must stay closed; facade/runtime package boundaries can become too granular. | **Recommended disposable path.** Falsify it against A and B using one shared fixture, not three product implementations. |

## Recommendation

Run arm C as the working experiment with these constitutional constraints:

1. Raw canonical evidence remains the identity/signature source and survives
   every decode and transport path.
2. Generated outputs are deterministic consumer artifacts, not Type authority.
3. The offchain runtime interprets only a closed, versioned bootstrap/profile
   surface needed for identity, bounds, preservation, results, and explicit
   descriptor dispatch. Exact domain semantics live in pinned generated code
   or an explicitly selected exact adapter.
4. Onchain semantic decisions use exact generated `internal` code. A generic
   probe verifies only bounded envelope/status commitments.
5. A deployed helper is optional, stateless, directly code-hash-pinned,
   finite-dependency/basis-qualified, reproducible, and never required for
   correctness, authorization, completeness, or absence.

This recommendation is deliberately reversible. One fixture can be compiled
or interpreted through all three arms while Core bytes and module layout remain
experimental.

## Generate, interpret, compile, or call

| Concern | Generated artifact | Offchain runtime | Compiled into a consumer contract | Optional deployed helper |
|---|---|---|---|---|
| Exact Type DTO/domain model | TypeScript interfaces/types, builders, projection functions | Stores generic raw/view envelopes only | Solidity structs for the selected exact Type | Never |
| Canonical codec | Exact Type encoder/decoder and conformance vectors | Closed primitives, dispatch, raw preservation; no identity from reserialized partial views | `internal pure` exact leaf functions with explicit bounds | Only repeated primitive/structural work after measurement; local validation remains |
| Validation | Exact structural/profile validator, diagnostics, reference extractor, bound estimator | Runs selected validator; reports unsupported grades | Bounded deterministic checks needed by that contract | May accelerate deterministic checks; cannot define validity |
| Docs and examples | Human docs, JSON/schema-like editor metadata, NatSpec, example vectors | Manifest inspection | NatSpec/constants | Never authoritative |
| Core reads | Generated exact wrappers over a narrow capability interface | Source injection, batching, basis/outcome normalization, reconciliation | Generated interface adapter plus explicit result decoding | Structural read/proof optimization only |
| Query/View | Exact operation DTOs, page/result types, coverage requirements | Executes and reconciles named finite operations | Only adopted bounded contract Views/queries | Only if exact query tuple and limits are pinned |
| Record/write planning | Typed input builder, deterministic plan renderer, signable digest adapter | Role separation, simulation, transport, receipts, read-back | Exact bounded write adapter where a contract is the caller | No signer, mutable policy, admission authority, or write helper in the default lane |
| Unknown Type/evidence | Generic inspection metadata only | Retain/export/relay exact raw bytes and unsupported reason | Return structural `UNSUPPORTED`; do not interpret | Cannot upgrade unsupported to understood |
| Reconstruction | Generated optional conveniences | Closure import/export, replay, basis and availability ledger | Not a contract responsibility | Never required |

## Logical module boundaries

Names below describe responsibilities, not frozen npm packages.

| Logical module | Owns | Must not own |
|---|---|---|
| **model** | Opaque exact identifiers, commitments, descriptor references, Realm/basis/currentness/coverage values, result axes, capability contracts | RPC, wallet, cache, codec implementation, “latest” resolution |
| **codec** | Pure byte primitives, canonical profile dispatch, raw-preserving decoded envelopes, strict limits, deterministic diagnostics | Network fetch, Type catalogs, mutable registry, application DTO policy |
| **type compiler** | Normalize exact input closure; generate TS/Solidity/docs/vectors/manifests; cost/bound and compatibility reports | Online authority, implicit dependency resolution, permanent ID allocation under an unfrozen profile |
| **validation** | Portable deterministic validation grades and diagnostics; exact validator capability negotiation | Arbitrary callbacks, hidden network reads, admission policy |
| **client/reconstruct** | Exact reads, bounded pages, reconciliation, offline replay, qualified caches, export/import | Wallet authority, product UI, hosted infrastructure, indexer truth |
| **consumer adapter/codegen** | Compile a finite exact-Type/profile closure into the common lossless semantic envelope, exhaustive outcomes, evidence handles and consumer-specific generated DTO façades for Web Client/OS, Data Explorer and other products | Product navigation/view state, UI policy, a universal lowest-common-denominator DTO, or reinterpretation of raw evidence |
| **actions** | Deterministic plans, role-separated authorization, simulation, submission evidence, observation and canonical read-back | Ambient signer, silent retries across changed plans, admission/authorship conflation |
| **transport adapters** | Core/EVM RPC, retained archive, HTTP gateway, local state, optional indexer, optional EAS carrier | Semantic truth, default policy, absence inference |
| **ethereum adapter** | Literal ABI inference, chain/Realm context, public client, wallet/signing adapter, receipts and reorg/finality observation | EFS Type meaning, global chain selection, mandatory viem runtime |
| **Solidity source set** | Generated internal libraries, narrow interfaces, result structs, constants, fixtures, reproducible compiler packet | Deployed mutable registry, upgrade authority, generic schema VM |
| **testkit/conformance** | Golden/adversarial vectors, independent implementations, fake sources, mutation/property/fuzz harnesses, workload measurements | A substitute for an adopted conformance specification |

Infrastructure—keys, RPC fleets, relayers, pinning, indexer operation, servers,
databases, monitoring, and gateways—uses SDK capabilities but does not live
inside the protocol SDK contract.

### First-party product and confined-app consumption altitudes

The common lossless semantic adapter sits below two independently owned
first-party products and the confined-app surface:

- **Web Client/OS** owns the direct Files/shell route. Its guest path composes
  protocol/generated and Files/artifact SDKs with a Web/Files generated façade
  and does not boot Data Explorer or the OS capability broker.
- **Data Explorer** owns the independent general typed-data workbench. It
  composes the same protocol/raw/outcome/query/evidence contract with an
  Explorer-specific façade and uses Files/artifact services only for its Files
  vertical. It is not a File Browser panel and does not create a second
  resolver, verifier or semantic result law.
- **Confined applications** use the thin OS App SDK above a private Kernel
  provider SPI and never receive raw signers, secrets, effective grants,
  provider selection, or a Kernel object.

Product façades and reducers may differ; the common outer outcome discriminant,
raw bytes, identity, authority, basis, currentness, coverage, byte
locator/range/commitment and verification outcome, exact action-plan
commitment/roles/authorization basis, effect receipt and qualified effect
outcome may not. The exact point-in-time Data Explorer input is local-only
planning commit
`0486502f7264ee49d0598fb306cecb43dd6d0b8f` on
`codex/data-explorer-pm`. The focused cross-product pressure review,
runtime-neutral capability lifecycle, public/private split, and open
streaming/subscription falsifiers are in [[web-client-os-boundary-pressure]].
These are coordination inputs, not adopted SDK, Web Client or Explorer APIs.

## Package topology candidates

### P1 — two public packages

`@efs/sdk` and `@efs/solidity`, resembling the historical repository.

- **Pro:** simple discovery, fewer dependency/version combinations.
- **Con:** browser guests can inherit writer/indexer baggage; logical seams are
  easy to violate; unrelated changes move one version; generated artifacts
  have no clear distribution boundary.

### P2 — capability modules with a deliberately small public release set

Develop and test logical modules separately, then publish only the boundaries
that measurements justify. A candidate release might consolidate `model +
codec + client` into one zero-wallet runtime, keep Ethereum/actions optional,
ship the compiler as development tooling, and distribute Solidity sources and
vectors separately.

- **Pro:** tree-shakable browser path; independently replaceable transports;
  explicit authority seams; generated code does not pull a compiler into
  production.
- **Con:** version matrices and dependency churn if every logical module
  becomes a package.
- **Recommendation:** use this topology internally for experiments. Do **not**
  freeze package count or names until bundle, upgrade, and maintenance data say
  which boundaries deserve publication.

### P3 — one generated package per Type

Publish each Type's TS/Solidity artifacts as its own language-native package.

- **Pro:** exact opt-in and conventional dependency management.
- **Con:** package explosion, abandoned namespaces, registry dependence, and a
  powerful temptation to equate package/version with Type identity.
- **Disposition:** an optional distribution output, never the sole historic
  decode path or baseline topology. A retained generation bundle must work
  without the registry.

## Compatibility and versioning policy

### Separate clocks

The SDK never folds these clocks into one semver:

1. **Protocol/profile identity** — canonical bytes, identifiers, signature
   domains, result ABI, Core behavior and limits.
2. **Type identity/revision** — exact immutable Type closure and declared
   compatibility/projection evidence.
3. **Query/View coverage** — finite operations and completeness obligations,
   versioned independently when the Core candidate requires it.
4. **Realm and contract basis** — chain/Realm, address, code/implementation
   identity, observation block/finality, admission/policy version.
5. **Generator artifact identity** — input closure, generator/plugins,
   language/compiler/settings, outputs and hashes.
6. **Runtime distribution version** — npm/Solidity package/API evolution for
   consumers; replaceable without changing old evidence.

### Rules

- Durable inputs pin exact identities. `latest`, ranges, registry aliases, and
  human catalog names are discovery conveniences that resolve to a recorded
  exact selection before any identity, signature, authorization, write, or
  conformance claim.
- Unknown required protocol/result/Type/limits/feature behavior returns
  `UNSUPPORTED`; state-changing operations fail closed before authorization.
- An unknown optional feature may be ignored only when its absence cannot
  affect canonical bytes, identity, validation, authority, result status,
  completeness, currentness, or safety bounds.
- Type compatibility is directional and multi-axis. The producer's claim is
  evidence; the consumer declares which exact mapping it accepts.
- Generated output binds the full source closure and toolchain. A canonical
  release manifest names the normalized artifact set that must rebuild
  byte-for-byte—such as generated source, schemas/ABIs, vectors, normalized
  docs, compiler inputs/outputs and content manifests—and the normalization of
  paths, timestamps, archive order and metadata. Non-deterministic presentation
  artifacts are explicitly outside that set and cannot carry identity or
  conformance. Clean-room regeneration of the normalized set is a release gate.
- Runtime semver communicates source/API compatibility only. It never changes
  the meaning of a protocol profile or Type and never authorizes a new one.
- A helper capability tuple includes at least chain/Realm, address, direct
  code hash, result ABI commitment, semantic/limits commitment, supported
  feature set, exact Type set or structural-only declaration, finite dependency
  declaration, and required dependency/basis identity. A pinned helper code
  hash alone does not pin mutable contracts or block context it reads.

## Result and error model

### Expected evidence states are values

The cross-language model has exhaustive expected outcomes. The exact syntax is
not frozen; the required distinctions are:

```text
ResourceOutcome<T> =
  PRESENT    { value, raw, identity, authority, basis, coverage, validation, bytes }
  PARTIAL    { known, raw?, missing, basis, coverage, reason }
  UNKNOWN    { subject, attemptedBasis, reason, rawEvidence?, retryability? }
  ABSENT     { subject, completeNegativeBasis, coverage }
  MASKED     { subject, explicitPolicy, basis }
  CONFLICT   { candidates, policy, basis }
  INVALID    { raw?, diagnostics, basis }
  UNSUPPORTED{ subject, requiredCapability, observedCapability?, rawEvidence? }
```

`UNKNOWN` with no raw evidence means the subject could not be observed under
the attempted basis. Located but opaque/unrecognized evidence normally returns
`UNSUPPORTED` with its immutable raw envelope; partial or invalid evidence
retains raw bytes whenever they were actually obtained. All evidence-bearing
outcomes remain byte-for-byte relayable without semantic success.

Byte availability is a separate outcome such as verified present,
unavailable, commitment mismatch/tampered, unsupported locator, policy-blocked,
or unknown. A resource may be present while its payload bytes are unavailable.
Plan generation similarly distinguishes ready, needs authority, needs funds,
needs bytes, conflict, unsupported, invalid, and unknown.

Effect completion has its own per-effect receipt algebra. Illustrative
discriminants are `EFFECT_COMMITTED { basis, evidence }`,
`EFFECT_NOT_COMMITTED { completeBasis, evidence }`,
`EFFECT_UNKNOWN { attemptedBasis, reason, recovery? }`, and
`EFFECT_REJECTED { reason, evidence }`. A multi-effect action carries one entry
per effect. Transport loss, cancellation or revocation races never coerce
`EFFECT_UNKNOWN` into committed or not committed.

Only a complete exact negative basis permits `ABSENT`. A protocol negative
cache may contain that exact absence or a `MASKED` result backed by a retained
selected whiteout/policy and scope; it preserves the discriminant and never
turns a local presentation mask into protocol absence. `UNKNOWN`, `PARTIAL`,
timeout, revert, RPC error, cache miss, indexer omission, unsupported profile,
missing helper, or unavailable bytes never feed a negative cache.

### Exceptions are faults

Language exceptions/reverts are reserved for programmer misuse, violated local
preconditions, cancellation, resource exhaustion beyond an accepted bound, or
an internal invariant failure. TypeScript faults carry a stable code, safe
structured details, and cause without requiring message parsing. Solidity uses
custom errors for local preconditions but never treats bubbled/forged error
bytes as proof-bearing read results.

Transport and provider failures are captured in the evidence outcome when the
caller asked a read/reconstruction question. A low-level adapter may throw;
the boundary responsible for the qualified EFS result must not accidentally
turn it into absence, false, or an empty list.

## Capability and version negotiation

Negotiation is positive and operation-specific:

1. The caller supplies an exact accepted set: protocol/result ABI, operation,
   Type/descriptor or finite mapping, limits, required/optional features,
   Realm/basis policy, and helper code identity if any.
2. The provider returns explicit capabilities and the basis under which they
   apply.
3. Required major/profile/result/Type commitments match exactly unless a
   finite caller-approved mapping is named.
4. Every limit names dimension, unit, scope, enforcement actor and comparison
   direction. Processing capacity is a provider minimum; allowed bytes/cost/
   calls/time are policy maxima. Both must cover the input and accepted
   operation without reversing their inequality.
5. Unknown required features produce `UNSUPPORTED`; there is no nearest-codec
   fallback or byte sniffing.
6. ERC-165, media type, package metadata, catalog entries, or a handshake
   string can optimize discovery but cannot complete semantic acceptance.
7. Reads may fall back to another explicitly configured source while retaining
   both attempts. Writes must re-plan and re-authorize if any accepted tuple,
   calldata, cost, signer, or destination changes.

## Onchain shape

### Generated exact leaf — semantic default

For each frozen-for-experiment Type, generate only the bounded pieces a
consumer selects:

- Type/descriptor/profile/limits commitments;
- typed structs and `internal pure` canonical encode/decode functions;
- deterministic local validation and reference extraction;
- explicit byte, element, depth, loop, allocation, and external-call bounds;
- narrow Core read/write interfaces when used;
- explicit result structs/enums and custom local-precondition errors;
- NatSpec, ABI, standard JSON compiler packet, metadata, link/immutable
  references, vectors, source/output hashes, runtime/initcode sizes and gas.

### Bounded generic probe — structural only

A generic probe may return commitments, status, basis, byte commitment,
declared Type/descriptor, and a bounded detail code. `PRESENT` means the
structural claim was verified, not that arbitrary payload semantics were
validated. It performs no arbitrary dynamic-array decode, recursion,
input-dependent unbounded loop, registry-selected code, callback, or
`delegatecall`.

### Deployed helper — optional measured optimization

An experimental helper is `view`/stateless, directly deployed, normal ABI,
callable with `STATICCALL`, code-hash pinned, reproducible locally, and limited
to deterministic bounded read/verification work. It either computes solely
from caller-supplied bytes or declares a finite external-read set, exact
dependency identity requirements, proxy rejection/qualification rules, block/
Realm observation basis and a returned basis commitment. It has no proxy/
beacon/diamond of its own, mutable truth cache, currentness registry, grants,
authorization, admission, writer, callback, or ability to turn its own or a
dependency's failure into absence. The consumer verifies the declared basis
and retains a generated local correctness path.

## Security invariants

1. **Bytes before views:** identity/signature/commitment checks use exact
   canonical bytes, never reserialization of a decoded DTO.
2. **Raw survival:** unknown or partially understood evidence remains
   exportable byte-for-byte with its context.
3. **Bounded work:** attacker-controlled length, nesting, page, reference,
   decode, allocation, loop and call counts are checked before work.
4. **No ambient authority:** a read package does not touch wallets; a planner
   does not choose a signer; a signer cannot silently mutate a plan.
5. **Role separation:** author, signer/controller, relayer/submitter, payer,
   beneficiary, Realm admitter, Lens/policy author, and observer are retained.
6. **Qualified state:** Realm, code/profile, observation basis, finality,
   coverage, policy, and currentness are explicit and cache keys include them.
7. **Honest negatives:** only proved complete finite basis yields absence;
   every uncertainty remains non-negative.
8. **Indexer humility:** indexers and caches can accelerate and contradict;
   they do not create authority or completeness.
9. **No hidden code authority:** registries, schemas, catalogs, package names,
   ERC-165, EAS resolvers, helpers, and proxies never silently select semantics.
10. **Fail-closed negotiation:** unknown required behavior blocks semantic or
    state-changing use without a new explicit selection and authorization.
11. **Reproducible release:** source closure, toolchain, generated output,
    vectors, compiler configuration and hashes are retained; no live registry
    is required to verify or reconstruct.
12. **Secrets stay outside:** codecs, generated artifacts, logs, diagnostics,
    fixtures, caches, and export bundles never capture ambient keys or grants.
13. **Operation-bound consent:** a signature authorizes one exact inspected
    plan/effect set; discovery and shared configuration carry no authority.
14. **Replaceable transport:** loss or corruption of one RPC, gateway,
    publisher, indexer, helper, package registry, or runtime does not change
    EFS truth and is visible in results.

## Core requirements surfaced by the SDK

The SDK does not decide these mechanisms. It requires Core candidates to
provide enough exact contract for:

- stable protocol/profile and contract capability identification;
- exact Type/Record/Occurrence/Realm/admission/Binding/Lens commitments;
- bounded reads and declared limits before allocation or iteration;
- a result ABI that distinguishes absence, partial, unknown, invalid,
  unsupported and conflict where those states are possible;
- page/basis/coverage evidence adequate to support honest completeness;
- historical authority and implementation basis without retroactive
  reinterpretation;
- operation-bound write plans and deterministic read-back; and
- complete archive closure and independent reconstruction.

A requested Core change requires a multi-consumer failing fixture, the smallest
missing semantic, an exact falsifier, and evidence that an SDK/Realm/Lens/
adapter solution cannot preserve truth. SDK convenience alone is insufficient.

## Open questions

- [ ] Does the hybrid bootstrap runtime remain closed and small across the full
  Type/Files/Git/Nanda fixture set, or does it grow into a second schema VM?
- [ ] Which logical boundaries earn separate public packages after guest
  bundle, server, upgrade, and century-preservation measurement?
- [ ] Which exact outcome axes and detail codes belong in the Core/Solidity ABI?
- [ ] Can the required onchain Type/View workloads fit generated leaves with
  comfortable code/gas headroom and no helper?
- [ ] If a helper wins, which immutable capability tuple and local fallback are
  sufficient to keep it non-authoritative?
- [ ] Which protocol and Type compatibility claims can be mechanically proved,
  and which remain signed human/owner-reviewed evidence?

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed (no surprise repos at implementation time)
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment
