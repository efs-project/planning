# Visual lifeboats, public collections, and open-hardware communities

**Status:** completed point-in-time community research; evidence current through 2026-07-29; recommendations are EFS analysis, not an owner ruling or design amendment
**Scope:** Flickr Data Lifeboat, photography and cultural collections, open hardware and 3D maker files, plus adjacent podcast, music-metadata and genealogy communities
**Read with:** [[research-method]], [[requirements-and-first-apps]], [[visual-gallery-and-booru-ecosystems]], [[use-cases]], [[apps-cookbook]], and [[law-positioning]]

#status/done #kind/research #repo/planning #topic/use-cases #topic/content #topic/market-research #topic/media #topic/archives #topic/open-hardware

## Executive finding

The most compelling mainstream visual precedent is not a hypothetical. The nonprofit Flickr Foundation has built **Data Lifeboat**, a live tool that:

- lets a Flickr member select a “sliver” of photos;
- preserves images with technical and social metadata;
- asks the curator to write context for future readers;
- creates a self-contained browser-readable archive;
- supports inclusion of other people's photos through a consent flow; and
- is developing a distributed Safe Harbor Network of trusted “docks.” [VL-01] [VL-02]

It is unusually close to an ideal EFS application—and therefore a reason to **integrate or complement, not clone**. Data Lifeboat already owns the hard ethical and packaging questions. EFS could add a signed identity for one exact package generation, commitments to every original and derivative, curator and consent evidence, mirror/dock receipts, supersession/advisory history, and overlapping public views.

The best surprising first-user alternative is the open-hardware community. The Open Source Hardware Association currently lists 3,372 certified projects; certification gives each a stable identifier, yet the program has previously revoked a certification because linked documentation disappeared. [VL-03] [VL-04] A visual release vault for CAD, schematics, firmware, bills of materials and independent build receipts exercises EFS's strongest primitives and has a cleaner rights chain than scraped galleries.

The cultural-collection opportunity is also real, but it must distinguish:

- **CC0/public-domain assets**, which can form a shippable pilot;
- **“no known copyright restrictions,”** which is a risk statement, not a guarantee;
- rights-restricted metadata-only records; and
- culturally sensitive, personal, sacred, funerary or community-governed material that should not be irreversibly republished.

## Candidate map

| Community | Existing operation and network effect | Credible EFS role | First-user verdict |
|---|---|---|---|
| Flickr Data Lifeboat creators and Flickr Commons members | Nonprofit preservation R&D plus a live consent-aware packaging tool; images gain value from albums, tags, comments, galleries and curator context | Signed package generation, exact commitments, mirror/dock receipts, consent/context evidence and overlapping curator views | **Top visual candidate; collaborate, do not scrape or replace** |
| OSHWA-certified open-hardware creators, makerspaces, open-science hardware | Nonprofit certification, stable UIDs, open licenses, linked design repositories; remixes and build reports improve prior work | Complete release package, persistent UID backlink, version lineage, build/test receipts, alternate parts, viewers and mirrors | **Top surprising mainstream candidate** |
| Small museums, libraries, local-history and community archives with explicit open subsets | Public/nonprofit stewardship, grants and local volunteers; collections gain value from linked people, places, subjects, translations and essays | Collection lifeboat and gallery with exact source/derivative roles, rights context and multiple curated views | **Strong partner-led pilot; rights review is the work** |
| Wikimedia Commons and major museum open-access programs | Mature nonprofit/institutional infrastructure, huge open collections, structured metadata, community rights review and deletion | Integrity/archive experiments or alternate curation over explicitly open subsets | **Excellent fixture and source vocabulary; poor “replacement” target** |
| Glass and Pixelfed photographers | Member-funded craft community or federated social network; follows, discussions, albums/series, EXIF, moderation and federation | Creator opt-in permanent release channel beneath existing social discovery | **Product teacher; social replacement is out of scope** |
| Podcasts and creator-owned audio | Open RSS distribution plus commercial directories/apps; subscriptions and apps repeatedly migrate or close | Creator release capsule for feed, episode bytes, transcript, chapters and show notes | **Plausible later lane; large bytes and music/guest rights complicate it** |
| MusicBrainz and other open knowledge graphs | Nonprofit, community editing, open dumps, permanent identifiers and peer review | Signed snapshots or mirror receipts | **Important precedent, but incumbent already solves most portability pain** |
| Genealogy and public records | Nonprofit/commercial platforms, archives and family collaboration; rich graph and scan metadata | Deceased/public-domain local-history subset only | **Not a broad first target; living-person and record-contract risk is fatal** |

## 1. Flickr Foundation Data Lifeboat: the clearest complementary wedge

### Current mission, operation, funding, and scale

