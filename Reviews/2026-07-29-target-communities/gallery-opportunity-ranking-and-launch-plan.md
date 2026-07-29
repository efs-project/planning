# Gallery opportunity ranking and launch plan

**Status:** completed synthesis and recommendation; research judgment only, not an owner ruling, roadmap commitment, or design amendment
**Date:** 2026-07-29
**Inputs:** [[research-method]], [[visual-gallery-and-booru-ecosystems]], [[adult-media-displacement-and-safety-boundaries]], [[apps-cookbook]], [[use-cases]], [[law-positioning]]

#status/done #kind/research #repo/planning #topic/use-cases #topic/content #topic/gallery #topic/market-research

## Recommendation in one page

Build and test a **creator-consented portable booru**:

- creators publish exact, signed, intentionally permanent media editions;
- community curators add attributed tags, collections, warnings, translations, and source facts;
- different lenses select different interpretations without one database owning the truth;
- multiple byte mirrors can fail or change without changing the object’s identity;
- the whole useful catalog can be exported and verified without the original app.

Use three research lanes:

1. **Highest-upside gallery-community hypothesis: opt-in furry and independent illustrators.** This group has documented platform-loss pain, a strong character/tag/commission culture, general and adult work, and creators accustomed to cross-posting. Seed only their own deliberately contributed work. No cooperative or pilot steward has yet committed.
2. **Mainstream-safe proof corpus: a rights-cleared niche visual collection.** Use public-domain, Creative Commons, or directly licensed media from a small museum, fandom-history steward, convention/zine archive, or open educational collection. This proves cold browse, tags, mirrors, provenance, and export without making the first moderation incident existential.
3. **Second media vertical: creator-owned web games and animation.** Newgrounds’ Ruffle investment and itch.io’s 2025 adult deindexing show both preservation motivation and creator-owned release mechanics. Treat this as a playable-package extension, not a requirement for gallery v1.

An **adult-illustration/adult-game pilot is valid phase-two work**, after the general/mature creator flow, serving policy, prepublication review, and counsel gate work. A live-action porn host, scraped hentai booru, comprehensive 4chan archive, or FetLife-like public social graph is explicitly not a first EFS community.

## Gallery-lane prioritization

The canonical, steward-calibrated community score is in [[opportunity-map]]. This lane does not publish a second numeric score: its earlier exploratory totals treated plausible stewards as if they had committed and mixed proof-corpus value with adoption.

| Gallery lane | Why keep it | Readiness |
|---|---|---|
| Opt-in furry + independent-illustrator collective | strongest true gallery network effect; documented platform pain; direct creator rights path | **UNVALIDATED community prospect** — hypothetical steward, heavy serving and consent burden |
| Consent-based niche visual collection | cleanest way to falsify cards, tags, provenance, derivatives, Views, mirrors and export | **Proof corpus** — not a returning community unless a steward wants continuing curation |
| Original web games + animation | exact creator releases and runtime/test evidence; current deindexing and preservation signals | **Later media vertical** — player, malware and redistribution gates |
| Pixelfed/Hydrus publish bridge | reaches users who already value local/federated control | **Integration prospect**, not a standalone audience |
| Adult illustration + adult indie games | legitimate underserved creators and a dense classification workload | **Phase-two research lane** after a general/mature flow, operator and counsel gate |
| Pixiv/DeviantArt/ArtStation portfolio export | useful creator walk-away feature | **Weak community wedge** without incumbent integration |

“Booru” is deliberately absent as one scored community. It is an interface and curation model. A permissioned small booru can serve the creator prospect; a scraped rehosting booru fails the rights gate no matter how attractive its search behavior is.

### Attractive no-go candidates

| Candidate | Why it looks tempting | Fatal mismatch |
|---|---|---|
| Danbooru/e621/Gelbooru/Rule34 bulk migration | existing dense tags and millions of useful media relationships | uploader often lacks rights; DNP, anonymity, and takedown are normal; public bytes cannot be deleted |
| Comprehensive 4chan or successor archive | enormous network, culturally important artifacts, built-in ephemerality pain | forgetting is part of the culture; anonymous firehose contains dangerous personal, illegal, and infringing material |
| Live-action adult UGC platform | underserved creators and strong deplatforming history | requires identity/age/consent verification, prepublication scanning, NCII/CSAM response, rapid removal, and specialist operations |
| FetLife-like social network | payment censorship and centralized privacy risk are real | public authorship/relationship graph and irreversible media conflict with consent withdrawal, location safety, and private community |
| “Reddit on EFS” | obvious network effects and media dependence | comments, moderation, ranking, anti-abuse, notifications, and community governance dominate the product; EFS adds only a durable attachment layer initially |

