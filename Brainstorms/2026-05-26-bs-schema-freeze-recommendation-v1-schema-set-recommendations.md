---
agent: bs-schema-freeze-recommendation-v1
date: 2026-05-26
status: raw
anchors:
  - area: contracts
  - area: sdk
  - brainstorm: 2026-05-26-bs-divergent-usecases-v1
  - brainstorm: 2026-05-26-bs-schema-coverage-audit-v1
  - brainstorm: 2026-05-26-bs-contract-decomposition-v1
---

# EFS schema set — freeze recommendation

This brainstorm synthesizes the use-case brainstorm (`bs-divergent-usecases-v1`, 15 cases across industries), the schema-coverage audit (`bs-schema-coverage-audit-v1`, 30 prioritized gaps with severity classification), and the contract-decomposition brainstorm (`bs-contract-decomposition-v1`, 5 ways to slice the contract set) into a per-schema freeze recommendation for the Sepolia/OnionDAO deploy at T-6 days from 2026-05-26.

Two freeze events are in play:
1. **Sepolia/OnionDAO (T-6 days from 2026-05-26).** Implicit, by deploy. Anything in the deployed contract set becomes hard to change without a migration. Devnet upgradeability per the open Tier-2 question (TransparentUpgradeableProxy default) softens this for individual contracts, but **schema UIDs are baked at registration time** and are effectively Etched once any real data sits on them — even on a devnet that we publicly endorse.
2. **Mainnet shape freeze (later, undated).** Explicit. The full set of schemas plus their field shapes locks in for the 50-year test. Adding new schemas post-mainnet is possible (EAS allows it) but adding a *core* schema that other tooling assumes is a major coordination event.

The key asymmetry the contract-decomposition brainstorm surfaced applies here too: **splitting later is cheap, merging later is expensive.** A schema that ships and gets attestations cannot be cleanly merged into another one without orphaning data. The corollary for this brainstorm: when in doubt, err toward shipping fewer schemas at Sepolia, holding back the speculative ones for the mainnet shape freeze where the design has more room to breathe.

A vocabulary note: the spec (`02-Data-Models-and-Schemas.md`) is stale relative to the Glossary on two points — (a) it still treats TAG as one schema rather than the PIN/TAG cardinality split that ADR-0041 (planned, not yet in `docs/adr/`) is going to formalize, and (b) the Glossary's PROPERTY entry describes a different shape than the spec ("free-floating string value placed on a container via PIN under a PROPERTY-typed key anchor" vs the spec's "key/value attached via refUID"). I assume the Glossary is the post-PIN/TAG-split forward direction and the spec lags. **This stale-spec problem is itself a blocker** — see § Blockers / concerns — because freeze recommendations are different depending on which shape lands first.

The status vocabulary I use:

| Status | Meaning |
|---|---|
| `freeze-for-sepolia` | Ship this schema as-is at Sepolia/OnionDAO. Field shape is settled. Risk of needing to re-cut for mainnet is low. |
| `freeze-for-mainnet-soon` | Ship at Sepolia; expect to keep it through mainnet shape freeze with no field change. Higher uncertainty than `freeze-for-sepolia` but no known reason to change. |
| `hold-for-shape-freeze` | Ship at Sepolia if needed for the launch demo, but accept that the mainnet shape may differ. Avoid encouraging real-data attestations against this schema in the interim. |
| `redesign-before-mainnet` | The shape has a known problem. Ship something workable at Sepolia (because the demo needs it), but commit to a redesign before mainnet. Document the known gap loudly so users don't build durable infrastructure on the wrong shape. |
| `new-schema-needed` | Not yet in the schema set. Recommend designing and shipping post-Sepolia, pre-mainnet. |

---

## Anchor

**Status:** `freeze-for-mainnet-soon`

**Reasoning.** Anchor is the load-bearing path primitive across every use case the divergent brainstorm surfaced (botanical taxonomy, museum object catalogs, podcast shows, supply chain lots, RPG compendiums — all 15 cases lean on it). The schema-coverage audit reported it "covers well: deep hierarchies sit comfortably within `MAX_ANCHOR_DEPTH=32`; the 'name unique within parent hierarchy' rule is exactly what these schemas want." Where it strains (G05 soft-deprecation, G06 multilingual values, G09 tag disambiguation, G16 lens-curated alias / canonical-name authority, G23 per-namespace name validation) every strain is `solvable in SDK without schema change` per the audit's own classification. None of the 30 gaps require an Anchor field change. The hierarchical primitive is robust.

The reason this is `freeze-for-mainnet-soon` rather than `freeze-for-sepolia` is the `schemaUID` field inside ANCHOR — the spec says it "enforces what type of data can be attached to this anchor (e.g., Folder vs File vs Property)." This is essentially a type-discriminator and we will accumulate schema-type cases (PROPERTY-typed Anchors per the Glossary, SORT_INFO-naming Anchors per the spec, future EVENT/TRANSITION-naming Anchors per G01) over time. The `schemaUID` field shape is fine; the *enumeration* of valid values isn't a schema concern, but the patterns for new types should be settled before mainnet so we aren't carving exceptions into the resolver.

**Constraints.** UID-stable fields: `refUID` (parent), `name` (string), `schemaUID` (bytes32). The "name unique within parent hierarchy" invariant must hold. `MAX_ANCHOR_DEPTH=32` is contract-side but visible in semantics — deeper trees break. The `/tags/`, `/transports/` reserved-folder conventions are deploy-time concerns, not schema; they can evolve. Anchors are non-revocable — this is load-bearing and confirmed Etched.

