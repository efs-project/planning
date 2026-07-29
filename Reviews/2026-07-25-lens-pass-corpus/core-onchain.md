# Core on-chain lane — the contract-tier lens: Roster, Plan, GATE, and bounded resolution

**Lane:** ON-CHAIN CORE (gap G-A of the 2026-07-25 joined pass; dedicated lens/resolver pass, 2026-07-28)
**Question owned:** the CORE/CONTRACT tier of James's three-tier steer, designed first so the RICH/CLIENT and ENHANCED tiers layer on it — how a compiled trust list lives on-chain, how a contract resolves through it in bounded gas, what makes 15–55 entries feasible, and the GATE profile that consumes it.
**Status:** design for reconciliation — no schema freeze, no MVP selection. Every reservation lands in the E2 bundle or a delegated gate; nothing here is Etched by this file.
**Primary inputs (read in full this pass):** [2026-07-11 lens architecture review](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) (the working base), [research lane](./research.md), [consumer register](./use-pressure.md), [FS-LENS/1](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md), [joined-pass synthesis](../../Designs/efsv2/joined-pass-synthesis.md), [owner rulings](../../Designs/efsv2/owner-rulings.md), [onchain-completeness](../../Designs/efsv2/onchain-completeness.md), [onchain-graph-queries](../../Designs/efsv2/onchain-graph-queries.md), [kel](../../Designs/efsv2/kel.md) §§5/7/8/9, [read-lens-spec](../../Designs/efsv2/read-lens-spec.md) (reopened; salvage only), [owner-decision-inbox](../../Designs/efsv2/owner-decision-inbox.md), [fs-pass-freeze-reservations](../../Designs/efsv2/fs-pass-freeze-reservations.md), [human-overview §7](../../Designs/efsv2/human-overview.md).
**Marking:** every substantive claim is **VERIFIED** (named file/source/computation) or **PLAUSIBLE** (constructed; needs vectors). §11 names what could not be verified.

#status/draft #kind/review #repo/planning #repo/contracts #topic/lenses #topic/onchain #topic/efsv2

---

## 0. Verdict and rulings-at-a-glance

The contract tier reconciles into one sentence:

> **On-chain, a lens degenerates into a small, owner-pinned, content-addressed compiled object — a Roster of 1–55 full-width principals with tiers and modes — resolved by keyed point reads against the venue's own total state, where absence is provable, budgets are enforced by the EVM's own atomicity, and everything richer (composition, imports, channels, sorting, big sets, cross-realm) is explicitly the client tier's job.**

Positions this lane takes (each argued in its section; push back there, not here):

| # | Position | Where |
|---|---|---|
| P-CORE-1 | The shared trust-list primitive is named **Roster**; the executable contract-tier unit is a **Plan** (= Roster + combiner + scope + modes); the contract-gating function is **GATE**. "Lens" stays the human word and never appears in contract ABI. | §1 |
| P-CORE-2 | One canonical byte encoding, three delivery forms (stored / calldata-committed / proof-slice), all round-tripping to the same `planId`. The **PlanRegistry is a redeployable periphery contract, not Etched kernel state** — content addressing makes it re-creatable, so the registry costs the freeze nothing. | §2 |
| P-CORE-3 | On-chain, the six-part tuple is fully defined and three axes are pinned by construction: existence bound = venue-total at the current block, availability = state-present, freshness basis = the venue clock. **Empty slot = proven absence (source 1 of the four). UNKNOWN on-chain is exactly: unresolvable principal authority, unrecognized encoding, or out-of-profile input — never data unavailability, never budget exhaustion.** | §3 |
| P-CORE-4 | **Claimant roster (`claimantsBySemanticPosition`): reserve in the E2 bundle, lean ADOPT** — but the GATE profile is designed to not require it (gates use closed sets ≤ 16 where direct probes are cheap). Costs stated both ways. | §4.4 |
| P-CORE-5 | **Venue ordinals: NO for v1 semantic surfaces.** Full `bytes32` principals everywhere; ordinals stay a kernel-internal compression option behind E2 evidence, never in ABI outputs, plan bytes, or receipts. | §5.3 |
| P-CORE-6 | New E2-priced reservation invented by this lane: **`positionSeq` — a per-semantic-position monotone mutation counter**, enabling O(1) gate revalidation, O(1) challenge-window rechecks, and the kernel delta anchor the client cache law needs (FS gap G-6). Correctness never depends on it. | §5.4 |
| P-CORE-7 | The contract-tier combiner vocabulary is CLOSED: `EXACT`, `PRIORITY_FIRST_PRESENT`, `THRESHOLD(k,n)` over a closed committee, and `ADVISORY` point-deny. `UNION_SET`/`ONLY_ONE`/`MERGE`, imports, channels, whiteouts, discovery, and sorting are client-tier. | §7, §8 |
| P-CORE-8 | EIP-7825 (16,777,216, live since Fusaka 2025-12-03) converts "wide Level-3 pages should not be promised" into "cannot be delivered": a 64-item × 55-principal naive page fits with no caller headroom; 128 items is permanently impossible in any transaction. Freeze the vocabulary accordingly. | §6 |

Nothing here contradicts an adopted ruling; no Pushback section is required. The genesis rule carries: **the kernel ships no Plan, no Roster, no default GATE policy** — every gate owner pins their own ([read-lens-spec P13](../../Designs/efsv2/read-lens-spec.md) / ops L1, carried).

---

## 1. Naming and the object model

Per the pass seeds and the register's naming pressure ([use-pressure §6](./use-pressure.md)):

- **Roster** — the underlying shared trust-list primitive: an ordered set of 1–55 **stable KEL principals** (full `bytes32`, never keys, never addresses — SCALE-1, [use-pressure §2.1](./use-pressure.md)) with per-entry `tier` and `effect`. It is the thing James's steer requires to be *on-chain-representable so a contract can read it*. Four consumers already name it: contract gates (LC-9), install GATEs (LC-6), channel-published updates (LC-16), and the client compiler (SCALE-1).
- **Plan** — the executable contract-tier unit: one Roster **bound to** one combiner, one scope, one relinquish mode, and optional advisory rules. A Plan is the EVM projection of exactly one **query-purpose/scope slice** of a compiled `EffectiveLens` ([review §4.3](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)); it is not a second policy language — its bytes round-trip to the canonical slice semantics or decoding fails.
- **GATE** — the contract-gating / installer / app-store-trust *function and profile*: an owner-pinned Plan plus consumption policy (accept-mask, failure mode, optional challenge window, governance). GATE is deliberately un-confusable with the social lens; every corpus accident ("contracts walk lenses") came from sharing the word ([use-pressure §6](./use-pressure.md), VERIFIED).
- **Lens** — remains the end-user word for the client-tier read-view. It never appears in contract ABI, storage names, or event names.

**Relation to the review's model (round-trip requirement).** The review defines `EffectiveLensV1` with `compiledSlices` and a `sliceCommitment`, and says an EVM call either supplies the full canonical plan, loads a small owner-stored gate plan, or supplies a slice plus a membership/order proof against `sliceCommitment` ([review §4.3](../2026-07-11-efsv2-lens-architecture-and-scale-review.md), VERIFIED). This lane adopts that three-form model verbatim as §2's delivery forms, and adds the missing piece: the exact storage layout, ABI, registry, and the rule that all three forms hash to one `planId`.

