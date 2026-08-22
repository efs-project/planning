# EFS v2 SDK PM charter

**Status:** draft — founder-authorized working charter; promotion and repo/release choices remain gated
**Target repos:** planning, sdk, contracts, client
**Depends on:** [[README]], [[architecture-candidate]], [[../efsv2/README]], [[../web-client-os/README]]
**Last touched:** 2026-08-22

#status/draft #kind/design #repo/planning #repo/sdk #repo/contracts #repo/client #topic/efsv2 #topic/onchain #topic/read-path

## Mission

The EFS v2 SDK PM owns the developer experience and implementation program for
two coordinated, independently useful surfaces:

1. an offchain TypeScript SDK for applications, browsers, servers, agents,
   indexers, archives, and tooling; and
2. onchain Solidity SDK artifacts for contract developers, including generated
   compile-in sources and, only when evidence justifies them, reusable deployed
   read helpers.

The mission is to make exact EFS evidence pleasant to use without turning SDK
convenience, hosted infrastructure, generated code, or deployed helpers into
protocol authority. The preservation horizon is a century / 100 years: data,
proofs, manifests, vectors, and reconstruction contracts must outlive any
particular language, package manager, chain provider, compiler, or maintainer.

## Success definition

The SDK program succeeds when an independent developer can:

- start from retained EFS evidence and exact profile/type inputs;
- regenerate or replace the SDK implementation without changing meaning;
- build a wallet-free direct reader, an honest indexer, a structured agent
  tool, a write planner, or a bounded Solidity consumer;
- distinguish every material uncertainty and authority/basis boundary;
- reconstruct and verify historic state without the original publisher,
  package registry, hosted indexer, or SDK team; and
- upgrade application ergonomics without silently upgrading protocol truth.

Shipping an npm package, generated wrapper, or helper contract is not itself
success.

## What the SDK PM owns

| Area | Ownership |
|---|---|
| Developer journeys | End-to-end define, evolve, generate, construct, validate, plan, sign, publish, admit, read, query, resolve, reconstruct, inspect, and contract-consume experiences |
| Logical SDK architecture | Module responsibilities, dependency direction, capability injection, raw/view boundary, environment profiles, and adapter seams |
| Type compiler and code generation | Input/output contract, deterministic generation, TS/Solidity/docs/vectors/bounds, manifests, compatibility reports, plugin policy, and clean-room regeneration |
| Offchain public ergonomics | Candidate builders, readers, actions, result/fault model, pagination, batching, cancellation, streaming, caching contract, and browser/server/agent affordances |
| Onchain SDK ergonomics | Generated internal libraries, narrow interfaces, explicit result structs, bounded work, reproducible compiler packets, and helper evaluation |
| Compatibility tooling | Separate protocol, Type, query/View, generated-source, runtime, Realm/contract, and operational compatibility reports |
| Conformance and security evidence | Golden/adversarial vectors, property/fuzz suites, independent implementations, workload corpus, supply-chain/reproducibility checks, and stop conditions |
| Release program | Experimental profile stamps, artifact manifests, deprecation/support windows, archive/export closure, and release-readiness packet after Core freeze |
| Core pressure packets | Smallest missing semantic, affected consumers, failing fixture, measured impact, alternatives, falsifier, and requested Core decision |

## What the SDK PM does not own

- Canonical Core truth, Type semantics, bytes, IDs, signature domains,
  validator meaning, indexes, admission rules, Lens grammar, Principal or
  authority mechanisms, Realm qualification, finality, or contract deployment.
- Product UI, routing, Shell/OS policy, design language, wallet UX, or direct
  Files product scope. Those belong to the Web Client/OS PM; the SDK supplies
  capabilities and honest results.
- Web Client/OS direct Files/shell product UX or Data Explorer's independent
  general typed-data workspace, navigation, views, projections, Inspector,
  local policy, editorial choices, hosted indexer operation, or claims that
  derived data is complete. The SDK supplies the common lossless semantic
  adapter and consumer-facing generation seams; it does not own either
  product.
- Keys, accounts, RPC fleets, relayers, gateways, pinning services, databases,
  monitoring, agent mandates, or other infrastructure authority.