The Flickr Foundation is a U.S. 501(c)(3) whose mission is to keep Flickr pictures visible for 100 years. Its Data Lifeboat work was supported by a National Endowment for the Humanities Digital Humanities Advancement Grant and a Mellon Foundation Public Knowledge Grant, with research input from libraries, archives, Creative Commons, preservation networks and public institutions. [VL-02]

The Foundation describes Flickr as holding **tens of billions of images**, with millions of new images, likes and comments added each day. During its 2024 prototyping it used an order-of-magnitude figure of roughly 50 billion images and said plainly that no one archive can or should save the whole service. [VL-01] [VL-05] The unit is therefore a **curated sliver**, not a platform dump.

The current Data Lifeboat service is live. A Flickr member:

1. signs in;
2. chooses photos;
3. writes a README;
4. obtains consent when including another member's photos; and
5. downloads a self-contained ZIP that opens in an ordinary web browser. [VL-01] [VL-06]

The public service currently charges USD 5 to start for an archive of fewer than 500 photos, with larger archives priced when ready to download. [VL-06] That is useful evidence that packaging and egress have real operating costs even before permanent-network writes.

The package preserves more than JPEGs:

- high-resolution original and thumbnail;
- technical metadata such as camera, date, time and location;
- Flickr social metadata such as usernames, comments, tags, albums and galleries;
- creator README and permissions/licensing context; and
- the policies and agreement date accepted by the lifeboat creator. [VL-07] [VL-08]

The archive is deliberately low-tech HTML/JavaScript with no external dependency. Its current landing page says other people's photos can be included after consent, and the terms describe authenticated access and consent management. [VL-01] [VL-08]

### Why the “lifeboat” metaphor is product guidance

The Foundation's design principles are directly reusable:

- **select, do not vacuum:** preservation is curated, not indiscriminate;
- **start small:** a survivable sliver beats a grandiose incomplete mirror;
- **keep context:** tags, comments, galleries and curator notes make an image legible;
- **make it self-contained:** the package must remain useful if the originating service is gone;
- **design for a future stranger:** rights, origin and purpose must travel with the bytes; and
- **plan where it lands:** a package on one creator's hard drive is portable but not necessarily preserved.

Data Lifeboat's “Beach” model lets the creator store a package anywhere. Its planned Safe Harbor Network would add trusted managed “docks,” compared by the Foundation to LOCKSS. It already produced a Commons 1K package on Internet Archive and an IPFS copy. [VL-02]

That means EFS cannot credibly pitch “decentralized storage” as a novel idea to this community. The useful EFS questions are:

- Can independently operated docks publish verifiable receipts against one exact package identity?
- Can a future viewer prove which package generation and policy/consent context they received?
- Can a curator issue a correction, warning or successor without pretending the old package vanished?
- Can multiple curators build views over the same consented objects without copying the originals into another silo?
- Can a package be reconstructed from ordinary EFS records plus declared mirrors if the original index is gone?

### Consent and metadata: the load-bearing boundary

Data Lifeboat's consent work is not decorative. Its 2024 policy prototype found that a tag-based collection included many All Rights Reserved photos and that 33% had downloads disabled. The team explicitly asked whether Flickr's terms were sufficient, how consent should work, and how licensing or privacy might decay or change over time. [VL-09]

The Foundation has considered separate obligations for:

- Flickr members whose material appears;
- people creating a lifeboat; and
- dock operators holding it. [VL-10]

EFS must not flatten those roles into one uploader signature.

Even an image-owner consent flow does not automatically resolve:

- the privacy or wishes of people depicted in a photograph;
- usernames and personal statements made by commenters;
- precise EXIF or described locations;
- children or family members;
- trademarks, artworks or documents visible inside the image;
- cultural-community authority over sensitive material; or
- a future request to separate a pseudonym or withdraw social context.

On EFS, a curator address, timestamp and collection graph are public and permanent even if the image bytes live in replaceable mirrors. The safe product must show the exact public graph before signing and omit or coarsen unnecessary personal metadata. Private family lifeboats are valuable, but **public EFS is not their default home**. [EFS-LAW]

### Credible EFS role

**Adoption shape:** opt-in integrity and mirror layer for a Data Lifeboat package.

Keep the existing ZIP and browser viewer. Add:

- one stable lifeboat identity and exact generation root;
- item-level commitments for originals and thumbnails;
- package-manifest commitment and format version;
- source-account and curator assertions;
- consent/permission evidence or a commitment to evidence held by the responsible steward;
- creation-tool version and capture time;
- rights and privacy-review assertions kept distinct;
- dock/mirror receipts with freshness;
- correction, successor, withdrawal-from-view and deny/advisory events;
- curator lenses over selected lifeboats and items; and
- a portable `.efs-bundle` or equivalent reconstruction package.

