# Cross-community requirements and candidate first apps

**Status:** completed synthesis; product pressure and demo proposals only, not an amendment to the held EFS v2 design set
**Date:** 2026-07-29
**Inputs:** [[research-method]], the community cluster reports in this folder, [[use-cases]], [[apps-cookbook]], [[playable-archive-requirements]], [[lens-spec]], [[onchain-completeness]], [[large-file-uploads]], and [[system-surfaces]]

#status/done #kind/research #repo/planning #topic/use-cases #topic/content #topic/requirements #topic/market-research

## Bottom line

A pleasant tagged gallery is not one EFS feature. It is a stack:

1. a rights-aware importer and publishing ceremony;
2. exact media identities, byte commitments, mirrors, and derived previews;
3. a collaboratively maintained tag vocabulary;
4. bounded, independently verifiable collection structure;
5. an enhanced search/ranking index with an honest no-index fallback;
6. curator and safety labels with viewer-chosen action policies;
7. walletless browse, fast cards, and accessible media detail pages; and
8. serving-layer abuse operations that lenses cannot replace.

EFS v2 contains plausible primitives for items 2, 4, and 6. It contains design direction for parts of 5 and 7. It does not yet contain a finished gallery application, public contribution/moderation workflow, measured upload economics, or a staffed serving-layer policy. Those are launch facts, not reasons to add a “gallery” record kind.

## Shared product requirements

