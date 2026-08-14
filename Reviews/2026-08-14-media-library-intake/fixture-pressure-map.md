# Media fixture obligations and Core pressure map

**Status:** application-pressure evidence; not an adopted schema or frozen fixture
**Date:** 2026-08-14

#status/done #kind/review #repo/planning #topic/content #topic/efsv2 #topic/media-library

## Purpose

Define the minimum observations a later exact fixture must make true without
prematurely choosing Type bytes, file formats, a Realm, or an implementation
repository. A future fixture that cannot be expressed with ordinary Types,
Records, Occurrences, declared indexes, Bindings and client verification is a
candidate Core falsifier only after its above-Core alternatives fail.

## Required fixture observations

The smallest fixture contains:

1. **A — original still image:** directly authorized or operator-reviewed exact
   bytes with retained source metadata, attributed rights evidence and residual
   caveats, one versioned IPTC/XMP extraction sidecar, and one verified Locator.
2. **A-prime — derivative:** deterministic resize/re-encode or metadata-sanitized
   output, different exact bytes, explicit derivation method/version and an
   expected perceptual match to A.
3. **V — video representation:** short video crossing at least two selected
   range chunks, with duration/technical observations and one temporal
   annotation.
4. **Second source observation for A:** a different remote ID, filename or URL
   resolves to A's exact bytes. Deduplication preserves both source histories.
5. **Two conflicting public curators:** one shared tag claim and at least one
   incompatible classification, warning or denial. Neither author overwrites
   the other.
6. **One private relationship:** a local-only tag or collection membership that
   causes no public Core write and remains useful offline.
7. **Duplicate evidence:** exact equality for the two A observations plus a
   versioned perceptual candidate relating A-prime to A. Only exact equality may
   drive automatic byte reuse; neither result merges source or work identity.
8. **Provenance and rights evidence:** one explicit rights URI/assertion and one
   `NOASSERTION` or disputed evidence case, with sensitive underlying documents
   excluded from public records.
9. **Verified retrieval failure:** a preferred Locator returns corrupt bytes or
   proof; no unverified byte is displayed, and a second source succeeds.
10. **Walk-away result:** a clean second implementation reconstructs the public
    selected view and verifies A, A-prime and the requested ranges of V without
    the original app database.
11. **Booru-structure coverage:** one namespace-scoped tag alias, one
    directional tag implication, one ordered pool containing fixture media, and
    one region annotation on A. Each is attributed and versioned, and any raw
    imported term remains recoverable.
12. **Selection payload:** one authored, versioned application statement
    selects A as the preferred still representation without making the creative
    work, edition, representation and exact blob the same identity. The
    immutable statement does not itself prove a current/cardinality-one Binding
    fold, basis or CAS result.

An unrelated hard-negative image may exist as a transient conformance vector
for perceptual matching. It need not become a library object.

### Concrete candidate instances

The smallest candidate must exercise the obligations above with these literal
application-level atoms. They are fixture values for review, not frozen EFS
Type names, Principal IDs, Record bytes, or an adopted vocabulary:

- `C-source` authors vocabulary `fixture-vocab/1` raw alias
  `cherry blossoms` -> `subject:cherry-blossom`, linked to the retained NPS
  source observation, and directional implication `subject:cherry-blossom` ->
  `subject:flower`;
- `C-source` separately reports each retained source observation and rights
  statement; NPS, Victoria Stauffenberg, Wikimedia Commons and Runner1928 stay
  quoted source attribution rather than fixture actors or verified Principals;
- `C-source` and `C-skeptic` each assert `subject:cherry-blossom` about
  representation A, which references exact blob A; `C-source` asserts
  `place:national-mall` from that retained
  NPS observation, while
  `C-skeptic` denies it with rationale `pixels alone do not establish location`;
- A carries region `xywh=pixel:1710,690,1220,1030` on its stored 3,264 x 2,448
  encoded-pixel canvas, with no orientation transform;
- V carries normal-play-time interval `t=npt:12.8,21.4`;
- ordered pool `fixture:ingest-derive-stream` has members `[A, A-prime, V]`
  and explicitly makes no shared-work assertion;
- `C-source` authors one exact-duplicate claim linking the two A source
  observations to exact blob A without merging their source, provenance or
  work identity; separate tool evidence marks A/A-prime as a probabilistic
  near-duplicate candidate, while decoded-equality and additional human
  duplicate-judgment rows remain uninstantiated;
- `C-source` selects A at application purpose
  `preferred-still-representation/0`; and
- local-only collection `private:spring-reference` contains A with private tag
  `personal:wallpaper-candidate`; none of those private markers or a digest of
  their local state may occur in the public candidate bytes.

Changing, omitting, or reversing one of these values must fail the later
fixture verifier. A probabilistic match may not transfer tags, merge identity,
authorize deletion, or set threshold policy.

## Identity separations the fixture must expose

```text
FixtureCatalog / ordered pool
  ├─ CreativeWork S           stable still-work lineage
  │    ├─ authored Edition    source-attributed release claim
  │    ├─ Selection claim     preferred Representation A payload
  │    ├─ Representation A    still-image role/format
  │    │    ├─ ExactBlob A    digest + length
  │    │    ├─ SourceObservation 1
  │    │    └─ SourceObservation 2   same blob, different provenance
  │    └─ Representation A-prime     derivative role/format
  │         └─ ExactBlob A-prime     different digest + length
  └─ CreativeWork V           independently authored video work
       └─ Representation V    video role/format
            └─ ExactBlob V    digest + length

Curator 1 ── Tag/Rating/Warning claims ──┐
Curator 2 ── conflicting claims ─────────┼─> work or representation
Local user ─ private tag/collection ─────┘   local only
```

