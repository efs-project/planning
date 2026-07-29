# Mainstream candidate ranking and validation sequence

**Status:** completed comparative synthesis; recommendations are research judgments, not an owner ruling, adopted roadmap, or design amendment
**Scope:** mainstream data, media, archive, knowledge and maker communities; this is one lane of the wider target-community pass
**Evidence:** [[public-data-science-and-civic-evidence]], [[visual-lifeboats-public-collections-and-open-hardware]], [[fanworks-translation-wikis]], and [[research-method]]

#status/done #kind/research #repo/planning #topic/use-cases #topic/content #topic/market-research #topic/requirements

## Opinionated answer

For mainstream discovery, pursue these three conversations:

1. **Flickr Foundation Data Lifeboat / consent-based visual collection makers** — as the first gallery proof corpus, not presumed community adoption.
2. **OSHWA-certified open-hardware creators** — as a recurring release/build-evidence community prospect.
3. **Data Rescue Project stewards and public-data librarians** — as a two-operator mainstream coordination prospect.

The canonical cross-corpus ranking and steward-calibrated score are in [[opportunity-map]]. This lane keeps the Visual Lifeboat first as an engineering and interview fixture because EFS needs to falsify an easy, useful, densely tagged gallery; it does not call that artifact the first real community.

These are all **complementary wedges**:

- EFS does not replace Data Lifeboat's consent service, ZIP, browser viewer or future Safe Harbor network.
- EFS does not replace OSHWA certification, Git collaboration or maker-platform social features.
- EFS does not replace DataLumos, Harvard, Source Cooperative, Internet Archive or domain repositories.

It gives each community a shared integrity layer: exact release identities, byte commitments, source and curator provenance, independently operated mirror receipts, version/supersession history, portable reconstruction, and multiple views over one object graph.

## Mainstream-lane prioritization

This table separates a fixture from actual community prospects and avoids a second set of numeric totals.

| Candidate | Role in this pass | Readiness and gate |
|---|---|---|
| Consent-based Visual Lifeboat | first gallery/counterfactual proof corpus | named operational precedent; **no EFS steward committed**; public-personal-metadata and consent review |
| Open Hardware Release Vault | recurring community validation | named nonprofit coordination surface; **uncontacted**; creator-approved complete releases and hazardous-design exclusions |
| Public Data Receipt | recurring two-operator community validation | active coalition and repositories; **uncontacted**; reviewed non-personal static subset and accepted recurring receipt work |
| Research Release Capsule | complement prospect | creator opt-in; no human-subject or restricted data |
| Public cultural-collection lifeboat | partner-led proof/community prospect | explicit CC0/public-domain or permission plus cultural-care review |
| Static public-domain atlas releases | data fixture/complement | exclude precise sensitive locations |
| Open Food Facts integrity snapshots | gallery/provenance fixture | incumbent already open; share-alike and underlying packaging rights |
| Creator-owned podcast capsules | later complement | creator opt-in plus music/guest clearance and large-byte economics |
| Public DocumentCloud release receipts | specialist partnership | partner-reviewed public/redacted documents only |
| MusicBrainz snapshot/mirror layer | precedent, not target | incumbent already solves the central openness/identifier problem |
| iNaturalist observation archive | constrained later research | opt-in/coarsened only; sensitive-location risk |
| Raw web-scraped ML corpus | no-go bytes | safety, privacy and rights repair require removal |
| Broad genealogy/public-record graph | no-go first | living-person, contract and relationship-graph risk |

### Why high-profile incumbents do not automatically rank first

- **Scale is not a seed steward.** Millions of public objects do not give EFS the right or cultural legitimacy to copy them.
- **Open is not homeless.** Wikimedia Commons, MusicBrainz, GBIF, Open Food Facts, Zenodo and OSM already have exports, identifiers, communities and mission-aligned operators.
- **Loss pain is not permission for permanence.** People delete photos, revoke licenses, obscure nature locations, redact documents and separate pseudonyms for good reasons.
- **A browse surface is not a community.** EFS must identify who can lawfully create the first useful corpus and who will maintain its context.
- **A lens is not deletion or legal process.** It can recommend, warn or refuse to serve; it cannot erase a published byte.

## 1. Proof first: Visual Lifeboat

### Why this is first

Flickr Foundation has already done the rare work of converting an archival instinct into a real product:

- one member selects a bounded collection;
- the package preserves high-resolution media, previews, technical metadata and social context;
- a curator leaves a note to future readers;
- other members' photos require consent;
- the output is self-contained and browser-readable; and
- the Foundation is exploring trusted distributed docks. [RK-01] [RK-02]