The public viewer must label the limits:

- “creator consent recorded” is not “every depicted person consented”;
- “no known copyright restrictions” is not “CC0”;
- “mirrored” is not “endorsed by Flickr Foundation”; and
- “unlisted by this view” is not “deleted.”

### First 10,000 seed objects

**Named seed-steward target:** Flickr Foundation, one Flickr Commons member, or a cohort of Flickr members using the Foundation's consent workflow. These are outreach targets, not presumed partners.

A credible seed is not 10,000 randomly scraped Flickr images. It could be:

- 20 opt-in Flickr members making lifeboats of up to 500 of their own photos; or
- 5–10 cultural institutions creating carefully reviewed open collections; or
- 1,000–2,000 source images whose originals, thumbnails, metadata snapshots, consent/context records and curator assertions produce 10,000 meaningful typed objects.

The first pilot should require explicit creator/institution participation even when a legal theory might permit copying. This is a community wedge, not a content-acquisition hack.

The Foundation's Commons 1K package is a useful fixture, but its photos carry “no known copyright restrictions,” not a guarantee. A production seed should prefer creator-owned work or explicit CC0/CC BY material.

### Demo and requirements

**Demo:** import one consent-bearing Data Lifeboat; publish its exact manifest; browse a 1,000-image gallery; show original vs thumbnail lineage; inspect license, curator note and consent status; switch among three curator views; add a second dock receipt; make one mirror unavailable; issue a corrected successor; export and reconstruct elsewhere.

| Requirement | Acceptance test |
|---|---|
| Existing-package fidelity | Rebuilding from EFS does not alter Data Lifeboat's HTML, README or manifest semantics. |
| Consent and role separation | Owner, lifeboat creator, depicted-person review, commenter/social-metadata review and dock operator are distinct assertions. |
| Metadata minimization | Import preview identifies exact location, usernames and other personal metadata before public signing. |
| Original/derivative identity | High-resolution original and every preview have separate commitments and explicit derivation edges. |
| Exact generation and successor | A correction creates a new generation; the earlier cited package still resolves with a prominent advisory. |
| Mirror receipts | A dock can attest to the exact generation without becoming its creator or rights authority. |
| Fast walletless gallery | Cards load from previews and cached metadata; browsing never hydrates full originals by default. |
| Enhanced-index fallback | Tags and search can fail while bounded package browse and exact item detail remain useful. |
| Independent reconstruction | A second operator serves the package without an EFS-project gateway or index. |

### Fatal risks

- treating public visibility as permanent-republication consent;
- publishing comments, account names, locations or family metadata that users did not understand would become permanent;
- implying that a lens can honor a true delete or right-to-be-forgotten request;
- using “no known copyright restrictions” as a rights warranty;
- preserving a package while stripping the Foundation's consent, policy and context model; and
- approaching the Foundation as if its existing viewer, package and Safe Harbor work should be replaced.

## 2. Public cultural collections: the best rights-cleared gallery corpus

### What major incumbents prove

| Program | Current scale and model | Product lesson |
|---|---|---|
| Wikimedia Commons | Volunteer-maintained free-media repository with about 144.9 million files in April 2026; nonprofit infrastructure; structured data and deletion processes [VL-11] [VL-12] | A serious gallery needs multilingual captions, depicts/creator/license statements, references, qualifiers, search, categories, community rights review and deletion operations. |
| Flickr Commons | More than 100 institutions in 24 countries and roughly two million photos; tags, albums, galleries, comments, API and public participation [VL-13] | Social description and institutional context create value; “no known copyright restrictions” is intentionally not a guarantee. |
| Smithsonian Open Access | More than 5.1 million 2D/3D items across 21 museums, nine research centers, libraries, archives and the zoo; CC0-designated assets, API, GitHub, IIIF, Figshare and AWS [VL-14] [VL-15] | Explicit machine-readable rights and standard formats make a lawful seed possible; even CC0 does not clear privacy, publicity, trademark or cultural concerns. |
| The Metropolitan Museum of Art | More than 492,000 public-domain artwork images plus open API/data; CC0 where designated [VL-16] | Rights status belongs at the item level; collection metadata is continuously corrected. |
| DPLA | Nonprofit national partner network and discovery layer; more than 50 million cultural-heritage items across the program [VL-17] | Aggregation is metadata and relationships across institutions, not ownership of every byte. Long-lived programs themselves need institutional transition plans. |
| Library of Congress | Curated “Free to Use and Reuse” sets and public-domain data packages [VL-18] | A bounded rights-reviewed set is safer than inferring rights from the existence of a catalog record. |

These institutions already provide preservation expertise, metadata standards, APIs, viewers, IIIF, rights review, catalog corrections, education and public trust. EFS should not claim that institutional collections are homeless.

The opening is smaller institutions and community archives whose digitized collection depends on:

- one grant;
- one staff member;
- one content-management vendor;
- a brittle theme or plug-in;
- a state or university host whose priorities change; or
- a discovery aggregator that may itself move.

DPLA's current transition page says that in early 2024 it began selecting a durable new home for a 12-year, 50-million-item cultural heritage aggregation program. [VL-17] That is not evidence of failure; it is evidence that even strong nonprofits must plan transfer and continuity.

The Internet Archive's October 2024 recovery after a cyberattack offers a second lesson: a mission-aligned nonprofit can still have a centralized availability incident and account-data compromise. [VL-19]

### Credible EFS role: a collection lifeboat

**Adoption shape:** partner-led export and integrity layer.

A small museum, library or community archive publishes:

- collection and item identities;
- original media commitments;
- IIIF or equivalent source manifests;
- catalog metadata snapshot and schema;
- explicit source/creator/rights statements;
- thumbnails and other derivatives with provenance;
- curator essays and collection rationale;
- translations, tags and linked people/places/events;
- correction and supersession history; and
- several institution/community mirror receipts.

The institution remains the authority for its own catalog claims. Independent historians can add competing labels or interpretations without editing the institution's record.

### Rights and cultural-care boundary

There are at least four materially different rights states:

1. **CC0/public-domain designation:** strongest first-pilot lane.
2. **CC BY/CC BY-SA:** reusable with attribution and, where applicable, share-alike obligations.
3. **No known copyright restrictions:** the steward did not identify a restriction; a later claimant or other legal right may still exist.
4. **Restricted/unknown/culturally sensitive:** metadata may be public while the media is not safe or authorized for permanent republication.

The Smithsonian FAQ explicitly excludes some objects for copyright, donor/lender/artist contracts, cultural sensitivity, partial ownership, format or commercial-product reasons. It also warns that CC0 applies to copyright and may not clear third-party privacy, publicity or trademark rights. [VL-15] That is the correct EFS model.

Historical records can also contain offensive terminology, violence, funerary images, sacred objects, precise archaeological locations or material a source community reasonably expects to govern. A “public-domain” analysis does not answer every ethical access question. EFS's inability to erase makes conservative selection more important, not less.

### First 10,000 seed objects and demo

**Named seed-steward targets:** Flickr Foundation/Flickr Commons, one DPLA hub with an explicit open subset, or one local institution that controls a CC0/public-domain collection. These are candidate outreach targets, not claimed relationships.

Start with 1,000–2,000 reviewed images or 3D models. Item records, original and preview files, catalog snapshots, rights assertions, tags, mirror receipts and collection essays can yield 10,000 meaningful objects without manufacturing filler.

**Demo:** an open local-history collection with map/time browse, gallery cards, one institutional view, one community-history view and one classroom view. Change a mistaken date through a new catalog assertion; preserve the earlier citation; show one culturally sensitive item as metadata-only in public views.

### What EFS still lacks

- IIIF-aware high-resolution image viewer and tiling;
- OCR, transcript and image-derivative pipelines;
- 3D/glTF viewer and preservation-profile validation;
- full-text, visual similarity, map and timeline indexes;
- item-level rights review workflow and notice/appeal operations;
- institutional identity, delegated roles and recovery;
- editorial tools for catalogers and community annotation;
- accessibility descriptions and multilingual search;
- content warnings and culturally sensitive access policy; and
- a funded long-term byte-mirror commitment.

## 3. Open hardware and 3D maker files: a surprisingly strong first community

### Community and operating reality

The Open Source Hardware Association (OSHWA) is a nonprofit that fosters accessible, collaborative technical knowledge and operates a free certification program. Certification assigns a stable UID and lets users identify projects that comply with the community's open-hardware definition. Its live site listed **3,372 certified projects** on 2026-07-29. [VL-03]

The certification API supports reading and creating project records, and exposes hardware, software and documentation license fields. [VL-20] The projects span electronics, scientific instruments, environmental sensors, education, fabrication and more.

The pain is unusually precise: OSHWA says it revoked a certification for the first time in 2018 because the project's documentation was no longer available. [VL-04] A stable certification identifier pointing to vanished source files is exactly the failure EFS can address.

The surrounding maker-platform market also keeps changing. Thingiverse describes itself as a large 3D-printing design community with makes, remixes, collections and an API. Its current About page says that in February 2026 it was acquired by MyMiniFactory as part of the “SoulCrafted” family. [VL-21] Its terms reserve the right to modify, suspend or discontinue services, while its API terms constrain bulk storage and competitive reuse. [VL-22] [VL-23]

