# Public data, science, and civic-evidence communities

**Status:** completed point-in-time community research; evidence current through 2026-07-29; recommendations are EFS analysis, not an owner ruling or design amendment
**Scope:** public-data rescue, research repositories, ML datasets, maps and biodiversity, product facts, and public-record/document archives
**Read with:** [[research-method]], [[requirements-and-first-apps]], [[use-cases]], [[apps-cookbook]], and [[law-positioning]]

#status/done #kind/research #repo/planning #topic/use-cases #topic/content #topic/market-research #topic/datasets #topic/civic-data

## Executive finding

The strongest mainstream data opportunity is not “put Data.gov on a blockchain.” It is a **public-data receipt and mirror graph** for the librarians, researchers, journalists, and volunteers who are already rescuing exact versions into several repositories.

That distinction matters:

- The active Data Rescue Project lists a **16 TB Harvard archive with more than 311,000 datasets**, but explicitly calls it a shallow crawl that cannot capture datasets hidden behind landing pages or databases. [PD-01]
- Harvard's Library Innovation Lab already downloads and authenticates public data. It found pervasive link rot and hundreds of thousands of Data.gov records changing over short intervals. [PD-02]
- ICPSR/DataLumos, Dataverse, Dryad, OSF, Source Cooperative, Internet Archive, Webrecorder, SciOp/BitTorrent, institutional repositories, and domain experts already do important curation, storage, access, and preservation work. [PD-01]

EFS should complement those institutions with exact version identity, publisher/rescuer provenance, commitments, independently contributed mirror receipts, supersession and diff edges, and portable reconstruction. It should not claim that a transaction makes captured data official, accurate, lawful, methodologically sound, or safe to publish.

The other serious data communities split into three groups:

1. **Good partner-shaped opportunities:** rights-cleared research releases, static public-domain geospatial releases, and creator-owned open datasets.
2. **Useful product-pressure fixtures, but weak initial customers:** Open Food Facts, MusicBrainz, Hugging Face, GBIF, and mature repositories already offer open exports and rich community workflows; EFS must add something narrower than “another copy.”
3. **No-go as broad first-party byte corpora:** scraped ML training sets, exact sensitive-species locations, human-subject data, private investigative leaks, and public records containing personal data.

## Candidate map

| Community | Existing operating model | Real pain signal | Credible EFS role | First-user verdict |
|---|---|---|---|---|
| Data Rescue Project, EDGI, DataLumos, Harvard LIL, public-data librarians | Coalitions of libraries, researchers, archivists, nonprofits, volunteer rescue events, institutional repositories, and public mirrors | URLs disappear; catalogs change; dynamic databases evade shallow crawls; the same dataset is rescued into disconnected stores | Exact snapshot receipt, manifest, version/diff graph, mirror inventory, and reproducible citation above existing repositories | **Top mainstream candidate** |
| Zenodo, Dryad, Dataverse, OSF, Figshare, institutional repositories | DOI registration, metadata, curation, versioning, embargo/restriction, preservation copies, grants/fees/institutional support | Research data become unavailable over time; software/environment and multi-repository closure are often incomplete | Opt-in reproducible release capsule that cites the DOI and binds exact files, environment, mirrors, and verification | **Strong complement; do not replace repositories** |
| Hugging Face and Kaggle dataset publishers | Git-like repositories, dataset cards/viewers, APIs, notebooks, competitions, moderation, hosted compute | Version drift, upstream removal, component-license ambiguity, safety takedowns, and model/dataset dependency confusion | Dataset bill of materials, source/license claims by component, exact release roots, advisory diffs, and mirror receipts | **Manifest-first only; raw web scrapes are a fatal risk** |
| OpenStreetMap, Natural Earth, NOAA, USGS | Volunteer map editing plus foundations; government/public-domain static releases; tiles, extracts, APIs and diffs | Tile and provider dependencies, changing releases, attribution/share-alike duties, difficult reproducibility | Versioned regional release ledger with bounding box, CRS, time, lineage, license, diff and mirror state | **Static public-domain subsets are shippable; live OSM replacement is not** |
| iNaturalist and GBIF | Nonprofit citizen-science social network; government-funded international data infrastructure; taxonomic review and open licenses | iNaturalist explicitly says it is not a photo backup; licenses and locations can change; sensitive locations need obscuration | Opt-in, coarse-location observation releases or research snapshot manifests | **Interesting gallery; exact locations and ordinary user archives are no-go** |
| Open Food Facts | Volunteer nonprofit, barcode app, product photos as evidence, open database and image licenses, APIs and bulk exports | Source images and derived product facts need provenance; API infrastructure is rate-limited; revisions matter | Signed product snapshot/version manifests and independently checked source-photo assertions | **Excellent gallery/data fixture; incumbent is already open and portable** |
| MuckRock and DocumentCloud | Nonprofit newsroom and tools; verified uploaders; OCR, redaction, annotations, projects, API and embeds | Government documents are scattered and mutable; public evidence depends on stable source documents | Public-record release receipt and mirror graph for selected, reviewed collections | **High civic value, high personal-data and redaction risk** |
| ICIJ Offshore Leaks and OCCRP Aleph | Nonprofit investigative teams; public/open subsets plus tightly access-controlled sensitive archives | Cross-border evidence is large and hard to search; grant-funded infrastructure; important public outputs need durable citation | Exact public-release manifests and citations only | **Public licensed outputs only; private leaks must stay off EFS** |

## 1. Public-data rescue: the strongest civic wedge

### Community and current operating reality

The Data Rescue Project is an active coordination community rather than one storage vendor. Its July 2026 site shows ongoing rescue work, volunteer opportunities, hackathons, repository-resilience work, field guides, and advocacy. [PD-03] Its “Current Efforts” map names:

- EDGI and the Public Environmental Data Partners;
- Harvard's Library Innovation Lab and Source Cooperative;
- ICPSR/DataLumos, Dryad, OSF, Dataverse and institutional repositories;
- the End of Term Archive, Internet Archive and Webrecorder;
- the Data Liberation Project, MuckRock and Stanford Big Local News;
- Policy Commons, SciOp/BitTorrent, Safeguarding Research and domain-specific projects; and
- ad hoc communities including DataHoarders and ArchiveTeam. [PD-01]

This is already a network. The missing shared surface is not simply storage capacity; it is a portable way to say:

> This steward captured these exact bytes from this source at this time, using this process; this version supersedes that one; these mirrors currently attest to holding the same bytes; and this citation resolves even if one catalog disappears.

Harvard's work is especially instructive. In January 2025 its Library Innovation Lab said it had collected metadata and primary contents for more than 300,000 Data.gov datasets and observed pervasive link rot. It recorded Data.gov counts of about 301,000, 307,000, and 305,000 on three dates over ten weeks, while noting that many November URLs no longer worked. [PD-02] The Data Rescue Project later described the released archive as **16 TB and more than 311,000 datasets**, updated daily, while warning that it is a shallow crawl: directly linked files are captured, but a landing page or database requires separate collection. [PD-01]

This is concrete pain, a reachable class of stewards, and a corpus large enough to matter without inventing a hypothetical audience.

### Metadata, provenance, and browse model

Federal data catalogs use DCAT-US metadata and expose harvest-oriented APIs and `data.json` feeds. Those records can include distributions, source URLs, formats, licenses, modification dates, publishers, and harvest state. [PD-04] [PD-05] That is a useful import vocabulary, not an authenticity oracle:

- an agency catalog record can be incomplete or stale;
- one catalog entry can point to several distributions or only a landing page;
- a rescuer may capture a file after the publisher silently changed it;
- a later version may correct a serious error; and
- a public URL says nothing by itself about personal data, third-party rights, or sensitivity.

The EFS browse experience should therefore be a **time machine and evidence graph**, not a generic file dump:

- browse by publishing office, topic, geography, format, capture date, license assertion, and availability;
- open one exact dataset generation with its files, schema, documentation and checksums;
- compare two generations and distinguish source change from rescue-tool change;
- see the original catalog assertion separately from the rescuer's capture assertion;
- see every declared mirror and its latest verification receipt;
- cite a generation, not a mutable “latest” landing page; and
- show `UNKNOWN` or partial availability honestly when no current mirror has been verified.

### Adoption shape and complement boundary

**Adoption shape:** integrity layer and cross-repository mirror graph.

EFS should not ask the Data Rescue Project, Harvard, ICPSR, or Internet Archive to migrate. They already provide domain judgment, bulk storage, access controls, curation, discovery, and durable institutions. EFS could let each remain an independent operator while their receipts compose.

