# Music, zines, and dead-platform diasporas

**Status:** completed point-in-time community research; evidence current through 2026-07-29; recommendations are analysis, not an owner ruling or legal advice
**Scope:** Bandcamp and SoundCloud; DJ/sample, tracker, chiptune and demoscene archives; queer and small-press zines; GeoCities, Yahoo Groups, Google+ and Cohost
**Read with:** [target-community research method](research-method.md), [joined use-case corpus](../2026-07-25-joined-fs-pass-corpus/use-cases.md), [apps cookbook](../../Designs/efsv2/apps-cookbook.md), and [law positioning](../2026-07-11-privacy-pass-corpus/law-positioning.md)

#status/done #kind/research #repo/planning #topic/use-cases #topic/content #topic/market-research #topic/music #topic/preservation

## Executive finding

This cluster contains four different opportunities:

1. **A rights-cleared tracker/chiptune/demoscene gallery is the best small, technically vivid pilot.** Files are compact, playable, deeply taggable and culturally connected to preservation. Existing archives prove multi-mirror longevity. The catch is decisive: old tracker files and their samples are not automatically redistributable, and The Mod Archive's default distribution permission does not transfer to EFS.
2. **Artist-owned permanent music editions are a credible Bandcamp/SoundCloud complement, not a marketplace replacement.** Artists understand acquisition, account and takedown risk, but they also need commerce, royalties, fan communication and discovery. EFS can preserve an edition only when every relevant right is cleared and the artist deliberately chooses irrevocability.
3. **A platform-exit capsule is a compelling tool but not a license to publish a diaspora.** GeoCities, Yahoo Groups, Google+ and Cohost show repeated shutdown loss. They also show why emergency crawls are ethically and operationally hard: private posts, replies, reblogs, images, pseudonyms and abandoned accounts do not all have one publisher or one consent state.
4. **Zines align with EFS's preservation values but often conflict with its permanence.** Queer, personal and political zines can contain pseudonymous, intimate and historically contextual material. Libraries explicitly distinguish preservation from permission to digitize publicly. The lawful wedge is contemporary, creator-opted-in small press—not a mass scan of a physical collection.

None of these displaces the stronger cross-corpus candidates—independent wiki forks, opt-in mod releases and speedrun evidence—but the tracker/demoscene gallery may be the fastest way to prove an enjoyable media browser with a bounded lawful corpus.

## Candidate matrix

| Cluster | Mission and culture | Operations and scale | Rights shape | What EFS lacks | Credible EFS role | Verdict |
|---|---|---|---|---|---|---|
| Bandcamp artists and labels | Direct artist support, ownership, high-quality downloads, human/editorial discovery, physical and digital releases | Marketplace, payments/tax, downloads/streaming, follows, messaging, editorial, merch, codes, analytics; millions of annual sales | Artist-controlled uploads, but compositions, performances, samples, covers, artwork and collaborators have separate rights | Payments, royalties, tax, storefront, follows, messaging, editorial, discovery, customer support, transcoding and mobile apps | Artist-signed permanent edition beneath the store; CC/cleared stems and sample packs | **Complement only** |
| SoundCloud producers and DJs | Rapid publishing, sharing, feedback, embedding, remixes and scene discovery | Streaming/transcoding, feeds, follows, comments, reposts, messaging, statistics and copyright enforcement | Original tracks coexist with uncleared samples, mixes and remixes; uploader rights vary track by track | The entire social graph, player/CDN, content matching, moderation, messaging, stats and monetization | Opt-in archive of wholly owned/cleared tracks; local export before termination | **Pain is real; rights are a severe filter** |
| Tracker/chiptune/demoscene | Technical artistry, party/group credit, source-like music files, cultural preservation, playable history | Volunteer archives, university hosting and mirrors, competitions, file browsers, metadata projects, in-browser/local players | Many scene releases are author-created; legacy licenses and embedded samples can be ambiguous; crack-scene adjacency adds restricted-source hazards | Format players, sample inspection, party/group authority, tag search, moderation, rights review | Rights-cleared gallery/player with exact modules, sample provenance and multiple archive lenses | **Best small pilot in this file** |
| Zines and small press | DIY publishing, marginalized voices, contextual/community history, physicality and creator autonomy | Volunteer/library collections, cataloging, donations, limited digitization, metadata and researcher access | Copyright remains with creators unless explicitly waived; subjects and pseudonyms may require contextual consent | Scanning/OCR, sensitive-data review, institutional access policy, withdrawal/context work, creator outreach | Opt-in contemporary edition archive and catalog integrity layer | **Values fit, weak first-10k path** |
| Dead-platform users and web archivists | Rescue cultural memory, preserve personal publishing and community history | Emergency volunteer crawls, WARC capture, Wayback playback, user exports, static-site tools, institutional hosting | Public visibility is not blanket republication permission; private/group data and third-party replies are especially hazardous | Crawler/playback stack, web rewriting, full-text search, moderation/removal desk, legal institution, massive storage | Creator-side exit capsule; WARC fixity and mirror receipts; consented public collections | **Tool/partner opportunity, not scrape-first community** |

## 1. Bandcamp, SoundCloud, DJs and sample communities

### Community and operating reality

Bandcamp is more than audio hosting. Its artist product supplies a customizable store, marketplace discovery, fan collections, follows and notifications, direct fan messaging, sales history, human support, listening parties, editorial coverage, download codes, physical merchandise and payment/tax handling. It says fans bought 15.7 million digital albums and 11.4 million tracks in the preceding year, and that artists receive 82% of a sale on average. [MU-01]

That incumbent quality should make EFS humble. A file browser plus crypto address is not a substitute for an artist business.

The loss signal is nonetheless explicit. Bandcamp changed owners from Epic Games to Songtradr in 2023. [MU-02] Its current terms say artists retain ownership and must own or control all rights in the music, compositions, performances, artwork and likenesses they upload. They also say purchased content is not guaranteed to remain available: infringement claims or an artist removal can eliminate future access, so fans are encouraged to download promptly to their own devices. [MU-03] The high-quality local download already gives a fan a substantial walk-away path; EFS's incremental value would be public provenance and community mirrors, not basic possession.

SoundCloud similarly says uploaders own and control their content and must hold all necessary rights. Audio removal deletes the relevant files from SoundCloud's systems, account termination can irretrievably delete content and activity data, and SoundCloud advises users to back up first. [MU-04] Its copyright process issues strikes after unresolved takedowns and permanently terminates accounts with more than two strikes. [MU-05]

For DJs, remixers and sample-based producers, “I made this file” is not a complete rights answer. A mix can involve:

- underlying compositions;
- master sound recordings;
- performances and neighboring rights;
- samples, acapellas and stems;
- cover artwork and photography;
- collaborator or label contracts; and
- territory-specific collection-society obligations.

An EFS product must not convert SoundCloud's repeat-infringer pain into “upload the same mix somewhere untakeable.” That would target legal evasion rather than artist durability.

### Credible wedge: artist-signed permanent editions

**Adoption shape:** permanent home and integrity layer beneath existing commerce.

An edition object should include:

- artist/label principal and collaborator roles;
- track order, ISRC or other identifiers where applicable;
- composition, recording, artwork and sample/cover rights evidence as separate claims;
- lossless masters, listener encodes, artwork, liner notes and lyrics only within the granted scope;
- release date, label, territory or audience restrictions if any;
- explicit permission for indefinite public redistribution and mirroring;
- source storefront and purchase/support links;
- exact release generation, replacement/supersession records and mirror inventory; and
- stems/sample packs with their own licenses, not inherited from the album by implication.

Bandcamp can remain the store and fan relationship. Its purchase page can point to an EFS edition if the artist chooses, or a fan can verify that a downloaded file matches the artist-signed release.

**First 10,000 seed objects:** a cooperative independent label, netlabel or group of artists that already publishes under Creative Commons or an explicit redistribution license. Ten thousand objects can represent a few hundred releases once tracks, artwork, liner notes, encodes, stems and rights assertions are typed separately. Do not scrape Bandcamp or SoundCloud, and do not treat a fan's purchased download license as permission to republish.

**Demo:** an artist publishes one album and one sample pack; the app derives labeled listener previews, streams from a mirror with range verification, filters by genre/instrument/license, links to the artist's store, proves two downloaded encodes belong to the same release generation, and shows a second curator's playlist without changing artist metadata.

### Requirements and breakpoints

| Need | EFS pressure | Current gap or hazard |
|---|---|---|
| Lossless masters and streaming previews | R-BA1/2/3/8 verified large bytes, mirrors and range reads | Transcoding, waveform generation, adaptive streaming and cache/CDN operations are not EFS kernel features |
| Rights and collaborator provenance | typed roles, license/permission evidence, signatures | A self-attestation does not resolve disputed samples or contracts |
| Album/track/version structure | exact manifests, typed membership and supersession | Strong fit |
| Discovery | tags plus enhanced/off-chain R-QC10 search and recommendations | Genre is socially contested; popular/trending/editorial surfaces need people and an index |
| Commerce | external purchase/support link | EFS should not become a global payment, tax, royalty and refund service for the first app |
| Fan relationships | conventional newsletter/follow service | Follows, private fan data, messages and notifications should not be permanent public graph records by default |
| Moderation and claims | serving-layer deny/advisory records | Kernel bytes cannot be removed when rights evidence proves false |
| Affordable publishing | R-MODE3 sponsorship; mirror-first byte placement | Audio catalogs are larger than text; community mirror funding must be explicit |

**Fatal risks:** unclear samples or covers, label/collaborator conflicts, and marketing EFS as a haven from copyright strikes. The safe pitch is positive authorization, not anti-takedown defiance.

## 2. Tracker, chiptune and demoscene archives: a vivid gallery with a licensing catch

### Community and operating reality

The demoscene is an active international community of programmers, visual artists and musicians organized around productions, groups and demoparties. Scene.org links a file archive, news service, identity service, Demozoo, Pouët and event/community sites. [MU-06] Its file archive includes demos, graphics, magazines, music, parties and mirrors. [MU-07]

The `got papers?` preservation project says Scene.org's file server has operated since the mid-1990s, is hosted by the University of Rotterdam and has mirrors in several countries. Its physical-artifact scans carry metadata about material, age, size, donor and creation context. [MU-08] That is almost an existence proof for the EFS mirror-and-provenance story, while also showing that committed institutions and volunteer catalogers—not a storage abstraction alone—create longevity.

Tracker modules are especially attractive gallery objects:

- compact compared with rendered audio;
- playable while retaining patterns, instruments and samples;
- richly classifiable by format, platform, tracker, artist/group, party/competition, rank, year, genre and technical constraints;
- suitable for waveform, pattern and sample visualizations; and
- hash-deduplicable at both module and sample levels.

Scene.org's 2026 news stream shows a living culture of new party releases, tracker-radio shows and browser-playable playlists. [MU-09] A particularly instructive console-cracktro preservation effort extracts the scene-authored intro from patched commercial games and removes proprietary game data before publishing a standalone artifact. [MU-10] That is the kind of content separation EFS should reward.

### The license trap

Legacy availability is not the same as transferable permission. In a Mod Archive forum clarification, a moderator says the default “Mod Archive Distribution” status is not public domain and recommends asking the author; the site's original administrator explains that the permission lets The Mod Archive redistribute the upload but does not transfer redistribution rights to others. Public-domain and Creative Commons tracks are separately searchable. [MU-11]

Samples embedded in modules may have been copied from commercial songs, games, sample CDs or other modules. An author may control the composition but not every embedded sound. Demos and cracktros can also contain proprietary platform firmware, fonts, music or game data. Therefore an EFS crawler cannot copy an existing tracker archive just because the files are small and old.

### Credible wedge: a rights-cleared pattern gallery

**Adoption shape:** permanent home for new/cleared scene releases and integrity layer for existing archives.

Each release should carry:

- exact module or executable bytes and format;
- artist/group identities and party/competition context;
- source archive and original release package;
- instrument/sample inventory and hashes;
- provenance and license for each sample where known;
- platform/runtime/player compatibility;
- screenshots or pattern/waveform previews, labeled as derived;
- content warnings;
- mirror inventory and test attestations; and
- curator tags whose provenance remains visible.

**First 10,000 seed objects:** new demoparty submissions whose rules explicitly authorize permanent redistribution; existing CC/public-domain modules; or direct artist opt-ins. A few thousand modules plus their artist, event, format, sample, preview and attestation objects can reach a meaningful 10,000-object graph. The seed steward should be a demoparty, netlabel or archive operator—not EFS scraping The Mod Archive's default-license catalog.

**Demo:** a fast browser gallery of 100–1,000 modules with in-browser playback, pattern and sample views, artist/group/party navigation, format and license filters, duplicate-sample lookup and two competing genre-tag lenses. Export the exact module and player generation; fail one mirror and verify the fallback.

