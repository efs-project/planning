# EFS Media Library — owner decision inbox

**Status:** reference — owner direction recorded; remaining choices are evidence-gated
**Target repos:** planning
**Depends on:** [[Designs/media-library/README]], [[media-infrastructure]], [[booru-app]], [[plex-jellyfin-app]], [[query-and-indexing]]
**Last reconciled:** 2026-08-14 — initial design packet

#status/reference #kind/decision #repo/planning #topic/media-library #topic/gallery #topic/onchain

The one owner queue for the EFS Media Library design set. It separates direct
product direction from mechanism questions the engineering evidence can answer.
Media-specific history lives in [[owner-rulings]]; rulings shared with all EFS
2.0 stay in [[Designs/efsv2/owner-rulings]] rather than being copied here.

## Decide now

Nothing. The owner has already supplied enough direction to write and test the
design packet. Do not turn the engineering questions in the drafts into a
questionnaire.

## Decide after evidence

The first EFS product implementation scope is already owned by
[[Designs/efsv2/owner-decision-inbox#V2-F2 — First product implementation scope]].
Do not create a duplicate media decision. If V2-F2 selects the media lane, the
current evidence-backed sequence to evaluate there is Booru read-only discovery
first, then Plex direct play over the same identity/byte stack.

### MEDIA-E2 — Aggregate onchain query budget and exact Graph boundary

After Stage B plus the media query extension reports the complete automatic
index bundle, selective 2/3/5-tag traces, hot-tag/churn behavior and contract
read costs, accept the measured onchain surface or explicitly narrow it. The
Graph remains the selected public fallback only for queries that fail the
recorded bounded criteria. This is downstream of
[[Designs/efsv2/owner-decision-inbox#V2-E4 — Type and index budget]] and must not
be asked separately before that evidence exists.

### MEDIA-E3 — Application profiles and publication ceremony

After two implementations derive the same media IDs, exact bytes and query
results, accept the minimum Work/Edition/Representation/ExactBlob, vocabulary,
collection and publication profiles. Approval of profiles does not authorize a
public corpus, Realm or serving operation.

## At launch

### MEDIA-L1 — Public Realm, corpus, custody and serving authority

Authorize one specific public seed only after the exact corpus, rights/source
evidence, Realm, serving operator, plural custody, curators, moderation,
notice/appeal process and costs are named. Booru/API accessibility is not
permission to republish media.

### MEDIA-L2 — Adult public lane

If proposed, require a chosen jurisdiction, operator, prohibited-content and
age/presentation policy, prepublication review, notices, appeals, counsel and
staffing. Adult communities are valid product users; decentralization and
Lenses do not remove operator obligations.

## Already settled

- The product set contains shared media infrastructure plus distinct
  Booru/Sankaku-style and Plex/Jellyfin-style applications.
- Public query work leans hard onchain. The Graph is the first public offchain
  escape hatch only after an exact measured falsifier.
- The Graph does not store/serve media, transcode, scan local folders or hold
  private tags/watch state.
- Generic Core stays small. No media-specific Core mechanism is added without
  an exact bounded contract-consumer failure trace and falsifier.
- A public seed is creator/rightsholder/steward authorized or uses an
  operator-reviewed open/public-domain basis; do not scrape an incumbent booru
  or creator platform into permanent public bytes.

## Delegated engineering

- Profile bodies, fixtures and exact application identifiers.
- Chunk/range profile experiments and verified-reader implementations.
- Onchain tag membership, selective intersection and bounded view prototypes.
- Reference subgraph manifest, schema, mappings, deployment metadata and
  Core-verification path.
- Danbooru/e621/Hydrus adapters and the remaining authorized Sankaku
  governance/API/export observations.
- Plex/Jellyfin adapter conformance, local agent API and playback tests.
- UI, database, cache, media toolchain and packaging choices inside the adopted
  boundaries.
