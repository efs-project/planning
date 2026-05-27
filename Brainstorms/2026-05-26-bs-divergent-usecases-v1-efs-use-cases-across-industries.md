---
agent: bs-divergent-usecases-v1
date: 2026-05-26
status: raw
anchors:
  - area: meta
  - area: sdk
  - area: client
  - milestone: oniondao
---

# 15 EFS use cases across diverse industries

Brief from PM: generate 15 EFS use cases across industries, deliberately wide of the obvious "decentralized social" gravity well. For each: schemas stressed, SDK needs, Client/OS needs, cardinality, and adversarial concern. The point is to surface where the current schema set (Anchor, DATA, PROPERTY, MIRROR, PIN, TAG, Lists) creaks, and where the planned three SDKs (on-chain, off-chain TS, OS) need concrete capability commitments before lock-in.

---

## 01. Botanical type-specimen registry

**Description.** A federation of herbaria publishes the canonical "type specimen" attestations for each plant species — the dried-pressed reference that defines a taxon. Curators (Kew, Missouri Botanical, Naturalis) write Anchors per taxon and DATA per scan; field botanists subscribe to authoritative lenses.

**Schemas stressed.** Anchor (deeply nested taxonomy: Kingdom/Family/Genus/Species/Subspecies, ~20 levels), PROPERTY (collection date, locality, collector, GBIF ID, DOI), MIRROR (high-res TIFFs in Arweave). PIN for taxonomic-authority binding (one accepted name per attester). TAG underused — synonymy graphs want a *typed* edge ("is-synonym-of", "is-basionym-of") that current TAG doesn't carry. **Gap: typed/directed edges beyond `applies:bool`.**

**SDK needs.** Hierarchical path traversal with depth >20 (ADR-0021 caps at 32 — fine, but the SDK must handle deep walks efficiently). Bulk-import from Darwin Core Archives (10k–100k records per institution). PROPERTY value indexing for full-text search on locality strings.

**Client / OS needs.** High-res image viewer with deep-zoom (gigapixel scans). Side-by-side comparison view for type vs. candidate specimen. Map widget that reads geo-PROPERTYs.

**Cardinality.** Medium-large — ~400k plant species globally, ~10–50 specimens each. Steady write rate, very heavy read rate.

**Adversarial concern.** Taxonomic vandalism — a rogue lens reassigns the type for *Quercus alba*. Mitigated by lens selection, but the social/scientific norm of "one true type" rubs against EFS's deliberate plurality. Need clear UX for "consensus type across N major herbaria."

## 02. Pre-trial discovery exhibit chain-of-custody

**Description.** A legal-tech vendor publishes evidence exhibits (depositions, emails, photos) for civil litigation. Each exhibit gets a permanent DATA + content hash; the case docket is an Anchor tree per matter; attorneys add PROPERTY annotations (Bates numbers, privilege flags) under their own lens.

**Schemas stressed.** DATA (content-addressed evidence = chain-of-custody primitive). PROPERTY (heavy: Bates number, privilege, custodian, MD5, original filename). MIRROR — mostly HTTPS to vendor S3 + Arweave backup. PIN for binding the "official" Bates label per case. **Gap: redaction.** Once a DATA is on-chain you cannot un-publish a Social Security Number that leaked into an exhibit. Some out-of-band redaction overlay is needed (sealed PROPERTY pointing at a redacted mirror?).

**SDK needs.** Atomic batch upload of a 50k-document production set with deterministic ordering. Search PROPERTY values by exact match (Bates) and prefix (custodian). Lens composition for "my view = opposing counsel's exhibits + my privilege overlay."

**Client / OS needs.** PDF rendering with overlay highlighting. Trusted timestamping integration (RFC 3161). Strong identity binding — every PROPERTY edit must surface attester + wallet.

**Cardinality.** Medium per matter (10k–500k docs), thousands of concurrent matters.

**Adversarial concern.** Privileged content leaking into a public path due to misconfiguration; once attested, it's permanent. Court-ordered "removal" is impossible at the DATA layer — only revocation of TAG placement, which doesn't unpublish bytes. This needs to be in the legal-vertical onboarding flow as a "don't put PII here" guardrail.

## 03. Mechanical CAD part library for restoration

**Description.** Vintage motorcycle and aircraft restorers publish STEP/IGES files for unobtainium parts (1932 BMW R11 carburetor jets, P-51 Mustang exhaust collectors). Hobbyists, machine shops, and museums attest scans of original parts; consumers fetch the canonical CAD and pay a shop to mill.