### Requirements and breakpoints

| Need | EFS pressure | Current gap or hazard |
|---|---|---|
| Small playable binary/music objects | R-BA1 verified bytes, R-BA2 mirrors, package generations | Strong economic and technical fit |
| Party/group/release relationships | R-QC1 exact enumeration, R-QC2 typed backlinks | Strong fit; canonical external identifiers/import mapping needed |
| Dense media browsing | tag assertions, bounded intersections, thumbnails/previews | Off-chain search, genre aliases and quick player UX still required |
| Many file formats | pinned player/runtime packages and compatibility attestations | Browser player coverage and secure executable playback are application work |
| Sample provenance | content-hash lookup, typed sample membership, rights evidence | Historical sample origin may be unknowable; “unknown” must not become “cleared” |
| Credits and handles | principal/role claims and curator lenses | Mapping decades-old scene handles to current keys must remain evidence, not identity fiat |
| Rights review | opt-in and explicit CC/PD license | Existing archive permission is not automatically transferable |

**Fatal risk:** importing an attractive legacy archive whose default license does not authorize EFS redistribution, or permanently publishing a module with uncleared commercial samples. A small new-submission pilot is safer and more useful than a large ambiguous scrape.

## 3. Zines and small press: preserve with creators, not over them

### Community and operating reality

The Queer Zine Archive Project (QZAP), launched in 2003, describes its mission as a living-history archive of queer zines, built with a collectivist approach, free searchable metadata and downloadable digital copies. It is a labor-of-love project partly supported by donations. [MU-12] Its archive supports title, creator, year and location search and aims to use an emerging metadata standard, including browse-by-place-created relationships. [MU-13]

Large physical collections show the unmet cataloging opportunity. Seattle Public Library's ZAPP collection holds more than 30,000 zines, minicomics and small-press titles, including queer/trans, BIPOC and youth voices; access is in-library and many discovery surfaces are curated lists. [MU-14]

But Barnard Zine Library states the critical boundary directly: all zines are copyrighted unless they contain an anti-copyright statement; researchers may make personal copies, but should not publish images or substantial text publicly without making every effort to secure creator permission. [MU-15]

Zines also challenge a simplistic “public forever is empowering” story. A 1990s personal zine may name a pseudonymous queer author, abusive family member, medical condition, address, workplace or other person who never expected global indexed permanence. Physical circulation and even a library reading room create context and friction that an unbounded public ledger removes.

### Credible wedge: creator-opted-in digital editions

**Adoption shape:** permanent home for contemporary creator-approved editions; integrity/catalog layer for restricted physical collections.

For newly published or affirmatively licensed zines, EFS can hold:

- issue, series, creator/publisher and edition metadata;
- place and date created, language, topic and format;
- page-image/PDF/OCR relationships, with OCR clearly derived and correctable;
- license, anti-copyright or explicit permanent-distribution permission;
- subject-consent and pseudonym review statement;
- physical holding/catalog references;
- content warnings and appropriate audience notes; and
- mirrors and exact printable edition.

For historical or uncontactable zines, EFS may hold only public catalog metadata, a rights/permission state and links to the steward. It should not imply that “difficult to locate” means “safe to scan.”

**First 10,000 seed objects:** possible only through a contemporary small-press/zine festival or publisher network whose creators opt in. One thousand issues can yield ten thousand meaningful issue/page/creator/topic/license objects, but outreach and review are the work. A mass library scan is not a credible shortcut.

**Demo:** a consented set of 100 issues with cover gallery, creator/series/place/topic browse, verified PDF and print layout, OCR search through a rebuildable enhanced index, and a visible permission/context card. Show catalog-only records for non-digitized holdings without manufacturing missing bytes.

### Requirements and breakpoints

| Need | EFS pressure | Current gap or hazard |
|---|---|---|
| Scans, PDFs and OCR | R-BA1/2/3 verified byte layers; typed derivation | Scanning, color management, OCR correction, accessibility and page viewer are application work |
| Contextual metadata | tag definitions, typed people/place/series relations, competing lenses | Sensitive labels and person links can themselves create permanent harm |
| Consent and rights | R-PRIV2 class-specific intake, explicit license evidence | Consent can be partial and contextual; permanent publication may remain inappropriate |
| Search | off-chain full text plus bounded catalog filters | Search must respect catalog-only versus public-byte states |
| Physical/digital linkage | stable catalog identifiers and holding claims | Institution still owns catalog/access workflow; EFS should complement it |