This directly exercises EFS's desired gallery, tags, curators, portable packages and mirror network without requiring EFS to invent a community or scrape a corpus.

### Minimum EFS addition

Publish a **signed wrapper around an existing Data Lifeboat**, not a new incompatible archive format:

1. exact package-generation identity;
2. commitments for manifest, originals and previews;
3. source, curator, consent and review assertions;
4. mirror/dock receipts with freshness;
5. correction/successor/advisory edges;
6. three independently chosen curator views; and
7. reconstruction from an exported bundle and public records.

### First corpus owner

Named outreach targets are Flickr Foundation, one Flickr Commons institution, or a cohort of Flickr members using the consent flow. No relationship is presumed.

A functional pilot can start with 1,000 consented/open images and reach 10,000 meaningful EFS objects through source files, previews, metadata snapshots, consent/context records, tags, views and mirror receipts.

### Network loop

Each additional participant can add value without taking ownership:

- a creator contributes another consented collection;
- an archive operates a dock;
- a curator creates a view or essay;
- a labeler adds a sourced description or correction;
- a translator adds a caption;
- a rights steward updates a status; and
- a verifier confirms one mirror still holds the exact generation.

### Fatal risk

The package can contain account names, comments, precise EXIF, family history and depicted people. Public EFS publication is not appropriate merely because Flickr could display the material. Consent must cover the intended permanent archive shape, and unnecessary personal metadata must be removed before signing. [RK-03]

### First interview questions

1. Would a signed package identity and independently renewable dock receipts solve a real Safe Harbor problem?
2. Which consent or creator-contract evidence can be public, and which must remain with the responsible steward?
3. How should correction, member withdrawal, license change and privacy decay be represented when an old package cannot be erased?
4. Does item-level commitment add value, or is package-level fixity sufficient for the Foundation's workflow?
5. What archive sizes, creation times and egress bills are typical now?
6. Would multiple curator views help future legibility, or create confusing parallel context?

### Falsification test

Stop if the Foundation or pilot creators say that an irreversible public graph makes the product materially less safe, or that current ZIP + Internet Archive/IPFS + planned docks already solve the integrity and handoff need with less complexity.

## 2. Community validation: Open Hardware Release Vault

### Why this is second

OSHWA has a named nonprofit steward, stable identifiers, open-license expectations, an API and 3,372 certified projects. It has also revoked certification when project documentation disappeared. [RK-04] [RK-05] The neighboring 3D-design ecosystem remains subject to platform ownership changes; Thingiverse says it was acquired by MyMiniFactory in February 2026. [RK-06]

The community's network effect is unusually EFS-native:

- exact parent and remix releases;
- independent build/test/calibration receipts;
- compatible part substitutions;
- certification and review evidence;
- security or safety advisories; and
- independently funded mirrors.

### Minimum EFS addition

One creator-approved release binds:

- OSHWA UID and certification snapshot;
- editable CAD/schematic source;
- manufacturing exports;
- firmware;
- bill of materials;
- instructions and toolchain;
- separate hardware/software/documentation licenses;
- preview images/3D models;
- parent/citation relationships; and
- mirror and build receipts.

### First corpus owner

Named outreach targets are OSHWA, an open-science-hardware network, or a makerspace cohort with the creators' participation. No partnership is presumed.

The first 10,000 objects can come from 250–500 complete releases. Do not scrape every OSHWA-linked repository; publish at a creator-approved release boundary.

### Network loop

A release becomes more useful when:

- another operator mirrors it;
- a builder reproduces it;
- a lab posts calibration results;
- a maintainer records a compatible replacement part;
- a remix cites the exact parent;
- a reviewer reports a hazard; or
- a newer release supersedes it without breaking the old citation.

### Fatal risk

“Open source hardware” is not the same as “there is an STL online.” A valid pilot needs editable sources and separate license context. Copyright licenses also do not settle patents, trademarks, regulated radio/medical use, weapons law or physical safety. EFS must not render a copied certification logo as current OSHWA approval.

### First interview questions

1. How often do certified-project links or release files disappear, and which file classes are usually missing?
2. Would OSHWA want a durable release snapshot, or would that interfere with certification updates/revocations?
3. Can OSHWA sign or otherwise expose attributable certification-state snapshots?
4. Which 5–10 CAD/electronics formats cover the first useful cohort?
5. Do build, calibration and substitute-part receipts solve a real contributor workflow?
6. Which hazardous categories should a first public viewer exclude?

### Falsification test

