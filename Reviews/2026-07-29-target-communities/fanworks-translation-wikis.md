# Fanworks, translation communities, and independent wikis

**Status:** completed point-in-time community research; evidence current through 2026-07-29; recommendations are analysis, not an owner ruling or design amendment
**Scope:** AO3 and FanFiction.Net, MangaDex and scanlation, Fandom and independent wiki forks
**Read with:** [target-community research method](research-method.md), [joined use-case corpus](../2026-07-25-joined-fs-pass-corpus/use-cases.md), [apps cookbook](../../Designs/efsv2/apps-cookbook.md), and [law positioning](../2026-07-11-privacy-pass-corpus/law-positioning.md)

#status/done #kind/research #repo/planning #topic/use-cases #topic/content #topic/market-research #topic/fandom #topic/wikis

## Executive finding

The three superficially similar communities split sharply once rights and operating culture are considered:

1. **Independent wiki migrations are a strong first-user candidate.** The text is often deliberately reusable under a Creative Commons license, communities already fork when a host no longer represents them, and attribution-preserving revision history is exactly the kind of shared evidence EFS can make portable. EFS should first provide a **fork-proof archive and integrity layer for independent MediaWiki sites**, not attempt to replace MediaWiki.
2. **Fanfiction is a good design teacher and a poor platform-replacement target.** AO3 already supplies a durable, donor-funded, volunteer-governed home with unusually strong metadata, moderation, import, download, and community legitimacy. EFS can offer an opt-in, creator-controlled release capsule or rescue substrate. It should not scrape or permanently republish writers' archives.
3. **Scanlation is an attractive product surface attached to a fatal seed-corpus risk.** MangaDex proves that a multilingual, richly tagged, easy-to-browse reader can operate at enormous scale on a volunteer budget. Its core corpus is also unauthorized translation and redistribution of copyrighted pages. EFS should learn from its schema and operations, but court original or explicitly licensed comics—not import MangaDex.

The recurring lesson is that “the community fears deletion” does not imply “the community wants every existing object made irrevocable.” Withdrawal, pseudonym separation, and rights-holder takedown remain part of how these communities survive.

## Candidate matrix

| Cluster | Culture and mission | How it works now | Content and rights shape | What the incumbent does that EFS does not | Credible EFS role | First-user verdict |
|---|---|---|---|---|---|---|
| AO3 / fanfiction | Transformative-work preservation; maximum inclusiveness; pseudonymous participation; strong volunteer governance | Donations, nonprofit stewardship, volunteer tag wrangling, policy review, archive imports, comments/bookmarks/kudos, downloads | Mostly user-authored text, but derivative of existing works; author still owns the fanwork and expects control over pseudonym, visibility, orphaning, or deletion | Full-text and tag search, tag synonyms and implications, moderation queues, abuse handling, accounts/pseuds, subscriptions, comments, bookmarks, collections, import consent, download formats | Opt-in creator release capsule or consented archive rescue; provenance and exact downloadable editions underneath AO3-like social discovery | **Complement only; not a first replacement target** |
| FanFiction.Net diaspora | Broad fandom publishing with a long memory of policy purges and unreliable stewardship | Central commercial site, account publishing, fandom/category taxonomy, reviews, follows, favorites, community forums | User-authored derivative text; author control and platform rules vary | Large installed audience, discovery, reviews/follows, category pages, account recovery, moderation | Author-export tool that makes a rights-and-consent manifest and a private preview before irreversible publication | **Pain is real; steward and consent path are weak** |
| MangaDex / scanlation | Free, ad-free fan translation; multilingual access; scanlation-group identity; rich title/chapter metadata | Volunteer/self-funded site, API, reader, scanlation groups, follows/lists, content ratings, uploads and moderation | Most popular pages are copyrighted manga rehosted without publisher authorization; translations add new copyright interests but do not clear the source work | High-performance reader/CDN, search and relevance ranking, language and chapter UX, title relations, group credits, follows, lists, moderation and DMCA response | Rights-cleared original comics, publisher-authorized translations, translation overlays or release metadata without source-page bytes | **No-go for a scraped or mirrored first corpus** |
| Fandom-to-independent wiki forks | Collaborative documentation; community governance; attribution; editable shared memory | MediaWiki, volunteer editors/admins, templates and Lua, revision history, talk pages, anti-vandalism, search and SEO; host monetizes attention | Text is commonly CC BY-SA; image rights are mixed and often include fair-use files that are not freely portable | Editing and rollback, full-text search, templates, Lua, redirects, categories, talk pages, user rights, spam controls, page rendering, mature migration tools, SEO | Immutable revision objects, portable attribution history, exact fork snapshots, multiple host mirrors and independently curated community lenses | **Strongest candidate in this cluster** |