**Schemas stressed.** DATA (large binary CAD, 10–500MB). MIRROR (Arweave + IPFS for redundancy; this is genuinely permanent stuff). PROPERTY (part number, OEM, year range, material spec, tolerance class). TAG for cross-references — same jet is used on 4 different bikes. Lists for "complete R11 parts catalog" curation. **Gap: structured PROPERTY values.** "Tolerance: ±0.005in over 50mm" is currently a string blob; want typed/queryable.

**SDK needs.** Large-blob upload with chunked SSTORE2 or, more realistically, MIRROR-only flow (skip on-chain storage, just attest the hash + Arweave URI). Faceted search on PROPERTY (material × year × manufacturer).

**Client / OS needs.** 3D model viewer (Three.js / model-viewer). Print-to-shop export (G-code generation is downstream, but the OS should hand off cleanly). Measurement annotation overlay.

**Cardinality.** Small-to-medium — maybe 1M parts across all vintage hobbies, with intense curation per niche.

**Adversarial concern.** IP — someone publishes a still-in-production John Deere proprietary part. EFS can't moderate; lens curation is the only answer. Restorers' lenses will filter; lawsuit risk falls on the publishing attester, not the kernel.

## 04. Citizen-science bird observation feed

**Description.** Replacement substrate for eBird — birders submit observations (species, count, location, timestamp, optional audio/photo) as attestations. Researchers subscribe to high-trust observer lenses; the open feed is firehose-grade.

**Schemas stressed.** TAG (the workhorse — every observation is a TAG of `species` definition at a `location/date` anchor with weight = count). PROPERTY (notes, behavior code, breeding code). DATA for media (photos, audio clips). MIRROR for that media. Lists for "my year list," "county checklist 2026." **Stress test for cardinality:** eBird has ~100M observations/year. EFS-on-Ethereum cannot absorb this on L1 — this use case is an L2/L3 forcing function.

**SDK needs.** High-throughput batch attestation (1k observations per tx). Time-range queries on PROPERTY. Geospatial overlay sitting alongside Sort overlays.

**Client / OS needs.** Mobile-first capture (camera, GPS, audio recorder). Background sync queue for offline observation. Bioacoustic ID hint (delegated to ML, but OS needs media pipeline). Map clustering.

**Cardinality.** **Largest in this brief — 10⁸/year.** Forces honest answer on L2 strategy.

**Adversarial concern.** Fabricated rarities ("I saw an Ivory-billed Woodpecker"). Reputation/lens model handles it, but the kernel will accumulate spam observations forever (non-revocable DATA). PROPERTY-level revocation helps but leaves orphan DATAs.

## 05. Recipe ancestry / cookbook fork tree

**Description.** Home cooks fork recipes the way developers fork code. Each recipe is a DATA (the markdown blob); forks attest `previousVersion` PROPERTY pointing at parent DATA. A given dish (e.g. "carbonara") is an Anchor; thousands of forks hang off it via TAG; Lists capture personal cookbooks.

**Schemas stressed.** DATA + `previousVersion` PROPERTY (version DAG). TAG for placement under topical anchors (`/recipes/italian/pasta/carbonara`) and labels (`#vegetarian`, `#weeknight`, `#cast-iron`). Lists for personal cookbooks. **Gap: tree visualization needs efficient reverse-traversal** ("show me all forks of this recipe") — the current append-only forward index covers it, but a derived inverted index belongs in the SDK, not the client.

