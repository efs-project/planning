# Web Client/OS pressure on the EFS v2 SDK boundary

**Status:** reference — coordination pressure and SDK response; no Web Client, Files, CapabilityRPC, WIT, or Kernel name/API is adopted
**Target repos:** planning, sdk, client
**Depends on:** [[README]], [[architecture-candidate]], [[developer-journeys]], [[../web-client-os/README]], [[../web-client-os/type-data-abi-boundary-pressure]]
**Reviewers:** @web-client-os-pm (2026-08-22)
**Last touched:** 2026-08-22

#status/reference #kind/review #repo/planning #repo/sdk #repo/client #topic/efsv2 #topic/cypherpunk-os #topic/read-path #topic/wasm

## Question

Can the SDK v2 candidate support the requested direct guest Data Explorer
inspection pressure inside the owner-directed File Browser path, and later
confined OS applications, without leaking Type/Data-ABI machinery into product
UI? Should MessagePort/structured-clone, WIT, and agent bindings be generated
from one runtime-neutral semantic capability contract? Which parts are public
SDK and which remain a private Kernel service-provider interface?

The Web Client/OS layering and names in this review are pressure evidence from
its PM. They do not transfer product/Kernel ownership to the SDK PM and do not
freeze either design set. “Data Explorer” names an inspection consumer/fixture
here; it does not create a second MVP or displace the official basic
write-capable File Browser.

## Verdict

**Yes, with two distinct consumption altitudes and no bypass.**

1. The trusted direct guest shell and its Data Explorer inspection fixture use the low-level
   protocol/generated and Files/artifact SDKs through an exact generated
   consumer adapter. Product reducers and UI receive stable DTOs plus the
   qualified outcome algebra; Type/Data-ABI machinery remains behind the
   adapter. An explicit raw inspector can expose evidence handles without
   making every component schema-aware.
2. A confined app uses a thin OS App SDK generated from a semantic capability
   contract. It never selects providers, accesses effective grants, sees raw
   signer/secret/Kernel objects, or calls low-level services directly.

The direct first-party shell is not an OS-confined third-party app, so it need
not route its guest read through the Kernel capability broker. It still uses
the SDK stack; this is a trust-altitude distinction, not a bypass.

## Candidate consumption stack

| Layer supplied as pressure evidence | SDK interpretation | Owner / boundary |
|---|---|---|
| **Protocol/generated SDK** | Exact identities, raw-preserving codecs/validators, qualified Realm/Record/Occurrence/Binding/Plan reads, verification, generated Type façades | SDK PM owns ergonomics/tooling; Core owns truth/bytes/ABI |
| **Files/artifact SDK** | One canonical route/name resolution interface, qualified directory paging, verified byte/range retrieval, and mutation-plan construction over the selected Files candidate | Files semantics and product behavior remain with Core/Web Client work; SDK PM owns reusable interface/tooling only after that contract is supplied |
| **Generated consumer adapter** | Finite exact-Type/profile closure compiled into stable product DTOs, references, reducers' inputs, raw handles, and exhaustive outcomes | Joint seam: SDK owns generator/non-loss contract; product team owns the stable DTO needs and UI policy |
| **OS App SDK** | Thin capability client over scoped semantic operations, streams/progress, cancellation, receipts, and typed faults/results | Web Client/OS owns App/Kernel capability policy; SDK owns shared binding/codegen quality where delegated |
| **Product reducers/SDKs** | Domain state and UI-oriented commands over stable DTOs/outcomes | Product/application team; must not redefine protocol truth |

The dependency direction points downward. Protocol code cannot import Files,
OS, product DTOs, reducers, MessagePort, WIT, agent frameworks, wallets, or the
Kernel. Generated consumer adapters depend on exact protocol/Files façades but
do not make UI components understand Type descriptors or canonical encoding.

## Direct guest inspection path inside the File Browser

```text
exact URL/link context
  -> explicit Realm/public read source
  -> protocol + Files resolver
  -> exact generated consumer adapter
  -> stable ExplorerOutcome<ExplorerDto>
  -> product reducer / accessible UI
```

Required properties:

- no wallet, account/profile, Commons, hosted indexer, OS boot, Kernel session,
  package discovery, or capability broker before useful pinned data;
- exact Realm/profile/Type/basis/coverage and raw bytes retained below the UI;
- a product DTO that exposes ordinary domain data plus an evidence handle and
  qualified status, without codec fields, schema graph traversal, byte offsets,
  or generated-class identity;
- a deliberate **raw evidence inspector** route/component that can request the
  retained envelope, commitments, basis, diagnostics, and unknown bytes;
- indexer/cache adapters may improve speed but are removable and cannot prove
  absence, completeness, authority, or currentness; and
- current Web Client guest byte/parse/no-auth budgets remain integration gates.

The one case that intentionally surfaces Type machinery is a Type-authoring or
protocol-debugging tool. That is an expert developer product over compiler/raw
APIs, not leakage into ordinary Data Explorer reducers.

## Confined application path

```text
confined app
  -> generated OS App SDK client
  -> semantic capability session
  -> Kernel policy/router
  -> selected private provider SPI
  -> protocol / Files / storage / network / picker / agent service
  -> qualified result + effect receipt
```

The app knows only the capability instance it was granted and the semantic
operation/result contract. It cannot choose a wallet, RPC, gateway, byte
provider, model, agent, indexer, secret store, or signer unless a separate
explicit product capability makes that choice the user's operation.

## Runtime-neutral CapabilityRPC assessment

### Recommendation

Experiment with **one semantic operation lifecycle source**, not one
lowest-common-denominator wire protocol. Generate MessagePort/structured-clone,
WIT/component, and agent-tool bindings that preserve the same operation IDs,
input/result schemas, capability requirements, lifecycle states, faults,
receipts, budgets, and conformance vectors. Each transport binding may map
bytes, streams, cancellation, backpressure, and handles differently and must
declare its feature profile and limits.

The candidate lifecycle—`open`, `ready`, `invoke`, `progress`, `cancel`,
`revoke`, `close`—is a useful experiment vocabulary, not yet a frozen seven-call
ABI. Long-running streams, reconnection/resume, backpressure/acknowledgement,
and cancellation/commit races are exact falsifiers for whether it is complete.

The source contract must separate three things that a friendly RPC often
collapses:

1. **binding negotiation** — which contract/profile/features/limits a transport
   can faithfully carry;
2. **granted capability** — exact audience, issuer/enforcement basis, purpose,
   allowed operations/effect classes/targets, attenuation, budgets and expiry;
   and
3. **per-effect authorization** — one exact canonical action-plan bytes/digest
   plus semantic/profile tuple, rechecked at the irreversible effect boundary.

An `open` handshake can bind an already granted capability; it cannot turn
interface compatibility into broad authority. Effectful transport input is
only an ergonomic projection. Before authorization or submission, the binding
must prove it reproduces the exact canonical plan commitment inspected by the
human/agent/contract path.

### Semantic state machine

| Operation/event | Required semantic | Important non-claim |
|---|---|---|
| `open` | Negotiate exact contract/profile/features/directional limits; bind an already granted capability to an unforgeable app/audience/transport context and fresh session epoch; return accepted tuple plus sanitized allowed operations/effect classes/targets, attenuation, expiry and enforcement-basis reference | Compatibility/discovery/open success does not mint authority for an unlisted effect and does not reveal provider identity by default |
| `ready` | Report that the binding can receive its allowed operations under the current epoch and feature profile; include degraded/unsupported reason | Readiness is not current authorization: the host re-evaluates grant/epoch/budget at each invocation and effect boundary, and it proves nothing about a remote resource |
| `invoke` | Carry request ID, operation/profile, typed input, instance/session epoch, idempotency/replay commitment, relative deadline duration, typed budgets and, for every effectful operation, exact canonical plan bytes/digest plus a verified transport-to-plan binding | Invoke acceptance is not authorization at commit, effect commitment or success; ergonomic JSON/WIT/clone input is never the signed object |
| `progress` | Emit bounded advisory frames with a channel-local delivery sequence; name any separately durable source replay cursor; declare credit/ack/backpressure owner and no-push polling fallback | Delivery sequence is not a durable replay cursor; progress is not truth, final result, revocation proof, or side-effect proof |
| `cancel` | Best-effort request scoped to invocation/epoch; return an immediate cancellation acknowledgement and, when available, a qualified outcome/receipt or recovery handle | Cancellation is never rollback and channel loss may prevent terminal delivery |
| `revoke` | Authority-side invalidation of a capability instance/epoch with enforcement decision points and race semantics; public clients receive best-effort notification and may relinquish/request revocation of their own delegation | Missing a notification never proves continued validity; an ordinary app cannot mutate global grants, provider policy, or other sessions |
| `close` | Release session-local resources and reject future invokes for that instance/epoch | Closing a channel does not revoke durable grants or undo committed effects |

`instanceId` and `sessionEpoch` are routing/freshness labels, not bearer-proof
strings. Each binding either anchors the handle to an unforgeable endpoint and
audience—such as an owned MessagePort—or implements an explicit inspectable,
attenuated delegation. Agent transports cannot infer browser-session identity.
Export/transfer is denied unless the grant explicitly permits it.

The client supplies a relative deadline duration; the host records receipt
time, clock/epoch and the enforced expiry in its own clock domain. Client
countdowns are advisory unless a separate clock-synchronization contract is
selected. Every budget/limit names dimension, unit, scope, enforcement actor
and comparison direction.

Authorization and revocation have named decision points: invoke admission,
effect start, and irreversible commit when applicable. The provider rechecks
the exact grant version/epoch at each required point and records the observed
ordering/basis in the receipt. If cancellation, revocation, failover or
transport loss prevents the order/effect from being established, the outcome
is an explicit uncertain effect, never invented rollback or post-revocation
safety.

### Results, faults, and receipts

- Domain/evidence states such as `PRESENT`, `PARTIAL`, `UNKNOWN`, `ABSENT`,
  `CONFLICT`, `INVALID`, `UNSUPPORTED`, and action-plan states are successful
  RPC **result values**, not generic transport errors.
- Capability faults cover lifecycle/transport concerns: malformed frame,
  unsupported contract/profile, stale epoch, revoked instance, deadline,
  budget exhaustion, cancellation, provider crash, backpressure violation, or
  internal invariant failure.
- A final receipt binds request/operation and, for every effectful operation,
  the exact canonical plan commitment and verified transport binding; it also
  records the accepted capability tuple/instance/epoch, authority/grant version
  and enforcement basis without secret material, authorization/effect decision
  points, budget used, effect/commit status, qualified result commitment,
  relevant basis/currentness and any uncertainty. It is inert evidence, not a
  reusable grant.
- Terminal delivery is not guaranteed after channel loss or `close`. The
  semantic contract therefore needs capability-scoped outcome recovery by an
  invocation/plan commitment, with retention, audience, idempotency, privacy
  and basis rules. If recovery cannot establish the effect, it returns
  `EFFECT_UNKNOWN`; retries use the same durable idempotency/plan commitment
  across an explicitly authorized provider switch.
- A progress or result frame from a stale epoch, unknown request, wrong
  operation schema, exceeded size/depth limit, or duplicate terminal sequence
  is rejected rather than coerced.

### One source, multiple bindings

The semantic source should generate:

- immutable language-neutral operation/type/result/fault/receipt descriptors;
- TypeScript client/provider test interfaces and MessagePort codecs;
- WIT worlds/resources for the subset that component tooling can express;
- agent tool schemas and structured progress/receipt adapters;
- conformance vectors for negotiation, grant/attenuation, canonical plan
  binding, handle transfer, deadline/budget direction, authorization/revocation
  decision points, receipt recovery and lifecycle races for every binding; and
- a capability/feature matrix where a binding cannot faithfully support a
  semantic feature.

The generator must not pretend that structured clone transferables, WIT
resources/streams, and agent JSON/tool calls have identical copying,
backpressure, cancellation, confidentiality, or availability semantics. A
binding that cannot preserve a required feature returns `UNSUPPORTED`; it does
not silently buffer unbounded bytes or collapse a stream into one object.

## Public SDK versus private Kernel SPI

| Public OS App SDK / generated semantic contract | Narrow private Kernel SPI |
|---|---|
| Operation and result descriptors safe for apps | Provider registration, health, ranking and service selection |
| Capability request/granted view limited to the app's own audience/instance/purpose/allowed operations/targets/features/budgets/expiry | Effective-grant graph, issuer/root authority, minting, attenuation and global revocation machinery |
| `open`/readiness/invoke/progress/cancel/close, best-effort revocation notification and scoped invocation-outcome recovery | Raw signer/key access, secret store, wallet sessions and transaction authority |
| Typed domain results, lifecycle faults, exact plan binding, cancellation, uncertain-effect state and receipts | Policy evaluation, consent UI hooks, risk-bearer decisions, authorization decision points and effect-commit implementation |
| App-visible budget remaining/used and deadline | Budget allocation/enforcement across apps/providers/system reserves |
| Opaque resource/capability/artifact handles with export only when explicitly granted | Handle tables, object identity, provider/native resources and declassification/export controls |
| Generated MessagePort/WIT/agent binding for the accepted feature profile | Transport bridge setup, port ownership, component host, agent broker and provider credentials |
| App-scoped diagnostic/evidence details with privacy-safe redaction | Full audit log, sensitive diagnostics, crash recovery, quarantine, replay defense and system telemetry |
| User operation to request provider choice where product policy exposes one | Default provider selection, routing, fallback, retries, failover and service discovery |