## 1. AO3 and fanfiction: a partner-shaped opportunity

### Community and operating reality

The Organization for Transformative Works (OTW) is a nonprofit whose Archive of Our Own (AO3) is funded by donors and run largely by volunteers. Its 2024 report records roughly:

- 14 million works reached during 2024, 2.1 million new works in the year, 1.30 million new accounts, and 34 billion page views;
- 5.4 million tags wrangled and 6,050 fandoms canonized;
- 27,700 Policy & Abuse tickets and 27,000 Support tickets;
- 889 OTW volunteers, about USD 1.34 million of revenue and USD 1.03 million of expenses; and
- 111 archives rescued through Open Doors cumulatively, with ten imports covering about 13,000 works in 2024. [FW-01]

AO3 passed 18 million fanworks in July 2026. [FW-02] Those figures matter less as a conventional “market size” than as proof that fanworks require real institutions: tag governance and abuse queues are not peripheral features that a storage primitive can hand-wave away.

AO3's refusal to ship an official mobile app is also revealing. OTW says app-store rules—particularly sexual-content restrictions—conflict with its commitment to maximum inclusiveness; it instead maintains a responsive website with downloadable works for offline reading. [FW-03] That is genuine platform-gatekeeper pain, but it is not the same as archival fragility: AO3 itself is unusually aligned with its users.

FanFiction.Net provides the counter-history. Its current guidelines prohibit explicit “MA” content, real-person fiction, several interactive formats, copied lyrics, and fanfiction about a named list of authors. [FW-04] Community historians document major enforcement purges in 2002 and 2012 that helped drive authors toward alternatives. [FW-05] Treat the purge narrative as community testimony, not an audited count, but the durable behavioral lesson is clear: writers learned to keep backups and distrust policy stability.

### Why EFS should not attempt an AO3 replacement

AO3 already does most of the difficult non-storage work extremely well:

- human-maintained canonical tags, synonyms, relationships and freeforms;
- fandom, pairing, character, rating, warning and category filters;
- pseudonyms, orphaning, anonymous collections and controlled visibility;
- comments, kudos, bookmarks, subscriptions and collections;
- abuse adjudication, support, legal advocacy and consent-sensitive archive imports;
- HTML, EPUB, MOBI, PDF and AZW3 downloads; and
- a recognizable nonprofit and governance culture.

EFS currently promises none of the social, search, moderation, account, or governance system above. Rebuilding it would spend years to offer a community a less trusted AO3.

More importantly, “the text is publicly readable” is not permission for EFS to republish it. A scraper does not acquire the author's copyright or informed consent to irreversible publication. AO3 users sometimes delete, orphan, hide, anonymize or separate pseudonyms for personal safety. A permanent public graph can preserve associations that the author deliberately wanted to break. The existing EFS disclosure—that public plaintext is permanent, graph shape remains visible, and users must never publish other people's personal data—therefore applies directly. [EFS-LAW]

### Credible wedge: the fanwork walk-away capsule

**Adoption shape:** opt-in integrity layer and lifeboat, not platform replacement.

A creator-side tool could:

1. import a writer's own AO3/FFN export or local manuscript;
2. show exactly what would become permanent, including pseudonym, fandom tags, embedded images, comments accidentally included in HTML, and relationship edges;
3. produce an immutable release containing the work, author-selected metadata, license/permission statement, source-platform URL and export date;
4. create a portable `.efs-bundle` and optional EFS publication only after a second explicit permanence confirmation; and
5. let discovery sites cite the release while comments, subscriptions and mutable profile data stay elsewhere.

The object should say **“published permanently by this principal”**, never **“authorized by AO3”** merely because it came from an AO3 export.

**First 10,000 seed objects:** ten thousand individually opted-in works from current authors, or a formal collaboration with an archive owner already using an Open Doors-style consent process. A mass scrape is not an acceptable seed strategy. A smaller pilot of 100–500 creators is more credible than inventing a nonexistent rights-clearing institution.

**Demo:** import one EPUB/HTML export; redact or omit comments and account metadata; preview the public graph; sign a release manifest; browse by fandom/character/freeform tags; export and reconstruct the exact edition from two mirrors. Demonstrate that a creator can update discovery pointers without pretending the old edition disappeared.

