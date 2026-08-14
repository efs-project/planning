# Booru / Sankaku-style application on EFS

**Status:** draft
**Target repos:** planning, contracts, sdk, client
**Depends on:** [[media-infrastructure]], [[query-and-indexing]]
**Reviewers:** 2026-08-14 — independent authority/architecture pass; no Critical or Important finding after repair
**Last touched:** 2026-08-14

#status/draft #kind/design #repo/planning #repo/contracts #repo/sdk #repo/client #topic/media-library #topic/gallery #topic/content #topic/privacy

## Problem

A useful booru is not a thumbnail grid. It is a collaboratively maintained
knowledge graph, a high-performance search product and a moderation operation.
Users depend on dense tags, aliases, implications, negative filters,
source/artist recovery, pools, annotations, duplicate review and personal
blacklists. Conventional boorus often centralize mutable truth, index access,
moderation authority and exit in one operator.

EFS should preserve the successful interaction model while improving
portability, provenance, plural moderation, exact-byte verification and
walk-away reconstruction. It must not turn public permanence into an excuse to
scrape or republish an incumbent corpus without authorization.

The primary research sources are
[[Reviews/2026-07-29-target-communities/visual-gallery-and-booru-ecosystems]],
[[Reviews/2026-07-29-target-communities/requirements-and-first-apps]] and
[[Reviews/2026-07-29-target-communities/gallery-opportunity-ranking-and-launch-plan]].
This design records the product shape and links those detailed analyses rather
than copying their market evidence.

### Primary-source Sankaku follow-up, 2026-08-14

Official Sankaku material supports the product benchmark without defining an
EFS protocol:

- the original Channel product was Danbooru-derived and combined user-tagged
  posts with author/source/series treatment, ambiguity handling, pools, votes,
  favorites, comments, notes, wiki contributions and privileged moderation
  roles ([Channel v2 announcement](https://news.sankakucomplex.com/2008/08/22/sankaku-channel-v2/));
- current official Sankaku Idol help documents implicit `AND`, explicit `OR`,
  exclusions, prefix wildcards, rating and actor predicates, exact MD5, numeric
  and date ranges, parent/pool/moderation predicates and many sort orders. It
  also documents combinations that do not compose reliably, which reinforces
  the requirement for an explicit query grammar and honest unsupported states
  ([advanced search](https://iapi.sankakucomplex.com/wiki/help%3A_advanced_search_guide),
  [quick guide](https://iapi.sankakucomplex.com/wiki/help%3A_quick_guide));
- typed and ambiguous tags, directed aliases/implications, ordered pools,
  blacklists, subscriptions and full tag-edit history support first-class
  vocabulary, collection, viewer-policy and provenance models
  ([tags](https://iapi.sankakucomplex.com/wiki/help%3A_tags),
  [pools and blacklists](https://news.sankakucomplex.com/2016/02/21/sankaku-app-1-8-pools-blacklists/),
  [upload/edit history](https://news.sankakucomplex.com/2016/04/09/sankaku-app-2-0-uploading-editing/)); and
- Sankaku distinguishes popularity from quality and has shipped automated tag
  suggestions that users can correct. EFS should preserve ranking recipes and
  machine/model outputs as attributable claims rather than canonical truth
  ([rankings](https://news.sankakucomplex.com/2013/04/03/introducing-sankaku-channel-rankings/),
  [AI tagging](https://news.sankakucomplex.com/2023/06/03/sankaku-ai-tagging-free-for-everyone/)).

The detailed current help corpus is for **Idol**, and its own tag help says
Idol and Channel use different category sets. The legacy Channel host did not
yield a current public developer specification. These sources are therefore
verified product evidence, not proof of current Channel syntax, roles, limits
or export compatibility.

## Product promise

An ordinary visitor can open a normal link without an account or wallet,
browse a fast rights-reviewed gallery, combine rich public tags, apply private
blacklists, inspect exact media and provenance, and switch among attributable
curator/moderation views. A creator, curator or successor operator can export
and reconstruct the useful catalog without accepting one hosted index as
canonical.

## Requirements

| ID | Requirement | First proof |
|---|---|---|
| BOORU-01 | A Post/Submission has its own identity and moderation/source history, distinct from Work, Representation and Exact Blob. | Two posts may reference the same blob without merging uploader, source or moderation histories. |
| BOORU-02 | Tag concepts use stable namespace-scoped identity; labels, spellings and translations are presentation. | Rename and translate a label without changing prior assertions. |
| BOORU-03 | Tag assertions and denials are attributable, immutable evidence; edits append history rather than rewriting another curator. | Two curators agree once and conflict once; both views reconstruct. |
| BOORU-04 | Aliases, implications, replacements and categories are directional, versioned and sourced. | Reverse an implication and fail the fixture; preserve raw imported terms. |
| BOORU-05 | Search supports dense exact tags, Boolean intersection/union, negative filters, namespaces/metatags, rating/safety filters, exact digest, bounded numeric/date ranges, explicit sorting, pagination and private blacklists. Unsupported compositions fail clearly. | Required query matrix passes with provider/basis/coverage shown. |
| BOORU-06 | Grid browsing never hydrates originals and applies viewer policy before preview fetch. | 10k-card trace has fixed geometry and zero original requests; blocked cards create zero preview requests. |
| BOORU-07 | Pools, galleries, comics/sets, parent-child/replacement and region/time notes preserve order, target version, author and history. | Ordered-pool and annotation vectors survive round trip. |
| BOORU-08 | Exact, decoded, perceptual and human duplicate judgments remain separate. | A near match only opens a review candidate; no automatic merge or tag transfer. |
| BOORU-09 | Creator, source, artist, character/series and rights relations remain explicit and attributable. | Source dedupe retains both source observations and rights caveats. |
| BOORU-10 | Ratings and warnings preserve creator and curator authorship; unknown fails closed. | Switching Lens changes presentation without changing evidence. |
| BOORU-11 | Public contribution has proposal/review/quarantine and receipts before irreversible publication. | Unsupported, leaking, duplicate and rights-incomplete inputs end in enumerated states. |
| BOORU-12 | Moderation is plural and operationally enforceable without becoming protocol-canonical. | Two independently reconstructed Lenses differ; report/notice/appeal evidence remains attributable. |
| BOORU-13 | Loss of The Graph removes enhanced search, not exact inspection, bounded browse or export. | Disable every Graph endpoint and retain an honest, useful fallback. |
| BOORU-14 | Import/export adapters preserve ecosystem-specific post IDs, tags, histories, pools, notes, ratings and replacement/deletion state. | Danbooru/e621/Hydrus golden records round-trip without silent flattening. |
| BOORU-15 | Scale and economics are measured, not inferred. | 10k representative and synthetic 1m corpora report Core, Graph, storage, previews, traffic and moderation separately. |
| BOORU-16 | A creator/uploader can append withdraw, unlist, supersede and stop-serving requests without pretending already public bytes/history can always be erased. | Selected operator and Lens stop presenting/serving the item while the export preserves the request, disposition and honest persistence limits. |
| BOORU-17 | The detail viewer supports a complete gallery journey: next/previous in a basis-pinned query or pool, zoom/pan/fullscreen, animation/video controls, annotation overlays and an explicit original fetch. | Keyboard/touch journey crosses image, animation and video fixtures without eager original requests or losing query position. |
| BOORU-18 | The UI discloses which provider, RPC, gateway and media Locator can observe public queries, selected targets and range requests; private filters remain local. | Observer transcript distinguishes local-only inputs from every public request and reveals no private blacklist values. |

These specialize the existing `TC-*` and `ML-*` ledgers; they do not replace
them.

## Proposed media and community model

### Post versus Work

```text
Post / Submission
  ├─ presents Work or exact Representation
  ├─ uploader/source observation
  ├─ rating/warning claims
  ├─ moderation state and history
  ├─ parent/child/replacement relationships
  └─ comments/favorites/reactions (later)

Work
  ├─ creator/character/series/source relationships
  ├─ authored Editions
  └─ Representations / Exact Blobs
```

This preserves two valuable notions:

- exact and creative identity can deduplicate retrieval; and
- community submissions can retain distinct provenance, discussion,
  moderation and display choices.

### Vocabulary

A tentative `TagConcept` contains a stable concept identity and namespace, not
one canonical English string. Separate authored records provide:

- display labels and translations;
- category/namespace membership;
- aliases and replacements;
- directional implications;
- definitions/wiki text and sources;
- confidence or review status; and
- governance proposals and dispositions.

Namespaces initially needed for credible fixture/search work include:

```text
artist, creator, character, series, subject, species, place,
technique, medium, source, rating, warning, technical, meta
```

This is illustrative, not an adopted universal ontology. Imported ecosystem
namespaces and unmapped tags remain recoverable.

### Attributable tag claims

The atomic public statement is conceptually:

```text
TagAssertion(
  target = Post | Work | Representation,
  tagConcept,
  polarity = ASSERT | DENY,
  scope,
  confidence?,
  evidenceRefs[]
)
```

Authorship belongs to the Occurrence, not to an author field inside shared
statement identity. The same neutral assertion may have multiple authored
Occurrences. Curator policy selects which assertions count in a displayed
view; it does not erase the rest.

### Collections and annotations

- `OrderedCollection` plus version-targeted `OrderedEntry` covers pools,
  galleries, comics, artbooks and sequences.
- Parent/child and replacement are typed relations, not magic post fields.
- Region annotations bind to an exact image canvas/orientation and language.
- Time annotations bind to a specific video/audio representation and timeline.

### Moderation and safety

Separate evidence kinds should cover:

- creator rating and content warning;
- curator classification and denial;
- operator admission/quarantine/refusal;
- report, notice and appeal;
- Lens inclusion, blur, warning or omission; and
- block/mute policy owned by the viewer.

Core records preserve claims. The serving operator remains responsible for
what it stores and presents. A Lens cannot establish legal rights, obtain
consent, remove every public copy or replace staffed operations.

## Search language and behavior

The application should compile a human query into a versioned query AST before
choosing a provider. Representative syntax:

```text
subject:fox artist:alice
character:foo series:bar -rating:adult
pool:example type:video width:>=1920
source:example.org order:newest
```

Required semantics:

- adjacent positive terms are `AND`;
- explicit `OR` groups are versioned and bounded in the client grammar;
- unary `-` means exclusion inside an explicit covered universe;
- namespace and metatag resolution occurs before provider selection;
- aliases and implications expand under an explicit vocabulary version/Lens;
- public and private filters join locally so a personal blacklist is not sent
  to the public provider;
- the query plan discloses which provider/RPC can observe the positive public
  query, and the media plan separately discloses which gateway/Locator can
  observe selected targets and range patterns;
- every result page names provider, Realm set, chain basis, coverage and
  completeness; and
- `UNKNOWN` or partial coverage is visually distinct from zero results.

[[query-and-indexing]] owns placement. Exact IDs, single-tag postings and typed
backlinks are onchain targets. Selective multi-tag joins must be prototyped and
measured onchain before deferral. Global full text, arbitrary ranking and huge
open-world Boolean queries may use The Graph only after that falsifier.

## Application surfaces

### Guest browse

- walletless entry and useful first cards from preview metadata;
- dense responsive grid with stable geometry and scroll restoration;
- keyboard and screen-reader navigation;
- tag chips, autocomplete, query explanation and saved local searches;
- next/previous navigation within a basis-pinned search or ordered pool, with
  stable return-to-grid position;
- zoom, pan, fullscreen, animation/video controls and optional annotations;
- explicit hidden/unavailable/unverified/mismatch states;
- detail page with creator/source/rights evidence and all identity layers;
- an explicit, labeled request before fetching the original or starting video;
  and
- a request-observer disclosure for query provider, RPC, gateway and Locator.

### Curator workspace

- proposal queue for tags, vocabulary edges, pools and annotations;
- diff against selected curator view;
- bulk operation preview with exact item count and cost;
- duplicate and better-source review;
- history, rationale and source evidence;
- sign/publish ceremony separated from local drafting; and
- receipts for success, skip, quarantine and failure.

### Creator/steward intake

- exact file verification and embedded-metadata inspection;
- explicit edition and source attribution;
- preview/derivative disclosure;
- rights and consent evidence with residual caveats;
- audience/rating/warning selection;
- metadata leakage preview; and
- clear permanence and withdrawal limitations before publication, plus an
  append-only withdrawal/unlist/stop-serving request path afterward.

### Moderation operations

- prepublication quarantine;
- reports, notice and appeals;
- duplicate/source correction without deleting history;
- operator unlist/stop-serving dispositions that preserve the underlying
  request and do not promise global erasure;
- block/mute and Lens policy;
- hot-subject and tag-spam controls;
- operator-specific serving refusal; and
- auditable policy version and basis.

## The Graph role

When [[query-and-indexing]] records an exact onchain falsifier, the reference
subgraph may materialize public derived entities such as tag-to-target
postings, vocabulary expansion, collection membership, selected curator views,
facets and search documents. It must retain underlying EFS identifiers and
basis so clients can verify returned records against Core.

The subgraph must not:

- define canonical tag truth, Work identity, rights or moderation;
- ingest a private blacklist or unpublished library;
- become the only way to enumerate or reconstruct public evidence;
- turn indexing failure into an empty result; or
- make one deployment or gateway the official EFS media database.

The current official Graph documentation describes a subgraph as an open API
that maps blockchain events/state into GraphQL entities; see
[Subgraphs](https://thegraph.com/docs/en/subgraphs/overview/),
[the manifest](https://thegraph.com/docs/en/subgraphs/developing/creating/subgraph-manifest/)
and [GraphQL metadata](https://thegraph.com/docs/en/subgraphs/querying/graphql-api/).
Exact EFS media manifests, mappings and supported network assumptions remain a
prototype deliverable.

## Product slices

### Booru Slice 0 — existing semantic proof

The retained fixture proves identities, claims, disagreement, alias,
implication, pool, annotations, duplicate evidence, private state, exact bytes
and reconstruction. It is not a usable booru.

### Booru Slice 1 — read-only discovery

Use an authorized/synthetic 10k candidate and support:

- guest grid/detail without original hydration;
- tag, alias, implication and negative filtering;
- creator-only and curator-inclusive views;
- visible curator disagreement;
- pool and annotation navigation;
- policy-before-preview;
- one Core-only degraded browse; and
- the same enhanced queries through the first provider proven necessary.

There are no public submissions or permanent writes in this slice.

### Booru Slice 2 — governed contributions

Add local drafting, explicit signing/admission, tag and vocabulary proposals,
duplicate/source review, public receipts, moderation queue, reports and
appeals. Use only a separately authorized corpus and serving operation.

### Later community surface

Comments, favorites, reactions, votes, follows, playlists, saved public
searches, assisted tagging and recommendations remain later. Their authored
history may be portable, but aggregate popularity and recommendation never
become protocol-canonical authority.

## Acceptance and measurements

The 10k gate reuses the p50 35 / p95 100 tag fixture in
[[Reviews/2026-07-29-target-communities/gallery-opportunity-ranking-and-launch-plan]].
The synthetic 1m gate follows only after marginal costs remain stable.

Required measurements include:

- cold first cards, warm reload, tag autocomplete and query latency;
- zero original fetches during grid browse;
- 1,000-tag private blacklist with no remote disclosure;
- positive-query/RPC, result-click/gateway and media-range/Locator observer
  transcript, with private filters absent from every public request;
- rare and extremely hot tag postings;
- 2/3/5-tag selective intersections, low-result adversarial cases and negative
  filters;
- tag spray, edit/withdrawal churn and duplicate-subject deduplication;
- 1/8/32/64 curator policies;
- Core, onchain view and Graph result parity at one basis;
- Graph backfill, lag, indexing error, reorg, outage and deletion/rebuild;
- duplicate precision/recall for exact, crop, encode, animation and video; and
- separate Core, Graph, byte storage, preview, bandwidth and moderation cost.

Kill or resize the design if the useful guest surface depends on hidden central
state, private blacklists must be disclosed remotely, independent
reconstruction fails, or rights/moderation operations cannot be staffed.

## Acquisition and safety boundary

The booru interaction model is the benchmark; an incumbent booru is not the
default corpus. Public media must come from creators/rightsholders, authorized
stewards, or an operator-reviewed open/public-domain basis with attributable
evidence. Do not scrape boorus, Pixiv, Fur Affinity, Reddit, imageboards, manga
sites or adult platforms into permanent public bytes.

Adult communities are valid users, but a public adult lane needs a named
operator, prohibited-content policy, age/presentation policy, prepublication
review, notices, appeals, jurisdiction and counsel. Lenses and decentralization
do not eliminate those duties. See
[[Reviews/2026-07-29-target-communities/adult-media-displacement-and-safety-boundaries]].

## Limitations and research debt

- No serious gallery UI or search implementation exists yet.
- No application profile, query AST or subgraph schema is frozen.
- Stage B has not measured the tag write/read bundle.
- The 2026-08-14 official-source pass above establishes a Sankaku product
  baseline, but not current Channel parity. Current Channel tag categories,
  alias/implication governance, role capabilities, moderation and appeal
  rules, account/Plus limits, native-client availability, visual similarity
  behavior and user-visible export remain unverified. No supported public
  Channel API, bulk-export or authentication contract was found. Close those
  gaps through an operator interview or authorized client observation, not
  undocumented third-party API libraries.
- No Danbooru/e621/Hydrus importer or golden round-trip exists.
- Recommendation and perceptual search need separate computation outside The
  Graph; only resulting versioned public evidence/edges may be indexed.
- Censorship resistance and lawful presentation remain a tension managed by
  plural custody and plural Lenses, not “solved” by a contract.

## Open questions

- [ ] Is the first public identity a Post targeting Work, Representation or
      either with explicit validation?
- [ ] What smallest tag-membership shape permits same-basis point probes for a
      selective onchain multi-tag join?
- [ ] Which vocabulary expansion semantics are safe and bounded enough for the
      Core-only fallback?
- [ ] What moderation evidence belongs in portable public history versus a
      confidential operator case file?
- [ ] Which exact Sankaku behaviors are product requirements rather than
      incumbent-specific implementation details?

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed
- [ ] Dependencies are accepted/landed or explicitly treated as provisional
- [ ] No `<!-- AGENT-Q: -->` comments remain
- [ ] At least one `#status/review` pass receives another agent or human review
