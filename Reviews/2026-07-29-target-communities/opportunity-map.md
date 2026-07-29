# EFS target-community opportunity map

**Status:** completed comparative synthesis; market recommendation only, not an owner ruling or design amendment
**Date:** 2026-07-29
**Read with:** [[research-method]], [[requirements-and-first-apps]], and the source-indexed community reports in this folder

#status/done #kind/research #repo/planning #topic/use-cases #topic/content #topic/market-research

## How to read this map

This is deliberately broader than the final shortlist. It distinguishes outcomes that a flat list would hide:

- **Community prospect:** a recurring group could plausibly contribute to and consume one shared EFS graph.
- **Proof corpus:** a bounded collection is useful for falsifying the product, but does not by itself prove recurring adoption.
- **Complement:** EFS can add durable identity, receipts, mirrors, or releases beneath an incumbent without replacing it.
- **Catalog/manifest only:** the metadata, hashes, and provenance are valuable, but ordinary bytes are not safely redistributable.
- **No-go first:** permanence makes the community's normal rights, privacy, safety, or removal model worse.

The serious community prospects are scored below. Every one is **`UNVALIDATED`**: no steward has committed a corpus, integration owner, operating budget, or recurring participation. The broader scan is not scored because numerical precision would add little after a risk gate has already ruled out the obvious adoption shape.

## Comparative scorecard

The vector order is:

`loss / rights / EFS advantage / seedability / small-team product / network effect / economics / gallery pressure`

Each component is 0–5 and converts to the weighted total defined in [[research-method]]. Scores compare realistic recruitable subsets, not idealized rights-cleared corpora. The uncontacted-steward cap is 2/5. A risk or economics gate overrides the number.

| Validation rank | Actual community prospect and bounded first corpus | Vector | Score | Readiness and decisive test |
|---:|---|---:|---:|---|
| 1 | **Independent wiki migration admins and hosts** — one opted-in, rights-reviewed MediaWiki fork | `4/4/5/2/4/4/5/2` | **76** | **UNVALIDATED.** Best bounded one-community test. It wins only if admins value shared revision ancestry/plural successor views beyond a tested dump, signed manifest, object-store copies, and torrent. |
| 2 | **Public-data rescue coalitions** — two independent operators working on the same reviewed static, non-personal datasets | `5/3/5/2/4/5/3/2` | **76** | **UNVALIDATED.** Strongest mainstream prospect. It wins only if the second institution contributes useful receipts and both accept the recurring bill; one EFS-authored catalog copy is failure. |
| 3 | **OSHWA/open-hardware creators and builders** — 25+ creators publishing 50+ complete, low-risk releases | `4/4/4/2/3/5/4/5` | **75** | **UNVALIDATED.** Clear identifiers, release boundaries, remixes, and build/test evidence. It must beat OSHWA UID + Git/Zenodo + replicated signed manifests and exclude hazardous first categories. |
| 4 | **Open-game mod maintainers** — one opted-in collective publishing redistributable, publisher-authorized releases | `4/3/5/1/3/5/3/4` | **69** | **UNVALIDATED.** Recurring exact releases and compatibility evidence are more community-shaped than a generic playable collection. Rights, malware, withdrawal, dependency, and package-manager scope are hard gates. |
| 5 | **Furry and independent-illustrator collective** — creators publish only their own deliberately permanent work | `4/3/5/1/1/5/3/5` | **66** | **UNVALIDATED.** Highest-upside true gallery network, lowest readiness. The community enters a pilot only if creators choose permanence after informed review and independent curators, mirrors, index, and serving operations commit. |

The first **gallery proof corpus** is separate: one consent-bearing Data Lifeboat or rights-cleared local-history collection. It should exercise 1,000–10,000 images, dense tags, derivatives, Views, mirror failure, and reconstruction. It becomes a community prospect only if a steward wants continuing curation after export.

The numeric tie between wikis and public data is broken by validation cost: one wiki authority group can offer a bounded corpus, whereas the public-data thesis needs two independent institutions contributing to the same releases. The ordering is conditional, not a product commitment.

## Broad community scan

| Community or content shape | Representative websites/apps/projects | What people actually value | Credible EFS home | Judgment |
|---|---|---|---|---|
| Community photography and local-history collections | Flickr groups and albums; Flickr Foundation Data Lifeboat; small museums and historical societies | captions, creator/context, album order, licenses, social history, durable public access | consent-based lifeboat with exact manifest, browser-readable export, mirrors, and curator Views | **Top proof corpus; community only with recurring steward** |
| Public-data rescue | Data Rescue Project, EDGI, Harvard LIL, DataLumos, Source Cooperative, Internet Archive, Webrecorder | exact captures, source/time, versions, catalogs, preservation, coordination across repositories | receipt and mirror graph above existing stores | **Top community validation/complement** |
| Research data and reproducibility | Zenodo, Dryad, Dataverse, OSF, Figshare, institutional repositories | DOI, curation, versions, access policy, code/data/environment closure | opt-in release capsule referencing the repository DOI | **Strong complement** |
| Independent wiki migrations | Fandom exports, Weird Gloop, independent MediaWiki hosts and alliances | community governance, revision/attribution history, pages, templates, portable domain and identity | fork-proof snapshot and attribution layer reconstructable into MediaWiki | **First community validation/complement** |
| Open hardware and 3D maker releases | OSHWA certification, open-science hardware, makerspaces, Thingiverse-shaped communities | complete editable releases, certification UIDs, remixes, builds, calibration, compatible parts and mirrors | release vault beneath OSHWA/Git with source/derivative lineage and independent build receipts | **Top-five validation; low-risk categories only** |
| Creator illustration and furry art | Fur Affinity, Pixiv, DeviantArt, ArtStation, Newgrounds | creator identity, galleries, commissions, follows, tags, characters, ratings, cross-posting | creator-signed releases plus community tagging and mirrors | **Top-five validation after operations gate** |
| Community boorus | Danbooru, e621/e926, Philomena sites, szurubooru | exhaustive metadata, source recovery, aliases, implications, notes, pools, duplicate relations, blacklists | booru interface over **creator-authorized** objects; curators publish facts, not somebody else's bytes | **Product model, not seed corpus** |
| High-volume hentai/porn rehosting | Gelbooru, Rule34.xxx, many booru clones | breadth, explicit search vocabulary, anonymous low-friction browse | source catalog/hashes only where lawful | **No-go bytes** |
| Ephemeral imageboards | 4chan and descendants; independent archives | live anonymous thread culture, ephemerality, remix and selected folklore | reviewed museum-like editions of lawful artifacts and context | **No-go firehose; curated sliver only** |
| Federated visual social services | Pixelfed and ActivityPub instances | local governance, federation, albums, follows, comments | durable-edition export beneath the social service | **Operator integration** |
| Personal media catalogs | Hydrus Network and local DAM tools | private ownership, large local libraries, tags, subscriptions, dedupe | selective local-to-public promotion with a permanence ceremony | **Strong importer; never bulk-public by default** |
| Adult illustration and creator-owned erotic media | Pixiv R-18/FANBOX, Fur Affinity, Newgrounds, independent creators | artistic freedom, durable audience links, specialized tags, creator control | separately governed opt-in public releases after prepublication review | **Valid later pilot** |
| Adult indie games and interactive fiction | itch.io creators, Newgrounds, independent studios | downloadable versions, screenshots, credits, compatibility, payment-independent ownership | exact public/demo packages, catalog, test receipts, mirrors | **Strong lane inside playable commons** |
| Commercial live-action adult media | studios and specialist platforms | creator income, identity/age/consent control, piracy response, rapid takedown | at most public trailers and non-sensitive catalog commitments under a specialist operator | **No-go first-party host** |
| Private kink/social communities | FetLife and private groups | sensitive profiles, relationships, events, access controls, consent withdrawal | perhaps future private/local export research; not a public graph | **Public EFS mismatch** |
| Original and authorized webcomics | creator sites, Newgrounds, Webtoon/Tapas creators; MangaDex as reader/schema teacher | sequence, language editions, creator/group credit, fast pages, discovery | creator/publisher-authorized serial editions and translations | **Promising rights-cleared gallery** |
| Scanlation | MangaDex and scanlation groups | multilingual access, group identity, title/chapter metadata, responsive reader | translation/catalog overlays without restricted source pages | **No-go mirror** |
| Fanfiction | AO3, FanFiction.Net, Open Doors | author/pseud control, rich tags, comments, collections, inclusion, downloads | creator-opted release capsule or consented rescue below the social archive | **Complement only** |
| Mods and modpacks | Nexus Mods, ModDB, CurseForge | exact files, dependencies, compatibility, authorship, changelogs, testing, community and rewards | opt-in release manifests, mirrors, and curator compatibility evidence | **Strong complement; malware/rights gate** |
| Speedruns | speedrun.com, Twitch, Speed Demos Archive | evidence, exact rules/categories, moderator legitimacy, historical leaderboards | runner-owned evidence capsule linked from the leaderboard | **Strong complement** |
| Emulation catalogs | MAME, No-Intro, Redump | exact hashes, dump method, verification, hardware relations and catalog completeness | DAT/checksum and verification graph plus authorized packages | **Catalog/manifest only for commercial bytes** |
| ROM and abandonware libraries | informal ROM sites and archives | access to unavailable software, complete sets, emulator convenience | metadata and lawful-source status, not presumed-abandoned bytes | **No-go byte library** |
| Web-game preservation | Flashpoint Archive, Ruffle, Newgrounds | obsolete runtimes, playable packages, metadata, patches, removal policy | rights-cleared subset and exact runtime/package receipts | **Partner/teacher; no wholesale ingest** |
| Zines, small press, queer/community archives | QZAP, community libraries, local presses, convention archives | scarce issues, contributor context, covers/pages, independent stewardship | permissioned issue packages, OCR derivatives, citations, curator essays | **Partner-led pilot** |
| Independent music, DJ, and sample culture | Bandcamp artists, netlabels, Internet Archive collections, MusicBrainz/Discogs-style catalogs | editions, credits, liner notes, sample provenance, playable previews, sales and community | creator-authorized release/liner-note capsule; catalog-only for uncleared samples | **Complement; rights chain is the constraint** |
| Podcasts, radio, and oral history | podcast feeds, community radio, oral-history collections | feed continuity, episode media, transcripts, guests, citations, preservation | consented exact episode collections with transcript derivatives and mirrors | **Promising small-archive cluster; subject consent gate** |
| Open maps and static geodata | OpenStreetMap extracts, Natural Earth, NOAA, USGS | time-specific releases, region, CRS, attribution, tiles and diffs | static atlas-release ledger with manifests and mirrors | **Complement; do not replace live OSM** |
| Citizen science and biodiversity | iNaturalist, GBIF | observations, photos, taxonomic review, licenses, research snapshots | steward-approved, coarse-location snapshot manifest | **Interesting gallery; exact-location risk** |
| Open cultural heritage | Wikimedia Commons, Europeana, Smithsonian Open Access, institutional IIIF collections | public/open media, attribution, provenance, multilingual description, derivatives | exact exhibition/collection Views and mirror receipts | **Excellent benchmark; incumbents already strong** |
| Product evidence and recipes | Open Food Facts, Open Beauty Facts, community recipe collections | source photos, revisions, ingredients, taxonomies, provenance, local/mobile capture | creator/observer-signed source evidence plus independently curated facts | **Excellent fixture; weak displacement pain** |
| Public records and civic documents | MuckRock, DocumentCloud, local newsroom archives | OCR, redaction, source request, annotations, projects, embeds and stable evidence | selected public-release receipts after newsroom/legal review | **High value, high personal-data gate** |
| Investigative leaks | ICIJ public releases, OCCRP Aleph, SecureDrop-backed reporting | secure intake, source protection, entity search, access control, public evidence | exact manifests for deliberately public, licensed outputs only | **Private leaks no-go** |
| ML datasets | Hugging Face Datasets, Kaggle, research scrapes | versions, dataset cards, viewers, notebooks, compute, safety/rights response | dataset bill of materials and lawful component receipts | **Manifest-first; scraped media bytes no-go** |
| Family history and genealogy | Ancestry-like trees, GEDCOM tools, family photo collections | relationships, records, identity, living-person privacy, source citations | private/local bundle or public-domain historical-source collection | **Public personal graph no-go first** |
| Dead-platform diasporas | Tumblr/Imgur removals, GeoCities and forum archives, personal-site migrations | old links, embedded media, community context, identity continuity | owner-initiated site/media lifeboat or curated collection | **Promising only with consent and rights review** |
| High-risk health, education, or case data | government portals, research cohorts, court and service records | continuity, accountability, analysis | carefully reviewed aggregate/public release commitments at most | **Raw personal data no-go** |
| Software, Git, and agent artifacts | forges, package registries, skill/model release catalogs | exact versions, dependencies, signatures, mirrors, reproducibility | durable repo/package identities and portable release graphs | **Strong EFS fit already tracked in a separate active brief** |

