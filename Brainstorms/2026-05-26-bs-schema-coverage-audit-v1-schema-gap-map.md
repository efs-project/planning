---
agent: bs-schema-coverage-audit-v1
date: 2026-05-26
status: raw
anchors:
  - area: contracts
  - area: sdk
  - brainstorm: 2026-05-26-bs-divergent-usecases-v1
---

# Schema coverage audit against EFS use cases

This brainstorm audits the EFS schema set (Anchor, DATA, PROPERTY, MIRROR, PIN, TAG, SORT_INFO, plus the in-flight Lists additions) against the 15 use cases generated in `bs-divergent-usecases-v1`. The goal is to surface schema gaps before Lists locks the schema set in concrete and before Sepolia/OnionDAO go live. I work from the schemas as described in `contracts/specs/02-Data-Models-and-Schemas.md`, `specs/overview.md`, and the Glossary's PIN/TAG cardinality distinction (ADR-0041). I deliberately stay at the requirements-and-gap level — no schema designs — and I stress-test the prior brainstorm's "TAG is overloaded" finding honestly, including where it doesn't hold up. Bottom line: typed-edge is real but narrower than the prior framing implied; most fixes can be SDK conventions, a few want schema-level help.

## 1. Schema-by-schema coverage analysis

### Anchor

**Leans on it:** Botanical (1), CAD (3), Field recordings (6), Firmware (7), Sports stats (8), Museum (11), Podcast (12), Coffee (13), Telemetry (15) — essentially every case uses Anchors as the path/name backbone.

**Covers well:** Deep hierarchies (botanical taxonomy, sports League/Season/Team/Game/Player) sit comfortably within `MAX_ANCHOR_DEPTH=32`. The "name is unique within parent hierarchy" rule is exactly what these schemas want. The reuse of Anchors as tag-definitions, transport-definitions, and SORT_INFO naming nodes is elegantly minimal.

**Where it strains:** Anchors are non-revocable. Several use cases want soft-deprecation of a name (a taxon is reclassified; a museum object accession number is corrected; a vendor mis-typed a Bates folder). There is no Anchor-level "hide / supersede" primitive — you can only abandon the name and create a new one. Multilingual naming (museum, oral history) wants a single Anchor with locale variants; today that becomes a PROPERTY pattern, leaving the canonical `name` permanently in one language. Anchor-as-tag-definition also means the `/tags/` namespace is permissionlessly globally collision-resistant *by reference* but not *by spelling* — fanfic tag-wrangling ("Sherlock Holmes" vs "Sherlock Holmes (TV)") has no in-schema disambiguation.

### DATA

**Leans on it:** Legal (2), CAD (3), Birding (4), Recipes (5), Field recordings (6), Firmware (7), Sports stats (8), RPG (9), Medical (10), Podcast (12), Fanfic (14), Telemetry (15).

**Covers well:** Content-addressed identity + dedup via `dataByContentKey` is exactly the right primitive for archival use cases (legal evidence, firmware, museum imagery, podcast back-catalog). Non-revocability is the *product* for chain-of-custody work.

**Where it strains:** Non-revocability is the *anti*-product for medical, oral histories with consent constraints, and any case where PII may leak (legal exhibits, citizen-science photos with bystanders). DATA has no concept of an encrypted-commitment-only mode — the contentHash leaks structural information about the bytes even when the bytes aren't stored. High-frequency-write cases (birding, energy telemetry at 10⁸/day) want batch-DATA semantics; today each observation is its own DATA + TAG + maybe PROPERTY, which is gas-prohibitive on L1.

### PROPERTY

**Leans on it:** Essentially all 15. Heaviest: botanical (locality, collector, GBIF ID, DOI), legal (Bates, privilege, custodian), sports (30+ stats per player per game), supply chain (cup score, varietal, weight), oral history (consent terms, speaker, language), telemetry.

**Covers well:** Free-form key/value covers the long tail. The PIN-bound singleton-per-key convention (ADR-0041) gives a clean "newest active" semantic. PROPERTY-on-Anchor and PROPERTY-on-DATA both work.