### Requirements and breakpoints

| Need | EFS pressure | Current gap or caution |
|---|---|---|
| Author-owned immutable editions | R-PA2 pinned `(id, basis, contentHash)` reads; R-PA3 portable bundles; typed supersession | Strong fit |
| Tag aliases, implications and wrangler provenance | TAG/TAGDEF-style records and competing lenses | Human tag operations and fast many-tag search are not supplied by the kernel |
| Works with hundreds of thousands of words | R-BA1 verified bytes; mirrors rather than expensive state bytes by default | Reader UX, HTML sanitization, EPUB generation and full-text search are application work |
| Pseudonym and consent safety | R-PRIV2 intake guardrails; local draft before promote | Permanent author/graph association is a product hazard, not solved by a lens |
| Walletless participation | R-MODE3 sponsored writes | Relayer economics and abuse resistance remain unpriced |
| Search and recommendation | R-QC10 explicitly leaves ranked/full-text/global search off-chain | A fanwork product without excellent search is not competitive |
| Abuse and content policy | curator lenses and serving-layer deny policies | A lens cannot delete the kernel record or replace a Policy & Abuse institution |

**Fatal risk:** treating existing public fanfiction as ownerless archive material. The lawful and culturally acceptable EFS unit is an author-consented release, not “everything a crawler can see.”

## 2. MangaDex and scanlation: excellent requirements, unacceptable default bytes

### Community and operating reality

MangaDex describes itself as a free, ad-free platform run by scanlation fans, providing fan translations without compressing or altering images. [FW-06] Its pre-rebuild infrastructure account reported more than ten million monthly unique visitors, peaks above 2,000 requests per second, billions of monthly non-image requests, and a roughly USD 1,500 monthly budget. It used commercial object storage for backups and explicitly worried about relying on provider goodwill. [FW-07]

That low-budget, enormous-scale reality is a valuable warning for EFS: a good gallery is not a grid of thumbnails. It is a multilingual catalog, a responsive reader, image delivery at global scale, chapter ordering, scanlation-group credit, user lists and follows, and rapid search.

MangaDex's schema encodes:

- translated titles and descriptions;
- original language and available translated languages;
- author, artist and scanlation group;
- publication status, year and demographic;
- relations between titles;
- chapter, volume and page ordering;
- official tags; and
- content ratings of safe, suggestive, erotica and pornographic. [FW-08]

Its history also demonstrates real infrastructure and governance pain. A 2021 breach gave an attacker administrative access and led the volunteer team to take the service down while rewriting it, leaving the community without a complete product for months. [FW-09] In May 2025, MangaDex said a mass copyright claim affected roughly 7,000 titles; the service remained online but had to remove the claimed works. [FW-10] The FAQ is preserved in a community-operated announcement surface, so the count should be treated as the platform's stated number, not independently audited.

### The rights split EFS cannot evade

Scanlation usually combines several distinct interests:

- the original manga pages and characters, ordinarily controlled by creators or publishers;
- a translation, typesetting and cleaning contribution by a scanlation group;
- cover art and promotional images;
- uploader and group metadata; and
- reader lists, follows and comments.

A volunteer translator's permission does not authorize permanent redistribution of the source pages. Nor does the social value of access turn “abandonware” or an unlicensed edition into public-domain content. MangaDex can comply with a claim by removing access; an EFS publisher cannot retract bytes from the public record. A curator can deny them, but that is not equivalent to deletion and does not eliminate exposure for the original publisher, mirror or gateway.

Therefore:

- **Do not scrape MangaDex.**
- **Do not seed commercial manga pages.**
- **Do not promise publishers a takedown mechanism that the kernel cannot provide.**
- **Do not confuse scanlation-group credit with a complete rights chain.**

### Credible wedge: original and authorized serial comics

**Adoption shape:** permanent home for creator-owned comics; catalog/overlay for other translation work.

A MangaDex-shaped EFS app can be legitimate if the corpus begins with:

- creator-owned webcomics under explicit permanent-redistribution terms;
- public-domain source comics;
- publisher- or creator-authorized translations;
- translation memories, subtitles or patch layers that do not embed restricted source pages and whose own license permits distribution; and
- manifests that identify official paid sources without mirroring the restricted bytes.

The product can preserve the things MangaDex gets right: edition and language relations, group and role credits, exact chapter order, alternate covers, content ratings, tag provenance and multiple curator views.