One dataset could have:

- a publisher assertion describing the official release;
- a Harvard capture assertion;
- a DataLumos curation assertion;
- a Webrecorder capture of an interactive front end;
- a Source Cooperative or BitTorrent byte mirror;
- an independent checksum verification;
- a later “superseded/corrected” assertion; and
- several curator lenses for climate, education, public health, or local reporting.

EFS proves the signatures, relationships, and byte commitments. It does not prove the publisher told the truth or that the rescue is complete.

### First 10,000 seed objects

The lawful seed is **not the first 10,000 rows returned by Data.gov**.

A credible pilot steward is one Data Rescue Project member, domain librarian, or public-data office that selects a bounded, low-risk collection. Start with static, explicitly public, non-personal environmental or geospatial releases. Ten thousand EFS objects could represent:

- 1,000 dataset generations;
- 3,000 file manifests;
- 1,000 schema/documentation artifacts;
- 1,000 source-capture receipts;
- 2,000 mirror and verification receipts; and
- 2,000 topic, office, format and supersession assertions.

That is enough to test a real graph without pretending that object count equals dataset count.

The inclusion checklist should require:

1. named source office and original URL;
2. capture timestamp and tool/version;
3. explicit public-release and license basis;
4. no direct or inferred personal data;
5. no precise safety-sensitive locations;
6. file-level commitments, sizes and media types;
7. source metadata preserved as an assertion, not normalized into false certainty;
8. a steward who can review corrections and exclusions; and
9. at least two independently operated byte locations before calling the release replicated.

### Demo and EFS requirements

**Demo:** import 100 reviewed datasets from three offices; generate exact manifests; compare two versions; cite one exact release; remove a mirror and show partial availability; add an independent mirror receipt; export a portable bundle; reconstruct the collection without an EFS-operated index.

| Requirement | Why it matters |
|---|---|
| Bulk resumable import | Rescue work arrives as thousands of files and records, not individual wallet actions. |
| Exact multi-file generations | A dataset citation must bind data, schema, documentation and license context together. |
| Source vs rescuer roles | “Captured from agency URL” is not “signed by the agency.” |
| Version and diff edges | Corrected releases must remain distinguishable from removed or silently replaced releases. |
| Mirror verification | A list of URLs is not current availability evidence. |
| Portable DCAT mapping | Existing catalog metadata should survive import without becoming kernel truth. |
| Spatial/table previews | CSV, Parquet, GeoPackage and shapefile previews are application work; EFS does not supply them. |
| Enhanced search with fallback | Full-text, facets and cross-catalog ranking are off-chain; exact bounded collection browse must still work. |
| Measured economics | The 16 TB archive cannot be treated as cheap because one root signature is batched. |

### Fatal risks

- **Personal data:** “government data” can include individuals, exact addresses, case records, or linkable small populations. EFS's current posture is explicit: other people's personal data belongs off-chain. [EFS-LAW]
- **Sensitive locations:** environmental and infrastructure data can expose vulnerable species, cultural sites, utilities, or security-relevant systems.
- **Corrections and retractions:** permanence can keep a harmful statistical error discoverable. The viewer must foreground supersession and correction without claiming erasure.
- **False officialness:** an EFS record signed by a rescuer is evidence of that capture, not an agency seal.
- **Overpromised completeness:** Harvard's shallow-crawl warning proves that “all Data.gov” is not a defensible claim.

**Shippable now:** reviewed static public-domain/non-personal datasets, commitments and mirror receipts.

**Deceptively hard:** dynamic dashboards, databases behind query interfaces, health/education microdata, continuously changing APIs, and any corpus whose inclusion review is “it was publicly reachable.”

## 2. Research repositories: a reproducible release capsule, not another DOI silo

### What incumbents already do

| Repository | Governance and funding shape | Capabilities EFS must respect |
|---|---|---|
| Zenodo | CERN/OpenAIRE service, launched in 2013; open-source InvenioRDM; institutional preservation copies and tape; all-discipline deposits | DOI/DataCite metadata, versioning, embargo/restriction, licenses, 50 GB default records, withdrawal tombstones, APIs; files may be withdrawn and the policy does not promise functional preservation [PD-06] [PD-07] |
| Dryad | Nonprofit, community and institutional partners, cost-recovery data publishing charges | Human curation, CC0 publication norms, DOI, preservation and funder/journal workflows [PD-08] |
| Dataverse | Open-source project led by Harvard IQSS with Harvard Library/HUIT support plus grants | Domain metadata, dataset versions, roles, restricted files, guestbooks, licenses and repository federation [PD-09] [PD-10] |
| OSF | Center for Open Science nonprofit; philanthropy/federal support; open-source infrastructure | Projects, components, versioned files, DOI, add-ons, public/private storage; registrations are frozen and withdrawn registrations retain metadata [PD-11] [PD-12] |
| Figshare | Commercial Digital Science platform plus institutional/publisher products | DataCite DOI, public versions, APIs/OAI-PMH, limits and paid capacity; public version history is immutable and retention promises vary by product [PD-13] [PD-14] |

These repositories have real preservation and governance institutions. EFS should not market to researchers as if DOI assignment, metadata, embargo, access control, curation, and repository trust do not exist.

The unmet edge is often **release closure across systems**. A paper points to one DOI; the code is in GitHub; a model is on Hugging Face; a container tag mutates; supplementary data sit in another repository; one enormous input remains in a lab bucket; and the environment needed to reproduce the result is implicit.

Data availability also decays. A study of 516 papers published between 1991 and 2011 found the odds that the underlying data remained available fell by 17% per year, while working author email addresses also decayed. [PD-15] This is older evidence, but the mechanism remains relevant: links, people, and systems move.

### Credible EFS role

**Adoption shape:** an opt-in **Reproducible Release Capsule** that cites, rather than supplants, DOI repositories.

One capsule can bind:

- DOI and repository version;
- exact file manifests and mirror locations;
- code commit and software bill of materials;
- environment/container commitment;
- schema and data dictionary;
- declared license and source for each component;
- creator and institutional signatures;
- verification/test receipts from independent labs; and
- a supersession edge when a corrected release appears.

The first application should link back to Zenodo/Dryad/Dataverse/OSF as canonical repository context. EFS provides an independently reconstructable closure and verification graph. It does not become a new peer-review or curation authority.

### First 10,000 seed objects and demo

Recruit original creators of small, non-human, permissively licensed datasets—synthetic benchmarks, physical-science measurements, open hardware experiments, and software test corpora are safer than health or social data.

Ten thousand objects could come from 250 releases with 10–40 artifacts each. Every release must be opt-in and have a named rights steward.

**Demo:** take one existing Zenodo release with data, code and environment; import exact files; preserve its DOI and license assertions; add two mirrors; run a verification job; sign the result; then publish a corrected version without invalidating the first citation.

### Fatal risks

- human-subject data, consent withdrawal, genomics, health records and small-cohort re-identification;
- Indigenous or community-governed data whose lawful openness is not the same as ethical permanent republication;
- embargoed, export-controlled or contract-restricted data;
- metadata that identifies participants even when file bytes stay off-chain; and
- presenting a creator's license assertion as a completed rights audit.

For those cases, store personal/restricted data off-chain under appropriate governance and put at most a carefully designed commitment on EFS. [EFS-LAW]

## 3. ML datasets: preserve bills of materials, not dangerous web scrapes

Hugging Face demonstrates the expected baseline for a modern dataset home: Git-backed repositories, public/private controls, a dataset viewer, APIs, tags, and dataset cards that can describe license, language, size, source, bias and intended use. [PD-16] [PD-17] Its terms make uploaders responsible for rights and allow removal under platform policy and legal process. [PD-18]

Kaggle adds hosted notebooks, competitions, leaderboards and forums. Its public-facing 2026 hosting page says the community exceeds 32 million members, while a February 2025 overview described more than 500,000 public datasets and more than 1.5 million public notebooks. [PD-19] [PD-20] Those figures show demand; they do not imply that the datasets are redistributable.

The Re-LAION episode is the decisive permanence warning. LAION took LAION-5B down after reports of suspected CSAM and later released a filtered version after removing matched URLs with Internet Watch Foundation and Canadian Centre for Child Protection lists, while also discussing privacy-related child-image reports. [PD-21] A permanent public archive that had treated the original web scrape as an untouchable corpus would have made the repair far harder.

### Credible EFS role

Build a **Dataset Bill of Materials**:

- exact release root;
- component origins and claimed licenses;
- whether each component is creator-owned, derived, scraped, synthetic or referenced;
- source and preprocessing code;
- hashes and sizes;
- model and paper relationships;
- safety/privacy review assertions;
- removal or advisory diffs; and
- lawful mirrors where rights are actually established.

For web-scraped corpora, EFS should normally preserve the manifest, processing recipe, public research report and advisory history—not the raw media bytes or a list that makes harmful material easier to retrieve.

### First corpus and no-go line

**Shippable:** original synthetic datasets, benchmark fixtures, and scientific datasets published by their creators under clear CC0/CC BY terms.

**No-go:** scraped faces, voices, children, medical images, leaked databases, proprietary competition data, or any seed justified only by “the URL was public.”

EFS also lacks hosted notebooks, compute, streaming Parquet viewers, dataset previews, malware scanning, gated access, discussion/issues, leaderboards and safety review. A dataset gallery that ignores these features is not an incumbent replacement.

## 4. Maps and biodiversity: strong static releases, dangerous live coordinates

### OpenStreetMap and public-domain map releases

OpenStreetMap is governed and protected by the nonprofit OpenStreetMap Foundation and a large volunteer community. The database uses the Open Database License and publishes planet files and frequent diffs. [PD-22] [PD-23] Its tile policy is deliberately limited: donation-funded standard tile servers have no SLA and prohibit bulk/offline prefetch, directing heavy users to self-host or use a provider. [PD-24]

This creates a clear but narrow EFS role: a versioned **Atlas Release Ledger** for regional extracts, not a replacement for live editing, tiles, routing or geocoding.

A release manifest should carry:

- bounding box and coordinate reference system;
- source and extraction time;
- license and attribution;
- exact files and tile/package formats;
- lineage and regional filter;
- diff from prior release;
- sensitive-feature review;
- preview derivative; and
- mirror and verification state.

Good seeds include Natural Earth public-domain vector/raster releases, NOAA datasets with explicit federal public-domain or CC0 posture, and selected USGS/Landsat public-domain releases. [PD-25] [PD-26] [PD-27]

EFS currently lacks spatial indexes, map rendering, vector tiles, routing, geocoding, conflation/edit conflict resolution, high-rate diff ingestion and disputed-boundary policy. These are not minor presentation details.

### iNaturalist and GBIF

iNaturalist is a nonprofit social network and crowdsourced identification system connecting millions of naturalists and scientists. Its own “About” page makes two unusually candid statements: it is **not a repository for external data** and **not a way to back up photos**; uploaded photos are resized/reprocessed and users should keep their own backups. [PD-28]

That looks like an EFS opening, but the safety boundary is sharp:

- observations contain person, time and location associations;
- users can change or revoke media licenses;
- the default license is CC BY-NC, not a blanket permanent-republication grant;
- sensitive species and private locations use obscuration controls; and
- iNaturalist warns that nearby observations can help infer supposedly obscured locations. [PD-29] [PD-30]

GBIF is a government-funded international data network with standardized Darwin Core publishing and machine-readable CC0, CC BY or CC BY-NC dataset licenses. Its current home page reports three billion occurrence records, 100,000 datasets and 2,400 publishing institutions. [PD-31] [PD-32]

**Credible EFS role:** exact, steward-approved research snapshot manifests with coarse or removed sensitive coordinates. An opt-in naturalist could also publish their own deliberately public, coarsened observation capsule.

**Fatal risk:** publishing exact observations of threatened species, nests, rare plants, private residences, or vulnerable people into an immutable graph. Do not mirror iNaturalist wholesale.

## 5. Everyday proof galleries: Open Food Facts

Open Food Facts is a nonprofit, volunteer-built food-product database. Its documentation describes more than 25,000 contributors and more than 1.7 million products across 150 countries; those counts are documentation figures rather than a dated live census. [PD-33] The project provides open APIs and bulk exports, an ODbL database, and CC BY-SA product images. Product photos are treated as source evidence for structured ingredients, nutrition and packaging data. [PD-34] [PD-35]

Its upload rules are exactly the kind of discipline EFS needs: upload your own or consented photo, do not scrape the internet, and preserve the image as evidence behind derived facts. [PD-36] It also keeps raw images, selected/cropped derivatives and revision information distinct. [PD-35]

This makes Open Food Facts an excellent **gallery and provenance fixture**:

- barcode/object identity;
- multilingual front, ingredients, nutrition and packaging images;
- raw vs selected/cropped derivative lineage;
- taxonomies and collaborative tags;
- source-image proof behind normalized claims;
- revision history;
- conflicting edits and quality review; and
- mobile capture.

But it is a weaker first customer. The incumbent is already open-source, openly licensed, exportable, API-driven and mirrored on AWS. EFS must show value through independent release receipts, exact history, and multi-operator verification rather than offer “openness” back to an already open project.

Packaging images can also contain copyrighted artwork and trademarks even when a contributor's photograph is CC BY-SA; the project's own license guide flags that possibility. [PD-34] EFS should not turn a community reuse norm into a universal rights conclusion.

## 6. Civic documents and investigative archives

### MuckRock and DocumentCloud

MuckRock Foundation is a nonprofit newsroom and civic-information organization funded through a mix of user fees, donations, grants and consulting. [PD-37] Its current home page reports:

- 173,478 public-record requests;
- 11.8 million pages released through those requests; and
- 6.9 million public DocumentCloud documents spanning about 116 million pages. [PD-38]

DocumentCloud supports upload, OCR, search, annotations, embeds, metadata, projects, an API and bulk add-ons. Uploading is restricted to verified newsrooms, journalists, archives and qualifying academic projects. [PD-39] Importantly, it also supports private documents, redaction, page removal and permanent deletion. [PD-40]

Those are not incidental controls. Government documents can contain home addresses, medical details, witness names, children, confidential sources or improperly unredacted fields. EFS should never treat “obtained under public-record law” as “safe for irreversible universal publication.”

**Credible wedge:** a partner-reviewed public-record release receipt for a deliberately public collection. The receipt can bind the original PDF, OCR derivative, redaction/version lineage, notes, source request, article citation and mirrors.

The Disclose/DocumentCloud environmental-monitoring project already used Filecoin to preserve a curated collection while keeping DocumentCloud for acquisition, classification, explanation and API access. [PD-41] That is a direct warning against undifferentiated storage competition: decentralized bytes were one component of a larger newsroom workflow.

### ICIJ and OCCRP

ICIJ's public Offshore Leaks Database contains more than 810,000 offshore entities and is downloadable under ODbL/CC BY-SA terms. [PD-42] OCCRP's open-source Aleph software handles structured and unstructured data, OCR, entity cross-referencing, timelines, diagrams and access control. Its hosted Aleph Pro keeps much of its archive protected because of data-protection concerns. [PD-43] [PD-44]

That split is the right EFS boundary:

- public, licensed investigative outputs can have exact EFS release manifests and mirrors;
- private leaks, working notes, source identities and access-controlled evidence do not belong in public EFS bytes or graph metadata.

EFS cannot replace secure collaboration, OCR, entity resolution, access review, source protection or legal vetting.

## Product requirements this lane adds

| ID | Requirement | Acceptance test |
|---|---|---|
| PD-R1 | Distinct publisher, cataloger, rescuer, curator and mirror roles | A captured file never renders as publisher-signed unless the publisher actually signed it. |
| PD-R2 | Exact multi-file release closure | One citation binds files, schemas, documentation, licenses and capture context. |
| PD-R3 | Version, correction and supersession graph | A corrected dataset is prominent without erasing the cited earlier release. |
| PD-R4 | Machine-readable metadata import without false normalization | Original DCAT/DataCite/Darwin Core assertions remain inspectable alongside mapped EFS fields. |
| PD-R5 | Mirror receipts with expiry/freshness | A URL list cannot render as verified availability after its receipt is stale. |
| PD-R6 | Partial and unknown states | Missing one file or a failed mirror never becomes a green “available” badge. |
| PD-R7 | Sensitive-data review gate | First-party publication refuses personal or precise safety-sensitive data; reviewer and basis are recorded. |
| PD-R8 | Original/derivative separation | OCR, thumbnails, normalized tables and map tiles point back to exact source commitments. |
| PD-R9 | Rebuildable enhanced indexes | Facets, spatial search, full text and ranked results can be rebuilt from declared snapshots; bounded release browse survives their loss. |
| PD-R10 | Export and independent reconstruction | A second operator reconstructs one collection from a bundle, public records and declared mirrors. |

## Source index

### Public-data rescue and catalogs