**Open question / followup.** Does the SORT_INFO-naming-Anchor pattern (using `anchorSchema` to mark a child Anchor as a sort overlay rather than a file) generalize cleanly to other overlay types? If yes, Anchor stays unchanged. If we discover a case where naming-Anchor metadata needs to live in the Anchor schema itself (rather than as a separate `anchorSchema` discriminator), that would push toward `redesign`. Low likelihood based on current evidence.

---

## DATA

**Status:** `freeze-for-mainnet-soon`

**Reasoning.** DATA is the simplest schema and the most mathematically Etched. `contentHash (bytes32)` + `size (uint64)` + non-revocable is the right shape for archival use cases (legal evidence, firmware, museum imagery, podcast back-catalog). The audit found "content-addressed identity + dedup via `dataByContentKey` is exactly the right primitive." None of the gap items propose changing the DATA schema's fields — the gaps that touch DATA are about *what we do around it* (G03 encrypted-only mode, G07 high-frequency batch, G20 right-to-be-forgotten, G25 storage-mode hint). All four are out-of-scope for kernel schema and rightly classified `post-mainnet`.

The reason this is `freeze-for-mainnet-soon` rather than `freeze-for-sepolia` is regulatory caution: the medical, oral-history, and legal-PII use cases (cases 10, 6, 2) genuinely cannot live on public DATA. Locking the schema before we've decided whether an encrypted-commitment sub-mode is part of EFS proper is a small risk that the answer to "where does the commitment-only DATA flag live" turns out to be "a field on DATA." Tentative read: it'll be a PROPERTY convention or a sub-mode at the deployment layer, not a field. But worth a beat of confirmation.

**Constraints.** UID-stable fields: `contentHash` (bytes32, keccak256 of canonical bytes), `size` (uint64). `refUID = 0x0` invariant — DATA is standalone and *must* stay that way (the content-addressed dedup logic in `dataByContentKey` assumes it). Non-revocability is Etched.

**Open question / followup.** If the consortium / encrypted sub-mode conversation produces a "commitment-only DATA" mode (G03/G20/G24 cluster), does it want a field-level signal or is a PROPERTY convention sufficient? If a field is wanted, that's a new schema (DATA_COMMITMENT or similar), not a change to existing DATA. Resolves the open question in favor of `freeze-for-mainnet-soon` either way.

---

## PROPERTY

**Status:** `redesign-before-mainnet`

**Reasoning.** PROPERTY has the largest gap surface of any current schema. The audit catalogued five distinct strains affecting 11+ use cases:
- G02 typed values (CAD tolerances, RPG CR, telemetry kWh)
- G06 multilingual values (museum titles, oral history transcripts)
- G08 multi-valued / array values (firmware compat lists, recipe ingredients)
- G11 edge payload (coffee weight per handoff, museum sale price) — though this overlaps with G01
- G26 per-attester PROPERTY conflict resolution under multi-lens merge

Most of these are `solvable in SDK without schema change` per the audit's own classification. The string-value-as-everything approach is workable. **But** — and this is the load-bearing point — the *shape* of PROPERTY itself is in active flux right now, independent of the audit's gap list. The spec says PROPERTY is `(key string, value string)` with refUID pointing at an Anchor or DATA. The Glossary says PROPERTY is "a free-floating string value placed on a container via PIN under a PROPERTY-typed key anchor." These are not the same shape. The Glossary version uses PIN to bind the property value to its key-anchor; the spec version uses `key` directly as a field. **If the PIN/TAG split (ADR-0041, planned) goes through and the Glossary's shape is the post-split direction, PROPERTY itself is getting redesigned to drop its `key` field and rely on a PIN edge to a key-anchor.** That is a much bigger change than any of the audit's gaps — it's a fundamental shape change.

We cannot freeze PROPERTY at Sepolia without resolving the PIN/TAG split's effect on PROPERTY. Two scenarios:

- **Scenario A (PROPERTY keeps its current `key` field).** PROPERTY is `freeze-for-mainnet-soon`; strains are all SDK conventions. Ship as-is.
- **Scenario B (PROPERTY becomes a PIN-bound value, per the Glossary).** PROPERTY is a brand-new schema with a different UID. The current spec PROPERTY effectively becomes legacy.

Without James's call on which path PIN/TAG-split takes, PROPERTY freeze is **blocked**. The default-if-not-answered position is Scenario A (ship the existing spec shape), which preserves the demo and accepts that mainnet may want a different PROPERTY schema. Mark `redesign-before-mainnet` to signal that loudly.

**Constraints.** Under Scenario A: UID-stable fields are `key` (string), `value` (string), with refUID = Anchor or DATA. Revocable per spec. Reserved keys (`contentType`, etc.) are a sanitization concern at the resolver layer (ADR-0024), not a schema field. Edition-scoped PROPERTY lookup (ADR-0014) is a router behavior, not a schema invariant.

**Open question / followup.** PIN/TAG split's effect on PROPERTY. This is the single most consequential schema question for the freeze. Answering it unblocks both PROPERTY and the SDK's PROPERTY API design. **See § Controversial human design choices.**

---

## MIRROR

**Status:** `freeze-for-sepolia`

**Reasoning.** MIRROR's field shape (`transportDefinition` (bytes32 Anchor UID), `uri` (string), `refUID` = DATA UID) is settled. The audit found it "covers well: multiple transports per DATA + transport priority order is exactly right for archival redundancy" and the "no singleton enforcement" decision (ADR-0015) supports the firmware case where many attesters contribute mirrors. None of the 30 gaps propose changing MIRROR fields. The strains that hit MIRROR are operational:
- G04 (`MAX_PAGES = 10` mirror-scan cap) — this is a contract constant, not a schema field. Revisit ADR-0020 with workload data; raise the cap.
- G24 (mirror auth / encryption envelope) — subsumed by the G03 cluster, post-mainnet, not a MIRROR schema concern.