**Where it strains:** Several real problems.
- **Typed values.** "Tolerance: ±0.005in over 50mm" (CAD), "CR 1–3" (RPG), "harvest date 2025-09-12" (coffee), "kWh = 4.213" (telemetry) all want typed/queryable values. Today everything is a string blob; range/numeric queries are a derived-index problem the SDK must solve repeatedly.
- **Structured values.** FHIR resources (medical), Recipe schema.org (recipes), Darwin Core records (botanical) are nested objects. Stuffing them into a string value works but loses queryability.
- **Multi-valued keys.** "device compat list" (firmware), "ingredient list" (recipes), "tag list" (fanfic) want arrays. Today: separate PROPERTYs with different keys, or a JSON blob, or many TAGs.
- **Time-series cardinality.** Telemetry wants 96 PROPERTYs/day/installation. PROPERTY-as-event doesn't scale even on L2.
- **Multilingual PROPERTY.** Museum titles (English + source language), oral histories (transcript + translation + IPA) need a locale dimension that's currently encoded in the key string (`title_en`, `title_fr`) by convention.

### MIRROR

**Leans on it:** CAD (3), Field recordings (6), Firmware (7), Medical (10), Podcast (12), any case with large blobs.

**Covers well:** Multiple transports per DATA + transport priority order is exactly right for archival redundancy (Arweave + IPFS + magnet: for firmware). The "no singleton enforcement" decision (ADR-0015) supports the firmware case where 50+ attesters each contribute a mirror.

**Where it strains:** `MAX_PAGES = 10` mirror-scan cap (ADR-0020) is repeatedly flagged. Podcast multi-bitrate variants, firmware mirror-glut, popular CAD parts will all blow past it. **This is the most concrete soft-deadline gap.** Encrypted mirrors (medical, restricted oral history) have no first-class representation — the URI points at a gated server, decryption envelope lives in PROPERTY by convention, but there's no schema-level signal "this mirror requires auth." Mirror health/freshness has no on-chain notion; a dead Arweave gateway is indistinguishable from a live one until you fetch.

### PIN

**Leans on it:** Legal (2) PIN-as-Bates-binding, botanical (1) PIN-as-accepted-name, coffee (13) PIN-as-current-custodian, museum (11) PIN as singleton "primary image."

**Covers well:** The cardinality-1 contract is exactly what these cases want — there should be one "official Bates label per case per attester," one "current custodian" at a time. Re-attestation at the same `(attester, definition, targetSchema)` slot superseding in O(1) is gas-friendly for these state-transition use cases.

**Where it strains:** PIN is conceptually narrow — file placement + PROPERTY value binding. None of the use cases want a *different* PIN; instead, they want what PIN's cardinality-1 model offers but for transitions PIN wasn't designed for (handoff events, ownership transfers). This is really a TAG complaint in disguise (see § 2).

### TAG

**Leans on it:** All 15. Most overloaded: fanfic (14: tags are the entire UX), birding (4: species TAG at location anchor with weight), museum (11: provenance edges), coffee (13: handoff events), botanical (1: synonymy graph), legal (2: case docket placement).

**Covers well:** The original mandate — file placement + descriptive labels — is well-served. Singleton-per-`(attester, target, definition)` with `applies=false` removal handles "I changed my mind" cleanly. Cardinality-N with `int256 weight` supports weighted-vote semantics (birding observation counts, fanfic "major character A" vs "background mention B"). For ~9 of 15 use cases TAG does its job without complaint.

**Where it strains:** This is the meat of § 2. Briefly: TAG carries no edge direction, no edge type beyond the definition Anchor's identity, no event timestamp beyond EAS time, no payload, no inverse-edge convention. Use cases that want a *typed directional edge* (provenance, synonymy, handoff, version-derivation) end up encoding the edge type in the definition Anchor's path (`/relations/is-synonym-of/`) and the direction in convention (which side is `refUID` vs `definition`). It works but is unprincipled.

### SORT_INFO

**Leans on it:** Sports stats (8: leaderboards), botanical (1: sort by date / locality), podcast (12: chronological feeds), birding (4: time-range sorted feeds), CAD (3: faceted browse over years/manufacturers), coffee (13: cup score ranking).

**Covers well:** Per-parent shared sorted lists with pluggable `ISortFunc` is exactly the abstraction these need. "Named sort overlay attached to a directory" is a natural surface for leaderboards and chronological views.

**Where it strains:** Most use cases want sort *by PROPERTY value*. There's no canonical `PROPERTY_VALUE_SORT_FUNC` in scope yet; every consumer would write their own ISortFunc to read a PROPERTY and compare. This is a missing SDK + reference-comparator gap rather than a schema gap. Faceted browse (CAD: material × year × manufacturer) is multi-dimensional sort, which SORT_INFO doesn't promise — but probably shouldn't.