How the naming breaks: if "Plan" ever grows client-tier vocabulary (imports, UNION, channels), the tier boundary dissolves and gates become lens-walkers. Defense: the contract-tier grammar is a **closed enum whitelist at decode time** (§2.2); unknown tags fail registration, not execution.

---

## 2. The on-chain lens object

### 2.1 Canonical bytes and identity

A Plan's identity is a domain-separated digest of its canonical bytes:

```text
planId = keccak256(DOMAIN_EFS_PLAN_V1 || canonicalPlanBytes)
```

`canonicalPlanBytes` is the strict deterministic-CBOR fixed-array profile of the review's slice grammar ([review §4.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)) restricted to the contract-tier vocabulary:

```text
PlanV1 = [
  1,                      ; plan format version
  semanticsProfileId,     ; bytes32 — pins resolver semantics incl. logical cost schedule
  purposeId,              ; bytes32 — GATE purposes only in this profile
  scopeId,                ; bytes32 — canonical hash of the normalized Scope this slice serves
  combiner,               ; uint: 0=EXACT, 1=PRIORITY_FIRST_PRESENT, 4=THRESHOLD (review tags kept)
  thresholdK,             ; uint16; nonzero only for THRESHOLD
  relinquishMode,         ; 0=FALLTHROUGH_ON_RELINQUISH, 1=STOP_ON_FORMER_AUTHORITY
  requireActivePrincipal, ; bool: gate re-checks IdentityState.status == ACTIVE for consulted principals
  rosterEntries,          ; [* [principal(bytes32), tier(uint16), effect(uint8), flags(uint8)]]
                          ;   strictly ascending (tier, principal-bytes); duplicate principal invalid
  advisoryRules,          ; [* [labelDefinitionId, denyRoster, actionCode, honorStale]] — point-deny only
  rosterThreshold         ; uint16 — deterministic roster-vs-direct plan-choice bound (§4.2)
]
```

Decode rules (all fail-closed, all vectored): unknown version/combiner/flag/effect rejects; unsorted or duplicate entries reject; a bare 20-byte or truncated principal rejects (kill list: no 160-bit truncation anywhere); zero entries rejects; more than `MAX_PLAN_ENTRIES` (profile constant; candidate 256 pending E6) rejects **typed** — never truncates ([review §5.3](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) carried). Trailing bytes reject. (VERIFIED against the review's canonicalization rules 1–10; the restriction to this vocabulary is this lane's construction, PLAUSIBLE until cross-compiled vectors exist.)

**Provenance binding:** when the Plan is carved from a full client-side `EffectiveLens`, the slice commits into that lens's `sliceCommitment`; a Merkle path from `planId` to a published `EffectiveLensId` proves "this gate executes slice N of that lens" ([review §4.3](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)). The binding is optional provenance, never an execution dependency — a standalone gate Plan with no parent lens is first-class.

### 2.2 The three delivery forms and when each applies

| Form | What the gate stores | What arrives per call | Best for | Overhead per call |
|---|---|---|---|---|
| **S — stored Plan** | `planId` + registry address | nothing | hot gates, shared community Rosters, anything read by *other* contracts | early-exit SLOADs only (§6) |
| **C — calldata-committed** | `planId` only (one bytes32) | full `canonicalPlanBytes`; contract hashes and compares | rarely-fired gates (< ~45 lifetime calls), one-off ceremonies | ≈ 25–35k gas at 55 entries (§6) |
| **P — proof-slice** | `planId` or parent `sliceCommitment` | the few needed entries + Merkle membership/order proof | large plans (≥ 64 entries) where the check touches few entries; cross-contract "is P trusted at tier ≤ t" queries against big Rosters | ≈ 5–8k per proven entry (PLAUSIBLE) |

A caller-supplied rank table **without** one of these bindings is unauthenticated and cannot support a gate, receipt, or cursor claiming a `planId` — the review's rule, carried verbatim ([review §4.3](../2026-07-11-efsv2-lens-architecture-and-scale-review.md); kill list: caller-supplied gate policy).

### 2.3 PlanRegistry — Story-shaped, periphery, permissionless

Adopting the register-once/reference-by-ID shape from Story's license-terms registry ([research §1.3](./research.md), VERIFIED as precedent):

```solidity
interface IPlanRegistry {
    function register(bytes calldata canonicalPlanBytes) external returns (bytes32 planId);
    // strict decode; explodes entries into contiguous storage; idempotent (re-register = no-op)

    function planHeader(bytes32 planId) external view returns (PlanHeader memory);
    // version, semanticsProfileId, purposeId, scopeId, combiner, thresholdK,
    // relinquishMode, requireActivePrincipal, entryCount, rosterThreshold

    function entryAt(bytes32 planId, uint256 i) external view
        returns (bytes32 principal, uint16 tier, uint8 effect, uint8 flags);
    // i in priority order (ascending tier, then principal bytes)

    function rankOf(bytes32 planId, bytes32 principal) external view
        returns (bool present, uint16 tier, uint8 effect);
    // O(log K): binary search over the principal-sorted permutation index (§2.4)

    function advisoryRuleAt(bytes32 planId, uint256 j) external view returns (AdvisoryRule memory);
    function canonicalBytes(bytes32 planId) external view returns (bytes memory);
    // re-serialization MUST byte-equal the registered input — the round-trip conformance surface
}
```

**This satisfies James's hard consequence directly:** any contract can read any registered Roster — enumerate it (`entryAt`), test membership and rank (`rankOf`), or verify it byte-for-byte (`canonicalBytes`). A DAO module, an app-store contract, and a third-party audit contract all consume the same object with no off-chain dependency. (Design construction, PLAUSIBLE; the shape is the deployed Zodiac-Roles pattern — flattened compiled trees in contract storage, SDK owns authoring — [research §1.2](./research.md), VERIFIED as precedent.)

**Why periphery, not kernel:** registration ≠ blessing (a registered Plan carries zero authority — the gate owner's pin is the authority act); Plans are content-addressed, so a lost/redeployed registry is re-populated by anyone re-submitting the same bytes to the same `planId`s; gates pin `(registryAddress, planId)` themselves. Therefore the registry consumes **no Etched freeze surface** — it is a redeployable view/state contract in the same class as v1's redeployable views ([onchain-completeness §2c](../../Designs/efsv2/onchain-completeness.md) "reserve-selector-as-floor" logic). The only Etched items this whole lane asks for are the two index shapes in §4.4/§5.4. (PLAUSIBLE — needs a contracts-lane check that nothing in gate receipts requires registry state to be kernel-resident.)

How it breaks — malicious encodings and registry griefing:
- *Malleable/hostile plan bytes:* strict decode rejects; golden negative vectors (unknown tag, dup principal, unsorted tiers, trailing bytes, 20-byte principal, oversize) are Phase-1 conformance material ([review §19.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)).
- *Registration spam:* permissionless permanent state priced only by gas — the same accepted posture as all EFS state ([research §1.3 break](./research.md)); no registry curation, because curation would make the registry an authority.
- *Look-alike plans:* an attacker registers a Plan differing in one principal and phishes a gate owner into pinning it. Defense is ceremony, not protocol: the SDK's pin flow renders the full semantic diff against the intended source lens (the review's update-ceremony discipline, [review §13.4](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)); `planId` is never hand-typed.