The transport priority order (ADR-0012) is a router behavior, not a schema invariant. Transport definitions live under `/tags/transports/` as Anchors (ADR-0011), so adding new transports post-freeze is straightforward.

The reason this is `freeze-for-sepolia` rather than `freeze-for-mainnet-soon` is the audit's classification: zero of MIRROR's strain points are schema-level, all are router/SDK concerns. Confidence is high.

**Constraints.** UID-stable fields: `transportDefinition` (bytes32), `uri` (string). `refUID = DATA UID` invariant. Revocable. URI length cap (`MAX_URI_LENGTH = 8192`, ADR-0022) is a contract constant; visible in attestation rejection but not a schema field.

**Open question / followup.** Does the eventual encrypted-sub-mode conversation want a field-level signal "this mirror is encrypted / requires auth" on MIRROR? Default answer: no, it's a PROPERTY convention on the DATA or a sub-mode at the deployment layer. If yes, that's a new MIRROR_ENCRYPTED schema, not a change to existing MIRROR. Either way the existing MIRROR is safe to freeze.

---

## PIN

**Status:** `hold-for-shape-freeze`

**Reasoning.** PIN is *new*. It does not exist in the current spec (which still describes a single TAG schema). It is introduced by the ADR-0041 cardinality split, which is referenced in the Glossary and prior brainstorms but does **not yet exist as a committed ADR in `contracts/docs/adr/`**. The brainstorm corpus has converged on the shape (cardinality-1 edge, singleton-per-`(attester, definition, targetSchema)` slot, supersedes in O(1)), but the on-chain schema definition is in flight.

The audit found PIN covers well for use cases that want a cardinality-1 binding: legal Bates label per case, botanical accepted-name per attester, coffee current-custodian, museum primary-image, plus the PROPERTY-value binding role that the Glossary's PROPERTY shape implies. The audit also notes PIN is "conceptually narrow — file placement + PROPERTY value binding. None of the use cases want a *different* PIN; instead, they want what PIN's cardinality-1 model offers but for transitions PIN wasn't designed for (handoff events, ownership transfers)" — and those are TAG complaints in disguise, not PIN complaints.

Why `hold-for-shape-freeze` rather than `freeze-for-sepolia`: PIN's interaction with PROPERTY is unresolved (see PROPERTY § above). If PROPERTY adopts the Glossary's PIN-bound-value shape, PIN's role expands and its resolver becomes the PROPERTY infrastructure. That's a bigger contract surface than just "file placement edge." We should not freeze PIN before deciding whether it carries PROPERTY value binding.

Sub-recommendation: if Sepolia ships without the PIN/TAG split landed (i.e., ships a single TAG schema per current spec), defer PIN to a post-Sepolia rollout. If it ships *with* the split, PIN gets `freeze-for-mainnet-soon`. **Do not ship a half-baked PIN at Sepolia just to have it.**

**Constraints.** UID-stable fields (per ADR-0041 framing): `definition` (bytes32 Anchor UID), `targetSchema` (bytes32), `refUID` = target. The singleton-per-`(attester, definition, targetSchema)` invariant is the load-bearing semantic — it's what distinguishes PIN from TAG. Revocable.

**Open question / followup.** Whether PROPERTY value binding is a PIN role or stays as a PROPERTY field. Resolving this resolves PIN's scope. **Bundled with the PROPERTY question — see § Controversial human design choices.**

---

## TAG

**Status:** `redesign-before-mainnet`

**Reasoning.** The audit reads as a partial rebuttal of the prior brainstorm's "TAG is overloaded" framing: 5 of 8 roles TAG was flagged for fit comfortably (file placement, descriptive labels, weighted vote, lens-based labeling, fanfic descriptors), 2 are workable with SDK conventions (synonymy, tag disambiguation), and **1 is the real gap (state-transition / event edges with payload, hitting museum provenance and supply-chain handoff)**.

That 1-of-8 gap is real and significant — it's G01 in the audit, classified `must-have for shape freeze` for mainnet but `solvable in SDK without schema change` for Sepolia/OnionDAO. The convention layer (using TAG + a transition-naming Anchor + PROPERTYs on that Anchor) is a 3–5 attestation dance that works for v1.

So for **Sepolia/OnionDAO**, TAG can ship in its current shape, with the convention layer documented. For **mainnet**, the recommendation depends on whether a dedicated EVENT/TRANSITION schema (see § New schemas) is added before shape freeze:
- If EVENT lands: TAG stays in its current shape forever. `freeze-for-mainnet-soon`.
- If EVENT does not land: TAG remains the workhorse for state transitions via convention layer. Document the convention. `freeze-for-mainnet-soon`, with the caveat that the convention layer is permanent.

Either way the TAG *fields* don't change. So why `redesign-before-mainnet` rather than `freeze-for-sepolia`? Because the PIN/TAG cardinality split (ADR-0041) is the same shape-freeze question PROPERTY faces. If the split lands cleanly, TAG drops the cardinality-1 cases (file placement, current-custodian binding) to PIN, gains an explicit `int256 weight` field, and becomes the cardinality-N descriptive-edge schema. That is a field-shape change. The "redesign" is the split itself, not a TAG-internal rethink.

Sub-recommendation: ship Sepolia with **either** (a) the current pre-split TAG, accepting that mainnet may use a different TAG schema, or (b) the post-split TAG with `weight` field, paired with PIN. Option (b) is cleaner if the split is otherwise ready; option (a) is the safer fallback. Do not ship a TAG with `weight` and *no* PIN — that creates an asymmetric world where cardinality-1 use cases are awkwardly served by a cardinality-N schema with `weight=0` conventions.