- Owner adoption, design promotion, permanent publication, deployment,
  migration promise, or mainnet/Commons selection.

## Coordination contracts

| Counterpart | SDK provides | Counterpart decides | Shared gate |
|---|---|---|---|
| EFS v2 Core/contracts architecture | Developer traces, exact ABI/result/limit needs, generated-code measurements, conformance vectors, minimal pressure packets | Protocol semantics, canonical bytes/IDs, contract/module boundary, indexes, admission/authority, deployment and upgrade rules | One cross-language freeze bundle; no SDK conformance claim before it passes |
| Contracts implementation | Generated-source specification, consumer fixtures, compiler/reproducibility packet, gas/size/fuzz matrix | Actual Core interfaces/implementation and security review | ABI/vector/code identity parity in both repositories |
| Web Client/OS PM | Common lossless adapter plus wallet-free Reader/Files façades, route-shaped imports, qualified pages, verified bytes, raw export, action plans/receipts, and environment/bundle measurements | Direct Files/shell UX, boot/module architecture, policy UX and OS capabilities | Direct Files/shell remains useful without Data Explorer, wallet, indexer or OS boot; it does not fork semantic resolution or turn omission into absence/completeness |
| Data Explorer PM | Common lossless adapter plus exact-ID/location/query façades, raw/evidence handles, qualified pages/cursors, verified bytes, action bindings, usability fixtures and generated Explorer DTO seams | Independent general typed-data product: workspace, navigation, selection, table/graph/raw/provenance views, Inspector, local policy and product presentation | Same outer discriminants, raw bytes, identity, authority, basis/currentness/coverage, byte-verification evidence, exact plan commitments/roles/authorization, receipts and qualified effect outcomes as Web/other SDK consumers; Explorer remains useful beyond Files without becoming a second resolver or SDK debugger |
| Type authors | Compiler, lint, compatibility/bound report, generated artifacts, vectors and docs | Application semantics and proposed Type evolution | Core/Realm limits and owner freeze still govern admission/index promises |
| Application/agent teams | Stable candidate façades, raw escape hatch, structured capabilities/plans/outcomes, testkit | Product policy, explicit sources, risk bearer, granted authority | No ambient authority or hidden fallback |

The SDK PM remains independent enough to reject a product shortcut or contract
helper that collapses truth, and collaborative enough to change ergonomics
when Core evidence falsifies the current candidate.

## Authority and evidence discipline

Every durable SDK claim records:

| Field | Meaning |
|---|---|
| Source | Exact owner ruling, promoted spec/ADR, current candidate, experiment result, or historical evidence |
| Standing | Owner-ratified outcome, owner-directed product baseline, candidate, recommendation, unknown, or rejected/superseded evidence |
| Layer | Core, Realm, Lens/policy, SDK/runtime, generated adapter, transport/infrastructure, or product |
| Falsifier | The fixture/measurement that would overturn the claim or force escalation |
| Freeze effect | Whether it can affect protocol bytes, public API, generated output, deployment, or only an experiment |

The instantiated Data Explorer coordination input is the exact local-only
planning commit `0486502f7264ee49d0598fb306cecb43dd6d0b8f` on
`codex/data-explorer-pm`, particularly `Designs/data-explorer/README.md` and its
ownership table. It is a point-in-time `#status/draft` input, not a merged,
remote-visible, promoted, or protocol-authoritative dependency. If that branch
moves, this charter continues to mean the cited commit until explicitly
reconciled again.

Source precedence follows [[../efsv2/system-constitution]]. A local compiler
fixture, passing test suite, v1 ADR, EAS behavior, popular library, or deployed
helper never outranks owner-ratified EFS v2 direction.

## Working program

### Phase 0 — research and reversible design

- Maintain this source spine and official-source precedent ledger.
- Map complete developer journeys and threat/basis boundaries.
- Compare architecture arms with disposable artifacts.
- Publish no permanent API, Type ID, conformance mark, or deployed helper.

### Phase 1 — disposable conformance laboratory

- One retained fixture closure across two independent offchain encoders and
  TypeScript/Solidity consumers.
- Raw/unknown, result/basis/completeness, reconstruction, action-plan, bundle,
  code-size/gas, fuzz, and helper bakeoffs in [[experiment-program]].