**Fatal risks:** outing or deanonymizing creators/subjects, treating library custody as copyright permission, and erasing the cultural value of controlled/contextual access. This is an opt-in publishing community, not an archive-rescue free-for-all.

## 4. Dead-platform diasporas: build the lifeboat before the fire

### Repeated loss pattern

Four shutdowns illustrate different failure modes:

| Platform | What happened | Preservation lesson | EFS warning |
|---|---|---|---|
| GeoCities | Yahoo announced closure in 2009; volunteer crawls ran for months and recovered a large but imperfect corpus. Parallel archives captured different subsets. [MU-16] | Personal pages dismissed as low-quality were culturally valuable; multiple independent captures reduced loss | Public pages still contained other people's copyrighted and personal material; emergency scraping is not informed permanent-publication consent |
| Yahoo Groups | The 2019–2020 shutdown removed messages, files, photos, polls and calendars. Yahoo's export omitted material; ArchiveTeam says the result is partial and some captured data cannot safely be public because of privacy. [MU-17] | Export completeness, attachment closure and group context matter; late rescue leaves irrecoverable gaps | **Private and restricted groups are a bright red line for EFS.** Membership access never authorizes a member to publish everyone permanently |
| Google+ | Google told consumers it would shut accounts/pages and begin deleting posts, photos and videos on 2019-04-02, directing users to download before then. [MU-18] | Even a global company can delete a social product and its graph; exports need an independent destination | User export contains interactions and identifiers from other people; “my archive” is not wholly “my content” |
| Cohost | Staff announced closure due to funding and burnout, shifted immediately to exports, promised deletion rather than data sale, and invited ArchiveTeam to preserve public posts. Stripe policy changes had also forced cancellation of a planned revenue feature. [MU-19] ArchiveTeam coordinated with staff, completed a public crawl, and Cohost redirected to Wayback in January 2025. [MU-20] | Cooperative shutdown, export and archive coordination are much better than an adversarial last-minute scrape; static community tools let users republish their own work | Some users explicitly valued deletion; public/archive cooperation still does not mean every user chose EFS-style irrevocability |

ArchiveTeam itself is a volunteer collective organized around shutdowns, mergers and deletion, with distributed crawls and urgent project triage. [MU-21] The Wayback Machine already gives saved pages stable links and works with ArchiveTeam and institutional Archive-It crawls. [MU-22] Internet Archive also runs copyright removal and counter-notice processes. [MU-23] EFS should not claim to “replace the Internet Archive” while lacking its crawler, playback, policy and legal operations—and while making kernel deletion impossible.

### What the diaspora actually needs

A person leaving a platform usually wants several different things:

- a faithful private backup;
- a public personal-site version of posts they authored;
- redirects from old URLs;
- retained media, alt text, tags and dates;
- outbound links and attributions;
- perhaps selected comments/reblogs with their authors' permission;
- a list of people to follow elsewhere;
- an export that remains usable without the original service's JavaScript;
- search; and
- the ability to leave some material behind.

Only some of that belongs on EFS. Private backups, follows, block lists, direct messages, drafts and sensitive account records should ordinarily remain local or encrypted; even encrypted graph shape can reveal associations. Third-party comments and reblogs require separate rights and consent analysis.

### Credible wedge: the creator-side exit capsule

**Adoption shape:** local-first lifeboat with optional, selective permanent publication.

The tool should:

1. import an official export, WARC or supported platform format;
2. classify authored posts, third-party content, private material, personal data, uncertain embedded media and missing dependencies;
3. render a local static preview;
4. let the user exclude or redact at object level before any public record exists;
5. request explicit, second-step permanence consent for each selected collection;
6. publish an EFS manifest and rights/attribution record for the user's own selected work;
7. keep a portable local `.efs-bundle` whether or not the user publishes; and
8. output redirects or a static site that can run on ordinary hosting.

The useful invention is not a universal crawler. It is a **consent-aware compiler from fragile platform export to durable personal publication**.

**First 10,000 seed objects:** a voluntary set of Cohost exports or personal-site migrations from creators who still possess their data, restricted to posts/media they authored or have permission to republish. Ten thousand posts across 50–200 users is enough. A shutdown community organizer or export-tool maintainer is a more credible steward than EFS approaching random former users.

