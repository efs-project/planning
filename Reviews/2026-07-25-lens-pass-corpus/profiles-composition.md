# Profiles + composition — the client-tier chapters of the lens book

**Lane:** PROFILES + COMPOSITION (dedicated EFS v2 lens/resolver pass, gap G-A of the 2026-07-25 joined pass — [../../Designs/efsv2/joined-pass-synthesis.md](../../Designs/efsv2/joined-pass-synthesis.md) §6)
**Question owned:** the rest of the book after [FS-LENS/1](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md) — the remaining purpose profiles (GATE-CLIENT, ADVISORY, DISCOVERY, the collaboration read hooks), composition semantics across them, the one normative read-result model, the UX compilation from one people-list, client-tier cache/invalidation, and the client-side scale story at the 15–55 design center.
**Status:** reconciliation/design input — nothing here freezes a schema or picks an MVP. This file is written to be lifted: §3 is the replacement spec's grade chapter; §1 is its profile chapters.
**Base:** the typed compiled-policy model of the [2026-07-11 lens review](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) is the working architecture (refined, not re-derived); FS-LENS/1 is settled chapter one (consumed, never reopened); the consumer register [use-pressure.md](./use-pressure.md) and technique menu [research.md](./research.md) are the foundation inputs; rows cited by LC-code.
**Marking:** every substantive claim is **VERIFIED** (named file/source/computation) or **PLAUSIBLE** (constructed; needs vectors). §10 lists what could not be verified.

#status/draft #kind/review #repo/planning #topic/lenses #topic/efsv2

---

## 0. Verdict, names, and the shape of the book

**The verdict in one sentence:** every remaining lens purpose fits the review's grammar as a *closed-vocabulary, purpose-locked profile* exactly the way FS-LENS/1 did it — no profile below required extending the grammar — and the two things that make the family safe at the client tier are (a) a **profile lock** that makes consuming the wrong profile a refusal instead of a degradation, and (b) two **composition honesty theorems** (§2.7) that make false absence and false equivocation through composition structurally impossible rather than merely discouraged.

**Names adopted** (from the pass seeds + [use-pressure §6](./use-pressure.md)):

| Word | Meaning | Bearer |
|---|---|---|
| **Lens** | the end-user read-view (human word only) | UI |
| **GATE** | the contract-gating / installer / app-store / update trust function — a purpose-locked compiled policy, never the social lens | LC-6, LC-9 |
| **View** | a saved, linkable lens: the five-part identity ([filesystem-core §2.2](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md)) + presentation config | LC-2/12/13/14 |
| **Roster** | the shared trust-list primitive: a small ordered set of stable KEL principals with tiers/effects, on-chain-representable (the compiled `AuthorityGroup[]` of [review §4.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)) — the object T-CONTRACT reads directly and every profile compiles against | LC-9, SCALE-1 |

**The book** (each chapter = one profile family, one closed vocabulary, one fail-to-mount rule):

| Chapter | Profile | Status | Purpose IDs (illustrative) |
|---|---|---|---|
| 1 | **FS-LENS/1** — filesystem browse | settled ([filesystem-core §1](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md)); consumed | `FS_BROWSE`, `FS_CITE` |
| 2 | **GATE/1** — package/update/security-config, client twin of the on-chain gate (§1.2) | this file | `GATE_INSTALL`, `GATE_UPDATE`, `GATE_SECURITY_CONFIG` |
| 3 | **ADVISORY/1** — moderation/labels (§1.3) | this file | `ADVISORY_APPLY` |
| 4 | **DISCOVERY/1** — candidate proposal (§1.4) | this file | `DISCOVER_CHILDREN`, `DISCOVER_FEED`, `DISCOVER_SEARCH_SEED` |
| 5 | **COLLAB read hooks** — what Q3's revision-DAG reads require (§1.5) | hooks only; Q3 held | (future `COLLAB_*`) |
| 6 | The read-result model (§3) | this file — the liftable grade chapter | all |
| 7 | Composition (§2), UX compilation (§4), caches (§5), scale (§6) | this file | all |

Everything below is bounded by the rails: three tiers (CORE/CONTRACT → RICH/CLIENT → ENHANCED), the 15–55 design center (SCALE-1/SCALE-2, [use-pressure §2](./use-pressure.md)), the kill list, the four PROVEN-ABSENT sources, principals-not-keys ([kel §5/§7](../../Designs/efsv2/kel.md)), risk-bearer-picks-policy, and genesis-ships-no-default-lens. No adopted ruling is contradicted; **no Pushback section is required.**

---

## 1. The profile family

### 1.0 The common law of profiles