**SDK needs.** Walk `previousVersion` chains both directions. Lens for "Mom's lineage" (only recipes derived from Mom's originals). Diff helper (recipe-aware, not text-diff).

**Client / OS needs.** Markdown rendering with structured-recipe parsing (Recipe schema.org). Ingredient scaling widget. Fork-tree visualization. Cooking-mode (stay-awake screen, timer integration).

**Cardinality.** Medium — single-digit millions of recipes, hand-curated per cook.

**Adversarial concern.** Plagiarism without attribution — someone forks NYT Cooking content without `previousVersion`. The kernel is permissionless; cooking community norms + lens-based credit tracking is the answer.

## 06. Field recordings / oral history archive

**Description.** Linguists, ethnomusicologists, and indigenous-language preservation projects publish field recordings (audio + transcript + translation). Communities may want sovereign control over their cultural materials, raising tensions with EFS's permanence.

**Schemas stressed.** DATA (audio blobs, often 1–4hr WAVs). MIRROR (Arweave primarily). PROPERTY heavy: speaker, location, language code, recording date, consent terms, restricted-access tier. Anchor for language tree (Glottolog). PIN for canonical translation. **Major gap: access control.** EFS is publish-only-once; some indigenous materials require "elders only" access (CARE principles for Indigenous data governance). EFS-on-public-mainnet may be fundamentally inappropriate for some materials — a Tier-1 design conversation belongs here.

**SDK needs.** Time-aligned transcript indexing (segment-level PROPERTYs). Multi-language PROPERTY (transcript + translation + IPA). Encrypted-MIRROR support (URI points at gated server, decryption out-of-band).

**Client / OS needs.** Synchronized audio + scrolling transcript player. Diacritic-rich text rendering. Offline access (researchers in remote areas).

**Cardinality.** Small — tens of thousands of recordings per major archive, very deep metadata per item.

**Adversarial concern.** Cultural-sovereignty violation: a researcher publishes restricted materials without consent. There is no recall. This use case is the strongest argument for an EFS sub-mode (private/encrypted/permissioned) before encouraging cultural-heritage adoption.

## 07. Open-source firmware mirror network

**Description.** A decentralized backup of every release of every router/IoT firmware (OpenWRT, Tasmota, Marlin). When manufacturers EOL a device, the firmware doesn't disappear. Each firmware build is a DATA; MIRRORs across IPFS, Arweave, BitTorrent; PROPERTYs carry SHA256, signing key, device compat list.

**Schemas stressed.** DATA (small-to-medium binaries, 1–32MB). MIRROR (heavy — magnet: links are a first-class transport here). PROPERTY (device model, version, signing key, signed-by). TAG for device-tree placement. Lists for "verified by EFF" curation. **Stress on MIRROR cardinality** — current ADR-0020 `MAX_PAGES=10` mirror-scan cap may bite when a popular firmware has 50+ active mirrors.

**SDK needs.** Signature verification against PROPERTY-stored public key. Compat-matrix query ("show me all firmware that works on my GL-AR750"). BitTorrent transport handler (magnet: priority in router).

**Client / OS needs.** Hardware compatibility detection (USB ID lookup). Flashing tool integration (out of scope for the OS to flash, but should hand off cleanly). Verification surface — "this binary was attested by 12 lenses you trust."

**Cardinality.** Medium — hundreds of thousands of firmware artifacts across the ecosystem.

**Adversarial concern.** Malicious firmware uploaded under a legitimate-looking attester address. Trust comes entirely from lens curation + PROPERTY signatures from known keys. The lens model needs to handle "trust this attester for these device classes only" — current lens model is coarse.

## 08. Sports stats / box score corpus

**Description.** Per-game, per-player stats for every MLB game since 1871, every NBA game, etc. Replaces the Sports Reference data monopoly. Each box score is a DATA (JSON); Anchor tree by league/season/team/game; PROPERTY for individual stat lines; Lists for "all-star teams," season leaders.

**Schemas stressed.** Anchor (deep + wide: League → Season → Team → Game → Player-game). DATA per game. PROPERTY for every stat (heavy — 30+ stats per player per game). Lists for derived rankings. **Sort overlay is the workhorse** — leaderboards = sort by PROPERTY value. ADR for `SORT_INFO` with PROPERTY-value comparator is implied.

**SDK needs.** Fast aggregation queries (career totals via PROPERTY sum). PROPERTY-value sort overlay support. Time-range filters. Bulk historical backfill (~250k games for MLB alone).

**Client / OS needs.** Tabular data UI (sortable, filterable). Visualization primitives (charts). Live-update mode for in-progress games.

**Cardinality.** Medium-large — single-digit millions of game records, hundreds of millions of PROPERTY rows.

**Adversarial concern.** Stat fudging — someone tweaks a 1956 box score. With non-revocable DATA + revocable TAG, the "official" box score per lens is corrigible by changing placement, but bad DATA persists. Reputable-attester lenses (MLB, Elias) become the de facto authority.

## 09. Tabletop RPG homebrew compendium

**Description.** D&D 5e, Pathfinder, OSR retroclones. Players publish homebrew classes, monsters, spells, magic items as Anchors with DATA payloads (JSON statblocks or markdown). DMs curate Lists for their campaigns. Forks via `previousVersion`.

**Schemas stressed.** TAG (heavy — `#class`, `#monster`, `#cr10`, `#3rd-party-OGL`). PROPERTY (CR, level, school of magic, source book). Lists are *the* product here — "campaign-ready content for my Dark Sun game." DATA for the content blob. **Gap: structured statblock querying.** "Show me CR 1–3 undead with poison resistance" requires PROPERTY-value range queries the SDK must abstract.

**SDK needs.** Faceted search over PROPERTY. List authoring (`Lists` schema feature ready or in-progress). License-aware filtering (OGL/CC-BY/proprietary).

**Client / OS needs.** Statblock renderer. Roll20/Foundry export. Search-as-you-type. Print-to-PDF for table use.

**Cardinality.** Medium — single-digit millions of homebrew items, curated heavily.

**Adversarial concern.** WotC-licensed content republished outside OGL. Lens curators filter, but lens-discovery is the soft spot — a naive user defaults to the firehose lens and sees infringing content.

## 10. Patient-controlled medical records portability

**Description.** Patients consent to their lab results, imaging, and discharge summaries being attested to their wallet from each provider, building a cross-provider longitudinal record they fully own. The patient grants temporary lens access to a new specialist.

**Schemas stressed.** DATA + MIRROR (almost entirely encrypted-at-rest off-chain; on-chain MIRROR points at gated provider endpoint). PROPERTY for FHIR resource type, encounter date, provider, encryption key envelope. TAG for placement under `/me/labs/2026/`. **Massive gap: HIPAA/GDPR-compliant operation requires (a) the on-chain DATA hash to leak nothing, (b) revocability of access (not data), (c) right-to-be-forgotten.** EFS's permanence is hostile to (c). Strongly argues for an encrypted-only mode where on-chain data is a commitment + access policy, not the content itself.

**SDK needs.** FHIR resource integration. Encryption key management (delegated to wallet but SDK needs hooks). Per-resource access logging — who *requested* this lab result, when.

**Client / OS needs.** Trusted UI surface for consent (the OS becomes a healthcare consent broker — high stakes). Provider directory. Secure messaging with care team.

**Cardinality.** Small per patient (~thousands of records), but globally tens of billions if widely adopted.

**Adversarial concern.** **Highest-stakes use case in this brief.** Insurance discrimination from leaked records, ransomware on the wallet, regulatory non-compliance. Probably not appropriate for public-mainnet EFS without a private overlay; might be the killer app for an L3 / consortium chain instance.

## 11. Museum object catalog with provenance trail

**Description.** Each museum object (a Greek vase, a Picasso, a meteorite) is an Anchor; every owner/exhibition/conservator action over its lifetime is an attestation. Provenance disputes (Nazi-looted art, antiquities repatriation) are surfaced by inspecting attester lineage.

**Schemas stressed.** Anchor per object. DATA for images, condition reports, scientific analyses. PROPERTY heavy (accession number, dimensions, materials, date acquired, source). **TAG carries the provenance graph** — each ownership transfer is a TAG from previous-owner attester to a new "owned-by" anchor. **Gap: TAGs are flat; provenance wants directional/typed edges with timestamps.** Today the timestamp is implicit in EAS time; the SDK should surface time-ordered TAG traversal as a primitive.

**SDK needs.** Time-ordered TAG iteration. Provenance-chain reconstruction (walk owners backward). Multi-language PROPERTY for title/description (English / source-country language).

**Client / OS needs.** IIIF image viewer integration. Provenance timeline visualization. "Disputed" flag UX — surface when major lenses disagree about ownership history.

**Cardinality.** Small-medium — single-digit millions of objects across major collections, very deep per-object metadata.

**Adversarial concern.** A holding museum's attestation of "legitimate acquisition" vs. a source-country lens's "looted in 1923." EFS is the *right* substrate for this — credibly neutral, no one can erase the dispute — but the UX must make competing claims legible rather than hiding them.

## 12. Indie podcast permanent archive

**Description.** Podcast hosts publish episodes as DATAs with MP3/Opus MIRRORs (Arweave + IPFS); RSS becomes a derived view over a show's Anchor. Shows can change hosting providers without listeners losing back-catalog access. Episodes can't be silently re-edited post-hoc (which podcasts increasingly do).

**Schemas stressed.** DATA (large audio blobs, 30–500MB). MIRROR (Arweave primary, HTTPS to host as cheap mirror). PROPERTY (episode number, season, transcript, duration, chapter markers, GUID). Anchor per show. Lists for personal subscriptions. **Sort overlay** for chronological feeds. **Gap: cardinality > 10 MIRRORs per DATA is common (multiple bitrate variants); ADR-0020 mirror-scan cap is a soft worry.**

**SDK needs.** RSS/Atom feed generation from an EFS show Anchor (likely a client-side concern but a reference implementation lives in the SDK). Transcript-PROPERTY full-text indexing. Chapter-marker PROPERTY iteration.

**Client / OS needs.** Audio player (background playback, lock-screen controls, speed adjust, sleep timer). Episode artwork rendering. Subscription management (Lists). Offline download.

**Cardinality.** Medium — millions of episodes globally; growth rate is steady.

**Adversarial concern.** Post-edit ("the silent revision"): host quietly re-uploads an episode to scrub a controversial statement. EFS prevents this at the DATA layer — the original DATA stays addressable. New "edited" episode is a new DATA; client can show "this episode has been edited; original available." Strong feature, weak default UX unless the Client surfaces it.

## 13. Supply-chain provenance for specialty coffee

**Description.** Single-origin coffee from farm → mill → exporter → roaster → café, each handoff an attestation. Consumers scan the bag QR, see the chain. Differentiates specialty product from commodity, supports fair-trade verification.

**Schemas stressed.** Anchor per lot. PROPERTY heavy (cup score, processing method, varietal, harvest date, weight kg). TAG for handoff events (each step in the chain). DATA for documents (cup tasting notes, certificates). PIN for "current custodian." **Gap: handoff is a state transition, and TAG's `applies:bool` flag is awkward** — want a typed transition primitive (`event` schema?). Lists for "single-estate Geisha lots, 2025 harvest."

**SDK needs.** Chain-of-custody walk (find all handoff events for a lot, in order). QR-code → Anchor resolver. Lot-aggregation (multiple farmer lots blended into one roaster lot).

**Client / OS needs.** QR scan. Geographic visualization of origin. Trust-graph UI ("3 of 4 handoffs are by trusted attesters").

**Cardinality.** Medium — hundreds of thousands of lots/year globally.

**Adversarial concern.** Fraudulent attestations ("this commodity Robusta is actually Panama Geisha"). Reputation + ground-truth attestations from neutral cuppers handle it, but the kernel cannot validate physical reality. Whitelabeled-attester accountability is the real safeguard.

## 14. Fanfiction / serial fiction archive

**Description.** A successor to AO3 — fanfic, original web serials, slash, chaptered novels. Authors publish chapters as DATA; series as Anchors; tagging is the entire UX (every AO3 fic has 20–100 tags). Heavy reader-curated Lists ("my bookmarks," "rec lists").

**Schemas stressed.** **TAG is *the* primitive here** — fandoms, characters, relationships, warnings, tropes, kinks. Single fic typically carries 30–100 TAGs. Weighted TAGs distinguish "major character A" (high weight) from "background mention B" (low weight). DATA per chapter; PROPERTY for chapter number, word count, author notes, warnings. Lists are critical. **Stress test for TAG cardinality** — AO3 has ~14M works, each with 50 tags ≈ 700M TAG attestations. Forces honest L2 conversation.

**SDK needs.** Tag autocomplete with disambiguation (tag wrangling — "Sherlock Holmes" vs "Sherlock Holmes (TV)"). Boolean tag filtering (`A AND B AND NOT C`). Reader Lists ("comfort reads"). Read-progress tracking (PROPERTY on List entries).

**Client / OS needs.** Long-form text reader (font choice, line height, dark mode, paginated mode). Chapter navigation. Bookmark with personal note. Comment thread overlay.

**Cardinality.** Large — tens of millions of works, hundreds of millions of TAGs.

**Adversarial concern.** Underage content / RPF / harassment campaigns. AO3 has elaborate community moderation; EFS has only lens curation. Moderation lenses ("Archive of My Own, Lite — works flagged appropriately") become the actual product. The kernel hosts everything; the UX hides what your lenses say to hide.

## 15. Energy-grid telemetry for distributed generation

**Description.** Rooftop solar + home battery + microgrid owners attest their generation/consumption telemetry every 5–15 minutes. Aggregators subscribe to neighborhood lenses; utilities verify net-metering claims; researchers study grid behavior. Pre-emptively documents what the household actually produced when billing disputes arise.

**Schemas stressed.** DATA (telemetry payloads, often tiny — 200 bytes JSON). PROPERTY for inverter model, panel count, kWh values. Anchor per installation. **High-frequency-write stress test** — 96 attestations/day/installation × 1M installations = 100M/day. Forces a rollup/L2 answer harder than even citizen-science. Lists for "all installations in PG&E service area."

**SDK needs.** High-frequency batch writes (~96 readings per daily transaction). Time-series query primitives (last N hours, daily aggregate). PROPERTY-value range filtering. Likely needs a dedicated time-series sub-SDK or convention.

**Client / OS needs.** Real-time dashboard. Background service for sensor capture. Anomaly alerts. Probably runs headless on a home gateway, not interactive — **this use case stress-tests the OS's "non-interactive daemon" surface,** which the brief's focus on sandboxed UI apps may underweight.

**Cardinality.** **Tied with citizen-science for highest volume.** 10⁸/day.

**Adversarial concern.** Falsified generation data to overclaim net-metering credit. Telemetry signed by the inverter directly (hardware attestation) helps but isn't on EFS today. Utility-as-counter-attester is the practical answer; the kernel just hosts both claims and lets disputes be visible.

---

## Observations

- **TAG is asked to do too much.** Across these 15 cases, TAG is used as: file placement, label, weighted vote, provenance edge, supply-chain handoff, ownership transfer, synonymy edge, fanfic descriptor. The `(definition, applies:bool, weight)` shape covers 60% of these gracefully but creaks on directional/typed edges (provenance, synonymy, handoff events). **A typed-edge schema, or a convention layer on TAG that the SDK normalizes, deserves a serious look** before Lists ships and fixes the schema set in concrete.

- **Permanence is the strongest feature and the worst feature, depending on industry.** Botanical specimens, museum provenance, podcast archives, legal evidence: permanence is the *product*. Medical records, oral histories with consent constraints, anything with PII: permanence is a regulatory and ethical hazard. A clear EFS mode-distinction (public-permanent vs. encrypted-commitment-only vs. consortium-chain) is overdue as a conceptual model — even if implementation lags.

- **PROPERTY value indexing / search is a near-universal SDK need.** Faceted search, range queries, full-text — appears in at least 11 of 15 cases (botanical, legal, CAD, sports, RPG, podcast, supply chain, fanfic, telemetry, museum, citizen science). The off-chain TS SDK should bake this in via a documented derived-index pattern; otherwise every consumer reinvents it.

- **Lens model needs more granularity.** "Trust this attester for these device classes / these case types / these fandoms only" came up multiple times (firmware, legal, RPG, fanfic). Today's lens model is binary per attester; partition-by-domain belongs on the roadmap.

- **Two cardinality regimes dominate the hard cases.** (a) High-frequency telemetry/observation (citizen science, energy grid) at 10⁸/day — forces an L2/rollup conversation. (b) Curated long-tail (medical, museum, oral history, legal) at low volume but extreme metadata depth — forces serious thought about PROPERTY ergonomics. Mid-scale (recipes, podcasts, RPG) is the comfortable middle.

- **The MIRROR transport priority + scan cap (ADR-0020, ADR-0012) will start biting.** Multiple cases (firmware, podcast, CAD) routinely want 10–50 mirrors per DATA. `MAX_PAGES=10` should be revisited with real data, not hypothesized.

- **Lists are essential, not optional.** RPG compendiums, fanfic rec lists, museum exhibitions, personal cookbooks, sports leaderboards, podcast subscriptions, supply-chain lots — Lists is the curation primitive that ties the kernel to user experience. The in-progress Lists schema should be informed by these workloads.

- **The OS Client needs more than UI primitives.** Background sync (citizen science, energy grid), offline-first capture (oral histories, birding), headless daemon mode (telemetry), trusted-consent surfaces (medical) — these aren't "apps in a sandbox," they're system services. The Client/OS architecture should formalize a daemon/service tier alongside the user-facing sandbox.

- **Adversarial concerns cluster into three families:** (a) spam/pollution of the public namespace (citizen science, fanfic, firmware), (b) authority disputes where EFS plurality is the right answer but UX must make it legible (museum provenance, sports stats, supply chain), and (c) regulatory/PII hazards where permanence is the wrong answer (medical, oral history, legal). Cluster (c) is the one most likely to produce a launch embarrassment if not gated by clear messaging.

- **The most interesting / least-obvious use case** of the 15 is probably the **botanical type-specimen registry** — it perfectly fits EFS's permanence-and-plurality story, the schema fit is natural, the scale is tractable, and the existing institutional players (herbaria) already share a "credibly neutral commons" worldview. It might be a viable real-world early-adopter conversation. Energy-grid telemetry is the most architecturally provocative — it's the case that most forcefully says "you need an L2 strategy now, not later."