Stop if creators mainly need active Git collaboration, issues and releases—not durable packages—or if preserving editable sources and toolchains is too format-specific for a small-team pilot.

## 3. Community validation: Public Data Receipt

### Why this is third

The urgency is strongest here. The active Data Rescue Project maps many disconnected preservation efforts. It reports that Harvard's current release spans 16 TB and more than 311,000 Data.gov-linked datasets, while warning that shallow crawling misses database-backed and landing-page-only material. [RK-07] Harvard independently documented pervasive link rot and changing catalog counts. [RK-08]

EFS can add value without becoming the repository:

- exact version receipts;
- source vs rescuer roles;
- one graph of Source Cooperative, DataLumos, Dataverse, Internet Archive, BitTorrent and other mirrors;
- current verification state;
- correction/supersession edges; and
- portable citations.

### Minimum EFS addition

For one reviewed dataset generation:

- original source and catalog metadata;
- capture time and tool version;
- exact file/schema/documentation closure;
- license and sensitivity review assertions;
- rescuer signature;
- publisher signature only when actually available;
- mirror receipts and expiry;
- comparison with prior/next generations; and
- bundle reconstruction.

### First corpus owner

Named outreach targets are the Data Rescue Project, Harvard Library Innovation Lab, ICPSR/DataLumos, EDGI, or one domain librarian already curating a bounded rescue collection. No relationship is presumed.

Start with 100 reviewed, static, explicitly public, non-personal environmental/geospatial releases. Scale to 1,000 dataset generations and 10,000 file, schema, capture, mirror and topic objects only after the review gate works.

### Network loop

- one librarian adds a reviewed release;
- another repository mirrors it;
- a verifier checks the bytes;
- a domain expert records a correction or methodological warning;
- a journalist cites one exact generation;
- an agency publishes a later official version; and
- a curator builds a topic view across agencies.

### Fatal risk

Government/public data can contain personal records, small-cell re-identification, exact vulnerable-species locations, critical infrastructure or serious errors. An EFS capture signed by a rescuer is not an official agency statement. A later correction must be prominent even though the earlier bytes remain. [RK-07] [EFS-LAW]

### First interview questions

1. Where do current rescue teams lose time reconciling duplicate captures, versions and mirror locations?
2. What evidence is required before a capture is considered authentic enough to cite?
3. Would expiring mirror receipts be maintained, or become another stale registry?
4. Can one domain steward identify 100 unquestionably public, non-personal static releases?
5. Which DCAT/DataCite fields must survive losslessly?
6. Is a portable EFS receipt more useful than a signed manifest in the existing repository?

### Falsification test

Stop if existing Source Cooperative/DataLumos/Dataverse metadata already provides stable cross-repository identity and current mirror verification, or if no steward will own sensitivity review and correction handling.

## The next two, if the first three fail

### Research Release Capsule

Recruit creators of small, permissively licensed, non-human datasets. Bind DOI, files, code, environment, mirrors and independent verification. Do not replace Zenodo, Dryad, Dataverse, OSF or Figshare. The best early corpus is synthetic or physical-science data; regulated or consent-based research stays out. [RK-09]

### Public cultural-collection lifeboat

Partner with one institution that controls an explicit CC0/public-domain subset. Preserve item-level rights statements, source/derivative roles, catalog corrections, collection essays and several views. The gallery fit is excellent, but “no known copyright restrictions” and public-domain status do not resolve depicted-person privacy or cultural authority. [RK-10]

## Attractive communities not to court first

| Community | What to learn | Why EFS should not recruit it first |
|---|---|---|
| Raw LAION-like scraped-media corpora | Dataset cards, version/advisory diffs, safety review | CSAM/privacy repair history makes immutable raw-web-scrape publication an unacceptable launch risk. [RK-11] |
| Live OpenStreetMap replacement | Diffs, provenance, map browsing, attribution | EFS lacks live edit conflict resolution, spatial indexes, tiles, routing and geocoding; precise features can be sensitive. |
| Ordinary iNaturalist backup | Visual evidence, taxonomy, community identification | iNaturalist licenses can change and exact time/location can expose people or threatened species. |
| Broad genealogy | Source-backed person/place/event graphs | Living-person, adoption, DNA, ethnicity/religion/health, custodian-contract and privacy risks are incompatible with public permanence. |
| Private leaks or Aleph investigations | Provenance, OCR, entity graphs, timelines | Source protection, access control and data protection are core features; only separately released public subsets are candidates. |
| MusicBrainz migration | Stable IDs, open dumps, peer review, tag network | The nonprofit incumbent was created to solve the exact privatization problem and already exports its data. |
| All of Wikimedia Commons | Structured media metadata, rights review and multilingual gallery UX | Commons already has durable nonprofit governance, open dumps and a sophisticated rights/moderation community. |
| Scraped Flickr/Thingiverse/Kaggle content | Gallery, remixes, dataset browsing | Public reachability and API access do not create a bulk permanent-republication right or an adoption community. |