**First 10,000 seed objects:** not 10,000 popular manga chapters. Recruit independent webcomic creators or small publishers, and count a rights-cleared title, chapter, page asset, translation, thumbnail and manifest as separate typed objects. Every title needs a machine-readable rights statement and a contactable steward. Ten thousand objects might represent 25–100 complete small series; that is enough to test the system without laundering a scraped catalog.

**Demo:** a multilingual series with two authorized translation groups, page-level verified range reads, responsive thumbnails, language filters, chapter manifests and one disputed tag rendered differently by two lenses. Remove one edition from a serving lens and show honestly that the underlying record remains.

### Requirements and breakpoints

| Need | EFS pressure | Current gap or caution |
|---|---|---|
| Fast image reader and gallery | R-BA1 verification; R-BA2 mirrors; R-BA8 range/chunk reads | CDN selection, thumbnails, prefetch, transcoding and mobile reader UX are substantial application infrastructure |
| Chapter/page order and editions | R-QC1 exact pagination; manifest closure; typed relations | Good structural fit; benchmark thousands of pages and many translations |
| Many-tag and multilingual discovery | tag assertions plus off-chain search | Relevance, autocomplete, language stemming and two-to-five-tag intersections need an enhanced index |
| Rights provenance | license, permission and source records; curator advisories | A rights assertion is evidence, not legal truth; applications need review and dispute operations |
| Adult ratings | content-warning metadata and user/lens filters | Age gates, regional law and app-store restrictions remain serving/application duties |
| Group accounts and sponsorship | organization principals; R-MODE3 relaying | Group membership, recovery and abuse operations are not a gallery feature |
| DMCA response | lens and gateway deny state | Kernel permanence makes this an explicit launch risk, not a solved requirement |

**Fatal risk:** building a polished ingestion path that makes permanent infringement easy before EFS has a bounded, rights-cleared community. The safer comics product is materially different from a scanlation mirror.

## 3. Independent wiki forks: the strongest candidate

### Community and operating reality

Fandom says it hosts more than 40 million pages across more than 250,000 wikis in over 80 languages. [FW-11] A typical large fandom wiki is a real publishing operation: volunteer editors and administrators maintain templates, modules, categories, citations, redirects, page histories, talk pages, permissions, anti-vandalism tools, bot jobs, image policies and local governance.

Fandom's own forking policy acknowledges that most wiki text is under CC BY-SA (with some historical Gamepedia content under CC BY-NC-SA) and that communities may fork. It also says the original Fandom wiki remains open, departing administrators lose their tools there, and promotion of the fork on Fandom is tightly constrained. [FW-12] The result is not a clean database migration but two living communities competing over authority, traffic and future edits.

Fandom lets administrators request MediaWiki XML database downloads with current pages or full revision history. Those dumps do **not** contain image files or private user data. [FW-13] That omission is a crucial product fact: portable CC text is often available, while the media layer requires separate fetching and separate rights review.

Independent host Weird Gloop describes why it helps communities leave Fandom: control over advertising and integrations, formal commitments around data and domains, and community ownership. It reports that one moved wiki roughly doubled active editors, and its 2026 migration guide says new editors rise by about three times on average after a move. [FW-14] [FW-15] These are operator claims rather than independent causal studies, but the existence of repeat migrations and specialist hosts is strong evidence of a reachable seed steward.

### Why the EFS fit is unusually good

Wiki communities have five characteristics that line up with EFS:

1. **The text is often intentionally forkable.** CC BY-SA is not a blanket answer—attribution and share-alike still matter—but it creates a real lawful path absent from most gallery rehosting.
2. **Revision provenance is the product.** Who wrote what, what a fork inherited, and which snapshot a claim cites all matter.
3. **Legitimate disagreement exists.** Two successor communities can curate different “canonical” views over the same historical corpus without either rewriting the shared past.
4. **Host exit is already practiced.** Fandom dumps, MediaWiki imports and independent hosting communities provide both tooling and potential partners.
5. **Bytes can remain conventionally hosted.** EFS can prove exact pages, histories and media manifests while independent operators keep fast web servers and search indexes.

This makes a wiki one of the few communities where the same object can lawfully acquire value from additional mirrors, revision receipts, attribution repair and competing curator lenses.

### Credible wedge: the fork-proof MediaWiki archive

**Adoption shape:** integrity layer, portable lifeboat and curator commons underneath existing wiki software.