This is not proof that Thingiverse will fail. It is proof that creators' release history and community graph depend on changing corporate ownership and service terms.

### Why the rights and network shape fit EFS

Certified open hardware already asks a creator to document and license several separable layers:

- functional hardware design;
- CAD/schematic/PCB source;
- firmware and software;
- bill of materials;
- assembly and test instructions;
- documentation;
- branding/trademarks; and
- any cited upstream open projects. [VL-24]

That is a natural multi-file manifest. More importantly, network effects can be evidence-bearing rather than attention-only:

- an independent builder attests that release X assembled successfully;
- a lab publishes measured performance and calibration data;
- a maintainer publishes a compatible substitute part;
- a remix cites the exact parent generation;
- a security reviewer issues an advisory;
- a distributor mirrors one exact release; and
- an OSHWA certification record points at the complete durable package.

Each contribution makes the original release more useful without transferring ownership.

### Credible EFS role

**Adoption shape:** an **Open Hardware Release Vault** beneath OSHWA certification and existing collaboration hosts.

Keep GitHub/GitLab, OSHWA and maker platforms for active collaboration, issues and community. Publish deliberate releases that bind:

- OSHWA UID and certification snapshot;
- source CAD, not only export meshes;
- Gerbers, schematics and board files;
- firmware/source and build instructions;
- bill of materials with manufacturer-part references;
- licenses for hardware, software and documentation;
- trademark/patent notices kept separate from copyright licenses;
- photos, renders and thumbnails;
- known toolchain versions;
- test/calibration artifacts;
- parent/remix relationships;
- exact mirror state; and
- independent build and safety receipts.

EFS should never render “certified” based on a copied logo or importer field. Only an OSHWA-originated assertion or verifiable snapshot of its API record can support that label, and the UI must distinguish current from historical status.

### First 10,000 seed objects

**Named seed-steward target:** OSHWA and a cohort of certified creators; alternatively, one open-science-hardware network or makerspace with creator participation. This is a proposed outreach path, not a presumed partnership.

The live directory has fewer than 10,000 projects but more than enough components. A pilot of 250–500 opted-in projects can create 10,000 useful objects across:

- release roots;
- CAD, schematic, firmware and documentation files;
- bills of materials;
- renders/thumbnails;
- license and certification assertions;
- parent/citation relations;
- mirror receipts; and
- build/test results.

Do not bulk-fetch every linked repository merely because its project appears in the certification API. Import at a creator-approved release boundary and preserve the original license notices and history required for attribution.

### Demo and requirements

**Demo:** 100 open-hardware releases across KiCad, Gerber, STEP, STL, OpenSCAD and firmware; gallery by category/license/country; one OSHWA UID backlink; exact source and derivative files; interactive preview; two independent build receipts; a compatible-part proposal; one superseded release; export and reconstruction from two mirrors.

| Requirement | Acceptance test |
|---|---|
| Multi-license manifests | Hardware, software, documentation, brand and upstream-component licenses remain distinct. |
| Source vs manufacturing derivative | A printable STL, Gerber or PDF never substitutes silently for editable source CAD/schematic. |
| Toolchain context | Release records tool/version and export settings needed to regenerate derivatives. |
| Stable release identity | Later repository changes do not alter the cited package. |
| Certification provenance | Historical/current OSHWA status renders from attributable evidence, not an uploader checkbox. |
| Build/test receipts | Third parties can attach results without editing the creator's release or claiming authorship. |
| Visual and technical viewers | Cards, exploded views, 3D rendering, schematic/PCB preview and BOM tables work without downloading every source file. |
| Safety labels | High voltage, lasers, batteries, RF, medical claims, weapons and other hazards have explicit review/action paths. |
| Measured package cost | A 500 MB CAD package and a 50 KB microcontroller design have visibly different mirror and publication costs. |

### Fatal risks

- **False openness:** a downloadable STL is not necessarily open source; editable design files and a valid license matter.
- **Patent, trademark and safety claims:** open copyright licensing does not grant every patent right or permission to use a brand.
- **Dangerous artifacts:** weapons, bypass tools, high-voltage designs and unsafe medical devices require serving-layer policies and expert warnings.
- **Supply-chain drift:** a BOM can become unbuildable as parts disappear; EFS preserves evidence but does not guarantee manufacturability.
- **Viewer scope:** STL preview is easy relative to parametric CAD, electronics, simulations and toolchain reproducibility.

**Shippable:** creator-owned, certified, low-risk devices with complete source packages.

**Deceptively hard:** medical, RF-regulated, weapons, high-energy, biosafety or legally encumbered designs.

