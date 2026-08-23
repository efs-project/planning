# EFS v2 SDK developer journeys

**Status:** draft — candidate experience contract; names and mechanics remain replaceable
**Target repos:** planning, sdk, contracts, client
**Depends on:** [[README]], [[ethereum-standards-census]], [[../efsv2/system-constitution]], [[../efsv2/layered-type-system-and-data-abi]], [[../web-client-os/type-data-abi-boundary-pressure]]
**Reviewers:** @local-authority (2026-08-22)
**Last touched:** 2026-08-22

#status/draft #kind/design #repo/planning #repo/sdk #repo/contracts #repo/client #topic/efsv2 #topic/read-path #topic/onchain

## Problem

EFS needs an SDK experience that is friendly for an ordinary application and
still honest enough for contracts, agents, indexers, archivists, and future
implementations. A method that returns a convenient value but loses exact
bytes, authority, observation basis, completeness, currentness, or an unknown
state is not a successful developer experience.

This document specifies journeys and invariants, not frozen method names. Terms
such as `TypeRevision`, `PreparedRecord`, `ReadContext`, `ActionPlan`, and
`ResourceOutcome` are illustrative candidate vocabulary.

## Cross-cutting experience contract

Every supported journey follows five rules:

1. **Select explicitly.** Name the Realm, protocol profile, exact Type or
   finite accepted set, limits, query/profile coverage, and policy needed for
   the operation. Durable APIs do not silently select `latest`.
2. **Preserve evidence.** Retain canonical bytes and commitments beside any
   decoded view. A caller can inspect, export, and forward an unknown object
   without pretending to understand it.
3. **Qualify results.** Return data, authority, basis, completeness,
   currentness, validation, and byte availability as separate facts.
4. **Plan before authority.** Reads are wallet-free. Writes produce an
   inspectable deterministic plan before requesting signatures, funds,
   admission, or network submission.
5. **Read back canonically.** Success means the expected effect is observable
   from the named Realm/basis; a transaction receipt alone is not the final
   product result.

## Journey map

