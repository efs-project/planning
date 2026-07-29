# EFS v2 — Lens family specification (replacement seed)

**Status:** draft seed — the successor entry point for the reopened [[read-lens-spec]]; produced by the 2026-07-28 lens pass ([[lens-pass-synthesis]] is the ruling record; [critic.md](../../Reviews/2026-07-25-lens-pass-corpus/critic.md) is the binding repair ledger)
**Target repos:** contracts, sdk, client, planning
**Supersedes:** [[read-lens-spec]] as the routing entry point (its section-by-section dispositions: [critic §3.1](../../Reviews/2026-07-25-lens-pass-corpus/critic.md)); consumes [FS-LENS/1](../../Reviews/2026-07-25-joined-fs-pass-corpus/filesystem-core.md) unmodified as chapter one
**Last touched:** 2026-07-28

#status/draft #kind/design #repo/contracts #repo/sdk #repo/client #topic/efsv2 #topic/lenses

> **How to read this seed.** Each chapter states the normative spine — the rules a conforming implementation is bound by — and points at its detail record in the [pass corpus](../../Reviews/2026-07-25-lens-pass-corpus/). Where a corpus lane and the [critic's ledger](../../Reviews/2026-07-25-lens-pass-corpus/critic.md) disagree, **the critic wins** (the lanes carry pre-repair text). Owner-gated choices are marked `[LP-n]` and live in [[owner-decision-inbox]]; nothing here freezes a schema. Verification debts are the critic's V-1…V-27; a rule marked *(PLAUSIBLE)* carries its V-obligation.

## 0. Constitution and taxonomy

1. **A lens is a typed, purpose-scoped, reproducibly compiled policy over authenticated evidence** — never merely an ordered author list: `EvidenceGraph + BasisVector + EffectiveLens + Context → ResolvedView + ViewReceipt` `[LP-1]`. The flat ordered list survives only as the simplest source form (compiling to one `PRIORITY_FIRST_PRESENT` rule) and as an editor projection.
2. **The naming family** `[LP-3]` — **Lens** (end-user read-view; the only user-facing word) · **View** (saved linkable lens-ref + location + presentation + completeness; can never contain trust) · **Starter Pack** (published curator View for onboarding) · **Follow** (discovery only) · **Channel** (mutable subscription pointer) · **Labeler**/**Action Map** (label evidence vs consumer consequence) · **Roster** (the shared trust-list primitive: ordered `(tier, principal)` entries) · **Plan** (Roster + combiner + purpose + scope + modes + advisory rules; the executable slice) · **GATE** (the contract/install trust profile). Full 15-row table with never-confuse columns: [object-taxonomy §1](../../Reviews/2026-07-25-lens-pass-corpus/object-taxonomy.md). "Lens" never appears in a contract ABI.
3. **A lens entry trusts a stable KEL principal** ([[kel]] §5/§7), never a raw key; the lens never rebuilds rotation/recovery/delegation. Authority grades (`AUTHORITY-ADMITTED@N` / `PORTABLE-EVIDENCE`) are consumed from the authority lane's ABI verbatim (handoff H-2, blocking on KERNEL-R).
4. **The risk bearer picks the policy**: viewer for display; gate/resource owner pins gate policy; a caller never supplies the policy that authorizes itself. Genesis ships no protocol default lens; there is no universal content/advisory tail.
5. **No silent truncation anywhere**; every limit fails typed. Full `bytes32` principals cross every boundary (venue ordinals rejected for v1 semantic surfaces).

## 1. The three tiers and the no-Graph line

| Tier | Where | What it does | What it must never need |
|---|---|---|---|
| **CORE (contract)** | on-chain, bounded gas | Plan storage + point resolution + GATE consumption; combiner whitelist `EXACT`/`PRIORITY_FIRST_PRESENT`/`THRESHOLD` + advisory point-deny | CBOR parsing, registries-as-oracles, The Graph, unbounded sets, cross-venue reads (co-residency rule P-4) |
| **RICH (client/SDK)** | off-chain, own node/replica/snapshots + the mandatory indexes | full profiles, composition, 6+1 grades, big sets, deny/whiteout, fixed-basis materialization, IVM caches | The Graph, trusted indexers, remote-RPC bare-word absence |
| **ENHANCED** | The Graph / indexers allowed | ranked, full-text, trending, global aggregates, cross-realm search, historical analytics | **nothing important may depend on it** — every enhanced feature has a fresh-L3 absence sentence and a mandatory fallback; no View or link may silently depend on one (incl. RPC methods like `eth_simulateV1`) |

Per-consumer tier assignments + fresh-L3 sentences: [use-pressure §1/§4](../../Reviews/2026-07-25-lens-pass-corpus/use-pressure.md); the enhanced feature list: [views-links §5](../../Reviews/2026-07-25-lens-pass-corpus/views-links.md). **The on-chain promise** `[LP-2]`: bounded candidate pages + exact venue-local point resolution + deterministic fixed-basis client materialization; wide sorted contract-native directories **cannot be delivered** under the live EIP-7825 cap and are not promised at any size the naive path implies.

## 2. Objects and encoding (chapter owner: ENC)

1. **Client-side canonical form:** the strict deterministic-CBOR profile (fixed arrays, preferred-shortest, no maps/tags/floats, fail-closed unknowns) for `LensSourceV2` / `EffectiveLensV2`, carried in ordinary EFS DATA with locatable refs (`LensObjectRefV1`, gaining `PLAN` and `VIEW` semantic kinds in one coordinated amendment). Identities: Channel / Revision / Effective / Compilation / Receipt (+ Plan, View, Recovery Bundle). **One ID family rule:** `id = keccak256(DOMAIN ‖ keccak256(canonicalBytes))`, no exceptions.
2. **Contract-tier form (LR-1):** `PlanV1` — packed, big-endian, fixed-width, offset-free; strictly ascending `(tier, principal)` entries, each principal at most once; bounded advisory-rule section with plan-committed fan-out caps (`MAX_ADVISORY_RULES`, `MAX_DENY_SOURCES_PER_RULE`, `rosterThreshold` ceiling, `maxValueBytes`); reserved bytes zero; exact-length frames (AO-19 rules). **No contract parses CBOR.** The normative projection `project(EffectiveLens, sliceKey) → PlanV1` is byte-exact and committed by `sliceCommitment` (leaf = whole plan, never a sub-plan entry; sub-plan proofs are deleted — a proof identifies *which plan*, never which subset).
3. **Storage (LR-1 §3):** a Plan deploys as **immutable code at a content-derived address** (SSTORE2 shape; `CREATE2` from `planId`); consumers derive the address and `EXTCODECOPY` — the store is not a trusted party. *(PLAUSIBLE — V-2 fixture is the gate.)*
4. **Caps:** CORE per-plan entry cap (candidate 64, benchmark-set) ≠ client compile ceiling (E6 candidate 256) `[LP-4]`. Limits right-sized to the 15–55 center: [object-taxonomy §2.7](../../Reviews/2026-07-25-lens-pass-corpus/object-taxonomy.md).
5. **Detail record:** [object-taxonomy §2](../../Reviews/2026-07-25-lens-pass-corpus/object-taxonomy.md) as amended by [critic LR-1 + AO-17/18/19](../../Reviews/2026-07-25-lens-pass-corpus/critic.md). Golden/rejection vectors in three languages are the chapter's exit gate (V-1).

## 3. The contract tier: resolution and GATE (chapter owner: GATE-P)

1. **LR-2 — claim-conditional authority:** principal authority status is evaluated only for principals holding a PRESENT claim at the position, and only at or above the selected winner. On-chain `UNKNOWN` is exhaustively: a PRESENT claim ungradeable at the required floor; an unrecognized encoding/profile/suite; an out-of-profile input *(PLAUSIBLE — V-3: exhaustiveness)*. UNKNOWN blocks finality, fail-closed.
2. **LR-3 — verify above the winner:** every resolution direct-probes every entry ranked strictly above the selected winner. The claimant roster (if E2 adopts it) is a planning hint; its completeness is never a correctness dependency *(PLAUSIBLE — V-4; V-5/V-6 for the challenge-window recheck and the §3.5 predicate)*. Equal-tier CONFLICT detection: early exit is legal only when the plan's `allTiersSingleton` bit is set; otherwise the walk completes the winning tier.
3. **GATE profile hard rules** `[LP-6]`: owner-pinned (`GateConfig` pins `planId` + deployer + **`kernelRef`** (realm + codehash + implementation commitment) + `expectedSemanticsProfileId`); never caller-supplied; fail-closed non-configurable; STOP on relinquish; closed enumerated authorities; no discovery influence; monotone `policyVersion` rollback floor; **`policyMaxAge`** (the accepted policy generation re-validates against the channel anchor within a declared window or the GATE fails closed); advisory evaluation over the **full pinned dependency closure**; closed action tables (unknown label values → `NONE`); `minAuthEpoch` floors per entry (KEL actor removal is prospective — [[kel]] §7.3); acceptance declared as `AcceptanceMatrixV1` (hashed, pinned, no wildcards on authorization/existence/completeness, `onReject: FAIL_CLOSED` only).
4. **Untrusted authors:** closed trusted sets or the challenge-window pattern (adopted item F), with the recheck **decision-scoped** per LR-3(ii). Counting is not a combiner: threshold gates read the kernel's revocation-aware count over a closed Roster and apply their own threshold.
5. **Cached revalidation predicate** (if `positionSeq` survives E2): unchanged position seq ∧ unchanged plan/policyVersion ∧ `block.timestamp < minExpiry` ∧ unchanged winner identity epoch ∧ unchanged consulted advisory seqs.
6. **The install ceremony re-derives the candidate set under the GATE's own rules in System Chrome**, discarding browse-view ordering; installing a non-current release is an explicit downgrade confirmation (AV-19).
7. **Detail record:** [core-onchain](../../Reviews/2026-07-25-lens-pass-corpus/core-onchain.md) as amended by [critic §1.2](../../Reviews/2026-07-25-lens-pass-corpus/critic.md); the canonical GATE vector is the re-typed [[read-lens-spec]] §9.B install walkthrough.

## 4. Profiles (chapter owner: RES/COMP)

Every profile is a compiled-policy instance with a **closed vocabulary, purpose lock, and fail-to-mount on excess** (the FS-LENS/1 method). The family: **FS-LENS/1** (chapter one, consumed unmodified with the §6-listed extensions) · **GATE/1** (§3 above; seam 19 lives here) · **ADVISORY/1** (labels are evidence; subtract-after-resolve carried verbatim from [[read-lens-spec]] §3.4; consumer-committed action lattice; **source-level relinquish** — a relinquished/revoked/unresolvable advisory source grades its rule `UNEVALUATED`, fail-closed for gates, persistent banner interactively) · **DISCOVERY/1** (union + budgets only; structurally authority-free) · **AMBIENT/1** (**owed — CR-3, blocking for the guest product**: the owner baseline as a compiled object, defined per root class against [[deterministic-ids]] lineage, with no-baseline classes rendering labelled discovery only) · collaboration read-hooks H-Q3-1…5 (feed held Q3, do not answer it).

Detail record: [profiles-composition §1](../../Reviews/2026-07-25-lens-pass-corpus/profiles-composition.md) as amended by [critic AV-15/16/17/18/20](../../Reviews/2026-07-25-lens-pass-corpus/critic.md).

## 5. Composition (chapter owner: COMP)

1. Profiles never merge; imports carry `referenceMode × importClass × transitivity`; scopes intersect; priority paths are lexicographic; equal-path conflict fails compilation (at *first* compile it degrades to a typed named choice, never a bare no-policy state); authority-import depth defaults to 1 (the anti-web-of-trust guard as a compiler default).
2. **The reserved user band:** the user's directly-authored rules occupy a priority band above all imports, unconditionally.
3. **Displacement diffs:** an imported rule taking a policy key from a rule with a different roster renders as a trust change ("removes N sources at these scopes").
4. **CH-1 (restated):** no composition can produce `ABSENT_PROVEN` without closure over every source applicable **under the compiled plan** at the joint basis; the plan's coverage of the position is reported on the result (`AMBIENT_BASELINE_ONLY` flagged). **CH-2:** false equivocation through composition is structurally impossible (collision evidence is kernel slot-scoped; policy disagreement lands on compile/basis/channel axes). *(V-9/V-26 fixtures.)*
5. Composition is basis-joint **and completeness-joint**: composite completeness = minimum over members.
6. The compiler emits per-rule **provenance back-pointers to authoring origin** (non-semantic; `EffectiveLensId` unchanged); the policy inspector's primary surface is "everything that can name a file for me."
7. Detail record: [profiles-composition §2](../../Reviews/2026-07-25-lens-pass-corpus/profiles-composition.md) as amended by [critic AV-11/AV-12/AV-14/AV-23/AV-31](../../Reviews/2026-07-25-lens-pass-corpus/critic.md).

## 6. The read-result model (chapter owner: RES)

The **6+1 axes**: the joined pass's six-part tuple — authorization / existence bound / freshness-basis / availability / slot state / completeness — plus the policy-outcome axis (`UNCHANGED | NOTED | WARNED | HIDDEN | REJECTED | UNEVALUATED(reason)`; `UNEVALUATED` added per AV-18). Rules:

1. Never two labels; never one dominance ladder. Consumers declare acceptable combinations via `AcceptanceMatrixV1` and otherwise fail closed.
2. **Absence:** the four sources ([[joined-pass-synthesis]] JR-5) with the new precondition — **a closure manifest commits only `FINAL`-enumerated scopes**; `PARTIAL(cursor)` scopes never yield absence. Every `ABSENT_PROVEN` carries rule-coverage provenance. Budget exhaustion, partial replicas, hosted-RPC bare word, deny hits, whiteouts, and author checkpoints never ground absence.
3. **Staleness/expiry:** evaluated under the named venue clock domain everywhere (a client wall clock drives labelled UI hints only). Pinned (reproducible) Views pin an evaluation-time reference in the same clock domain as their basis.
4. `HANDOFF` is deleted from the closed **slot-state axis** set for v2 unless KERNEL-R names its producer and authorization (CR-2 recommendation).
5. Salvaged from [[read-lens-spec]] re-typed: determinism; verification order (lens → signature → bytes); precompute-then-verify; the expiry context split (GATE stops on STALE; interactive labels); discovery output never enters slot resolution.
6. Detail record: [profiles-composition §3](../../Reviews/2026-07-25-lens-pass-corpus/profiles-composition.md) as amended by [critic AV-18/AV-37/AV-39/CR-2/CR-6](../../Reviews/2026-07-25-lens-pass-corpus/critic.md).

## 7. Channels, personal vs published, recovery

1. **Channels reuse KEL control and recovery** (seam 8 closed): `ChannelStateV2` is an ordinary authority-admitted claim; channel epoch = the admission receipt's `authEpoch`; fork repair = KEL `ROTATE` + `RESET`; **`ADOPT` and `RESET` are control-only, never grantable**; any transition out of `CHANNEL_CONTESTED` is a loud subscriber ceremony. Channel-admin actors use [[kel]] §7.2 grants (`CHANNEL_ADVANCE`, `CHANNEL_TOMBSTONE` as new closed actions).
2. **Personal vs published (seam 12 closed, PP-1…PP-6):** personal instances are local/encrypted; `PRIVATE_HANDLE` is a first-class, structurally unserializable `lensRef` variant; publishing is a deliberate ceremony with the 8-item disclosure list (incl. paid inclusion); starter packs are publications; personal and published objects never share a publication path (conformance rule). The routine freshness check runs against the user's own node/replica by default; remote batched checks are a disclosed non-default mode (the basis-stamped CRLite-shaped filter bundle is the promoted alternative). Honest limit: confirmation of a correctly-guessed policy cannot be prevented `[LP-7]`.
3. **Recovery:** CXF-shaped encrypted `RecoveryBundleV1` in the privacy pass's recoverable tier; restore is EFS-service-free; staleness detection consumes the adopted D-13 durable counter (refuse-or-loudly-degrade without it); honest-loss lines: local removals are not recoverable facts; inbound shares need JD-32's standing entry. Export cadence/correlation tension routed to PRIV.
4. Detail record: [object-taxonomy §3–§6](../../Reviews/2026-07-25-lens-pass-corpus/object-taxonomy.md) as amended by [critic AO-12/AO-13/AO-14/AV-36](../../Reviews/2026-07-25-lens-pass-corpus/critic.md).

## 8. Views, links, and the guest (chapter owner: VL)

1. **ViewV1** = lens-ref + location + presentation + completeness policy — a partial application of the five-part view identity; opening it completes the identity. A View structurally cannot carry trust (decoder-enforced).
2. **Link grammar** (successor of [[read-lens-spec]] §6; classifier + `~` prefixes carried unchanged): three forms — ambient / sender-hinted / exact citation. `?lenses=`/`?deny=` principal arrays are **deleted**; trust-adjacent keys ride the **fragment**; the param law: **URL params may narrow, pin, or decorate; never relocate, never loosen** (a path outside a View's location subtree makes the View inapplicable; `asof=` vs `basisPin` conflict is an error).
3. **Hints are offered, never applied:** one uniform fetch-always path (network-indistinguishable), preview-with-banner, session-scoped, never persisted past promotion; name-form Views get diff-on-open; the share sheet defaults to pinned form; promotion offers only explicitly-saved Views, nothing pre-checked.
4. **Citations split** `[LP-9]`: object/claim citations carry no policy reference by default; view citations carry the disclosure preview.
5. **The guest ladder** G0 (gateway word, labelled) → **G1 (default `[LP-5]`: client-verified authorship/bytes; absence never claimed)** → G2 (light-verified) → G3 (own node); grades ratchet up in place; promotion never converts an offer into trust; guest→account ceremonies never start from page content (and "unlock" is banned vocabulary).
6. **The non-suppressible floor NS-1…NS-11** `[LP-8]` + realm-change-as-chrome-transition + the replay-realm heuristic + grant-ceremony scope-root rendering. Floor items carry their own completeness (a truncated look-alike check warns *louder*, never softer).
7. **Out of scope, named owner:** the OS link classes (`pr`/`gx`/`gf`/`a`/`sy`/`k`) — the client lane must attack them under the same invariant (GL-9); [boot-and-profiles](../clientv2/boot-and-profiles.md) is amended for the grammar rulings.
8. Detail record: [views-links](../../Reviews/2026-07-25-lens-pass-corpus/views-links.md) as amended by [critic AV-1…AV-10/AV-13/AV-21/AV-22/AV-28/AV-32…AV-39/CR-6/CR-8](../../Reviews/2026-07-25-lens-pass-corpus/critic.md).

## 9. Scale

The design center is **15–55 entries** (10–50 trusted principals + 3–5 system principals; KEL collapses keys). Hundreds-of-curators folders are bespoke curation contracts publishing one principal — not base-lens growth. Web-of-trust stays out; the future-safe hook is fenced: published policies declare `derivationKind: CURATED | COMPUTED(algorithmRef)`; computed sets are pin-only, need per-adoption ceremonies for authority tiers, and count at full cardinality `[LP-10]`. The client counts effective authority principals **across all saved Views** against the center. What breaks past 55: gate composability first, latency second, legibility third. `MAX_LENSES = 20` is retired by the two-caps-plus-budgets structure `[LP-4]`. Kernel asks ride E2 as **one joint row**: `viewMutationVersion(author)` (MUST candidate) / `positionSeq` (option) / claimant roster (lean-adopt, LR-3 framing, honest cost curve).

## 10. Migration and conformance

- **Migration chapter (owed — CR-4):** V1-1…V1-5 incl. the ADR-0044 whole-LIST waterfall ruling (named legacy combiner with vectors, or convert-with-consent and declare unsupported — never silence); v1 `?lenses=` arrays import as one explicit `PRIORITY_FIRST_PRESENT` source revision, truncation-tail flagged.
- **Conformance suite (owed — CR-5):** one consolidated acceptance suite mapping [[read-lens-spec]] §8.3's sixteen tests to survives/superseded/replaced, absorbing every vector family in [critic §8](../../Reviews/2026-07-25-lens-pass-corpus/critic.md) (V-1…V-27). Two independent implementations remain the bar; two independent compilers + differential tests remain the compile-side bar.

## Open questions

- [ ] James: LP-1…LP-10 in [[owner-decision-inbox]] (this spec is written against the recommendations; a different arm reworks the marked chapters).
- [ ] AMBIENT/1 definition (CR-3) — blocking for the guest product; owner: this spec's §4 + vectors V-19.
- [ ] KERNEL-R: lane labels (H-1) + the authority-axis ABI (H-2) — this spec consumes both and can ship neither.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] The critic's V-1…V-27 debts dispositioned (discharged or explicitly carried)
- [ ] Golden vectors exist for every encoding this spec names
- [ ] At least one round of `#status/review` with another agent or human comment
