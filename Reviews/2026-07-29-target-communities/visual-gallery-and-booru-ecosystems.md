# Visual-gallery communities and the booru product anatomy

**Status:** completed research; market and product analysis, not an owner ruling or design amendment
**Date:** 2026-07-29
**Question:** which visual-media communities could use EFS, and what would a genuinely useful tagged gallery have to do?

#status/done #kind/research #repo/planning #topic/use-cases #topic/content #topic/gallery #topic/market-research

## Bottom line

The best visual-media wedge is **not “put a giant booru on-chain.”** It is an **opt-in, creator-signed gallery that borrows the booru interaction model**: dense tags, aliases, implications, negative filters, source and artist provenance, duplicate relationships, pools, and multiple curator views.

That distinction matters:

- A creator gallery starts with a publisher who owns the work and deliberately chooses permanence.
- A booru usually starts with a third party rehosting somebody else’s work, then relies on artist-request takedowns, do-not-post lists, source correction, and post deletion.
- EFS can make the first model unusually durable. Public permanent bytes make the second model legally and ethically worse.

The strongest concrete community is a **creator-consented furry and independent-illustrator cooperative**. Fur Affinity has unusually strong preservation pain, dense character/artist/tag relationships, a mixed general/adult culture, and creators who routinely cross-post. The safest launch corpus is their own work, contributed directly—not a scrape of Fur Affinity, e621, or any other gallery.

The booru is therefore a product grammar, not automatically the customer.

## The ecosystem is several different markets

| Community shape | Representative services | Who normally uploads? | What users value | What EFS adoption could mean | First-user verdict |
|---|---|---|---|---|---|
| Creator portfolio and fandom network | Pixiv, DeviantArt, ArtStation, Fur Affinity, Newgrounds | Mostly the creator or a collaborator | identity, followers, comments, commissions, discovery, galleries, originals | creator-controlled release mirror plus portable catalog | **Promising where loss pain is high; Fur Affinity is the standout** |
| Community booru | Danbooru, e621/e926, Derpibooru and forks | Frequently a fan or archivist, not the artist | exhaustive tags, source recovery, pools, notes, duplicates, blacklists | curator facts over creator-authorized objects; import/export for a permissioned instance | **Excellent product model; dangerous corpus-acquisition model** |
| High-volume adult rehosting booru | Gelbooru, Rule34.xxx and many clones | Mostly third-party reuploaders | broad coverage, explicit search vocabulary, fast anonymous browsing | at most a catalog of lawful sources and hashes | **No-go as a first-party byte corpus** |
| Ephemeral imageboard | 4chan and successors | anonymous participants | live thread culture, remix, ephemerality, low identity cost | selected, reviewed folklore exhibits—not a live board mirror | **No-go for comprehensive ingest** |
| Federated/self-hosted photo community | Pixelfed and small ActivityPub instances | creator/member | local governance, federation, follows, albums, comments | EFS-backed durable release/export option beneath an existing social layer | **Good operator partnership, weaker standalone community wedge** |
| Personal media catalog | Hydrus Network and local DAM tools | the owner | private control, huge local library, tags, subscriptions, dedupe | selective “make permanent” publish flow and portable manifests | **Strong importer/tool partnership** |

## Incumbent profiles

### Pixiv: enormous, sophisticated, and not waiting to be replaced

Pixiv’s September 2025 company update reported **119 million registered users and more than 160 million cumulative works** ([Pixiv corporate release](https://www.pixiv.co.jp/2025/09/10/120000)). That scale is useful as a ceiling, not as an obtainable launch market.

Its interaction model is richer than “art plus tags”:

- illustrations may be multi-image works; uploads carry age restrictions and an AI-generation setting ([posting help](https://www.pixiv.help/hc/en-us/articles/235584588-How-can-I-post-illustrations-on-pixiv));
- a work may have up to ten tags; viewers can add or remove tags unless the creator locks them, and deleted-tag history is retained ([tag help](https://www.pixiv.help/hc/en-us/articles/235585008-What-are-the-tags-on-works-posted-to-pixiv));
- discovery includes daily, weekly, monthly, rookie, original, AI, R-18, and R-18G rankings ([ranking help](https://www.pixiv.help/hc/en-us/articles/230700147-What-types-of-rankings-are-there-available));
- users can filter AI-generated work ([AI display settings](https://www.pixiv.help/hc/en-us/articles/11866167926809-What-are-display-settings-for-AI-generated-work));
- the surrounding product includes follows, bookmarks, comments, requests, FANBOX patronage, BOOTH commerce, translation, and mobile clients.

Pixiv also demonstrates why “adult-friendly” does not mean infrastructure-independent. Its help center says PayPal has been temporarily unavailable for some Pixiv payments since March 2024 ([payment methods](https://www.pixiv.help/hc/en-us/articles/900002309706-What-payment-methods-can-I-use)), while FANBOX warns that PayPal may be unavailable for some creators, particularly R-18 creators ([FANBOX support](https://fanbox.pixiv.help/hc/en-us/articles/54418814564505-I-can-t-support-a-creator)). EFS can preserve a catalog; it does not replace banking, payouts, requests, or subscriber access control.

**EFS opportunity:** an opt-in “publish a durable edition” export from Pixiv or a cross-poster. An artist signs the original, description, creator identity, declared date, source URLs, rating, and mirror list. Independent curator lenses can add fandom, character, technique, or exhibition tags without impersonating the creator.

**Why not first:** matching Pixiv’s recommendation, social, translation, patronage, and mobile surfaces would consume the project. The credible wedge is a mirror/export tool, not a Pixiv competitor.

### DeviantArt and ArtStation: mainstream reach, weak replacement urgency

At Wix’s 2017 acquisition, the companies reported **more than 40 million members and more than 325 million pieces of original art** on DeviantArt ([Wix acquisition release](https://www.wix.com/press-room/home/post/wix-acquires-deviantart-pairing-wix-capabilities-with-global-creative-community)). DeviantArt combines artist galleries and groups with comments, follows, commissions, subscriptions, premium downloads, and mature-content controls ([mature-content help](https://www.deviantartsupport.com/kb/en/article/what-is-mature-content-453216)).

ArtStation is closer to a professional creative labor market. Its official feature summary includes high-resolution images, video, 3D viewers, portfolio websites, blogs, analytics, digital goods, prints, jobs, challenges, and learning ([ArtStation for artists](https://www.artstation.com/about)). It also supports follows and collections ([ArtStation for fans](https://www.artstation.com/about/fans)) and introduced a `NoAI` tag plus AI-content filters ([ArtStation announcement](https://magazine.artstation.com/2022/12/noli-tag/)).

**EFS opportunity:** durable portfolio editions, signed credits, exact downloadable asset versions, and a creator-controlled walkaway export. For 3D work, EFS could preserve the exact asset package and viewer/runtime manifest while an ordinary site renders it.

**Why not first:** both incumbents provide discovery and economic surfaces EFS does not. Their users feel platform-governance risk, but the preservation pain is less concrete than Fur Affinity’s documented data loss or Newgrounds’ Flash-preservation problem.

### Fur Affinity: the clearest creator-gallery opening

Fur Affinity is culturally specific but not small. Its own 2016 retrospective reported **3,492,412 submissions in one year**, 331,112 new accounts, 17.9 million comments, 97.99 million favorites, and 446.4 TB of bandwidth ([official 2016 statistics](https://www.furaffinity.net/journal/8094022)).

More important than scale is lived loss:

- In May 2016, an exploit led to deletion of submissions, account, and watch data. The site restored a May 11 backup, so newly registered accounts, uploads, and watches after that backup were lost ([official incident report](https://www.furaffinity.net/journal/7578912/)).
- In April 2025, filesystem maintenance left the site in a partial read-only state; staff described validating copied uploads with hash comparison before restoring service ([official outage report](https://www.furaffinity.net/journal/11123851/)).
- In March 2026, a miscommunication started notification pruning before the promised announcement. Fur Affinity said the removed notification data could not be restored; even after the purge, that table occupied more than a terabyte and contained billions of rows ([official notification incident](https://www.furaffinity.net/journal/11330044)).
- In June 2026, Fur Affinity described its codebase as very old, announced a staged read-only API, and published limits and permission requirements for archive bots and machine-to-machine scraping ([official site update](https://www.furaffinity.net/journal/11377368)).

This community already understands cross-posting, personal archives, multiple characters and aliases, commissions, and the difference between general, mature, and adult work. It also has a reason to value an archive that no single web application can accidentally erase.

**Best adoption shape:** not “leave Fur Affinity.” Give creators a direct export/cross-post flow into a cooperatively curated EFS gallery. Fur Affinity remains the social venue; EFS becomes the signed release and walkaway layer.

**Rights boundary:** only the creator—or a documented rights-holder—publishes the bytes. A watcher’s favorites are not permission to republish. A commission’s artist, commissioner, depicted character owners, and commercial rights can differ; the intake record needs a rights statement that does not collapse those roles.

**Mixed-rating boundary:** the community’s adult side is a legitimate market, but the first public corpus should be a deliberately selected general/mature set with an opt-in adult pilot only after the serving operator, age gate, content taxonomy, prohibited-content rules, notice process, and counsel review exist. Drawn adult work is lower-risk than live-action intimate media, but it is not risk-free.

### Newgrounds: original web culture with proven preservation instincts

Newgrounds has been hosting user-created work since 1999. Its history describes the 2000 automated Portal, later audio and co-author support, and a self-funded, independent posture ([official history](https://www.newgrounds.com/wiki/about-newgrounds/)).

Its content rules make it unusually compatible with permissioned archival work:

- contributors must own and create what they submit;
- adult content must be original illustration rather than uploaded pornographic photography or video;
- sexualized minors, including loli/cub content, are prohibited ([content-submission rules](https://www.newgrounds.com/wiki/help-information/content-submission));
- games must be creator-authorized and avoid unauthorized media; adult games still face explicit content boundaries ([game guidelines](https://www.newgrounds.com/wiki/help-information/terms-of-use/game-guidelines)).

Newgrounds also helped fund Ruffle so Flash work could continue after browser Flash support disappeared ([2021 founder update](https://www.newgrounds.com/bbs/topic/1462656/1), [2024 update](https://www.newgrounds.com/bbs/topic/1538142/1)). That is not generic nostalgia; it is evidence that the community will do technical preservation work for playable media.

**EFS opportunity:** exact creator-signed project releases, collaborator credits, screenshots, content ratings, source packages where authorized, runtime requirements, and tested-launch receipts. Newgrounds remains the social and editorial venue. EFS provides a portable generation that a future launcher can verify.

**Constraint:** EFS would need a safe playable-media pipeline—archive inspection, malware scanning, runtime sandboxing, explicit Play, version/supersession, and a durable runtime manifest. This is a larger product than a static image gallery.

### Reddit and Tumblr: discovery communities, not source-of-truth homes

Reddit reported **121.4 million daily active uniques in Q4 2025** ([company results](https://investor.redditinc.com/news-events/news-releases/news-details/2026/Reddit-Reports-Fourth-Quarter-and-Full-Year-2025-Results-Announces-1-Billion-Share-Repurchase-Program/default.aspx)). Its community structure, moderator tooling, votes, comments, post flair, and ranking are the product. Post flair alone supports up to 350 templates per community and can be searched ([Reddit help](https://support.reddithelp.com/hc/en-us/articles/15484545678996-Post-Flair)).

The 2023 API transition also showed how dependent outside clients and archives are on platform access. Reddit’s company account described new pricing and tighter mature-content access while retaining free moderator-tool access ([API facts](https://redditinc.com/news/apifacts)).

Tumblr is a more direct displacement case. Its December 2018 policy change removed adult-content visibility, while the current rules permit some mature themes but prohibit visual depictions of explicit sexual acts and certain genital-focused content ([current mature-content policy](https://help.tumblr.com/knowledge-base/mature-nsfw-content/)).

**EFS opportunity:** a creator or subreddit can attach a durable, rights-authorized media object to an ordinary post. EFS should not try to reproduce Reddit’s ranking/moderation system or Tumblr’s reblog graph in the first gallery.

**Design lesson:** the durable object and the conversation about it should be separable. Comments, votes, trending rank, and moderator admission change rapidly; the creator-signed original and its content hash do not.

### Pixelfed and Hydrus: bridge products, not competitors

Pixelfed is an open-source, ActivityPub-based, decentralized photo service with albums, threaded comments, direct messages, likes, filters, mobile/PWA clients, and ephemeral stories ([official feature summary](https://pixelfed.org/features)). Its admins already accept federation and local-governance complexity.

Hydrus describes itself as a personal booru for users with tens of thousands of files. It imports local and web media, organizes with tags instead of folders, supports subscriptions, broad file types, and user-run anonymous tag repositories ([Hydrus repository](https://github.com/hydrusnetwork/hydrus)).

These are valuable integration surfaces:

- **Pixelfed:** an instance admin offers “publish durable edition” for selected public albums; ActivityPub carries conversation, EFS carries exact release identity and mirrors.
- **Hydrus:** a user selects a reviewed subset of a local library, resolves ownership and source metadata, then promotes it from local-only to public EFS. “Everything in my Hydrus” must never be the default.

## What a booru actually is

A booru is not merely a thumbnail grid. Its core product is a collectively maintained knowledge graph over media.

### Reference implementations

- [Danbooru](https://github.com/danbooru/danbooru) describes itself as a taggable image board. Its production stack calls out object storage, image search, reporting, recommendations, archives, and analytics—evidence that the web application and index systems are substantial.
- [Danbooru’s autotagger](https://github.com/danbooru/autotagger) is trained across roughly 5,500 tags, demonstrating the scale of assisted classification.
- [e621’s tag-group index](https://e621.net/wiki_pages/1671) shows a deep community ontology spanning layout, artistic technique, file attributes, subjects, anatomy, themes, objects, and more.
- [szurubooru](https://github.com/rr-/szurubooru) targets small and medium communities and includes images, video, Flash, comments, image notes, polygon annotations, rich search, autocomplete, tag categories, suggestions, implications, aliases, pools, duplicate detection, ratings, favorites, and an API.
- [Philomena](https://github.com/philomena-dev/philomena), used in the pony-imageboard ecosystem, is an open-source imageboard stack.

### Minimum credible gallery mechanics

| Capability | Why users depend on it | EFS implication |
|---|---|---|
| Boolean and metatag search | `artist:X character:Y -rating:adult`, date/size/type/source queries | needs a fast enhanced index plus an honest bounded fallback |
| Negative tags and user blacklists | users can participate in a mixed-content site without seeing unwanted material | viewer policy must apply before thumbnails or counts leak content |
| Tag categories/namespaces | artist, character, species, copyright, technique, rating, source are not interchangeable | tag definitions need typed meaning and display semantics |
| Aliases and implications | synonyms converge; `red_fox` may imply `fox` and `canid` | implications must be versioned assertions, not silent destructive rewrites |
| Tag edit history and provenance | community corrections and disputes are auditable | each assertion needs author, basis, time, confidence, and supersession |
| Source and artist identity | reuploads are useful only if users can find the creator and original | source URLs, creator claims, anonymous-artist requests, and rights state are first-class |
| Pools, sets, and sequences | comics, image series, variants, animation frames, and artbooks need order | bounded ordered collection structure is required |
| Parent/child/replacement relations | alternate edits, higher-resolution replacements, translations, and crops should not masquerade as independent works | preserve exact objects and express relationships without overwriting history |
| Duplicate and near-duplicate detection | avoids tag fragmentation and finds better originals | exact content-hash lookup is baseline; perceptual similarity is enhanced/off-chain |
| Notes and regions | translation, transcription, and annotation attach to part of an image | annotations need target version, geometry, language, and author provenance |
| Ratings and content warnings | mixed general/mature/adult communities need predictable filtering | creator rating and curator rating must remain distinct, with fail-closed unknown states |
| Moderation queue | prevents dangerous bytes from becoming public before review | **must happen before permanent publication**, not after |
| DNP and takedown state | artists and rightsholders withdraw rehost permission | proves why scraped booru bytes are a bad EFS corpus |
| Saved searches, subscriptions, follows | turns a database into a returning community | client/indexer/social layer; not a kernel feature |
| Fast thumbnails and previews | cold browsing originals is too slow and expensive | derived previews need identities, provenance, rebuild rules, and cache policy |

The existing EFS corpus already calls a curated collection plus lens subscription its strongest application fit ([[apps-cookbook]]) and models a 20,000-photo archive with derived local thumbnails and verified originals ([[use-cases]]). That is encouraging, but a booru-class gallery still falsifies far more than a personal photo folder: high-cardinality tags, disputed labels, intersections, negative filtering, duplicate relations, and moderation-before-publication.

### Community governance cannot be flattened into one “truth”

Booru curation is valuable partly because it is contestable:

- the creator names the work and may declare characters, rating, or AI status;
- a fandom curator adds canonical character and universe tags;
- a technical curator adds medium, software, resolution, animation, or color tags;
- a safety curator supplies content warnings or deny advisories;
- a rights-holder disputes authorization;
- a viewer chooses a strict, permissive, child-safe, spoiler-free, or fandom-specific lens.

EFS is unusually well-shaped for preserving those assertions without letting one database row silently overwrite everybody else. But the user experience must clearly show **who said what** and which lens selected it. A single merged tag cloud that hides provenance would throw away the main EFS advantage.

## The booru rights contradiction

The mature boorus also document the exact behavior permanent bytes cannot satisfy:

- e621 tells artists and copyright holders to file a takedown request for permanent deletion ([reporting help](https://e621.net/wiki_pages/e621%3Areport_post)).
- e621’s anonymous-artist policy tells users not to identify or source a creator who has requested anonymity ([policy](https://e621.net/wiki_pages/anonymous_artist)).
- pony-imageboard rules include do-not-post restrictions and prohibit some large official-content uploads ([rules mirror](https://trixiebooru.org/pages/rules)).

These are not marginal features. They are the social bargain that makes third-party archiving tolerable. An EFS app can hide a record in its lens, and a gateway can stop serving it, but neither action deletes public plaintext or copies already made. Therefore:

1. Never treat “the image is already on a booru” as a license to publish it permanently.
2. Never migrate Danbooru, e621, Gelbooru, Rule34, Derpibooru, or another rehosting corpus wholesale.
3. Import metadata only when its license and privacy status permit it; preserve the source URL and original platform ID.
4. For bytes, require creator/rightsholder authorization and an explicit permanence acknowledgment.
5. Let independent curators tag that creator-authorized object. Do not make the curator the apparent publisher of the artwork.

Gelbooru and Rule34.xxx clearly expose booru-style tag wikis and search, but this pass did not find a reliable dated first-party source for current corpus or user counts. No scale number for either is asserted here. Their strategic significance does not depend on a live counter: they demonstrate demand for explicit, deeply tagged image search and the rights risk of rehosting-first acquisition.

## 4chan and imageboard archives: preserving a culture that values forgetting

4chan’s own FAQ describes a deliberately transient system:

- posting is anonymous and accounts are absent;
- starting a thread normally requires an image;
- boards usually retain only ten pages;
- threads expire in hours or days;
- expired content is removed and cannot be retrieved;
- the FAQ reports more than 100 TB of traffic per day, more than 680 million monthly pageviews, and more than 22 million monthly unique visitors ([official FAQ](https://4chan.org/faq)).

The community’s archivists are already decentralized. Bibliotheca Anonoma describes the “no memory” culture, where saving, reposting, and remixing cause selected material to survive ([4chan history](https://wiki.bibanon.org/4chan)); its archive roster documents many independent board archives and the fragmentation among them ([archive history](https://wiki.bibanon.org/4chan/History)). Academic research over one `/pol/` archive analyzed 3.3 million threads and 134.5 million posts from 2016–2019 ([paper](https://arxiv.org/abs/2001.07487)).

**The trap:** a complete permanent mirror is not automatically faithful preservation. It destroys the original expectation that most posts disappear, captures personal information and illegal material, and gives marginal content a permanence its authors did not choose.

**Viable sliver:** a curator-reviewed “internet folklore edition” containing selected memes, explanatory essays, provenance links, and lawful media. Intake and quarantine must be off-chain; only reviewed objects are published. This is a museum/exhibit product, not a firehose archive.

## What EFS could uniquely add

Assuming the v2 design ships the relevant primitives, EFS could provide:

1. **Creator-signed objects.** The gallery can distinguish the artist’s release from a fan’s tag, a curator’s collection, and a mirror operator’s availability claim.
2. **Stable exact identity.** Crops, translations, thumbnails, revised files, and higher-resolution versions remain distinguishable and linked.
3. **Multiple mirrors without identity drift.** The same committed bytes can move among author, community, IPFS/Arweave, institutional, or commercial mirrors.
4. **Portable curation.** Fandom, safety, exhibition, and personal lenses can overlap one corpus without one operator owning the canonical database.
5. **Durable provenance and edit history.** A tag correction adds evidence; it does not need to erase the prior assertion.
6. **Walkaway.** A creator or curator can reconstruct a usable catalog and verify its objects without the original gallery operator.
7. **Visible disagreement.** A work can be accepted by one community, denied by another, and still retain exact attribution.

These advantages are real only if the client does not collapse back into one privileged EFS indexer and one official moderation lens.

## What EFS does not yet supply

This community would immediately expose missing or unproven product work:

- walletless upload and cold browse;
- resumable bulk import with per-item preflight;
- thumbnail, animated-preview, video-transcode, and 3D-preview derivation;
- low-latency multi-tag intersections, negative search, autocomplete, and saved searches;
- tag alias, implication, category, and dispute interfaces;
- exact duplicate plus perceptual near-duplicate detection;
- creator identity and rights/commission-role declarations;
- prepublication quarantine and review;
- creator-facing cross-post/export integrations;
- DNP, copyright, NCII, CSAM, and jurisdictional deny inputs at the serving layer;
- age gates and content-warning policies that apply before media is fetched;
- comments, follows, notifications, feeds, and commission links;
- clear degraded behavior when index, thumbnail, or original mirrors are missing;
- storage and transaction costs proven at 10,000 and 1,000,000-item scale.

Most of these are not reasons to change the kernel. They are reasons not to confuse a good substrate fit with a finished gallery.

## Research judgment

The gallery thesis survives, but in a narrower and more useful form:

> Build the best **creator-consented portable booru**, not the largest booru. Let original publishers own the durable objects; let communities compete and collaborate over the tags, collections, ratings, mirrors, and interpretations.

That product can begin with a subculture, demonstrate a real network effect, and later serve mainstream photography, museum images, open educational media, product assets, datasets with previews, and playable releases. A scraped hentai or imageboard archive would create the wrong network effect: every additional byte would increase liability faster than it increases legitimate participation.

## Source and confidence notes

- Platform scale claims above are dated and attributed to first-party releases. They are not normalized active-user comparisons.
- Feature and policy claims use official help centers, repositories, or first-party incident reports where available.
- The interpretation of community fit, adoption shape, and EFS requirements is this research pass’s analysis.
- Current Gelbooru and Rule34.xxx counts were not verified from stable first-party evidence and are deliberately omitted.
- Legal and safety conclusions are product-risk screening, not legal advice; [[law-positioning]] remains the EFS-specific operator-doctrine input.