| Journey | Candidate SDK experience | Non-loss invariant |
|---|---|---|
| Define a Type | Author a bounded descriptor closure; lint semantic commitments, logical shape, representation, references, declared indexes, Views and QueryProfiles; estimate generated and onchain cost. | The tool distinguishes candidate profile assumptions from adopted Core rules and never allocates a permanent ID under an unfrozen profile. |
| Evolve a Type | Compare old and new closures; classify semantic, canonical-byte, generated-source, query-coverage, validator, and operational compatibility directionally; require an explicit successor or mapping claim. | An optional/additive-looking edit never silently mutates old Type meaning or proves bidirectional compatibility. |
| Generate artifacts | From one exact retained input closure, emit TypeScript DTOs/builders/codecs/validators/reference extractors/docs/vectors, Solidity structs/internal libraries/interfaces/NatSpec/vectors, compatibility and bound reports, and a reproducibility manifest. | Output is deterministic, offline-regenerable, and names source closure plus generator/runtime/compiler identities and hashes. Package names are distribution metadata, not Type identity. |
| Select an Ethereum environment | Explicitly select an EIP-1193 provider or non-wallet read source; compare observed chain, fork, RPC, system-contract, precompile and history capabilities with the accepted operation profile; retain disagreements and lifecycle events. | Provider name/RDNS, chain ID, `eth_config`, wallet label and “EVM compatible” never substitute for exact accepted capabilities. Chain/account/provider change invalidates the plan and basis-sensitive cache. |
| Construct a Record | Use an exact generated builder or a lower-level raw API; validate bounded shape; encode canonical bytes; preview commitments/IDs under the selected experimental profile. | The result carries raw bytes, exact Type/profile, diagnostics, and limits. A decoded DTO cannot replace the bytes used for identity or signature. |
| Author and sign | Produce a deterministic EIP-712 plan naming semantic author, actual signer/controller, signature strategy/domain, payload/calldata/effect commitments, expected identifiers, nonce, expiry/replay policy and human/agent-readable effects; optionally derive a context-bound ERC-7730 clear-signing descriptor. | Author, signer, submitter/relayer, payer, beneficiary, and Realm admitter remain distinct roles. A clear-signing descriptor is presentation, not authority. No ambient wallet selection or raw app-requested EIP-7702 authorization. |
| Verify a plan signature | Select a basis-aware EOA, ERC-1271, non-persistent ERC-6492, ERC-7913 or P-256 strategy over the exact EFS plan/message digest and return a signature-verification receipt. | Empty/present code and simulated magic-value success never permanently classify the account or create EFS Principal authority. Raw signature bytes are not plan identity or a replay key. |
| Authorize account submission | Separately build and inspect the transaction/calls, ERC-4337 `userOpHash`, EIP-7702 authorization tuple or other account-specific commitment and bind it to the unchanged EFS plan/effects. | Wallet, bundler, paymaster or delegation acceptance does not verify the EFS EIP-712 digest and is not EFS authorship, admission or canonical effect success. |
| Publish | Simulate the unchanged plan, request clear signing/authorization, submit through an injected EIP-2718 transaction or EIP-5792/account adapter, preserve per-layer receipts, wait for selected observation/finality, and perform canonical read-back. | “Simulated,” “wallet accepted,” “bundler accepted,” “submitted,” “included,” “authored,” “admitted,” and “currently selected” are separate outcomes. |
| Admit to a Realm | Evaluate or submit the Realm's explicit admission operation; return the admission receipt, policy/version, actual authority basis, and any compare-and-swap precondition. | Realm admission does not retroactively create authorship, Type validity, global truth, or cross-Realm currentness. |
| Read by exact identity | Read an exact object from Core or a qualified source; verify commitment/bytes; decode only under an accepted exact Type/profile; return raw plus view and evidence. | Unavailable or tampered bytes, unsupported profile, invalid value, and proved absence remain different results. |
| Query by Type/field/reference | Execute an exact QueryProfile or named bounded query against Core, an indexer, or a reconstructed local source; page under a pinned basis and coverage claim. | An indexer/cache is acceleration evidence only. A missing or incomplete page cannot become `ABSENT` or `COMPLETE`. |
| Work with Bindings | Enumerate or point-read a declared Binding scope; preserve history/currentness basis, compare-and-swap state, withdrawals, conflicts, and completeness. | “No current binding” requires a proved complete scope/basis; it is not inferred from a timeout or cache miss. |
| Resolve through a Lens | Supply the exact Lens/ResolutionPlan, risk-bearer policy, bounded Principal set, purpose, Type/View requirements, conflict rule, and basis; inspect all candidate evidence and the chosen result. | The Lens is explicit policy over evidence, not hidden universal truth. Unsupported policy and incomplete candidates remain visible. |
| Preserve unknown data | Parse only the closed envelope/header needed to identify and bound evidence; retain the full original bytes and unknown sections; permit export/relay without semantic success. | Unknown is neither invalid nor empty. Re-encoding a partial decoded object never substitutes for original bytes. |
| Reconstruct offline | Load a retained closure containing protocol/profile descriptors, Types, Records, Occurrences, admissions, Bindings/Lens evidence, locators, vectors, and observation/finality basis; replay deterministically. | Reconstruction makes zero mutable network requests and names any unavailable bytes or incomplete history instead of inventing them. |
| Build a guest browser reader | Inject a public read source and pinned link context; fetch only route-required Core/Files bytes; lazy-load generated views; offer raw/unsupported outcomes. | Useful reading does not require wallet detection, account/profile hydration, Commons, hosted EFS indexer, package manager, or OS boot. |
| Build the independent general typed-data Explorer | Consume the common lossless semantic adapter for explicit EFS locations, exact IDs and bounded queries; generate Explorer-specific DTOs/evidence handles for workspace, table, graph, provenance and raw views; use Files/artifact services only when the selected resource needs them. | Data Explorer owns navigation, views, selection, Inspector and local product policy; Web Client/OS separately owns direct Files/shell. Neither product imports Type/Data-ABI machinery, recomputes identity, selects hidden providers, or forks the SDK's raw/outcome/basis law. |
| Build a confined OS app | Consume generated semantic capabilities for scoped read/action/storage/network/picker/agent operations with budgets, progress, cancellation and receipts. | The app receives no raw signer, secret, effective-grant graph, Kernel object, ambient service, or hidden provider-selection authority. |
| Build a server/indexer | Stream bounded pages, verify and retain raw evidence, materialize derived projections, record source/basis/coverage, expose exact operations, and reconcile with direct Core reads. | Derived storage is replaceable and never becomes EFS authority. Reorg, omission, and stale coverage are explicit. |
| Build an agent tool | Expose structured capabilities, plans, costs, risks, receipts, and outcomes; require the same operation-bound authority as a human path; support deterministic dry-run and replay. | An agent receives no ambient signer, wallet, filesystem, network, or policy authority, and never gets a second less-honest result model. |
| Consume from Solidity | Pin protocol/result ABI, Type/descriptor, limits and required features; import a generated `internal` leaf library; call a bounded Core interface/probe; locally validate typed bytes/result evidence. | A capability probe, helper, registry, revert payload, or successful call cannot by itself prove semantic validity, completeness, or authority. |
| Write from Solidity | Build or accept exact bounded inputs; validate locally; call the selected Core write ABI; verify role/domain/replay conditions; consume explicit results/events under the selected basis. | Generated code does not hide `msg.sender`, author/controller, payer, admitter, or external-call effects. V1 compile-in assumptions do not automatically apply. |
| Deploy or verify a helper | Build from exact compiler inputs; recompute initcode/address; verify factory, runtime code, dependencies and basis; retain a local generated fallback. | CREATE2 address, registry entry, code presence or proxy slot is not helper identity or authority. Removing the helper cannot change correctness or reconstruction. |