## Patterns the broad scan reveals

### 1. The best seed is governed, not merely large

A named librarian, wiki admin group, archive curator, or creator collective can review 1,000–10,000 objects and own the inclusion policy. A giant scrape can create more objects and less legitimacy.

### 2. EFS wins below a living community before it wins instead of one

Flickr, MediaWiki, speedrun.com, Nexus, Zenodo, and Pixelfed already supply interfaces and institutions people understand. An export, receipt, release, or mirror layer can deliver EFS's differentiator without first recreating search, comments, payments, moderation, or mobile apps.

### 3. The network effect should attach to durable evidence

The compounding contributions are:

- a new verified mirror for the same bytes;
- a tag correction with provenance;
- a compatibility or reproduction test;
- a translation or annotation tied to an exact version;
- a citation or collection placement;
- a newer capture linked without erasing the old one; and
- an independently reconstructable View.

Votes, feeds, recommendations, and comments can still exist, but they are not the only reason the corpus becomes more useful.

### 4. Adult content validates the need and raises the bar

Adult illustrators and game creators have unusually clear platform and payment fragility. They also demonstrate why the intake path, serving operator, age/content policy, prohibited-content rules, rights roles, and honest withdrawal vocabulary must exist before public permanence. The market is valid; a permissive rehosting firehose is not.

### 5. “Open” does not always mean “in pain”

Wikimedia Commons, OpenStreetMap, Open Food Facts, GBIF, Zenodo, and similar projects are excellent benchmarks and possible partners. Their exportability and governance reduce the displacement urgency that makes a first user adopt a new system. EFS must offer an exact incremental advantage rather than sell openness to communities that already practice it.