## 4. Photography communities: product teachers, not incumbent replacements

### Wikimedia Commons

Wikimedia Commons is the benchmark for a public free-media commons. It combines:

- strict free-license/public-domain eligibility;
- file histories and source/author/license templates;
- categories and multilingual descriptions;
- structured “depicts,” creator and other statements with references, qualifiers and ranks;
- volunteer deletion and dispute processes;
- reuse across Wikipedia and sister projects; and
- an established nonprofit and governance ecosystem. [VL-11] [VL-12]

EFS can provide alternate curated views or integrity experiments over explicitly reusable subsets. It should not promise Commons a more mature rights-review, multilingual metadata or moderation institution than Commons already has.

### Flickr Commons

Flickr Commons pairs institutional uploads with comments, tags, albums and public discovery. It reports more than 100 participating institutions across 24 countries and around two million photographs. [VL-13]

Its rights statement is important: “no known copyright restrictions” means the institution is unaware of a restriction under its stated analysis; it is not a public-domain warranty or indemnity. [VL-25] A seed importer must retain the institution, source URL and exact rights statement as evidence.

### Glass and Pixelfed

Glass is member-funded rather than ad- or venture-funded. Its membership product includes high-resolution photos, discussions, semantic search, camera/lens feeds, EXIF, galleries/series, apps and moderation controls. [VL-26] Pixelfed is an open-source federated ActivityPub photo/video service with chronological feeds, albums, comments, stories, direct messages, visibility controls, follow approval, blocking and reporting. [VL-27]

Together they define the non-storage bar:

- creator profiles and recovery;
- follows and feeds;
- comments/discussions;
- notifications;
- albums/series/stories;
- EXIF and camera/lens browse;
- search and recommendation;
- high-resolution delivery and derivatives;
- privacy/visibility choices;
- blocking, reporting and abuse response; and
- federation or durable social relationships.

EFS does not currently supply that social product. The credible feature is a creator's deliberate permanent **release channel** that Glass, Pixelfed or another client could cite.

## 5. Adjacent mainstream communities

### Podcasts: real app churn, but RSS already provides portability

Google announced that it would discontinue Google Podcasts and migrate listeners toward YouTube Music, while allowing OPML subscription export. [VL-28] Stitcher's app and service shut down in 2023 after acquisition and consolidation into SiriusXM. [VL-29] Those events demonstrate directory and app fragility.

Podcasting also has a major resilience advantage: open RSS. The Podcasting 2.0 namespace extends feeds with chapters, transcripts, funding/value and other metadata without requiring one proprietary directory. [VL-30]

**EFS opportunity:** a creator-owned episode release capsule binding:

- feed snapshot and canonical URL;
- audio/video commitment and mirrors;
- transcript, chapters and artwork;
- rights/guest/music assertions;
- exact show notes and outbound citations;
- episode version/supersession; and
- portable subscription/export metadata.

**Why not first:** audio/video bytes are large; ad insertion creates multiple editions; hosts provide analytics and delivery; music clips and guest permissions complicate permanent redistribution; EFS does not replace listening apps, discovery, payments or subscriptions. Open RSS already solves much of the “walk away” problem.

### MusicBrainz: the historical precedent EFS should study

MusicBrainz was created after the volunteer-built CDDB was sold, access was restricted and the service was commercialized. It now operates as a nonprofit, community-maintained open music encyclopedia with permanent MBIDs, open data dumps, peer review and transparent funding. [VL-31] [VL-32]

Its July 2026 statistics reported 5.6 million releases, 39.4 million recordings, 56.7 million tracks, 1.3 million editors and nearly 20 million raw tag assertions. [VL-33]

This is powerful proof of a network effect built from open structured metadata. It is a weaker first-user target because MusicBrainz already has open dumps, identifiers, replication and a mission-aligned institution. EFS could archive signed snapshots or mirror receipts, but “make music metadata open” is already solved.

The cover-art/media distinction is also useful: MusicBrainz's core database does not contain recordings, and cover art is handled separately. [VL-31] EFS applications should similarly avoid treating metadata rights as media rights.

### Genealogy: local public history only

FamilySearch is a large nonprofit genealogy service supported by The Church of Jesus Christ of Latter-day Saints and partnerships with record custodians. It advertises billions of searchable names and a very large shared tree. [VL-34] Its privacy and access policies show why broad genealogy is a poor EFS seed:

- information about living people is private/restricted;
- records can contain ancestry, religion, health and family relationships;
- access can change because of record-custodian contracts and privacy laws; and
- FamilySearch terms restrict republication of many site records even when users can view them. [VL-35] [VL-36]