## Journey details

### 1. Type definition and evolution

The authoring tool opens in an **experimental profile**, not “EFS v2 latest.”
The creator declares bounded fields, reference semantics, cardinality/depth and
size limits, automatic index requests, contract-facing Views, query coverage,
and portable validator requirements. The compiler produces:

- a normalized human-readable descriptor;
- provisional identity inputs and a warning that the active profile is not
  frozen;
- upper-bound reports for encoded size, decode work, reference extraction,
  indexes, query pages, generated code, and Solidity loops;
- a compatibility diff against named prior Types; and
- the exact closure required to regenerate every artifact offline.

Evolution is new immutable evidence, never in-place reinterpretation. The diff
uses separate answers such as “old readers preserve but do not understand new
bytes,” “new readers can project old values,” “canonical bytes differ,” “query
coverage changed,” and “this contract View is not supported.” A single green
compatibility badge is prohibited.

### 2. Generation and consumption

Generation has two layers:

1. a **closed bootstrap/meta-profile implementation** capable of parsing,
   bounding, identifying, and preserving Type descriptors; and
2. **exact Type outputs** that provide pleasant domain APIs without requiring
   the descriptor model at application runtime.

Every output bundle contains a manifest with source closure commitments,
experimental protocol profile, generator identity, target language/runtime,
format and compiler settings, outputs and hashes, bound report, conformance
vectors, and license/provenance. Generated code embeds no mutable URL and
performs no generation-time network request unless the exact response is
retained as an input artifact.

### 3. Read context

A read context is assembled from explicit capabilities rather than a global
singleton:

```text
ReadContext = {
  realm,
  protocolProfile,
  acceptedEvmProfile,
  observedRpcCapabilities,
  acceptedTypes,
  acceptedLimits,
  basisPolicy,
  coveragePolicy,
  readSource,
  byteSources,
  optionalIndexer,
  optionalCache,
  optionalLens
}
```

This is illustrative. The invariant is that source, policy, and observation
basis are values a caller can inspect and replace. Browser, server, test,
archive, indexer, and clean-room sources implement the same narrow read
capability; they do not gain wallet or write authority.

For a logical multi-call/page/log read, a caller may request `safe` or
`finalized` as policy, but the adapter resolves it once to an explicit block
hash/number and then uses EIP-1898/EIP-234-shaped qualification throughout.
Provider failover must prove the same basis or return a new qualified attempt;
it cannot silently resume at another head. Pagination cursors carry that basis
and coverage so a chain of pages can be tested for duplicates and omissions.

### 4. Write planning

A write call is a pipeline rather than one opaque `publish()`:

```text
construct -> validate -> plan -> simulate -> clear-sign -> authorize -> submit
          -> receipt/finality -> canonical read-back
```

The plan names every intended Core/Realm call, exact calldata or commitment,
expected effect, signer/controller and author relationship, payer, admission
authority, compare-and-swap precondition, cost bound, expiry, replay domain,
and expected identifiers. Human UI and agent tooling render the same plan.
Unknown operation kinds or post-plan mutation invalidate authorization.

The wallet/account adapter is selected only after the plan exists. EIP-5792,
ERC-4337/bundler/paymaster, or an audited wallet-owned EIP-7702 flow may carry
the transaction, but each layer returns its own receipt. Account, provider,
chain, delegate code, EntryPoint, calldata, cost, nonce, deadline, basis or
clear-signing presentation drift invalidates the authorization and restarts at
planning. Verification APIs permit only explicitly non-persistent `eth_call` or
revert-based counterfactual simulation. They prohibit a persistent ERC-6492
prepare/deploy mode. Any persistent factory, preparation or deployment step is
a separate inspected action plan with its own authorization, submission and
effect receipt.

### 5. Solidity consumption

The default contract experience is:

1. select an exact Type and accepted protocol/result ABI tuple;
2. import generated `internal` structs, codec, validator, and constants;
3. query a narrow Core interface or structural probe with explicit bounds;
4. inspect an explicit status/result struct;
5. obtain bytes only through a Type-specific bounded path;
6. validate locally before making a semantic or authorization decision.