### 2.4 Storage layout (the packed form)

Layout goals: contiguous slot runs (future locality pricing + cheaper binary-tree proofs — [research §3.2 item 3](./research.md), ADOPTED there); full-width principals; O(log K) membership without doubling storage.

```text
slot 0..1   header (packed): version | combiner | thresholdK | relinquishMode |
            requireActive | entryCount | rosterThreshold | advisoryCount ; semanticsProfileId
slot 2      scopeId ; slot 3 purposeId
slot 4..4+K-1        principals[i], priority order          (1 word each, full bytes32)
next ceil(K/8)       packed meta: (tier u16 | effect u8 | flags u8) × 8 per word
next ceil(K/16)      principal-sorted permutation index: u16 indexes × 16 per word
next 2×A             advisory rules (labelDefinitionId word + packed denyRoster ref/action)
```

At K = 55, A = 2: 2 + 2 + 55 + 7 + 4 + 4 = **74 slots**; at K = 15: **26 slots**; at K = 256: **295 slots**. Registration cost ≈ slots × 22,100 (cold SSTORE): **≈ 1.64M gas at 55**, ≈ 0.57M at 15, ≈ 6.5M at 256 — all under the 7825 cap, one-time. (VERIFIED as EIP-2200/2929 schedule arithmetic; not benchmarked.) This halves the research lane's 2-words-per-entry estimate (~2.48M) by packing meta ([research §1.3](./research.md)).

Membership (`rankOf`): binary search over the permutation index — `log2(55) ≈ 6` iterations × (1 amortized packed word + 1 principal word) ≈ **8–14 cold SLOADs ≈ 17–29k gas**, no extra per-entry storage. A dedicated `mapping(planId ⇒ principal ⇒ rank)` would make it 1 SLOAD but double registration cost; rejected as default, available as an opt-in "indexed registration" variant if a hot cross-contract consumer appears. (PLAUSIBLE; benchmark both in the E2-adjacent prototype.)

---

## 3. The contract tier's epistemic ground — what UNKNOWN and absence mean on-chain

This is the section everything else stands on, and the place the contract tier is *stronger* than the client tier. Stated precisely, per the mission:

**A contract reads its own venue's total state.** There is no partial replica, no hosted-RPC bare word, no withheld page, no unfetchable author inside an EVM view of local storage. Therefore:

1. **Absence is provable locally.** An empty slot at `(principal, semanticPositionId)` read from kernel storage *is* PROVEN-ABSENT source 1 — "own-node total state at a basis" — with the basis being the executing block. The four-source rule is satisfied natively; no closure proof is needed because the read *is* the closure. Fallthrough on an empty slot in `PRIORITY_FIRST_PRESENT` is therefore always legitimate on-chain. (VERIFIED against the adopted four-source ruling and [FS-LENS/1 §1.7](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md) — source 1 is exactly this read.)
2. **Budget exhaustion cannot ground anything, because it cannot produce a result.** A resolution that exceeds gas **reverts atomically**: there is no partial answer to mislabel as absence. The EVM's atomicity enforces the "budget exhaustion never grounds absence" rail for free at this tier. The design obligation that remains is *liveness* (plans bounded by construction so honest gates fit), not honesty. (VERIFIED — EVM execution semantics.)
3. **The six-part tuple is fully defined, with three axes pinned by construction** (this is *not* a label compression — F-15 binds presentation, and each axis still has a definite value):
   - **authorization** — read from the authority lane's same-venue state (`primaryAdmission[claimId]` / receipt spine, [kel §8.2](../../Designs/efsv2/kel.md)); a GATE accepts only `AUTHORITY-ADMITTED` rows (a gate consuming `PORTABLE-EVIDENCE` for authorization is a consumer bug — [use-pressure LC-9](./use-pressure.md)). The lens stays topology-blind: the value is a fixed input from the authority lane (H-2 posture carried).
   - **existence bound** — venue-total at the executing block. Pinned.
   - **freshness basis** — the venue clock (`block.number`/`block.timestamp`); `expiresAt` evaluated against it; never a wall clock, never an author-asserted TID. Pinned.
   - **availability** — state-present by definition; contracts read record bodies and metadata from state (items 17/18, full-body spine) and **never file bytes** (item 16). Pinned degenerate.
   - **slot state** — PRESENT / EMPTY-never-claimed / EMPTY-revoked (+ per-plan relinquish behavior).
   - **completeness** — total for point reads; explicit cursor state for candidate pages. A gate MUST NOT act on an incomplete page (revert; §7).
4. **What UNKNOWN is inside a contract read — the exhaustive list:**
   - **(a) unresolvable principal authority:** a plan entry whose principal has no locally resolvable authority state (not homed on this venue — the co-residency rule P-4 names this exactly; or `IdentityState.status` is pending-recovery/disputed when `requireActivePrincipal` is set). The entry's slots may be readable as *evidence*, but its authorization axis cannot reach the grade the GATE requires.
   - **(b) unrecognized encoding/profile:** unknown combiner, flag, suite, or semantics profile — rejected at registration where possible, failed closed at resolution otherwise.
   - **(c) out-of-profile input:** e.g., a position class the plan's scope does not cover.
   - **Nothing else.** In particular: no data-unavailability UNKNOWN, no freshness UNKNOWN (the venue clock always answers), no budget UNKNOWN (reverts).
5. **UNKNOWN blocks finality, on-chain as everywhere.** If an UNKNOWN-authority entry outranks every decided candidate at a position, the GATE resolution fails closed — it never falls through past it (the anti-fallthrough argument carries: falling through would convert an authority gap into a trust transfer — [read-lens-spec §2.1](../../Designs/efsv2/read-lens-spec.md) salvage, re-typed in [FS-LENS/1 §1.7](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md)). Consequence for plan authors: **a GATE Plan must contain only principals resolvable at GATE grade on this venue, or the plan wedges deterministically.** That is the plan author's error, caught in the SDK's pin-time dry run (`eth_simulateV1` state-override preview — [research §3.2 item 6](./research.md)), and it is safe: the failure mode is a revert, never a wrong answer.
6. **Cross-venue reads are not contract-tier.** A gate wanting a foreign-venue fact uses an explicit adapter or a disclosed pinned commitment at its own labeled trust grade (P-3 arm a; [review §15.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)). Rollup pairs sharing L1 settlement get the coarse existence/freshness floor (D-5) — a labeled adapter input, not GATE core. This lane designs nothing cross-venue.

How it breaks: the one way to smuggle unavailability into this tier is to make a gate depend on *history* — past-tx calldata, pruned logs, an archive query. The tier rule is therefore absolute: **GATE inputs are current state and stored receipts only** — which the mandatory bundle + full-body spine + no-elision rulings guarantee stay state-resident ([onchain-completeness §3 items 17/18](../../Designs/efsv2/onchain-completeness.md), VERIFIED as adopted).

---

## 4. Bounded resolution against the mandatory index bundle

### 4.1 What the 2026-07-15 bundle already gives this tier (consumed, not re-asked)