**Demo:** import a Cohost-like export; preserve authored posts, tags, alt text and media; flag reblogs/comments as third-party; preview locally; publish only selected posts; rebuild a static site from EFS records and two mirrors; keep original URL mappings; show that an unselected post never left the local journal.

### Requirements and breakpoints

| Need | EFS pressure | Current gap or hazard |
|---|---|---|
| Complete platform export | R-PA3 portable bundle; manifest closure; explicit missing states | Platform-specific parsers, authenticated export capture and schema drift are application work |
| Old URL preservation | redirect/source URL records and exact snapshots | Domain owners must cooperate; EFS cannot preserve SEO or redirects by itself |
| Arbitrary web playback | package/static-site manifests and verified assets | JavaScript, APIs, dynamic embeds, CSS rewriting and WARC replay need a mature browser/archive stack |
| Attribution and third-party posts | typed authorship/source claims | User possession of an export does not grant republication rights |
| Privacy and selective publish | local draft, R-PRIV2 refusal, explicit promote | Permanent graph structure and bulk-upload mistakes are existential hazards |
| Full-text/tag search | enhanced index with rebuild/export | Core EFS does not provide web-archive search |
| Removal requests | gateway/lens deny and advisory records | Unlike Internet Archive, EFS cannot remove kernel bytes; this limits viable corpus to deliberate publishers |
| Massive emergency crawls | mirror manifests and proof receipts could help | Distributed crawler coordination, petabyte storage and emergency legal operations are out of current scope |

**Fatal risks:** public ingestion of private-group data, third-party social interactions or personal information; presenting a user export as blanket rights clearance; and using a disaster-response narrative to bypass informed consent.

## File-level ranking

| Rank | Candidate | Why it earns the rank | Why it may still fail |
|---:|---|---|---|
| 1 | Rights-cleared tracker/chiptune/demoscene gallery | Compact playable media; strong preservation culture; vivid tag/gallery demo; multi-mirror and curator value | Legacy licenses and sample provenance make an existing-archive import unsafe; the reachable audience is niche |
| 2 | Artist-signed permanent music editions | Mainstream-adjacent creators understand platform risk; exact releases and fan mirrors create real value | Commerce/discovery dominate artist needs; music rights are multi-party; storage cost is material |
| 3 | Creator-side platform-exit capsule | Repeated, undeniable shutdown pain; concrete export/rebuild utility; can generalize across platforms | Consent and third-party-content parsing are difficult; EFS network effect is weaker than local/static export value |
| 4 | Opt-in contemporary zine archive | Strong values alignment, visual browse and meaningful metadata | Creator outreach and contextual-consent review make 10,000 items expensive; permanence can harm the people preservation is meant to serve |
| no-go | Private Yahoo Groups or indiscriminate dead-platform crawls | Historically valuable and acutely threatened | Privacy, consent and third-party authorship failures are intrinsic, not rare edge cases |

## Cross-cluster EFS findings

- **A rights-cleared gallery should be the first gallery benchmark.** Tracker modules, new zines and authorized album art can exercise tags, previews, content warnings and mirrors without making infringement the product.
- **“Downloaded by a user” is not “licensed for republication.”** This applies equally to Bandcamp purchases, SoundCloud exports, Mod Archive files and social-platform data exports.
- **Derived media need their own identity.** Audio encodes, waveforms, cover thumbnails, OCR and static-site renders should point to originals and derivation tools, not overwrite them.
- **Context is part of preservation.** Party, label, zine place, original URL, shutdown basis, author and permission state are not optional decoration.
- **A local-first import journal is a safety requirement.** Bulk export tooling must make no public writes until the user reviews third-party content, personal data, graph edges and permanence cost.
- **EFS complements institutions that can remove access.** Internet Archive, libraries, music platforms and community archives carry policy and legal duties a protocol cannot dissolve. Permanent rights-cleared manifests can improve their fixity without replacing their discretion.

## Source index

Evidence grades: **P** = primary/official source; **C** = community/archive operator documentation; **A** = archived primary source.