An optional deployed helper is never required for correctness. A consumer can
pin and call one as an optimization only when its direct code hash, finite
dependency declaration, dependency identities/basis, limits and full
capability tuple match. A verified mismatch/forged response is `INVALID`, a
known unsupported tuple is `UNSUPPORTED`, and genuinely unobservable state is
`UNKNOWN`; the caller then applies an explicit local fallback policy.

### 6. Ethereum signature and account authorization

The experience has two linked operations rather than one permanent account
class. First, EOA recovery, deployed ERC-1271, non-persistent ERC-6492,
ERC-7913 and P-256 validation each name their required chain/fork/code/factory
basis, canonicality policy and work limits while verifying the exact EFS
plan/message digest. The receipt retains that digest and original signature;
SDK-produced P-256 action signatures use the selected low-`s` canonical policy,
and compatibility verification of high-`s` evidence remains explicitly
noncanonical. Raw signature bytes never identify the plan or replay domain.

Second, ERC-4337/account adapters, EIP-7702 delegation, EIP-5792 calls and
ordinary transactions each expose their own digest or commitment and receipt,
bound back to the unchanged EFS plan/effect commitment. Unsupported and
unobservable are not invalid; a valid signature or accepted account submission
is not admission, an OS grant, proof of semantic authorship or canonical effect
success.

### 7. Reproducible helper deployment

The tool retains exact Solidity standard JSON, compiler/settings/`evmVersion`,
sources/remappings/linking, constructor and immutable inputs, creation
initcode/runtime bytes and hashes, CREATE2 factory/code hash/protocol, salt,
expected address, dependency graph, observation block and local fallback.
Deployment verifies the selected execution profile first and canonical
read-back verifies runtime and dependencies afterward. No factory or helper is
assumed present merely because an EIP is Final or an address is conventional.

## Environment profiles

| Environment | Required properties | Explicitly optional |
|---|---|---|
| Browser guest | ESM, `Uint8Array`, AbortSignal-like cancellation, streaming where useful, no Node polyfills, no wallet touch, route-shaped loading, Web Worker compatibility | cache, indexer, gateway, OS services, signer |
| Browser write | Same read path plus an explicitly selected EIP-1193 provider, planner, basis-aware signer/account strategy, submitter and canonical read-back; lifecycle drift invalidates plans | EIP-5792 wallet calls, ERC-4337 adapter, wallet-owned EIP-7702 integration, relayer/paymaster |
| Server | Deterministic headless block-hash-pinned reads, explicit accepted/observed RPC profiles, streaming/batching, bounded concurrency, source injection, structured logs without secret/raw-data leakage | database materialization, RPC pool/quorum, archive/proof source, indexer |
| Agent | Machine-readable capabilities/plans/receipts, dry-run, idempotency/replay controls, least authority | human UI renderer, remote agent protocol adapter |
| Indexer | Raw retention, direct verification, basis/coverage ledger, resumable bounded ingestion, divergence reporting | GraphQL/SQL/product query surface |
| Offline/archive | Zero mutable network reads, exact closure import/export, deterministic replay, unavailable-byte ledger | locally retained generated facades |
| Solidity | Exact compile-time imports, bounded work, explicit status/result structs, no dynamic schema VM | stateless code/dependency/basis-pinned helper |

## Acceptance ledger

A journey is not SDK-ready until its fixture demonstrates all applicable
properties:

- exact source/profile/Realm/Type/basis is inspectable;
- raw bytes survive decode, cache, worker/storage transfer, export, and relay;
- unknown, partial, absent, invalid, unsupported, tampered, unavailable, and
  conflict cases remain distinguishable;
- expected results do not require exception parsing;
- signing and submission roles are separately visible;
- accepted and observed Ethereum profiles, signature strategy and every
  submission/finality/read-back receipt remain separately inspectable;
- no read path touches a wallet or mutable registry unexpectedly;
- a dishonest or incomplete indexer can be removed without changing truth;
- offline regeneration and reconstruction succeed from retained closure; and
- Solidity work is bounded before any attacker-controlled allocation, loop,
  or external call.

The executable form of this ledger is specified in [[experiment-program]].

## Open questions

- [ ] Which minimal closed meta-profile lets a future implementation identify,
  bound, and preserve an unknown Type without embedding an open schema VM?
- [ ] Which exact result axes belong in the cross-language contract rather
  than language-specific ergonomic wrappers?
- [ ] Which query coverage/completeness proof can make `ABSENT` honest for each
  adopted Core index and Binding scope?
- [ ] Which signer/controller/Principal surface survives the Core authority
  bakeoff while preserving the owner-directed uniform product experience?
- [ ] Which generated Solidity functions remain below measured size/gas limits
  on representative consumer contracts?

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed (no surprise repos at implementation time)
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment
