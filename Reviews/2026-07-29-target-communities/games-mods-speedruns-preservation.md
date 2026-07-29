# Game communities: mods, speedruns, emulation, and playable preservation

**Status:** completed point-in-time community research; evidence current through 2026-07-29; recommendations are analysis, not an owner ruling or legal advice
**Scope:** Nexus Mods, ModDB and CurseForge; speedrun.com, Twitch and SDA; MAME, No-Intro and Redump; Flashpoint Archive
**Read with:** [target-community research method](research-method.md), [joined use-case corpus](../2026-07-25-joined-fs-pass-corpus/use-cases.md), [apps cookbook](../../Designs/efsv2/apps-cookbook.md), and [law positioning](../2026-07-11-privacy-pass-corpus/law-positioning.md)

#status/done #kind/research #repo/planning #topic/use-cases #topic/content #topic/market-research #topic/games #topic/preservation

## Executive finding

Game preservation is not one content-rights category:

- **Creator-authorized mod release capsules are a serious first-user candidate.** Mods are versioned packages with fragile dependency graphs, creator communities have repeatedly experienced disappearance, and exact immutable releases plus mirrors are legible value. The seed must be opt-in and redistribution-cleared.
- **Runner-owned speedrun evidence bundles are a strong complement candidate.** Twitch VOD expiry turns link rot into a daily operational fact. EFS can preserve the video, input log, timing evidence, rules snapshot and moderator attestation while speedrun.com remains the leaderboard and community.
- **ROM/DAT communities are a strong metadata and verification use case but a dangerous byte-hosting target.** MAME, No-Intro and Redump show the value of hashes, dump provenance, parent/clone relationships and verified catalogs. Their own documentation also makes the boundary explicit: emulator code and checksum metadata are not permission to distribute proprietary ROMs.
- **Flashpoint is the most complete product teacher.** It has preserved more than 220,000 web games and animations with rich metadata and a launcher. It also honors creator removal requests. EFS cannot reproduce that operating compromise for bytes already made permanent.

The right launch language is **“a permanent home for releases you have the right to publish”**, never **“everything that is abandoned belongs here.”**

## Candidate matrix

| Cluster | Core values | Operating model and scale | Content-rights shape | What EFS lacks | Credible EFS wedge | Verdict |
|---|---|---|---|---|---|---|
| Nexus / ModDB / CurseForge modders | Creator credit, discoverability, compatibility, exact versions, community tooling, sometimes compensation | Central hosting, game taxonomies, files and images, dependency/modpack systems, virus/moderation review, comments, endorsements, download stats and creator rewards | Often author-created code/assets, but derivative of a game; permissions, bundled third-party assets and publisher policies vary | Malware scanning, package manager, dependency solver, comments/ratings, game-version matrix, search, moderation, payment/rewards, CDN | Opt-in signed release manifests and mirrored bytes for open, licensed or publisher-approved mods | **Strong candidate with a hard rights/malware gate** |
| Speedrun communities | Verifiable performance, category-specific rules, public evidence, moderator legitimacy, historical records | Per-game volunteer moderators, submitted video links, timing review, leaderboards, APIs, discussions and runner profiles | Runner records the run, but footage includes game audiovisual content; streams may contain licensed music, chat, voices or bystanders | Video upload/transcode/player, anti-cheat, timing tools, rules and moderator workflow, search and community | Runner-published evidence bundle referenced by an existing leaderboard | **Strong complement candidate** |
| MAME / No-Intro / Redump | Technical accuracy, bit-level verification, hardware/software history, multiple independent dumps | Open emulator code; community DAT/checksum databases; dump verification and naming conventions; ROM acquisition remains external | Metadata, emulator code and documentation can be reusable; most commercial ROM/disc bytes remain copyrighted | Emulator/runtime integration, metadata normalization, package distribution, huge bytes; lawful entitlement cannot be inferred from a hash | Permanent DAT snapshots, dump attestations, hardware records and authorized/homebrew/public-domain packages | **Catalog/manifest only for ordinary commercial software** |
| Flashpoint Archive | Preserve obsolete web-native games/animation and make them playable; completeness with content warnings | Volunteer curation, launcher, proxy/runtime support, rich metadata and tags, download-on-demand and full archive modes; 220,000+ entries | Mixed rights; project accepts removal requests and excludes illegal/borderline content | Runtime sandbox, 100+ technology stacks, curation staff, downloader, patches, search, moderation and takedown operations | Rights-cleared subset, manifest/fixity mirror, runtime package provenance | **Learn/partner; do not indiscriminately ingest** |

## 1. Mod communities: a versioned-package network with real loss memory

### Community and operating reality

Nexus Mods' public statistics currently report approximately 76.6 million members, 895,000 mods, 4.26 million downloadable files, 322,000 members with files, 14.9 billion file views, 292 million endorsements, 8.35 million uploaded file images and 1.76 million confirmed tags. [GM-01] Its product includes per-game catalogs, versioned files, requirements, changelogs, images, comments, endorsements, Collections, the Vortex manager and Donation Points. [GM-02]

Nexus itself began as an answer to disappearance: its founder says mods were scattered across fan sites that vanished as publishers lost interest, so the initial goal was a reliable centralized home. In 2025 he stepped back after 24 years and transferred stewardship to new owners and a roughly 40-person team. [GM-03] An ownership change does not prove impending harm, but a preservation-oriented community will notice that its durable home now depends on another ownership regime.

The platform's 2021 Collections transition exposes the central permanence conflict. Nexus stopped hard-deleting files and instead archived them so a Collection's exact dependency graph would not break. It explicitly acknowledged that authors who wanted complete deletion would reject the policy. [GM-04] That tradeoff is EFS in miniature: reliable package closure and creator withdrawal cannot both be absolute.

ModDB describes a similar origin—making hard-to-find mods reliably available—and reports more than 500 million downloads over its history, more than five million monthly visitors and a goal of preserving community work. [GM-05] Current catalog pages expose tens of thousands of mods and over 100,000 files. [GM-06] CurseForge adds a commercial creator ecosystem: it advertises more than 20 million monthly users and says it has paid creators more than USD 18 million since 2020. [GM-07] Its moderation policy reviews copyright permission and disallows NSFW content and external file downloads; archived files can remain available when required as dependencies. [GM-08]

These are not generic galleries. They combine artifact storage with package management, trust, compatibility and creator economics.

### Why EFS is a plausible complement

Mod users repeatedly need answers that immutable objects and provenance can make precise:

- Which exact release did a save file or modpack use?
- Was the downloaded archive byte-for-byte the author-published file?
- What dependencies and game build did the release declare?
- Did a curator test this combination, or merely link to it?
- If the original host disappears, which mirror still serves the same bytes?
- When an author publishes a replacement, can old builds remain reproducible without being misrepresented as current?

Every new mirror, compatibility attestation, malware scan result, translation, dependency edge or curator-tested collection can add value to an existing release. That is a credible network effect; download count alone is not.

### Credible wedge: the opt-in mod release capsule

**Adoption shape:** permanent home or integrity layer for creator-authorized releases.

A release capsule should contain:

- author/group principal and explicit irreversible-publication consent;
- original source and project page;
- game identifier and supported game/build hashes;
- semantic version, release channel and supersession history;
- package manifest with paths, sizes, content commitments and executable flags;
- declared dependencies, incompatibilities, optional components and load-order constraints;
- redistribution license and evidence for bundled third-party assets;
- screenshots, description, content warnings and tags;
- mirror inventory;
- curator test attestations tied to a concrete OS, game build, loader and dependency closure; and
- malware-analysis statements as attributable evidence, never as a protocol-level claim of safety.

The author can move a “recommended” channel to a new release. Old capsules remain citable; applications stop recommending them without pretending they vanished.

**First 10,000 seed objects:** recruit authors of open-source, Creative Commons, explicitly redistributable or game-studio-approved mods. Strong starting ecosystems include open engines and games with clear mod-redistribution policies. Ten thousand typed objects can be built from a few hundred releases once files, dependencies, screenshots, tests and version records are separate; do not inflate the count with meaningless chain records. A named modding community, maintainer collective or open-game foundation must steward the corpus.

**Demo:** install a small, rights-cleared collection from EFS. The client resolves an exact generation, downloads from two mirrors, verifies every file, shows dependency and license closure, runs a reproducible compatibility test, and continues after one original host is disabled. Two curators can recommend different tested load orders.

### Requirements and breakpoints

| Need | EFS pressure | Current gap or hazard |
|---|---|---|
| Exact release generations | R-PA2 citations, typed supersession, manifest closure | Strong fit |
| Dependencies and load order | R-QC2 typed relations, package-generation closure | A real constraint solver, conditional dependencies and conflict UX are application work |
| Large archives and patch files | R-BA1 verification, R-BA2 mirrors, R-BA3 manifests, R-BA8 range/chunk reads | Upload cost and community-funded mirror retention are unpriced |
| Creator-friendly writes | R-MODE3 sponsored transactions | Relayer economics and account recovery must work before ordinary modders participate |
| Trust and malware defense | signed authorship plus curator/test lenses | Signatures do not make code safe; immutable malware is a serving and publisher liability |
| Discovery | tags and off-chain R-QC10 search/ranking | Users expect game/version filters, full text, popularity, recency, ratings and related mods |
| Community and support | external links or application-layer comments/forums | EFS does not supply bug trackers, comments, notifications, moderation or social reputation |
| Compensation | external payment/donation links | Rebuilding Donation Points or marketplace payments is a service-expansion trap |
| Withdrawal and disputes | advisory/deny records and channel movement | A creator cannot revoke permanent bytes; consent must be specific before upload |

**Fatal risks:** permanent malware, an incomplete redistribution chain for bundled assets, publisher claims against a derivative mod, and onboarding copy that implies an author can later delete an EFS release. A scraped Nexus/CurseForge/ModDB corpus is not a lawful seed.

## 2. Speedrunning: preserve the evidence, not the whole social platform

### Community and operating reality

Speedrun.com reports about 20 million annual visitors, 6.2 million submitted runs, 2.8 million registered users and 53,700 game communities. It provides leaderboards, category rules, game-specific moderators, video evidence, profiles, forums and an API. [GM-09] Its user documentation says submitted runs are reviewed by volunteer moderators under each game's rules and that review can take one to three weeks. [GM-10]

The platform's site rules also describe the evidence failure directly: runners should record locally because streams can drop, video services can remove or mute recordings, and links break. The same rules prohibit ROM links and establish site-wide conduct and content boundaries. [GM-11]

Twitch makes the loss window concrete. Ordinary past broadcasts expire after seven days, Affiliate broadcasts after 14 days, and Partner/Prime/Turbo broadcasts after 60 days unless downloaded or exported; highlights/uploads have a 100-hour combined cap. [GM-12] A leaderboard that points at Twitch therefore often points at a timer, not an archive.

Speed Demos Archive (SDA) provides the historical precedent: it retains current runs and sends obsolete historical records to the Internet Archive, preserving more of the lineage than a leaderboard with dead external links. [GM-13]

### Why EFS is a plausible complement

A speedrun is already evidence-shaped:

- game and exact build;
- category and rules at a point in time;
- runner identity or pseudonym;
- date and claimed time;
- video;
- input log, split file, emulator/core version or final-state hash where available;
- moderator decision; and
- subsequent challenge, correction or supersession.

EFS can make the evidence bundle durable and the verification event attributable. It cannot decide whether a run is legitimate, nor should a global EFS lens replace each game's moderators.

### Credible wedge: the runner-owned run capsule

**Adoption shape:** integrity/evidence layer referenced from speedrun.com or another leaderboard.

A run capsule should distinguish:

- **runner claims:** identity, time, category, platform and recording context;
- **machine evidence:** content commitments, media duration, input-log hashes, game/emulator hashes, deterministic replay output where possible;
- **rule evidence:** the exact category rule snapshot and allowed tool versions at submission basis;
- **moderator testimony:** accepted/rejected/needs-review, reviewer, reason and review basis; and
- **media rights and subject consent:** runner's authorization to publish, disclosure of other identifiable people, and music/game-footage warnings.

**First 10,000 seed objects:** one or several opted-in game communities, not a crawler of every video URL. A few hundred runs can create 10,000 meaningful records once evidence files, rules snapshots, splits, verification reports and review decisions are represented separately. The seed steward should be a game moderation team or SDA-like archive partner, and every runner must choose permanent publication.

**Demo:** a runner uploads a local VOD and split/input evidence, sees cost and permanence warnings, publishes a capsule, and submits its URL to an existing leaderboard. A moderator verifies against a pinned rule snapshot. The Twitch copy later disappears; the EFS-linked mirror remains byte-verifiable. A rule change creates a new basis without rewriting the old decision.

### Requirements and breakpoints

| Need | EFS pressure | Current gap or hazard |
|---|---|---|
| Large, seekable video | R-BA2 mirrors, R-BA3 manifest/resume, R-BA8 verified range reads | Transcoding, adaptive bitrate, thumbnails, preview generation and browser playback are application/CDN work |
| Rules and category history | R-PA2 pinned citations, typed supersession, R-QC6 receipts | Strong fit; ingestion from existing leaderboard rules needs cooperation |
| Review attestations | curator principal/lens, organization roles, R-MODE3 | Moderator groups need usable recovery, delegation and sponsored writes |
| Anti-cheat and deterministic replay | package-generation identity, test attestations | No universal verifier; console capture and emulator runs have different evidence quality |
| Personal and third-party data | R-PRIV2 intake refusal/warnings | Chat overlays, voices, minors, bystanders and location details can become permanent |
| Copyright | rights warning and serving-layer policies | Game footage and music are not automatically owned by the runner; jurisdictions and publisher policies vary |
| Search/leaderboards/social | off-chain R-QC10 and existing platform integration | Do not make EFS rebuild leaderboards, forums, follows, notifications and moderation first |
| Cost | mirrors by default, explicitly priced strong byte tier | Multi-hour HD video may make a “free archive” promise economically false |

**Fatal risks:** publishing other people's voices/faces/chat into an irrevocable public record, preserving unlicensed stream music, and making a high-volume video promise before mirror economics and verified seeking work. These argue for an opt-in narrow pilot, not against the evidence wedge itself.

## 3. ROM, disc and emulation communities: metadata yes, presumed-abandoned bytes no

### Community and operating reality

MAME's mission is to document hardware and preserve software history by emulating systems. Current documentation covers more than 32,000 individual systems. [GM-14] Its project source code is available under open-source licenses, but its official materials are unequivocal: MAME does not include proprietary ROM, CD or disk images; those images are copyrighted; “abandonware” is not a permission category; and users must lawfully obtain the software they run. [GM-15]

MAME's ROM-set documentation demonstrates the metadata complexity EFS could serve: parent/clone relationships, split/merged/non-merged sets, exact device ROM dependencies, filenames, sizes and hashes. [GM-16]

No-Intro's Dat-o-Matic and Redump operate on the catalog/verification side. Dat-o-Matic records names, regions, dump statuses and hashes; its guide treats “verified” as corroboration by multiple trusted dumps rather than a magical property of one uploader. [GM-17] Redump focuses on optical-disc preservation and bit-accurate disc metadata, with repeat dumps and public checksums. [GM-18] These systems create enormous utility without claiming that publishing a checksum grants redistribution rights to the corresponding bytes.

U.S. preservation exemptions do not create a general public ROM-hosting license. Software Preservation Network's guide emphasizes that anti-circumvention exemptions are scoped to eligible libraries, archives and museums and subject to access and purpose conditions. [GM-19] This is product-risk screening, not legal advice; a launch team would need counsel for the actual jurisdiction and corpus.

### The safe EFS split

**Safe or comparatively tractable:**

- MAME and emulator source/binaries under their actual licenses;
- public DAT/checksum snapshots;
- hardware, media and dump-method metadata;
- attributed dump-verification attestations;
- patch files that are independently redistributable and do not embed restricted bytes;
- public-domain, open-source, homebrew, freely redistributable or expressly authorized ROMs/discs;
- manuals, artwork and source code only where their separate rights permit it.

**Not safe merely because preservationists value it:**

- a commercial ROM set;
- a full copyrighted disc image;
- platform firmware/BIOS;
- commercial manuals and cover art;
- an “abandonware” package whose owner is hard to find;
- a patch that quietly contains substantial original game data; or
- a hash-addressed mirror whose marketing tells users where to fetch infringing bytes.

Content addressing changes verification, not copyright.

### Credible wedge: the verified software catalog

**Adoption shape:** catalog without restricted bytes plus a permanent home for authorized packages.

An EFS object graph could represent:

- software title, region, revision and serial;
- media/dump method and tool version;
- size and cryptographic digests;
- parent/clone, required firmware and hardware relations;
- independent dump testimonies with trust-lens selection;
- emulator/core versions and known-good test results;
- rights status as evidence with source and review date;
- authorized download mirrors where applicable; and
- generated playable-package manifests that never embed absent/restricted dependencies.

**First 10,000 seed objects:** import a rights-reviewed public DAT snapshot and individual dump testimonies as metadata, plus an opt-in/homebrew/open-source byte subset. Count metadata honestly; do not use the first demo to advertise a proprietary-ROM retrieval path.

**Demo:** browse a console catalog, compare two curator lenses' verification thresholds, inspect corroborating dump attestations, select an authorized homebrew title, download and verify an exact package, and launch it in a pinned emulator generation. For a commercial title, show hashes and preservation state while the byte field is explicitly restricted/absent.

### Requirements and breakpoints

| Need | EFS pressure | Current gap or hazard |
|---|---|---|
| Large catalogs and hash lookup | R-QC1 enumeration, content-hash index, R-QC6 snapshots | Strong structural fit; exact canonical import format required |
| Multi-party verification | attributable evidence plus curator lenses | Strong fit; trust policy and duplicate/revision reconciliation need product UX |
| Complex dependencies | typed relations and package closure | Firmware, parent/clone and emulator-core dependencies need domain-specific resolver logic |
| Playability | pinned package generation and runtime assets | Browser/local emulator integration, sandboxing, controller mapping and saves are application work |
| Rights state | source-indexed rights assertions | Rights status can change and be disputed; an EFS record is evidence, not clearance |
| Restricted bytes | omit bytes; lawful external acquisition is out of scope | A “catalog only” product may have lower consumer network effect than a ROM library |

**Fatal risk:** letting “preservation” rhetorically erase the difference between public metadata and redistributable software. A proprietary-ROM home would make EFS's irreversible content policy the first thing publishers, gateways and infrastructure providers encounter.

## 4. Flashpoint Archive: a complete requirements teacher and a permanence warning

Flashpoint has preserved 220,314 web games and animations as of 2026-07-20 and supports more than 100 web technologies beyond Flash. Its collection is split between games and animations, and its search can include NSFW/extreme-content filtering. [GM-20] Curations use structured metadata such as title, language, tags, source, developer/publisher, release date, platform and content warnings; multi-file content is packaged with its original URL-like structure. [GM-21]

The project is evidence that a playable archive requires far more than bytes:

- obsolete runtimes and emulators;
- an isolated launcher/proxy;
- metadata review and corrections;
- source capture and URL reconstruction;
- screenshots and logos;
- downloads and local saves;
- content-warning filters;
- patches when original network behavior no longer works; and
- a volunteer curation institution.

