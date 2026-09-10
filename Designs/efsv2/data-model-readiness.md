# EFS v2 data-model capability and readiness map

**Status:** reference — requirements/evidence map, not feature-parity certification
**Target repos:** planning, contracts, sdk, client
**Last reconciled:** 2026-09-10

#status/reference #kind/note #repo/planning #repo/contracts #repo/sdk #repo/client #topic/efsv2 #topic/requirements

## Read this first

The foundation should support useful shared data without making every developer
learn the full specification. Most peer-system capabilities already have a
written home in EFS; described, implemented in one component, and demonstrated
through an independent consumer are different states.

This map connects [[system-constitution]], [[layered-type-system-and-data-abi]],
[[programmable-type-acceptance]], [[hierarchical-files-and-folders]] and
[[testnet-files-mvp-plan]]. It does not replace their detailed contracts.
Peer evidence: [[Reviews/2026-09-09-mud-and-validation-research]]. Current
prototype verification: [[Reviews/2026-09-10-data-readiness-reconciliation]].

**Current conclusion:** enough structure exists to specify the next bounded
implementation experiment. Feature-complete data acceptance, authenticated
offline recovery, general Type tooling and real-wallet simplicity are not yet
proven. A usable local Files browser is significant progress, not proof of those
remaining capabilities.

## Capability ledger

Evidence is scoped to the PM design baseline `cce0c730` and Fable's local
browser checkpoint `92f2d6b`, plus the dated verification linked above. Entries
are not claims that no uninspected branch has additional work.

| Capability / useful precedent | Smallest appropriate EFS home | Current evidence and closing test |
| --- | --- | --- |
| Reusable exact Types, shape validation and generic contract reads — EAS/MUD | Core plus generated SDK accessors | Structural/index components exist. Generate one developer-authored Type and consume it from an independent contract and browser. |
| Mandatory arbitrary developer acceptance — EAS resolvers/MUD hooks | Generic guarded Core/Realm extension; ordinary application rule code | Reopened concrete draft, not implemented. Invalid Outfit and paid unique issuance must fail through every accepting path. |
| Mutable state and application logic — MUD tables/Systems | Immutable Records + authored current Bindings + permission-limited controllers | Files lifecycle works locally. Run RPG state transition, race/CAS, rule update and grandfathering without a game-specific Core primitive. |
| Authority, actors and delegated sessions — EAS/MUD | Realm authority + reusable scoped grants + SDK wallet transport | Fable's preclaimed local accounts sign routed intents. First-claim squatting, smart accounts, recovery and real delegated sessions are not closed by that fixture. |
| Atomic graphs, batches, idempotent retry | Core acceptance and explicit application transaction rules | Bounded local multi-leaf writes exist. Add rule/payment rollback, duplicate replay and ambiguous-submission recovery. A multi-transaction upload is not one atomic transaction. |
| Compatibility and unknown-safe editing — AT Protocol | Exact Type/View contracts + SDK linter/editors | Written directional rules exist. Old editor must preserve unknown fields/variants or refuse; additive labels alone do not prove compatibility. |
| Tags, backlinks, sets and qualified filters | Ordinary relation Types + Core declared indexes + Lens | Local tag/untag/filter works. Prove generic mixed image/video targets, issuer attribution, retraction, conflicts and negative filtering under complete coverage. No untyped identity coercion. |
| Index evolution, hot values and churn — MUD index modules | Core bounded query/coverage law; SDK pages; optional accelerators | Local churn completes at measured bounds, but hundreds of lifetime names cost thousands of RPC requests. Compare contract-side page aggregation before inventing more client machinery. |
| Reactive synchronization and recovery — MUD | SDK browser-local snapshot/delta cache + replaceable services | Qualified readers exist; complete reorg/provider-switch/backfill convergence is not demonstrated here. Never make an EFS server authoritative or mandatory for the static SPA. |
| Generated APIs, package composition and generic inspection — MUD/ComposeDB | One SDK Type-package workflow + Explorer | Handwritten Files helpers and existing five SDK seams are useful controls, not generic codegen. New Type must be inspectable without a custom screen. |
| Provider-independent bytes and complete export — IPLD/AT Protocol | Exact content/closure profiles + SDK exporter/verifier | Live multichunk byte verification works. Current offline export verifier overclaims integrity; repair proof chain before calling it authenticated recovery. |
| Revocation, withdrawal, expiry and deletion | Core lifecycle + explicit application and Files semantics | Local remove/restore works. Test issuer revocation versus holder rejection versus carriage withdrawal; none means erasing public history. |
| Private data and publication safety | Encrypted-body profile + client/OS sensitivity and key handling | Detailed boundary exists; public browser is not private-folder evidence. Unsupported encrypted mounts remain opaque/unsupported, never falsely empty. |
| Upgradeability and long-lived history | Versioned Realm implementation/activation and state-readable receipts | Populated U3 repeat upgrade passes locally. Historic acceptance still needs exact rule/config evidence; retained privileged fixture entrypoints remain declared exceptions, not production defaults. |
| Host filesystem usability | Shared Files reader plus read-only host adapters | Linux/macOS/Windows outcome is required. This browser pass does not replace the three-host golden view test. |
| EAS import/export and external identifiers | Versioned adapter + explicit loss receipt | Required design seam, not identity-preserving round-trip proof. Preserve original schema/UID/chain evidence and explain missing policy/currentness. |