- **[PD-01]** Data Rescue Project, [Current Efforts](https://www.datarescueproject.org/current-efforts/) — active organizations, repository map, Harvard 16 TB / 311,000+ dataset archive, shallow-crawl limitation, and specialist projects.
- **[PD-02]** Harvard Library Innovation Lab, [Preserving Public U.S. Federal Data](https://lil.law.harvard.edu/blog/2025/01/30/preserving-public-u-s-federal-data/) — data vault, authentication goal, 300,000+ captures, link rot and changing Data.gov counts.
- **[PD-03]** Data Rescue Project, [home and current updates](https://www.datarescueproject.org/) — continuing activity through July 2026.
- **[PD-04]** U.S. General Services Administration, [DCAT-US profile](https://resources.data.gov/resources/dcat-us/) — federal catalog metadata standard and `data.json` publishing model.
- **[PD-05]** Data.gov, [Catalog API](https://resources.data.gov/catalog-api/) — harvested metadata, distributions, popularity and raw harvest records.

### Research repositories and data decay

- **[PD-06]** Zenodo, [About](https://about.zenodo.org/) — CERN/OpenAIRE governance, open-source platform, DOI/DataCite and API posture.
- **[PD-07]** Zenodo, [Policies](https://about.zenodo.org/policies/) — record limits, licenses, versions, withdrawal, preservation copies, fixity and functional-preservation caveat.
- **[PD-08]** Dryad, [About](https://datadryad.org/about) and [costs](https://datadryad.org/help/requirements/costs) — nonprofit partnership, curation and cost-recovery model.
- **[PD-09]** Dataverse, [About](https://dataverse.org/about) — open-source governance, Harvard operations, grants and community.
- **[PD-10]** Dataverse, [What is Dataverse?](https://guides.dataverse.org/en/latest/quickstart/what-is-dataverse.html) — repositories, metadata, versions, permissions, guestbooks and licenses.
- **[PD-11]** Center for Open Science, [About](https://www.cos.io/about) — nonprofit governance, funding and open-science mission.
- **[PD-12]** OSF, [Projects](https://help.osf.io/article/353-welcome-to-projects) and [Registrations](https://help.osf.io/article/330-welcome-to-registrations) — storage, versions, components, DOI, frozen registrations and withdrawal.
- **[PD-13]** Figshare, [About](https://info.figshare.com/about/) — commercial/institutional operating model, DOI and APIs.
- **[PD-14]** Figshare, [versioning](https://info.figshare.com/user-guide/how-versioning-works/) and [retention](https://info.figshare.com/user-guide/how-long-will-figshare-host-and-retain-my-public-research-data-for/) — version DOIs and product-specific retention posture.
- **[PD-15]** Vines et al., [The availability of research data declines rapidly with article age](https://pubmed.ncbi.nlm.nih.gov/24361065/) — 516-paper data-availability study.

### ML datasets

- **[PD-16]** Hugging Face, [Datasets overview](https://huggingface.co/docs/hub/datasets-overview) — repository, viewer and public/private capabilities.
- **[PD-17]** Hugging Face, [Dataset Cards](https://huggingface.co/docs/hub/datasets-cards) — metadata for licenses, languages, size, bias, intended use and source datasets.
- **[PD-18]** Hugging Face, [Terms of Service](https://huggingface.co/terms-of-service) and [Content Policy](https://huggingface.co/content-policy) — uploader responsibility, removal and legal-policy controls.
- **[PD-19]** Kaggle, [Host a competition](https://www.kaggle.com/host) — current public community and competition figures.
- **[PD-20]** Kaggle, [Meet Kaggle overview](https://www.kaggle.com/static/slides/meetkaggle.pdf) — February 2025 public dataset and notebook scale.
- **[PD-21]** LAION, [Re-LAION-5B](https://laion.ai/blog/relaion-5b/) and [maintenance notice](https://laion.ai/notes/laion-maintenance/) — takedown, safety review and filtered re-release.

### Maps and biodiversity

- **[PD-22]** OpenStreetMap Foundation, [Mission Statement](https://osmfoundation.org/wiki/Mission_Statement) — nonprofit protection, community and open-data mission.
- **[PD-23]** OpenStreetMap, [Copyright and license](https://www.openstreetmap.org/copyright?locale=en-GB) and [planet diffs](https://wiki.openstreetmap.org/wiki/Planet.osm/diffs) — ODbL and frequent change files.
- **[PD-24]** OpenStreetMap Operations, [Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) — donation-funded service limits, no SLA and offline-use restrictions.
- **[PD-25]** Natural Earth, [About](https://www.naturalearthdata.com/about/) — public-domain vector and raster data.
- **[PD-26]** NOAA NCEI, [Archive Information](https://www.ncei.noaa.gov/index.php/archive) and NOAA Coast Survey, [Data Licensing](https://nauticalcharts.noaa.gov/data/data-licensing.html) — public-domain federal data and CC0 posture.
- **[PD-27]** USGS, [Landsat public-domain status](https://www.usgs.gov/faqs/are-landsat-data-cloud-still-considered-be-within-public-domain) — public-domain imagery.
- **[PD-28]** iNaturalist, [About](https://www.inaturalist.org/pages/about) — nonprofit mission, community, not-a-repository and not-a-photo-backup statements.
- **[PD-29]** iNaturalist, [Licenses](https://help.inaturalist.org/en/support/solutions/articles/151000175695) — separate observation/media licenses, default CC BY-NC and revocation/change controls.
- **[PD-30]** iNaturalist, [Geoprivacy](https://help.inaturalist.org/en/support/solutions/articles/151000169938-what-is-geoprivacy-what-does-it-mean-for-an-observation-to-be-obscured-) — sensitive-location controls and inference caveats.
- **[PD-31]** GBIF, [What is GBIF?](https://www.gbif.org/what-is-gbif) — government-funded international network, Darwin Core and publishing model.
- **[PD-32]** GBIF, [home](https://www.gbif.org/) and [terms](https://www.gbif.org/terms) — current scale and machine-readable CC0/CC BY/CC BY-NC licenses.

### Open Food Facts

- **[PD-33]** Open Food Facts, [documentation overview](https://openfoodfacts.github.io/documentation/docs/) — nonprofit community, documented scale, APIs and ecosystem.
- **[PD-34]** Open Food Facts, [license guide](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/tutorials/license-be-on-the-legal-side/) — ODbL database, CC BY-SA images and third-party-rights warning.
- **[PD-35]** Open Food Facts, [product image schema](https://openfoodfacts.github.io/documentation/docs/Product-Opener/schemas/schemas/product_images/) and [image download model](https://openfoodfacts.github.io/openfoodfacts-server/api/how-to-download-images/) — images as proof, revisions, raw/selected roles and derivative sizes.
- **[PD-36]** Open Food Facts, [image upload tutorial](https://openfoodfacts.github.io/openfoodfacts-server/api/tutorial-uploading-photo-to-a-product/) — creator/consent requirement and prohibition on scraped images.

### Civic documents and investigative data

- **[PD-37]** MuckRock, [FAQ](https://www.muckrock.com/faq/) — nonprofit structure and mixed funding model.
- **[PD-38]** MuckRock, [home](https://www.muckrock.com/) — current request, document and page counts.
- **[PD-39]** DocumentCloud, [home](https://www.documentcloud.org/) and [About](https://www.documentcloud.org/about) — newsroom/archive users, nonprofit governance, API and publication mission.
- **[PD-40]** DocumentCloud, [FAQ](https://next.www.documentcloud.org/help/faq/) and [API](https://next.www.documentcloud.org/help/api/) — private/public visibility, OCR, redaction, metadata loss and deletion.
- **[PD-41]** MuckRock, [Monitoring projects with an impact on the environment](https://www.muckrock.com/news/archives/2025/jul/22/monitoring-projects-with-an-impact-on-the-environment/) — DocumentCloud workflow plus Filecoin preservation.
- **[PD-42]** ICIJ, [Offshore Leaks database download](https://offshoreleaks.icij.org/pages/database) — 810,000+ public entities, downloadable graph and open licenses.
- **[PD-43]** OCCRP, [About Aleph](https://docs.aleph.occrp.org/about/) — open-source investigative platform, funders and capabilities.
- **[PD-44]** OCCRP, [About Aleph Pro](https://aleph.occrp.org/pages/about) — public records plus access-protected leaks and data-protection rationale.
- **[EFS-LAW]** EFS planning, [[law-positioning]] — public permanence, visible graph, and “not a home for other people's personal data” posture.