| Bundle surface (adopted) | Contract-tier use here |
|---|---|
| `slotHead(author, semanticPositionId)` + full-body spine | the point-read primitive; empty-on-revoke folded in (P2 carried) |
| Typed reverse index keyed `(targetKind, targetId, definitionId)` | advisory/deny point checks; backlink evidence for counters |
| Per-`(parent, principal)` child candidate streams | raw candidate pages (Level 2; §7.3) |
| Revocation G-set + `isRevoked` | explicit negative evidence; REVOKED-as-fact consumption |
| Revocation-aware live counts (ruled "pay for it") | counter/threshold gates over **closed author sets only** |
| LIST reverse membership, REDIRECT cited-by, address targets | membership gates (LC-9 registry shape) |
| `contentHash → DATA` | escrow/deliverable gates (LC-9) |
| Best-mirror bounded view (zero new state) | transport selection — read by clients; gates read content commitments only |
| Author self-enumeration (E4 shape open) | not a lens consumer (LC-B1 fence carried) |

(VERIFIED against [owner-rulings 2026-07-15](../../Designs/efsv2/owner-rulings.md) and [onchain-completeness §3–4](../../Designs/efsv2/onchain-completeness.md).)

### 4.2 The point-resolution algorithm at 15–55 entries

Adapting [review §8.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) to the contract tier — the adaptive choice becomes fully deterministic because both inputs are local state:

```text
resolveGatePoint(planId, semanticPositionId):
  plan = registry.planHeader(planId)                       // 2 SLOADs
  P_v  = kernel.claimantCount(semanticPositionId)          // 1 SLOAD (0 if roster not Etched)

  if rosterAvailable && P_v > 0 && P_v <= plan.rosterThreshold:
      // ROSTER PLAN: K-insensitive
      for i in 0..P_v-1:
          p = kernel.claimantAt(semanticPositionId, i)     // 1 SLOAD each
          (present, tier, effect) = registry.rankOf(planId, p)   // O(log K)
          if present: candidates.push(p, tier, effect)
      sort candidates by (tier, principal-bytes)           // in-memory, K small
      walk candidates in order: probe slotHead, apply state table (§7.1)
  else:
      // DIRECT PLAN: priority walk with early exit
      for i in 0..K-1:                                     // priority order
          (p, tier, effect) = registry.entryAt(planId, i)
          s = kernel.slotHead(p, semanticPositionId)       // 1–3 SLOADs (two-phase getter)
          apply state table (§7.1); stop on decision

  apply advisory point-deny (§4.3) to the selected winner
  apply plan.requireActivePrincipal check if set           // 1–2 SLOADs per consulted principal
  return (winner | CONFLICT | EMPTY | revert-fail-closed) + provenance words
```

Plan choice is committed by `rosterThreshold` inside the Plan bytes — deterministic over declared inputs, never over gas price or warmth; both paths return identical semantics ([review §8.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md), rule carried). The roster path is valid *only because* the venue's roster is complete-by-construction (atomic append with every slot-creating transition; inflated rosters change cost, never truth — [review §7.1B](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)).

Revocation-aware behavior: `slotHead` already reads empty-on-revoke; the plan's `relinquishMode` then decides fallthrough vs stop (§7.1); a GATE additionally consumes `isRevoked(claimId)` as negative evidence where its policy wants it (read-lens-spec §3.3 item 4, salvage carried).

### 4.3 Deny/advisory point checks — O(D) keyed reads

An advisory check is never an enumeration. For the resolved winner, with match keys ordered most-specific-first (`claimId`, `targetId`, position anchor — [read-lens-spec §3.4](../../Designs/efsv2/read-lens-spec.md) salvage, carried into FS-LENS/1):

```text
for each advisoryRule (labelDefinitionId, denyRoster D, action, honorStale):
  for d in D, for mk in matchKeys(winner):                 // D × 3 point reads
      adv = kernel.slotHead(d, advisoryPosition(labelDefinitionId, mk))
      grade it: LIVE ⇒ hit; REVOKED ⇒ withdrawn, never subtracts;
                STALE ⇒ hit iff honorStale (GATE default true — "vulnerabilities don't heal")
hit ⇒ Denied (fail closed). Deny NEVER re-opens resolution below the winner.
```

Cost: D=3 → 9 probes ≈ 18.9k floor; D=8 → 24 probes ≈ 50.4k floor (VERIFIED arithmetic). The typed reverse index with `definitionId` in the key is what makes this O(D), not O(postings-at-target) — the headline freeze change, consumed ([onchain-completeness §1](../../Designs/efsv2/onchain-completeness.md)). Advisory design center 2–8 sources per rule matches measured labeler reality ([research §5.1](./research.md)).

### 4.4 Position: does the claimant roster earn Etched state?

The decision the mission demands, stated with both prices (an E-track measured choice — this is a recommendation into E2, not a freeze):

**Lean: ADOPT into the E2 bundle — reserve `claimantsBySemanticPosition` now, price it as part of the one bundle, with the invariant that correctness never depends on it.**

For (costs of adopting):
- Write side: one append-once word per first `(position, principal)` claim ≈ 22.1k + length bookkeeping ≈ **~25k added to the first claim at a new position per principal**, riding a write that already costs 50–100k+; zero cost on re-assertions. Permanent state: one word per lifetime claimant-position pair. (VERIFIED arithmetic; E2 must confirm against the real kernel.)
- What it buys: point reads become K-insensitive on sparse positions — **≈ 21–23k vs ≈ 230k at K=55** (the ~10× lever, [research §8](./research.md), PLAUSIBLE interpolation); 64-item roster pages ≈ 1.4M vs 14.7M naive, which is the difference between honestly composable and not (§6); `claimantCount` doubles as half of the monotone revalidation token (§5.4); trust-minimized clients get absence closure over roster pages via state proofs (absence source 2).
- Now-or-never: Etched kernel storage cannot be added post-ceremony ([onchain-graph-queries §7](../../Designs/efsv2/onchain-graph-queries.md)).

Against (costs of rejecting — the honest fallback):
- Gates at their design center (1–16 principals, [use-pressure §2.2](./use-pressure.md)) don't need it: direct probes at K=16 ≈ 33.6k floor. A 55-entry contract point read pays ~230k — heavy but composable (1.4% of cap). Wide contract pages were never Level-3 promises anyway.
- The roster's `P_v` is a *lifetime* count: a century-old hot public position accumulates dead claimants and the roster path degrades past `rosterThreshold` into the direct-K bound — the same aging concern as §7.1G, honestly bounded (cost regression ~10×, never wrongness). Rejecting the roster avoids carrying that aging state forever on every fresh L3.
- Outsider roster inflation is a priced griefing lever (spam claims at a hot position force direct-K); with no roster there is nothing to inflate.

Decision rule for E2: adopt iff the measured write-side overhead across the seeded corpus stays under the bundle's tolerance **and** the kernel can keep the atomic completeness invariant (roster append in the same transition as slot creation; any count/page inconsistency fails closed — [review §7.1B](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)). If rejected: delete `rosterThreshold` semantics (plans compile with threshold 0 = always direct), and the GATE profile is unaffected. (Position PLAUSIBLE; both cost columns are schedule arithmetic + the 07-11 isolated harness, not kernel measurements — E2 is the gate.)

### 4.5 What the kernel must additionally store vs the bundle — the complete delta

| # | Addition | Etched? | Status |
|---|---|---|---|
| 1 | `claimantsBySemanticPosition` (+ `claimantCount`) | YES (kernel state) | reserve; E2-priced; lean adopt (§4.4) |
| 2 | `positionSeq` per-position mutation counter | YES (kernel state) | reserve; E2-priced; this lane's invention (§5.4) |
| 3 | Packed one-word `slotHead` two-phase getter | ABI only (read surface) | already pending as [review §18.2.8](../2026-07-11-efsv2-lens-architecture-and-scale-review.md); confirm |
| 4 | PlanRegistry | NO — periphery, redeployable | §2.3; zero freeze cost |
| 5 | GATE reference implementation + SDK templates | NO — contracts repo | §7; R-CR3 templates refuse tuple-ignoring consumers |
| 6 | `channelAnchorSummary` | YES — but owned by the channel lane (seam 16) | gates never read it (§8); listed to fence it |

Everything else this tier needs is already in the adopted bundle (§4.1). The Etched ask of this entire lane is **two index words** — deliberately small. (PLAUSIBLE as completeness claim; the critic should hunt for a missing surface.)

---

## 5. Compilation and caching — what makes 55 feasible

The core deliverable. Four mechanisms, one pipeline.

### 5.1 The pipeline and its on-chain anchor

```text
source lens (client, private by default)
  → compile: resolve imports at pinned bases, intersect scopes, expand groups,
    validate principals (KEL current-state), emit canonical EffectiveLens        [client/SDK]
  → carve the T-CONTRACT slice(s): one Plan per gate-relevant (scope, purpose)   [client/SDK]
  → conformance: second independent compiler reproduces planId byte-identically  [CI — Cedar-style
    differential method, research §4.2]
  → dry-run: eth_simulateV1 state-override injects the Plan as if registered;
    gate preview + semantic diff vs the currently pinned Plan                    [ceremony UX]
  → register(canonicalPlanBytes) → planId                                        [one tx, §2.4 cost]
  → gate owner pins planId via its own governance                                [§7.2]
```

The compilation record (`LensCompilationRecordV1` — source hash, import closure, compiler version, bases) stays an off-chain/Durable signed object; on-chain carries only the executable bytes and their digest. Mutable references (`FOLLOW_CHANNEL`) are already resolved at compile time and **can never reach the chain** — the Nix source/lock discipline lands here as a structural property, not a rule to police ([review §4.4](../2026-07-11-efsv2-lens-architecture-and-scale-review.md), carried).

### 5.2 Write-once, point-read-thereafter (the registration economics)

Stored-plan registration at 55 entries ≈ 1.64M gas once (§2.4). Per-call read cost after that is early-exit-shaped: a `PRIORITY_FIRST_PRESENT` walk that decides at rank r touches ≈ 2 + r×(1 entry + 1–3 slot) SLOADs. Typical owner-first-present decisions (r=1–3): **≈ 15–30k cold, ≈ 1–2k warm**. Calldata break-even ≈ 45–50 lifetime calls (1.64M ÷ ~33k) — below that, form C; above, form S. (VERIFIED as arithmetic over the schedule; PLAUSIBLE as totals.)

Warm-path effects worth naming: EIP-2929 makes every repeated touch in one transaction 100 gas — a batched action gating five operations through one Plan pays the cold cost once; EIP-2930 access lists shave modestly once keys are known; BAL/locality trajectory favors the contiguous layout at zero present cost ([research §3.2](./research.md)).

### 5.3 Position: venue ordinals — NO for v1 semantic surfaces

The review measured ordinals at 8.4–8.7% cheaper on one roster-read workload, with ~49k bidirectional registration and break-even ≈ 3 postings ([review §7.2/§9.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md), VERIFIED as its benchmark). Against that: a second identity encoding scoped to `(chainId, kernel, dictionary epoch)` infects every projection boundary with a translation obligation, and the failure class it risks — an ordinal leaking into a receipt, plan, or URL — is exactly the truncation/aliasing family the kill list exists for. At the 15–55 design center the roster path is already K-insensitive and the direct path is entry-count-linear either way; **single-digit percentage savings do not pay for a second encoding on an Etched surface.**

Ruling of this lane: postings, rosters, plans, receipts, and every ABI output carry full `bytes32` principals. Ordinals remain a measured E2 *shelf* option strictly as kernel-internal posting compression with an exact `ordinal ⇄ bytes32` dictionary, invisible above the storage layer — and only if E2 shows the full-identity bundle is otherwise unaffordable. (Position; the underlying numbers VERIFIED from the review, the judgment PLAUSIBLE.)

### 5.4 `positionSeq` — the invented cache primitive (reserve in E2)

**Problem:** a gate (or client) that resolved a position once should not pay K probes to learn "nothing changed." A cached winner cannot be revalidated by re-checking the winner alone: a *higher-tier* principal may have claimed since (new candidate), or the winner may have been revoked, or an existing claimant may have re-asserted. `claimantCount` catches only the first; `max(order)` and claim counts are unsound revision tokens ([review §15.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md), adopted as the FS cache law).

**Mechanism:** the kernel maintains one word per touched semantic position:

```text
positionSeq[semanticPositionId] : uint64   // bumped on EVERY admission, revocation,
                                           // or supersession that touches any (author, position) slot
```

Revalidation of any cached `(planId, position) → winner` result:

```text
valid ⇔ positionSeq unchanged ∧ planId/policyVersion unchanged
         ∧ (requireActivePrincipal ⇒ winner's IdentityState epoch unchanged)
```

— **3–4 SLOADs ≈ 8.4k cold / ~400 warm**, versus 115–230k for a full 55-entry re-resolve: a ~25× warm-gate lever. (VERIFIED arithmetic; mechanism PLAUSIBLE, needs vectors for every bump path — the invariant "every view-affecting transition bumps" is the whole soundness story, exactly the `viewMutationVersion` invariant the review demanded, delivered at position granularity.)

Costs: one SSTORE bump per position-touching write — ≈ 2.9–5k warm, 22.1k first touch (the slot is usually created alongside the position's first claim). Storage: one word per lifetime-touched position.

Three consumers, one primitive:
1. **Warm gates:** a gate MAY keep `lastResult[position]` in its own storage keyed by `(planId, policyVersion, positionSeq)` — O(1) repeat checks.
2. **Challenge windows (§7.2):** record `(claimId, positionSeq)` at T₀; at T₀+W accept iff `positionSeq` unchanged and winner unrevoked — the whole "did anything move during the window" question in one word. Without `positionSeq`, the window recheck is a full re-resolve (still correct, K-cost).
3. **The client delta anchor:** FS gap G-6 (live-follow invalidation ABI) wants exactly a view-affecting mutation surface; `positionSeq` plus its bump events is the position-granular delta stream the IVM cache architecture consumes ([research §4.1](./research.md); [filesystem-core §6.3](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md)).

Degradation if E2 rejects it: gates re-resolve fully (correct, slower); challenge windows re-resolve; clients fall back to TTL + spine polling (already the labeled interim). Correctness never depends on it — which is what makes it reservable rather than blocking.

How it breaks: a missed bump path (a kernel transition that changes a view without touching `positionSeq`) silently poisons every consumer — this is a *kernel invariant bug class*, so the conformance suite must enumerate every slot-touching transition (admit, revoke, supersede, evidence-promotion, recovery-driven reauthorization) with a bump vector each. Advisory-slot changes bump the *advisory* position's own counter (advisory positions are positions); a gate caching a deny-clean verdict must include the advisory positions' seqs in its key. uint64 monotone: no wraparound in any realistic horizon.

---

## 6. The gas arithmetic — 15 / 55 / 256, and the EIP-7825 fit

Baselines: cold SLOAD 2,100 (EIP-2929); measured-scale rows interpolated from the preserved 07-11 Foundry harness ([review §9.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)) as [research §8](./research.md) did — floors are VERIFIED arithmetic; "realistic" rows are PLAUSIBLE interpolations; the real-kernel E2 matrix gates every freeze-grade claim.

**Transaction cap: EIP-7825 = 16,777,216 gas, live on mainnet since Fusaka 2025-12-03** (VERIFIED, [research §3.1](./research.md)). Fresh chains: discover per-chain caps (EIP-8123 too young to require); treat 2²⁴ as the portable floor.

| Operation | K=15 | K=55 | K=256 | 7825 fit |
|---|---:|---:|---:|---|
| **GATE check, closed set (direct, floor)** | 31.5k | 115.5k | 537.6k | all composable |
| GATE check, realistic (two-phase, worst case) | ≈ 63k | ≈ 230k | ≈ 1.07M | all composable (0.4–6.4% of cap) |
| GATE check, design-center K=5–16 | 10.5–33.6k floor; 30–70k realistic | — | — | trivial |
| **Point read, roster plan (P_v=2)** | ≈ 21–23k | ≈ 21–23k | ≈ 21–23k | K-insensitive; 0.14% of cap |
| Point read, roster plan (P_v=5) | ≈ 30–40k | ≈ 30–40k | ≈ 30–40k | composable |
| **Point revalidation via `positionSeq`** | ≈ 8.4k cold / 0.4k warm | same | same | trivial |
| **64-item directory page, naive two-phase (floor)** | 2.016M | 7.392M | 34.4M | 256: **impossible** |
| 64-item page, naive realistic | ≈ 4.0M | ≈ 14.7M | ≈ 68M | 55: fits with ~12% headroom, **nothing left for the caller → not honestly composable**; 256: impossible |
| 64-item page, roster plan (sparse) | ≈ 1.4M | ≈ 1.4M | ≈ 1.4M | composable (~8–9% of cap) |
| 128-item page, naive realistic | ≈ 8.0M | ≈ 29.5M | ≈ 136M | 55+: **permanently impossible in any transaction on a 7825 chain** |
| Advisory pass (D=3 / D=8) | 18.9k / 50.4k floor | same | same | trivial |
| THRESHOLD 2-of-3 committee | ≈ 6.3k floor, 15–25k realistic | — | — | trivial |
| Plan registration (one-time) | ≈ 0.57M | ≈ 1.64M | ≈ 6.5M | all fit |
| Plan via calldata (per call) | ≈ 12–18k | ≈ 25–35k | ≈ 120–150k | composable |
| `rankOf` membership (binary search) | ≈ 12–20k | ≈ 17–29k | ≈ 20–33k | trivial |

Readings (each falsifiable at E2):

1. **Point reads and gates are comfortable at the whole design center and remain composable at the 256 portable ceiling.** The direct-probe worst case grows linearly (~4.2k measured-scale per added principal per point); nothing cliffs below ~64 entries per position.
2. **Wide contract-native pages die at the cap, not at elegance.** 64×55 naive "fits" only by consuming the transaction; 128×55 can never fit. This converts [review §8.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)'s "should not be promised" into "cannot be delivered" — the Level-3 vocabulary should say so ([research §3.2 item 1](./research.md) concurs). Contract consumers of whole directories use the roster path when sparse, or a materialized/proven snapshot (Level-3 accelerator class), or move to the client tier.
3. **The two levers that matter are the roster (~10× on sparse points/pages, §4.4) and `positionSeq` (~25× on repeat checks, §5.4).** The plan-form choice (stored vs calldata) is a ~30k/call economics question, not a feasibility one.
4. **What breaks past 55, contract-tier restatement:** transaction-native gates stay sane to ~64 entries per position; past that, owner-stored plans over *smaller closed sets*, roster plans on sparse positions, or proof-backed materialized results are the only honest forms. Entries 15→55 barely move the roster path at all; **the real cost axis is `P_v` (lifetime claimants at a hot position), not K** — scale honesty per [research §8 reading 2](./research.md), confirmed here.

---

## 7. The GATE profile

### 7.1 `PRIORITY_FIRST_PRESENT` on-chain — the exact state table

The contract-tier transition table (per plan entry, priority order; consistent with [review §6.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) and FS-LENS/1, restricted to on-chain-observable states):

| Observed at `(entry.principal, position)` | GATE behavior |
|---|---|
| PRESENT, unexpired, authority-admitted, deny-clean | **select and stop** — winner |
| PRESENT but `expiresAt < now` (STALE) | **stop, fail closed** — a freshness fuse never converts into a trust transfer (K6 split, GATE half, carried) |
| EMPTY, never claimed | **fall through** — proven absent at this venue (§3.1) |
| EMPTY via revocation (RELINQUISHED) | plan's `relinquishMode`: `FALLTHROUGH` (overlay scopes) or `STOP` (**GATE default**: STOP_ON_FORMER_AUTHORITY — a revoked publisher must not hand the name to a lower tier) |
| equal-tier entries with different live values | **CONFLICT — fail closed** (no byte-order tie-break authority; a gate wanting ties declares THRESHOLD or a deterministic tie rule in the plan) |
| principal authority unresolvable (§3.4a) | **UNKNOWN — stop, fail closed**; never fall through |
| winner found but advisory hit (§4.3) | **Denied — fail closed**; never re-resolve below the winner |
| candidate page consumed with `incomplete` flag | **revert** — a gate never acts on an incomplete enumeration |

`EXACT(principal)` is the one-entry special case; `THRESHOLD(k,n)` runs over the closed committee Roster, counts each principal once per canonical value digest, requires the committee duplicate-free at registration, and fails closed if unknown/revoked committee evidence could change the outcome ([review §2.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) rules, carried; quorum-intersection `2k > n` recommended for high-assurance plans).

### 7.2 Gate configuration, governance, rollback, and the challenge window

```solidity
struct GateConfigV1 {
    address planRegistry;     // pinned; a gate names its registry deployment
    bytes32 planId;           // the pinned compiled Plan
    uint64  policyVersion;    // strictly monotone; rollback protection
    uint32  acceptMask;       // tuple-axis combinations accepted (authorization grade floor,
                              //  STALE tolerance = none in GATE, relinquish override, active-principal bit)
    uint64  challengeWindow;  // blocks; nonzero ⇒ untrusted-author pattern (below)
    uint8   planForm;         // STORED | CALLDATA_COMMITTED | PROOF (minimum accepted form)
    address governance;       // owner / timelock / governance module — the ONLY update path
}
```

Rules, each traceable to an adopted ruling:

- **Owner-pinned, never caller-supplied.** The resource/gate owner (the risk bearer) pins `GateConfig`; no call parameter can substitute a policy, a plan, or a registry ([review §10.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md); risk-bearer constitutional rule; kill list). A `lens` URL parameter or calldata roster reaching a gate unbound is the §2.2 unauthenticated-table case — rejected structurally.
- **Fail-closed is not configurable.** `acceptMask` can only *narrow* what is accepted (e.g., require `requireActivePrincipal`); there is no permissive bit that converts UNKNOWN, STALE, CONFLICT, Denied, or incomplete into acceptance.
- **Update path = the owner's governance, with rollback protection.** `setPolicy(newPlanId, newVersion)` requires `newVersion > policyVersion` (monotone floor — an old, since-compromised plan cannot be re-installed by replaying an old governance action), executes only via `governance` (direct owner, timelock, or DAO — the deployed Zodiac-Roles precedent: policy changes go through the avatar's own governance, [research §1.2](./research.md)), and SHOULD sit behind a timelock for high-risk gates so subscribers can observe the pending semantic diff. Emergency *removal* of a compromised authority may use a separately declared fast path (monotone security floor: the fast path may only shrink the accepted set — [review §5.4](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) polarity, carried).
- **The two blessed patterns for untrusted authors, per the adopted item-F ruling** ([owner-rulings 2026-07-15](../../Designs/efsv2/owner-rulings.md), consumed as-is — no collision bit, ever):
  1. **Closed trusted author sets** — everything above.
  2. **Challenge window** — for any decision that must consume a claim from an author outside a closed set: at T₀ record `(positionId, claimId, positionSeq)` in gate storage; act at T₀ + `challengeWindow` only if `positionSeq` is unchanged, the claim is unrevoked, and the advisory pass is still clean. The window bounds the timed-equivocation attack exactly as the ruling intends; `positionSeq` makes the recheck O(1) (§5.4); without it the recheck is a full re-resolve (correct, K-cost). The window length is the gate owner's risk parameter; the revocation-censorship floor under adversarial sequencing is the venue's force-inclusion latency — named a security parameter by D-2/P-5r2, evidence-updated by [research §3.4](./research.md) (rollup escape hatches now, FOCIL ≥ Hegotá).
- **What a GATE consumes of the six-part tuple:** authorization ≥ AUTHORITY-ADMITTED (from same-venue receipts; evidence-lane rows are invisible to gate state — lane labels H-1); existence bound = venue-total (native); freshness = venue clock + `expiresAt`, STALE never consumable; availability = state-resident inputs only; slot state per §7.1; completeness = total or revert. The *facts* of REVOKED / Denied are consumable as negative evidence (salvage of [read-lens-spec §3.3](../../Designs/efsv2/read-lens-spec.md) item 4).

### 7.3 The raw candidate page (Level 2 surface, for completeness)

The contract tier also exposes the bounded, fair-scheduled, per-author-cursor `candidatePage` over the per-`(parent, principal)` streams exactly as [review §8.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) specifies — returned candidates + per-author cursors + counts + basis, never a sort claim, never entering gate decisions un-total. It exists **for clients and view contracts**, not for GATE consumption (a gate consuming a page must reach positive closure or revert — §7.1 last row). Nothing in this lane modifies its design; it is listed to mark the seam.

### 7.4 How the GATE breaks — the adversarial walk

| Attack | Answer | Honest residual |
|---|---|---|
| Caller supplies its own roster/plan | forms S/C/P all bind to owner-pinned `planId`; unauthenticated tables rejected (§2.2) | none |
| Malicious plan encoding (dup principals, unsorted tiers, unknown tags, truncated principal) | strict decode at registration; negative vectors | none |
| Stale-plan attack: pinned plan contains a since-compromised principal | layered: KEL revocation empties the slots (empty-on-revoke) → STOP mode fails closed; advisory reject layer; `requireActivePrincipal` catches disputed/recovering principals; governance update + monotone `policyVersion` retires the entry | window between compromise and revocation admission — bounded by force-inclusion latency (P-5r2) + grant expiries (the adopted backstop) |
| Replay an old governance action to reinstall an old plan | monotone `policyVersion` floor | none |
| Roster inflation at a hot position (outsider spam) | deterministic fallback past `rosterThreshold` to direct-K; cost regression ~10×, bounded at ~230k @ K=55; truth unchanged (complete-roster invariant) | griefer pays gas forever; gate pays the direct bound |
| Gas griefing via huge advisory rosters / plans | registration bounds (`MAX_PLAN_ENTRIES`, advisory budget per rule); costs are plan-committed, not input-dependent | none |
| Revocation race inside a challenge window (sign-good → wait → revoke/re-assert) | `positionSeq` recheck at T₀+W catches any movement; any change aborts | attacker can force aborts (DoS of the *decision*, priced at their gas), never a wrong acceptance |
| Sequencer suppresses the revocation during the window | the D-2 bound: window ≥ venue force-inclusion latency is the gate owner's safe parameterization; fixed grant expiries backstop | floorless venues leave an unbounded window — exactly why P-5r2 makes this a venue-acceptance parameter |
| Timed equivocation against a closed-set gate | closed sets make it moot (the trusted author's *latest admitted* state is the answer; equivocation by your own trusted author is lens-level distrust, not gate machinery) — the adopted item-F wording | a gate trusting a hostile author is a policy error surfaced by ceremony, not preventable by the kernel |
| Micro-cache poisoning (gate's `lastResult` reused across policy change) | cache key includes `(planId, policyVersion, positionSeq, advisory positionSeqs)` | a gate omitting a key component is a consumer bug; SDK templates own the pattern (R-CR3) |
| Plan wedged by a foreign-homed / unresolvable principal | deterministic fail-closed (§3.5); pin-time `eth_simulateV1` dry run catches it before deployment | an owner who skips the dry run ships a wedged gate — loud, safe, embarrassing |

---

## 8. What the contract tier explicitly does NOT do — and the exact seam

The contract tier **never**:

1. **Compiles.** No imports, no channels, no scope intersection, no group expansion on-chain. The chain sees only flat, canonical, pre-compiled Plans. (Compilation is the client pipeline, §5.1.)
2. **Follows anything mutable.** A gate pins `planId`; it never dereferences a lens channel, a `FOLLOW_CHANNEL` reference, or a "latest" pointer of any kind. Channel state (`channelAnchorSummary`) is client-consumed for subscription ceremony; a gate that wants a curator's updates gets them through its governance adopting a new `planId` — deliberately a human/governance act, never an automatic follow ([review §4.4](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) channel machinery stays client-tier; seam-8 KEL-reuse ruling untouched here).
3. **Runs rich combiners.** `UNION_SET`, `ONLY_ONE`, `MERGE`, discovery rules, WHITEOUT masking, and import semantics are client-tier. (ONLY_ONE over a closed roster is implementable if a real consumer appears; deliberately not in v1 vocabulary — P-CORE-7.)
4. **Serves big sets or sorted pages.** ≥ ~64 entries per position ⇒ proofs/materialized snapshots; sorted/top-N contract pages are not promised and (past 64×55) not deliverable (§6). Silent truncation exists nowhere; over-budget fails typed.
5. **Crosses venues.** Cross-realm reads are client-composed basis vectors; foreign facts enter a gate only via explicit, disclosed, owner-pinned adapters (P-3a/P-4; §3.6).
6. **Touches personal policy.** Personal lenses are private by default (seam 12); nothing personal ever needs registration. Only deliberately published Plans (gate plans, curator Rosters) reach the chain — and genesis ships none.
7. **Reads file bytes, history, or logs.** State-resident current state + receipts only (§3's last rule).

**The seam, stated once:** *the contract tier produces exact point winners, bounded raw candidate pages with cursors, keyed advisory verdicts, membership/rank answers over registered Rosters, monotone version words, and admission receipts — all at venue-total grade at the executing block. The client tier consumes those primitives plus snapshots from its own node, and owns composition, imports, channels, full grades, big sets, deny/whiteout richness, sorting, materialization at a pinned basis, cross-realm assembly, receipts, and every human ceremony.* Anything that cannot be stated as a bounded keyed read against current state is on the client side of the seam by definition — which is The Line, applied to lenses ([onchain-completeness §6](../../Designs/efsv2/onchain-completeness.md)).

ENHANCED-tier note (for the map, not designed here): ZK-coprocessor-proven resolved views are the one accelerator that re-enters contract consumption for big pages/cross-chain/history — verify-gas ≈ 250–500k sits between the roster point (23k) and the naive page (14.7M), so the crossover is page-scale only; no base feature may require it (fresh L3s have no prover coverage) — [research §2](./research.md), consumed as the Phase-5 boundary.

---

## 9. Reservations and handoffs out of this lane

| To | Item |
|---|---|
| **E2 bundle (measured)** | claimant roster (§4.4, lean adopt); `positionSeq` (§5.4, adopt-if-priced); packed slot-head getter ABI; ordinal shelf (§5.3, default NO); registration-cost row for the PlanRegistry prototype |
| **Phase-1 conformance program** | Plan wire grammar vectors (positive + the §2.2 negative set); two-compiler `planId` reproduction (Cedar-style differential method); `canonicalBytes` round-trip vector; §7.1 state-table vectors at K=1/5/15/55 with winner-at-each-rank / all-absent / all-revoked / STALE-rank-1 / equal-tier-conflict / unresolvable-rank-1 |
| **Kernel recut (G-C)** | `positionSeq` bump-path invariant enumeration (every slot-touching transition); atomic roster-append invariant; lane labels on all gate-readable indexes (H-1); authority-axis ABI consumption shape (H-2) |
| **Client/RICH lane** | the seam contract (§8); `positionSeq` as the G-6 delta anchor; plan-form economics for SDK defaults; pin-time dry-run + semantic-diff ceremony |
| **GATE-profile lane (package/install)** | GateConfig as the base shape; THRESHOLD committee profile; challenge-window parameterization guidance (P-5r2 coupling) |
| **Naming (pass synthesis)** | Roster / Plan / GATE adoption (P-CORE-1); "View" untouched (client-tier object) |

Open items this lane leaves deliberately unanswered: exact `MAX_PLAN_ENTRIES` (E6-coupled; candidate 256); `rosterThreshold` default (benchmark-set); whether an indexed-registration variant (O(1) `rankOf`) ships (needs a hot cross-contract consumer); THRESHOLD quorum-intersection as default vs option.

---

## 10. How the whole tier breaks — the residual honesty list

Beyond §2.3/§5.4/§7.4's specific attacks, the standing structural residuals:

1. **A gate is only as good as its owner's ceremony.** Every protection here (pins, diffs, dry runs, timelocks) is defeated by an owner who pins an unreviewed `planId`. Surfaced, not solved — the same lesson as curator subscription (FS-LENS/1 §1.5).
2. **Closed sets move the risk into membership.** The adopted item-F pattern means the security question becomes "who is on the Roster" — which is exactly where the design wants it (explicit, diffable, governed), but a compromised committee is invisible to the kernel by construction.
3. **Century aging degrades the roster lever, not correctness** (§4.4): hot public positions drift toward the direct-K bound as lifetime rosters grow. The §7.1G current-live/compaction decision is the system-wide answer; this tier's contribution is that its worst case is K-bounded and stable forever.
4. **The pre-revocation window is irreducible** at this tier as everywhere: a stolen key's claims admitted before revocation are genuinely authorized-at-admission. Grant expiries + advisory layers + challenge windows bound consumption; nothing erases admission.
5. **Every number here except the 2,100-floor arithmetic is pre-E2.** No freeze-grade cost claim survives this file without the real-kernel matrix ([review §9.4](../2026-07-11-efsv2-lens-architecture-and-scale-review.md); owner-rulings 2026-07-23: "none of the chain/authority space is measurement-backed").

---

## 11. Confidence

**VERIFIED (against named files/computations this pass):** the three-form plan model, slice commitment, and unauthenticated-table rule ([review §4.3](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)); the adaptive point algorithm and identical-semantics rule (review §8.1); the roster completeness invariant (review §7.1B); the four absence sources and source-1 mapping ([FS-LENS/1 §1.7](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md) + rails); the adopted item-F wording, mandatory-index bundle, spine/no-elision, contracts-read-public-only, and genesis-no-default-lens rulings ([owner-rulings](../../Designs/efsv2/owner-rulings.md), [read-lens-spec P13](../../Designs/efsv2/read-lens-spec.md)); the co-residency and cross-realm promises as packet arms P-3/P-4 ([owner-decision-inbox](../../Designs/efsv2/owner-decision-inbox.md)); EIP-7825 live value and Fusaka date, EIP-2929 prices, Zodiac/Story/CCIP precedents ([research §§1,3](./research.md)); all gas *floors* (pure arithmetic shown); the LC-9 gate consumer table and 1–16 design center ([use-pressure §1.2/§2.2](./use-pressure.md)); kel §7/§8 grant/receipt shapes consumed.

**PLAUSIBLE (constructed here; vectors/benchmarks are the check):** every "realistic" gas row (linear interpolation of the isolated 07-11 harness — excludes writes, calldata intrinsics, deny/expiry logic, real kernel layout); the packed storage layout and its 74-slot count; the periphery-registry claim (needs a contracts-lane check on receipt dependencies); the `positionSeq` mechanism and its bump-path completeness; the binary-search `rankOf` costs; the §4.5 completeness claim ("two Etched words is the whole ask"); the P-CORE-4 and P-CORE-5 positions; the §7.1 state table's restriction being lossless for GATE purposes; the challenge-window/`positionSeq` synergy.

**Could not verify:** any real-kernel gas number (E1/E2 open); whether the kernel can maintain the roster's atomic append and `positionSeq`'s bump invariant without confluence-boundary complications in the two-lane admission design (kel §8.3 — a kernel-lane check is owed); the final authority-lane receipt ABI this tier reads (H-2 fixed input, wire shape pending); EIP-7623 interaction with plan-calldata pricing at the margins; whether `MAX_PLAN_ENTRIES = 256` survives E6.

**Pushback:** none required — no adopted ruling is contradicted. One steer-adjacent note, recorded not pushed: the steer's "first-trusted-wins … deny-capable" contract tier is delivered, but the *deny* half at this tier is deliberately only keyed point-advisory (O(D)); anything richer (label taxonomies, action tables per viewer) is client-tier — if a future gate class needs richer on-chain advisory semantics, that is a new E-priced surface, not a stretch of this one.