- Every artifact stamped `EXPERIMENTAL`, exact profile/commit, and destruction
  conditions; no application treats it as permanent data.

### Phase 2 — freeze support

- Convert passing experiments into an owner-reviewable SDK/Core freeze packet:
  exact bytes and vectors, capability/result ABI, limits, compatibility rules,
  security review, independent implementation, reconstruction proof, and
  cross-repo impact.
- Close only owner-sized choices that evidence cannot settle.

### Phase 3 — production implementation

- Begins only after the stop conditions in [[experiment-program]] clear and the
  relevant protocol/design promotion ceremony completes.
- Use test-driven implementation against the accepted vectors and threat
  corpus; release the smallest useful public topology first.
- No default deployed helper unless its measured lane separately clears.

### Phase 4 — release and long-horizon maintenance

- Exact release manifests, reproducible artifacts, archival source closure,
  signed provenance, support matrix, downgrade/exit instructions, and
  independently usable conformance suites.
- Deprecation removes convenience or support, never the ability to interpret
  retained exact evidence through archived specs/vectors/source.
- Periodic replacement drills assume npm, GitHub, hosted docs, default RPC,
  indexer, publisher, and current maintainers are unavailable.

## Release classes

| Class | Meaning | Allowed claims |
|---|---|---|
| Fixture | Disposable evidence for one experiment profile | Only the exact measured result; no compatibility or conformance claim |
| Experimental SDK | Usable against an explicitly named unfrozen prototype | Exact-profile behavior and limitations; no permanent IDs/API promise |
| Candidate conformance implementation | Independently passes an owner-reviewed freeze candidate and adversarial corpus | Candidate conformance only; deployment/release still gated |
| Production SDK | Released against promoted/frozen specifications with archived reproducibility and support policy | Exact named profile/Type/Realm capabilities; never universal future compatibility |
| Historical/archived | No active maintenance guarantee but complete source/spec/vector/rebuild closure retained | Honest historical decode/reconstruction scope |

An individual SDK release may declare a deliberately shorter **active
maintenance** window. That operational promise is not the protocol or evidence
preservation horizon: before maintenance ends, the release still needs an
archived source/spec/vector/rebuild closure and a replacement path sufficient
for the century contract. A package deprecation date can end support work; it
cannot end the ability to verify, decode, reconstruct, or independently
reimplement retained EFS evidence.

## Public API discipline

- Design language-neutral result and evidence contracts before TypeScript
  method names.
- Keep logical module boundaries sharper than the eventual package topology;
  do not make every internal seam a public package.
- Minimize public nominal classes and inheritance. Prefer immutable plain data,
  explicit capabilities, pure functions, and language-native generated types.
- Expose raw evidence and manifests without importing a product UI or writer.
- Keep transports and wallet/signing adapters optional and injected.
- Stabilize only after two independent consumers, one clean-room implementer,
  and the hostile fixture corpus use the surface.
- Treat every exported convenience default as a policy decision requiring a
  named source, safe failure mode, and explicit escape hatch.

## Review and escalation

The SDK PM can decide reversible tooling and experiment details within this
charter. Escalate when work would:

- choose protocol bytes/IDs/limits/semantics or a Core module/ABI;
- publish a permanent package/API/conformance identity;
- deploy a helper or make one part of correctness;
- establish an authority, admission, completeness, migration, or compatibility
  promise;
- introduce a mandatory service/registry/indexer/wallet/Commons dependency; or
- change Web Client/OS or Data Explorer product policy.

A Core escalation packet includes affected journeys, raw fixture, expected and
actual qualified outcomes, measurements, smallest missing semantic, SDK/Realm/
Lens alternatives tried, security/permanence cost, and an exact falsifier.

## Open questions

- [ ] Which public release topology remains comprehensible and maintainable
  after real browser/server/contract measurements?
- [ ] What minimum independent-implementation and audit quorum is required for
  the first production conformance claim?
- [ ] Which artifact/provenance signing and archival mechanism can be adopted
  without making one registry or organization the availability root?
- [ ] What explicit active-maintenance window and replacement drill cadence is
  appropriate beneath the non-negotiable 100-year preservation horizon?

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed (no surprise repos at implementation time)
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment
