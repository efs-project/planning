---
agent: codex-gpt-5
date: 2026-07-29
status: done
anchors:
  - area: use-cases
  - area: content
  - area: efsv2
  - review: 2026-07-29-target-communities
source: Target-community research requested from the project-manager prompt
---

# Who should EFS's first real users be?

#status/done #kind/research #repo/planning #topic/use-cases #topic/content #topic/market-research #topic/gallery

## Answer in one page

The image/media hypothesis is **right about the product and wrong about the acquisition model**.

EFS should prove a fast, walletless, deeply tagged gallery. It should not seed that gallery by scraping Pixiv, a booru, Reddit, 4chan, MangaDex, a ROM site, or an adult platform. Those systems depend on rights, privacy, ephemerality, or removal practices that public permanent bytes cannot reproduce.

The promising EFS pattern is:

> A creator or steward publishes an exact, deliberately permanent release; independent communities add attributed tags, collections, mirrors, tests, corrections, and warnings without taking ownership of the source object.

That points to five **community-validation prospects**, not five pilot commitments:

| Rank | Community prospect | Desk-research score | Why it made the cut | Why it is not pilot-ready |
|---:|---|---:|---|---|
| 1 | **Independent wiki migration admins and hosts** | **76/100** | one real community can authorize a bounded corpus; licensed text, exact attribution, shared ancestry, and competing successor views fit EFS | no admin has committed; MediaWiki dumps, backups, and torrents may already solve enough; media and IP-address history are hazardous |
| 2 | **Public-data rescue coalitions** | **76/100** | strongest mainstream loss signal and a real cross-repository coordination problem around exact versions, captures, mirrors, corrections, and citations | the thesis needs two independent operators; one EFS-authored catalog copy adds no network; public data can still contain personal or sensitive facts |
| 3 | **OSHWA/open-hardware creators and builders** | **75/100** | stable project UIDs, documented vanished documentation, recurring releases/remixes, and third-party build/calibration receipts form a strong evidence network | OSHWA and creators are uncontacted; Git/Zenodo plus signed replicated releases may suffice; patents, trademarks, toolchains, and dangerous devices need tight bounds |
| 4 | **Open-game mod maintainers** | **69/100** | recurring exact releases, dependencies, mirrors, compatibility tests, and curator collections are more community-shaped than a generic game archive | steward is hypothetical; bundled rights, immutable malware, author withdrawal, package-manager scope, and byte economics are hard gates |
| 5 | **Furry and independent-illustrator collective** | **66/100** | strongest true gallery network effect; real Fur Affinity loss history; creator publishing plus independent fandom/tag curation is unusually EFS-native | no cooperative has committed; permanence can harm pseudonymous creators; search, moderation, rights roles, age/content policy, notices, and serving operations are launch-critical |

The score is intentionally conservative. The uncontacted-steward cap is 2/5, and a risk gate overrides the total. The detailed vectors and wider opportunity map are in [[opportunity-map]].

No candidate is yet “EFS's first real users.” That title should be earned by the first community that supplies a lawful representative corpus, chooses an EFS-specific capability over the conventional baseline, returns after the seed import, accepts the operating bill, and supports independent operation.

## The gallery recommendation

Build the first gallery against a **consent-bearing Visual Lifeboat or rights-cleared local-history collection**:

- 1,000 real images for the human pilot and 10,000 objects/assertions for the functional gate;
- 1,000,000 synthetic/rights-cleared items for the scale gate;
- original, thumbnail, preview, and other derivative identities kept distinct;
- dense typed tags with aliases, implications, disputes, negative filters, and provenance;
- ordered pools, duplicate and near-duplicate relationships, source/creator/rights context, and several curator Views;
- walletless cold browse and useful bounded behavior when enhanced search is unavailable;
- mirror failure, partial availability, correction, supersession, denial, and `UNKNOWN` states; and
- export and reconstruction by a second operator.

This is a **proof corpus**, not presumed community adoption. The Flickr Foundation's Data Lifeboat already supplies consent-aware selection, social and technical context, a future-reader README, and a self-contained browser-readable package. EFS must preserve that work and demonstrate a useful multi-operator lifecycle beyond “the ZIP still hashes.”

A conventional counterfactual must be built or priced first:

> signed manifest + S3/R2 copy + IPFS or torrent mirror + static browser

EFS wins only if independently authored mirrors, tests, tags, corrections, citations, or plural successor views materially improve an existing object without one catalog operator's permission or private database.

## Adult content: valid market, narrow safe wedge

Adult creators are legitimate and unusually exposed to platform and payment-policy changes. The strongest EFS-adjacent lanes are:

- creator-owned adult illustration, comics, audio, and 3D work;
- public demos or freely redistributable adult indie games; and
- adult curator Views over objects the creators themselves deliberately published.

An adult lane should follow—not precede—a working general/mature creator flow, prepublication review, an accountable serving operator, a jurisdiction/content charter, age/content policy applied before preview fetch, notices and appeals, and counsel review.

Public EFS is the wrong home for:

- live-action adult UGC without specialist age/identity/consent and rapid-disablement operations;
- intimate personal media or private kink/social graphs;
- subscriber-only or paid plaintext;
- non-consensual or ambiguous-subject material; and
- scraped hentai/porn boorus.

Lenses can select, warn, blur, omit, or refuse to serve. They cannot delete public plaintext, undo graph publication, establish copyright, verify consent, or discharge a gateway operator's legal duties.

## What EFS can be a home for

The strongest adoption shapes are narrower than “replace the website”:

| Shape | Examples from this pass | EFS contribution |
|---|---|---|
| **Permanent creator release** | illustration, open hardware, mods, web games, music, authorized comics | exact edition, publisher identity, versions, mirrors, portable reconstruction |
| **Lifeboat** | consented photo collections, local archives, creator-side dead-platform exports | package identity, context, source/consent evidence, mirrors, successor/advisory history |
| **Integrity and receipt layer** | rescued public data, research releases, speedrun evidence | exact basis, capture/test/review testimony, citations, current mirror state |
| **Catalog without restricted bytes** | ROM/disc verification, uncleared mods/samples, investigative indexes | hashes, provenance, rights state, compatibility, lawful source links |
| **Curator commons** | wiki successors, galleries, tags, cultural collections | overlapping Views and assertions without one universal moderator |

The best network effects attach to durable evidence: a second mirror, a sourced tag correction, an independent build or compatibility test, a translation, a versioned citation, a successor view, or a reproducible collection.

## Attractive communities EFS should not court first

- **Booru wholesale:** excellent gallery grammar; usually the wrong rights model for permanent bytes.
- **4chan/imageboard firehose:** ephemerality is part of the culture and the anonymous intake risk is unbounded; only reviewed folklore exhibits are plausible.
- **Reddit/Tumblr replacement:** ranking, moderation, comments, identities, notifications, and audience are the product; EFS can initially supply a durable attachment/export.
- **MangaDex/scanlation mirror:** rich reader and metadata benchmark; underlying pages are ordinarily unauthorized.
- **AO3 replacement or fanfiction scrape:** AO3 already has a strong institution; permanent publication must be author-opt-in and pseudonym-aware.
- **ROM/“abandonware” bytes:** DATs, hashes, dump testimony, homebrew, and authorized packages are useful; “abandoned” is not a license.
- **Raw web-scraped ML media:** safety/privacy repairs and takedowns are incompatible with making the first corpus irreversible.
- **Private leaks, genealogy, health, or sensitive-species coordinates:** public reachability is not safe permanent-publication permission.

## Product findings that pressure the held v2 designs

This pass does not edit the held design set. It identifies launch-blocking evidence needs:

1. **Exact package-generation identity remains open.** A lifeboat, dataset, wiki snapshot, hardware release, or mod package needs one exact manifest closure.
2. **“Enhanced/off-chain search” is a boundary, not a gallery product.** The first app needs rebuildable indexes, multi-tag/negative search, autocomplete, saved state, visible provenance, and a useful no-index fallback.
3. **Thumbnail/preview production needs an early product owner.** A gallery cannot cold-load originals and feel alive.
4. **Gas and total-cost evidence is missing.** Price records, tag assertions, indexes, relaying, previews, byte retention, mirror operations, review, and notices at 10,000 and 1,000,000-item scale.
5. **Large-upload completion funding is still exogenous.** A resumable authorization does not name who pays to finish or retain the bytes.
6. **Public contribution and moderation queues are application work.** A commenter-owned parallel record is not a usable proposal/review institution by itself.
7. **Serving operations are unavoidable.** Rights intake, prohibited-content review, deny sources, notices, appeals, incident response, and operator jurisdiction cannot be delegated to “the lens.”
8. **Public deletion remains impossible.** Intake must be local/quarantined and content-class-aware before any irreversible write.

The full acceptance-test set is in [[requirements-and-first-apps]].

## Highest-leverage next action

Run a **10-day comparative steward-proof sprint**:

1. ask one recent wiki-migration admin group, two independently governed public-data operators, and one OSHWA/open-science-hardware cohort the same question;
2. require each prospect to nominate a lawful 1,000-object corpus, a decision-capable steward, an inclusion/notices owner, and one recurring curator, verifier, builder, or mirror;
3. show the conventional signed-package baseline and the proposed EFS multi-party lifecycle side by side;
4. ask which EFS-specific behavior changes their decision and what one-year bill they would accept; and
5. use the consent-based visual lifeboat only as the gallery counterfactual during those conversations.

The first prospect to pass authority, recurring behavior, counterfactual, economics, independent-operation, and safety gates earns the pilot. If none does, the correct result is not a bigger scrape; it is evidence that the current EFS advantage is still too abstract.

## Corpus map

| File | Purpose |
|---|---|
| [[research-method]] | widened prompt, evidence discipline, score, readiness calibration, risk gates, gallery/data/package fixtures, and cost gate |
| [[opportunity-map]] | canonical ranked community scorecard plus the broad landscape scan |
| [[shortlist-red-team]] | adversarial correction: community vs fixture, conventional baseline, validation and kill gates |
| [[requirements-and-first-apps]] | cross-community product requirements, current-design pressure, demos, and pilot gates |
| [[visual-gallery-and-booru-ecosystems]] | Pixiv, Fur Affinity, Newgrounds, Reddit/Tumblr, Pixelfed/Hydrus, booru product anatomy, and 4chan |
| [[adult-media-displacement-and-safety-boundaries]] | adult-market segments, platform/payment displacement, safety/operator boundary, and legitimate experiment |
| [[gallery-opportunity-ranking-and-launch-plan]] | creator-consented portable-booru concept, gallery fixture, acquisition sequence, and kill criteria |
| [[visual-lifeboats-public-collections-and-open-hardware]] | Flickr Data Lifeboat, public cultural collections, OSHWA/open hardware, photography, podcasts, MusicBrainz, and genealogy |
| [[mainstream-candidate-ranking]] | mainstream-lane conversations and proof/validation sequence |
| [[public-data-science-and-civic-evidence]] | public-data rescue, research repositories, ML data, maps, biodiversity, product facts, and civic documents |
| [[fanworks-translation-wikis]] | AO3/FFN, MangaDex/scanlation, and independent wiki migrations |
| [[games-mods-speedruns-preservation]] | mod platforms, speedrun evidence, MAME/No-Intro/Redump, and Flashpoint |
| [[music-zines-dead-platforms]] | Bandcamp/SoundCloud, tracker/demoscene files, zines, and platform-exit capsules |

## Evidence boundary

Sources are indexed in each cluster report and are current through 2026-07-29 where the report says so. Platform counts are dated, attributed, and not normalized as comparable active-user measures. Community fit, scores, launch order, and EFS roles are analysis. No prospective steward or partner was contacted, no architecture decision was adopted, no legal advice was supplied, and no implementation or cost benchmark was performed.