**Constraints (current spec shape).** UID-stable fields: `definition` (bytes32 Anchor UID), `applies` (bool), `refUID` or `recipient` = target. Singleton-per-`(attester, target, definition)` invariant — `EFSTagResolver` enforces this on writes. Revocable. The Anchor-based definition (vs. raw-string definition) is load-bearing for collision-resistance and indexability.

**Constraints (post-split shape).** Adds `int256 weight`; drops the cardinality-1 cases to PIN; the singleton invariant becomes "per-`(attester, target, definition)` slot allows N entries differentiated by weight."

**Open question / followup.** Same as PROPERTY and PIN — the PIN/TAG split decision. **All three schemas hinge on one human choice. See § Controversial human design choices.**

---

## SORT_INFO

**Status:** `freeze-for-sepolia`

**Reasoning.** SORT_INFO is the cleanest schema in the set. The audit found it "covers well: per-parent shared sorted lists with pluggable `ISortFunc` is exactly the abstraction these need" and the only schema-level strain is "most use cases want sort by PROPERTY value, but there's no canonical `PROPERTY_VALUE_SORT_FUNC` in scope yet" — which is G14, classified as a missing *reference comparator* and SDK helper, not a schema gap. Faceted browse (CAD: material × year × manufacturer) is multi-dimensional sort, which SORT_INFO doesn't promise and probably shouldn't.

The fields are minimal and well-scoped: `sortFunc` (address), `targetSchema` (bytes32), `sourceType` (uint8 with reserved future values). The `sourceType` field is the one bit of forward-thinking — it leaves a seam for "kernel-shared vs per-attester children" variants without needing a schema change. That's exactly the right amount of future-proofing for a schema.