The ledger deliberately does not add mandatory full-text search, global ranking,
GraphQL servers, a game engine, a general ontology interpreter or arbitrary code
execution during reads to Core. They can be useful application/service/SDK
features. Their absence from Core is not itself a missing data-model primitive.

## Everyday developer and data UX

The target workflow is **define → generate → preview → accept → inspect → evolve → export**.
These are workflow verbs, not seven new SDK entrypoints. Retain the SDK's
existing five-seam division and let generated helpers compose it.

- Define a Note/Outfit Type using friendly names and an exact dependency package.
  Opt into a mandatory rule when custom acceptance is required.
- Generate consistent TS and Solidity helpers, including exact identity,
  validation diagnostics and the ordinary inspection description.
- Preview locally, then authorize a clearly scoped plan. Simulation is advisory;
  contract acceptance and independent read-back establish the result.
- Inspect ordinary fields first. Expand an evidence panel for Type identity,
  required rule, author/actor, Realm/basis, lifecycle, coverage and raw bytes.
- Evolve through a tested compatibility path. Old readers may read supported
  projections; old editors preserve unsupported data or refuse editing.
- Export an explicitly selected scope with separately reported listing,
  content and authority/evidence completeness. A folder download is not
  automatically recursive or independently authenticated.

Do not make every read revalidate all ancestors. Retained exact structural and
acceptance evidence can be reused for the claims it actually proves. New actions,
current eligibility, lifecycle, destination acceptance or a different trust
policy require their own checks. Missing evidence remains unknown.

## Five joined examples, not another large framework

| Example | Cross-layer acceptance obligation |
| --- | --- |
| Note extension | Note 1.1 adds an optional field; old reader projects known fields; old editor preserves new data or refuses. Rule changes cannot hide behind a minor-version label. |
| Media tags | Image and video share an attributed `ocean` relation. Lens selects whose tags matter. Missing index coverage does not mean “not ocean”; content verifies through a second independent source. |
| RPG outfit | Custom code validates pieces and current eligibility. A rules update leaves historical items intact; explicit policy decides grandfathering and new equips. Paid/unique claims roll back together. |
| Contract consumer | Independent Solidity uses generated helpers to select exact Type/rule/activation and risk-bearer-approved Lens, without trusting a web server or running admission hooks during ordinary reads. |
| Lost publisher | Export exact records, descriptors, content and required evidence; fresh verifier reconstructs within the declared scope. Tamper, missing dependency and fabricated authority/basis fail or downgrade distinctly. |

## Ordered build-readiness gates

1. **Resolve the acceptance contract in a disposable extension.** Compare the
   recommended mandatory-Type rule and mandatory-profile pair using one Outfit
   and one paid/unique issuance. Produce real no-bypass and rollback evidence.
2. **Generate and consume one ordinary Type.** A separately written Solidity
   consumer and the browser use generated helpers. Include old-editor/new-Type
   and malformed-input vectors. This exercises simplicity and expressiveness.
3. **Repair export and make trust explicit.** Recompute content, Type, Record,
   occurrence and selection commitments; separate self-consistency from a
   verified chain/authority basis. Add tamper and multichunk recovery tests.
4. **Replace simulated funding/approval with one real path.** Select either
   sponsored signed intents or a clearly labeled direct-transaction path;
   count actual wallet requests, staging transactions, cancellation and setup.
   No hidden typed-signature-plus-transaction fallback. Session grants are a
   separate scoped test, not inferred from an unlocked fixture key.
5. **Bound the useful read path and recovery.** Compare canonical directory
   page aggregation, current versus historical inventory, caching and transport
   batching on the same churn workload; prove snapshot/delta/backfill/reorg
   convergence and partial-result honesty before claiming scale.

Each gate produces a small reviewed change, independent read-back and a short
user-visible trace. Reuse Fable's working browser and retained C0 controls.
Do not freeze IDs, create permanent repositories or adopt a universal callback
ABI merely to run these gates. Existing E1–E8/F1/F2 remain the owner routing;
this map is not a fresh questionnaire or a demand for perfect verification.

## Maintenance

Update a capability row only with an exact design, executable test or explicit
scope decision. Preserve the dated evidence underneath it. At each checkpoint,
ask: did the ordinary workflow get simpler, did a known requirement lose its
enforcer, and can an independent consumer demonstrate the claim?