An exporter could convert a MediaWiki dump into:

- one object per revision with page, timestamp, contributor representation, parent revision and content commitment;
- page/channel heads at an exact export basis;
- redirect, category, template and file-reference edges;
- a complete attribution manifest and original license record;
- separately reviewed media manifests with per-file license/source evidence;
- a portable `.efs-bundle`; and
- mirror records for the independent host, a community backup and optionally another archive.

The first product should not render arbitrary MediaWiki perfectly from chain state. It should make a migrated corpus independently verifiable and reconstructable, then let a normal MediaWiki installation import it. A static verifier/gallery can show that the objects are useful without claiming to replace editing.

**First 10,000 seed objects:** one opted-in independent wiki migration with approximately 10,000 pages/revisions, or a smaller wiki whose full revision history reaches that object count. The steward is a named wiki admin group or specialist host. Start with a corpus whose text and media are explicitly reusable; do not assume fair-use game screenshots can be republished merely because the surrounding text is CC.

**Demo:** export one rights-reviewed wiki; publish an exact snapshot; reconstruct it to a fresh MediaWiki instance; serve pages and thumbnails from two mirrors; show two successor lenses choosing different page heads or moderation labels; verify attribution for a chosen paragraph back through revision history. Then simulate the original host going offline.

### Requirements and breakpoints

| Need | EFS pressure | Current gap or caution |
|---|---|---|
| Exact revision and snapshot export | R-PA2 citations, R-PA3 bundles, R-QC1 paginated closure, R-QC6 view receipts | Strong fit; importer/exporter must define stable canonicalization |
| Attribution across copied revisions | typed parent/source edges; author and license evidence | Username/IP handling can expose personal data; old MediaWiki histories require careful contributor representation |
| Two living forks | overlapping lenses, page heads, supersession and provenance | Strong differentiator; “canonical” must remain lens-relative |
| Templates, Lua and rendering | package generation and dependency closure may help | Arbitrary template/module execution and version-specific MediaWiki behavior are not currently an EFS product |
| Full-text search and autocomplete | R-QC10 enhanced/off-chain indexes | Fatal to day-to-day wiki UX if no honest enhanced service exists |
| Reverts, anti-vandalism and moderation | append-only revisions plus curator selection | EFS does not supply abuse queues, block lists, protected pages, edit patrol or account reputation |
| Images and galleries | R-BA1/2/8, media license manifests, thumbnails | Fandom dumps omit images; fair-use/non-free media cannot be assumed portable |
| SEO and inbound links | permanent EFS identity can stabilize citations | Search-engine ranking, redirects and domain continuity remain conventional web operations |
| Affordable community writes | R-MODE3 sponsored writes | Relayer funding, spam budgets and recovery for group principals must be demonstrated |

### Suggested interview targets

- administrators of a wiki that recently left Fandom;
- Weird Gloop or another independent MediaWiki host;
- a member of the Nintendo Independent Wiki Alliance;
- a MediaWiki XML-dump/import maintainer; and
- a licensing-focused wiki administrator who has handled non-free media.

The interview should test whether “an independently verifiable fork snapshot” solves a felt problem, or whether ordinary backups plus domain ownership are already sufficient. The target is not ready for product commitment until at least one admin agrees to be the lawful seed steward.

**Fatal risks:** silently breaking CC attribution, making IP-address revision history permanently queryable, treating Fandom's omitted/fair-use images as reusable, or underestimating how much value comes from MediaWiki's mutable moderation and search surface rather than storage.

## Cluster verdict and ranking

| Rank | Candidate | Why it earns the rank | Why it could still fail |
|---:|---|---|---|
| 1 | Independent wiki fork archive | Real host-exit behavior; generally reusable text; reachable admins/hosts; compact seed; exact provenance and competing lenses are differentiators | Media rights and attribution are harder than text; users may consider ordinary dumps sufficient; EFS still needs a MediaWiki bridge and enhanced search |
| 2 | Opt-in fanwork release capsule | Large, motivated creator population; purges and app-store exclusions make portability legible; text is cheap to store | AO3 already solves the institutional problem; permanence and pseudonym safety sharply limit consent; no obvious seed partner |
| 3 | Original/authorized serial comics gallery | Directly exercises the visual-gallery hypothesis and multilingual edition relations | Rights-cleared supply may be too small; reader/CDN/search expectations are high; adjacent scanlation demand tempts the product into a no-go corpus |
| no-go | MangaDex/scanlation mirror | Enormous audience and clear loss/deplatforming history | Core bytes are ordinarily unauthorized; takedown-dependent operations and kernel permanence are structurally incompatible |

