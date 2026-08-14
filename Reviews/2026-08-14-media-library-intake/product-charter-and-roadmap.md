# EFS Media Library / Booru product charter and roadmap

**Status:** proposed durable product charter; common spine is mature research,
first-product ordering is an unconfirmed media-use-case input to `V2-F2`
**Date:** 2026-08-14

#status/draft #kind/product #repo/planning #topic/content #topic/efsv2 #topic/media-library

> This charter does not adopt application Type bytes, freeze Core, authorize a
> public corpus, choose a Realm, or authorize implementation. It names the
> durable product promises and the gates a later implementation must pass.

## Mission

Build a personally useful, credibly neutral and long-lived library for images,
video and related media. A person, archive or curator community can preserve
exact files, describe them richly, disagree without one operator becoming
canonical, keep private organization private, and walk away with enough
portable evidence for another implementation to reconstruct the useful view.

## Durable product promises

1. **Identity stays honest.** Creative works, authored editions, exact blobs,
   representations, derivatives, source submissions and current selections are
   distinct. Exact equality can reuse bytes without erasing provenance.
2. **Claims stay attributable and plural.** Tags, aliases, implications,
   warnings, ratings, provenance, rights and moderation remain authored claims.
   A Lens selects presentation; it does not rewrite disagreement into truth.
3. **Private use works without publication.** Local tags and collections need
   no Core write. Encryption, exports and retrieval disclose their actual
   leakage and recovery properties.
4. **Bytes are verified before use.** Locators are replaceable observations,
   never identity. Corrupt or unproven bytes are not displayed; large media can
   be checked incrementally.
5. **Exit is a product feature.** Normalized records, raw source evidence,
   exact manifests and media fixity support a second implementation and
   operator without the originating app, hosted index or Commons.
6. **Core remains generic.** Media semantics, moderation, search, ranking,
   recommendation, similarity, adapters and UI stay above Core unless an exact
   contract trace defeats every generic alternative.

## Users and jobs

| User | Minimum valuable job |
|---|---|
| personal librarian | import a folder, verify originals, organize privately, find media offline, and export without publishing |
| archive steward | retain exact files, source/rights evidence, revisions, mirrors and repair observations |
| curator | publish attributable tags, ordered pools, warnings and disagreements without gaining global authority |
| guest reader | browse a deliberately operator-reviewed selected catalog with attributed rights evidence and residual caveats, receiving verified previews/originals with honest policy and availability states |
| successor operator | rebuild the public selected view and verify bytes from portable inputs alone |

## First-product ordering — unconfirmed `V2-F2` evidence input

- **Personal/local-first (recommended):** import, verification, private
  organization and offline browse are useful before publication; a reviewed
  subset can be promoted into a small public catalog.
- **Public-gallery-first:** anonymous guest browse of a deliberately
  operator-reviewed proof gallery is the first acceptance surface; private
  library behavior follows.

Both paths use the same fixture and architecture boundary. The choice changes
which journey defines MVP completion and where design effort starts; it does
not justify a different Core. Committing this charter does not confirm either
ordering or answer the broader `V2-F2` first-product implementation decision.

## Smallest compelling MVP

The recommended personal/local-first MVP is complete only when one clean client
can:

1. import the exact fixture originals and raw source observations;
2. compute SHA-256 plus size, retain embedded metadata, and create one pinned
   derivative without changing the original;
3. browse originals and safe previews offline, apply a private tag/collection,
   and search the local library;
4. publish a deliberately selected public catalog containing two conflicting
   curators, directional vocabulary edges, an ordered pool, image-region and
   video-time annotations, rights evidence and `NOASSERTION`;
5. retrieve A, A-prime and requested ranges of V from plural Locators, reject a
   corrupt primary and verify the fallback;
6. export normalized JSONL, raw adapter evidence, manifests and fixity in a
   SHA-256 BagIt package; and
7. let a clean second implementation rebuild and serve the public selected view
   without the first app database or enhanced index.

The public-gallery-first variant uses steps 4–7 as its first visible surface,
but that surface is not MVP-complete: full completion still requires steps
1–7, including the private/offline fixture obligations.

## Roadmap and exit gates

### M0 — candidate evidence assembled; exit pending (current)

- still and video candidate bytes with retained, attributed open/public-domain
  rights evidence and explicit residual caveats;