“Public record” is not a universal redistribution license. A small later pilot could preserve **deceased, rights-cleared local history**—for example, cemetery transcriptions and scans owned or cleared by one historical society—with a conservative cutoff and no DNA, adoption, living-person or restricted-record data.

## Product requirements this lane adds

| ID | Requirement | Acceptance test |
|---|---|---|
| VL-R1 | Package-native import | A Data Lifeboat or institutional export retains its original README, policy, manifest and viewer context. |
| VL-R2 | Consent and rights as attributable evidence | Creator consent, curator authority, depicted-person review, rights statement and cultural-sensitivity review are separate records. |
| VL-R3 | Original/derivative/toolchain lineage | Image thumbnails, 3D exports, OCR and manufacturing files all resolve to exact sources and creation tools. |
| VL-R4 | Fast browse across mixed media | A stranger can browse 10,000 images, 3D models and documents without fetching originals or connecting a wallet. |
| VL-R5 | Cross-collection identifiers and citations | Institution accession numbers, Flickr URLs, OSHWA UIDs and external IDs remain first-class backlinks, never overwritten by EFS IDs. |
| VL-R6 | Current vs historical status | License, consent, certification, correction and availability changes show effective time and source. |
| VL-R7 | Multiple curators and views | Institution, source community, classroom and specialist views coexist without one becoming universal truth. |
| VL-R8 | Safety/cultural actions | Blur, warn, metadata-only, omit, refuse execution and other actions remain serving/view policy, not a claim that bytes vanished. |
| VL-R9 | Mirror/dock operational receipts | A storage operator can attest to an exact generation and later expire or renew that assertion. |
| VL-R10 | Human-readable future context | Every package has a curator README or equivalent and a machine-readable manifest; neither substitutes for the other. |

## Source index

### Flickr Foundation and Data Lifeboat