| ID | Grade | Source | Supports |
|---|---|---|---|
| MU-01 | P | [Bandcamp for Artists](https://bandcamp.com/artists) | Marketplace/store features, annual sales, artist share, messaging, discovery, merch and downloads |
| MU-02 | P | [Bandcamp: Songtradr acquires Bandcamp, 2023-11-22](https://blog.bandcamp.com/2023/11/22/songtradr-acquires-bandcamp/) | Ownership transition from Epic Games |
| MU-03 | P | [Bandcamp Terms of Use, effective 2026-05-07](https://bandcamp.com/terms_of_use) | Rights requirements, removal/access risk and prompt-download recommendation |
| MU-04 | P | [SoundCloud Terms of Use](https://soundcloud.com/terms-of-use) | Uploader rights duties, file/account deletion, backups, license and moderation behavior |
| MU-05 | P | [SoundCloud: Why was my account terminated?](https://help.soundcloud.com/hc/en-us/articles/4402644714907-Why-was-my-account-terminated) | Copyright strikes and repeat-infringer termination |
| MU-06 | P | [Scene.org](https://scene.org/) | International demoscene organization and service ecosystem |
| MU-07 | P | [Scene.org file archive](https://files.scene.org/browse) | File categories, search and archive mirrors |
| MU-08 | C | [`got papers?`: The Archive](https://gotpapers.scene.org/?page_id=709) | Mid-1990s operation, university host, multi-country mirrors and artifact metadata |
| MU-09 | C | [Scene.org News](https://news.scene.org/) | Current 2026 parties, tracker music and browser-playable community activity |
| MU-10 | C | [Demozoo News: Console Cracktro Preservation Taskforce](https://demozoo.org/news/?page=1) | Extraction of scene-authored intros without proprietary game data |
| MU-11 | C | [The Mod Archive forum: distribution-license clarification](https://modarchive.org/forums/index.php?topic=3613.0) | Default permission is not public domain or transferable; CC/PD must be selected separately |
| MU-12 | P | [Queer Zine Archive Project: About](https://gittings.qzap.org/about-qzap/) | Mission, searchable/downloadable archive and donation-supported labor |
| MU-13 | P | [QZAP archive help](https://archive.qzap.org/index.php/About/Help) | Creator/year/location metadata and browse/search model |
| MU-14 | P | [Seattle Public Library ZAPP Zine Collection](https://www.spl.org/books-and-media/unique-collections/zine-collection) | 30,000-item collection, cultural scope and in-library access |
| MU-15 | P | [Barnard Zine Library: Collection Access & Circulation](https://zines.barnard.edu/collection-access-circulation) | Copyright and creator-permission boundary for public digitization |
| MU-16 | C | [ArchiveTeam: GeoCities](https://wiki.archiveteam.org/index.php/Geocities) | 2009 closure, distributed rescue, parallel incomplete archives and cultural rationale |
| MU-17 | C | [ArchiveTeam: Yahoo! Groups](https://wiki.archiveteam.org/index.php/Yahoo%21_Groups) | Shutdown timeline, export omissions, partial capture, scale and private-data restrictions |
| MU-18 | P | [Google: consumer Google+ sunset details, 2019-01-30](https://workspace.google.com/blog/product-announcements/what-you-need-to-know-about-the-sunset-of-consumer-google-plus-on-april-second) | Account/page/media deletion and user download warning |
| MU-19 | A | [Cohost staff shutdown announcement, archived 2024-09-09](https://web.archive.org/web/20240909214553/https%3A//cohost.org/staff/post/7611443-cohost-to-shut-down) | Funding/burnout, Stripe impact, export, deletion and ArchiveTeam invitation |
| MU-20 | C | [ArchiveTeam: Cohost](https://wiki.archiveteam.org/index.php/Cohost) | Cooperative crawl, completedness issues, shutdown and Wayback redirect |
| MU-21 | C | [ArchiveTeam main page](https://wiki.archiveteam.org/) | Volunteer mission, distributed rescue and shutdown triage |
| MU-22 | P | [Internet Archive: Save Pages in the Wayback Machine](https://archivesupport.zendesk.com/hc/en-us/articles/360001513491-Save-Pages-in-the-Wayback-Machine) | Stable saved-page URLs, crawler limitations and ArchiveTeam/Archive-It roles |
| MU-23 | P | [Internet Archive: Rights](https://archivesupport.zendesk.com/hc/en-us/articles/360014759692-Rights) | Copyright removal, counter-notice and rights-status caution |