- two source observations resolving to identical bytes;
- deterministic derivative recipe arm;
- first/middle/final `ChunkTree/1` proposal vectors;
- concrete plural/public/private semantic atoms; and
- authority-aware Core pressure map and standards/adapters review.

**Exit:** independent review finds no unlabelled adoption claim; every missing
byte, authority and reconstruction obligation is explicit.

### M1 — exact profile and fixture

- choose first-product ordering;
- pin application profile versions and fixture actors;
- produce A-prime twice and reproduce it independently;
- instantiate candidate profile-pinned Type/Record/Occurrence fixture bytes
  when generic proposal interfaces exist; and
- publish golden vectors for exact, corrupt, missing, surplus and conflicting
  cases.

**Exit:** two implementations derive every public fixture identifier and verify
every byte/proof identically. No media-specific Core change is accepted without
an exact failing trace and falsifier.

### M2 — useful local library slice

- resumable folder/API import with success/skip/quarantine/failure receipts;
- local grid/detail, private tags/collections, offline cache and verified media;
- metadata inspection/sanitization and exact/perceptual duplicate review; and
- encrypted export/import, cache loss and key-loss behavior.

**Exit:** the owner can use it on a real personal folder for routine browse and
organization without a hosted service or public write.

### M3 — portable public catalog slice

- deliberate promotion ceremony and rights/source review;
- plural curator claims, Lenses, warnings and guest-safe previews;
- plural Locator repair and verified video range playback; and
- BagIt walk-away export plus clean second-operator reconstruction.

**Exit:** a static/direct guest client and an independent operator render the
same selected catalog from named public inputs while preserving disagreement.

### M4 — adapters and scale

- versioned Danbooru/e621/Hydrus adapters with raw-record retention and
  structure-preserving round trips;
- optional IIIF presentation and WARC acquisition-evidence views;
- 10k and synthetic 1m-item index, tag, blacklist, cache-loss and outage
  benchmarks; and
- measured exact/decoded/perceptual duplicate quality across crops, encodes,
  animation and video.

**Exit:** published measurements meet explicit budgets and a second index
implementation rebuilds equivalent coverage from portable public inputs.

### M5 — community and preservation readiness

- named steward, serving operator, plural curators and independent custody;
- moderation/appeal/notice transparency and viewer-controlled Lenses;
- availability audits, repair drills and repeat walk-away reconstruction; and
- lawful operator presentation without a protocol-level canonical moderator.

**Exit:** launch review confirms custody plurality, operational ownership,
rights/safety boundaries, measured costs and an exercised exit path. Devcon
2026-11 is the only dated project milestone; this roadmap assigns no invented
implementation or mainnet deadline.

## Mature findings versus open choices

### Evidence/recommendation mature enough to build tests around

- portable interchange needs a small EFS-neutral fixity/source spine plus
  explicit adapters; no reviewed booru system supplies a general interchange
  standard;
- this fixture's fixity profile uses SHA-256 plus byte length; probabilistic
  similarity never authorizes merge, deletion or tag transfer;
- source observations and rights claims survive deduplication;
- private organization, full-text/range/ranking/recommendation/similarity and
  broad moderation policy remain local or replaceable services;
- SHA-256 BagIt is the recommended minimum conventional walk-away package;
  IIIF and WARC are optional views/evidence adapters; and
- current fixture pressure has not demonstrated a media-specific Core gap.

### Open owner/product choices

1. Supply the media-use-case preference **personal/local-first** or
   **public-gallery-first** as evidence to `V2-F2`; this charter does not itself
   ratify either ordering.
2. Later, separately authorize any public seed corpus and publication action;
   an approved fixture design is not publication permission.

### Open engineering choices, not owner decisions yet

- canonical application Type bodies and profile identifiers;
- derivative encoder/container after cross-environment byte tests;
- exact perceptual algorithm and thresholds after corpus measurements;
- local database, encryption and enhanced-index implementations; and
- deployment venue or public serving operator.

## Core escalation rule

A media request reaches the Core architect only with:

1. exact fixture setup and authored inputs;
2. bounded contract read/write expected by a real consumer;
3. actual trace under the current generic Types, Records, Occurrences, indexes,
   Bindings and Lens;
4. demonstrated failure after local/replaceable alternatives; and
5. a falsifier naming the existing or smaller generic mechanism that would
   close the gap.

Until then, the issue remains application-profile or client work rather than a
Core requirement.