- **[VL-01]** Flickr Foundation, [Data Lifeboat](https://www.flickr.org/programs/content-mobility/data-lifeboat/) — live product model, creator README, other-member consent, self-contained package and showcases.
- **[VL-02]** Flickr Foundation, [Designing a Data Lifeboat](https://www.flickr.org/programs/content-mobility/data-lifeboat-development-notes/) — package principles, funding, research partners, Beach/Safe Harbor models and Internet Archive/IPFS examples.
- **[VL-05]** Flickr Foundation, [Data Lifeboat: NEH Update 1](https://www.flickr.org/data-lifeboat-neh-update-1/) and [More questions than answers](https://www.flickr.org/data-lifeboat-update-2/) — 2024 scale estimate and selective “sliver” rationale.
- **[VL-06]** Flickr Foundation, [Data Lifeboat service](https://datalifeboat.flickr.org/) — current consent flow and pricing.
- **[VL-07]** Flickr Foundation, [The Data Lifeboat viewer, circa 2024](https://www.flickr.org/the-data-lifeboat-viewer-circa-2024/) — original/thumbnail files, machine-readable data, viewer and policy context.
- **[VL-08]** Flickr Foundation, [Data Lifeboat Terms](https://datalifeboat.flickr.org/terms) — technical/social metadata, authenticated access, creator contract and consent management.
- **[VL-09]** Flickr Foundation, [Data Lifeboat prototypes and policy](https://www.flickr.org/data-lifeboat-update-5-prototypes-and-policy/) — All Rights Reserved/download-disabled findings, Library of Congress prototype and policy questions.
- **[VL-10]** Flickr Foundation, [Data Lifeboat legal workshop](https://www.flickr.org/data-lifeboat-blog-update-3-march/) — separate member, creator and dock-operator policy roles.

### Open hardware and maker platforms

- **[VL-03]** Open Source Hardware Association, [home](https://oshwa.org/) and [Certification Directory](https://certification.oshwa.org/) — nonprofit program and current 3,372-project count.
- **[VL-04]** OSHWA, [About Certification](https://certification.oshwa.org/about.html) — purpose, stable certification UIDs and 2018 revocation after documentation became unavailable.
- **[VL-20]** OSHWA, [Certification API](https://certificationapi.oshwa.org/endpoints/) — project access, search/create operations and license-related fields.
- **[VL-21]** Thingiverse, [About](https://www.thingiverse.com/about) — design/remix community and February 2026 MyMiniFactory acquisition.
- **[VL-22]** Thingiverse, [Terms of Service](https://www.thingiverse.com/legal/terms) — user-content posture and right to modify, suspend or discontinue services.
- **[VL-23]** Thingiverse, [API Terms](https://www.thingiverse.com/legal/api) — bulk storage, scraping and competitive-use restrictions.
- **[VL-24]** OSHWA, [Certification Process](https://certification.oshwa.org/process.html) — hardware, software, documentation and branding rights layers.

### Cultural collections and photography

- **[VL-11]** Wikimedia Commons, [About](https://commons.wikimedia.org/wiki/Commons%3AAbout?uselang=en-gb) and [Statistics](https://commons.wikimedia.org/wiki/Commons%3AStatistics) — mission and April 2026 scale.
- **[VL-12]** Wikimedia Commons, [Structured Data](https://commons.wikimedia.org/wiki/Commons%3AStructured_data/en) and [Deletion policy](https://commons.wikimedia.org/wiki/Commons%3ADeletion_policy) — multilingual statements, references/qualifiers and rights review.
- **[VL-13]** Flickr Foundation, [Flickr Commons](https://www.flickr.org/programs/flickr-commons/) and [FAQ](https://www.flickr.org/programs/flickr-commons/flickr-commons-faq/) — institutional network, scale and community activity.
- **[VL-14]** Smithsonian, [Open Access](https://www.si.edu/openaccess) — current 5.1-million-item scale, institutions and developer tools.
- **[VL-15]** Smithsonian, [Open Access FAQ](https://www.si.edu/openaccess/faq) — CC0 formats/API and exclusions for copyright, contracts, sensitivity and third-party rights.
- **[VL-16]** Metropolitan Museum of Art, [Open Access](https://www.metmuseum.org/de/hubs/open-access) and [open-data repository](https://github.com/metmuseum/openaccess) — 492,000+ images, API/CC0 and correction posture.
- **[VL-17]** Digital Public Library of America, [Cultural Heritage Transition](https://www.dp.la/about/a-new-home-for-americas-digital-heritage) and [About](https://dp.la/about) — 50-million-item program, partner network and durable-home transition.
- **[VL-18]** Library of Congress, [Free to Use and Reuse](https://www.loc.gov/free-to-use/) and [copyright guidance](https://www.loc.gov/legal/understanding-copyright/) — curated reuse sets and rights limits.
- **[VL-19]** Internet Archive, [October 2024 services update](https://blog.archive.org/2024/10/21/internet-archive-services-update-2024-10-21/) — cyberattack recovery and availability incident.
- **[VL-25]** Flickr Foundation, [No known copyright restrictions](https://www.flickr.org/programs/flickr-commons/no-known-copyright-restrictions-how-it-works/) — limits of the Commons rights statement.
- **[VL-26]** Glass, [About](https://glass.photo/about) and [Membership](https://glass.photo/membership) — member-funded model and photography features.
- **[VL-27]** Pixelfed, [home](https://pixelfed.org/) — open-source federation, photo/video and social/safety features.

### Adjacent communities

- **[VL-28]** YouTube, [Google Podcasts migration announcement](https://blog.youtube/news-and-events/podcast-destination-on-youtube-music/) and [migration tools](https://blog.youtube/news-and-events/migrating-your-podcasts/) — discontinuation and OPML/RSS migration.
- **[VL-29]** *Los Angeles Times*, [SiriusXM shuts down Stitcher podcast app](https://www.latimes.com/entertainment-arts/business/story/2023-06-27/siriusxm-shuts-down-stitcher-podcast-app-amid-industry-consolidation) — app shutdown after consolidation.
- **[VL-30]** Podcasting 2.0, [Podcast Namespace](https://podcasting2.org/docs/podcast-namespace/1.0) — open RSS extensions.
- **[VL-31]** MusicBrainz, [About](https://musicbrainz.org/doc/About) and [Data License](https://musicbrainz.org/doc/About/Data_License) — CDDB commercialization history, nonprofit/open-data response, licenses and media separation.
- **[VL-32]** MetaBrainz Foundation, [About](https://metabrainz.org/about) — nonprofit governance, peer review, identifiers and funding.
- **[VL-33]** MusicBrainz, [Database statistics](https://musicbrainz.org/statistics) — current entity/editor/tag scale, last updated 2026-07-09.
- **[VL-34]** FamilySearch, [About](https://www.familysearch.org/en/home/about/) and [Why FamilySearch is free](https://www.familysearch.org/en/united-states/whyfamilysearchfree) — nonprofit mission and scale.
- **[VL-35]** FamilySearch, [Privacy Notice](https://www.familysearch.org/en/legal/privacy) — living-person and sensitive family-data controls.
- **[VL-36]** FamilySearch, [record-access restrictions](https://www.familysearch.org/en/help/helpcenter/article/why-are-there-access-restrictions-on-historical-records) and [Terms](https://www.familysearch.org/en/legal/terms) — contract/privacy restrictions and reuse limits.
- **[EFS-LAW]** EFS planning, [[law-positioning]] — public permanence, visible graph and personal-data boundary.