| ID | Requirement | Why real communities need it | Current EFS position | Gap or acceptance test |
|---|---|---|---|---|
| TC-01 | **Walletless public browse** | The first encounter is a link or search result, not an authorship ceremony. | Required by [[playable-archive-requirements]]; deep-link cold start exists in [[system-surfaces]]. | A stranger opens a collection and sees useful cards without a wallet, install, RPC choice, or unexplained trust dialog. |
| TC-02 | **Bulk, resumable, idempotent import** | Real archives arrive as exports, folders, APIs, or rescue batches; they are not hand-authored one record at a time. | Sign-one-root / submit-in-chunks is blessed in [[apps-cookbook]]; large-byte streaming is candidate work. | Import 10,000 objects, interrupt twice, resume from shared state, and send no duplicate transactions or byte uploads. |
| TC-03 | **Exact item and collection generations** | Citations, game packages, datasets, zines, and lifeboats need one name for one exact closure. | Required by [[playable-archive-requirements]] PAF-2 and [[use-cases]] R-BA4. | Still unresolved: reconcile pure DATA identity with exact canonical manifest bytes before any package/lifeboat promise. |
| TC-04 | **Original, preview, and derivative separation** | A thumbnail is not the source image; OCR is not the scanned page; a transcoded preview is not the master audio/video. | Generic files and derived background work are compatible; [[system-surfaces]] labels thumbnail outputs `derived`. | Every card exposes the source commitment and derivative provenance; deleting local previews never affects the original identity. |
| TC-05 | **Source, creator, rights, consent, and capture context** | These facts decide whether permanence is a gift or a violation. | Ordinary attributable claims and lens selection can represent them. | They must remain separate assertions—not one “safe/legal” bit—and the publishing tool must refuse a first-party byte pin when required evidence is absent. |
| TC-06 | **Booru-class tag vocabulary** | Mature galleries depend on aliases, implications, namespaces/categories, tag histories, tag wikis, disputed assertions, and user blacklists. | Typed TAG definitions/backlinks and lenses are directionally compatible. | Demonstrate alias/implication expansion, multi-author tag assertions, revision/history, bulk edit proposals, and local negative filters without promoting one vocabulary to kernel truth. |
| TC-07 | **Selective intersections plus enhanced search** | People search `character + medium + rating`, filter, sort, and page; they also expect text, similarity, popularity, and recommendations. | [[onchain-completeness]] permits bounded/selective k-tag AND; ranked/full-text/trending/global aggregates are explicitly enhanced/off-chain. | Ship a portable, rebuildable search snapshot and visible degraded mode. Index loss may remove relevance/ranking, never the ability to browse a bounded collection or inspect an exact item. |
| TC-08 | **Fast, stable media grid** | A gallery lives or dies on first paint, card density, aspect ratios, responsive filters, and scroll restoration. | Visual catalog is required in [[playable-archive-requirements]]; thumbnailer-at-launch remains open in [[system-surfaces]]. | 10,000-item fixture: useful first cards from cached metadata; no original-byte hydration during grid browse; fixed card geometry; keyboard and screen-reader navigation; return to exact scroll/filter state. |
| TC-09 | **Multiple curators without a universal moderator** | Communities disagree about quality, canon, safety, tags, and recommendations. | This is the lens model's strongest fit; [[lens-spec]] supplies Lens/View/Starter Pack/Labeler/Action Map and DISCOVERY vs authority separation. | Show provenance per assertion and save/share one reproducible View. A new curator can add value without copying or taking ownership of the source object. |
| TC-10 | **Safety actions distinct from evidence** | Adult rating, flashing imagery, gore, malware, rights dispute, and playability are different facts with different viewer actions. | [[lens-spec]] separates labels from Action Maps; GATE is fail-closed for execution. | Closed action vocabulary per app: blur, warn, age-gate, omit, quarantine, refuse execution, or show metadata-only. Unknown labels cannot silently become “allow.” |
| TC-11 | **Personal mute/blacklist at scale** | Booru, fan, and adult communities rely on large user-specific exclusion lists. | Rich client lenses can subtract/deny; remote resolution of a personal interest graph has privacy costs. | Apply a 1,000-tag local blacklist without sending it to a remote search service; explain when server-side search may still learn the positive query. |
| TC-12 | **Duplicate and near-duplicate handling** | Reposts, resized art, mirrors, dataset copies, and alternate encodes are ubiquitous. | `contentHash → DATA` is required by [[use-cases]]; perceptual similarity is enhanced/client work. | Exact duplicates collapse or cross-link by commitment; near-duplicates remain explicit, provenance-bearing relationships—not silent replacement. |
| TC-13 | **Proposal/review queues** | Strangers contribute tags, mirrors, corrections, translations, tests, and takedown evidence. | Commenter-owned parallel records are blessed; public moderation/review apps are deferred by [[playable-archive-requirements]]. | A contributor never takes ownership of the target. Curators can accept, reject, supersede, or leave competing proposals visible; spam budgets are measurable. |
| TC-14 | **Honest withdrawal vocabulary** | Authors and curators expect removal controls even though EFS cannot erase plaintext. | Current client language distinguishes unlist/revoke from deletion. | Before publish, say “public forever.” After publish, offer withdraw placement, move channel head, issue deny/takedown advisories, and stop serving—never “delete.” |
| TC-15 | **Portable export and reconstruction** | The first home must not become the next trap. | `.efs-bundle` is a MUST in [[use-cases]]; walk-away posture is established elsewhere in the vault. | Rebuild one collection from keys/bundle, public records, and declared mirrors with no EFS-operated index or gateway. Enhanced ranking may differ; exact membership and cited views may not. |
| TC-16 | **Measured per-item economics** | A community cannot budget an archive from “one signature” alone. Tags, index postings, byte mirrors, relayers, and previews all cost something. | Gas snapshot remains open; large-upload funding is explicitly exogenous in [[large-file-uploads]]. | Publish fixture bills for 10k gallery items, 3k datasets/10k versions, and 100 packages. Separate one-time admission, byte retention, query service, and operator costs. |
| TC-17 | **Serving-layer abuse operations** | Copyright notices, illegal-content reports, age/jurisdiction restrictions, hash deny-lists, and appeals apply to actual gateways/apps. | Existing legal posture places these at accountable doors, not the kernel. | Do not launch a first-party public media gateway until its operator, notice path, escalation runbook, deny sources, audit logging, and staffing are real. |

## What lenses solve—and what they do not

### They solve

- Competing collections over one shared item graph.
- Curator-specific recommendations, classifications, tag assertions, warnings, and denials.
- Viewer-selected starter packs and reproducible views.
- Separation of discovery from authority and labels from actions.
- Withdrawal of a recommendation or placement without rewriting history.

### They do not solve

- Deleting plaintext or making an unlawful byte cease to exist.
- Proving that an uploader owns copyright or had a depicted person's consent.
- Detecting CSAM, non-consensual imagery, malware, or mis-rated adult material by themselves.
- Discharging a gateway operator's notice, reporting, age-assurance, sanctions, or jurisdiction duties.
- Hiding a viewer's interests from the endpoint that serves their search and media requests.
- Providing payments, commissions, subscriptions, tax handling, chargebacks, or creator income.
- Making global ranked/full-text search part of 100-year independently verifiable core truth.

This distinction is why “the lens will moderate it” is not an adequate launch plan.

## Candidate first apps

### App A — Visual Lifeboat

**Community:** consent-based community photographers, Flickr collection makers, local-history groups, and small archives.

**Demo:** import a self-contained, consent-bearing photo collection; publish an exact manifest and source commitments; browse a fast gallery; switch between three curator Views; inspect creator/license/context and derivative provenance; export and reconstruct the collection.

**First useful corpus:** 1,000 public-domain or explicitly consented images, then 10,000 item/version/derivative objects. The [Flickr Foundation's Data Lifeboat](https://www.flickr.org/programs/content-mobility/data-lifeboat/) is unusually strong precedent: it preserves images with technical and social metadata, makes consent explicit for other people's photos, produces a browser-readable package, and asks the curator to write context for future readers.

**Why it is a good EFS test:** it delivers the requested gallery, uses overlapping curation, starts with a clean rights chain, and makes EFS a permanent home for a portable artifact instead of demanding that a living social platform migrate.

**Do not promise:** private family-photo hosting, withdrawal of public plaintext, or automatic preservation of comments/people metadata without consent review.

### App B — Public Data Receipt

**Community:** data-rescue volunteers, librarians, journalists, civic technologists, and institutional repositories.

**Demo:** import 100 rescued dataset records from multiple offices; attach exact version manifests, checksums, original source, capture date, steward, license, and several byte locations; compare two versions; cite one exact snapshot; show `BYTES-PARTIAL` when a mirror fails; reconstruct from a portable bundle.

**First useful corpus:** the [Data Rescue Project portal](https://portal.datarescueproject.org/) already reports thousands of rescued datasets across many government offices and exposes the coordination problem EFS is good at. Start as an integrity and mirror graph above the existing repositories; do not compete with ICPSR/DataLumos curation and storage.

**Why it is a good EFS test:** the need is current and non-speculative, most content is intended to be public, provenance and exact versions matter more than social features, and each independent mirror/steward improves the graph.

**Do not promise:** that every government dataset is free of personal data, that EFS supersedes repository review, or that on-chain admission makes a dataset authentic or methodologically sound.

### App C — Rights-Cleared Playable Commons

**Community:** open-source/freeware/homebrew/demoscene creators, preservation-minded modders, and—in a separately labeled collection—opt-in adult indie-game creators.

**Demo:** 25–100 exact packages with screenshots, tags, license/redistribution state, content warnings, runtime compatibility, test receipts, version channels, and multiple mirrors. Browse without a wallet; inspect; preflight; explicitly launch; return with local save state.

**First useful corpus:** existing MIT/CC0/open web-game fixtures plus direct creator opt-ins. Adult creators have an unusually legible pain event: in July 2025 itch.io [deindexed all adult NSFW content](https://itch.io/updates/update-on-nsfw-content) under payment-processor pressure across an open platform with more than two million product pages; it later [reindexed free adult content](https://itch.io/t/5149036/reindexing-adult-nsfw-content) with new warning requirements while paid-content constraints remained.

**Why it is a good EFS test:** it reuses the deepest existing application pressure test, version and mirror contributions create network effects, and creator-owned packages avoid the core legal defect of abandonware/ROM rehosting.

**Do not promise:** payments, marketplace discovery parity, redistribution rights inferred from availability, or safe execution without the isolated player lane.

### App D — Creator-Controlled Gallery

**Community:** illustrators, furry artists, adult artists, comic creators, and small creator collectives that deliberately want permanent public releases.

**Demo:** 20–100 creators publish 2,000 rights-asserted works through an explicit permanence ceremony; users browse general and adult-safe Views, apply local blacklists, inspect source/artist/commission context, follow creator channels, and overlay specialist taggers without letting them impersonate the creator.

**First useful corpus:** creator exports and new releases only—never scrape a booru. Fur Affinity's own 2026 announcements provide the pain in miniature: a notification pruning process ran early and removed historical notification rows that staff said could not be restored. Booru systems supply the tag/search benchmark, not the seed rights model.

**Why it is a good EFS test:** dense visual tagging and multiple curators are a nearly perfect lens workload; adult and furry creators have real platform and payment fragility; creator opt-in gives a plausible first rights chain.

**Do not promise:** that permanence prevents deindexing, provides income, protects against copying or AI training, supports later pseudonym unlinking, or honors a true delete request.

### App E — Community Press Vault

**Community:** zine libraries, local-history groups, small presses, convention/program archives, and creator-controlled dead-platform exports.

**Demo:** 50 publications with issue/volume structure, page images, OCR derivatives, cover gallery, contributor and license assertions, collection essays, and overlapping topic/community Views. A citation opens an exact page and version; an unavailable OCR index degrades to issue browsing.

**First useful corpus:** one partner archive with contributor permissions or clearly redistributable issues. Network growth comes from cross-collection names, subjects, events, citations, translations, and mirrors—not from anonymous uploads.

**Why it is a good EFS test:** the scale is small-team tractable, cultural-loss pain is obvious, visual browsing matters, and the archive can start partner-led instead of permissionless.

**Do not promise:** that possession of a scan grants redistribution rights, that OCR is authoritative, or that sensitive community history belongs on a public immutable graph.

## Current-design pressure register

These are findings to carry into later design work; this report does not edit the held designs.

| Pressure | Current state | Consequence for target-community work |
|---|---|---|
| Exact manifest-generation identity | Open in [[playable-archive-requirements]] | Blocks a strong claim for packages, datasets, lifeboats, and multi-file zines. |
| Gas and aggregate index bill | Unmeasured gate in [[onchain-completeness]]/[[use-cases]] | Blocks pricing, subsidies, and any claim that a dense tag graph is affordable. |
| Large-upload completion funding | Explicitly unsolved in [[large-file-uploads]] | A relayer can resume an authorized upload, but nobody is obligated to fund completion or long-term mirrors. |
| Thumbnailer at launch | Open in [[system-surfaces]] | A gallery without fast derived previews feels dead; this needs an early product decision even though it is not protocol surface. |
| Enhanced index product | Allowed but non-core in [[lens-spec]] | A gallery needs one or more rebuildable search operators, snapshot formats, and honest outage UX. “Off-chain” is a boundary, not an implementation plan. |
| Public contribution and moderation app | Deferred by [[playable-archive-requirements]] | Any public community pilot must either build the queue or start with repository/partner-reviewed ingestion. |
| Age/content-warning policy | Expressible through labels and Action Maps, not specified as one universal policy | Adult pilots need jurisdiction and operator review; do not freeze adult taxonomy into EFS. |
| Walletless guest viewer and deep-link closure | Designed as a product requirement, not implemented evidence here | Every candidate depends on this being genuinely fast and legible. |
| True deletion | Structurally impossible for published plaintext | Excludes many personal-photo, private-community, health, genealogy, leaks, and non-consensual-media cases from first-party byte hosting. |
| Stable source/provenance vocabulary | Generic claims suffice, but conventions are not yet named | Importers need versioned mappings for source URL, capture time, creator, license, consent, rights review, derivative role, and mirror status. |

## Pilot gates

A candidate is ready for a real community pilot only when:

- one identifiable seed steward signs up and owns the rights/consent review;
- the first corpus has a written inclusion policy and an explicit excluded-content list;
- the item/collection manifest and export formats are versioned;
- walletless browse, grid, filter, detail, citation, and no-index fallback pass the fixture;
- every original and derived byte has a commitment, role, source, and availability state;
- curator provenance and View switching work without a universal moderator;
- the permanence warning appears before—not after—the first public signature;
- upload and steady-state bills are measured for that corpus;
- the serving operator has a real abuse/notices runbook; and
- one independent operator reconstructs and serves the corpus without EFS-project infrastructure.