## Why the furry/independent-illustrator lane has the highest gallery upside

### Evidence of pain

Fur Affinity’s own reports document:

- a 2016 attack and restore from an older backup that lost newly uploaded submissions, accounts, and watches ([incident](https://www.furaffinity.net/journal/7578912/));
- 2016 activity of 3.49 million submissions, 17.9 million comments, and 97.99 million favorites, showing a large, active media graph ([statistics](https://www.furaffinity.net/journal/8094022));
- a 2025 storage migration/outage requiring hash validation of copied uploads ([incident](https://www.furaffinity.net/journal/11123851/));
- an accidental 2026 notification purge that could not be restored, from a table still exceeding a terabyte and billions of rows ([incident](https://www.furaffinity.net/journal/11330044));
- a 2026 transition toward a read-only API and explicit rules for archive bots, against what the team calls a very old codebase ([update](https://www.furaffinity.net/journal/11377368)).

This is better launch evidence than “artists dislike platforms.” It identifies a community with real loss, meaningful scale, and current technical friction.

### Native network effect

The useful loop is not raw file count:

```text
creator publishes an exact work
    ↓
character/fandom curator adds reusable tags and collections
    ↓
another creator links the same character, world, species, or event
    ↓
mirror operator preserves more of the connected collection
    ↓
viewers subscribe to a lens; corrections and source facts improve old works
    ↓
more creators gain a durable, already-organized portfolio
```

One creator’s hundred works are already useful. The hundredth creator makes the first creator’s work easier to find through shared characters, species, fandoms, conventions, techniques, and curated sets. That is a genuine cross-object network effect rather than a generic “more users means more users” claim.

### Reachable seed steward

No partner has been contacted in this research pass. The credible steward profile is:

- one small creator cooperative, convention/zine archive, or respected fandom curator;
- 50–100 participating artists who retain their originals;
- two to five independent tag/collection curators;
- at least two non-project mirror operators;
- one gallery operator willing to publish and enforce a narrow content charter.

The project should recruit through artists and archivists, not approach a rehosting booru and ask for its database dump.

### Fatal risk

The same community depends on pseudonyms, rebranding, DNP requests, and mixed adult content. If creators do not understand that public plaintext cannot later be erased—or if the gallery obtains works from watchers rather than artists—the wedge is invalid. A creator withdrawal can remove a work from normal views and mirrors, but not make the public record or prior copies disappear.

## The mainstream-safe proof corpus

The gallery needs an early corpus that exercises the full browse experience without forcing the team to learn adult-platform operations on day one.

Suitable examples:

- public-domain local-history photographs with institution-approved metadata;
- a small museum’s open-license image collection;
- creator-donated convention art, posters, and zine covers;
- open educational diagrams or natural-history images;
- a rights-cleared fandom-history collection;
- an open-license texture, sprite, or reference-photo library.

The collection should be **small enough to have a named steward and hard enough to contain real disagreements**: uncertain dates, alternate titles, multiple subjects, changing taxonomy, duplicate scans, and several institutions or curators.

### Why it is not the final market

Wikimedia Commons and institutional repositories already serve much open media well. EFS must not pitch “another copy” as sufficient value. The proof corpus earns its place only if it demonstrates:

- one object identity over multiple mirrors;
- creator/institution facts separated from curator interpretation;
- reproducible lens-selected collections;
- exact provenance and supersession;
- a complete portable export;
- useful browsing when the preferred index is missing;
- independent operation by a second party.

If those benefits are not visible to users, EFS has not found a gallery advantage.

### Fatal risk

The steward may see no reason to maintain another catalog, and the EFS write/storage costs may buy less resilience than a conventional replicated repository. A signed demo without a continuing curator is not a network.

## The playable-media extension

Newgrounds and itch.io provide two different demand signals:

- Newgrounds invested in Ruffle to preserve creator-made Flash work after browser support disappeared ([Newgrounds founder update](https://www.newgrounds.com/bbs/topic/1462656/1)).
- In July 2025, itch.io deindexed all adult NSFW content after payment-processor scrutiny; the company described more than two million product pages, a small team, a partial reindex, suspended Stripe support for 18+ work, and the importance of creators retaining DRM-free backups ([official update](https://itch.io/updates/update-on-nsfw-content)).

An EFS edition can contain exact files, creator and collaborator signatures, screenshots, content warnings, engine/runtime requirements, source/license facts, and test receipts. The same gallery can display cards; clicking Play crosses into a distinct trust boundary.

### Fatal risk

The project may underestimate executable safety and runtime preservation. A durable malicious package is worse than a broken image, and storing a paid game as public plaintext destroys the creator’s business model. The playable lane must begin with redistributable works or public demos, explicit Play, static inspection, sandboxing, and a catalog-only option.

## The first 10,000-media seed

### Corpus composition

Use exactly **10,000 rights-cleared media items** for the first functional gate:

- 7,500 works from 50–100 consenting independent illustrators;
- 2,000 works from one rights-cleared mainstream/open collection;
- 500 deliberately varied media objects—short animation, comic sequence, layered/3D preview, or game screenshots—to expose format boundaries.

If recruiting 7,500 creator-owned works is not feasible, invert the ratio for the engineering fixture: 8,000 open-license objects and 2,000 creator works. Do not fill the shortfall by scraping.

Each original and its card thumbnail/preview are distinct objects with a derivation relationship. The 10,000 count refers to original media items; the actual record and mirror count will be much larger.

### Required metadata

Every media item needs:

- exact content commitment, MIME/type claim, byte size, dimensions/duration, and original filename where safe;
- publisher identity and source platform/URL;
- rights basis: creator-owned, directly licensed, named open license, or public domain;
- creator, commissioner, character-owner, and publisher roles where relevant;
- creator title, description, claimed creation/publication date, and creator rating;
- zero or more curator ratings and content warnings, each with provenance;
- mirror list and per-mirror availability/verification state;
- relationships to thumbnails, previews, variants, translations, replacements, parents, children, and sequence/pool;
- tag assertions and their author;
- tag-definition references for categories, aliases, and implications;
- a prepublication review receipt and content-charter version;
- supersession/revocation state, with plain-language notice that neither removes already-public bytes.

Personal verification documents, private commission correspondence, legal names, addresses, emails, performer records, abuse reports, and other sensitive evidence stay off-chain.

### Tag fixture

Reuse the demanding fixture from [[research-method]]:

- p50 35 and p95 100 tag assertions per item;
- creator/artist, character, fandom/copyright, species/subject, medium, technique, color, setting, rating, warning, source, and file-attribute categories;
- aliases and implications;
- mutually disputed tags;
- 20 ordinary curator/labeler sources plus one larger community-curation principal;
- negative filters and viewer blacklists;
- both exact duplicate and near-duplicate examples;
- ordered pools and annotated regions.

Synthetic tags can increase cardinality for performance testing, but the user study needs human-maintained real tags. Otherwise the benchmark proves a database, not a community.

### Ingest flow

The irreversible boundary must be visible:

1. Import locally from a creator-selected folder, export archive, or approved API.
2. Detect duplicates, unsupported formats, metadata leaks, and missing rights facts.
3. Generate previews locally and show exactly what will be public.
4. Run content-policy and safety review while nothing is on permanent EFS.
5. Let the creator remove or correct items.
6. Display an explicit ceremony: public plaintext cannot be deleted; revocation only changes future normal reads.
7. Sign one reviewed batch root and submit in resumable chunks, following the bulk-ingest shape already blessed in [[apps-cookbook]].
8. Verify admitted records and mirrors before the gallery marks the import complete.

“Upload first, moderate later” fails this use case.

## The demonstration

### Five-minute user story

1. A cold visitor opens the gallery without a wallet and immediately browses a curated general-audience collection.
2. They filter by two characters, one technique, and a negative content tag; the result page shows which index answered and the pinned lens/basis.
3. They open a work. The page distinguishes creator statements, curator tags, content warnings, source links, related variants, and mirror health.
4. They switch from the community lens to the creator-only lens; disputed tags disappear rather than being presented as erased.
5. One preferred mirror is disabled. The same object loads and verifies from an independent mirror without changing its link.
6. They open a comic pool and move through an exact ordered sequence.
7. They inspect tag history and see a synonym become an alias while the old assertion remains auditable.
8. A creator publishes a corrected edition; the old link renders as superseded and links to the new version.
9. A gateway deny advisory hides one synthetic policy-test item. The UI accurately says that this gateway no longer serves it—not that EFS deleted it.
10. A curator exports the whole selected collection and reconstructs it with no original gallery service.

### Required query set

- browse one bounded collection without an enhanced index;
- exact creator, tag, collection, and content-hash lookup;
- two- to five-tag intersections;
- negative tag, rating, file type, date, and source filters;
- creator-only versus curator-inclusive view;
- ordered pool traversal;
- original/preview/variant/translation relationships;
- duplicate and near-duplicate review;
- mirror failure and content-mismatch handling;
- revoked, superseded, denied, missing-preview, missing-original, and unknown-index states;
- tag alias and implication expansion with provenance;
- pagination at 10,000 items and the synthetic 1,000,000-item scale gate.

Ranked/trending/recommendation results may be enhanced/off-chain, but the client must label them as such and degrade to useful bounded browse rather than turning “index unavailable” into an empty gallery.

### Success measures

Engineering measures:

- all 10,000 originals reconstruct from the export and verify against commitments;
- no missing index/mirror state is rendered as proven absence;
- p50/p95 browse, intersection, autocomplete, and preview-load latency are measured at 10k and 1m;
- every derived preview traces to an exact original and derivation version;
- a second independently configured gateway can render the corpus;
- cost is reported as records, tag assertions, admission/relay, previews, original mirrors, and retention—not one blended “upload cost.”

User/community measures:

- at least 12 participating creators can explain the permanence/revocation distinction after the flow without prompting;
- at least 6 curators can maintain tags and collections without a developer;
- viewers can distinguish a creator claim from a curator claim in usability testing;
- creators use the export or cross-post flow for new work after the seed event;
- two independent curators create meaningfully different but useful lenses;
- one non-EFS operator successfully reconstructs and serves the gallery.

The user metrics are more important than a large synthetic corpus. A million fast empty test cards do not prove adoption.

## Product requirements exposed

### Must exist before a public seed

| Requirement | Why the community forces it | Likely layer |
|---|---|---|
| Local staging, quarantine, and preview | mistakes must be caught before permanent admission | client |
| Explicit permanence/revocation ceremony | ordinary upload expectations are dangerously wrong | client/policy |
| Publisher and rights-role declarations | creator, commissioner, character owner, and uploader differ | convention + client |
| Resumable signed batch ingest | 10k objects cannot require 10k signing ceremonies | SDK/admission |
| Original/preview/variant identities | thumbnails and edits must not impersonate originals | data convention |
| Fast tag index with bounded fallback | booru interaction fails without intersections and negative tags | enhanced index + core browse |
| Tag definitions, categories, aliases, implications, and provenance | the tag graph is the product | records/convention/client |
| Ordered pools and exact relationships | comics, series, variants, and translations depend on them | records/client |
| Content-hash and near-duplicate review | avoids fragmentation and source loss | core commitment + enhanced index |
| Pre-fetch content filters and warnings | thumbnails themselves can violate viewer policy | client/gateway |
| Deny-advisory and gateway-local blocks | serving operators have real duties | lens/gateway operations |
| Source, rights, and moderation intake | prevents third-party scraping from becoming the growth loop | operations |
| Export and independent reconstruction | “home” is not credible without walkaway | SDK/client |
| Cost fixture at 10k and 1m | current economics are unmeasured | performance/gas gate |

### Should follow

- creator cross-posting integrations for approved APIs/exports;
- saved searches, follows, notifications, comments, and moderation inboxes;
- human review tools for tag disputes and duplicate merges;
- assisted tagging whose suggestions remain attributed and reviewable;
- translation and image-region annotation;
- collection subscriptions and diff views;
- creator profile/commission links without making EFS a payment processor;
- portable personal blacklists and content preferences;
- optional playable-media preflight and sandbox.

### Explicitly defer or reject

- global trending as protocol truth;
- an official universal moderation lens;
- live-action adult UGC;
- public identity/age verification documents;
- marketplace payouts and subscriptions;
- paywalled plaintext;
- automatic ingest from public boorus or imageboards;
- a promise to delete public plaintext;
- an AI tagger that silently writes authoritative tags;
- requiring a wallet merely to browse.

## Acquisition sequence

### Phase 0 — interviews before code commitment

Interview:

- 12 independent artists across general, mature, and adult illustration;
- 6 booru/gallery taggers or moderators;
- 3 self-hosted/federated gallery operators;
- 3 web-game or animation creators;
- 2 rights-cleared collection stewards.

Test these questions:

- What did you personally lose, and was it bytes, metadata, followers, comments, sales, or identity?
- Which work would you deliberately make permanent? Which would you never?
- Who besides you has rights or safety interests in a commission?
- Would a durable source link change your willingness to let curators tag/rehost?
- Do you need deletion, pseudonym separation, or merely removal from normal discovery?
- What would make you publish the next new work through this flow?
- Would you run a lens or mirror, or only use the app?

If answers center on followers and payments rather than durable releases, keep EFS as an export attachment rather than building a new community platform.

### Phase 1 — synthetic and open-license engineering fixture

Build the 10k gallery fixture, measure it, and publish the export/reconstruction result. Use no controversial corpus to distract from proving the mechanics.

### Phase 2 — 50-creator pilot

Onboard 50 creators with 25–100 deliberately chosen works each. Pair them with independent curators. The project supplies tooling and documentation; creators supply bytes and rights statements; curators supply tags and collections.

### Phase 3 — reach 10k real works

Expand only through direct creator invitations, collection partnerships, and creator-to-creator referrals. A successful gallery should make the next artist’s portfolio easier to organize on day one because the shared tag vocabulary and collections already exist.

### Phase 4 — adult illustration/game opt-in lane

Only after the general/mature workflow operates safely:

- publish a separate content charter and jurisdiction scope;
- staff prepublication review and notices;
- obtain counsel review;
- use creator-owned illustrated works or redistributable game demos only;
- exclude live action and ambiguous/prohibited age categories;
- apply age/content policy before preview fetch;
- run under a competent serving operator, not as an unstaffed protocol promise.

## Top three fatal risks

### 1. Permanence can harm the creators EFS wants to protect

Artists change names, leave communities, withdraw commissions, discover a rights problem, or face stalking. A lens cannot erase public bytes or unlink the signed graph. If the intake flow treats permanence like a normal post, this market is not merely a poor fit—it is dangerous.

**Gate:** direct publisher authorization, local staging, role-aware rights statement, irreversible-publication ceremony, narrow initial charter, and no scraped bytes.

### 2. The gallery may require an unpriced centralized index to feel alive

Dense booru search means hundreds of thousands of assertions at 10k media items and much more at scale. Thumbnails, autocomplete, intersections, blacklists, duplicates, and related items are performance systems. If every useful path depends on one official indexer, EFS has recreated platform dependence; if every tag assertion is economically unreasonable, the network never starts.

**Gate:** 10k/1m performance and cost fixture, at least two independently reproducible indexes, bounded useful fallback, portable index inputs, and honest enhanced-result labels.

### 3. Seeding and moderation are operational work, not protocol emergence

The corpus needs creator recruitment, rights review, taxonomy stewardship, content warnings, tag dispute handling, mirror funding, and notices. None appears automatically because the records are permissionless.

**Gate:** name the steward, operator, two curators, and two mirrors before launch. If EFS-the-project must permanently become the sole gallery operator and moderator, the community wedge has failed its independence test.

## Kill criteria

Stop or narrow the gallery effort if:

- fewer than 25 creators will intentionally publish their own works after interviews;
- the only available seed is a scrape or third-party archive;
- creators cannot accurately explain public permanence after the ceremony;
- no independent curator or mirror operator participates;
- useful browse requires one opaque official index;
- the 10k cost snapshot has no credible payer;
- the client loads hidden/adult thumbnails before applying policy;
- rights roles cannot represent commissions and collaborative work;
- the team is tempted to call lens exclusion “deletion”;
- the adult pilot would require live-action UGC or unstaffed safety review;
- creators mainly need payments, private messaging, and audience reach and see no value in a durable edition/export.

## Highest-leverage gallery-lane action

Run a **two-week gallery discovery sprint** before choosing a community:

1. recruit 6 furry/independent artists, 3 tag curators, 2 indie game creators, and 2 open-collection stewards;
2. show a clickable concept of creator-only versus community-lens tags, mirror failover, and the permanence ceremony;
3. ask each participant to select five works they would and five they would not publish permanently;
4. map every refusal to rights, identity, deletion, payment, privacy, or UX;
5. use the resulting real corpus shape to finalize the 10k fixture and operator charter.

This one sprint tests the two assumptions desk research cannot: whether creators value the EFS layer enough to contribute, and whether informed permanence leaves a seed corpus large enough to create the gallery network effect.

## Confidence

| Claim | Confidence |
|---|---|
| A creator-consented gallery is materially safer than a scraped booru corpus | **High** — follows directly from platform takedown/DNP practice and EFS permanence |
| Fur Affinity creators have credible preservation pain | **High** — multiple first-party incidents and scale reports |
| Dense tagged browse is a strong EFS falsification fixture | **High** — incumbent feature evidence plus existing EFS collection/photo use cases |
| This community will adopt EFS | **Low until interviews** — no participants were contacted in this pass |
| The 10k/1m economics and latency are viable | **Unknown** — must be measured |
| Adult illustration can be a lawful phase-two lane | **Plausible, jurisdiction-dependent** — content charter and counsel required |
| Live-action adult UGC is inappropriate as an early public EFS app | **High** — consent/removal and specialist safety operations conflict with permanent public bytes |
