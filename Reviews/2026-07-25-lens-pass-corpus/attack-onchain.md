# Red team — ON-CHAIN CORE + OBJECT ENCODING (prefix AO)

**Lane:** RED TEAM / ATTACK (dedicated EFS v2 lens/resolver pass, gap G-A of the [2026-07-25 joined pass](../../Designs/efsv2/joined-pass-synthesis.md))
**Targets under attack:** [core-onchain.md](./core-onchain.md) and [object-taxonomy.md](./object-taxonomy.md), read in full. Sibling lanes read for the consistency sweep: [profiles-composition.md](./profiles-composition.md), [views-links.md](./views-links.md), [research.md](./research.md), [use-pressure.md](./use-pressure.md).
**Job:** break the design, not improve it. Every finding carries severity, a concrete attack narrative (actor / steps / payoff), the exact lane text it kills, and — only after the break is established — the cheapest repair I can see, explicitly labeled **SUGGESTION** (a suggestion is not a fix-up of my own finding; the lane owner owns the repair).
**Marking:** **VERIFIED** = I traced the exact text/mechanism/arithmetic in a named file. **PLAUSIBLE** = constructed; needs vectors or a benchmark.
**Rails checked:** all adopted rulings, the kill list, the six-part tuple, the four PROVEN-ABSENT sources, no-collision-bit, contracts-consume-public-only, chains-don't-die, FS-LENS/1 settled, genesis-ships-no-default-lens. Nothing below asks to reinstate a killed item; §7 records where the *lanes* brush against one.

#status/draft #kind/review #repo/planning #topic/lenses #topic/onchain #topic/redteam #topic/efsv2

---

## 0. Verdict and finding index

The contract tier does not currently exist as one object. **Two lanes shipped two different, mutually incompatible on-chain lens artifacts** — a CBOR-decoded `PlanV1` with a Solidity decoder ([core-onchain §2.1–2.3](./core-onchain.md)) and a packed `RosterV1` whose stated premise is that *no contract ever parses CBOR* ([object-taxonomy §2.1–2.2](./object-taxonomy.md)) — and both claim the same job, the same name (`Roster`), and different caps, vocabularies, widths, and ID formulas. Everything downstream (proof binding, gas, conformance vectors, the freeze ask) inherits that fork.

Underneath the fork, the seven breaks that produce **wrong answers or permanent wedges** are: a slice proof that proves membership but not priority-prefix completeness (AO-2); a plan registry that is *trusted*, never verified, at the centre of every gate (AO-3); a roster/direct plan pair whose semantics genuinely differ and whose selector is attacker-inflatable (AO-4); a `positionSeq` revalidation predicate that omits expiry and higher-tier principal status, so a cached gate serves an accept the fresh rule forbids (AO-5); a challenge-window recheck whose token is so coarse that one write per window is a permanent, cheap liveness veto — and organic churn alone breaks it (AO-6); and unbounded record bodies on the gate read path (AO-7).

The gas chapter does not survive independent recomputation: **the headline roster point-read number belongs to a data structure the lane rejected**, and was measured with the plan in *calldata*, not in storage (AO-11). Corrected, the roster lever is ~2–3×, not ~10×, at the single-point gate case that this whole tier exists to serve.

| # | Severity | Finding (one line) | Target text | Grade |
|---|---|---|---|---|
| AO-1 | **FATAL** | Two incompatible contract-tier objects; the CBOR-on-chain path re-opens a two-decoder ceremony divergence the sibling lane closed | [core-onchain §2.1–2.3](./core-onchain.md) vs [object-taxonomy ENC-1/2](./object-taxonomy.md) | VERIFIED |
| AO-2 | **FATAL** | Form-P "membership/order proof" proves inclusion, not prefix completeness → caller picks the winner while claiming a `planId` | [core-onchain §2.2](./core-onchain.md), §7.4 row 1 | VERIFIED |
| AO-3 | **FATAL** | `GateConfig` pins a registry *address* with no codehash and never verifies `planId` against bytes → the registry is a trusted third party in every gate | [core-onchain §2.3, §7.2](./core-onchain.md) | VERIFIED |
| AO-4 | **FATAL** | Roster plan and direct plan do **not** have identical semantics; the selector `P_v` is outsider-inflatable → attacker chooses which semantics run | [core-onchain §4.2](./core-onchain.md) | VERIFIED |
| AO-5 | **FATAL** | `positionSeq` revalidation is unsound: no expiry component, no higher-tier principal-status component → cached ACCEPT where fresh resolution must fail closed | [core-onchain §5.4](./core-onchain.md) | VERIFIED |
| AO-6 | **FATAL** | Challenge-window recheck keyed on `positionSeq` = permanent cheap liveness veto; organic churn alone breaks the pattern at D-2-sized windows | [core-onchain §7.2, §7.4](./core-onchain.md) | VERIFIED |
| AO-7 | **FATAL** | Unbounded record bodies on the gate path; `THRESHOLD` "canonical value digest" is either gas-unbounded or semantically dead | [core-onchain §7.1, §3.3](./core-onchain.md) | VERIFIED (gap) / PLAUSIBLE (cost) |
| AO-8 | SERIOUS | Equal-tier CONFLICT vs the early-exit cost model → grindable principal bytes become authority | [core-onchain §5.2 vs §7.1](./core-onchain.md) | VERIFIED |
| AO-9 | SERIOUS | `requireActivePrincipal` + fail-closed = any listed principal can unilaterally wedge every gate that names it | [core-onchain §3.4a, §7.1, §7.2](./core-onchain.md) | VERIFIED |
| AO-10 | SERIOUS | `GateConfigV1` binds no kernel realm/codehash and never checks `semanticsProfileId` at runtime | [core-onchain §7.2](./core-onchain.md) | VERIFIED |
| AO-11 | SERIOUS | The gas chapter: floors are not floors, the roster point row is a page-amortized calldata-plan number, the 256 slot count is wrong, indexed registration at 256 breaks EIP-7825 | [core-onchain §2.4, §5.2, §6](./core-onchain.md) | VERIFIED |
| AO-12 | SERIOUS | Seam 8 is **not** closed: `ADOPT` is control-grade authority exposed at grant grade — a stolen scoped admin can un-contest a fork it created | [object-taxonomy §4.3–4.4](./object-taxonomy.md) | VERIFIED |
| AO-13 | SERIOUS | Recovery-bundle rollback detection assumes closure the restoring device provably cannot have; the adopted D-13 durable counter is not consumed | [object-taxonomy §3.2–3.4](./object-taxonomy.md) | VERIFIED |
| AO-14 | SERIOUS | The permissionless registry is a *confirmation oracle* for the membership dictionary attack PP-2 warns about, and will happily publish someone else's personal slice forever | [core-onchain §2.3, §8.6](./core-onchain.md) vs [object-taxonomy PP-2](./object-taxonomy.md) | VERIFIED |
| AO-15 | SERIOUS | "Costs are plan-committed, not input-dependent" is false: advisory/deny fan-out has no stated bound, and the roster path's cost is venue-state-dependent | [core-onchain §4.3, §7.4](./core-onchain.md) | VERIFIED |
| AO-16 | SERIOUS | "KEL revocation empties the slots" is wrong — actor removal is prospective; the first layer of the stale-plan defense does not exist | [core-onchain §7.4](./core-onchain.md) vs [kel §7.3](../../Designs/efsv2/kel.md) | VERIFIED |
| AO-17 | NOTE | Two ID derivations for one object family inside one file (single-hash vs double-hash) | [object-taxonomy §2.2 vs §2.5](./object-taxonomy.md) | VERIFIED |
| AO-18 | NOTE | `effect = DENY_SOURCE` carries no `labelDefinitionId` → the Roster's deny capability is unimplementable as specified | [object-taxonomy §2.2](./object-taxonomy.md) | VERIFIED |
| AO-19 | NOTE | "There is no encoding malleability class at all" is unearned — it is a claim about the payload, asserted about the frame | [object-taxonomy §2.2, §2.9](./object-taxonomy.md) | VERIFIED (claim) / PLAUSIBLE (exploit) |
| AO-20 | NOTE | `positionSeq` write amplification: a 100-record envelope pays ~100 SSTOREs, not the quoted per-position figure | [core-onchain §5.4](./core-onchain.md) | VERIFIED |
| AO-21 | NOTE | The client delta stream is described as `positionSeq` **plus its bump events** — logs are not a query API under the adopted rail | [core-onchain §5.4](./core-onchain.md) vs [onchain-completeness §0](../../Designs/efsv2/onchain-completeness.md) | VERIFIED |
| AO-22 | NOTE | Non-critical extensions do not change `EffectiveLensId` → a hostile republication is byte-identical in semantics and free to relabel | [object-taxonomy §2.3–2.4](./object-taxonomy.md) | VERIFIED |
| AO-23 | NOTE | `acceptMask: uint32` vs `AcceptanceMatrixV1`: the "can only narrow" property is unstated, unencoded, and unverifiable | [core-onchain §7.2](./core-onchain.md) vs [profiles-composition §3.2](./profiles-composition.md) | VERIFIED |
| AO-24 | NOTE | Form C vs form S break-even (~45–50 calls) compares a measured calldata cost to an unmeasured storage cost and is unbounded in the worst case | [core-onchain §5.2](./core-onchain.md) | VERIFIED |

Consistency-only items (no attack of their own) are AO-C1…AO-C9 in §7.

---

## 1. FATAL findings

### AO-1 — The pass shipped two contract-tier objects, and the surviving one re-opens the malleability class the other killed

**VERIFIED.**

**The text.** [core-onchain §2.1](./core-onchain.md): `canonicalPlanBytes` is "the strict deterministic-CBOR fixed-array profile … restricted to the contract-tier vocabulary", and [§2.3](./core-onchain.md)'s registry entry point is `register(bytes calldata canonicalPlanBytes)` with "strict decode; explodes entries into contiguous storage". That is a deterministic-CBOR decoder **in Solidity, at the trust boundary**.

[object-taxonomy ENC-1/ENC-2](./object-taxonomy.md) rules the exact opposite and argues it: "a Solidity CBOR parser is per-byte gas plus a fresh attack surface (every strictness rule in review §4.2 becomes on-chain code)"; the Roster is "the ONLY lens-family byte format a contract decodes"; "no contract ever parses" the CBOR forms.

They are not two views of one object. Side by side:

| | `PlanV1` ([core-onchain §2.1](./core-onchain.md)) | `RosterV1` ([object-taxonomy §2.2](./object-taxonomy.md)) |
|---|---|---|
| encoding | deterministic CBOR, variable length | packed fixed layout, `96 + 64·N` exactly |
| decoded on-chain by | the registry | any gate, by calldata slicing |
| combiners | 3 (`EXACT`, `PRIORITY_FIRST_PRESENT`, `THRESHOLD`) — "CLOSED" (P-CORE-7) | 5 (adds `UNION_SET`, `ONLY_ONE`) |
| entries | `MAX_PLAN_ENTRIES` candidate **256** | `1 ≤ N ≤ 64`, hard |
| effect / flags width | `uint8` / `uint8` | `uint16` / `uint16` |
| carries | `semanticsProfileId`, `relinquishMode`, `requireActivePrincipal`, `advisoryRules`, `rosterThreshold` | none of those except `relinquishMode` |
| ID | `keccak256(DOMAIN_EFS_PLAN_V1 ‖ bytes)` | `keccak256(DOMAIN_EFS_ROSTER_V1 ‖ bytes)` |
| storage at K=55 | 74 slots ≈ 1.64M gas | 113 slots ≈ 2.5M gas |
| bytes/entry | 36 | 64 |

Both files also use the word **Roster** for different objects: [core-onchain §1](./core-onchain.md) defines Roster as the entry list only and Plan as "Roster + combiner + scope + modes"; [object-taxonomy §1.1/§2.2](./object-taxonomy.md) defines Roster as the whole thing — combiner, purposeId, scopeId, relinquish mode included. The pass's flagship naming deliverable contradicts itself in its two authoring lanes.

**The attack this fork enables (the part that is not merely bookkeeping).** Actor: anyone who can get a gate owner to pin a plan (a curator, an app-store operator, or a phisher exercising the look-alike-plan path [core-onchain §2.3](./core-onchain.md) already names).

1. The ceremony that defends against a hostile plan is, verbatim, "the SDK's pin flow renders the full semantic diff against the intended source lens … `planId` is never hand-typed" ([core-onchain §2.3](./core-onchain.md)).
2. That diff is produced by the **client** decoder (Rust/TS). The bytes are stored by the **Solidity** decoder inside `register()`.
3. Deterministic-CBOR strictness is a long list — preferred-shortest arguments for *every* integer and *every* string/array length, definite lengths only, no tags/floats/maps, sorted-set order, trailing-byte rejection, unknown-critical failure ([review §4.2 rules 1–10](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)). A Solidity implementation that is lax on any one of them (a non-shortest length in a nested array; a permitted trailing byte inside a slice; a mis-scoped sortedness check on `(tier, principal)`) accepts bytes the client normalizes differently.
4. Craft bytes `B` such that client-decode yields roster *R* (the diff the human approves) and chain-decode yields *R′* (attacker at tier 0, or attacker's principal promoted above the owner). Both hash to the same `planId` — content addressing does not help here, because the divergence is *semantic*, not identity-level.
5. Payoff: the gate executes a roster the owner never saw and never approved. It is the review's own threat row — "caller substitutes compiled slice: call claims one `EffectiveLensId` while executing another rank table" ([review §15](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)) — arriving through the registration door instead of the calldata door.

**What it kills.** [core-onchain §2.9-equivalent claim](./core-onchain.md) that malicious encodings are answered by "strict decode rejects; golden negative vectors"; [object-taxonomy §2.9](./object-taxonomy.md)'s "there is no encoding malleability class at all" (true of `RosterV1`, false of the system as the two lanes jointly specify it); and P-CORE-2's "one canonical byte encoding, three delivery forms".

**Cheapest repair (SUGGESTION, not a fix-up).** Two independent moves, either of which closes the *attack*; the *fork* needs an owner-level pick:
- Make `register()` self-checking: decode, re-serialize canonically, and `require(keccak256(reserialized) == keccak256(input))`. Laxity then becomes unexploitable because any accepted-but-noncanonical byte fails the round trip. [core-onchain §2.3](./core-onchain.md) already declares `canonicalBytes()` "the round-trip conformance surface" but never enforces it at the boundary where it would matter.
- Or adopt ENC-2 for the contract tier outright and delete the on-chain CBOR path, keeping CBOR strictly client-side as [object-taxonomy ENC-1](./object-taxonomy.md) rules. This is the cheaper of the two and is the sibling lane's own argument.

---

### AO-2 — Form P proves membership; `PRIORITY_FIRST_PRESENT` needs prefix completeness

**VERIFIED.**

**The text.** [core-onchain §2.2](./core-onchain.md), delivery form **P**: "the few needed entries + Merkle membership/order proof", best for "large plans (≥ 64 entries) where the check touches few entries". [§7.4](./core-onchain.md) then answers "Caller supplies its own roster/plan" with "forms S/C/P all bind to owner-pinned `planId`; unauthenticated tables rejected (§2.2) — **residual: none**".

**The break.** Binding an entry to a `planId` proves *that entry is in the plan*. The combiner's answer depends on a different fact: **that no higher-priority entry in the plan is PRESENT**. A resolver that is handed entries `{e_r}` plus inclusion proofs cannot know whether entries `e_0 … e_{r-1}` exist, let alone whether they were probed.

Actor: any caller of a gate that accepts form P (an installer, a mint, an escrow release).
Steps: (1) read the plan; (2) find the entry you control, or any entry that resolves in your favour, at rank *r*; (3) supply only that entry with a valid membership proof, omitting ranks 0…r−1 — several of which are PRESENT with different values; (4) the gate verifies membership ✓, walks the entries it was given, and selects yours.
Payoff: the caller chose the winner for a decision that "claims" the owner's pinned `planId`. Fail-closed never fires — the gate believes it completed a priority walk.

The correct primitive is a **complete-prefix / positional proof**: the supplied entries are exactly indices 0…r in canonical order (and, for the all-absent case, that r+1 = entryCount). That changes the economics that justify form P: at K=55 a full-prefix proof of 55 entries at "≈ 5–8k per proven entry" ([core-onchain §2.2](./core-onchain.md)) costs **275–440k**, i.e. *worse* than the direct stored walk the form was meant to beat. The advertised advantage of form P exists only in the unsafe variant.

Note the sibling lane does not have this hole: [object-taxonomy ENC-3](./object-taxonomy.md)'s `sliceCommitment` leaves are `keccak256(sliceKey ‖ RosterId)` — a whole Roster per slice, so nothing sub-Roster is provable and nothing sub-Roster can be substituted. That asymmetry is another face of AO-1.

**What it kills.** The "residual: none" cell in [core-onchain §7.4](./core-onchain.md) row 1; form P's cost column in §2.2; and the P-CORE-2 claim that all three delivery forms "round-trip to the same `planId`" *with the same semantics*.

**SUGGESTION.** Delete sub-plan proofs from the v1 contract vocabulary (form P becomes whole-slice-with-proof, exactly `RosterId` under `sliceCommitment`), or specify form P as an ordered-prefix proof with an explicit `firstPresentIndex` claim and a stated per-entry cost that reflects it. Vectors: "prove rank 7 only, ranks 0–6 present" must revert.

---

### AO-3 — The PlanRegistry is trusted, not verified — a trusted third party inside every gate decision

**VERIFIED.**

**The text.** [core-onchain §7.2](./core-onchain.md): `GateConfigV1 { address planRegistry; bytes32 planId; … }` — "a gate names its registry deployment". [§2.3](./core-onchain.md): the registry is "periphery, redeployable"; "a lost/redeployed registry is re-populated by anyone re-submitting the same bytes to the same `planId`s"; "gates pin `(registryAddress, planId)` themselves"; therefore "the registry consumes **no Etched freeze surface**".

**The break.** `planId` is a hash of bytes, but **nothing in the read path ever verifies that the registry's answer hashes back to `planId`.** The gate calls `planHeader(planId)`, `entryAt(planId, i)`, `rankOf(planId, p)` and trusts the return values. A registry contract is free to return anything for any id. Consequences, in ascending severity:

1. **Upgradeable registry = meaningless pin.** The lane markets redeployability; nothing forbids a proxy. An owner pins `(R, planId)`; the operator of `R` upgrades the implementation; `entryAt(planId, 0)` now returns the attacker's principal. `policyVersion` does not move, the timelock does not fire, the semantic diff was rendered months ago. **Actor:** whoever controls `R`'s upgrade key (or its governance). **Payoff:** silent, total capture of every gate pinned to `R`, with no on-chain evidence at the gate.
2. **Registry-address phishing has full effect.** The look-alike defense in §2.3 is aimed at look-alike *plans*; a look-alike *registry* is strictly stronger (one address, all plans) and gets no ceremony at all.
3. **This is a trusted indexer in the no-Graph sense.** The adopted rail ([onchain-completeness §6](../../Designs/efsv2/onchain-completeness.md)) is that a capability is on-chain-complete only when a bounded reader answers it *from state it can check*, not from a party that answers quickly. A contract that answers "what is plan P?" without a verifiable binding is exactly the shape the rail exists to exclude — it merely happens to be an EVM contract instead of a GraphQL endpoint.

The lane's own precedent discipline shows it knows the fix and did not apply it to itself: the review's `VenueRefV1` carries `kernelRuntimeCodehash` **and** `kernelImplementationCommitment`, with the explicit rule "for a proxy or modular kernel … the proxy shell's runtime hash alone is insufficient. A kernel upgrade therefore creates a new venue reference" ([review §4.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)). `GateConfigV1` carries an address.

**What it kills.** P-CORE-2's "the registry costs the freeze nothing" (it costs the *trust model* something, which is worse); §7.4's "Caller supplies its own roster/plan → residual: none"; and §2.3's argument that content addressing makes the registry safely disposable.

**SUGGESTION.** Add `bytes32 registryCodehash` to `GateConfigV1` and check `EXTCODEHASH` on every consumption (100 gas warm), plus a pin-time one-shot `require(keccak256(DOMAIN ‖ registry.canonicalBytes(planId)) == planId)` executed inside `setPolicy` (paid once per pin, O(K) reads). Better still, state a MUST: **a registry deployment used by a gate is non-upgradeable, and `register()` is the only state-writing entry point.**

---

### AO-4 — The two execution plans do not have identical semantics, and an outsider picks which one runs

**VERIFIED (from the lane's own pseudocode).**

**The text.** [core-onchain §4.2](./core-onchain.md), with the rule "both paths return identical semantics ([review §8.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md), rule carried)":

```text
if rosterAvailable && P_v > 0 && P_v <= plan.rosterThreshold:
    for i in 0..P_v-1: p = kernel.claimantAt(...); (present,…) = registry.rankOf(planId, p)
        if present: candidates.push(...)
    walk candidates in order …
else:
    for i in 0..K-1: (p,…) = registry.entryAt(planId, i); s = kernel.slotHead(p, position) …
```

**The break.** The roster path consults **only principals that have claimed**. The direct path consults **every plan entry in priority order** and applies the [§7.1](./core-onchain.md) state table to each — including the row "principal authority unresolvable (§3.4a) → **UNKNOWN — stop, fail closed**; never fall through", and the `requireActivePrincipal` recheck the pseudocode applies "per consulted principal".

So take a plan whose tier-0 entry is a principal that is unresolvable or non-ACTIVE and has never claimed at this position:
- **Direct path:** entry 0 is probed, its authority is unresolvable → UNKNOWN → the gate fails closed (this is the design intent — [§3.5](./core-onchain.md): "a GATE Plan must contain only principals resolvable at GATE grade on this venue, or the plan wedges deterministically").
- **Roster path:** entry 0 is absent from the claimant roster, is never consulted, and the tier-2 winner is returned. **Accept.**

Same plan, same position, same block: one path refuses, the other accepts. That is not a cost difference; it is a security difference, and it points the wrong way (the cheaper path is the permissive one).

**Now make it attacker-controlled.** The selector is `P_v <= plan.rosterThreshold`, and `P_v` is the venue's *lifetime* claimant count, which outsiders can inflate — the lane says so itself ([§4.4](./core-onchain.md): "Outsider roster inflation is a priced griefing lever"; [review §8.6](../2026-07-11-efsv2-lens-architecture-and-scale-review.md): "outsider Sybils can inflate the shared lifetime claimant roster … and force the resolver back toward `K` direct probes"). The lane treats that as a *cost* regression. It is also a **semantics** switch:

Actor: anyone with gas and a handful of principals.
Steps: (1) identify a gate whose plan lists a principal that is currently unresolvable/pending-recovery/deactivated above the usual winner; (2) push `P_v` above `rosterThreshold` with distinct-principal claims at that position; (3) the gate flips to the direct path and wedges permanently until governance (timelocked) updates the plan.
Or the mirror image: keep `P_v` low (do nothing) so a gate that *should* be failing closed on an unresolvable tier-0 authority keeps accepting a lower-tier winner. Payoff: a chosen accept/deny on a gate you do not control, or a permanent DoS of a deadline-bearing decision (escrow release, poll close, install).

**Second, quieter break in the same place.** The roster path's correctness rests on "complete-by-construction" atomic append ([§4.2](./core-onchain.md), [review §7.1B](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)). An *omission* — a kernel transition that creates a slot without appending, a migration, an upgrade — is undetectable: the guard offered is "any count/page inconsistency fails closed", but an omitted claimant produces a perfectly consistent count. And under [core-onchain §3.1](./core-onchain.md) that empty roster read is asserted to be PROVEN-ABSENT **source 1** ("own-node total state"). An index-completeness invariant is being laundered into an absence proof; the four-source rule was written to prevent exactly that class of laundering ([FS-LENS/1 §1.7 FSP-ABSENT-2](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md)).

**What it kills.** [core-onchain §4.2](./core-onchain.md)'s "both paths return identical semantics"; the §4.4 framing of roster inflation as cost-only ("cost regression ~10×, never wrongness"); §7.4's roster-inflation row ("truth unchanged"); and P-CORE-3's mapping of an empty kernel read to absence source 1 *for roster-derived absence*.

**SUGGESTION.** Make the roster path a strict *candidate accelerator*, never an entry-set substitute: after the roster intersection, still evaluate every plan entry ranked **above the roster-derived winner** (that is ≤ r entries, so the lever survives for the common r=1–3 case) for unresolvable-authority/active-status. And state the invariant that grounds roster absence as a *kernel* obligation with its own vector family, distinct from the state read.

---

### AO-5 — `positionSeq` revalidation is unsound: nothing in the predicate notices time or a higher-tier principal going dark

**VERIFIED against the lane's own §7.1 rules and [review §15.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md).**

**The text.** [core-onchain §5.4](./core-onchain.md):

```text
valid ⇔ positionSeq unchanged ∧ planId/policyVersion unchanged
         ∧ (requireActivePrincipal ⇒ winner's IdentityState epoch unchanged)
```

with "**3–4 SLOADs ≈ 8.4k cold / ~400 warm**, versus 115–230k for a full 55-entry re-resolve: a ~25× warm-gate lever", and consumer 1: "a gate MAY keep `lastResult[position]` in its own storage keyed by `(planId, policyVersion, positionSeq)` — O(1) repeat checks."

**Break 1 — expiry.** [§7.1](./core-onchain.md) row 2: "PRESENT but `expiresAt < now` (STALE) → **stop, fail closed** — a freshness fuse never converts into a trust transfer". A claim expiring is a pure function of the clock; **no state transition occurs, so `positionSeq` does not bump.** A gate that cached ACCEPT at T₀ revalidates successfully at T₁ > `expiresAt` and acts on a claim its own state table forbids consuming. Actor: nobody — this fires by itself, which makes it worse than an attack; an attacker merely waits for the fuse and then calls the gate. The review's cache vector explicitly ends with "next local expiry/freshness boundary" ([review §15.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)); the lane dropped it.

**Break 2 — higher-tier principal status.** The predicate checks *the winner's* identity epoch. It does not check the entries the walk consulted and found empty. Sequence: at T₀, tier-0 principal A is resolvable and has no claim → fall through → winner = tier-2 principal C → cache. At T₁, A enters pending-recovery / disputed / deactivated (a compromise signal!) **without touching this position** → no `positionSeq` bump, no winner-epoch change → the cache still says ACCEPT, while a fresh resolution under [§7.1](./core-onchain.md) would hit "principal authority unresolvable → UNKNOWN — stop, fail closed". The cache is more permissive than the rule it claims to accelerate, precisely in the situation the rule exists for.

**Break 3 — the advisory tail eats the lever.** The lane concedes in §5.4's break paragraph that "a gate caching a deny-clean verdict must include the advisory positions' seqs in its key." Those positions are `D × |matchKeys|` and **winner-dependent** ([§4.3](./core-onchain.md): D sources × 3 match keys). Recomputed revalidation cost with the advisory tail included:

| Gate shape | Words read to revalidate | Cold gas | vs "8.4k" | vs full re-resolve (§6's 230k) |
|---|---:|---:|---|---|
| no advisory rule | 1 seq + 1 policyVersion + 1–2 identity | ≈ 6.3–8.4k | as claimed | ~27–36× |
| D = 3 (the lane's own design centre) | + 9 advisory seqs | ≈ 27–29k | 3.4× worse | ~8× |
| D = 8 | + 24 advisory seqs | ≈ 57–59k | 7× worse | ~4× |

(VERIFIED arithmetic at 2,100/cold word, EIP-2929.) The "~25× warm-gate lever" is a zero-advisory number quoted as the headline for a profile whose GATE default is `honorStale = true` advisory checking.

**What it kills.** The revalidation predicate in [§5.4](./core-onchain.md) as written; the "~25×" lever; the §7.4 row "Micro-cache poisoning … cache key includes `(planId, policyVersion, positionSeq, advisory positionSeqs)`" (the enumerated key is still missing time and consulted-principal status); and the §5.4 claim that "correctness never depends on it" — correctness of *any gate that uses it* does.

**SUGGESTION.** Add two components and re-price honestly: (a) `minExpiry` — the earliest `expiresAt` among consulted claims, cached alongside, with `block.timestamp < minExpiry` as a predicate conjunct (0 SLOADs, 1 comparison); (b) either forbid caching whenever `requireActivePrincipal` is set and any consulted-above-winner entry exists, or cache the consulted prefix's identity epochs (r extra words). Then restate the lever as "up to ~8× at the D=3 design centre", not 25×.

---

### AO-6 — The challenge window, one of the two blessed patterns, is DoS-able for one write per window — and organic churn breaks it without an attacker

**VERIFIED.**

**The text.** [core-onchain §7.2](./core-onchain.md), pattern 2 (consuming the adopted item-F ruling as-is): "at T₀ record `(positionId, claimId, positionSeq)` in gate storage; act at T₀ + `challengeWindow` only if `positionSeq` is unchanged, the claim is unrevoked, and the advisory pass is still clean." [§7.4](./core-onchain.md) prices the residual as "attacker can force aborts (DoS of the *decision*, priced at their gas), never a wrong acceptance."

**The break — the token is the wrong shape.** `positionSeq` is defined ([§5.4](./core-onchain.md)) to bump on **every** admission, revocation, or supersession touching **any** `(author, position)` slot at that semantic position. The decision-relevant question is far narrower: *did the winner change, get revoked, or did a plan principal ranked above it claim?* By keying the recheck on all activity at the position, the design makes every unrelated claimant a veto.

Actor A (griefer): a spam claim at the position costs one write. The lane's own write-side figure ([§4.4](./core-onchain.md)) is "a write that already costs 50–100k+". On the cheap L3s this design targets, that is cents.
Steps: at T₀+W−ε, write one claim at the position. `positionSeq` bumps. Every gate whose window closes after that instant aborts. Repeat once per window.
Payoff: **a permanent, unilateral veto over every challenge-window decision at that position**, for the cost of one claim per window period, against any number of gates and any number of counterparties. Escrow releases never release; polls never close; installs never install. There is no counter-move inside the pattern: the gate cannot distinguish "hostile equivocation appeared" from "someone wrote something unrelated", because the token deliberately erases that distinction.

**And the non-adversarial half, which is worse.** D-2 makes window length a security parameter: `challengeWindow ≥ venue force-inclusion latency`. [research §3.4](./research.md) dates that honestly — FOCIL slipped to Hegotá (≥2027), so today the number is rollup escape-hatch latency, "hours-to-a-day". Therefore an honest window is ~1 day of blocks. **Any position with more than one organic write per day can never complete a challenge-window decision.** A popular name, a busy container anchor, a shared advisory position: all disqualified by ordinary use.

Combine with the ruling this pattern serves — [owner-rulings 2026-07-15 item F](../../Designs/efsv2/owner-rulings.md): "contracts needing certainty against untrusted authors must use a challenge-window (delay + re-check) pattern" — and the conclusion is sharp: **as instantiated here, EFS has no working gate pattern for untrusted authors at any busy position.** The ruling is not wrong; the instantiation is.

**Third, an extra abort lever nobody has to pay for.** [kel §8.1](../../Designs/efsv2/kel.md) permits an evidence-only claim to be "promoted exactly once after a valid home admission" (D-1's promote-promptly rule). A promotion that creates slot authority touches the slot → bumps `positionSeq` → aborts every open window. Anyone sitting on portable evidence at that position holds a free abort button, exercisable at the moment of their choosing.

**What it kills.** [§7.2](./core-onchain.md) pattern 2 as specified; [§7.4](./core-onchain.md) rows "Revocation race inside a challenge window" and "Sequencer suppresses the revocation during the window" (both understate the residual as bounded griefing); and [§5.4](./core-onchain.md) consumer 2's claim that `positionSeq` answers "the whole 'did anything move during the window' question in one word" — the whole question was never the right question.

**SUGGESTION.** Scope the recheck to the decision, not the position: re-probe (a) the recorded `claimId`'s slot head and revocation state (1–3 words), and (b) the plan entries ranked strictly above the recorded winner (r words, r = the winning rank, typically 1–3). That is ~5–10 cold words ≈ 10–21k — *cheaper* than the advisory-inclusive `positionSeq` key computed in AO-5, exactly scoped, and immune to unrelated churn. It also removes the challenge window from `positionSeq`'s list of justifying consumers, which materially weakens the E2 case for that Etched word (§8).

---

### AO-7 — Unbounded record bodies sit on the gate read path, and `THRESHOLD`'s value comparison has no defined source

**VERIFIED (the specification gap) / PLAUSIBLE (the exact gas).**

**The text.** [core-onchain §3.3](./core-onchain.md): "contracts read record bodies and metadata from state (items 17/18, full-body spine) and **never file bytes**". [§7.1](./core-onchain.md): `THRESHOLD(k,n)` "counts each principal once per **canonical value digest**". [§6](./core-onchain.md) prices every gate row purely in `slotHead` probes; the word "body" does not appear in the cost table. [§7.4](./core-onchain.md) asserts "Gas griefing via huge advisory rosters / plans → **residual: none**", scoping griefing to plan size only.

**Break 1 — the value is in the body, and the body is the author's choice.** Nearly every gate acts on a *value*, not on the existence of a winner: the release manifest id, the contentHash, the config scalar, the LIST membership. Reading a body is `O(len/32)` cold words. Nothing in `PlanV1`, `GateConfigV1`, or the profile caps body length, and the adopted no-body-elision ruling ([owner-rulings 2026-07-15 items 17/18](../../Designs/efsv2/owner-rulings.md)) guarantees bodies stay resident forever.

Actor: any author whose claim the gate reads — a trusted-but-turned publisher, a committee member, or whoever legitimately wins a position the gate consults.
Steps: publish one claim with a maximal body. The practical write ceiling is itself the tx cap: ~16.7M ÷ 22,100 ≈ **750 words ≈ 24 KB** in one transaction (more across transactions if the kernel permits body assembly).
Cost to read it once: 750 × 2,100 ≈ **1.58M gas**.
Payoff: every gate call that reads that value pays 1.58M forever; a `THRESHOLD` 3-of-5 that must compare values pays up to ~4.7M; combine with a 55-entry direct walk (AO-11: ~350–580k) and an advisory pass and the gate crosses the EIP-7825 cap of 16,777,216 and becomes **permanently unexecutable**. Because "fail-closed is not configurable" ([§7.2](./core-onchain.md)), an unexecutable gate is a bricked gate, and the only exit is a governance policy update — which for a high-risk gate the same section recommends putting behind a timelock.

**Break 2 — `THRESHOLD` has no defined value key, and both candidates are broken.**
- Compare **bodies** → gas is attacker-controlled (Break 1), and the cost scales with `n`, not `k`, because "fails closed if unknown/revoked committee evidence could change the outcome" forbids early exit.
- Compare **`recordDigest`** (the one value-ish word `getSlot` exposes — [read-lens-spec P8](../../Designs/efsv2/read-lens-spec.md)) → two approvers who approve the same semantic value with any byte difference (different `expiresAt`, different envelope framing, different property ordering) produce different digests, and the threshold can **never** be met. A safety committee whose approvals silently never aggregate is a gate that fails closed forever and looks like a liveness bug.

Neither the lane nor [profiles-composition §1.2](./profiles-composition.md) (which inherits `THRESHOLD` into GATE/1) says which one is normative.

**What it kills.** [§7.4](./core-onchain.md)'s "Gas griefing … residual: none"; the §6 claim that gate rows are "trivial"/"composable" at the design centre; and the §7.1 `THRESHOLD` paragraph, which is under-specified at exactly the point where its gas and its semantics are decided.

**SUGGESTION.** Put a bound in the plan bytes and enforce it at read time: `maxValueBytes` per rule, with over-length bodies graded UNKNOWN (fail closed on *that entry*, not on the gate — so one hostile author cannot brick the gate, only remove itself). Define the `THRESHOLD` value key explicitly as a **canonical value digest computed over a bounded normalized projection** of the body, and ship a vector where two byte-different approvals of the same value aggregate.

---

## 2. SERIOUS findings

### AO-8 — Equal-tier CONFLICT versus the early-exit cost model: grindable principal bytes become authority

**VERIFIED.** [core-onchain §7.1](./core-onchain.md) requires "equal-tier entries with different live values → **CONFLICT — fail closed**". Detecting that requires probing **every** entry in the winning tier. [§5.2](./core-onchain.md) prices the expected behaviour as the opposite: "a `PRIORITY_FIRST_PRESENT` walk that decides at rank r touches ≈ 2 + r×(1 entry + 1–3 slot) SLOADs. Typical owner-first-present decisions (r=1–3): ≈ 15–30k". The two sections describe different algorithms.

The attack rides the ordering rule. [§2.1](./core-onchain.md) sorts `rosterEntries` "strictly ascending (tier, principal-bytes)", and [§2.4](./core-onchain.md) stores principals in that priority order. An implementation that early-exits (as §5.2 prices) therefore resolves an equal-tier tie to the **lexicographically smallest principal word**. Principal words are digests a user chooses freely at inception; grinding a word with a few leading zero bytes is trivial (2³² work for 4 zero bytes). Actor: anyone who wants to outrank their peers inside a curator tier. Steps: mint a principal with a low-sorting word; get added to a tier alongside others. Payoff: you win every contested position in that tier, silently, forever. This is the review's explicit prohibition — "Sorting equal-rank identities by bytes can make execution deterministic, but it must not silently convert byte order into semantic authority" ([review §2.5](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)).

Nothing in the plan bytes lets a decoder or a gate know whether early exit is safe.

**SUGGESTION.** Add a registration-time invariant and a header bit: `allTiersSingleton` (computed by the registry from the sorted entries, one pass it already makes). Early exit is permitted only when the bit is set; otherwise the walk must complete the winning tier. Vector: a two-entry equal-tier plan with different live values must produce CONFLICT under both plan forms and both execution paths.

### AO-9 — `requireActivePrincipal` plus non-configurable fail-closed makes every listed principal a unilateral hostage-taker

**VERIFIED.** [core-onchain §3.4a](./core-onchain.md) grades a principal whose `IdentityState.status` is pending-recovery/disputed as UNKNOWN when `requireActivePrincipal` is set; [§7.1](./core-onchain.md) makes UNKNOWN above the winner fail closed; [§7.2](./core-onchain.md) states "**Fail-closed is not configurable.** `acceptMask` can only *narrow*."

Actor: any principal listed in a gate plan at a tier above the usual winner — a co-owner, an emergency-override entry, a committee member, or a low-tier fallback that happens to sort above. Steps: perform an ordinary, entirely legitimate KEL action that leaves ACTIVE — `DEACTIVATE`, or open a `RECOVERY_PROPOSE` ([kel §6](../../Designs/efsv2/kel.md), which explicitly "block[s] new grants/current-control changes" and starts a home-block delay). Payoff: every gate that names them wedges deterministically until its governance updates the plan — and §7.2 recommends a timelock on exactly those gates. A committee member who wants to block a ratification, or a competitor listed as a fallback, gets a clean veto with no compromise, no revocation, and plausible deniability.

The lane sees the wedge but classifies it as an authoring error ("that is the plan author's error, caught in the SDK's pin-time dry run" — [§3.5](./core-onchain.md)). A dry run at pin time cannot catch a status change that happens afterwards.

**SUGGESTION.** Narrow the rule to what the anti-fallthrough argument actually requires: only entries ranked **strictly above the selected winner** must be authority-resolvable; entries below are irrelevant to a first-present decision and should not be consulted at all. Then a wedge requires an attacker you deliberately ranked above your own authority — a policy statement, not an ambush. (This also cuts the `requireActivePrincipal` cost from K to r.)

### AO-10 — The gate binds a registry but never binds the kernel it reads, nor checks the semantics profile it executes

**VERIFIED.** `GateConfigV1` ([core-onchain §7.2](./core-onchain.md)) has seven fields: `planRegistry`, `planId`, `policyVersion`, `acceptMask`, `challengeWindow`, `planForm`, `governance`. There is **no kernel address, no kernel codehash, no realm reference**, and no runtime comparison of `planHeader.semanticsProfileId` against anything.

Two consequences. (a) Under a proxied or upgradeable kernel — which the review treats as the normal case, requiring `kernelImplementationCommitment` because "the proxy shell's runtime hash alone is insufficient" ([review §4.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)) — a kernel upgrade silently changes `slotHead`/`isRevoked`/roster semantics under a stable `planId` and a stable `policyVersion`. This is the named failure of the five-part view identity: "same path, different kernel semantics → silently different tree" ([FS-LENS/1 §2.2 FSP-NAME-1](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md)). The gate is a citable view by any reasonable reading and it names two of the five components. (b) `semanticsProfileId` is described as pinning "resolver semantics incl. logical cost schedule" — but the plan is executed by *the gate's code*, and nothing checks that the two agree. A plan compiled under a permissive profile can be executed by a strict gate, or vice versa, with the receipt claiming a `planId` that commits the other.

**SUGGESTION.** Add `bytes32 kernelCodehashOrImplCommitment` and `bytes32 expectedSemanticsProfileId`; check both on every consumption (one `EXTCODEHASH` + one word comparison). Treat a kernel upgrade as requiring a `policyVersion` bump — i.e. an explicit governance re-affirmation — exactly as a venue change does.

### AO-11 — The gas chapter does not survive recomputation

**VERIFIED arithmetic throughout; the interpolations I criticise are the lane's own PLAUSIBLE rows.**

**(a) The "floors" are not floors of the specified algorithm.** [§6](./core-onchain.md) computes "GATE check, closed set (direct, floor)" as `K × 2,100` — one cold word per principal. But [§4.2](./core-onchain.md)'s own loop is, per entry: `registry.entryAt(planId, i)` (principal word 2,100 + packed-meta word amortised 262 + external-call overhead) **and** `kernel.slotHead(p, position)` (1–3 cold words + external-call overhead). Honest per-entry floor ≈ 2,100 + 262 + ~900 + 2,100 + ~900 ≈ **6.3k**, up to ~10.5k with a three-word head.

| Row | Lane's figure | Recomputed floor | Ratio |
|---|---:|---:|---|
| direct gate, K=16 | 33.6k floor / "30–70k realistic" | ≈ 101k | 3× / ~1.5× |
| direct gate, K=55 | 115.5k floor / 230k realistic | ≈ 347k–580k | 3× / ~1.5–2.5× |
| direct point, K=256 | 537.6k floor / 1.07M realistic | ≈ 1.6M–2.7M | 3× / ~1.5–2.5× |

**(b) The roster point-read headline belongs to a data structure this lane rejected, measured with the plan in calldata.** [§6](./core-onchain.md) rows: "Point read, roster plan (P_v=2) ≈ 21–23k … K-insensitive; 0.14% of cap". [§2.4](./core-onchain.md) chooses binary search over a permutation index for `rankOf` and *rejects* the `mapping(planId ⇒ principal ⇒ rank)` variant, pricing its own choice at "**≈ 17–29k**" per membership test at K=55. Two candidates therefore cost 34–58k in `rankOf` **alone** — more than the 21–23k the same file quotes for the whole point read. That is an internal contradiction between §2.4 and §6.

Where did 21–23k come from? The harness row it interpolates ([review §9.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md), "claimant roster, `P_v=2`, full `bytes32` identities, K=50, M=64 → 1,465,290") is **1,465,290 ÷ 64 = 22.9k per position of a 64-position page**, and the harness passes the plan/rank arrays as *calldata* ([review §9.3](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) ABI table: "naive two arrays 50/64 → 3,780 bytes"; §9.2: "a redeployable resolver making external calls to a kernel-like store"). So membership lookup in the measurement costs ~tens of gas in memory, and repeated plan words across 64 positions are warm. Moving the plan into storage (form S) converts each membership probe from ~50 gas to 2,100. Cold single-point recomputation for the roster path at K=55, P_v=2:

```
claimantCount                 1 × 2,100 =  2,100
claimantAt × 2                2 × 2,100 =  4,200
planHeader                    2 × 2,100 =  4,200
rankOf × 2 (binary search)   ~17k + ~13k = 30,000     (log2(55)≈6 principal words + ~2 index words each)
slotHead × 2                  2–6 × 2,100 = 4,200–12,600
external-call overhead        ~6 calls   ≈ 3,000
                                          ────────
                                total ≈ 47,700 – 56,100
```

≈ **2–2.5× the quoted figure**, and with the *rejected* O(1) rank map it lands at ≈21k — i.e. the quoted number is the rejected design's number. **The roster lever at the single-point gate case is therefore ~4–7×, not ~10×**, and P-CORE-4's lean-ADOPT rests on the larger figure. (The page rows are less wrong, because warming genuinely amortises the binary search across positions — but then the same warming should be applied to the direct-page rows, and is not.)

**(c) The K=256 slot count is arithmetically wrong.** [§2.4](./core-onchain.md) says "at K = 256: **295 slots**". Recomputing the file's own layout: header 2 + scopeId/purposeId 2 + principals 256 + packed meta ⌈256/8⌉ = 32 + permutation ⌈256/16⌉ = 16 + advisory 2×A = 4 → **312 slots** ≈ **6.90M gas**, not 6.5M. (295 is what you get if the permutation index is omitted.) K=15 (26) and K=55 (74) check out.

**(d) EIP-7825 fit at the ceiling is not established.** [§6](./core-onchain.md) marks plan registration "all fit". At K=256 the *SSTOREs alone* are 6.90M; add ~9.2 KB of calldata (≈147k), a Solidity deterministic-CBOR decode of 9.2 KB, and the construction of the principal-sorted permutation index — which the ABI does not accept as a parameter, so the registry must **sort 256 words on-chain** (insertion sort worst case 32,640 comparisons over memory ≈ 1–2.6M under adversarial reverse-sorted input). Estimate ≈ 8–11M: fits, but with far less headroom than "all fit" implies. The **"indexed registration" variant** floated in §2.4 ("would make it 1 SLOAD but double registration cost") lands at ≈ 14–17M and **does not reliably fit the 2²⁴ cap** — meaning the escape hatch for AO-11(b) is unavailable exactly at the ceiling the lane proposes for `MAX_PLAN_ENTRIES`.

**(e) The advisory row is under-counted.** [§4.3](./core-onchain.md) prices D=8 as "24 probes ≈ 50.4k". The rule's `denyRoster` is a reference; its D principals must be read (D words + a header), and each hit must be graded (expiry + revocation reads). D=8 → ≈ 2 + 2 + 8 + 24 = 36 words ≈ **75.6k**, before grading.

**SUGGESTION.** Re-derive §6 from the §4.2 algorithm rather than from probe counts; separate cold-single-point rows from warm-page-amortised rows explicitly (they are different products, and the gate consumer is the cold one); re-open the `rankOf` structure choice with the corrected numbers (the O(1) map now looks correct for the gate case and merely expensive to register); and re-state the 256 registration row with decode + sort included before calling the ceiling feasible.

### AO-12 — Seam 8 is not closed: `ADOPT` is control-grade authority handed out at grant grade

**VERIFIED against [object-taxonomy §4.3/§4.4](./object-taxonomy.md) and [kel §7.2](../../Designs/efsv2/kel.md).**

The lane's own claim: "`RESET` is **never grantable** … therefore a stolen session/admin actor can fork or advance a channel but can never seal history or survive a rotation" ([§4.4](./object-taxonomy.md)). But `ADOPT` **is** available to any authorized actor: "Any currently-authorized actor can issue it (a thief with a live current key could adopt its own branch — but such a thief can already publish heads; adoption grants nothing extra)" ([§4.3](./object-taxonomy.md)).

Adoption grants a great deal extra, because `CHANNEL_CONTESTED` is the channel's **only** security property. The design's promise is detection: "both admitted → `CHANNEL_CONTESTED` sticky; following stops for everyone" ([§4.6](./object-taxonomy.md)).

Actor: a thief holding a stolen `CHANNEL_ADVANCE` grant — precisely the low-privilege, widely-distributed credential §4.4 invents so "a curator team runs a channel without sharing control keys".
Steps: (1) publish a hostile `ADVANCE` → fork → `CHANNEL_CONTESTED`, alarm raised, following stops (the design working); (2) immediately publish an `ADOPT` naming both contested heads, with the thief's content as the adopt head → status returns to **ACTIVE** at the thief's revision.
Payoff: the detector is cleared by the attacker who tripped it. Subscribers resume following, at the thief's head, under a non-alarming status. And per [§4.5](./object-taxonomy.md), "`RESET` is a loud ceremony … **`ADOPT` is an ordinary diff**" — the repair path the attacker used is explicitly the quiet one. No rotation is needed; the whole sequence happens inside one `authEpoch`.

So the answer to the mission's question — *does reusing KEL control actually close seam 8, or does a scoped channel-admin grant reopen it?* — is: **it reopens it**, for the one transition that resolves contested state. The privilege lattice separates fork-creation from history-sealing but forgets fork-*clearing*, which is the transition that matters.

Secondary, same section: `CHANNEL_TOMBSTONE` is separately grantable and terminal within its epoch; only an epoch-bumped `RESET` revives. So a stolen admin actor can force the controller into a **root-key rotation ceremony** (or, if the next-state preimage is lost — [kel §6](../../Designs/efsv2/kel.md): "Lost next state is repaired only by the committed recovery policy" — a full guardian recovery) to un-kill a channel. The lane frames this as a virtue ("un-tombstoning is thus exactly as loud as compromise recovery, by construction"); it is simultaneously the attacker's escalation lever: a cheap credential theft forces the most expensive ceremony in the system.

**SUGGESTION.** Put `ADOPT` in the same non-grantable class as `RESET` (control-only). Honest-race repair between two of the controller's own devices then costs a control action — which is the honest price of making a fork mean something. If that is too heavy, permit same-epoch `ADOPT` only when every contested head was authored under the **same** `authorityId` (a true self-race), and require an epoch-bumped `RESET` otherwise.

### AO-13 — Recovery-bundle rollback detection assumes closure the restoring device cannot have

**VERIFIED against [object-taxonomy §3.2–3.4](./object-taxonomy.md) and the four-source rail.**

The stale-bundle defense has three legs ([§3.4](./object-taxonomy.md)): (1) floors max-merged with chain state; (2) a mandatory semantic-diff ceremony; (3) "bundle sequence numbers + export basis make 'you are restoring bundle 41 of an identity whose F-4 index shows 47' detectable."

Leg (1) covers only what the chain knows — channel heads and epochs. It does **not** cover the thing a rollback actually steals: *local* trust edits. Personal policy is private by default (PP-1), so "I ejected curator X" leaves no chain artifact and has no on-chain floor. A restored bundle from before the ejection re-trusts X with nothing to contradict it.

Leg (3) is where the rails bite. Detecting "there exists a newer bundle" requires proving you saw the **maximum** entry of the F-4/E4 index — i.e. positive closure. The restoring device is, by construction, a **fresh device with no local node**, on a hosted RPC. Under the adopted four-source rule ([FS-LENS/1 §1.7 FSP-ABSENT-2](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md), rails), "a hosted RPC's bare word" cannot ground absence — so "no newer bundle exists" is **UNKNOWN**, not a fact. An adversary (or a merely unlucky RPC) that withholds the newest pointer produces exactly the observation the honest case produces. The restore ceremony as written presents a comparison it is not epistemically entitled to make, at the one moment in the system's life when the user has the least verification capability and the most urgency.

Actor: anyone able to serve/withhold at the restore moment (a malicious or captured RPC, a hostile mirror, an attacker who obtained an old bundle ciphertext — which is *public* by design: "ciphertext public (ordinary EFS DATA)").
Payoff: silent reversion of trust policy, including re-trusting an ejected curator or a compromised device grant reference, at exactly the moment the user is least likely to audit.

**SUGGESTION.** Consume the joined pass's own **D-13 durable-counter MUST** ([joined-pass-synthesis §2](../../Designs/efsv2/joined-pass-synthesis.md)), which the lane does not cite: write a monotone bundle counter to *chain state* on each export, and make restore refuse-or-loudly-degrade when it cannot read that counter at closure grade. Then "bundle 41 vs 47" becomes a state read with a basis, not an enumeration hope. Also note in §3.3's honest-loss list that **local removals are not recoverable facts** — the loss line currently omits the case the attack targets.

### AO-14 — The permissionless registry turns the membership dictionary attack into a free confirmation oracle, and publishes personal slices on request

**VERIFIED.** [object-taxonomy PP-2](./object-taxonomy.md) names the threat exactly: "An unsalted digest over a small guessable membership set is a dictionary oracle — an observer enumerates plausible friend/labeler sets offline and matches the hash", mitigated by keeping the deterministic ID *inside* the resolver and exposing only a `PrivateLensHandle`. [core-onchain §8.6](./core-onchain.md) claims the contract tier "never touches personal policy … nothing personal ever needs registration."

But [§2.3](./core-onchain.md)'s registry is permissionless, content-addressed, idempotent, and has a free `planHeader(planId)` view. Offline enumeration produces candidate `planId`s; a `view` call turns each candidate from "matches a hash I guessed" into "**confirmed to exist on-chain**" at zero cost and with no rate limit — and, if it exists, `entryAt` reads out the whole membership. The mitigation PP-2 relies on (don't publish the deterministic ID) is defeated by anyone else publishing it: **registration requires no relationship to the policy's owner.** An adversary who obtains a personal slice's bytes by any means — a shared receipt, a leaked backup, a debug log — can register it permanently and irrevocably, and neither lane provides a removal path (nor should one exist, given permanence).

Payoff: membership disclosure of a personal trust policy, permanent, attributable to nobody, at the cost of one transaction; plus a cheap confirmation oracle for guessed sets even without the bytes.

**SUGGESTION.** State a registry MUST that closes the confirmation half: registration is permitted only for plans carrying a `purposeId` in the GATE-purpose set (already the only purposes §2.1 admits — enforce it in `register()`), and document that any slice ever registered is public forever. For the guessing half, note honestly in §8.6 that a *published* gate plan is a membership disclosure by construction and that personal policies must never share a slice-derivation path with gate plans (this is [object-taxonomy PP-6](./object-taxonomy.md), which the core lane does not cite).

### AO-15 — "Costs are plan-committed, not input-dependent" is false in two directions

**VERIFIED.** [core-onchain §7.4](./core-onchain.md): "Gas griefing via huge advisory rosters / plans → registration bounds (`MAX_PLAN_ENTRIES`, advisory budget per rule); costs are plan-committed, not input-dependent → residual: none."

(a) **The advisory budget is asserted, never specified.** `PlanV1` bounds `rosterEntries` (`MAX_PLAN_ENTRIES`) and nothing else: `advisoryRules` is `[* [labelDefinitionId, denyRoster, actionCode, honorStale]]` with no `MAX_ADVISORY_RULES` and no cap on `denyRoster` size. A plan with 64 advisory rules × 32 deny sources × 3 match keys is 6,144 kernel probes ≈ **12.9M gas** — a gate that registers and pins cleanly, then never executes. Since fail-closed is not configurable, it is bricked. This is the look-alike-plan phishing path ([§2.3](./core-onchain.md)) with a *denial* payoff instead of an authority payoff — and it needs no semantic subtlety at all, so the "full semantic diff" ceremony (which shows principals, not gas) is unlikely to catch it.

(b) **The roster path's cost is venue-state-dependent.** The loop runs `P_v` times, bounded by the plan's `rosterThreshold`. `rosterThreshold` is plan-committed, but it is a *number the plan author chooses*, and `P_v` is a number outsiders inflate. A plan with a large `rosterThreshold` at a hot position walks thousands of claimants. So the honest statement is "bounded by a plan-committed number that the plan author may set arbitrarily high, against a state variable the attacker controls" — which is not the same as "not input-dependent".

**SUGGESTION.** Put every fan-out bound in the plan bytes and in the registry's decode checks: `MAX_ADVISORY_RULES`, `MAX_DENY_SOURCES_PER_RULE`, and a hard protocol ceiling on `rosterThreshold`. Then have the pin ceremony render a **worst-case gas estimate** alongside the semantic diff — the number a gate owner actually needs.

### AO-16 — "KEL revocation empties the slots" is false; the stale-plan defense loses its first layer

**VERIFIED against [kel §7.3](../../Designs/efsv2/kel.md).**

[core-onchain §7.4](./core-onchain.md), the stale-plan row: "layered: KEL revocation empties the slots (empty-on-revoke) → STOP mode fails closed; advisory reject layer; `requireActivePrincipal` catches disputed/recovering principals; governance update + monotone `policyVersion` retires the entry."

Empty-on-revoke is a *claim*-revocation rule: the slot reads EMPTY when `(revoker, claimId)` is in the revocation G-set and `revoker == claim.author` ([read-lens-spec P2/P3](../../Designs/efsv2/read-lens-spec.md)). KEL-level revocation is a different mechanism with the opposite polarity: "**Actor removal is prospective. Home-admitted records retain historical attribution**" ([kel §7.3](../../Designs/efsv2/kel.md)); revoking a grant, rotating, or recovering does **not** revoke the claims already admitted under it. `revokePrincipalClaims` exists but is "root/exceptional-delegation authority with a high-risk ceremony", not an automatic consequence of compromise handling.

So when a plan principal is compromised, the compromised claim **remains the slot winner** until the author (i.e. the thief, or a root ceremony) revokes it. `requireActivePrincipal` does not help either: a principal that rotates or recovers is ACTIVE, and its old claims stand. The layered defense reduces to: the advisory layer, and a governance policy update behind a timelock.

**SUGGESTION.** Rewrite the row to name the real layers and the real window, and add the one mechanism that does work automatically: a plan-declared `maxAdmissionAge` / authority-epoch floor per entry, so a gate refuses claims admitted under a superseded `authEpoch` — [kel §8.2](../../Designs/efsv2/kel.md)'s `EnvelopeAuthReceiptV1.authEpoch` is already on the receipt the gate reads.

---

## 3. NOTE findings

**AO-17 — two ID derivations for one family, inside one file.** [object-taxonomy §2.2](./object-taxonomy.md): `RosterId = keccak256(DOMAIN_EFS_ROSTER_V1 ‖ rosterBytes)`. [§2.5](./object-taxonomy.md), three paragraphs later: "One derivation shape for the whole family — `keccak256(DOMAIN ‖ keccak256(canonicalBytes))`", listing `DOMAIN_EFS_ROSTER_V1` among them. [core-onchain §2.1](./core-onchain.md) uses the single-hash form too, while claiming to be the EVM projection of the review's objects, whose form is double-hash ([review §4.3](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)). A Rust compiler following §2.5 and a Solidity gate following §2.2 compute different ids for the same bytes; `sliceCommitment` leaves (`keccak256(sliceKey ‖ RosterId)`) then never match. Fail-closed, so not a security break — but it is a cross-language divergence in the file whose entire purpose was to prevent cross-language divergence, and it will be discovered by the golden vectors only if the vectors are written from both sections. **SUGGESTION:** pick one and delete the other; if the single hash is chosen, say why the family rule has an exception.

**AO-18 — `DENY_SOURCE` entries cannot construct an advisory key.** [object-taxonomy §2.2](./object-taxonomy.md): "Deny capability rides `effect=DENY_SOURCE` entries: a gate consults those principals' advisory slots (keyed point reads …)". The advisory position key is `(definitionId, targetKind, targetId, qualifier)` ([review §8.4](../2026-07-11-efsv2-lens-architecture-and-scale-review.md); [core-onchain §4.3](./core-onchain.md) `advisoryPosition(labelDefinitionId, mk)`), and `RosterV1` carries **no `labelDefinitionId` anywhere**. As specified, a gate holding only a Roster cannot form the read. `PlanV1` can (it has `advisoryRules`), which is AO-1 again from a different angle. **SUGGESTION:** either add a per-entry `labelDefinitionId` word for `DENY_SOURCE` entries (breaking the fixed 64-byte entry, hence the `96 + 64·N` invariant), or move deny out of `RosterV1` and say so.

**AO-19 — "no encoding malleability class at all" is a claim about the payload asserted about the system.** [object-taxonomy §2.2/§2.9](./object-taxonomy.md). The payload claim is fair; the enclosing frame is not covered: a dynamic `bytes` argument carries a caller-controlled offset word and a length prefix, Solidity's decoder does not reject trailing calldata, and the header's `entryCount N` must be cross-checked against the *decoded* length (`96 + 64·N`) rather than assumed. The §2.9 residual "none identified (PLAUSIBLE until the Foundry fixture)" should read "none identified in the payload; the frame is unaudited". **SUGGESTION:** state the frame rules (exact-length check against header N, explicit rejection of extra calldata where the roster is hashed from `msg.data`) and put both in the fixture.

**AO-20 — `positionSeq` write amplification is priced per position and consumed per envelope.** [core-onchain §5.4](./core-onchain.md) prices the bump as "≈ 2.9–5k warm, 22.1k first touch". A single envelope legitimately writes many records at many positions ([kel §8.1](../../Designs/efsv2/kel.md): one signature covers a batch). A 100-record envelope touching 100 distinct positions pays ~100 bumps ≈ **290–500k added to one write** — a 3–10× tax on batch writing, which is the write pattern the envelope design exists to enable. The sibling lane's per-*author* counter ([profiles-composition §5.2](./profiles-composition.md): "one warm SSTORE per envelope apply, amortized across the batch — the cheapest possible sound token") costs one. This asymmetry belongs in the E2 ask and is currently invisible in it. **SUGGESTION:** price both counters in the same E2 row and state which consumer each is for; they are not substitutes (per-author cannot answer "did this position change", per-position cannot be afforded per batch).

**AO-21 — the client delta stream is specified on logs.** [core-onchain §5.4](./core-onchain.md), consumer 3: "`positionSeq` plus its bump events is the position-granular delta stream the IVM cache architecture consumes". Events are exactly what the adopted constraint excludes: "Event-derived / log-only = off-chain, because a 100-year archive's event logs get pruned (EIP-4444)" ([onchain-completeness §0](../../Designs/efsv2/onchain-completeness.md)), reinforced by [research §3.1](./research.md) (partial history expiry deployed; EIP-7745 deferred). From **state alone**, `positionSeq` supports *detection* over positions you already know (O(cached positions) reads per refresh — 10k cached positions = 10k SLOADs), not *discovery* of which positions changed. The lane should either claim the weaker property or route the reverse index to E2 as [profiles-composition §5.2](./profiles-composition.md) does. **SUGGESTION:** restate consumer 3 as "polling token for known positions"; leave the delta stream in E2.

**AO-22 — semantic-identity equality hands out free relabeling.** [object-taxonomy §2.3–2.4](./object-taxonomy.md): `editorHints` and non-critical `extensions` change `LensRevisionId` but never `EffectiveLensId`; "cosmetic/provenance changes never change `EffectiveLensId`". An attacker republishes a trusted curator's source with hostile display text (`label`, `editorHints`) and their own publisher principal; the compiled object is byte-identical, so any UI or consumer that identifies a policy by `EffectiveLensId` shows "same lens" while the surrounding presentation is the attacker's. Mild — the semantics really are identical — but it is a phishing surface in a system whose ceremonies are the primary defense. **SUGGESTION:** UI rule in the string catalog: presentation for a lens always comes from the *accepted* Compilation Record's publisher, never from whichever carrier happened to be fetched.

**AO-23 — `acceptMask: uint32` is an undefined lattice claiming a monotonicity property.** [core-onchain §7.2](./core-onchain.md) says the mask "can only *narrow*", with no encoding, no lattice, and no on-chain check; [profiles-composition §3.2](./profiles-composition.md) specifies the same job as `AcceptanceMatrixV1` — per-axis closed value sets plus cross-axis `combinationConstraints`, explicitly with "no 'any' wildcard on axes 1, 3, or 6". Thirty-two undefined bits at a trust boundary is a smuggling surface (unknown bits ignored = silent widening) and the two lanes cannot both be implemented. **SUGGESTION:** encode the matrix, or encode a *hash* of the matrix in `GateConfigV1` and supply the matrix at call time, verified against the hash.

**AO-24 — the plan-form break-even is computed against the wrong baseline.** [core-onchain §5.2](./core-onchain.md): "Calldata break-even ≈ 45–50 lifetime calls (1.64M ÷ ~33k)". The ~33k is a *calldata* cost; the saving from form S is not the whole calldata cost, it is calldata minus the storage reads form S introduces. At K=55, form C reads the plan from memory (free) after paying ~32k calldata; form S pays ~2.4k per entry touched. For an early-exit at r=2 form S saves ~27k/call → break-even ≈ 61 calls; for an all-absent walk (r=55) form S costs ~130k in plan reads against form C's ~32k → form S **never** breaks even. The single number hides a sign change. **SUGGESTION:** state break-even as a function of expected winning rank, and note that fail-closed gates spend disproportionate time in the deep-walk case.

---

## 4. What I could not break

Recording these so the lanes get credit and the critic knows where I looked:

- **The atomicity argument for budget exhaustion** ([core-onchain §3.2](./core-onchain.md)): correct and elegant. An over-budget resolution reverts; there is no partial answer to mislabel. I could not construct a case where a contract observes a partial resolution as absence. VERIFIED.
- **Content-addressed idempotent registration is front-running-immune for the id itself.** Registering the same bytes yields the same `planId`, so a front-runner gains nothing — the classic attack genuinely does not apply. (The variant that *does* work — front-running the *indexed* registration variant with a plain one, permanently denying the O(1) `rankOf` because re-registration is a no-op — is real but cheap to fix by keying the variant into the bytes; I list it here rather than as a finding because §2.4 marks indexed registration as hypothetical.)
- **Channel impostor writes.** `channelAnchorSummary(controller, channelId)` is keyed by both, so an outsider writing a `ChannelStateV2` for someone else's `channelId` lands under its own controller key and is invisible to subscribers reading `LensChannelRefV1`. [object-taxonomy §4.2–4.3](./object-taxonomy.md) holds. VERIFIED.
- **Deny-after-resolve.** I tried to build an advisory-driven reselection through the contract tier and could not: [core-onchain §4.3](./core-onchain.md)'s "Deny NEVER re-opens resolution below the winner" is enforced by control flow, not by a check. Holds.
- **160-bit truncation.** Both lanes carry full `bytes32` everywhere I could find, including postings, permutation indexes (which store *indexes*, not principals), and ABI outputs. The kill-list item is respected. VERIFIED by inspection of [core-onchain §2.1/§2.4](./core-onchain.md) and [object-taxonomy §2.2](./object-taxonomy.md).
- **Venue ordinals.** P-CORE-5's refusal is well argued and the dictionary-attack surface I went looking for does not exist, because ordinals never reach a semantic surface. No finding.

---

## 5. Independent gas recomputation, consolidated

All rows are cold-state unless marked; 2,100/cold word (EIP-2929); external-call overhead ~900/call assumed and stated. Lane figures from [core-onchain §6](./core-onchain.md); recomputation per AO-11.

| Workload | Lane | This lane's recomputation | Why they differ |
|---|---:|---:|---|
| Direct gate, K=16, all-absent | 33.6k floor | ≈ 101k | floor counted 1 word/principal; algorithm reads 2 registry + 1–3 kernel + 2 calls |
| Direct gate, K=55, all-absent | 115.5k floor / 230k "realistic" | ≈ 347k–580k | same |
| Roster point, P_v=2, K=55, **cold** | 21–23k | ≈ 48k–56k | quoted figure is page-amortised, calldata-plan, O(1)-rank-map (all three assumptions changed by §2.4) |
| Roster point with the *rejected* O(1) rank map | — | ≈ 21k | reproduces the quoted figure — evidence the number belongs to the rejected design |
| Revalidation via `positionSeq`, D=3 | 8.4k | ≈ 27–29k | advisory position seqs are part of the key by §5.4's own admission |
| Advisory pass, D=8 | 50.4k | ≈ 75.6k+ | deny-roster reads + header, before grading |
| Plan registration, K=256 | 6.5M ("fits") | ≈ 6.90M SSTORE + calldata + CBOR decode + on-chain sort of 256 words ≈ **8–11M** | 295 vs 312 slots; decode and sort uncounted |
| Indexed registration, K=256 | not priced | ≈ **14–17M** — does not reliably fit 2²⁴ | doubling per §2.4's own note |
| One 24 KB body read on the gate path | not priced | ≈ 1.58M **per read, forever** | AO-7 |

Reading: the corrected numbers do not change the *shape* verdicts (points composable, wide pages impossible), but they do change two decisions that rest on the shape's magnitude — the roster's lean-ADOPT (lever ~4–7×, not ~10×) and the `rankOf` structure choice (the rejected map is now the right answer for the cold single-point gate case, which is the case LC-9 describes).

---

## 6. The no-Graph / trusted-indexer audit

The rail: core functionality works from chain state; every off-chain deferral is explicit and signed ([onchain-completeness §0/§6](../../Designs/efsv2/onchain-completeness.md)). Three leaks, in descending severity:

1. **The PlanRegistry is a trusted answerer inside the core read path (AO-3).** It is not The Graph, but it is the same epistemic shape: an unverified party answering a query the consumer cannot check. Every gate decision in the CORE tier depends on it. This is the sharpest leak in either lane and the one the rail was written to catch.
2. **The client delta stream is specified on events (AO-21).** Logs are the explicitly-excluded substrate. The state-only fallback exists but is a different (weaker, more expensive) product than the one advertised.
3. **Roster-derived absence depends on a kernel index invariant, not on a state read (AO-4, second half).** The four-source rule permits "own-node total state"; an index whose completeness is an unverifiable kernel promise is not the same object. If the invariant ever slips, the resulting false absence carries the full authority of source 1.

**Features that quietly require the claimant roster before E2 decides** (the honest dependency list the mission asked for): the "K-insensitive point read" (§6 rows 4–5), the composable 64-item contract page (§6 row "roster plan (sparse) ≈1.4M"), the whole "~10× lever" argument in §6 reading 3, and `positionSeq`'s consumer-1 framing (which compares against a roster-era re-resolve cost). [core-onchain §4.4](./core-onchain.md)'s fallback sentence — "If rejected: delete `rosterThreshold` semantics … and the GATE profile is unaffected" — is true of the *profile* and false of the *numbers*: without the roster, the design-centre point read is 347k–580k (AO-11a) and the contract-native page is gone. That should be stated as the price of a NO, not left as "cost regression ~10×".

**Not a leak:** `eth_simulateV1` pin-time preview ([core-onchain §5.1](./core-onchain.md)) is display-only and correctly RPC-trust-graded; the two-compiler conformance step is CI; `canonicalBytes()` is on-chain.

---

## 7. Consistency sweep

Lane-vs-lane and lane-vs-rails contradictions not already carried as a finding above.

| # | Contradiction | A | B | Severity |
|---|---|---|---|---|
| AO-C1 | **The contract-tier artifact** — CBOR decoded on-chain vs packed layout, "no contract ever parses CBOR" | [core-onchain §2.1–2.3](./core-onchain.md) | [object-taxonomy ENC-1/2](./object-taxonomy.md) | = AO-1 (FATAL) |
| AO-C2 | **The word "Roster"** — entry list only vs the whole compiled slice (combiner+purpose+scope+relinquish) | [core-onchain §1](./core-onchain.md) | [object-taxonomy §1.1/§2.2](./object-taxonomy.md) | SERIOUS — the pass's naming deliverable is self-contradictory; a synthesis that adopts both ships two meanings for one new word |
| AO-C3 | **Contract-tier combiner vocabulary** — CLOSED at 3 vs `RosterV1`'s 5 (incl. `UNION_SET`, `ONLY_ONE`) | [core-onchain P-CORE-7](./core-onchain.md) | [object-taxonomy §2.2](./object-taxonomy.md) | SERIOUS — "unknown combiner rejects" is ambiguous about *whose* known set; a `UNION_SET` Roster is valid to one lane and undefined behaviour to the other |
| AO-C4 | **Entry cap** — `MAX_PLAN_ENTRIES` candidate 256 vs `1 ≤ N ≤ 64` hard | [core-onchain §2.1/§6](./core-onchain.md) | [object-taxonomy §2.2/§2.7](./object-taxonomy.md) | SERIOUS — every §6 row at K=256 is unrepresentable in the sibling encoding |
| AO-C5 | **Field widths** — `effect uint8 / flags uint8` vs `effect uint16 / entryFlags uint16` | [core-onchain §2.1](./core-onchain.md) | [object-taxonomy §2.2](./object-taxonomy.md) | NOTE — silent decode divergence if one lane's vectors are written against the other's shape |
| AO-C6 | **The kernel delta counter** — per-position `positionSeq` (Etched ask #2) vs per-author `viewMutationVersion` ("kernel MUST") | [core-onchain §4.5/§5.4](./core-onchain.md) | [profiles-composition §5.2](./profiles-composition.md) | SERIOUS — the pass would hand E2 two different mandatory counters with a 100× write-cost gap (AO-20) and no joint price |
| AO-C7 | **`LensObjectRefV1.semanticKind`** — each lane adds "one additive row": `ROSTER` and `VIEW` | [object-taxonomy §2.6 rule 2](./object-taxonomy.md) | [views-links §1.3](./views-links.md) | NOTE — two uncoordinated enum extensions to a frozen-discriminant list; whoever assigns numbers first wins, silently |
| AO-C8 | **Acceptance declaration** — `uint32 acceptMask` vs `AcceptanceMatrixV1` | [core-onchain §7.2](./core-onchain.md) | [profiles-composition §3.2](./profiles-composition.md) | = AO-23 (NOTE) |
| AO-C9 | **Registry freeze posture** — "consumes no Etched freeze surface", zero cost vs "an OPTIONAL CORE convenience … E2-bundle priced" | [core-onchain P-CORE-2/§2.3](./core-onchain.md) | [object-taxonomy §2.6.4](./object-taxonomy.md) | NOTE — both agree it is non-Etched; they disagree on whether E2 must price it |

**Lane-vs-rails / lane-vs-adopted:**

- [core-onchain §7.4](./core-onchain.md) "KEL revocation empties the slots" contradicts [kel §7.3](../../Designs/efsv2/kel.md) "Actor removal is prospective" → AO-16.
- [core-onchain §7.2](./core-onchain.md) `GateConfigV1` omits realm/code basis, contradicting FSP-NAME-1's five-part identity ([FS-LENS/1 §2.2](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md)) → AO-10.
- [core-onchain §5.4](./core-onchain.md) consumer 3 (events as the delta stream) contradicts [onchain-completeness §0](../../Designs/efsv2/onchain-completeness.md) → AO-21.
- [object-taxonomy §3.4](./object-taxonomy.md) does not consume the adopted **D-13 durable-counter MUST** ([joined-pass-synthesis §2](../../Designs/efsv2/joined-pass-synthesis.md)) where it is exactly the mechanism needed → AO-13.
- [core-onchain §5.2](./core-onchain.md)'s early-exit cost model versus [§7.1](./core-onchain.md)'s equal-tier CONFLICT rule risks reinstating byte-order-as-authority, which [review §2.5](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) forbids → AO-8.

**Kill-list scan:** no lane reinstates checkpoint-grounded absence, the global same-(author,order) equivocation rule, MUST-pull-home, `preferredTier`, two-labels-as-grades, 160-bit truncation, silent truncation, discovery-into-resolution, caller-supplied gate policy, cross-author latest-wins, or reputation scores. The nearest brushes are AO-2 (caller-supplied *effective* policy through an under-specified proof, arriving legitimately rather than as a killed feature) and AO-8 (byte-order authority arriving through an implementation the cost model invites).

---

## 8. Consequences for the pass's asks

- **The Etched ask is not "two index words".** [core-onchain §4.5](./core-onchain.md) claims the whole lane costs two kernel words. With AO-6 removing the challenge window from `positionSeq`'s justifying consumers, AO-21 removing the delta stream, and AO-5 showing the warm-gate lever is ~8× rather than ~25× at the design centre, `positionSeq`'s remaining case is thin — and AO-20 shows its write side is 100× the sibling lane's counter on batch writes. The claimant roster's case is stronger but rests on numbers AO-11 corrects downward by ~2–2.5× at the gate case, and AO-4 shows it is not semantically free.
- **Do not let E2 be asked for three competing kernel counters** (`claimantsBySemanticPosition`, `positionSeq`, `viewMutationVersion`) from three lanes with three cost models. One joint row, or the measurement answers a question nobody asked.
- **The encoding keystone is unresolved and is the pass's critical path.** Everything downstream — vectors, `sliceCommitment` binding, the registry, the gas table, the conformance program — is currently specified twice.

## 9. Confidence

**VERIFIED (traced to exact text/arithmetic this pass):** every quoted sentence from [core-onchain](./core-onchain.md) and [object-taxonomy](./object-taxonomy.md); the CBOR-vs-packed contradiction and all encoding deltas in AO-1's table; the form-P wording and the §7.4 "residual: none" cells; `GateConfigV1`'s exact field list; the §4.2 pseudocode's asymmetric entry consultation; the §5.4 revalidation predicate; the §7.2 challenge-window recipe; the §2.4 slot arithmetic (74 at K=55 ✓, 26 at K=15 ✓, **312 ≠ 295** at K=256); the §6 floor formulas; the review's §9.2 harness rows and §9.3 calldata table (the basis for AO-11b); [kel §6/§7.2/§7.3/§8.1/§8.2](../../Designs/efsv2/kel.md); [owner-rulings 2026-07-15 items F/17/18](../../Designs/efsv2/owner-rulings.md); [onchain-completeness §0/§6](../../Designs/efsv2/onchain-completeness.md); [FS-LENS/1 §1.7/§2.2](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md); [research §3.1/§3.4](./research.md) (EIP-7825 = 16,777,216 live; FOCIL → Hegotá); [profiles-composition §3.2/§5.2](./profiles-composition.md); [views-links §1.3/§2.2](./views-links.md).

**PLAUSIBLE (constructed; needs vectors or a benchmark):** the two-decoder divergence in AO-1 (requires an actual Solidity decoder to exhibit a laxity — the *structural* risk is verified, a working exploit is not); all per-entry gas reconstructions in AO-11 (external-call overhead and two-phase head widths are assumed, and stated); the 24 KB body ceiling and its 1.58M read cost in AO-7; the insertion-sort cost for on-chain permutation construction; the AO-6 organic-churn threshold (depends on a real position's write rate); the AO-9 hostage scenario's exact KEL status transitions (I traced the events; I did not trace a kernel implementation that maps them to UNKNOWN); AO-14's confirmation-oracle throughput.

**Could not verify:** any real-kernel gas number (E1/E2 open — the standing caveat applies to my recomputations as much as to the lane's); whether the kernel's roster append can be made atomic across the two-lane admission design ([kel §8.3](../../Designs/efsv2/kel.md) confluence boundary — a kernel-lane check the target lane also flags as owed); the exact `slotHead` word count and whether a batch entry-read ABI exists (the §4.5 item-3 packed getter is "pending"); whether Solidity's ABI decoder behaviour I rely on in AO-19 holds for the specific calldata-slicing implementation object-taxonomy intends (no code exists); the F-4 escrow index's wire shape (cited by [object-taxonomy §3.2](./object-taxonomy.md) at second hand, as it says).

**Pushback on the rails:** none. Two adopted rulings are *stressed* rather than contradicted, and the stress is the design's problem, not the ruling's: item F's challenge-window pattern has no sound instantiation here (AO-6), and the four-source absence rule is quietly widened by roster-derived absence (AO-4) and by the restore ceremony's comparison (AO-13). Both should be repaired inside the design, not by relaxing the rulings.