Its FAQ also records a key policy: Nitrome titles were removed at the creator's request, and users are told to play them on the creator's site. Flashpoint says it does not preserve illegal or borderline-illegal content and uses tags/filters for objectionable material. [GM-20]

That is precisely where EFS cannot be a transparent drop-in backend. Flashpoint can honor a rights-holder removal request; an EFS publisher cannot retract kernel bytes. A lens can stop recommending or serving a package, but a previously acquired record or mirror can remain.

### Credible EFS role

- mirror and verify Flashpoint's redistributable metadata, curation manifests and runtime packages;
- preserve a specifically rights-cleared subset;
- let independent curators publish compatibility/test attestations;
- create exact launcher-generation receipts; and
- supply fixity/mirror evidence without asking Flashpoint to surrender its operational discretion.

**First 10,000 seed objects:** rights-cleared curations only—open-source/public-domain games, author-authorized works, metadata records and independently licensed runtime components. Flashpoint's existing mixed corpus cannot be presumed importable.

**Demo:** 100 legal packages spanning single-file Flash, multi-file web work and one additional runtime; browser cards, content warnings and tags; local secure playback; exact runtime generation; mirror failover; one curator advisory changing recommendation without claiming deletion.

**Fatal risk:** reproducing a mixed-rights archive on a substrate that cannot honor the removal behavior its current steward uses.

## Cluster ranking and recommendation

| Rank | Candidate | Why it earns the rank | Fatal or near-fatal risk |
|---:|---|---|---|
| 1 | Opt-in mod release capsules | Huge existing creator/user network; exact-version and dependency pain; lawful seed path exists; manifests, mirrors and curator tests compound in value | Malware, unclear bundled-asset rights and creator withdrawal; download economics |
| 2 | Runner-owned speedrun evidence bundles | Acute daily VOD loss; existing moderators and leaderboard integration; provenance and pinned rule basis are genuine EFS advantages | Video cost; game/music rights; third-party personal data; anti-cheat remains external |
| 3 | Verified software catalog plus authorized packages | Deep preservation culture; strong metadata/provenance fit; manageable first catalog | Consumer demand may collapse when restricted bytes are absent; a product team may be tempted to cross the ROM line |
| pilot/partner | Rights-cleared Flashpoint subset | Gallery plus playable packages exercises the design exceptionally well | Existing mixed corpus relies on removal discretion EFS cannot reproduce |
| no-go | Proprietary ROM/“abandonware” byte library | Obvious demand and permanence pain | Copyright exposure is the product, not an edge case |

Across the full EFS community search, **mods and speedruns deserve shortlist consideration**. The verified-software catalog is a valuable demo and standards partnership but probably not the best first network unless a preservation organization volunteers as steward.

## Cross-cluster EFS findings

- **Package identity needs a rights manifest as well as a byte manifest.** Exact bits are not enough; every file needs origin, license/permission and scope evidence.
- **A test attestation is lens-scoped testimony.** “Curator X ran package P under generation G and observed result R” is valuable. “EFS says this executable is safe” is not supportable.
- **Yank, deny and delete are different.** Mod platforms and Flashpoint use archival/yank/removal policies. EFS applications must say which action they perform and what remains retrievable.
- **Video and large packages force the economics question.** Multi-mirror manifests are credible; unlimited permanent byte subsidy is not.
- **Playback is a versioned dependency graph.** Runtime/emulator/core, configuration, content and patches need one citable generation.
- **Metadata-only preservation is not a consolation prize.** No-Intro, Redump and MAME prove that checksums and provenance can coordinate verification at scale. It is still a different product from downloadable commercial software.

## Source index

Evidence grades: **P** = primary/official source; **C** = first-party operator history/community-maintained project documentation.

| ID | Grade | Source | Supports |
|---|---|---|---|
| GM-01 | P | [Nexus Mods statistics](https://www.nexusmods.com/about/stats) | Current member, mod, file, view, endorsement, image and tag scale |
| GM-02 | P | [About Nexus Mods](https://www.nexusmods.com/about) | Platform features, game scope, Vortex, Collections and Donation Points |
| GM-03 | P | [Nexus Mods: An update from the founder, 2025-06-17](https://www.nexusmods.com/news/15301?pubDate=20250617) | Origins, ownership transition and team size |
| GM-04 | P | [Nexus Mods: Collections and file deletions, 2021-07-01](https://www.nexusmods.com/skyrim/news/14538) | Archive-versus-hard-delete policy and dependency rationale |
| GM-05 | C | [ModDB 20th-anniversary history](https://www.moddb.com/groups/20th-anniversary-of-moddb/history) | Project origin, audience/download history and preservation mission |
| GM-06 | P | [ModDB mods catalog](https://www.moddb.com/mods) and [downloads catalog](https://www.moddb.com/downloads/top) | Current public catalog and file/download scale |
| GM-07 | P | [CurseForge for Authors](https://authors.curseforge.com/welcome/) and [CurseForge Premium](https://www.curseforge.com/premium?source=1) | Monthly-user and creator-payment claims |
| GM-08 | P | [CurseForge moderation policies](https://support.curseforge.com/support/solutions/articles/9000197279-project-and-modpack-moderation-policies) and [file/project types](https://support.curseforge.com/en/support/solutions/articles/9000197242-file-project-types-and-additional-fields) | Copyright/NSFW review and archived dependency behavior |
| GM-09 | P | [speedrun.com About](https://www.speedrun.com/about) | Visitor, run, account and game-community scale; core features |
| GM-10 | P | [speedrun.com: Navigating a game page](https://www.speedrun.com/support/learn/navigating-a-game-page) | Category rules and moderator review |
| GM-11 | P | [speedrun.com Site Rules](https://www.speedrun.com/support/learn/site-rules) | Local-recording recommendation, video-link loss and ROM/content boundaries |
| GM-12 | P | [Twitch: Video on Demand](https://help.twitch.tv/s/article/video-on-demand?language=en_US) | Seven-, 14- and 60-day VOD retention and highlight/upload limits |
| GM-13 | C | [Speed Demos Archive: Historical records](https://kb.speeddemosarchive.com/Historical_Records) | Current-versus-obsolete run preservation model |
| GM-14 | P | [MAME documentation: Introduction](https://docs.mamedev.org/initialsetup/mameintro.html) | Preservation mission, system scale and separation from proprietary software |
| GM-15 | P | [MAME About](https://www.mamedev.org/about.html) and [common issues](https://docs.mamedev.org/usingmame/commonissues.html) | Emulator licensing and ROM/copyright/“abandonware” boundary |
| GM-16 | P | [MAME: About ROM sets](https://docs.mamedev.org/usingmame/aboutromsets.html) | Parent/clone, merged/split sets, dependencies and hashes |
| GM-17 | C | [No-Intro Dat-o-Matic](https://datomatic.nointro.org/) and [Dat-o-Matic Guide](https://wiki.no-intro.org/index.php?title=DAT-o-MATIC_Guide) | Public catalog fields and corroborated dump-verification practice |
| GM-18 | C | [Redump.org](https://redump.org/) and [Redump project wiki](https://wiki.redump.org/index.php?title=Redump.org) | Optical-disc metadata, checksums and dump-verification mission |
| GM-19 | P | [Software Preservation Network: A Preservationist's Guide to the DMCA exemption](https://www.softwarepreservationnetwork.org/a-preservationists-guide-to-the-dmca-exemption-for-software-preservation/) | Institution- and purpose-scoped preservation-exemption caution |
| GM-20 | P | [Flashpoint Archive FAQ](https://flashpointarchive.org/faq) and [current search statistics](https://flashpointarchive.org/search?advanced=true) | 2026 corpus/platform scale, content filtering, removal behavior and preservation policy |
| GM-21 | C | [Flashpoint curation format](https://flashpointarchive.org/datahub/Curation_Format) | Package layout, source capture and metadata fields |