The provider-facing SPI should be small, private, versioned independently, and
unavailable to applications. Public type reuse is acceptable for semantic
inputs/results, but an SPI provider receives explicit Kernel context and may
not return raw internal objects through the public result contract.

## Does any journey force a bypass?

| Journey | Bypass? | Required path |
|---|---|---|
| Direct guest File Browser read plus Data Explorer inspection fixture | **No.** It intentionally does not use the OS App SDK. | Trusted shell calls protocol/Files SDK and generated consumer adapter directly, preserving the no-OS/no-auth path and the one File Browser product boundary. |
| First-party write-capable File Browser | **No.** | Trusted write slice uses SDK action planning plus an explicitly injected signer/submitter capability and canonical read-back. Third-party apps request the equivalent action capability. |
| Confined third-party app read/write | **No.** | OS App SDK only; Kernel privately routes to protocol/Files/action services. |
| Raw evidence inspection | **No.** | Explicit inspector DTO/handle or scoped raw-evidence capability; ordinary reducers remain schema-agnostic. |
| Type authoring/codegen/debugging | **No, but expert-only.** | Developer tooling deliberately calls compiler/raw APIs outside ordinary product UI. |
| Large/ranged/streaming bytes | **Not yet.** | Requires a binding feature for transferable/streamed byte handles, bounded backpressure, cancellation and resumption. If the semantic source cannot express this without unbounded copying, revise CapabilityRPC rather than bypass it. |
| Long-lived watch/subscription after reconnect | **Not yet.** | Requires cursor/resume/replay semantics and gap-qualified results. The seven candidate lifecycle names may be incomplete; experiment before freeze. |
| Emergency/rescue configuration | **No.** | Trusted recovery shell uses a minimal direct SDK path; it must not depend on a broken third-party app/provider graph. |

There is therefore no current journey that justifies a UI component importing
Type descriptor internals, a confined app receiving the Kernel object/raw
signer, or the direct guest route booting CapabilityRPC. The two open pressure
points are high-volume streams and resumable subscriptions; both are design
falsifiers, not permission to leak private SPI.

## Experiments added by this pressure

1. Generate MessagePort/structured-clone, WIT, and agent bindings from one
   small capability source; run identical lifecycle/result/receipt vectors.
2. Transfer a verified byte range and a directory page through each binding;
   measure copy count, memory, latency, cancellation, backpressure and limits.
3. Race invoke/commit against cancel/revoke/close and session restart; record
   grant/epoch checks at admission/effect-start/commit and require either a
   recovered unambiguous receipt or an explicit `EFFECT_UNKNOWN` outcome.
4. Kill and restart the Kernel/provider; reject stale epochs/ports and attempt
   cursor-qualified resume without duplicate effects.
5. Build a Data Explorer inspection reducer inside the File Browser fixture
   that imports only the generated consumer DTO and outcome contract; fail the
   experiment if it imports descriptors/codecs, recomputes identities, depends
   on raw service/provider selection, or creates a separate required product
   boot path.
6. Build one confined app using only the generated App SDK; fail if it needs a
   raw signer, secret, effective grant, Kernel object, or provider selection to
   complete its declared journey.
7. Serialize adversarial effectful inputs through structured clone, WIT and
   agent JSON; require each binding to reproduce the same exact canonical plan
   commitment before authorization, including bytes, large integers,
   absent/null, ordering and unknown-field cases.

## Open findings

- The four-layer pressure model fits architecture arm C without changing its
  protocol/raw/generated split.
- “One runtime-neutral contract” is viable as a **semantic generation source**,
  not necessarily one byte-identical transport or one public package.
- `revoke` has two faces: public clients receive revocation and may relinquish
  their own delegation; global grant/issuer revocation remains private trusted
  control-plane behavior.
- High-volume byte streams and resumable event subscriptions are the first
  concrete falsifiers for the proposed lifecycle and must be tested before the
  operation set freezes.
- The direct guest shell legitimately lives below the OS App SDK. Requiring it
  to open a Kernel session would violate the adopted no-OS guest boundary.