The naming-Anchor pattern (SORT_INFO's `refUID = naming Anchor UID where anchorSchema = SORT_INFO_SCHEMA`) is the same overlay-naming pattern that EVENT/TRANSITION could use. If that pattern proves out at Sepolia, it generalizes.

**Constraints.** UID-stable fields: `sortFunc` (address), `targetSchema` (bytes32), `sourceType` (uint8). `refUID = naming Anchor` invariant. Revocable. The shared-list-per-parent semantic (vs per-attester) is load-bearing — edition filtering happens at read time via `getSortedChunkByAddressList`.

**Open question / followup.** Does `sourceType` need additional reserved values defined before Sepolia? The current default is 0 (kernel-shared). If Lists wants a per-list-instance sort overlay variant, that may want a different `sourceType`. Likely a Lists-spec-finalization concern, not a SORT_INFO schema change.

---

## Lists (in-flight additions)

**Status:** `hold-for-shape-freeze`

**Reasoning.** The Lists schema set isn't finalized in `02-Data-Models-and-Schemas.md`; it's described in `06-Lists-and-Collections.md` and `08-Custom-Lists-Design-Notes.md`. The audit's anticipatory analysis identified four design questions that should be answered before freeze:

1. **Per-entry metadata** (G15) — fanfic "read 12/30 chapters," podcast "played 18:32 of 42:00," RPG "in-campaign vs wishlist." Whether Lists supports per-entry PROPERTY or only per-list is a key shape question.
2. **Composition / set algebra** (G22) — RPG "OGL-licensed AND CR 1-3," coffee "lots in PG&E area AND verified by SolarReviews." Lists-internal vs SDK-derived.
3. **Ordered vs unordered** — fanfic rec lists are ordered, podcast subscriptions are unordered. Lists should support both.
4. **Queryability by contained-item attributes** — RPG license-aware filtering, fanfic content-warning filtering. SDK-derived-index concern, but the Lists schema should not foreclose it.

The audit calls Lists "the single most leverage-bearing decision in the current schema set" and recommends nailing per-entry semantics before merge. I agree. **Holding Lists for shape freeze is the right move unless the design thread can decisively answer G15 in the next 6 days, which seems unlikely.**

Sub-recommendation: ship Sepolia *without* Lists if necessary. The contract decomposition brainstorm noted that Lists' contract home is implicit-but-different across all 5 decomposition directions — that's a sign the design is not yet stable. Better to ship a minimal Sepolia and add Lists post-launch than to lock a half-baked Lists shape into the demo deploy.

If shipping at Sepolia is non-negotiable (e.g., for the OnionDAO demo UX), ship the smallest possible Lists shape — list-as-a-named-Anchor + list-membership-as-TAG + per-entry PROPERTY via convention — and explicitly tag it `redesign-before-mainnet` in the spec.

**Constraints.** Whatever shape ships must preserve: list-membership-as-an-edge (so PIN or TAG can carry it), per-entry attestation possibility (so per-entry PROPERTY can attach without re-issuing the membership), and clean composition with SORT_INFO (lists should be sortable). Anything that bakes "lists are unordered sets" or "lists have no per-entry metadata" into the schema is a forward-compatibility hazard.

**Open question / followup.** All four sub-questions above. The Lists design thread (which the audit recommends spinning up) should produce answers before any Lists schema gets a UID.

---

## New schemas — proposals

The audit's most important finding is that **most schema strains are SDK gaps, not schema gaps.** 17 of 30 are classified `solvable in SDK without schema change`. So the new-schema list is short. I propose exactly two new schemas for pre-mainnet-shape-freeze consideration. Both are `new-schema-needed`, both are explicitly *not* recommended for Sepolia.

### EVENT (or TRANSITION) — typed, directional, payload-carrying edge

**Status:** `new-schema-needed`

**Reasoning.** This is the audit's G01 gap — the 1-of-8 TAG roles that actually breaks. State transitions (museum ownership transfer, coffee supply-chain handoff, botanical synonymy-with-payload, recipe forks-with-edge-type) want a typed directional edge with an event-time field and a payload. Today this is a 3–5 attestation dance: a TAG marking the transition, a transition-naming Anchor, PROPERTYs on that Anchor carrying the payload, and a second TAG linking the new state. This works as a Sepolia convention but is genuinely awkward.

Why a new schema rather than expanding TAG: TAG's cardinality-N + `applies:bool` shape doesn't have room for `eventTime`, `prevState`, `nextState`, `payload`. Adding those fields to TAG would break the singleton-per-`(attester, target, definition)` invariant for non-event TAGs. Cleaner to add a sibling schema.

Proposed fields (sketch, not a design): `subject` (bytes32 Anchor or DATA UID), `definition` (bytes32 transition-type Anchor), `eventTime` (uint64), `prevState` (bytes32 optional), `nextState` (bytes32 optional), `payload` (string). Cardinality-N. Revocable.

The contract-decomposition brainstorm noted that adding a new schema means adding (or reusing) a resolver; in Direction 2 (current 5-contract) this is a 7th contract or an extension of EdgeResolver. In Direction 1 (3-contract) it lives in EFSGraph. The host decision is a design-thread concern.

**Constraints (if this proceeds).** UID-stable fields above. The `eventTime` field is the load-bearing semantic distinction from TAG — it carries event-time vs consensus-time, addressing G13. Cardinality-N is non-negotiable: provenance chains have N events per subject.

**Open question / followup.** Should this be one schema (EVENT) or two (TRANSITION for stateful changes, EVENT for stateless occurrences)? Lean: one schema with optional `prevState`/`nextState`. Avoids cardinality proliferation.

### COMMITMENT (encrypted-only DATA mode) — only if EFS sub-modes happen

**Status:** `new-schema-needed`, conditional

**Reasoning.** The G03/G20/G24 cluster (encrypted-only / right-to-be-forgotten / mirror auth) is a coherent design question: does EFS get an encrypted-commitment sub-mode? If the answer is no, this schema is moot. If the answer is yes, a COMMITMENT schema with `commitmentHash` + `accessPolicy` fields lets DATA stay clean as the public-bytes schema while COMMITMENT serves the private-bytes case.

I list this with low confidence — the question of whether EFS goes after medical / oral-history / sensitive-legal use cases is upstream of the schema decision. The audit correctly classifies the gap cluster as `post-mainnet`. So this schema is `new-schema-needed` only if the sub-mode strategy gets activated. For the mainnet shape freeze, the question to answer is: do we *foreclose* encrypted-mode by freezing without it, or do we leave space?

Tentative read: leave space by *not* freezing DATA in a way that requires every DATA to have public bytes. The current DATA schema already supports this (a DATA with no public mirrors is just an unservable file). So COMMITMENT is a future schema, not a freeze-blocker.

**Constraints (if this proceeds).** UID-stable fields: `commitmentHash` (bytes32 — Pedersen or similar), `accessPolicy` (bytes32 — pointer to a policy Anchor), `size` (uint64). Non-revocable. The semantic distinction from DATA is "no public bytes, ever" — load-bearing.

**Open question / followup.** Strategic: does EFS pursue encrypted-mode adoption, or stay public-only? Tactical: if yes, is COMMITMENT separate from DATA or a sub-mode flag on DATA? Recommendation: design conversation, not a Sepolia decision.

### Schemas explicitly NOT proposed

The audit catalogued 30 gaps. Most are SDK conventions. Some I explicitly do not turn into new schemas:

- **TIMESERIES / BATCH_DATA** (G07). Telemetry and citizen-science cardinality at 10⁸/day is an L2 strategy concern, not a schema concern. A new schema doesn't make the gas math work.
- **MULTILINGUAL_VALUE** (G06). Key-naming convention (`title_en`, `title_fr`) is workable. A schema-level locale dimension is over-engineering for a strain that hits 3 of 15 use cases.
- **TYPED_PROPERTY** (G02). SDK convention with a `typeHint` PROPERTY or key-naming. Avoid a schema explosion.
- **CANONICAL_NAME** (G16). PIN with the right `targetSchema` covers it (assuming PIN ships).
- **GEO_PROPERTY** (G29). Key-naming convention (`lat`, `lon`, `geohash`). SDK provides bounding-box queries.
- **DEVICE_ATTESTATION** (G19). External primitive (hardware-signed). Out of scope.

---

## Cross-cutting observations

- **The PIN/TAG split (ADR-0041) is the dominant unfrozen question.** PROPERTY, PIN, and TAG status all hinge on it. Until James resolves whether the split lands before Sepolia or after, those three schemas have ambiguous freeze status. This is the single highest-leverage decision in the freeze.
- **The spec-Glossary drift on PROPERTY is a real problem.** The spec describes a `(key, value)` PROPERTY; the Glossary describes a PIN-bound value under a key-Anchor. Whichever is right, the other should be brought into agreement before Sepolia, or the schema's freeze status is undecidable.
- **MIRROR and SORT_INFO are the safest schemas.** Both have settled shapes, well-scoped strain points (all router/SDK), and no contested ADR overlay. They can ship at Sepolia with full confidence.
- **Anchor and DATA are nearly as safe.** Marked `freeze-for-mainnet-soon` for caution, but no specific blocker.
- **Lists is rightly held.** Eight of 15 use cases depend on it; locking it half-designed is a forward-compatibility hazard.
- **EVENT/TRANSITION is the one real new-schema candidate.** The audit's careful 1-of-8 framing should be preserved: TAG is not broken, but the event-edge case it cannot serve is high-value (museum, supply chain, botanical synonymy).
- **The "schemas Etched, contracts upgradeable" asymmetry is the freeze's load-bearing constraint.** Even if individual resolver contracts are behind a proxy on devnet, schema UIDs are baked at registration time. Any schema we ship at Sepolia and immediately start writing public-facing demo data against is effectively Etched for compatibility purposes, even on a devnet.
- **The contract-decomposition direction interacts.** Direction 2 (status quo 5-contract) is the most schema-stable starting point; Directions 1 and 3 require resolver consolidation that re-registers schemas. If we want to keep schema UIDs stable across the Sepolia→mainnet transition, Direction 2 is the path of least resistance. If we want to consolidate contracts, schema-UID rotation comes along for the ride. Worth pricing.
- **PIN's "PROPERTY value binding" role keeps coming up.** The Glossary asserts it as a settled role; the spec doesn't show it; the audit treats it as a real binding pattern. If true, PIN is far more central than just "file placement edge." This deepens the urgency of the PIN/TAG split decision.

---

## Controversial human design choices

### Choice 1: PIN/TAG split before or after Sepolia

**Choice:** Does the ADR-0041 PIN/TAG cardinality split ship at the Sepolia/OnionDAO deploy, or is it deferred to a post-Sepolia rollout?

**Options:**
- **A — Ship with split.** Both PIN and TAG schemas at Sepolia. Cleaner long-term, but PIN is incompletely designed (PROPERTY value binding role unsettled).
- **B — Ship without split.** Current single TAG schema at Sepolia. Accept that mainnet will re-cut and orphan demo-data attestations.
- **C — Hybrid: ship TAG with new `weight` field but no PIN.** Single schema with cardinality-N semantics; cardinality-1 cases handled by convention. Worst of both worlds.

**Tentative read:** **A**, but only if PROPERTY's PIN-bound-value role is settled first. Otherwise **B** — better to ship the proven shape and re-cut once than ship a wrong PIN that orphans Sepolia data.

**Why controversial:** A locks a partial design; B accepts wasted demo data; C is a known anti-pattern but might be the only thing that demo timelines support. The decision pressure is asymmetric — A's downside (PIN wrong) is worse than B's downside (demo data orphaned), but A's upside (clean Sepolia→mainnet) is better than B's (re-cut required). Reasonable people will weigh demo polish vs schema cleanliness differently.

### Choice 2: PROPERTY shape — `(key, value)` field vs PIN-bound value

**Choice:** Does PROPERTY keep its current `(key string, value string)` shape (spec) or move to a PIN-bound value under a key-Anchor (Glossary)?

**Options:**
- **A — Keep current shape.** PROPERTY is `(key, value)` directly. Spec is correct; Glossary is wrong and needs update.
- **B — Move to PIN-bound.** PROPERTY drops `key`, becomes `(value)`; binding to key-Anchor happens via PIN. Glossary is correct; spec is stale.
- **C — Both.** Two schemas: legacy PROPERTY (key, value) for backward compat, new PROPERTY (PIN-bound) going forward. Worst case — two ways to do the same thing.

**Tentative read:** **B**, if and only if PIN ships at Sepolia (Choice 1 = A). Otherwise **A**, because shipping a PIN-bound PROPERTY without PIN is incoherent.

**Why controversial:** B is a bigger schema redesign than the audit's gap list implies. A keeps the simpler shape but means the PIN-as-binding-primitive story is partial. The Glossary's authoritative-feeling phrasing suggests B was the planned direction; the spec's stale state suggests B is in flight; neither has been formally committed. James is the only person who can call which it actually is.

### Choice 3: Ship Lists at Sepolia or hold

**Choice:** Does Lists ship as a sealed schema at Sepolia, or hold until per-entry-metadata + composition + ordered-vs-unordered are resolved?

**Options:**
- **A — Hold Lists.** Sepolia demo proceeds without Lists. Demo UX is poorer (no rec lists, no exhibitions, no personal cookbooks) but the schema isn't locked half-baked.
- **B — Ship minimal Lists.** List-as-Anchor + membership-as-TAG + per-entry-PROPERTY via convention. Demo works. Mark `redesign-before-mainnet`.
- **C — Ship full Lists with current spec.** Lock per-entry semantics now. Risk: 8 of 15 use cases find the shape inadequate.

**Tentative read:** **B**, with explicit "this shape is provisional" messaging in the demo and in `06-Lists-and-Collections.md`.

**Why controversial:** Lists is the audit's "single most leverage-bearing decision," but the demo will look thin without it. PMs will lobby for C; engineers will lobby for A; B is the negotiated middle that requires discipline to actually re-cut later (which historically rarely happens once data exists).

### Choice 4: EVENT/TRANSITION schema — design now, ship at mainnet, or never

**Choice:** Does EFS commit to designing an EVENT/TRANSITION schema before the mainnet shape freeze?

**Options:**
- **A — Yes, design now, ship at mainnet.** Spend design bandwidth in the next 60–90 days; ship as the 7th core schema at mainnet.
- **B — Yes, design after mainnet.** Add as a non-core schema post-mainnet; supply-chain and museum use cases use the convention layer until then.
- **C — No, the convention layer is permanent.** TAG + transition-Anchor + PROPERTYs is the EFS way; document the pattern, write the SDK helpers, move on.

**Tentative read:** **A**. The audit's reasoning ("adding a 7th core schema after mainnet is far cheaper than retrofitting a typed-edge concept into TAG") holds. The "splitting later is cheap, merging later is expensive" maxim from the contract-decomposition brainstorm applies — except the asymmetry runs the other way for schemas: *adding* a new schema is cheap (new UID), but the social cost of "the canonical EFS schema set grew after launch" is real.

**Why controversial:** A spends design bandwidth that competes with PIN/TAG split, Lists, and the encrypted sub-mode conversation. C is the Karpathy-style minimal answer and might be right. B is the safe middle. Reasonable people will weigh "ship fewer schemas" vs "ship the right shape once" differently — same axis as Choice 1.

### Choice 5: Encrypted-commitment sub-mode — engage or defer

**Choice:** Does EFS engage with the medical / oral-history / sensitive-legal use cases (a sub-mode question, not strictly a schema question)?

**Options:**
- **A — Engage now.** Start the design conversation; defer schema decisions until the sub-mode strategy is clear.
- **B — Defer to post-mainnet.** Public-only EFS at mainnet; sub-mode conversation is a v2 concern.
- **C — Reject.** EFS is public-permanent forever; explicitly disclaim medical / sensitive use cases.

**Tentative read:** **B**. The use cases are real but not load-bearing for the credibly-neutral-archive value proposition. Ship public-only at mainnet; revisit if a real consortium wants to fund the sub-mode work.

**Why controversial:** C is the cleanest message ("EFS is public-permanent, don't put PII here") and the safest legally. A could unlock major use cases but requires a multi-year design conversation. B kicks the can. The choice affects DATA's freeze status — Choice = C means DATA is definitively `freeze-for-mainnet-soon`; Choice = A means DATA might want a sub-mode field.

---

## Unknown questions for future brainstorms

### Q1: What does PIN's "PROPERTY value binding" role actually require of the schema?

**Question:** If PIN ships with both file-placement and PROPERTY-value-binding roles (per the Glossary), what does PIN's `definition` and `targetSchema` field combination need to look like to serve both? Are they the same schema with different `targetSchema` values, or different role-flagged variants?

**Brainstorm shape that would answer it:** A `bs-pin-property-binding-spec-v1` brainstorm that walks through the PROPERTY-on-DATA and PROPERTY-on-Anchor cases with the post-split PIN shape, identifies whether `targetSchema` is sufficient as the role discriminator, and surfaces any contract-resolver gaps. Should also stress-test against the Glossary's "key Anchor" convention to confirm PIN can serve as the binding edge.

**What it would unlock:** PROPERTY freeze decision. PIN freeze decision. Sepolia-vs-hold call for both.

### Q2: What is the actual cost of orphaning Sepolia attestations at the mainnet shape freeze?

**Question:** If we ship TAG (current shape) at Sepolia and then re-cut to PIN+TAG (post-split) at mainnet, how much demo data and downstream tooling assumes the Sepolia schema UIDs? Is the migration cost real or notional?

**Brainstorm shape that would answer it:** A `bs-sepolia-mainnet-migration-cost-v1` brainstorm that enumerates what's expected to be attested on Sepolia (OnionDAO demo content, third-party-developer test attestations, public-facing reference data), estimates the cardinality, and walks through what a re-cut migration looks like. Should also look at whether the schema-UID change can be hidden behind an SDK abstraction.

**What it would unlock:** Choice 1 (PIN/TAG split timing). If migration is cheap, ship Sepolia without split and re-cut at mainnet. If expensive, force the split before Sepolia.

### Q3: Does the EVENT/TRANSITION schema design force a contract-decomposition revision?

**Question:** If a 7th schema lands (EVENT), does its resolver host fit cleanly into any of the 5 contract-decomposition directions, or does it force a new direction? In particular: does Direction 2's EdgeResolver expand to host event edges, or does EVENT want its own EventResolver contract?

**Brainstorm shape that would answer it:** A `bs-event-schema-contract-host-v1` brainstorm that takes the audit's G01 sketch (proposed EVENT fields) and walks it through each of the 5 decomposition directions, identifying where it lives, what cross-contract reads it needs, and whether it disrupts the chosen direction's narrative.

**What it would unlock:** Joint decision on contract decomposition AND EVENT schema design. Currently both are pending and they interact.

### Q4: What is the per-entry-metadata semantic for Lists?

**Question:** Should Lists support per-entry PROPERTY attestations, and if so, what is the edge that binds the PROPERTY to the list-membership-as-edge? Is it PROPERTY-on-the-membership-edge (PIN/TAG attestation), or PROPERTY-on-a-list-entry-Anchor, or something else?

**Brainstorm shape that would answer it:** A `bs-lists-per-entry-metadata-v1` brainstorm that walks through the fanfic "read 12/30 chapters," podcast "played 18:32 of 42:00," and RPG "in-campaign vs wishlist" use cases, prototypes 2–3 metadata-binding shapes, and stress-tests them against the SDK query patterns each use case wants.

**What it would unlock:** Lists freeze decision. Sepolia ship-vs-hold call for Lists.

### Q5: What does the OnionDAO demo specifically need from the schema set?

**Question:** What is the actual concrete demo plan for OnionDAO at T-6 days? Which schemas does the demo exercise, what data does it write, and which schema bugs would be visible at the demo? This determines what *must* ship at Sepolia vs what *could* ship.

**Brainstorm shape that would answer it:** A `bs-oniondao-demo-schema-needs-v1` brainstorm that captures the demo flow (probably from chat context — likely doesn't exist as a vault doc yet), lists the schema-touching operations in order, and identifies the minimum schema set the demo needs.

**What it would unlock:** Realistic prioritization of which schemas have to be sealed by deploy and which can be deferred.

---

## Blockers / concerns

### Blocker 1: ADR-0041 PIN/TAG split is unwritten

**What's blocked:** PROPERTY, PIN, and TAG freeze decisions. SDK API design around all three. EFS's contract-decomposition direction choice (because the split affects EdgeResolver's surface area).

**The blocker:** ADR-0041 is referenced in the Glossary and across brainstorms as if it's a settled decision, but it does not exist in `contracts/docs/adr/` and the spec (`02-Data-Models-and-Schemas.md`) still describes a single TAG schema. The split has been *discussed* but not *committed* — and the schema set freezes around it.

**Who/what could unblock:** James. Either write ADR-0041 to commit the split (with PROPERTY-value-binding role clarified) or explicitly defer the split to post-Sepolia. This is a Tier 1 question per the contracts repo's escalation tiers — agents cannot decide without ADR backing.

### Blocker 2: Spec-Glossary drift on PROPERTY

**What's blocked:** PROPERTY freeze decision. Any agent or third-party developer trying to understand PROPERTY's actual on-chain shape.

**The blocker:** The spec says PROPERTY is `(key string, value string)`. The Glossary says PROPERTY is a free-floating value placed via PIN under a PROPERTY-typed key Anchor. These are different schemas with different UIDs and different resolver requirements. The Glossary is dated 2026-05-26 (recent); the spec is presumably older. Neither has been brought into agreement.

**Who/what could unblock:** James, with a one-line clarification: "PROPERTY's authoritative shape is X, update the other to match." Could also be resolved by ADR-0041's writeup if it includes PROPERTY's interaction with PIN.

### Blocker 3: Lists schema is not finalized in the spec

**What's blocked:** Lists freeze decision. SDK Lists API design. Demo-readiness assessment.

**The blocker:** `06-Lists-and-Collections.md` and `08-Custom-Lists-Design-Notes.md` describe Lists conceptually but the schema fields aren't pinned. The four design questions the audit identified (per-entry metadata, composition, ordered vs unordered, queryability) are all open.

**Who/what could unblock:** A Lists design thread that decides per-entry metadata semantics first (Q4 above). The other three questions can be deferred without blocking a minimal shape.

### Concern 1: Schema-UID immutability vs devnet upgradeability tension

**What's blocked:** Confidence that "Sepolia ships, mainnet re-cuts what needs re-cutting" is actually viable.

**The concern:** The open Tier-2 question in `docs/QUESTIONS.md` (TransparentUpgradeableProxy for devnet) makes contracts upgradeable but **does not** make schema UIDs mutable. So a Sepolia schema is mutable-via-proxy at the resolver level but immutable at the schema-set level. If the OnionDAO demo writes substantive data against Sepolia and we re-cut a schema at mainnet, that demo data is orphaned. The asymmetry between "contracts upgradeable" and "schemas immutable" is not currently spelled out in any spec.

**Who/what could unblock:** A clear policy statement — e.g., in the launch checklist or as an ADR — that Sepolia/OnionDAO data is *not* portable to mainnet and demo content should be regenerable. This sets expectations before the demo and removes the political pressure to preserve schemas that turn out to be wrong.

### Concern 2: Demo timeline pressure may force ship-then-redesign even where it's wrong

**What's blocked:** Schema-set quality at mainnet.

**The concern:** T-6 days is not enough time to resolve Blockers 1–3. The realistic outcome is "ship what we have, mark it `redesign-before-mainnet`, hope discipline holds." Historically this kind of "ship now, redesign later" plan slips into "ship now, never redesign." Schema UIDs are baked, schema sets get treated as load-bearing, third-party tooling builds against them.

**Who/what could unblock:** Explicit project-management commitment to revisiting `redesign-before-mainnet` items in a defined window (e.g., "30 days after Sepolia deploy, run a schema-set audit and confirm what we're carrying to mainnet vs what we're re-cutting"). Adding this to the launch checklist is cheap.

### Concern 3: The contract-decomposition direction choice interacts with the schema freeze

**What's blocked:** Schema-UID stability across the Sepolia→mainnet transition.

**The concern:** The contract-decomposition brainstorm presented 5 directions, 3 of which (1, 3, 5) require consolidating resolver contracts — which re-registers schemas with new UIDs. If we ship Sepolia in Direction 2 (status quo) and pick Direction 1 or 3 or 5 for mainnet, every schema UID rotates. That's effectively a full re-cut. The decomposition choice is currently treated as an "after Sepolia" decision but it's coupled to "which schema UIDs are stable."

**Who/what could unblock:** A decision to either (a) pick the decomposition direction *before* Sepolia, or (b) explicitly commit to Direction 2 at Sepolia regardless of what's chosen for mainnet (which means mainnet *might* re-cut everything). Either resolves the coupling.

### Concern 4: The EVENT/TRANSITION schema's design timeline is undefined

**What's blocked:** Whether mainnet ships with 6 or 7 core schemas.

**The concern:** The audit recommends designing EVENT/TRANSITION before mainnet shape freeze. There is no design thread or design owner assigned. If the design conversation doesn't start, the default outcome is "convention layer is permanent" — which is fine but should be a *deliberate* choice, not a defaulted one.

**Who/what could unblock:** James assigns the design thread or explicitly defers / rejects EVENT. The audit's framing ("a serious look before mainnet shape freeze") should not silently become "we never looked."

---

End of recommendations.

Summary: 7 schema recommendations made (Anchor, DATA, PROPERTY, MIRROR, PIN, TAG, SORT_INFO) plus Lists held and 2 new-schema proposals (EVENT/TRANSITION, COMMITMENT conditional). The dominant unresolved decision is the PIN/TAG split, which blocks 3 of 7 schemas' freeze status. The PROPERTY spec-Glossary drift is the most concretely fixable blocker. Other blockers and concerns are scoped to keep the freeze conversation honest about what's actually settled.
