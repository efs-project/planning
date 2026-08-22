# EFS v2 SDK — owner decision inbox

**Status:** reference — evidence-gated SDK queue; nothing needs an immediate owner answer
**Audience:** project owner first; SDK PM and counterpart PMs second
**Last reconciled:** 2026-08-22
**Inputs:** [[owner-rulings]], [[README]], [[architecture-candidate]], [[experiment-program]], [[../efsv2/owner-decision-inbox]]

#status/reference #kind/decision #repo/planning #repo/sdk #repo/contracts #repo/client #topic/efsv2 #topic/onchain

> **Nothing here needs an immediate owner answer.** The owner authorized the
> SDK PM mandate and durable planning work on 2026-08-22. The current job is to
> pressure-test the hybrid candidate and return only choices the evidence
> cannot settle.

## Decide after evidence — do not answer yet

### SDK-E1 — generation/runtime architecture

Compare descriptor-runtime arm A, exact-generation arm B, and hybrid arm C
against the same retained Type/evolution/raw/reconstruction fixture. Select a
production direction only if the bootstrap runtime remains closed, generated
outputs are deterministic and replaceable, unknown bytes survive, and two
independent implementations agree.

### SDK-E2 — first public package topology

Measure the two-package historical shape, capability-module shape, and
generated-per-Type distribution against guest bundle, browser/server/agent
ergonomics, upgrade matrices, archive closure, and century replacement.
Choose public package count/names only after logical boundaries are proved;
package identity must never become Type or protocol identity.

### SDK-E3 — onchain helper lane

Compare generated internal Solidity leaves, a structural generic probe, and a
direct stateless helper. A helper is eligible only after the S9 bakeoff in
[[experiment-program]] clears a declared size/gas lane and every authority,
code/dependency/basis identity, fallback, reproducibility, and unavailability
attack passes. Failure kills only the helper lane.

### SDK-E4 — compatibility and support promise

Derive which protocol profiles, Type revisions/mappings, Query/View coverage,
contract/Realm bases, generator outputs, language runtimes, and archived
releases the first SDK can honestly support. Return separate directional
compatibility matrices and a replacement/archive drill; do not offer universal
forward compatibility or one green semver badge.

### SDK-E5 — cross-language result ABI

Use TypeScript, a second independent offchain implementation, and Solidity to
determine the smallest explicit outcome/basis/coverage/byte model that
preserves all required distinctions without making ordinary use hostile.
Return exact collapse attacks and cost measurements before asking Core to
freeze result shapes.

### SDK-E6 — runtime-neutral semantic capability contract

Generate MessagePort/structured-clone, WIT, and agent bindings from one
semantic lifecycle source and attack negotiation-versus-grant authority,
audience-bound/delegated handles, exact canonical effect-plan binding,
version/epoch, directional budgets/deadlines, invoke/progress,
cancel/revoke/close commit races, typed results/faults, durable receipt
recovery, byte streaming and resumable subscriptions. Decide the public OS App
SDK contract only if transport-specific feature profiles preserve the same
authority/effect semantics without leaking private Kernel provider selection,
effective grants, raw signers, secrets, or service objects.

## Decide after evidence — freeze choices, do not answer yet

### SDK-F1 — production SDK freeze bundle

Choose the first production TypeScript and Solidity SDK surface only after the
relevant EFS v2 Core semantics/bytes/IDs/limits/ABI are owner-frozen,
independent canonical implementations and adversarial vectors pass, offline
reconstruction succeeds, the guest and contract budgets hold, and the public
API/package/release/archive packet has independent review.

### SDK-F2 — first supported integrations

After SDK-F1, decide which Ethereum adapter, EAS carrier, indexer transport,
WIT boundary, wallet/signing integration, generated languages, and deployed
helper—if any—ship as first-party supported surfaces. Discovery/research
precedents do not imply a support promise.

## Already settled

### SDK-S1 — one PM owns two coordinated SDK surfaces

The SDK PM owns offchain TypeScript and onchain Solidity developer experience
as separate useful surfaces with shared evidence, generation, result, and
conformance contracts. Core truth and product UI remain outside this charter.

### SDK-S2 — 100-year replacement and reconstruction are first-order

Every production candidate must retain exact evidence, source/tool/output
closure, cross-language vectors, offline reconstruction, and a path to replace
the current package/tooling/provider without changing truth.

## Superseded inputs — never revive silently

### SDK-P1 — current `sdk/` packages as the v2 baseline

The existing `@efs/sdk` / `@efs/solidity` shape, EAS identity, attester/Lens
defaults, write graph, and compile-in rationale are historical evidence. They
do not define EFS v2 compatibility, semantics, package topology, or contract
consumption.

### SDK-P2 — a friendly API may hide qualification

Rejected by the current EFS v2 and Web Client boundary. Friendly façades may
reduce syntax, but cannot hide raw bytes, `UNKNOWN`/`PARTIAL`, authority,
basis, coverage, currentness, availability, conflict, or unsupported behavior.