A **profile** is a frozen tuple the compiler enforces and every consumer checks (generalizing FS-LENS/1 §1.2's fail-to-mount rule to the whole family):

```text
ProfileLaw = {
  profileId,                 // e.g. GATE/1
  purposeIds,                // closed set this profile may compile under
  combinerVocabulary,        // closed subset of the seven typed combiners + evidence states
  importClassesAllowed,      // which import classes may appear, and in which referenceMode
  relinquishDefault,         // FALLTHROUGH_ON_RELINQUISH | STOP_ON_FORMER_AUTHORITY (per-rule overridable or not)
  unknownRule,               // what UNKNOWN does to finality (always: stops; profiles differ in whether PROVISIONAL exists)
  advisoryActionCeiling,     // strongest action an imported advisory entry may carry without explicit acceptance (§2.4)
  tupleConsumptionRow        // the §3.2 acceptance matrix this profile's canonical consumer declares
}
```

Three laws bind every profile:

1. **Purpose lock.** Every `EffectiveLens` carries `(profileId, purposeId)` inside its canonical bytes (already present as `semanticsProfileId`/`purposeId` in the review's wire grammar — [review §4.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)). A consumer names the profile it requires; a mismatch is a **refusal**, never a degraded execution. This is the structural answer to the profile-confusion breakage (§7.4). VERIFIED (fields exist in the wire grammar; the lock rule is FS-LENS/1 §1.2 generalized).
2. **Excess fails closed.** A source whose compiled rules exceed the profile vocabulary fails to compile *for that purpose*; a compiled plan whose rules exceed the consumer's profile fails to mount/load. Nothing is silently dropped (no-silent-truncation, review freeze item 18.1.8).
3. **The tuple is never collapsed.** Every profile's output is the §3 result model. Profiles differ only in *which combinations their canonical consumers accept* (§3.2), never in the vocabulary of the result.

### 1.1 Chapter one, restated in one paragraph (FS-LENS/1 — settled)

Consumed verbatim from [filesystem-core §1](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md): `PRIORITY_FIRST_PRESENT` for exclusive name/property slots, `EXACT(owner)` point baseline, `UNION_SET` candidate enumeration, `ADVISORY(actions)` subtract-after-resolve, WHITEOUT as authenticated mask evidence; `FALLTHROUGH_ON_RELINQUISH` default for overlay folders; FSP-BASIS-1 one-basis invariant; FSP-ABSENT-1/2 absence sources; no `THRESHOLD`, no `MERGE`, no GATE purposes. Not reopened here; §2 and §3 are written to compose with it.

### 1.2 GATE/1 — the client-side gate (packages, updates, security config; seam 19 lives here)

**What it is.** The client-tier twin of the on-chain GATE: the purpose-locked policy an installer, updater, launcher-preflight (playable archive), CI verifier, or security-config loader executes. TUF is the design precedent ([review §14.3/§17.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)); Zodiac Roles v2 is the deployed on-chain existence proof for the small stored twin ([research §1.2](./research.md)). The on-chain twin and GATE/1 are **one compiled artifact family**: a small GATE plan (1–16 principals, [use-pressure LC-9](./use-pressure.md)) can be stored/pinned by a contract and executed at Level 3; the client executes the identical semantics for anything wider or off-chain. One semantics, two executors — never two policy languages ([review §4.3](../2026-07-11-efsv2-lens-architecture-and-scale-review.md): the EVM projection rule, applied twice).

**Vocabulary (closed):**

| Rule class | Combiner | Scope shape | Notes |
|---|---|---|---|
| Release/artifact authority | `EXACT(publisher)` or `PRIORITY_FIRST_PRESENT` over a **closed** Roster | roots = registry/package containers; predicates = `releaseOf`/version-binding definitions; claimRole = placement/metadata | tiers are explicit; equal-rank difference = CONFLICT = **fail closed** (no carrier row in GATE) |
| High-risk role approval | `THRESHOLD(k,n)` over a closed committee Roster | claimRole = approval; predicate = the approval definition | quorum intersection (`2k > n`) required at this profile's high-assurance grade; unknown/revoked committee evidence blocks (review §2.2 carried) |
| Security-config point reads | `EXACT(owner)` | claimRole = metadata/config keys | the §9.C shape of the old spec, re-typed |
| Advisory reject | `ADVISORY(actions)`, actions ∈ {`REJECT`, `BLOCK`} only | labelDefinitionId-scoped (malware/vuln/yank classes) | `honorStale = true` default ([read-lens-spec §3.4 rule 4](../../Designs/efsv2/read-lens-spec.md) salvage — vulnerabilities don't heal); subtract-after-resolve; never reselects |

**Structural rules (each a MUST of the profile):**

1. **Closed authorities.** Every Roster in a GATE/1 plan is enumerated at compile time; there is no open tier, no discovery-fed membership, no wildcard. `importClassesAllowed = {AUTHORITY_RULES, ADVISORY_RULES}`, **`referenceMode` locked to `PINNED_REVISION` in the compiled plan** (channels may appear in source; compilation pins; a GATE never follows a live channel — review §4.4's rule, made a profile invariant).
2. **No discovery influence.** `DISCOVERY_RULES` are not in the vocabulary; a GATE source containing them fails compile. Candidate *versions* arrive from a separate DISCOVERY/1 run (or user input) as untrusted proposals; the GATE then point-resolves each candidate under its own closed rules. Discovery proposes; the GATE disposes — and the two never share a compiled object. VERIFIED (register LC-6/LC-8 separation; kill-list "discovery output entering slot resolution").
3. **STOP-on-relinquish, always.** `FALLTHROUGH_ON_RELINQUISH` is not in the vocabulary. A revoked/lapsed publisher stops resolution of that name — the `latest` dist-tag squatter ([read-lens-spec §9.B step 7](../../Designs/efsv2/read-lens-spec.md), carried as the canonical vector) is structurally impossible. Recovery of a name is a *ceremony* (policy update with diff), never a fallthrough.
4. **Expiry + freshness floors are mandatory.** Every GATE rule carries a `freshnessProfileId` with a **maxBasisAge**: the evidence basis of the resolution must be younger than the floor, evaluated under the venue clock only (no wall clock in GATE context, no author-asserted TID — [fs-pass-synthesis C1](../../Designs/efsv2/fs-pass-synthesis.md)). Mutable pointers (dist-tags, config, trusted-key lists) additionally require author-side `expiresAt` per the mutability doctrine split ([read-lens-spec §5.6](../../Designs/efsv2/read-lens-spec.md), salvaged). `STALE` stops. A GATE that cannot reach fresh-enough state **fails closed**; there is no PROVISIONAL in GATE output (review §6.3 rule carried).
5. **Absence at GATE grade.** "No newer release / no revocation" claims consume only the four PROVEN-ABSENT sources. Checkpoint-grounded absence is dead (kill list); an author checkpoint appears in GATE evaluation only as a *freshness hint*, never as an absence prover — consistent with held Q4A, consumed not re-asked.
6. **Rollback protection = local monotone floors.** The consumer records, per exclusive position it has acted on, the accepted `(EffectiveLensId acceptance floor, channel generation floor, slot (order, recordDigest) floor)` and refuses lower values (review §4.5 rule 9 + §5.4). This is deliberately *not* a cross-author latest-wins (killed): each floor is within one authority's own slot order or one channel's own generation — domains where order is defined.
7. **Authorization grade.** GATE consumption requires `AUTHORITY-ADMITTED` on the selected claims (register LC-6/LC-9; R-AU3). `PORTABLE-EVIDENCE` and the `EVIDENCE-ORDERED@N` dating label render in audit views but never satisfy the acceptance matrix. Fixed input from the joined pass; surfaced verbatim.
8. **Seam-19 separation.** The **package closure identity** (artifact bytes, interfaces, runtime, dependencies) is policy-independent — identical bytes get identical closure IDs no matter whose GATE resolved them. The **update-resolution receipt** is the GATE/1 output: it pins `EffectiveLensId`, compilation record, advisory snapshot refs, basis vector, freshness evaluations, and the chosen release — the §3 tuple frozen at decision time ([human-overview seam 19](../../Designs/efsv2/human-overview.md), discharged into this profile). Two users with different GATEs who accept the same bytes share a closure ID and differ only in receipts.
9. **Self-hosting: updates to a GATE policy are themselves GATE-graded.** Accepting a new revision of a GATE channel requires the update ceremony at this profile's strictness: explicit adoption, semantic diff, threshold where the policy declares it, and a monotone acceptance floor so a rolled-back policy revision is refused (review §5.4 role table row "add update/release authority: explicit adoption"). A GATE channel in `CHANNEL_CONTESTED` freezes at the last accepted generation and alerts; it never auto-picks a branch.

**What GATE/1 must never express:** discovery rules; `UNION_SET` as an authority combiner; `MERGE`; `FALLTHROUGH_ON_RELINQUISH`; open/wildcard membership; caller-supplied policy (the risk bearer — device owner or resource owner — pins it); wall-clock temporal bounds; advisory actions weaker than BLOCK entering the decision (a WARN-class label may render in the ceremony UI but cannot be the *reason* an install proceeds/fails — the decision table is {clean, REJECT/BLOCK} only, keeping the outcome binary and auditable). PLAUSIBLE (the WARN-exclusion refinement is constructed; vectors should confirm it doesn't break a real journey).

**How it breaks (paired):**
- *Publisher lapse* → STOP + ceremony, name never falls to a squatter (rule 3). Residual: availability loss until the user acts — correct for executables.
- *Advisory-source removal re-enables malware* → removal of a deny source is a **trust-expanding** change: the ceremony previews re-enabled objects ("removing OSV re-enables 14 blocked releases") and requires explicit confirmation (review §5.4 table row). Residual: a user who confirms blindly — surfaced, not solved.
- *Committee member key stolen* → `THRESHOLD` counts stable principals once, checks revocation at the basis, and blocks when unseen votes could change the outcome; the stolen key's window is the revocation-inclusion latency (D-2/P-5r2, an authority-home parameter, not a lens parameter).
- *Rollback attack (serve an old signed release)* → the slot floor (rule 6) refuses; if the attacker withholds state instead, the freshness floor (rule 4) fails closed.
- *Wedge risk*: a GATE over an unreachable venue stops. That is the design: for executables, unavailability must beat wrong. The escape is an explicit, disclosed, locally-set stale-tolerance override (the old `--allow-stale-as-of` shape, [read-lens-spec §9.B step 8](../../Designs/efsv2/read-lens-spec.md)) — reader policy, never a default.

### 1.3 ADVISORY/1 — moderation and labels

**What it is.** The profile that selects signed label evidence and maps it to consumer actions. The two-layer split is validated in production (Bluesky labelers — labels are evidence, subscribers map to actions; [research §5.1](./research.md)): **a labeler says what it observed; the risk bearer decides the consequence.**

**Vocabulary (closed):**

| Rule class | Mechanism | Scope shape | Notes |
|---|---|---|---|
| Label selection | per-source point reads over `(sourcePrincipal, labelDefinitionId, targetKey)` advisory slots; sources in tiers (`AuthorityGroup`s) | labelDefinitionId + targetKinds + roots + purposes | selection is evidence-graded per §3: a REVOKED label is withdrawn and never subtracts; label evidence with `SAME_SLOT_COLLISION` at the source surfaces the evidence and never subtracts as a clean hit ([read-lens-spec §3.4 rule 3](../../Designs/efsv2/read-lens-spec.md) re-typed) |
| Action mapping | a committed `actionTable`: `(labelValue, sourceTier) → action` | local to the consuming policy | action lattice: `REJECT > BLOCK > HIDE > WARN > NOTE > NONE`; multiple hits combine by lattice max; committed bytes, never inferred |
| Match keys | ordered most-specific-first: exact claimId → target object id → position/anchor | carried verbatim from [read-lens-spec §3.4](../../Designs/efsv2/read-lens-spec.md) | O(D × matchKeys) point reads via the typed reverse index — never enumeration ([review §8.4](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)) |

**Structural rules:**

1. **Subtract after resolve; never reselect.** The advisory pass runs on the already-selected winner; a hit transforms (`WARN/HIDE/REJECT`), it never re-opens resolution to a lower tier — advisory-driven reselection would let a labeler rewrite the namespace with lower-trust content (trust inversion; carried into FS-LENS/1 already; restated here as the profile's first law). If an application ever wants reselection it needs a separately named combiner with its own vectors — not this profile.
2. **No negation across sources.** Absence of a label from source A is not evidence about anything; a "clean" assertion from A never cancels a "malware" assertion from B. Sources compose by union of hits; disagreement is visible provenance, resolved only by the consumer's table (tier weighting) — never by inter-labeler arithmetic. PLAUSIBLE (constructed; closes a composition hole no prior text named).
3. **Freshness in the fail-safe direction.** `honorStale` defaults ON for GATE-class consumers and labels stale advisories in interactive ones; a GATE-class consumer with a declared deny-feed freshness floor that cannot reach its feed within the floor **does not proceed** (register LC-7's availability row). Expiry guidance: deny claims publish `expiresAt = 0`.
4. **Scale envelope:** 2–8 sources per rule, ≤32 advisory principals per policy (measured labeler reality, [research §5.1](./research.md); register LC-7). Aggregators (OSV, RustSec) are ONE principal each.
5. **The un-deny is REVOKE**; withdrawal propagates like any revocation and the cache vector (§5) treats advisory-source versions as first-class heads.

**What ADVISORY/1 must never express:** authority/placement rules (a labeler never names winners); discovery; WHITEOUT (masking is an authority-tier act, §2.4); action escalation chosen by the labeler (the action table lives with the consumer — under composition the imported table is clamped, §2.4); actions consumed from label *bodies* rather than the committed table.

**How it breaks (paired):**
- *Advisory-driven censorship* (a labeler tries to make things vanish): structurally capped — the labeler controls only label values; the consumer's table controls actions; imported tables clamp (§2.4); `HIDDEN` results remain inspectable with provenance (`DENIED(hits)` is a labeled state, not an absence — §3). Residual: a user who subscribes to a censorious labeler *and* raises its ceiling *and* never inspects — that is a chosen editor, surfaced by disclosure (LC1 carried), which is the correct residual in a pluralism design.
- *Label spam / hot-target inflation*: advisory reads are keyed point reads (O(D × matchKeys)); outsiders cannot enter a selected source's slots; they can inflate the shared *claimant roster* of a hot advisory position, degrading the roster plan to direct-D probes — priced, bounded (review §8.6).
- *Aggregator compromise*: one principal's compromise poisons its feed until revoked/rotated (KEL) — the 2–8-source design center exists precisely so one feed is never the sole floor for a GATE-class decision (committee + threshold on the authority side is the primary defense; advisories are the belt-and-braces layer, [read-lens-spec §9.B step 5](../../Designs/efsv2/read-lens-spec.md)).

### 1.4 DISCOVERY/1 — candidate proposal

**What it is.** The profile that proposes candidates — children beyond the trusted set, feeds, follow activity, search seeds — and is **structurally incapable of authority**. Deployed evidence that this firewall is the right shape: no production feed system lets a feed operator alter name authority ([research §5.4](./research.md)).

**Vocabulary (closed):**

| Rule class | Mechanism | Notes |
|---|---|---|
| Candidate union | `UNION_SET` over declared sources with a named dedup key (exact semantic position / canonical value) | the only combiner in the profile |
| Modes | `DISCOVER_CHILDREN` (container-scoped cross-author index pages), `DISCOVER_FEED` (admission-order venue pages), `DISCOVER_FOLLOW` (selected principals' activity), `DISCOVER_SEARCH_SEED` (client search seeding) | each mode is a named pipeline; modes combine only in the client presentation layer, never inside one rule |
| Budgets | `perSourceBudget` mandatory on every rule; total scan/probe/result budgets per read | fair scheduling + per-source cursors carried from [review §8.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) |

**Structural rules:**

1. **Output is DISCOVERY-flagged and quarantined**: it never enters slot resolution, never satisfies or grounds absence, never appears unlabeled beside resolved content, never feeds a GATE, and counts are never gate-consumable ([read-lens-spec §7.2](../../Designs/efsv2/read-lens-spec.md) carried verbatim; kill list).
2. **The wide row.** Sources may legitimately exceed 55 (following 500 people) because each source costs only its declared budget share and no per-position probing multiplies — authority-free fan-out (register LC-8, §2.4 exception table).
3. **Completeness honesty**: venue-relative ("all admitted here" at basis) from the mandatory container-scoped index; `DISCOVERY(INDEXED)` with named indexer trust in the ENHANCED lane. Ranked/full-text/trending are ENHANCED-only and no base feature may consume them (adopted item 15).
4. **The web-of-trust hook, fenced.** The only ingestion path for computed social graphs is: an application *publishes a resulting explicit policy* (a signed curator View with evidence attached) which a user deliberately imports — scores never enter kernel semantics; the discovery import class is the sole path; creep watch: any *computed* principal set inside a compiled plan without a signed source revision is the Nostr-WoT oracle failure returning ([research §5.3](./research.md) — field evidence attached).

**What DISCOVERY/1 must never express:** exclusive combiners, thresholds, advisory actions, WHITEOUT, relinquish semantics (nothing to relinquish — no authority), imports of class other than `DISCOVERY_RULES`.

**How it breaks (paired):** a flooded source consumes only its budget (fair scheduling); "nothing enumerated" is never absence (the four sources rule); a trending rank presented as trust is a labeling violation caught by the profile lock (a discovery result cannot carry the authorization axis values at all — §3 table). Residual: attention capture inside the labeled untrusted view — a product/UX problem, not a semantics one.

### 1.5 Collaboration read hooks (Q3-shaped; named, not answered)

Held Q3 (public collab = revision DAGs + curation, Q3A recommended) stays held. This lane names **what any Q3 arm requires from the lens system**, so the future COLLAB profile has its seams pre-cut. Disclosed coupling: like FS-LENS/1, these hooks are *written against* the Q3A shape; a different arm reworks H-Q3-2/3. VERIFIED against register LC-10 + [fs-pass-synthesis C7](../../Designs/efsv2/fs-pass-synthesis.md).

- **H-Q3-1 Proposal closure.** A collab read must enumerate proposal containers with completeness closure at one basis (an editor who acts on "all proposals" needs R-QC7-grade closure) — this is FS-LENS/1's `UNION_SET` + FSP-BASIS-1, consumed unchanged. No new machinery.
- **H-Q3-2 Current-head resolution.** "The document's current head" is an exclusive position under `PRIORITY_FIRST_PRESENT`/`EXACT` over the editor Roster with a **declared** relinquish mode (an ejected editor's head yields or stops per the collab charter — the FS default does not silently apply). Head-pick curation is an ordinary published rule by the curator principal, not a new combiner.
- **H-Q3-3 Ratification.** `THRESHOLD(k,n)` over the closed editor committee, from the GATE/1 vocabulary (org control via KEL succession, [kel §11](../../Designs/efsv2/kel.md)). Poll/close rules that need trustless time consume `admittedAt` — the held E3 surface; the hook names the dependency and does not answer it.
- **H-Q3-4 Merge views.** `MERGE(strategyId)` exists **only** under a COLLAB purpose with a committed algebra, operation identity, causal-closure rule, and vectors (review §2.2); it is outside FS/GATE/ADVISORY/DISCOVERY vocabularies permanently. The C7 corrections bind: the fold input is the causal closure of the trusted set — the lens masks content, never membership; public open-membership op-folds stay struck.
- **H-Q3-5 History vocabulary.** `SUPERSEDED`/`asOf/since/history` rendering from the result model (§3) suffices; no collab-specific grades.

### 1.6 The retired cap

`MAX_LENSES = 20` (and `MAX_ATTESTERS_PER_QUERY = 20`, the 8-exclusion cap) is retired across every profile: replaced by per-profile compiled ceilings (E6's 256 portable compile ceiling pending measurement) + per-read budgets (`maxProbes`/`scanLimit`/`maxResults`) that **fail typed on excess** — never truncate (register §3 V1-1..3 migration obligations, carried).

---

## 2. Composition semantics

### 2.1 What composes, and what never does

Composition happens at **compile time, per profile**. A person's working set is:

```text
one people-list (§4)  ──deterministic mapping──▶  per-profile source revisions
      + imports (pinned or followed channels)          │ compile (per profile)
                                                       ▼
   { FS EffectiveLens, ADVISORY EffectiveLens, DISCOVERY EffectiveLens, [GATE plans per resource] }
                                                       │
                                              a View bundles refs to these
```

**Profiles never merge with each other.** An import carries exactly one `importClass`, and class never converts (review §5.1 carried): importing a curator's authority rules imports nothing of their advisory or discovery rules. A View *bundles* per-profile compiled objects by reference; it is packaging, not policy fusion. This is the first composition-honesty wall: there is no operation anywhere in the pipeline that could move a discovery source into an authority slice or an advisory action into a placement rule. VERIFIED (import-class mechanics: review §5.1; the never-merge framing is this lane's consolidation).

### 2.2 Priority paths and scope intersection at the 15–55 center

Carried from the review, restated as the normative composition core:

1. Every import edge carries `mountPriority`; every rule carries class-local `rulePriority`. Compilation produces the lexicographic **priority path** `[outerMount, …, innerMount, localRulePriority]` per compiled rule. For one concrete query and one class-specific policy key, the greatest applicable path supplies the rule; scope containment never invents precedence (review §2.1).
2. Every imported rule receives `intersection(parentImportScope, childRuleScope)` across all scope dimensions; empty intersection grants nothing; wildcards are explicit; same-clock temporal windows tighten, different-clock windows conjoin; numeric budgets take the stricter bound; attenuation never upgrades class, label definition, action table, or discovery mode (review §5.1–5.2).
3. **Equal-path conflict = compile failure.** Two rules at the same priority path and same policy key with different executable semantics fail compilation with both provenance chains in the error (review §2.1). No runtime tie-break, no byte-order authority.
4. **Depth defaults enforce SCALE-2.** `AUTHORITY_RULES` imports default `LEAF_ONLY`; `ALLOW_NESTED` with `maxDepth > 1` for authority requires an explicit compiler flag and renders loudly in the ceremony — the friends-of-friends creep guard, now a compiler default rather than prose ([use-pressure SCALE-2](./use-pressure.md); cargo-vet's deliberately non-transitive imports are the deployed precedent, [research §7.2](./research.md)). Advisory imports likewise default depth 1. Discovery may nest to the profile bound.
5. **Diamonds and cycles.** Import graphs build before expansion; cycles reject; the same immutable revision reached by two paths compiles once (memoized by `(LensRevisionId, intersectedScope)`) with both provenance paths retained; expansion is bounded by `maxImportNodes/Edges/EffectivePrincipals/CompileWork` and fails typed (review §5.2–5.3). At the 15–55 center with ≤20 subscribed channels these bounds are far from binding — they exist for the adversarial case.

### 2.3 Update-time composition (channels)

A followed channel advances → compilation *at acceptance time* re-pins: the channel anchor's unique head is fetched and verified (bounded `channelAnchorSummary` read — no history replay), the new revision compiles, the **semantic diff** renders by role polarity (review §5.4: removals are NOT automatically safe — removing rank 1 exposes rank 2; the old pin-and-diff "live-follow removals" default is dead), and only explicit acceptance moves the generation. `CHANNEL_CONTESTED` is sticky: following stops at the last accepted generation; resolution continues under the already-compiled plan. Seam 8's ruling direction binds: the channel reuses KEL control/recovery; only generation/fork/tombstone/rollback state is lens-specific. VERIFIED (review §4.4 re-based per [human-overview seam 8](../../Designs/efsv2/human-overview.md)).

### 2.4 Deny and whiteout across composed sources

The two suppression mechanisms compose differently, and the difference is load-bearing:

- **WHITEOUT is authority-tier evidence.** An imported curator's whiteout masks only *within the intersected scope of that import* and only *at that import's tier*: any higher-tier rule (including the user's own tier-0/1 rules) overrides it; it stops lower tiers within scope; it is always attributed and inspectable (FS-LENS/1 §1.5 + P-17's visible-inert-tombstone arm assumed). A whiteout can never arrive through an `ADVISORY_RULES` or `DISCOVERY_RULES` import — it is placement-class evidence, so only authority imports can carry the rule that honors it. Cross-author removal stays a deny-advisory convention (you hide from *your* view; you cannot mask inside *their* layer).
- **Advisory imports add sources, not power.** Importing `ADVISORY_RULES` imports label-source selection and label definitions. The imported action table is **clamped to the importing profile's `advisoryActionCeiling`** unless the importer explicitly accepts stronger actions per label class in the ceremony (interactive default ceiling: `WARN`; GATE ceiling: `BLOCK/REJECT` but only for sources the GATE owner enumerated). So a subscribed moderation pack can *warn* everywhere out of the box, but *hiding* and *rejecting* require the user's (or gate owner's) own committed table — the labeler-controls-action failure cannot be smuggled in through composition. PLAUSIBLE (the clamp is this lane's construction; it needs ceremony-UX vectors; the underlying "actions belong to the consumer" rule is VERIFIED review §2.2/§8.4).
- **Deny never re-opens resolution under composition** — the subtract-after-resolve law is per-position and global across all composed advisory sources: hits from any source union into one labeled outcome; no combination of imports can convert a deny into a reselection.

### 2.5 The client compile pipeline

Normative shape (Phase-1 of the review's sequence, upgraded with the mid-2026 method evidence):

1. **Two independent compilers** (Rust + TypeScript first), one executable reference model, **differential conformance**: every production compiler is continuously tested against the model over the golden + adversarial vector corpus (Cedar's assurance method, adopted as method not substrate — [research §4.2](./research.md)). Same source + same pinned imports + same profile ⇒ byte-identical `EffectiveLensId`, or the binding is rejected (review §4.3 fail-closed rule).
2. **Compilation artifacts:** `LensRevisionId` (source), `EffectiveLensId` (executable), `LensCompilationRecord` (signed binding, pinned import closure, bases), `PrivateLensHandle` for personal policies (the deterministic ID never leaves the device for a private policy — dictionary-attack rule, review §11.2).
3. **The exemptions ledger** (adopted from cargo-vet, [research §7.2](./research.md)): the compiler emits, per profile, the diffable list of scopes reachable from the user's roots that **no rule covers** ("under `/software/…` you have no update authority configured; the ambient owner baseline applies"). Rendered at every ceremony; kills silent-gap drift.
4. **Preview infrastructure:** `eth_simulateV1` state overrides let the client dry-run a not-yet-accepted plan against live state for the semantic diff ("this update changes 3 known winners") without registering anything — RPC-trust-graded, display-only ([research §3.2 item 6](./research.md)).
5. **Compile is off the read path.** Serving always executes an already-compiled plan; compile/update failures leave the previous accepted generation in force (availability property; makes composition wedges update-time-only, §7.3).

### 2.6 Cross-profile consistency requirement

One person's FS, ADVISORY, and DISCOVERY compiled objects may be consumed in one rendered view (a directory listing = FS resolution + advisory transform + discovery-labeled extras). The composition rule is **basis-joint**: all three execute at the same evidence basis and the same generation set, and the receipt names all consumed `EffectiveLensId`s. A mixed-basis composite (FS at basis B1, advisory at B2) must label itself cross-basis and is never GATE-consumable — FSP-BASIS-1 lifted from the FS profile to the composed view. PLAUSIBLE (generalization; needs one vector: revocation of an advisory source between B1 and B2).

### 2.7 The composition honesty theorems

The mission's hard requirement: false absence and false equivocation must be **structurally impossible** through composition — impossible because no rule in the closed system produces them, not because implementers are careful.

**CH-1 (no false absence).** Claim: no composition of sources, imports, budgets, or suppressions can produce `ABSENT_PROVEN` unless every composed source contributing to the position's applicable rule slice yields `NEVER_CLAIMED` with closure from one of the four absence sources at the joint basis.

Argument (by exhaustion over the closed transition system):
1. `ABSENT_PROVEN` for a position is *derived*, never stored: the resolver emits it only when the per-source evidence-state evaluation of **every** applicable authority source in the winning rule slice returns `NEVER_CLAIMED(closure)` (review §6.2 transition table: `NEVER_CLAIMED` with complete proof is the *only* yielding state; the table is total and closed).
2. Every path that could fake it maps to a different, non-yielding state by construction: unreachable/partial source → `UNKNOWN` (stops finality); budget exhaustion → `INCOMPLETE_BUDGET` with continuation (never absence — four-sources rule); whiteout → `WHITEOUT` (masks and stops; recorded as policy suppression, existence axis untouched — §3); advisory hide/deny → advisory-axis outcome on a `PRESENT` result (§3; denial is not absence); a hosted RPC's bare "no rows" → RPC-trust grade, refused as closure (FSP-ABSENT-2 carried).
3. Composition only *adds* sources and *narrows* scopes. Adding a source adds a conjunct to the closure requirement (monotone: more sources can only move a result away from `ABSENT_PROVEN`, toward `UNKNOWN`/`PRESENT`); narrowing a scope removes positions from a rule's applicability but never converts a state. There is no subtraction operation on evidence anywhere in the pipeline.
4. The remaining attack — composing a rule slice so the honest source is *not applicable* (scope-gerrymander it out) — changes which rule answers, not the absence grade of the answer: the position then resolves under whatever rule remains (possibly the ambient baseline), and that rule's own closure requirement still binds. Absence still requires real closure from someone; the gerrymander can redirect trust (the user's declared policy — visible in the diff/exemptions ledger), never mint proof. ∎ PLAUSIBLE-as-proof (the argument is exhaustive over the specified transition system; the conformance obligation is a vector family: each bullet in step 2 as a fixture, plus a composed 3-import fixture where exactly one source lacks closure ⇒ result `UNKNOWN`).

**CH-2 (no false equivocation).** Claim: no composition can brand an author equivocal; collision evidence is producible only by the kernel's slot-scoped evidence, never by policy arithmetic.

Argument:
1. The only equivocation-class object in the system is `SAME_SLOT_COLLISION`, scoped to `(author, semanticPositionId, current winning order)` and produced by kernel evidence (two different admitted digests at that exact slot) — the global same-`(author, order)` rule is deleted (seam 6 closure, [filesystem-core §1.8](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md); binding here).
2. Composition operates on *rules about principals*, never on *claims*: no compiler or resolver step writes claim evidence, so no composition state can reach the collision flag's producer. Type-level separation, checkable in the reference model.
3. The three look-alikes each land elsewhere by construction: two imports ranking one principal differently at overlapping scopes → priority-path selection or equal-path **compile failure** (§2.2.3) — a policy conflict attributed to the importer, never author evidence; two *composed venues/bases* showing different admitted sets for one author-slot → basis divergence on the freshness/basis axis (`MIXED-BASIS`, cross-basis label) — venue skew, not duplicity; a forked *channel* → `CHANNEL_CONTESTED` on the import (stops following) — channel state, not author-record evidence; cross-author contention at one name → rule-level `CONFLICT` (FS-LENS/1 §1.4.1) — never equivocation vocabulary.
4. Therefore the only way a reader ever sees author-duplicity evidence is the kernel presenting two admitted digests at one exact slot — which is the true condition. ∎ PLAUSIBLE-as-proof (same status as CH-1; vector family: the three look-alikes as fixtures asserting the exact output axis each lands on).

These two theorems are the composition chapter's conformance gate: both vector families ship in the Phase-1 corpus alongside the encoding vectors.

---

## 3. The read-result model (the liftable grade chapter)

### 3.1 One model: six evidence axes + one policy-outcome axis

The joined pass fixed the tuple (F-15, binding): *authorization / existence bound / freshness-basis / availability / slot state / completeness* — never compressed, never two labels. The 07-11 review supplied the orthogonal working vocabularies (`AuthorSlotState`, `CandidateFreshness`, `ResolutionStatus`, `AdvisoryResult`, availability flags). FS-LENS/1 §1.8 adopted axes-not-ladders. This section unifies them: **the six tuple members are the six evidence axes; `AdvisoryResult` is a seventh, policy-outcome axis recorded alongside but never inside the evidence tuple.** Keeping policy outcome off the evidence tuple is what makes "policy suppression never grounds absence" (CH-1) mechanically checkable rather than stylistic. VERIFIED (each axis and value below traces to a named source; the 6+1 arrangement is this lane's unification).

**THE TABLE** (normative; closed sets; a conforming reader treats unknown values as `UNKNOWN`-class and fails closed):

| # | Axis (tuple member) | Closed values | Produced by | Consumption rule |
|---|---|---|---|---|
| 1 | **Authorization** (per selected claim) | `AUTHORITY-ADMITTED@ordinal` \| `PORTABLE-EVIDENCE` (+ orthogonal dating annotation `EVIDENCE-ORDERED@N`) | the authority lane's bounded ABI ([kel §8.2](../../Designs/efsv2/kel.md) receipts); the lens surfaces **verbatim, never computes** (FS-LENS/1 H-2 posture, generalized) | GATE-class consumers require `AUTHORITY-ADMITTED`; interactive renders both with the grade visible; `EVIDENCE-ORDERED@N` refutes dating claims only, never upgrades authorization (D-1) |
| 2 | **Slot state** (per contributing source × position; the winner's is the tuple member, the per-source vector inspectable) | `PRESENT(value, prov)` \| `NEVER_CLAIMED(closure)` \| `RELINQUISHED(evidence)` \| `WHITEOUT(maskScope, prov)` \| `HANDOFF(successor, evidence)` \| `UNKNOWN(cause)` | kernel state + resolver evidence evaluation (review §6.2) | combiner transitions per profile (§1); only `NEVER_CLAIMED(closure)` yields; `UNKNOWN` stops finality everywhere; `SAME_SLOT_COLLISION` rides as an orthogonal evidence flag on `PRESENT` if the kernel surface exists (E2-gated) |
| 3 | **Existence bound** (per position, composed) | `PRESENT(winner)` \| `ABSENT_PROVEN(source∈4, basis)` \| `UNKNOWN(blocking deps)` | resolver composition step (CH-1) | only the four absence sources ground `ABSENT_PROVEN`; mount maps only it to native not-found; policy-masked entries are `PRESENT` at this axis with suppression recorded on axes 2/7 — projections may omit them, the model never claims proof |
| 4 | **Freshness-basis** | basis vector (venue, block/state root, finality grade, fork policy) + per-claim `FRESH(profile)` \| `STALE(profile, clockEvidence)` \| `UNKNOWN_FRESHNESS(dep)`; composite `MIXED-BASIS` label when member bases differ | resolver, under the profile's declared clock domains (review §4.5 clock rules; no wall clock in GATE; no author TID ever) | GATE: `FRESH` at the declared floor or fail; interactive: render with basis age; STALE never conflates with revoked (string-catalog rule carried) |
| 5 | **Availability** (bytes/transport) | `BYTES-VERIFIED` \| `BYTES-PARTIAL(k/n)` \| `BYTES-UNAVAILABLE` \| `CONTENT-MISMATCH` \| `NOT-REQUESTED` | transport layer, after the lens fixed the content commitment (two-stage rule, review §2.3; register LC-15) | availability never rewrites the content winner; GATE reads requiring bytes fail closed on anything but `BYTES-VERIFIED`; carriers are policy, not authority |
| 6 | **Completeness / resolution status** (per result/page) | `FINAL` \| `PROVISIONAL(candidate, blockedBy)` \| `INCOMPLETE_BUDGET(continuation)` \| `UNKNOWN_DEPENDENCY(dep)`; pages add complete-at-basis / partial-with-cursor | resolver | `PROVISIONAL` is interactive-only, visibly incomplete, never serialized as a winner, never cached to FINAL by time (review §6.3); `INCOMPLETE_BUDGET` is never absence; GATE accepts only `FINAL` |
| 7 | **Advisory outcome** (policy axis, per result) | `UNCHANGED` \| `NOTED` \| `WARNED(hits)` \| `HIDDEN(hits)` \| `REJECTED(hits)` — each hit carries (source, label claim, grade, table entry) | ADVISORY/1 under the consumer's committed action table | transforms, never reselects; hits inspectable; GATE decision table is binary (clean vs BLOCK/REJECT); a REVOKED label never appears as a hit |

Notes lifted with the table: (i) `SUPERSEDED`/`REVOKED` remain historical claim dispositions reachable by direct dereference, not competing values of axis 2 (review §6.2); (ii) the per-source vector under axis 2 is how FS-LENS/1's provenance surfacing (`user.efs.grade`, attribution chips, "why this?") reads out — one projection of this model, not a second vocabulary; (iii) cursor binding (query, plan slice, realm, code basis, evidence basis, high-watermarks) is part of axis 6's page semantics.

### 3.2 The consumer-declaration rule

**Every consumer declares, in a committed artifact, the exact combinations it accepts; everything undeclared fails closed.** The declaration is data, not code:

```text
AcceptanceMatrixV1 = {
  consumerProfileId,           // which lens profile it executes (the §1.0 lock)
  requiredPurposeIds,
  perAxisAccept: {             // closed value sets per axis 1..7
    authorization, slotState, existence, freshness, availability, completeness, advisory
  },
  combinationConstraints[],    // cross-axis predicates, e.g. "existence=ABSENT_PROVEN acceptable only with completeness=FINAL"
  onReject: FAIL_CLOSED        // the only value; rendering a refusal is the consumer's UI concern
}
```

Named matrices the SDK ships (illustrative, each a conformance fixture):

| Consumer | The row in words |
|---|---|
| **MOUNT-STRICT** (P-16 live own-node) | axis-3 `ABSENT_PROVEN`→ENOENT; `UNKNOWN`→transient error; axis-6 `FINAL` only for enumeration closure; axis-7 `HIDDEN` omits-with-control-surface |
| **MOUNT-SNAPSHOT** (ordinary apps) | as strict, at the bundle's manifest basis; grade-free projection is legal *because* every axis was checked at snapshot build |
| **GATEWAY-INTERACTIVE** | everything renders, every axis labeled; `PROVISIONAL` allowed and visibly incomplete; sender-hinted Views declinable |
| **GATE-CLIENT** (§1.2) | axis-1 `AUTHORITY-ADMITTED`; axis-4 `FRESH` at floor; axis-6 `FINAL`; axis-3 `PRESENT`/`ABSENT_PROVEN` only; axis-7 clean-or-refuse; axis-5 `BYTES-VERIFIED` |
| **GUEST** (LC-12) | as GATEWAY-INTERACTIVE with tiny ambient policy; consumes no GATE grades; RPC-trust grade disclosed |
| **AGENT-RECEIPT** (LC-11) | as SDK default plus: every consequential output binds the tuple into its receipt; tainted (non-selected) content never carries axis-1 values |

This rule is what F-15 becomes when made mechanical: nobody *can* compress the tuple, because consumption is a matrix membership test, and the matrix language has no "any" wildcard on axes 1, 3, or 6. PLAUSIBLE (the matrix shape is constructed; its necessity is VERIFIED — seam 7's axis model demands exactly a declare-and-fail-closed consumer rule).

### 3.3 Serialization and rendering rules

1. Machine consumers receive the axes as typed fields (machine-readable provenance tuples — register LC-3/LC-11); rendered enums are projections.
2. No UI string may merge axes (the two-grades-as-two-labels ban, F-15; the STALE≠REVOKED and CONFLICT≠equivocation string-catalog rules carried).
3. A receipt (`ViewReceipt`) freezes the full tuple + policy identities + basis vector + budgets + continuations (review §4.5, consumed unchanged); citations render foreign-policy results visibly foreign.

### 3.4 What this chapter supersedes

The read-lens-spec §2 dominance ladder (grades as one ordered list), its P6 equivocation pin, its §5 currency table *as a grade source* (its honest-labeling content survives inside axes 4/6), and every "composite grade" phrase. The FS-LENS/1 grade text is unchanged — it is already this model's FS projection.

---

## 4. UX compilation — one people-list drives everything

Mechanisms only (no mockups), per the steer: the complexity lives in the compiler; the user maintains **one list of people** plus per-person purpose toggles; everything else is deterministic derivation.

### 4.1 The list and the deterministic mapping

```text
PeopleListEntryV1 = {
  principal,                  // stable KEL principal word — never a key (SCALE-1)
  petname,                    // local; never enters compiled bytes' semantics
  group,                      // ME | INNER | CURATOR | FRIEND | SERVICE
  toggles: {
    files:      off | on(rootSet),     // FS authority within named roots
    metadata:   off | on(rootSet),
    labels:     off | on(actionCeil),  // ADVISORY source; ceiling defaults WARN
    discovery:  off | on(budget),      // DISCOVERY source
  },
  overrides[]                 // explicit per-person rule pins (become explicit rulePriorities)
}
```

**Mapping (pure function; golden-vectored; same list + toggles + compiler version ⇒ same per-profile `EffectiveLensId`s):**

| Group/toggle | FS-LENS/1 | ADVISORY/1 | DISCOVERY/1 | GATE/1 |
|---|---|---|---|---|
| ME | tier 0; `EXACT(self)` baselines over own roots | — | own activity | — |
| INNER + files(roots) | tier 1 authority **scoped to the named shared roots** (no global grant is derivable from a toggle — root naming is mandatory, suggested-not-defaulted) | — | on by default | — |
| CURATOR + files(roots) | tier 2 within `intersection(curator's declared scope, user's accepted rootSet)`; whiteout honor on by default at that tier | — | on | — |
| FRIEND | **never FS authority from a toggle** | — | tier-free budgeted source | — |
| labels(ceiling) | — | source at user's table, clamped to ceiling | — | only if the resource's GATE owner separately enumerates it |
| SERVICE (app publishers, system planes) | labeled separate plane, never mixed into content tiers (review §12.1) | per plane | per plane | see below |

**The deliberate hole in the table: GATE policies are never generated from the people list.** An installer/update GATE is created by its own small ceremony at subscribe/install time (publisher principal + committee + advisory feeds, pinned by the risk bearer). This is the profile-confusion firewall expressed in UX: no toggle on a friend can ever influence what executes. The people-list drives *browse, labels, discovery*; GATEs are deliberate, few, and per-resource. PLAUSIBLE (design stance; the alternative — an "updates" toggle — is exactly how a social lens bleeds into an execution trust decision, the §7.4 breakage).

Tier scheme: fixed group→tier numbers (0/1/2), equal rank within a group, explicit per-person overrides compile to explicit rule priorities. Equal-rank conflict behavior is the profile's (FS: CONFLICT row; GATE: fail).

### 4.2 Manual lens-setting: scoped one-off Views, not policy edits

The exceptions the steer names, each expressed as an ordinary compiled object — never a mutation of the base policy:

- **"See Alice's files"** → browsing Alice's address container under the **ambient owner baseline** needs no policy at all (`EXACT(Alice)` over her root is what the container gives every reader, including guests). Saved as `View{root=Alice's container, lens=ambient, presentation}` if wanted.
- **"See folder X as Alice curates it"** → a one-off View whose lens = base FS lens + one pinned import of Alice's *published* View, `importClass=AUTHORITY_RULES`, scope=X, depth 1, mounted below the user's own tiers. Compiles through §2 like anything else; the diff shows exactly what Alice can now name inside X.
- **"One person's opinion on this dataset"** → an ADVISORY overlay View: source=Alice, scope=dataset root, action ceiling NOTE/WARN. Her labels annotate; nothing about resolution changes.

One-off Views are the pressure valve that keeps the base list small (SCALE-2): curiosity composes into disposable objects instead of accreting permanent authority. VERIFIED (all three compile in the existing grammar; the product framing is this lane's).

### 4.3 The power-user widget: an EFS LIST projection

The people-list's *storage* is local/private by default (seam 12); its power-user editing surface is an **EFS LIST projection**: rows = entries, `weight = order` as editor sugar — exactly the review's "LIST may be source/editor projection" ruling (§16 ledger: lens-as-LIST is dead as executable, alive as editor format). Rules: the LIST is a source-format projection only; compile-on-accept (editing the LIST changes nothing until the ceremony compiles + the user accepts, atomically swapping generations); publishing the LIST is the deliberate curator-publication act (seam 12), never a side effect; private storage uses the encrypted personal-policy modes + CXF-shaped export/recovery ceremony ([research §6.1](./research.md)) so the list survives device loss with an explicit ceremony, not silent sync.

### 4.4 The ceremony (shared by §2.3 updates and §4.1 edits)

Every accepted change renders: affected scopes; principal adds/removes/reorders; **newly reachable fallbacks** (the relinquish-polarity warning); mask-set diffs; representative changed winners (via `eth_simulateV1` preview); the exemptions ledger delta; and for advisory changes, re-enabled objects. Role polarity from review §5.4 binds (adds to discovery may auto-follow within budget; adds to authority preview; removals of deny sources confirm loudly).

### 4.5 Guest floor

A guest has no list and must never need one: ambient owner baseline + deliberately published starter/curator Views + declinable sender hints, at honestly labeled grades ([use-pressure §5.2](./use-pressure.md) consumed). This lane adds nothing to seam 12 beyond §4.3's publication act; the guest path consumes only published objects.

---

## 5. Cache + invalidation at the client tier

### 5.1 The dependency-head vector, right-sized to 15–55

The review's §15.1 vector, instantiated at the design center (VERIFIED shape, PLAUSIBLE sizes):

| Component | Count at 55 entries | Source read |
|---|---|---|
| Venue basis (block/state root + finality) | 1 per realm (1–3) | header |
| Kernel codehash / dictionary epoch | 1 per realm | 1 slot |
| Per-profile `EffectiveLensId` + acceptance floor + channel generations | 3–5 + ≤20 channels | local + anchor summaries |
| Per-author `viewMutationVersion` | ≈45 (principals, not keys) | 1 slot each |
| KEL heads (`authEpoch`/head ordinal per principal) | ≈45 | registry state |
| Advisory-source versions | ≤32 | 1 slot each |
| Definition/resolver semantics versions; next expiry boundary | O(1) | local |

Total ≈ 130–180 words. **One pinned-basis batched call (`eth_simulateV1` / multicall) refreshes the whole vector in one round trip** — cheap enough to run on app-focus, so "is every cached view still valid?" is an O(1-round-trip) question at this scale. This is the concrete payoff of the 15–55 honesty: the vector fits in one batch *because* entries are principals, not keys.

### 5.2 Position taken: `viewMutationVersion` is a kernel MUST; the delta stream is the E2-priced half

The steer asks for a position; here it is. `max(order)` and claim counts are unsound revision tokens (revocation changes views without new claims — review §15.1, adopted as FS cache law already). Therefore:

- **MUST (bundle-grade):** a per-author monotone `viewMutationVersion(author)` incremented by every kernel transition that can change any accepted claim's slot/advisory disposition — admission, revocation, supersession, whiteout-affecting placement. Cost shape: one warm SSTORE per envelope apply, amortized across the batch — the cheapest possible sound token. Without it, a client cannot even *detect* staleness without walking spines per author.
- **E2-PRICED (accept if the snapshot tolerates):** the paged **delta stream** mapping version intervals → affected `semanticPositionId`s. With it, invalidation is O(changed positions). Without it, the honest fallback is already-required machinery: walk the author's spine cursor from the cached high-watermark — O(that author's new claims), never O(history), plus TTL'd re-pins for advisory/KEL heads (FS gap G-6 posture carried).
- KEL/delegation heads are deliberately *not* folded into `viewMutationVersion` — they come from the authority lane's registry state (separate vector components), keeping the kernel counter attribution-blind and the lanes separable (seam 3 hygiene). PLAUSIBLE (split constructed; kernel-lane check owed).

### 5.3 IVM as the cache architecture, with the equivalence vector

Adopt incremental view maintenance as the RICH-tier resolver-cache technique ([research §4.1](./research.md)): the dependency-head vector is the input frontier; deltas are the change feed; materialized directory/advisory views are the maintained output. The binding correctness statement (DBSP's property, made an EFS conformance vector): **an incrementally maintained view must byte-equal from-scratch resolution at the same `(evidence, EffectiveLensId, basis)` triple** — and the client ships a sampling recompute-and-compare check in production, not only CI, because an IVM bug produces plausible stale views (the worst failure class: quiet).

### 5.4 Basis and generation discipline

Client caches obey FSP-BASIS-1 lifted (§2.6): cache keys are the five-part view identity (never path-only); generations swap atomically; open handles keep their generation; no negative cache entry without closure at the generation's basis; reorged bases re-grade to pending under the fork policy and re-resolve (never silently final). All carried from [filesystem-core §6](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md), applied to every profile's consumer, not just mounts.

### 5.5 Shareable warm caches (optional, RICH)

Basis-stamped compiled filter bundles (CRLite/Clubcard shape — [research §7.1](./research.md)): revocation sets, advisory-hit sets, `P_v>0` position sets, built deterministically by anyone against the enumerable on-chain universe, exact at their stamped basis (miss = proven at that basis; hit = one confirming point read). Epistemic class: shareable local cache — re-derivable, never authoritative, freshness = the stamped basis. Slots into §5.1 as a prefetch layer; changes no semantics.

---

## 6. The client-side scale story

All numbers below the double rule are shape evidence (isolated 07-11 harness + [research §8](./research.md) interpolations); E2/E6/G-D gate any freeze claim. Marked PLAUSIBLE throughout except the arithmetic floors.

### 6.1 Cold boot (new device, recovered person) at 55 entries

1. Restore the people-list + Views from the CXF-shaped encrypted recovery bundle (§4.3) — includes pinned import revisions, acceptance floors, action tables, petnames (review §11.4 contents).
2. Re-verify ≤20 channel heads via bounded anchor summaries (no history replay — the anchor's whole point).
3. Compile 3–5 profiles locally: tens of ms CPU at this scale (two-compiler conformance makes this a pure function; no network beyond fetching pinned revisions by carrier).
4. **Resolution is lazy and per-view**: opening one folder = 1 batched candidate-page call + P point resolutions + advisory probes ≈ 1–3 pinned-basis round trips via `eth_simulateV1`. There is no "sync the graph" step; cost is proportional to what the user looks at.
5. First vector fill (§5.1) = 1 batched call.

Cold boot is therefore dominated by bundle fetches of pinned revisions, not by resolution — minutes of background work at worst, interactive immediately on the ambient baseline. The guest path is this same story with steps 1–3 deleted.

### 6.2 Warm read

Vector check (1 batched call, amortized per focus event) → IVM-maintained views serve from memory/disk → any dirty position re-resolves individually. Point read against a hosted RPC ≈ tens of ms; against own node ≈ sub-ms + proof grade free.

### 6.3 Month-offline catch-up

Diff the vector: authors with advanced `viewMutationVersion` → pull deltas (or spine-cursor walk from high-watermark) → invalidate exactly the affected positions; advisory versions likewise; channels re-pin at current heads through the ceremony queue (updates wait for acceptance; resolution continues on old generations). **Work is bounded by change volume, never by elapsed time** — the property the append-only indexes + vector buy. The month-offline user's worst case is a busy author with 10k new claims: one cursor walk of 10k postings for that author alone, resumable. Century-scale first-contact bootstrap remains the §7.1G / R-QC8 index-shape decision — flagged, not solved here (the mount-budget ⇄ current-live coupling stands as E2's sharpest input).

### 6.4 What breaks at 256, and past it

At **256** (the E6 portable compile ceiling): compilation and per-read budgets hold (compile is linear; reads are budgeted independently of policy size). What breaks: (a) **T-CONTRACT direct-probe points** ≈ 1.07M gas — still composable but heavyweight; wide pages impossible (EIP-7825 is physics: 128-item naive pages can never fit a transaction — [research §3.2 item 1](./research.md)); (b) **interactive latency** on dense hot positions (K-linear worst case when rosters don't help); (c) **human legibility breaks hardest**: a 256-entry ceremony diff is unauditable, so the policy stops being the user's deliberate trust statement and becomes an imported blob — SCALE-2's conflation in UI form ([use-pressure §2.3](./use-pressure.md) carried). The design answer is not a bigger lens; it is the next section.

### 6.5 Past the ceiling: the bespoke curation contract (ten lines)

```text
 1. A CurationContract is ONE principal in everyone's Roster — not a lens feature.
 2. Contributors write THROUGH it under its own admission rules (stake, review, quota)
 3. — it republishes accepted entries under its own author key / owned LIST.
 4. Readers add one entry: the contract's principal, at one tier. Enumeration is
 5. one author's candidate stream — bounded, index-served, roster-sparse.
 6. Removal = the contract revokes its own entry (empty-on-revoke); no lens changes.
 7. Contributor provenance rides as properties on each entry (inspectable).
 8. Gates read it as one closed-set member — Level-3 composable at ~point-read cost.
 9. 10^4 contributors cost the CONTRACT's admission gas, never readers' probes.
10. Its policy is speech: published, inspectable, forkable by deploying a rival.
```

This is the register's §2.4 mechanism table made concrete; web-of-trust products, mega-curation, and DAO-scale membership all land here or in aggregator feeds — never in base-lens growth. VERIFIED (pattern assembled from ruled pieces: mandatory indexing, empty-on-revoke, closed-set gates, published-curation-is-speech).

---

## 7. Breakage catalog (the demanded four, plus composition-specific)

| # | Attack | Answering structure | Honest residual |
|---|---|---|---|
| 7.1 | **Removed-curator squatter activation** (drop/revoke rank-1, dormant rank-2 serves malware) | per-rule relinquish declarations (FS overlays may fall through *by declaration*; GATE/1 has no fallthrough in its vocabulary); update-ceremony previews newly reachable fallbacks (§4.4); removal-polarity corrected (removals are trust-changing, never auto-safe) | an overlay scope that *chose* fallthrough gets fallthrough — visible in its own diff |
| 7.2 | **Advisory-driven censorship** (labeler escalates to eraser) | action tables live with consumers; imported tables clamp (§2.4); subtract-after-resolve never reselects; HIDDEN results carry inspectable provenance; deny never grounds absence (CH-1) | a user who deliberately raises a censorious labeler's ceiling has chosen an editor — disclosure, not prevention |
| 7.3 | **Composition wedges** (an import that bricks the view) | compile/update failures never touch the serving plan (§2.5.5); `CHANNEL_CONTESTED` freezes *updates*, not resolution; unavailable pinned carriers fail compile typed; runtime `UNKNOWN` on a high-tier source stops finality — interactive shows `PROVISIONAL`, GATEs fail closed by design | a GATE over a dead venue stops until its owner acts — correct for executables; availability of *browse* degrades to labeled provisional |
| 7.4 | **Profile confusion** (a browse lens consumed as a gate) | the §1.0 purpose lock (profileId+purposeId in canonical bytes; consumers demand a profile; mismatch = refusal); GATEs never derivable from the people-list (§4.1); acceptance matrices have no wildcard on axes 1/3/6 | none identified — this is the family's designed-out failure; vector: FS lens presented to installer ⇒ typed refusal |
| 7.5 | Roster inflation on hot positions (outsiders bloat `P_v`) | plan selection degrades to direct-K probes, bounded ≈230k/point at 55 ([research §8](./research.md)); semantics unchanged either plan | cost, visible and priced — never a wrong answer |
| 7.6 | Lens fingerprinting / membership dictionary | `PrivateLensHandle` locally; deterministic IDs unpublished for personal policies; publishing an effective ID/receipt is deliberate disclosure (review §11.2) | a published citation discloses its plan — reproducibility vs membership privacy is a real, user-chosen trade |
| 7.7 | Import-graph privacy leak (subscriptions reveal associations) | personal source lists local/encrypted; imports fetched by carrier without announcing the subscriber; remote resolution of personal principal sets is a disclosed mode (seam 12 text) | traffic analysis against fetch patterns — the OHTTP/replica story, owned by the privacy pass |

---

## 8. Seam and hold disposition (this lane's slice)

| Item | Disposition here |
|---|---|
| **Seam 7** (lens object too weak) | closed for the remaining profiles: §1 supplies the typed instances; §3 supplies the axis model + consumer declaration the seam demands |
| **Seam 8** (channels duplicate KEL) | consumed as ruled: §2.3 channels reuse KEL control/recovery; only generation/fork/tombstone/rollback state is lens-specific; no channel-local recovery verifier appears anywhere in this file |
| **Seam 12** (starter vs personal) | consumed: §4.3 publication is deliberate; §4.5 guest floor runs on published objects + ambient baseline; personal policies local/encrypted with CXF-shaped export |
| **Seam 19** (package/update policies) | discharged into GATE/1 §1.2 (closure identity vs resolution receipt; TUF shape; rollback floors) |
| **Seam 6** | not reopened; CH-2 extends its closure argument to composition |
| **Held Q3** | not answered; §1.5 hooks named with the Q3A coupling disclosed |
| **Held Q4** (checkpoints ordinary claims) | consistent: checkpoints appear only as freshness hints (§1.2.5); no absence role anywhere |
| **Held Q5** (SDK fail-closed default) | assumed by every acceptance matrix (§3.2); more evidence for Q5A |
| **Held D-9** (on-chain lens promise) | written against choice A (candidates + points + client materialization); §6 is further consumer evidence, not an answer |
| **E6** (lens ceiling) | fed: §6.4's break analysis supports "50 normal / 256 portable compile ceiling, per-read budgets independent"; benchmarks still owed |
| **E2/E3/G-6** | fed: §5.2's MUST/priced split is a new E2 input alongside the mount-budget coupling; H-Q3-3 names the E3 dependency |

**New owner decisions surfaced: none.** Every choice in this file is either carried, a delegated-technical gate (vectors: CH-1/CH-2 families, the §4.1 mapping, the advisory clamp, the acceptance-matrix shapes), or fed to an existing held/evidence item. This is deliberate: the pass reconciles and designs; it does not grow the packet.

---

## 9. What the replacement spec lifts from this file

Chapter map for the eventual [read-lens-spec](../../Designs/efsv2/read-lens-spec.md) replacement: §1.0 → the profile law; §1.2–1.5 → profile chapters 2–5; §2 → the composition chapter (with CH-1/CH-2 as its conformance gate); **§3 verbatim → the grade chapter**; §4 → the SDK/UX compilation chapter; §5 → the cache chapter; §6.5 → the cookbook. Salvage from the old spec already embedded: anti-fallthrough (§3 axis rules), deny-after-resolve (§1.3), verification order + follow budgets (via FS-LENS/1), acceptance-test discipline (every § names its vector family), URL/classifier grammar (untouched here; carried by the register's LC-2 salvage list).

---

## 10. Confidence

**VERIFIED (read directly this pass):** the full 07-11 review (typed model §§2–8, wire grammar §4.2–4.3, channel protocol §4.4, receipt §4.5, evidence states §6.2, index shapes §7.1, benchmarks §9, threat table §15, ledger §16, freeze package §18, migration §20); read-lens-spec in full (salvage/dead per its banners); filesystem-core FS-LENS/1 + gaps + ledger; joined-pass-synthesis JR-1..10 + D-ledger + kill list; owner-rulings (all cited entries incl. mandatory indexing, item F, chains-don't-die, personas, mount requirement, 2026-07-23 corrections); owner-decision-inbox (packet, held, settled, superseded lists); onchain-completeness Line + sign-off; kel §§5–9 (control state, grants, envelope/admission, current-vs-historical); human-overview §7 seams; fs-pass-synthesis C1–C14 + master table; critic's G-A framing + FS-LENS/1 blessing + seam dispositions; research.md and use-pressure.md in full (LC rows, SCALE-1/2, §8 arithmetic, adopt/adapt/reject ledger).

**PLAUSIBLE (constructed here; vectors/critic are the check):** the claim that no profile below required extending the grammar (§0 — same falsifiable form as FS-LENS/1 §1.1); the GATE/1 WARN-exclusion refinement and binary decision table; the ADVISORY no-negation-across-sources rule and the imported-action-table clamp; the DISCOVERY mode list; the H-Q3 hook set's completeness; CH-1/CH-2 as proofs (exhaustive over the *specified* system; only vectors make them conformance facts); the 6+1 axis arrangement and the AcceptanceMatrix shape; the §4.1 mapping table and the GATEs-never-from-the-people-list stance; the §5.1 vector sizing and §5.2 MUST/priced split; every number in §6; the breakage residuals.

**Could not verify:** any gas/cost figure beyond arithmetic floors (E1/E2/E6 open — "none of the chain/authority space is measurement-backed"); whether `viewMutationVersion` + delta stream survive E2 pricing (the §5.2 fallback is designed for the refusal case); the authority-lane ABI wire shape for axis 1 (consumed as fixed input); whether `channelAnchorSummary` survives E2 (conditional named in §2.3/§6.1); the v1 Solidity file:line reality behind the §1.6 retirements (via the review's ledger only); [[assumptions-and-requirements]] row-level cross-check (consulted through its citations — the same recorded debt as the FS and register lanes).