### Lists (in-flight)

**Leans on it:** RPG (9: campaign content compendium), fanfic (14: rec lists), museum (11: exhibitions), recipes (5: personal cookbooks), sports (8: all-star teams, season leaders), podcast (12: subscriptions), firmware (7: "verified by EFF" curation), coffee (13: "single-estate Geisha lots, 2025 harvest"), birding (4: year list / county checklist).

**Covers well (presumed, based on `specs/06-Lists-and-Collections.md` and `08-Custom-Lists-Design-Notes.md` referenced in the index):** Lists is the curation primitive that ties the kernel to user experience. Eight of 15 use cases explicitly want it; calling it "essential, not optional" is correct.

**Where it strains (anticipatory, since the schema isn't finalized in `02`):**
- Reader-progress / per-entry metadata (fanfic "read 12/30 chapters", podcast "played 18:32 of 42:00") wants PROPERTY-on-list-entry semantics. Whether Lists supports per-entry PROPERTY or only per-list is a question that should be answered before freeze.
- Cross-list operations ("all lots in PG&E service area AND verified by SolarReviews") are set algebra; whether Lists itself supports composition or punts to the SDK is an open call.
- Ordered vs. set-only: fanfic rec lists are ordered, museum exhibitions are ordered, podcast subscriptions are unordered. Lists should support both (ordered list with implicit "first added" sort vs. explicit sort).
- License-aware filtering (RPG, fanfic) wants Lists to be queryable by attribute of contained items — really an SDK derived-index concern, but the Lists schema should not foreclose it.

## 2. Stress-test the typed-edge finding

The prior brainstorm asserted "TAG is asked to do too much" and listed eight roles. I walk through specific use cases in each of three buckets: works fine, strains but workable, actually breaks.

### (a) TAG-as-typed-edge works fine

- **File placement** (every use case). `TAG(refUID=DATA, definition=path_anchor, applies=true)` is exactly the original design intent. No strain.
- **Descriptive labels** (fanfic `#weeknight`, firmware `#stable`, RPG `#3rd-party-OGL`, recipes `#vegetarian`). Definition Anchor under `/tags/` carries the label semantics; `applies` bool carries the assertion. No strain.
- **Weighted vote** (birding observation counts, fanfic character-prominence). `int256 weight` is in the schema. The aggregation logic lives off-chain per ADR-0041, which is the right call. No strain.
- **Lens-based labeling** ("my lens places this DATA at this path, with this label"). Single-attester scoping is built-in via the `(attester, target, definition)` singleton. No strain.

That's 5 of the 8 roles the prior brainstorm flagged. **The "TAG is overloaded" framing was overstated** — most roles fit comfortably.

### (b) Strains but workable

- **Synonymy / cross-reference** (botanical "is-synonym-of", CAD "same jet on 4 bikes", recipes "previousVersion"). A symmetric or directional relation between two Anchors/DATAs encoded as `TAG(refUID=A, definition=/relations/is-synonym-of, applies=true)` with the convention that you read direction from definition naming. Works, but:
  - Inverse edges must be attested separately ("A is-synonym-of B" doesn't auto-give "B is-synonym-of A").
  - No edge payload (botanical wants `since: 1978, type: heterotypic`).
  - Discoverability of "what relations point at X" requires a derived index in the SDK.

  Workable with a documented SDK convention + indexer. Severity: medium.

- **Fanfic descriptor cardinality.** 30–100 TAGs per fic, 14M fics, 700M TAG attestations. The schema handles it semantically; the chain doesn't handle it economically. Not a schema problem — a layer-2 problem. Severity: low (from schema perspective).

- **Tag-wrangling / disambiguation** ("Sherlock Holmes" vs "Sherlock Holmes (TV)"). The Anchor-based definition prevents accidental collision (different Anchors = different UIDs) but does nothing to prevent intentional or duplicative redundancy. Workable via SDK-side alias maps and curator-maintained "canonical" lenses. Severity: low.

### (c) Actually breaks

- **Provenance edges with embedded state-transition data** (museum 11, coffee 13). A handoff is more than "this DATA is now associated with this label." Coffee: "farmer X transferred lot Y to mill Z on date D, weight W kg, with this quality grade." Museum: "owner A transferred object O to owner B in year Y, with sale price P, citation C." A TAG carries `applies:bool` and definition Anchor — it cannot carry the transition payload (weight, date, price, citation, prior state, next state). You end up with:
  - A TAG to mark the transition occurred.
  - A separate Anchor naming the transition (e.g. `/handoffs/lot-y-farmer-to-mill-2025-09-12`).
  - PROPERTYs on that Anchor carrying the payload.
  - A second TAG linking the new custodian.

  This is a 3–5 attestation dance for one logical event. Worse, the *order* of events matters (provenance chain) and ordering depends on EAS attestation time, which is consensus-time, not event-time.

  **Severity: high** for any supply-chain or provenance use case (use cases 11, 13). **Fix candidates:**
  - **New schema (EVENT or TRANSITION):** `refUID = subject Anchor, definition = transition_type_Anchor, payload = string, eventTime = uint64, prevState = bytes32, nextState = bytes32`. Cardinality-N. Revocable.
  - **Convention layer on TAG normalized by SDK:** a `TAG` whose definition Anchor is under `/events/` is treated as an event by SDK; payload lives in PROPERTYs on a transition-naming Anchor. Codify the pattern, write the SDK helpers.
  - **Live with the limitation:** publish the convention, accept the 3–5 attestation dance, optimize gas at the multi-attest layer.

  My honest read: convention layer is sufficient for v1 (Sepolia/OnionDAO), schema upgrade is worth a serious look before mainnet shape freeze.

- **Version-derivation / fork edges** (recipes 5 `previousVersion`, RPG 9 statblock forks, podcast 12 "edited version"). Today encoded as PROPERTY `previousVersion = <DATA UID>` on the new DATA. This works for forward traversal ("what's the parent of this") but reverse traversal ("show me all forks") requires a derived inverted index. The PROPERTY approach also can't carry edge type ("major rewrite" vs "typo fix" vs "translated to French") without overloading the key.

  **Severity: medium.** The PROPERTY-as-edge pattern is already established and Karpathy-style minimal. Fix candidates:
  - **Convention layer:** SDK exposes `getForwardVersion(DATA)` and `getReverseVersions(DATA)` with consistent semantics; derived index in off-chain SDK.
  - **Live with it:** document the pattern, ship the SDK helper.

  I lean: live with it. Schema-level fork-edge is over-engineering for the cases that actually want it.

- **Ownership transfer** (museum 11). A flavor of state-transition above. Same fix surface; bundle with provenance work.

- **Synonymy with payload** (botanical 1: "heterotypic synonym, since 1978, ref: Stevens 2001"). Bundle with the provenance/event-edge conversation. Same shape.

### Honest assessment of the prior finding

The prior brainstorm's "typed-edge schema deserves a serious look" is correct but its framing ("TAG is asked to do too much") oversells the problem. **5 of 8 roles TAG was flagged for are fine; 2 are workable with SDK conventions; 1 (state-transition / event edges with payload) is the real gap.** That one gap is non-trivial — it hits museum provenance and supply-chain handoff, both high-value verticals. But it's not "TAG is broken" — it's "TAG plus PROPERTY plus convention works for v1, and a dedicated EVENT/TRANSITION schema is worth designing for mainnet shape freeze."

The strongest argument for acting before Lists ships: schema UIDs are immutable (Etched tier), and adding a 7th core schema *after* mainnet is far cheaper than retrofitting a typed-edge concept into TAG. If the design thread agrees it's needed for any real-world vertical post-launch, freezing without it locks the constraint.

## 3. Gap catalog

Prioritized roughly by combined `(severity × number of use cases hit × cost-to-fix-later)`.

### G01 — Event/state-transition edges (provenance, handoff)

- **Use cases:** Museum (11), Coffee (13), Botanical synonymy (1).
- **Missing:** A typed, directional, payload-carrying, time-ordered edge schema. Today encoded as a TAG + a transition-naming Anchor + 2-4 PROPERTYs.
- **Class:** `must-have for shape freeze` (mainnet), `solvable in SDK without schema change` (Sepolia/OnionDAO).
- **Resolution:** Convention layer for v1; design a dedicated EVENT/TRANSITION schema before mainnet shape freeze. (Design-thread work, not this brainstorm.)

### G02 — PROPERTY typed values

- **Use cases:** CAD (3), RPG (9), Coffee (13), Telemetry (15), Sports (8).
- **Missing:** Value typing (number, date, range, enum) for range/numeric queries.
- **Class:** `solvable in SDK without schema change` for v1; `nice-to-have` for schema (a `valueType` field would help SDKs not have to guess from key).
- **Resolution:** SDK convention for typed value parsing keyed off a `typeHint` PROPERTY or a key-naming convention (`weight_kg`, `harvested_at_iso`). Living with string values is workable; convention guides queryable indexers.

### G03 — Encrypted / access-controlled mode

- **Use cases:** Medical (10), Oral histories (6), Legal exhibits with PII (2).
- **Missing:** A schema-level signal that DATA is a commitment-only (hash but no bytes), or that MIRROR requires auth. Right-to-be-forgotten is fundamentally hostile to current DATA non-revocability.
- **Class:** `post-mainnet` for v1 public chain; possibly `must-have for shape freeze` if cultural-heritage / medical adoption is desired before mainnet.
- **Resolution:** This may be a sub-mode of EFS (consortium chain, L3) rather than a schema change. Worth a design conversation, but not a kernel-shape-freeze blocker.

### G04 — Mirror scan cap insufficient for real workloads

- **Use cases:** Podcast (12: multi-bitrate), Firmware (7: 50+ mirrors), CAD (3).
- **Missing:** `MAX_PAGES = 10` (ADR-0020) is hypothesized, not data-driven. Real cases want 50+.
- **Class:** `must-have for shape freeze` if values are baked into mainnet contracts.
- **Resolution:** Revisit ADR-0020 with measured data from devnet workloads; consider raising limit or making it a router-config knob.

### G05 — Anchor soft-deprecation / supersession

- **Use cases:** Botanical (1: taxonomic reclassification), Museum (11: accession correction).
- **Missing:** No "this Anchor name is superseded by that one" primitive. Today: abandon and re-create.
- **Class:** `solvable in SDK without schema change`.
- **Resolution:** Convention PROPERTY `supersededBy = <Anchor UID>` on the deprecated Anchor; SDK surfaces "this anchor has a successor."

### G06 — Multilingual PROPERTY values

- **Use cases:** Museum (11), Oral history (6), Botanical (1).
- **Missing:** Locale dimension. Today encoded in key (`title_en`, `title_fr`).
- **Class:** `solvable in SDK without schema change`.
- **Resolution:** Document the `key_locale` convention; SDK helper for locale-aware queries.

### G07 — Time-series / high-frequency DATA

- **Use cases:** Telemetry (15: 96/day/installation × 1M = 10⁸/day), Birding (4: 10⁸/year).
- **Missing:** Batch-DATA semantics — many small payloads grouped into one attestation. Today each event is a separate DATA/TAG/PROPERTY triple.
- **Class:** `post-mainnet` (L2/rollup conversation, not a schema-shape issue).
- **Resolution:** L2 sub-roll-up strategy; possibly an "append-only series" Anchor type. Defer.

### G08 — Multi-valued PROPERTY (arrays)

- **Use cases:** Firmware (7: device compat list), Recipes (5: ingredients), Botanical (1: collector list).
- **Missing:** Native array semantic. Today: JSON-blob in value, or many PROPERTYs with sequence-suffixed keys.
- **Class:** `solvable in SDK without schema change`.
- **Resolution:** SDK convention (`<key>[0]`, `<key>[1]` or JSON-array values for non-queryable cases); document, normalize at SDK boundary.

### G09 — Tag disambiguation / wrangling

- **Use cases:** Fanfic (14), RPG (9), Botanical (1: synonymy with canonical name).
- **Missing:** No in-schema mechanism to assert "these two tag definitions mean the same thing." Today: a curator lens publishes aliasing TAGs.
- **Class:** `solvable in SDK without schema change`.
- **Resolution:** Convention: `TAG(refUID=tag_def_A, definition=/relations/is-alias-of/tag_def_B)`. SDK consumes lens-published alias maps. Falls under G01 if event-edges land.

### G10 — Reverse traversal of PROPERTY-as-edge

- **Use cases:** Recipes (5: forks of this recipe), Podcast (12: edited versions), RPG (9: statblock derivations).
- **Missing:** `previousVersion` PROPERTY is forward-only on-chain. Reverse requires off-chain index.
- **Class:** `solvable in SDK without schema change`.
- **Resolution:** Off-chain TS SDK provides inverted-index. Document it as a SDK-baked-in pattern.

### G11 — Edge payload (timestamps, weights beyond `int256`, references)

- **Use cases:** Coffee (13: weight kg per handoff), Museum (11: sale price), Botanical (1: synonymy citation).
- **Missing:** Edge-level metadata. Today: payload lives in a separate Anchor + PROPERTYs.
- **Class:** subsumed by G01.
- **Resolution:** See G01.

### G12 — Lens granularity ("trust for X domain only")

- **Use cases:** Firmware (7: trust for these device classes), Legal (2: trust for these matter types), RPG (9: trust for these fandoms), Fanfic (14: trust for content warnings only).
- **Missing:** Lens-attester binding is currently binary per attester. No per-domain partitioning.
- **Class:** `nice-to-have` (lens model is at the router/SDK layer, not the kernel schema layer).
- **Resolution:** Out of scope for schema audit; flag for lens-model design thread.

### G13 — Event time vs consensus time

- **Use cases:** Museum (11: provenance dates), Coffee (13: harvest date), Birding (4: observation timestamp).
- **Missing:** Today, "when did this event happen" is encoded as a PROPERTY; the consensus block time is what's available natively. SDKs must always trust the PROPERTY over the EAS time for real-world ordering.
- **Class:** `solvable in SDK without schema change`.
- **Resolution:** Convention: `eventTime` PROPERTY (ISO 8601 string); SDK helper. Subsumed by G01 for the event-schema route.

### G14 — Sort by PROPERTY value (reference ISortFunc)

- **Use cases:** Sports (8: leaderboards), Coffee (13: cup score), Botanical (1: collection date), Podcast (12: chronological), RPG (9: CR ranking).
- **Missing:** Reference `PropertyValueSortFunc` contract + SDK helper. SORT_INFO supports it conceptually, but no canonical comparator ships today.
- **Class:** `must-have for shape freeze` if "sortable lists" is launch-critical, otherwise `nice-to-have`.
- **Resolution:** Build reference `ISortFunc` that reads a named PROPERTY and compares as `(string | numeric | iso-date)`; ship with SDK examples.

### G15 — Per-entry metadata on Lists (read-progress, ranking)

- **Use cases:** Fanfic (14: read-progress), Podcast (12: played seconds), RPG (9: in-campaign vs. wishlist).
- **Missing:** Whether Lists supports per-entry PROPERTY is unclear pre-spec-finalization.
- **Class:** `must-have for shape freeze` (depends on Lists shape; resolve before lock).
- **Resolution:** Lists-design thread should confirm per-entry attestation semantics.

### G16 — Lens-curated alias / canonical-name authority

- **Use cases:** Botanical (1: accepted-name vs synonym per herbarium), Museum (11: title vs alternative title), Fanfic (14: tag canonical form per fandom).
- **Missing:** PIN-as-singleton "canonical X per attester" works in principle but use-cases want it for non-PROPERTY-value bindings (e.g. "Kew's accepted name for Quercus alba is this Anchor"). PIN may or may not extend cleanly.
- **Class:** `solvable in SDK without schema change` (with PIN extension via convention).
- **Resolution:** Document PIN-as-canonical-reference pattern; validate with the PIN/TAG split's actual contract surface.

### G17 — Faceted / multi-dimensional sort

- **Use cases:** CAD (3: material × year × manufacturer), RPG (9: CR × type × source), Coffee (13: cup score × varietal × origin).
- **Missing:** SORT_INFO is one-dimensional. Faceted browse is a derived-index problem.
- **Class:** `solvable in SDK without schema change`.
- **Resolution:** Off-chain SDK responsibility; document the pattern.

### G18 — Cardinality > 20 lenses

- **Use cases:** Firmware (7: many trust sources), Fanfic (14: many moderation lenses), Sports (8).
- **Missing:** `MAX_EDITIONS = 20` (ADR-0026) may pinch the more lens-heavy verticals.
- **Class:** `nice-to-have` (router-layer limit, not schema, but baked into deployed contract).
- **Resolution:** Revisit ADR-0026 with workload data; possibly raise to 50.

### G19 — Hardware / device attestation (signed by physical device)

- **Use cases:** Telemetry (15: inverter-signed), Birding (4: GPS-signed observation).
- **Missing:** No "this attestation was signed by an externally certified device" primitive. Today: attester signs, and trust is by-attester.
- **Class:** `post-mainnet` (external primitive; possibly a PROPERTY convention).
- **Resolution:** Out of scope; flag.

### G20 — Right-to-be-forgotten / redaction overlay

- **Use cases:** Medical (10), Legal exhibits (2), Oral history (6), Citizen-science PII (4).
- **Missing:** No mechanism to surface "this DATA's payload has been deemed unfetchable" at the kernel level. MIRROR revocation drops one URI but not the DATA.
- **Class:** `post-mainnet` (fundamental tension with EFS permanence; needs design conversation, not a schema field).
- **Resolution:** Either accept the limitation (and warn loudly in onboarding) or design an encrypted-only sub-mode. Bigger than a schema gap.

### G21 — Inverse-edge convention for TAG synonymy

- **Use cases:** Botanical (1), CAD (3: same-jet-on-multiple-bikes).
- **Missing:** "A is-synonym-of B" doesn't imply "B is-synonym-of A" on-chain.
- **Class:** `solvable in SDK without schema change`.
- **Resolution:** SDK auto-creates inverse edges when synonymy attestations are written, with consistent semantics.

### G22 — Cross-list set algebra

- **Use cases:** Coffee (13: "lots in PG&E area AND verified by SolarReviews"), RPG (9: "OGL-licensed AND CR 1-3"), Birding (4: "my year list AND county 2026").
- **Missing:** Whether Lists supports composition (intersection/union/difference) at the kernel.
- **Class:** `nice-to-have` schema, `solvable in SDK` for derived computation.
- **Resolution:** SDK convention; punt set-algebra to off-chain.

### G23 — Anchor name validation per use case

- **Use cases:** Legal (2: Bates allows specific formats), Botanical (1: Latin names with specific charset).
- **Missing:** `Anchor name validation` (ADR-0025) is global. Per-namespace stricter validation is a PROPERTY/convention concern.
- **Class:** `solvable in SDK without schema change`.
- **Resolution:** SDK-side validators for namespace-specific rules.

### G24 — Mirror auth / encryption envelope

- **Use cases:** Medical (10), Oral history restricted (6), Firmware signed updates (7).
- **Missing:** No schema-level "this mirror requires X auth" or "decryption envelope is at Y." Today: PROPERTY conventions.
- **Class:** subsumed by G03.

### G25 — DATA size > on-chain attest cost

- **Use cases:** CAD (3: 500MB STEP files), Podcast (12: 500MB audio), Oral history (6: hours of WAV).
- **Missing:** Not a gap per se — the MIRROR-only flow (skip on-chain bytes, just attest hash + URI) is supported. But there's no schema signal "this DATA is intentionally off-chain-only" — a fetcher trying SSTORE2 first wastes effort.
- **Class:** `nice-to-have` (router optimization).
- **Resolution:** PROPERTY convention `storageMode = off-chain-only`; router uses it to skip web3:// transport lookup.

### G26 — Per-attester PROPERTY conflict resolution

- **Use cases:** Sports (8: two attesters disagree on stat line), Museum (11: disputed provenance), Coffee (13: weight discrepancy).
- **Missing:** When two attesters write PROPERTY for the same key on the same DATA under a single lens-merge, which wins? Edition-scoped PROPERTY lookup (ADR-0014) gives a per-lens answer, but multi-lens merge is undefined.
- **Class:** `nice-to-have` (router/SDK policy).
- **Resolution:** Subsumed by the unresolved "multi-edition merge semantics" question already in `docs/QUESTIONS.md`.

### G27 — Bulk-import atomicity

- **Use cases:** Botanical (1: 100k Darwin Core records), Legal (2: 50k-doc production set), Sports (8: 250k MLB games).
- **Missing:** Multi-attest exists, but ordering guarantees across batch boundaries are unclear. Bulk-import of an ordered series (sequential game records) wants deterministic ordering.
- **Class:** `solvable in SDK without schema change`.
- **Resolution:** SDK pattern for chunked-and-ordered bulk import; document gas budgets.

### G28 — DATA fork lineage as native concept

- **Use cases:** Recipes (5), RPG (9), Podcast edits (12).
- **Missing:** No "this DATA is a derivative of that DATA" as a schema concept. Today via PROPERTY `previousVersion`.
- **Class:** `solvable in SDK without schema change`.
- **Resolution:** Convention; subsumed by G10.

### G29 — Geospatial query primitive

- **Use cases:** Birding (4), Coffee (13: origin map), Botanical (1: locality), Museum (11: object origin).
- **Missing:** Geo-PROPERTY conventions exist but no canonical schema-level geospatial type.
- **Class:** `nice-to-have` (off-chain SDK indexing problem).
- **Resolution:** Geo-PROPERTY convention (`lat`, `lon`, `geohash`); SDK provides bounding-box queries via derived index.

### G30 — Headless / daemon attester credential management

- **Use cases:** Telemetry (15: home gateway), Birding (4: background sync).
- **Missing:** Not a schema gap. Listed for completeness — surfaced in prior brainstorm under Client/OS needs.
- **Class:** out of scope for schema audit.
- **Resolution:** Client/OS architecture thread.

## Cross-cutting observations

- **Most "schema gaps" are SDK gaps.** ~17 of 30 are flagged `solvable in SDK without schema change`. The schema set is tighter than the prior brainstorm's framing implied — the real risk is shipping schemas without the SDK conventions documented to use them properly.
- **The genuine schema-shape gap is event/state-transition edges (G01).** Provenance, handoff, ownership transfer, synonymy-with-payload all reduce to "TAG carries no payload and no direction." Worth a serious design pass before mainnet shape freeze. Not blocking Sepolia/OnionDAO.
- **PROPERTY is the second-most-strained schema after TAG.** Typed values, multi-value, multilingual, structured nested values. Most fixable with convention layers; SDK should bake them in.
- **`MAX_*` constants need workload data, not hypotheses.** G04 (mirror scans), G18 (max editions) are the two most likely to bite. Tier 2 ask: revisit these once devnet has real traffic.
- **Permanence is the load-bearing constraint that creates the most use-case-specific friction** — but the use cases that strain against it (medical, oral history, redaction) are also the ones that probably belong on a different deployment than public mainnet. Sub-mode / consortium-chain conversation, not a schema fix.
- **Lists is the leverage point.** Eight of 15 use cases lean heavily on it. Per-entry metadata, ordered vs. set, composition semantics — all worth nailing before Lists shape freezes.
- **The "right-to-be-forgotten" cluster (G03, G20, G24) shares one root cause** and likely one resolution path: an encrypted-commitment-only sub-mode. Treat as one design conversation, not three gaps.
- **Reverse-traversal indexes recur** (G10, G21, G28). The off-chain TS SDK should commit to a documented inverted-index pattern that all of these share.

## Curator notes

**Most urgent (Sepolia/OnionDAO window):**
- **G04 (MIRROR scan cap)** — could embarrass at launch if a popular DATA accrues > 10 mirrors. Cheap to revisit. **Look at this in the next few days.**
- **G15 (Lists per-entry metadata)** — Lists is in flight; nail per-entry PROPERTY semantics before merge. Cheap to specify now, expensive to retrofit.
- **G14 (reference PROPERTY-value ISortFunc)** — sortable lists are demoable. Ship the comparator + SDK helper. Not a schema change; just missing kit.

**Safe to defer to mainnet shape freeze:**
- **G01 (event/transition schema)** — design now, decide before mainnet. Convention works for v1; schema-level dedicated edge is the right ask before freeze.
- **G02 (PROPERTY typed values)** — SDK convention sufficient for v1.
- **G05-G29** mostly are convention/SDK work that can ship incrementally post-Sepolia.

**Defer beyond mainnet:**
- **G03 / G20 / G24 (encrypted/forgotten mode)** — separate design conversation about sub-modes and deployment topology. Don't try to fit into kernel schema.
- **G07 (high-frequency time-series)** — L2 strategy conversation, not schema.
- **G19 (hardware attestation)** — external primitive.

**Surprising findings:**
- TAG is far less overloaded than the prior brainstorm framed. The real gap is narrow (event-edges with payload) and the use cases that hit it are valuable but not numerous (museum, supply chain, botanical synonymy).
- PROPERTY's strain is more pervasive than TAG's — affects 11+ use cases via typed-value, multi-value, multilingual concerns — but is almost entirely SDK-convention-fixable.
- The Lists schema, still in flight, is the single most leverage-bearing decision in the current schema set. It touches 8 of 15 use cases and small choices about per-entry metadata, ordering, and composition will reverberate.
- Three "post-mainnet" gaps (G03, G20, G24) actually reduce to one architectural question: does EFS get an encrypted/permissioned sub-mode, and if so when? Worth surfacing as its own Tier-1 conversation rather than three separate items.
- The two cardinality stress tests (birding + telemetry, both 10⁸/day) force the L2 question that's currently absent from the ADR roster. Not a schema gap, but a strategic gap the schema audit shouldn't pretend to solve.

End of audit. Recommend handing G01 (event/transition edges) and G15 (Lists per-entry semantics) to design threads before Lists merges, and G04 (mirror scan cap) to a Tier-2 follow-up on ADR-0020.