## Shared 90-day discovery plan

This is research sequencing, not a dated EFS milestone.

### Phase 1 — three steward conversations

Have one structured interview in each finalist lane. Bring a one-page diagram of the complementary EFS role and ask the falsification questions before presenting a product pitch.

Output:

- one real corpus steward or a clear rejection;
- exact inclusion/exclusion rules;
- permission/consent evidence model;
- package/object sizes and counts;
- current workflow and pain; and
- one measurable “EFS adds value if…” statement.

### Phase 2 — local, rights-cleared fixtures

Build no public network until local fixtures pass:

- **Visual:** 1,000 consented/open images, originals and previews, 20 taggers/curators, three views, 2–5 tag intersections, negative filters and duplicate lookup.
- **Hardware:** 100 complete releases across a bounded format list, one build receipt and one successor each.
- **Data:** 100 reviewed datasets from three sources, at least two versions for ten datasets, mirror failure and partial availability.

Output:

- import time and resumability;
- exact record and byte counts;
- index and query latency;
- per-item/per-package projected cost;
- public graph preview;
- export/reconstruction evidence; and
- list of product gaps that cannot be faked by a mock.

### Phase 3 — one independent operator

Give the bundle and public records to a second operator. The pilot passes only if that operator can reconstruct and serve the exact bounded collection without an EFS-operated index, gateway or private database.

### Phase 4 — public pilot decision

Proceed only if:

- a steward owns rights/consent and sensitive-data review;
- the corpus has a written exclusion policy;
- the gallery or browser is useful walletlessly;
- exact generations and derivatives are unambiguous;
- mirror receipts are maintainable;
- correction/advisory UX is honest;
- serving-layer notices and abuse operations have an owner; and
- measured economics fit a small-team pilot.

## Source index

- **[RK-01]** Flickr Foundation, [Data Lifeboat](https://www.flickr.org/programs/content-mobility/data-lifeboat/) — current consent-aware archive product and self-contained package.
- **[RK-02]** Flickr Foundation, [Designing a Data Lifeboat](https://www.flickr.org/programs/content-mobility/data-lifeboat-development-notes/) — “sliver” model, Safe Harbor docks, funding and preservation principles.
- **[RK-03]** Flickr Foundation, [Data Lifeboat Terms](https://datalifeboat.flickr.org/terms) — technical/social metadata, member consent and creator contract.
- **[RK-04]** Open Source Hardware Association, [home](https://oshwa.org/) — current 3,372-project count.
- **[RK-05]** OSHWA, [About Certification](https://certification.oshwa.org/about.html) — stable UIDs and certification revocation after documentation became unavailable.
- **[RK-06]** Thingiverse, [About](https://www.thingiverse.com/about) — current community framing and February 2026 acquisition.
- **[RK-07]** Data Rescue Project, [Current Efforts](https://www.datarescueproject.org/current-efforts/) — current network, Harvard 16 TB / 311,000+ scale and shallow-crawl limitation.
- **[RK-08]** Harvard Library Innovation Lab, [Preserving Public U.S. Federal Data](https://lil.law.harvard.edu/blog/2025/01/30/preserving-public-u-s-federal-data/) — authentication goal, link rot and short-interval catalog change.
- **[RK-09]** Zenodo, [Policies](https://about.zenodo.org/policies/), Dryad, [About](https://datadryad.org/about), Dataverse, [About](https://dataverse.org/about), and OSF, [Projects](https://help.osf.io/article/353-welcome-to-projects) — existing repository capabilities and institutions.
- **[RK-10]** Smithsonian, [Open Access FAQ](https://www.si.edu/openaccess/faq) and Flickr Foundation, [No known copyright restrictions](https://www.flickr.org/programs/flickr-commons/no-known-copyright-restrictions-how-it-works/) — reusable subsets and rights/cultural-sensitivity limits.
- **[RK-11]** LAION, [Re-LAION-5B](https://laion.ai/blog/relaion-5b/) — filtered re-release after CSAM/privacy safety review.
- **[EFS-LAW]** EFS planning, [[law-positioning]] — public permanence, visible graph and “not a home for other people's personal data” boundary.