The names are explanatory, not proposed canonical Type names. The fixture does
not collapse unrelated still and video media into one creative-work identity;
an ordered pool may group both without asserting shared authorship or lineage.

## Mapping to current generic EFS concepts

| Fixture need | Current generic concept | Boundary |
|---|---|---|
| stable work/edition/selection lineage | `ObjectGenesis/1`-chartered Object plus ordinary typed revision/relation Records; a Principal-qualified cardinality-one Binding is separately required where current selection is needed | application statement exercises only the candidate payload/purpose, not the current fold, basis or CAS |
| exact A, A-prime and V bytes | `ByteDigest/1`, `ChunkTree/1` and, where useful, `ArtifactClosure/1` | content-profile checks and byte verification are client work |
| mirrors/source URLs | `Locator/1`, availability observations and typed source-observation Records | Locator never defines identity |
| A-prime derived from A | ordinary typed relation between exact content/representation Records | do not misuse `RepresentationBinding/1`, which means exact-byte equivalence |
| creator/curator/source provenance | authored Occurrences over author-neutral Records | identical content may have plural Occurrences |
| tags, ratings and warnings | fixture-owned Topic/tag/classification Types with declared backlinks | rich vocabulary semantics remain above Core |
| public collection/pool | typed membership/ordered-entry Records and backlinks | wide folding/search is client/index work |
| preferred current edition/representation | Principal-qualified Binding at an application purpose/position | the fixture's immutable selection statement only pressure-tests a payload; it does not exercise current-fold, basis or CAS behavior |
| curator point-policy | bounded Lens over Principal-qualified Binding positions | contract Lens is public and bounded |
| private tag/collection | local database or encrypted local/export bundle | public Core cannot hide an indexed relationship |
| exact duplicate | same digest/commitment Record plus plural source observations | exact byte reuse does not collapse provenance |
| perceptual candidate | versioned off-chain method output, optionally published as attributed evidence | never identity or automatic merge authority |
| verified video range | client range machine over `ChunkTree/1` and plural Locators | Stage A interface exists; execution remains Stage B work |

## Exact conditional failure traces

### FT-PRIV — hidden relationship plus complete public enumeration

```text
SETUP: publish encrypted/private collection membership M(A)
READ:  authorized reader asks Core for every member of M
EXPECT: COMPLETE page while unauthorized observers cannot learn M -> A
ACTUAL: opaque ciphertext is legal but has no usable public backlink;
        indexing A or M reveals the relationship
```

**Current disposition:** above-Core local/encrypted index. This becomes a Core
gap only if the product requires authorized complete hidden-backlink reads from
public Core. An existing generic authorized hidden-index primitive with
recovery/rotation would falsify the gap claim; none is current. Stage A privacy
gap G-3 already reserves the relevant lifecycle work.

### FT-SET — wide set-valued Lens

```text
SETUP: C1 and C2 publish incompatible tag or membership sets
READ:  contract calls resolveSet(subject, plan)
EXPECT: deterministic union/difference/conflict result in bounded gas
ACTUAL: Core enumerates the claims, but the candidate Lens resolves bounded
        cardinality-one Binding positions, not arbitrary set policy
```

**Current disposition:** a client/OS folds complete basis-pinned pages. Model a
true point choice, such as preferred representation, as a Binding and the
existing Lens closes it. Only a demonstrated contract consumer for bounded set
union/difference can reopen the Core question.

### FT-PRINCIPAL-COUNT — one endorsement per Principal

```text
SETUP: C1 publishes the same semantic TagClaim in two distinct Envelopes
READ:  query unique claims and endorsement count
EXPECT: one semantic claim; optionally one vote from C1
ACTUAL: unique Record reads deduplicate semantic content, but Occurrence count
        intentionally counts publication events, not distinct Principals
```

**Current disposition:** hydrate and deduplicate Occurrences by Principal in a
replaceable index, or model each curator's current verdict as one CAS-guarded
Binding. A Core gap remains only if a real contract needs an open-set
distinct-Principal aggregate that the closed Lens/Binding shape cannot satisfy.

## Findings that are not Core gaps

- “Original” is attributable testimony and lineage evidence, not intrinsic byte
  metadata or global truth.
- Rights sufficiency, consent, moderation and legal effect are reader/operator
  judgments over claims, not structural admission facts.
- Multi-tag intersections, negative filters, full text, autocomplete, ranking,
  recommendations and perceptual search are replaceable index functions.
- MIME type, dimensions, duration, EXIF/IPTC/XMP/C2PA interpretation and
  transcode policy are media-profile work.
- Exact verified retrieval already belongs to the content commitment + Locator
  + client verification boundary; it does not require a media contract.

## Measurement gates for the later exact fixture

Before the media profile can support an MVP recommendation, measure:

1. byte-for-byte deterministic manifests and profile outputs in at least two
   implementations;
2. Core write/state/read cost for per-tag claims versus bounded assertion sets;
3. 10k and synthetic 1m-item index build, cold browse, intersections, negative
   filters, autocomplete and incremental update;
4. exact, decoded and perceptual duplicate precision/recall on crops, alternate
   encodes, metadata changes, animation and video;
5. video first-frame and arbitrary-range latency with corrupt-primary fallback,
   resume and final partial chunks;
6. local-private operation, encrypted export/import, cache loss and retrieval
   observer disclosure;
7. lossless round trips for at least one booru-style API and one personal-media
   manager; and
8. clean-room export reconstruction and service by a second operator.

The first exact fixture may use tiny deterministic or explicitly licensed media.
No public seed or production contract is implied.