## Cross-cluster EFS findings

- **A reusable license is structured metadata, not a vibe.** Capture license text/version, attributed parties, source, permission evidence, scope and whether derivative redistribution is allowed.
- **Import provenance must not imply authorization.** “Fetched from platform X” and “published with rights by principal Y” are separate claims.
- **Permanence confirmation must be content-class aware.** A generic wallet signature is not informed consent for permanent pseudonym association, embedded comments, page history containing IP addresses, or copyrighted images.
- **Lenses help with plural canon, not legal erasure.** Wiki forks are a constructive lens use. DMCA and author withdrawal demonstrate the limit.
- **The enhanced service is not optional in practice.** Fanworks, comics and wikis all depend on full-text or rich tag search; R-QC10 can remain off-chain, but a first app must ship an explicit indexer, rebuild path and degraded mode.
- **The best first object is a release or snapshot, not a scraped post.** That choice makes rights, consent, closure and provenance reviewable before publication.

## Source index

Evidence grades: **P** = primary/official source; **C** = community-maintained history or operator testimony. Dates are access dates unless the publication date is material.

| ID | Grade | Source | Supports |
|---|---|---|---|
| FW-01 | P | [OTW 2024 Annual Report (PDF)](https://www.transformativeworks.org/wp-content/uploads/2025/09/2024-OTW-Annual-Report.pdf) | AO3 volume, tags, tickets, volunteers, finances and Open Doors imports |
| FW-02 | P | [AO3 celebrates 18 million fanworks, 2026-07-26](https://www.transformativeworks.org/ao3-celebrates-18-million-fanworks/) | Current AO3 corpus milestone |
| FW-03 | P | [OTW: Why AO3 doesn't have an official app, 2026-07-24](https://www.transformativeworks.org/why-ao3-doesnt-have-an-official-app/) | App-store sexual-content conflict, web/download posture |
| FW-04 | P | [FanFiction.Net Content Guidelines](https://www.fanfiction.net/guidelines/) | Current prohibited-content and format rules |
| FW-05 | C | [Fanlore: FanFiction.Net's NC-17 purges](https://fanlore.org/wiki/FanFiction.Net%27s_NC-17_Purges) | Community history of 2002/2012 enforcement and migration |
| FW-06 | P | [MangaDex developer site: About MangaDex](https://mangadex.dev/about/) | Mission, ad-free posture and scanlation identity |
| FW-07 | P | [MangaDex v5 infrastructure overview](https://mangadex.dev/mangadex-v5-infrastructure-overview/) | Visitor/request scale, budget, storage and provider constraints |
| FW-08 | P | [MangaDex API enumerations](https://gitlab.com/mangadex-pub/mangadex-api-docs/blob/main/3-enumerations.md) | Metadata entities, relations, ratings and sort modes |
| FW-09 | P | [MangaDex: Why rebuild?](https://mangadex.dev/why-rebuild/) | 2021 breach, downtime and rebuild history |
| FW-10 | C/P | [MangaDex copyright-claims FAQ announcement, 2025-05-19](https://www.reddit.com/r/mangadex/comments/1kpz8a5/mangadex_copyright_claims_faq_may_19th/) | Platform-stated mass-claim response and approximate title count |
| FW-11 | P | [Fandom: About](https://about.fandom.com/about) | Hosted page, wiki and language scale |
| FW-12 | P | [Fandom Community: Forking Policy](https://community.fandom.com/wiki/Forking_Policy) | License posture, old-wiki continuity and fork-promotion restrictions |
| FW-13 | P | [Fandom Community: Database download help](https://community.fandom.com/wiki/Help%3ADatabase_download) | XML export options and omission of images/private user data |
| FW-14 | C | [Weird Gloop: Why we're helping more wikis move away from Fandom](https://weirdgloop.org/blog/why-were-helping-more-wikis-move-away-from-fandom) | Independent-host motivations, governance promises and one migration outcome |
| FW-15 | C | [Weird Gloop: We wrote a guide for moving your wiki](https://weirdgloop.org/blog/we-wrote-a-guide) | 2026 operator account of migration process and editor-growth claim |
| EFS-LAW | P/internal | [EFS law and positioning pass](../2026-07-11-privacy-pass-corpus/law-positioning.md) | Existing project disclosure and serving-layer versus kernel boundary |
